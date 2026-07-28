// Receipts.jsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ReceiptReviewModal from '../components/ReceiptReviewModal';
import { Camera, Sparkles, ShieldCheck } from 'lucide-react';

export default function Receipts() {
  const { inventory, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Receipt Ingestion & Review
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            2-Stage RapidOCR Receipt Scanning with Interactive User Review before SQLite Commitment.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Scan Receipt Photo
        </button>
      </div>

      {/* Feature Guidance Card */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Interactive 2-Stage Workflow</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Stage 1 extracts items via RapidOCR ONNX in sub-300ms without saving. Review, edit item names, prices, quantities, dates, or expiry before Stage 2 saves to SQLite.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-[#070a13] border border-[#1e293b] hover:border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-xl transition-all"
        >
          Open Ingestion Review
        </button>
      </div>

      {/* Current Active Inventory Table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            SQLite Ingested Cabinet Items ({inventory.length})
          </h2>
        </div>

        <div className="p-6">
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              Your cabinet is currently empty. Click "Scan Receipt Photo" above to populate it.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item, idx) => (
                <div key={item.id || idx} className="bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 flex flex-col gap-2">
                  <div className="font-bold text-sm text-white">{item.ingredient || item.name}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Stock</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Avg Price</span>
                    <span className="text-emerald-400 font-bold">LKR {(item.avg_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-[#1e293b]">
                    <span>Expiry: {item.estimated_expiry_date || 'N/A'}</span>
                    <span className="text-indigo-400">{item.freshness_status || 'Fresh'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReceiptReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
