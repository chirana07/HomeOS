// Dashboard.jsx - Modernized Premium UX
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  DollarSign, 
  Plus, 
  Minus, 
  Check, 
  Play, 
  Pause, 
  Bot, 
  ArrowRight, 
  ShieldAlert, 
  RefreshCw, 
  Camera, 
  Leaf, 
  Users,
  Calendar,
  Sliders,
  ShoppingBag,
  TrendingDown,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Layers,
  Recycle,
  Tag,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import ReceiptReviewModal from '../components/ReceiptReviewModal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    inventory, 
    currentPlan, 
    isJudgeMode, 
    setJudgeMode, 
    isOffline, 
    isLoading, 
    error, 
    refreshData, 
    isThinking, 
    generateNewPlan,
    isReceiptModalOpen,
    setIsReceiptModalOpen
  } = useApp();

  const [greeting, setGreeting] = useState('');
  const [greetingSub, setGreetingSub] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showBriefSummary, setShowBriefSummary] = useState(false);
  const [isPlannerExpanded, setIsPlannerExpanded] = useState(false);

  // Household Planner State
  const [budget, setBudget] = useState(10000);
  const [familySize, setFamilySize] = useState(4);

  // Set greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) {
      setGreeting('Good morning ☀️');
    } else if (hours >= 12 && hours < 17) {
      setGreeting('Welcome back 🥗');
    } else {
      setGreeting('Good evening 🌙');
    }
  }, []);

  // Update contextual subtext
  useEffect(() => {
    const stockCount = inventory.length;
    if (currentPlan?.daily_plan?.day_1?.dinner?.meal_name) {
      setGreetingSub(`Today's recommendation is ${currentPlan.daily_plan.day_1.dinner.meal_name} to optimize pantry usage and minimize waste.`);
    } else if (stockCount > 0) {
      setGreetingSub(`You have ${stockCount} ingredients in your cabinet ready for meal preparation.`);
    } else {
      setGreetingSub("Your pantry is ready for inventory update. Scan a receipt to get started!");
    }
  }, [currentPlan, inventory]);

  const playAudioBriefing = () => {
    if ('speechSynthesis' in window) {
      if (isAudioPlaying) {
        window.speechSynthesis.cancel();
        setIsAudioPlaying(false);
      } else {
        setIsAudioPlaying(true);
        const dinnerName = currentPlan?.daily_plan?.day_1?.dinner?.meal_name || "a customized meal";
        const savings = currentPlan?.household_economics?.estimated_savings || 2850;
        const text = `Welcome back. ${greeting}. Here is your HomeOS briefing: you have ${inventory.length} ingredients in stock. Estimated monthly savings is ${savings} rupees. Today's recommendation is ${dinnerName}.`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsAudioPlaying(false);
        utterance.onerror = () => setIsAudioPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Speech synthesis is not supported on this browser.");
    }
  };

  const handleStepperChange = (delta) => {
    setFamilySize(prev => Math.min(10, Math.max(1, prev + delta)));
  };

  const freshCount = inventory.filter(i => i.freshness_status === 'Fresh').length;
  const expiresSoonCount = inventory.filter(i => i.freshness_status === 'Expires Soon').length;
  const expiredCount = inventory.filter(i => i.freshness_status === 'Expired').length;
  const nonPerishableCount = inventory.filter(i => i.freshness_status === 'Non-Perishable').length;
  const totalSavings = currentPlan?.household_economics?.estimated_savings || 2850;
  const estimatedDailyBudget = Math.round(budget / 30);

  // Budget Optimization Calculations
  const budgetLimit = currentPlan?.household_economics?.monthly_budget || budget;
  const optimizedCost = currentPlan?.estimated_cost || 3450;
  const initialDraftCost = currentPlan?.household_economics?.initial_draft_cost || Math.round(optimizedCost * 1.35);

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    if (p === 'medium') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto flex flex-col gap-8 bg-[#090b14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation & Brand Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
        <div>
          <button 
            onClick={() => setJudgeMode(!isJudgeMode)}
            className="text-2xl font-black tracking-tight text-white hover:text-indigo-400 transition-colors flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <span>Home<span className="text-indigo-500">OS</span></span>
          </button>
          <p className="text-xs text-slate-400 mt-1">Household AI Operating System</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
              Offline
            </span>
          )}
          <button 
            onClick={refreshData}
            className="p-2.5 rounded-2xl bg-[#151b2e] border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 transition-all hover:bg-[#1d2440]"
            title="Refresh System Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Scan Receipt
          </button>
        </div>
      </div>

      {/* 1. GOOD MORNING HERO CARD (Surface 2 Glass: rgba(29,36,64,0.82) with subtle blur) */}
      <div className="bg-[#1d2440]/80 backdrop-blur-md border border-white/[0.08] rounded-[24px] p-8 shadow-xl relative overflow-hidden flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{greetingSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={playAudioBriefing}
              className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-2xl transition-all flex items-center gap-2"
            >
              {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isAudioPlaying ? 'Mute' : 'Audio Briefing'}
            </button>
            <button
              onClick={() => setShowBriefSummary(!showBriefSummary)}
              className="px-4 py-2.5 bg-[#151b2e] border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 text-xs font-bold rounded-2xl transition-all"
            >
              {showBriefSummary ? 'Hide Brief' : 'View Brief'}
            </button>
          </div>
        </div>

        {showBriefSummary && (
          <div className="p-4 bg-[#090b14] border border-white/[0.08] rounded-2xl text-xs text-slate-300 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Active Cabinet Stock: <strong className="text-white">{inventory.length} items</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Est. Savings: <strong className="text-emerald-400">LKR {totalSavings.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Waste Prevention Score: <strong className="text-white">94% Score</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. TODAY'S AI RECOMMENDATION HERO CARD (Highlighted Surface: #1d2440) */}
      <div className="bg-[#1d2440] border border-[#334155] rounded-[24px] p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-full">
              TODAY'S AI RECOMMENDATION
            </span>
            <span className="text-xs text-slate-400">Optimized for cabinet freshness</span>
          </div>

          <h2 className="text-3xl font-black text-white group-hover:text-indigo-300 transition-colors tracking-tight">
            {currentPlan?.daily_plan?.day_1?.dinner?.meal_name || "Carrot & Egg Stir Fry"}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {currentPlan?.daily_plan?.day_1?.dinner?.reason || "Intelligently selected to consume active cabinet items nearing expected shelf life."}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 bg-[#151b2e] border border-white/[0.08] rounded-xl flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Clock className="w-4 h-4 text-indigo-400" />
              25 mins cook
            </div>
            <div className="px-3 py-1.5 bg-[#151b2e] border border-white/[0.08] rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <UtensilsCrossed className="w-4 h-4" />
              100% Pantry Match
            </div>
            <div className="px-3 py-1.5 bg-[#151b2e] border border-white/[0.08] rounded-xl flex items-center gap-2 text-xs text-amber-400 font-bold">
              <Flame className="w-4 h-4" />
              88/100 Health Score
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => navigate('/day/1')}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <span>Cook Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/day/1')}
            className="w-full sm:w-auto px-8 py-4 bg-[#151b2e] hover:bg-[#1a233d] border border-white/[0.08] text-slate-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <span>View Recipe Steps</span>
          </button>
        </div>
      </div>

      {/* 3. HOUSEHOLD PREFERENCES & AI PLANNER (Collapsible Control Center) */}
      <div className="bg-[#151b2e] border border-white/[0.08] rounded-[24px] p-6 shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Household Preferences & AI Planner</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Settings: <strong className="text-white">{familySize} {familySize === 1 ? 'Person' : 'People'}</strong> • <strong className="text-emerald-400">LKR {budget.toLocaleString()} / mo</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPlannerExpanded(!isPlannerExpanded)}
            className="px-4 py-2 bg-[#1d2440] hover:bg-[#232d4d] border border-white/[0.08] text-indigo-300 text-xs font-bold rounded-2xl transition-all flex items-center gap-2"
          >
            <span>{isPlannerExpanded ? 'Collapse' : 'Configure'}</span>
            {isPlannerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isPlannerExpanded && (
          <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stepper */}
              <div className="bg-[#090b14] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Household Size</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{familySize} {familySize === 1 ? 'Person' : 'People'}</span>
                </div>

                <div className="flex items-center justify-between bg-[#151b2e] border border-white/[0.08] p-2 rounded-xl">
                  <button
                    onClick={() => handleStepperChange(-1)}
                    disabled={familySize <= 1}
                    className="w-9 h-9 rounded-xl bg-[#1d2440] hover:bg-[#232d4d] disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="text-xl font-black text-white">{familySize}</span>

                  <button
                    onClick={() => handleStepperChange(1)}
                    disabled={familySize >= 10}
                    className="w-9 h-9 rounded-xl bg-[#1d2440] hover:bg-[#232d4d] disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">Recipe ingredient quantities scaled by {familySize}x</span>
              </div>

              {/* Slider & Budget */}
              <div className="bg-[#090b14] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Monthly Food Budget</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#151b2e] border border-white/[0.08] px-2.5 py-1 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold">LKR</span>
                    <input
                      type="number"
                      min="5000"
                      max="100000"
                      step="1000"
                      value={budget}
                      onChange={(e) => setBudget(Math.max(5000, Math.min(100000, parseFloat(e.target.value) || 5000)))}
                      className="w-20 bg-transparent text-xs font-black text-emerald-400 focus:outline-none text-right"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="1000"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1d2440] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Est. Daily Budget:</span>
                  <span className="text-emerald-400 font-bold">LKR {estimatedDailyBudget.toLocaleString()} / day</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => generateNewPlan(budget, familySize)}
              disabled={isThinking}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {isThinking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Generate Optimized Plan (LKR {budget.toLocaleString()} • {familySize}P)</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 & 5. BUDGET OPTIMIZATION & SHOPPING STATUS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Budget Optimization (Surface 1: #151b2e) */}
        <div className="lg:col-span-6 bg-[#151b2e] border border-white/[0.08] rounded-[24px] p-6 flex flex-col justify-between gap-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Budget Optimization</h3>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Saved LKR {totalSavings.toLocaleString()}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            HomeOS AI optimized 3-day meal execution by re-using active cabinet ingredients and recommending local substitutions.
          </p>

          {/* Animated Bars */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Initial Draft Cost</span>
                <span className="text-rose-400 font-bold">LKR {initialDraftCost.toLocaleString()}</span>
              </div>
              <div className="w-full bg-[#090b14] h-3 rounded-full overflow-hidden border border-white/[0.08]">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(100, Math.round((initialDraftCost / budgetLimit) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Optimized Plan Cost</span>
                <span className="text-emerald-400 font-bold">LKR {optimizedCost.toLocaleString()}</span>
              </div>
              <div className="w-full bg-[#090b14] h-3 rounded-full overflow-hidden border border-white/[0.08]">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(100, Math.round((optimizedCost / budgetLimit) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Monthly Budget Limit</span>
                <span className="text-indigo-400 font-bold">LKR {budgetLimit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-[#090b14] h-3 rounded-full overflow-hidden border border-white/[0.08]">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out w-full" />
              </div>
            </div>
          </div>

          {/* Metric Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-3 py-1.5 bg-[#090b14] border border-white/[0.08] rounded-xl flex items-center gap-2 text-slate-200">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>🛒 Pantry inventory reused</span>
            </div>
            <div className="px-3 py-1.5 bg-[#090b14] border border-white/[0.08] rounded-xl flex items-center gap-2 text-slate-200">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>💰 Saved LKR {totalSavings.toLocaleString()}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#090b14] border border-white/[0.08] rounded-xl flex items-center gap-2 text-slate-200">
              <Recycle className="w-3.5 h-3.5 text-emerald-400" />
              <span>♻ Food waste reduced</span>
            </div>
            <div className="px-3 py-1.5 bg-[#090b14] border border-white/[0.08] rounded-xl flex items-center gap-2 text-slate-200">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>🍗 Lower-cost substitutions</span>
            </div>
          </div>
        </div>

        {/* Shopping Status (Surface 1: #151b2e) */}
        <div className="lg:col-span-6 bg-[#151b2e] border border-white/[0.08] rounded-[24px] p-6 flex flex-col justify-between gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Shopping Status</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              🛒 {currentPlan?.shopping_summary?.total_attention_count || currentPlan?.shopping_list?.length || 0} items need attention
            </span>
          </div>

          {(!currentPlan?.shopping_summary && (!currentPlan?.shopping_list || currentPlan.shopping_list.length === 0)) ||
           (currentPlan?.shopping_summary && currentPlan.shopping_summary.total_attention_count === 0) ? (
            <div className="p-8 text-center border border-emerald-500/30 rounded-2xl bg-emerald-500/10 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <div>
                <h4 className="text-base font-bold text-white">✅ Pantry Complete</h4>
                <p className="text-xs text-slate-300 mt-1">Everything needed for your household is sufficiently stocked in your cabinet.</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                Estimated Shopping Cost: LKR 0
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-xs">
              {/* Categorized Priority View */}
              {currentPlan?.shopping_summary?.items ? (
                <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                  {/* Critical Section */}
                  {currentPlan.shopping_summary.items.critical?.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                          🔴 Critical — Buy Today ({currentPlan.shopping_summary.items.critical.length})
                        </span>
                        {currentPlan.shopping_summary.items.critical.length > 3 && (
                          <span className="text-[10px] text-red-300 font-semibold bg-red-500/20 px-2 py-0.5 rounded-full">
                            +{currentPlan.shopping_summary.items.critical.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {currentPlan.shopping_summary.items.critical.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="bg-[#090b14]/60 rounded-lg p-2 flex flex-col gap-1 border border-white/[0.05]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white text-xs">{item.name}</span>
                              <span className="font-mono text-emerald-400 text-xs font-bold">LKR {item.cost?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-400">
                              <span>Qty: <strong className="text-slate-200">{item.current_qty}</strong> ({item.remaining_pct}% left)</span>
                              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                                {item.ai_reasoning}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Essential Section */}
                  {currentPlan.shopping_summary.items.essential?.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                          🟠 Essential — Buy This Week ({currentPlan.shopping_summary.items.essential.length})
                        </span>
                        {currentPlan.shopping_summary.items.essential.length > 5 && (
                          <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded-full">
                            +{currentPlan.shopping_summary.items.essential.length - 5} more
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {currentPlan.shopping_summary.items.essential.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="bg-[#090b14]/60 rounded-lg p-2 flex flex-col gap-1 border border-white/[0.05]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white text-xs">{item.name}</span>
                              <span className="font-mono text-emerald-400 text-xs font-bold">LKR {item.cost?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-400">
                              <span>Qty: <strong className="text-slate-200">{item.current_qty}</strong> ({item.remaining_pct}% left)</span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                                {item.ai_reasoning}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Running Low Section */}
                  {currentPlan.shopping_summary.items.running_low?.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-blue-400 flex items-center gap-1.5 text-xs">
                          🟡 Running Low ({currentPlan.shopping_summary.items.running_low.length})
                        </span>
                        {currentPlan.shopping_summary.items.running_low.length > 3 && (
                          <span className="text-[10px] text-blue-300 font-semibold bg-blue-500/20 px-2 py-0.5 rounded-full">
                            +{currentPlan.shopping_summary.items.running_low.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {currentPlan.shopping_summary.items.running_low.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="bg-[#090b14]/60 rounded-lg p-2 flex flex-col gap-0.5 border border-white/[0.05]">
                            <span className="font-bold text-white text-[11px] truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.remaining_pct}% left</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback List View */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Ingredient</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Est. Cost</th>
                        <th className="py-2.5 px-3 text-right">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.08] text-slate-200">
                      {currentPlan.shopping_list.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#090b14]/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{item.item || item.name}</td>
                          <td className="py-2.5 px-3 text-slate-400">{item.qty || item.quantity || '1 unit'}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">LKR {(item.cost || item.price || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getPriorityBadgeClass(item.priority)}`}>
                              {(item.priority || 'Medium').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bottom Summary Bar */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 mt-1">
                <span className="text-xs text-slate-400 font-medium">
                  {currentPlan?.shopping_summary?.well_stocked_count || 24} pantry items sufficiently stocked
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  Est. Shopping Cost: LKR {(currentPlan?.shopping_summary?.estimated_shopping_cost || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. 3-DAY MEAL PLAN (Apple Calendar-Inspired Cards) */}
      {currentPlan?.daily_plan && (
        <div className="bg-[#151b2e] border border-white/[0.08] rounded-[24px] p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">3-Day Meal Execution Plan</h3>
            </div>
            <span className="text-xs text-slate-400">Apple Calendar-inspired timeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['day_1', 'day_2', 'day_3'].map((dayKey, idx) => {
              const dayObj = currentPlan.daily_plan[dayKey];
              if (!dayObj) return null;
              return (
                <div 
                  key={dayKey} 
                  onClick={() => navigate(`/day/${idx + 1}`)}
                  className="bg-[#090b14] border border-white/[0.08] hover:border-indigo-500/50 p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-5 group hover:shadow-xl hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <span className="text-sm font-black text-indigo-400 tracking-wider">DAY {idx + 1}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{dayObj.date || 'Scheduled'}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Dinner</span>
                      <strong className="text-sm text-white font-bold group-hover:text-indigo-300 transition-colors">
                        {dayObj.dinner?.meal_name || "Custom Meal"}
                      </strong>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Lunch</span>
                      <span className="text-xs text-slate-300">
                        {dayObj.lunch?.meal_name || "Leftovers"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Breakfast</span>
                      <span className="text-xs text-slate-300">
                        {dayObj.breakfast?.meal_name || "Standard Breakfast"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-indigo-400 font-bold pt-3 border-t border-white/[0.08]">
                    <span className="text-slate-400 text-[11px] font-normal">Execution Steps</span>
                    <div className="flex items-center gap-1">
                      <span>View Day</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7 & 8. INVENTORY HEALTH & SAVINGS INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inventory Health Overview (Surface 1: #151b2e) */}
        <div className="lg:col-span-6 bg-[#151b2e] border border-white/[0.08] rounded-[24px] p-6 flex flex-col justify-between gap-4 shadow-xl">
          <h3 className="text-base font-bold text-white border-b border-white/[0.08] pb-3">
            Inventory Health Overview
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-[#090b14] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-2xl font-black text-emerald-400">{freshCount}</span>
              <span className="text-xs text-slate-400 font-medium">Fresh Items</span>
            </div>
            <div className="bg-[#090b14] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              <span className="text-2xl font-black text-amber-400">{expiresSoonCount}</span>
              <span className="text-xs text-slate-400 font-medium">Expires Soon</span>
            </div>
            <div className="bg-[#090b14] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
              <span className="text-2xl font-black text-rose-400">{expiredCount}</span>
              <span className="text-xs text-slate-400 font-medium">Expired</span>
            </div>
            <div className="bg-[#090b14] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-400" />
              <span className="text-2xl font-black text-slate-400">{nonPerishableCount}</span>
              <span className="text-xs text-slate-400 font-medium">Non-Perish</span>
            </div>
          </div>
        </div>

        {/* Combined Savings & Waste Insight Card (Surface 1: #151b2e) */}
        <div className="lg:col-span-6 bg-[#151b2e] border border-white/[0.08] rounded-[24px] p-6 flex flex-col justify-between gap-4 shadow-xl">
          <h3 className="text-base font-bold text-white border-b border-white/[0.08] pb-3">
            Economic & Sustainability Insight
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#090b14] p-5 rounded-2xl border border-white/[0.08]">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Estimated Monthly Savings</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                LKR {totalSavings.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Calculated by LangGraph Budget Agent</span>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-4 sm:pt-0 sm:pl-6 text-left w-full sm:w-auto">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Waste Prevention</span>
              <div className="text-2xl font-black text-white mt-1">94% Efficiency</div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Active pantry items utilized</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9. FLOATING COMPACT AI ASSISTANT CARD (Surface 2: #1d2440) */}
      <div className="bg-[#1d2440] border border-[#334155] rounded-[24px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Have questions about your plan?</h4>
            <p className="text-xs text-slate-300 mt-0.5">Ask HomeOS AI Assistant for instant recipe tweaks and ingredient options.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/assistant')}
          className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0"
        >
          <span>Chat with Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Receipt Review Modal */}
      <ReceiptReviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}
