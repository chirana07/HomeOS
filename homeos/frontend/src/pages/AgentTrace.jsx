import React, { useState, useEffect } from 'react';
import { Route, HelpCircle } from 'lucide-react';
import { getTrace } from '../services/api';
import AgentNode from '../components/AgentNode';

export default function AgentTrace() {
  const [trace, setTrace] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrace() {
      try {
        const data = await getTrace();
        setTrace(data.trace || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTrace();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Route className="w-8 h-8 text-indigo-500" /> Agent Execution Trace
        </h2>
        <p className="text-slate-400 text-sm mt-1 leading-relaxed">
          Review the step-by-step logic, input variables, and optimization decision paths generated across the autonomous multi-agent LangGraph workflow.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading execution logs...</p>
        </div>
      ) : trace.length === 0 ? (
        <div className="glass border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <HelpCircle className="w-10 h-10 text-slate-600 animate-bounce" />
          <div>
            <h4 className="font-bold text-white text-base">No Trace Logs Available</h4>
            <p className="text-slate-500 text-xs mt-1">Please return to the Dashboard and run "Generate Economic Plan" to execute the LangGraph workflow.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center pb-12">
          {trace.map((node, index) => (
            <AgentNode 
              key={index}
              index={index + 1}
              node={node}
              isLast={index === trace.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
