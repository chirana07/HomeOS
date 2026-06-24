import React, { useState } from 'react';
import { FileText, Calendar, Store, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addReceipt } from '../services/api';

export default function ReceiptInput({ onReceiptAdded }) {
  const [rawText, setRawText] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeName, setStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!rawText.trim() || !storeName.trim() || !purchaseDate) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setWarnings([]);
    setSuccess('');

    try {
      const result = await addReceipt({
        raw_text: rawText,
        purchase_date: purchaseDate,
        store_name: storeName
      });
      
      setSuccess(`Successfully added ${result.parsed_items} items to pantry. Spent LKR ${result.total_expense}.`);
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
      
      setRawText('');
      setStoreName('');
      
      if (onReceiptAdded) {
        onReceiptAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed to process receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border border-slate-800">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-emerald-500" /> Add Receipt to Pantry
      </h3>
      
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Store Name</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Keells Super"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Purchase Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input 
                type="date" 
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Receipt Details</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="fish 500g - 1200&#10;spinach 1 bunch - 180"
            rows={5}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none transition-colors resize-y"
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Add Receipt to Pantry'}
        </button>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1 font-semibold">
              <AlertCircle className="w-4 h-4" />
              Warnings
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
