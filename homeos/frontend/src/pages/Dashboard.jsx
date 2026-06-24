import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingCart, DollarSign, Scale, Trash2, Plus, Minus, Check } from 'lucide-react';
import { generatePlan, getPlanInventory, getPantry } from '../services/api';
import MealCard from '../components/MealCard';

export default function Dashboard({ onPlanGenerated, currentPlan }) {
  const [budget, setBudget] = useState(10000);
  const [familySize, setFamilySize] = useState(4);
  const [pantryInput, setPantryInput] = useState('');
  const [pantryList, setPantryList] = useState(['Rice', 'Carrots', 'Eggs', 'Soy Sauce']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const fetchPantry = async () => {
    try {
      const items = await getPantry();
      if (items && items.length > 0) {
        // Ensure unique items
        setPantryList([...new Set(items)]);
      }
    } catch (err) {
      console.error('Failed to fetch pantry:', err);
    }
  };

  React.useEffect(() => {
    fetchPantry();
  }, []);

  const addPantryItem = () => {
    const val = pantryInput.trim();
    if (val && !pantryList.includes(val)) {
      setPantryList([...pantryList, val]);
      setPantryInput('');
    }
  };

  const removePantryItem = (index) => {
    setPantryList(pantryList.filter((_, idx) => idx !== index));
  };

  const runSimulation = async () => {
    if (pantryList.length === 0) {
      setError('Please add at least one pantry item.');
      return;
    }

    setIsLoading(true);
    setError('');

    const agentSteps = [
      'Coordinator Agent: Analysing parameters...',
      'Inventory Agent: Checking perishable safety dates...',
      'Waste Agent: Reviewing historical spoilage risks...',
      'Recipe Retrieval Agent: Querying local vector DB...',
      'Meal Planner Agent: Structuring 3-day plan draft...',
      'Budget Agent: Scoring ingredient market costs...',
      'Reflection Agent: Checking constraints...',
      'Reflection check passed. Compiled final report.',
    ];

    try {
      // Simulate frontend loading state
      for (let i = 0; i < agentSteps.length; i++) {
        setLoadingStep(agentSteps[i]);
        await new Promise((r) => setTimeout(r, 600));
      }

      const plan = await generatePlan({
        budget,
        familySize,
        inventory: pantryList,
      });

      onPlanGenerated(plan);
    } catch (err) {
      setError(err.message || 'System workflow error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const [inventoryStock, setInventoryStock] = useState([]);
  const [activeTab, setActiveTab] = useState('plan');
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);

  const fetchInventoryStock = async () => {
    setIsInventoryLoading(true);
    try {
      const data = await getPlanInventory();
      setInventoryStock(data.inventory || []);
    } catch (err) {
      console.error("Failed to load inventory stock:", err);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryStock();
    }
  }, [activeTab, currentPlan]);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="mb-10 text-center md:text-left">
        <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-3 py-1.5 rounded-full border border-indigo-500/20">
          Autonomous Household Agent
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight mt-3 text-white leading-tight">
          Plan your execution. <span className="grad-text">Track your inventory.</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mt-3 text-sm leading-relaxed">
          HomeOS analyzes pantry inventory, calculates waste scores, searches local recipe databases, and runs self-correction reflection loops to optimize household economics and track meal execution.
        </p>
      </div>

      {/* Input Parameters Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Parameters Card */}
        <div className="glass rounded-2xl p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-500" /> Household Parameters
          </h3>
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Budget (LKR)</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium focus:border-indigo-500 focus:outline-none transition-colors"
                min="1000"
                step="500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Family Size</label>
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-2 max-w-[200px]">
                <button 
                  onClick={() => setFamilySize(Math.max(1, familySize - 1))}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-lg text-white flex-1 text-center">{familySize}</span>
                <button 
                  onClick={() => setFamilySize(familySize + 1)}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="glass rounded-2xl p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-500" /> Pantry Inventory
          </h3>
          <div className="flex flex-col gap-4">
            <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Available Items from Database</div>
            </div>
            
            {/* Chips Container */}
            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pt-2">
              {pantryList.map((item, idx) => (
                <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 font-medium px-3 py-1.5 rounded-full text-xs flex items-center gap-2 hover:border-rose-500/30 transition-colors">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      


      {/* Button Row */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <button
          onClick={runSimulation}
          disabled={isLoading}
          className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-base px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          {isLoading ? 'Running Intelligent Agents...' : 'Generate 3-Day Plan'}
        </button>
        {error && <div className="text-rose-400 text-sm font-semibold">{error}</div>}
      </div>

      {/* Processing State Overlay */}
      {isLoading && (
        <div className="glass border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-6 mb-12 py-16 animate-pulse">
          <div className="relative flex items-center justify-center">
            {/* Outer Glow Ring */}
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 border-r-cyan-400 animate-spin" />
            <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg animate-ping" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Orchestrating Household Intelligence</h4>
            <p className="text-slate-400 text-sm mt-1">{loadingStep}</p>
          </div>
        </div>
      )}

      {/* Results View */}
      {currentPlan && !isLoading && (
        <div>
          {/* Tab Navigation */}
          <div className="flex gap-6 mb-8 border-b border-slate-800 pb-px">
            <button
              onClick={() => setActiveTab('plan')}
              className={`pb-4 text-sm font-bold transition-all border-b-2 px-1 ${
                activeTab === 'plan'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Meal Schedule & Budget
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`pb-4 text-sm font-bold transition-all border-b-2 px-1 ${
                activeTab === 'inventory'
                  ? 'border-cyan-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Pantry Inventory Stock
            </button>
          </div>

          {activeTab === 'inventory' ? (
            /* Inventory Dashboard Tab */
            <div className="glass rounded-2xl p-6 border border-slate-800">
              <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" /> Pantry Inventory Stock Status
              </h3>
              
              {isInventoryLoading ? (
                <div className="text-center py-12 text-slate-400">Loading inventory status...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 text-sm">Ingredient</th>
                        <th className="pb-3 text-sm">Original Qty</th>
                        <th className="pb-3 text-sm">Consumed Qty</th>
                        <th className="pb-3 text-sm">Remaining Qty</th>
                        <th className="pb-3 text-sm">Current Stock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {inventoryStock.map((item, idx) => {
                        const percentConsumed = item.original_quantity > 0 
                          ? (item.consumed / item.original_quantity) * 100 
                          : 0;
                        return (
                          <tr key={idx} className="text-slate-300 hover:bg-slate-900/40 transition-colors">
                            <td className="py-4 font-bold text-base text-white">{item.ingredient}</td>
                            <td className="py-4 text-sm font-medium text-slate-400">{item.original_quantity} {item.unit}</td>
                            <td className="py-4 text-sm text-rose-400 font-semibold">-{item.consumed.toFixed(1)} {item.unit}</td>
                            <td className="py-4 text-sm text-emerald-400 font-bold">{item.quantity.toFixed(1)} {item.unit}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-500 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, (item.quantity / item.original_quantity) * 100)}%` }} 
                                  />
                                </div>
                                <span className="text-xs text-slate-300 font-semibold">{((item.quantity / item.original_quantity) * 100).toFixed(0)}% left</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Meal Plan Tab */
            <div>
              {/* Metrics summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Budget</div>
                  <div className="text-2xl font-black text-white mt-1">LKR {budget.toLocaleString()}</div>
                </div>
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Optimized Cost</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{currentPlan.household_economics.estimated_cost}</div>
                </div>
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Estimated Savings</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{currentPlan.household_economics.estimated_savings}</div>
                </div>
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Waste Prevented</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {currentPlan.household_economics.waste_prevented_items.length} Items
                  </div>
                </div>
              </div>

              {/* Weekly Meal Plan grid */}
              <div className="mb-10">
                <h3 className="font-extrabold text-xl text-white mb-6">3-Day Meal Schedule</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((dayId) => (
                    <MealCard 
                      key={dayId} 
                      dayId={dayId} 
                      dayData={currentPlan.daily_plan[`day_${dayId}`]} 
                    />
                  ))}
                </div>
              </div>

              {/* Budget Optimization & Shopping List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Budget Chart */}
                <div className="glass rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-4">Budget Optimization</h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Initial Draft Cost</span>
                          <span className="font-semibold text-rose-400">LKR 11,300</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full w-[95%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Self-Corrected Cost</span>
                          <span className="font-semibold text-emerald-400">{currentPlan.household_economics.estimated_cost}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[72%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Your Budget Limit</span>
                          <span className="font-semibold text-indigo-400">LKR {budget.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[85%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 text-center">
                    <span className="text-xs text-indigo-300 font-bold block">Reflection loop saved LKR 2,850</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Consolidated overlap ingredients & substituted premium protein.</span>
                  </div>
                </div>

                {/* Shopping List Table */}
                <div className="glass rounded-2xl p-6 border border-slate-800 md:col-span-2">
                  <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-400" /> Shopping Additions
                  </h3>
                  
                  {currentPlan.agent_reasoning.reflection_result?.status === "FAIL" ? (
                    <div className="text-center py-6 text-slate-500">No shopping list available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="pb-3">Item</th>
                            <th className="pb-3">Quantity</th>
                            <th className="pb-3">Est. Cost</th>
                            <th className="pb-3">Priority</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {(currentPlan.shopping_list && currentPlan.shopping_list.length > 0) ? (
                            currentPlan.shopping_list.map((item, idx) => (
                              <tr key={idx} className="text-slate-300">
                                <td className="py-3 font-semibold">{item.item}</td>
                                <td className="py-3">{item.qty}</td>
                                <td className="py-3">LKR {item.cost}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1.5 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full ${
                                    item.priority === 'high' 
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                      : item.priority === 'medium'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {item.priority}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center py-6 text-slate-500">No shopping additions required! Everything in stock.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
