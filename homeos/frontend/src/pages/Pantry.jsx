// Pantry.jsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Layers, 
  Calendar, 
  Scale, 
  Info, 
  Camera, 
  X, 
  Tag, 
  Clock, 
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import ReceiptReviewModal from '../components/ReceiptReviewModal';

export default function Pantry() {
  const { inventory, isLoading, refreshData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const categories = ['All', 'Vegetables', 'Fruits', 'Proteins', 'Dairy', 'Grains', 'Household', 'Pantry Essentials'];

  const getItemName = (item) => item.ingredient || item.name || 'Item';

  const getItemStock = (item) => {
    return typeof item.quantity === 'number' 
      ? item.quantity 
      : (typeof item.current_stock === 'number' ? item.current_stock : parseFloat(item.quantity || '0'));
  };

  const getCategoryForItem = (item) => {
    if (item.category) return item.category;
    const name = getItemName(item).toLowerCase();
    if (name.includes('carrot') || name.includes('onion') || name.includes('garlic') || name.includes('tomato') || name.includes('spinach') || name.includes('potato')) return 'Vegetables';
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('berry')) return 'Fruits';
    if (name.includes('egg') || name.includes('chicken') || name.includes('fish') || name.includes('pork') || name.includes('beef')) return 'Proteins';
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter')) return 'Dairy';
    if (name.includes('rice') || name.includes('bread') || name.includes('flour') || name.includes('oat')) return 'Grains';
    if (name.includes('toilet paper') || name.includes('paper towel') || name.includes('soap') || name.includes('foil') || name.includes('bag')) return 'Household';
    return 'Pantry Essentials';
  };

  const filteredInventory = inventory.filter(item => {
    const itemName = getItemName(item).toLowerCase();
    const itemCategory = getCategoryForItem(item).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !query || itemName.includes(query) || itemCategory.includes(query);
    const matchesCategory = selectedCategory === 'All' || itemCategory === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getExpiryBadge = (item) => {
    const status = item.freshness_status;
    if (status === 'Non-Perishable') {
      return { label: '⚪ Non-Perish', color: 'text-slate-400 border-slate-700 bg-slate-800/30' };
    }
    if (status === 'Fresh') {
      return { label: `🟢 Fresh (${item.days_remaining ?? 7}d left)`, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    }
    if (status === 'Expires Soon') {
      return { label: `🟡 Expires Soon (${item.days_remaining ?? 2}d left)`, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    }
    if (status === 'Expired') {
      return { label: '🔴 Expired', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };
    }
    return { label: `🟢 Fresh (${item.days_remaining ?? 7}d left)`, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Cabinet & Inventory Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Live SQLite Inventory Records & USDA Freshness Status</p>
        </div>

        <button
          onClick={() => setIsReceiptModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          Scan Receipt
        </button>
      </div>

      {/* Intelligence Banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-indigo-400">Pantry Intelligence Active</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            {inventory.length > 0
              ? `SQLite currently tracks ${inventory.length} active ingredients in your cabinet.`
              : "Your cabinet is currently empty. Scan a receipt to log items into SQLite!"}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-2.5 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, categories, aliases..."
            className="bg-transparent text-white text-xs focus:outline-none w-full"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading inventory from SQLite...</span>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-[#1e293b] rounded-3xl bg-[#0f172a]/50">
          <Layers className="w-10 h-10 text-slate-600" />
          <span className="text-xs text-slate-400">No matching ingredients found in SQLite cabinet.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item, idx) => {
            const name = getItemName(item);
            const stock = getItemStock(item);
            const badge = getExpiryBadge(item);
            const category = getCategoryForItem(item);

            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedItemForModal(item)}
                className="bg-[#0f172a] border border-[#1e293b] hover:border-indigo-500/50 p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {name}
                    </h3>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{category}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-semibold">
                    {stock.toFixed(0)} {item.unit || 'pcs'}
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1e293b]/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Avg Price: LKR {item.avg_price ? item.avg_price.toLocaleString() : '0'}</span>
                  <span>Est: {item.estimated_expiry_date || 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Details Bottom Sheet / Modal */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <h3 className="text-xl font-bold text-white">{getItemName(selectedItemForModal)}</h3>
              <button 
                onClick={() => setSelectedItemForModal(null)}
                className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 hover:bg-[#334155]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Category:</span>
                <span className="text-white font-bold">{getCategoryForItem(selectedItemForModal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Stock Level:</span>
                <span className="text-white font-bold">{getItemStock(selectedItemForModal)} {selectedItemForModal.unit || 'pcs'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Freshness Status:</span>
                <span className="text-emerald-400 font-bold">{getExpiryBadge(selectedItemForModal).label}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Purchase Date:</span>
                <span className="text-white font-bold">{selectedItemForModal.purchase_date || 'Today'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Estimated Expiry:</span>
                <span className="text-indigo-400 font-bold">{selectedItemForModal.estimated_expiry_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Expected Shelf Life:</span>
                <span className="text-white font-bold">
                  {selectedItemForModal.shelf_life_days === -1 ? 'Non-Perishable' : `${selectedItemForModal.shelf_life_days || 7} days`}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400 font-semibold">Average Price:</span>
                <span className="text-emerald-400 font-bold">LKR {selectedItemForModal.avg_price ? selectedItemForModal.avg_price.toLocaleString() : '0'}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedItemForModal(null)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Receipt Review Modal Launcher */}
      <ReceiptReviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}
