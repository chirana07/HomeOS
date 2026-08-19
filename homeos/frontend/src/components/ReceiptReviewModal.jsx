// ReceiptReviewModal.jsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Camera, 
  UploadCloud, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Store, 
  Calendar, 
  ShieldCheck, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function ReceiptReviewModal({ isOpen, onClose }) {
  const { ingestReceiptImage, confirmReceiptSave } = useApp();

  const [step, setStep] = useState('idle'); // 'idle' | 'uploading' | 'review' | 'saving' | 'success'
  const [selectedFile, setSelectedFile] = useState(null);
  const [storeName, setStoreName] = useState('Supermarket');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewItems, setReviewItems] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [progressMsg, setProgressMsg] = useState('Uploading Receipt...');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartOCR = async () => {
    if (!selectedFile) return;
    setStep('uploading');
    setProgressMsg('Extracting OCR Text via RapidOCR...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('store_name', storeName);
    formData.append('purchase_date', purchaseDate);

    const res = await ingestReceiptImage(formData);
    if (res && res.success) {
      setStoreName(res.store_name || 'Supermarket');
      setPurchaseDate(res.purchase_date || purchaseDate);
      
      const formatted = (res.items || []).map((it, idx) => ({
        id: (idx + 1).toString(),
        name: it.name || 'Item',
        quantity: it.quantity ? it.quantity.toString() : '1',
        unit: it.unit || 'pcs',
        price: it.price ? it.price.toString() : '0',
        estimated_expiry_date: it.estimated_expiry_date || 'N/A',
        freshness_status: it.freshness_status || 'Fresh'
      }));

      setReviewItems(formatted);
      setStep('review');
    } else {
      alert(res?.message || 'Failed to extract items from receipt image.');
      setStep('idle');
    }
  };

  const handleItemChange = (id, field, value) => {
    setReviewItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id) => {
    setReviewItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: 'New Item',
      quantity: '1',
      unit: 'pcs',
      price: '100',
      estimated_expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      freshness_status: 'Fresh'
    };
    setReviewItems(prev => [...prev, newItem]);
  };

  const totalReceiptValue = reviewItems.reduce((sum, item) => {
    const val = parseFloat(item.price);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSaveToPantry = async () => {
    if (reviewItems.length === 0) {
      alert('Please add at least one item before saving.');
      return;
    }

    setStep('saving');
    setProgressMsg('Saving reviewed records into SQLite database...');

    const payload = {
      store_name: storeName,
      purchase_date: purchaseDate,
      items: reviewItems.map(it => ({
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        price: parseFloat(it.price) || 0.0,
        estimated_expiry_date: it.estimated_expiry_date
      }))
    };

    const res = await confirmReceiptSave(payload);
    if (res && res.success) {
      setScanResult(res);
      setStep('success');
    } else {
      alert(res?.message || 'Failed to confirm receipt.');
      setStep('review');
    }
  };

  const handleClose = () => {
    setStep('idle');
    setSelectedFile(null);
    setReviewItems([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0b0f19]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Receipt Ingestion & Review</h2>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#1e293b] hover:bg-[#334155] flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'idle' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Upload Supermarket Receipt Image</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Upload a photo of your supermarket receipt. RapidOCR will extract items locally in sub-300ms without committing to SQLite until you review.
                </p>
              </div>

              <div className="w-full max-w-md mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1e293b] hover:border-indigo-500 rounded-2xl cursor-pointer bg-[#070a13] transition-colors p-4">
                  <span className="text-xs text-slate-300 font-semibold">
                    {selectedFile ? selectedFile.name : 'Click to select JPEG/PNG receipt image'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <button
                disabled={!selectedFile}
                onClick={handleStartOCR}
                className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Process OCR Receipt
              </button>
            </div>
          )}

          {(step === 'uploading' || step === 'saving') && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
              <h3 className="text-lg font-bold text-white">{progressMsg}</h3>
              <p className="text-xs text-slate-400">Processing structured parsing layer...</p>
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#070a13] p-4 rounded-2xl border border-[#1e293b] flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#0f172a] px-3 py-2 rounded-xl border border-[#1e293b]">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Store Name"
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full"
                  />
                </div>
                <div className="flex-1 min-w-[150px] flex items-center gap-2 bg-[#0f172a] px-3 py-2 rounded-xl border border-[#1e293b]">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <input 
                    type="text" 
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {reviewItems.map((item) => (
                  <div key={item.id} className="bg-[#070a13] border border-[#1e293b] p-3 rounded-2xl flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none"
                      />
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                        <span>Qty:</span>
                        <input 
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-12 bg-[#0f172a] border border-[#1e293b] rounded px-1 text-center text-white"
                        />
                        <input 
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className="w-14 bg-[#0f172a] border border-[#1e293b] rounded px-1 text-center text-white"
                        />
                        <span>LKR:</span>
                        <input 
                          type="text"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          className="w-16 bg-[#0f172a] border border-[#1e293b] rounded px-1 text-center text-emerald-400 font-bold"
                        />
                        <span>Expiry:</span>
                        <input 
                          type="text"
                          value={item.estimated_expiry_date}
                          onChange={(e) => handleItemChange(item.id, 'estimated_expiry_date', e.target.value)}
                          className="w-24 bg-[#0f172a] border border-[#1e293b] rounded px-1 text-center text-indigo-300"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddItem}
                className="w-full py-2 border border-dashed border-indigo-500/50 hover:border-indigo-400 text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Missing Item Manually
              </button>

              {/* Total Value Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
                <span className="text-xs font-bold text-slate-400">Total Receipt Value:</span>
                <span className="text-lg font-black text-emerald-400">LKR {totalReceiptValue.toLocaleString()}</span>
              </div>

              <button
                onClick={handleSaveToPantry}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30"
              >
                Save to Pantry ({reviewItems.length} Items)
              </button>
            </div>
          )}

          {step === 'success' && scanResult && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Your Pantry is Up to Date</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Saved {scanResult.parsed_items} reviewed items to SQLite database.
                </p>
              </div>

              <div className="w-full bg-[#070a13] border border-[#1e293b] p-4 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-bold block mb-1">TOTAL LOGGED EXPENSE</span>
                <span className="text-2xl font-black text-emerald-400">LKR {scanResult.total_expense?.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-2 w-full text-left text-xs text-slate-300 bg-[#070a13] p-4 rounded-2xl border border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SQLite inventory updated cleanly.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dashboard, Pantry & Assistant Context synced.</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all"
              >
                Confirm & Finish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
