import React, { useState } from 'react';
import { X, Printer, Share2, Copy, CheckSquare, Square, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShoppingListModal({ isOpen, onClose, shoppingList = [], currency = 'LKR' }) {
  const [checkedItems, setCheckedItems] = useState({});

  if (!isOpen) return null;

  const curr = currency === 'USD' ? '$' : 'Rs. ';

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getItemCost = (item) => {
    const val = item.cost ?? item.estimated_cost ?? item.price ?? item.price_per_unit ?? 0;
    return typeof val === 'number' ? val : (parseFloat(val) || 0);
  };

  const getItemQtyUnit = (item) => {
    const qty = item.qty || item.quantity || 1;
    const unit = item.unit || '';
    const qtyStr = String(qty).trim();
    const unitStr = String(unit).trim();
    if (unitStr && qtyStr.toLowerCase().endsWith(unitStr.toLowerCase())) {
      return qtyStr;
    }
    return `${qtyStr} ${unitStr}`.trim();
  };

  const totalEstimatedCost = shoppingList.reduce((acc, item) => acc + getItemCost(item), 0);

  const getFormattedText = () => {
    let text = `🛒 *HomeOS Smart Grocery Shopping List*\n\n`;
    shoppingList.forEach((item, idx) => {
      const status = checkedItems[idx] ? '✅' : '⬜';
      const name = item.item || item.name || item.ingredient || 'Item';
      const cost = getItemCost(item);
      const qtyUnit = getItemQtyUnit(item);
      text += `${status} ${name}: ${qtyUnit} (~${curr}${cost.toLocaleString()})\n`;
    });
    text += `\n💰 *Total Estimated Cost:* ${curr}${totalEstimatedCost.toLocaleString()}`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFormattedText());
    toast.success('Shopping list copied to clipboard!');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getFormattedText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 text-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Commercial Shopping List</h2>
              <p className="text-xs text-slate-400">{shoppingList.length} items required for meal plan execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-2">
          {shoppingList.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Your pantry already contains all required ingredients! No shopping needed.
            </div>
          ) : (
            shoppingList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  checkedItems[idx]
                    ? 'bg-slate-950/60 border-slate-800 opacity-50 line-through'
                    : 'bg-slate-950 border-slate-800/80 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {checkedItems[idx] ? (
                    <CheckSquare className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200">{item.item || item.name || item.ingredient}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs font-medium text-slate-400">
                  <span>{getItemQtyUnit(item)}</span>
                  <span className="font-bold text-cyan-400 font-mono">{curr}{getItemCost(item).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total Price & Action Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-sm font-semibold text-slate-400">Total Estimated Cost</span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">{curr}{totalEstimatedCost.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center space-x-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Copy Text</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center space-x-2 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 transition-all"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Print</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
