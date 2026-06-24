import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DayDetail from './pages/DayDetail';
import AgentTrace from './pages/AgentTrace';
import Receipts from './pages/Receipts';

export default function App() {
  const [currentPlan, setCurrentPlan] = useState(null);

  const handlePlanGenerated = (plan) => {
    setCurrentPlan(plan);
  };

  return (
    <Router>
      <div className="flex bg-[#0b0f19] text-slate-100 min-h-screen">
        {/* Sidebar Nav */}
        <Sidebar />

        {/* Content Panel */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070a13]">
          {/* Top Decorative bar */}
          <header className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shrink-0" />

          {/* Page Routing */}
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    onPlanGenerated={handlePlanGenerated} 
                    currentPlan={currentPlan} 
                  />
                } 
              />
              <Route path="/day/:id" element={<DayDetail />} />
              <Route path="/trace" element={<AgentTrace />} />
              <Route path="/receipts" element={<Receipts />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
