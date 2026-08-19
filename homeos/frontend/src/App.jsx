// App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import AssistantPage from './pages/AssistantPage';
import DayDetail from './pages/DayDetail';
import AgentTrace from './pages/AgentTrace';
import Receipts from './pages/Receipts';
import Login from './pages/Login';
import CommandPalette from './components/CommandPalette';
import AssistantWidget from './components/AssistantWidget';
import { Search, Command } from 'lucide-react';

function AppContent() {
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <div className="flex bg-[#0b0f19] text-slate-100 min-h-screen">
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#0f172a',
                    color: '#fff',
                    border: '1px solid #1e293b',
                  },
                }}
              />
              {/* Sidebar Nav */}
              <Sidebar />

              {/* Content Panel */}
              <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070a13]">
                {/* Top Decorative gradient bar */}
                <header className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shrink-0" />

                {/* Top Header Command Trigger Bar */}
                <div className="px-6 py-2.5 bg-[#090b14]/80 border-b border-[#1e293b] flex items-center justify-between">
                  <button
                    onClick={() => setIsCommandOpen(true)}
                    className="flex items-center space-x-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-400 transition-all w-72"
                  >
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Search or Command (Cmd + K)...</span>
                  </button>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>HomeOS Swarm Engine v1.0</span>
                  </div>
                </div>

                {/* Page Routing */}
                <div className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/pantry" element={<Pantry />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/assistant" element={<AssistantPage />} />
                    <Route path="/day/:id" element={<DayDetail />} />
                    <Route path="/trace" element={<AgentTrace />} />
                    <Route path="/receipts" element={<Receipts />} />
                  </Routes>
                </div>
              </main>
              
              {/* Global Assistant Floating Widget */}
              <AssistantWidget />

              {/* Global Command Palette */}
              <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
