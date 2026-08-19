import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, TrendingDown, Layers, BookOpen, Bot, Camera, Route, X, Command, Sparkles } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { title: 'Dashboard', desc: 'Overview, 3-Day Plan & Planner', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Financial Analytics', desc: 'Monthly Savings & Spoilage Metrics', path: '/analytics', icon: TrendingDown, category: 'Analytics' },
    { title: 'Pantry Cabinet', desc: 'Manage Stock & Expiry Dates', path: '/pantry', icon: Layers, category: 'Inventory' },
    { title: 'Recipe Library', desc: 'Browse Vector Search Recipes', path: '/recipes', icon: BookOpen, category: 'Recipes' },
    { title: 'AI Voice & Text Assistant', desc: 'Conversational Kitchen Bot', path: '/assistant', icon: Bot, category: 'AI Tools' },
    { title: 'Scan Receipt', desc: 'Dual Engine OCR Receipt Digitizer', path: '/receipts', icon: Camera, category: 'AI Tools' },
    { title: 'Agent Trace Logs', desc: 'LangGraph Execution Telemetry', path: '/trace', icon: Route, category: 'Observability' },
  ];

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-4 shadow-2xl space-y-4 text-slate-100 relative">
        
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <Search className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search (e.g. Analytics, Pantry, Scan)..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching actions found for "{query}".
            </div>
          ) : (
            filtered.map((action, idx) => {
              const Icon = action.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(action.path)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white">{action.title}</div>
                      <div className="text-xs text-slate-400">{action.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                    {action.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500 px-2">
          <span className="flex items-center space-x-1">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span>+ K to toggle palette</span>
          </span>
          <span className="flex items-center space-x-1 text-cyan-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HomeOS AI Engine</span>
          </span>
        </div>

      </div>
    </div>
  );
}
