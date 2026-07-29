// Sidebar.jsx - Premium Refined Navigation
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, BookOpen, Bot, Camera, Route, Cpu } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const primaryItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/pantry', name: 'Pantry Cabinet', icon: Layers },
    { path: '/recipes', name: 'Recipe Library', icon: BookOpen },
  ];

  const intelligenceItems = [
    { path: '/assistant', name: 'AI Assistant', icon: Bot },
    { path: '/receipts', name: 'Receipt Review', icon: Camera },
    { path: '/trace', name: 'Agent Trace', icon: Route },
  ];

  const renderNavGroup = (title, items) => (
    <div className="mb-4">
      <div className="text-[10px] text-slate-500 font-bold px-3 mb-2 tracking-wider uppercase">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600/25 to-cyan-500/10 text-white font-bold border-l-4 border-indigo-500 pl-3 shadow-md shadow-indigo-500/10' 
                  : 'text-slate-400 hover:bg-[#151b2e] hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 bg-[#090b14] border-r border-[#1e293b] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1e293b]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-lg leading-tight tracking-tight text-white">HomeOS</div>
            <div className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mt-0.5">Household AI OS</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="px-4 py-6">
          {renderNavGroup('Core Modules', primaryItems)}
          {renderNavGroup('Intelligence & Tools', intelligenceItems)}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-[#1e293b]">
        <div className="flex items-center gap-2.5 bg-[#151b2e] border border-white/[0.08] rounded-xl p-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-white font-bold">SQLite Engine Synced</span>
            <span className="text-[10px] text-slate-400">70 Recipes • 40 Pantry Items</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
