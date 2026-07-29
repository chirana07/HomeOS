// App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import AssistantPage from './pages/AssistantPage';
import DayDetail from './pages/DayDetail';
import AgentTrace from './pages/AgentTrace';
import Receipts from './pages/Receipts';
import AssistantWidget from './components/AssistantWidget';

export default function App() {
  return (
    <AppProvider>
      <Router>
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

            {/* Page Routing */}
            <div className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
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
        </div>
      </Router>
    </AppProvider>
  );
}
