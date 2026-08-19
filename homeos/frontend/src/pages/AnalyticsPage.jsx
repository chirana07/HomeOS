import React, { useState, useEffect } from 'react';
import { TrendingDown, ShieldAlert, DollarSign, PieChart, Sparkles, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { preferences } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load analytics data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const curr = preferences?.currency === 'USD' ? '$' : 'Rs. ';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-cyan-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-semibold text-slate-200">Loading Financial Intelligence...</span>
      </div>
    );
  }

  const { financial_summary, expense_trend, category_spend, spoilage_metrics, nutritional_summary } = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-slate-100 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Economic Intelligence Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Household Financial & Spoilage Analytics
          </h1>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-all shadow-md self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Spent */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Grocery Expense</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {curr}{financial_summary?.avg_monthly_expense?.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">6-Month Rolling Average</p>
          </div>
        </div>

        {/* Estimated Savings */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Savings Achieved</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400">
              {curr}{financial_summary?.estimated_savings?.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-500/80 font-medium mt-1">+{financial_summary?.roi_percentage}% Efficiency vs Baseline</p>
          </div>
        </div>

        {/* Spoilage Risk Value */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Spoilage Value at Risk</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-400">
              {curr}{spoilage_metrics?.value_at_risk}
            </div>
            <p className="text-xs text-amber-500/80 font-medium mt-1">{spoilage_metrics?.items_at_risk} Perishable Items Expiring Soon</p>
          </div>
        </div>

        {/* Waste Prevention Rate */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Waste Prevention Rate</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-cyan-400">
              {spoilage_metrics?.waste_prevention_rate}
            </div>
            <p className="text-xs text-slate-400 mt-1">{spoilage_metrics?.fresh_items} Items Fully Optimized</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Spend Trajectory Chart Bar Representation */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-cyan-400" />
              <span>Monthly Expense Trajectory</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
              6-Month Trend
            </span>
          </div>

          <div className="space-y-4">
            {expense_trend?.map((item, idx) => {
              const maxExp = 12000;
              const pct = Math.min(100, (item.expense / maxExp) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-300">{item.month}</span>
                    <span className="font-mono text-cyan-400 font-bold">{curr}{item.expense.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Spend Breakdown */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              <span>Category Expense Breakdown</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
              Pantry Allocation
            </span>
          </div>

          <div className="space-y-4">
            {category_spend?.map((cat, idx) => {
              const colors = [
                'from-emerald-500 to-teal-600',
                'from-rose-500 to-pink-600',
                'from-blue-500 to-cyan-600',
                'from-amber-500 to-orange-600',
                'from-purple-500 to-indigo-600',
                'from-slate-500 to-slate-600'
              ];
              const totalCat = category_spend.reduce((a, b) => a + b.amount, 0) || 1;
              const pct = Math.round((cat.amount / totalCat) * 100);

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-300">{cat.category} ({pct}%)</span>
                    <span className="font-mono text-slate-200 font-bold">{curr}{cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Nutritional Target Distribution */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2 mb-6">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>Nutritional Balance & Macro Distribution Target</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {nutritional_summary?.map((macro, i) => (
            <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{macro.name}</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-2">
                {macro.value} <span className="text-xs font-normal text-slate-400">{macro.unit}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Target: {macro.target} {macro.unit}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
