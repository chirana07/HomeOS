import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Route, RefreshCw, Cpu, FileText } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/receipts', name: 'Receipts', icon: FileText },
    { path: '/trace', name: 'Agent Trace', icon: Route },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-white">HomeOS</div>
            <div className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Economic AI</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-4 py-6">
          <div className="text-[10px] text-slate-500 font-bold px-3 mb-2 tracking-wider uppercase">Workspace</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/20 to-cyan-500/10 text-white border-l-4 border-indigo-500 pl-3' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-400 font-medium">HomeOS Active (V1)</span>
        </div>
      </div>
    </aside>
  );
}
