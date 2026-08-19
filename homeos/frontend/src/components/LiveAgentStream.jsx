import React from 'react';
import { Cpu, CheckCircle, Loader2, Activity } from 'lucide-react';

export default function LiveAgentStream({ stepData, isStreaming }) {
  if (!isStreaming && !stepData) return null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 shadow-xl shadow-cyan-950/20 space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <span>Autonomous Multi-Agent Swarm</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">LangGraph State Machine Orchestration in Progress</p>
          </div>
        </div>
        <span className="text-xs font-bold font-mono px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
          {stepData?.progress || 0}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-md shadow-cyan-500/50"
          style={{ width: `${stepData?.progress || 0}%` }}
        ></div>
      </div>

      {/* Active Node Step Banner */}
      <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        {stepData?.progress === 100 ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        ) : (
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
            {stepData?.agent || 'Initializing Swarm'}
          </span>
          <p className="text-xs text-slate-300 truncate">
            {stepData?.status || 'Setting state dictionary & parsing constraints...'}
          </p>
        </div>
      </div>
    </div>
  );
}
