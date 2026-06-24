import React from 'react';
import { ArrowDown, CheckCircle2 } from 'lucide-react';

export default function AgentNode({ index, node, isLast }) {
  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      {/* Node Card */}
      <div className="glass rounded-2xl p-6 w-full hover:border-slate-700 transition-all duration-300 relative overflow-hidden">
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/80 to-cyan-400/80" />

        {/* Node Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              {index}
            </div>
            <h4 className="font-bold text-base text-white">{node.agent}</h4>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> SUCCESS
          </span>
        </div>

        {/* Node Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Input */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3">
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Input</div>
            <div className="text-xs text-slate-300 font-medium leading-relaxed">{node.input}</div>
          </div>

          {/* Decision */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 md:col-span-2">
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Decision / Reasoning</div>
            <div className="text-xs text-slate-300 font-medium leading-relaxed">{node.decision}</div>
          </div>
        </div>

        {/* Output */}
        <div className="mt-3 bg-slate-900/40 border border-slate-850 rounded-xl p-3">
          <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Output</div>
          <div className="text-xs text-slate-300 font-medium leading-relaxed">{node.output}</div>
        </div>
      </div>

      {/* Down arrow connector */}
      {!isLast && (
        <div className="my-4 flex flex-col items-center">
          <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-cyan-400" />
          <ArrowDown className="w-4 h-4 text-cyan-400 -mt-1" />
        </div>
      )}
    </div>
  );
}
