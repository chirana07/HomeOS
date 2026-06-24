import React, { useState, useEffect } from 'react';
import ReceiptInput from '../components/ReceiptInput';
import { getInventory } from '../services/api';

export default function Receipts() {
  const [pantryItems, setPantryItems] = useState([]);

  const fetchPantry = async () => {
    try {
      const data = await getInventory();
      setPantryItems(data);
    } catch (err) {
      console.error("Failed to load pantry:", err);
    }
  };

  useEffect(() => {
    fetchPantry();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight mb-2">
          Receipt Ingestion
        </h1>
        <p className="text-slate-400 text-sm">
          Paste your receipt text below to automatically extract items and update your pantry inventory using Groq AI.
        </p>
      </div>

      <ReceiptInput onReceiptAdded={fetchPantry} />

      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
            Updated Pantry State
          </h2>
        </div>
        
        <div className="p-6">
          {pantryItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Your pantry is empty. Add a receipt above to populate it.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pantryItems.map(item => (
                <div key={item.id} className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-700 transition-colors">
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Stock</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-medium">
                      {item.current_stock} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Avg Price</span>
                    <span className="text-slate-300">LKR {(item.avg_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
