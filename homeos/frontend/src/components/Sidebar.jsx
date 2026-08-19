// Sidebar.jsx - Premium Refined Navigation
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, BookOpen, Bot, Camera, Route, Cpu, TrendingDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const primaryItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', name: 'Financial Analytics', icon: TrendingDown },
    { path: '/pantry', name: 'Pantry Cabinet', icon: Layers },
    { path: '/recipes', name: 'Recipe Library', icon: BookOpen },
  ];

  const intelligenceItems = [
    { path: '/assistant', name: 'AI Assistant', icon: Bot },
    { path: '/receipts', name: 'Receipt Review', icon: Camera },
    { path: '/trace', name: 'Agent Trace', icon: Route },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <div className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mt-0.5">SaaS SaaS Platform</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="px-4 py-6">
          {renderNavGroup('Core Modules', primaryItems)}
          {renderNavGroup('Intelligence & Tools', intelligenceItems)}
        </nav>
      </div>

      {/* Footer Status & User Profile */}
      <div className="p-4 border-t border-[#1e293b] space-y-3">
        <div className="flex items-center justify-between bg-[#151b2e] border border-white/[0.08] rounded-xl p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-white font-bold truncate">{user?.full_name || 'Commercial Admin'}</span>
              <span className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@homeos.ai'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
