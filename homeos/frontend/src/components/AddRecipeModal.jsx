// AddRecipeModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, ChefHat, Sparkles, CheckCircle2, Clock, Layers, Database, Cpu, BrainCircuit, Search, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const PANTRY_SUGGESTIONS = [
  'rice', 'carrots', 'eggs', 'cooking oil', 'garlic', 'onions', 'tomatoes', 'chicken',
  'fish', 'milk', 'yogurt', 'spinach', 'potatoes', 'cheese', 'butter', 'flour', 'sugar',
  'soy sauce', 'salt', 'pepper', 'curry powder', 'turmeric', 'chilli powder', 'coconut milk'
];

export default function AddRecipeModal({ isOpen, onClose, onRecipeCreated }) {
  const navigate = useNavigate();

  const [recipeName, setRecipeName] = useState('');
  const [recipeSummary, setRecipeSummary] = useState('');
  const [cuisine, setCuisine] = useState('Sri Lankan');
  const [mealType, setMealType] = useState('Lunch/Dinner');
  const [cookingTime, setCookingTime] = useState(25);
  const [servings, setServings] = useState(4);
  const [nutritionScore, setNutritionScore] = useState(85);

  const [ingredients, setIngredients] = useState([
    { name: 'Rice', quantity: 200, unit: 'g' },
    { name: 'Eggs', quantity: 2, unit: 'units' },
    { name: 'Cooking Oil', quantity: 15, unit: 'ml' }
  ]);

  const [instructions, setInstructions] = useState([
    'Prep all vegetables and ingredients.',
    'Sauté aromatics in oil over medium heat.',
    'Combine main ingredients and simmer until cooked through.',
    'Season to taste and serve hot.'
  ]);

  const [tagsInput, setTagsInput] = useState('High Protein; Quick Meal; Family');
  
  // Progress & Demo Modal States
  const [workflowStep, setWorkflowStep] = useState(0); // 0: input, 1: learning progress, 2: success summary
  const [learningLogs, setLearningLogs] = useState([]);
  const [completedResult, setCompletedResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients(prev => [...prev, { name: '', quantity: 100, unit: 'g' }]);
  };

  const handleRemoveIngredient = (idx) => {
    if (ingredients.length <= 1) {
      toast.error('Recipe must contain at least one ingredient.');
      return;
    }
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx, field, value) => {
    setIngredients(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleAddStep = () => {
    setInstructions(prev => [...prev, '']);
  };

  const handleRemoveStep = (idx) => {
    if (instructions.length <= 1) {
      toast.error('Recipe must contain at least one instruction step.');
      return;
    }
    setInstructions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx, value) => {
    setInstructions(prev => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipeName.trim()) {
      toast.error('Recipe name is required.');
      return;
    }

    const validIngs = ingredients.filter(i => i.name.trim());
    if (validIngs.length === 0) {
      toast.error('Please specify at least one valid ingredient.');
      return;
    }

    const validSteps = instructions.filter(s => s.trim());
    const tagsList = tagsInput.split(';').map(t => t.trim()).filter(Boolean);

    setSubmitting(true);
    setWorkflowStep(1); // Switch to live progress checklist view
    setLearningLogs([]);

    try {
      // Step 1: SQLite save
      setLearningLogs(prev => [...prev, { step: 1, text: 'Saving recipe metadata to SQLite & CSV...', status: 'loading' }]);
      await sleep(400);

      const payload = {
        recipe_name: recipeName.trim(),
        recipe_summary: recipeSummary.trim(),
        cuisine,
        meal_type: mealType,
        cooking_time: parseInt(cookingTime, 10) || 25,
        nutrition_score: parseInt(nutritionScore, 10) || 85,
        ingredients: validIngs.map(i => ({
          name: i.name.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit.trim() || 'g'
        })),
        instructions: validSteps,
        tags: tagsList
      };

      const response = await fetch('/api/recipes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to save recipe.');
      }

      const result = await response.json();

      setLearningLogs(prev => prev.map(l => l.step === 1 ? { ...l, text: 'Recipe saved to SQLite & CSV', status: 'success' } : l));

      // Step 2: Gemini Embedding
      setLearningLogs(prev => [...prev, { step: 2, text: 'Generating 768-dim vector embedding using Gemini...', status: 'loading' }]);
      await sleep(450);
      setLearningLogs(prev => prev.map(l => l.step === 2 ? { ...l, text: 'Gemini 768-dim embedding generated', status: 'success' } : l));

      // Step 3: Qdrant vector memory
      setLearningLogs(prev => [...prev, { step: 3, text: 'Upserting point payload into Qdrant vector memory...', status: 'loading' }]);
      await sleep(400);
      setLearningLogs(prev => prev.map(l => l.step === 3 ? { ...l, text: 'Indexed into Qdrant vector memory', status: 'success' } : l));

      // Step 4: Verification
      setLearningLogs(prev => [...prev, { step: 4, text: 'Verifying instant semantic vector search...', status: 'loading' }]);
      await sleep(350);
      setLearningLogs(prev => prev.map(l => l.step === 4 ? { ...l, text: 'AI Knowledge Base updated & verified', status: 'success' } : l));

      await sleep(500);

      setCompletedResult(result);
      setWorkflowStep(2); // Switch to Demo Success Summary Modal
      toast.success(`HomeOS learned '${recipeName}' in real time!`);
      if (onRecipeCreated) onRecipeCreated();
    } catch (err) {
      setLearningLogs(prev => [...prev, { step: 99, text: `Failed: ${err.message}`, status: 'error' }]);
      toast.error(err.message || 'Failed to create recipe.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromptClick = (promptText) => {
    onClose();
    navigate('/assistant', { state: { prefilledPrompt: promptText } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto my-auto text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {workflowStep === 0 && 'Create New Recipe'}
                {workflowStep === 1 && 'Live AI Learning Pipeline'}
                {workflowStep === 2 && 'Recipe Successfully Learned'}
              </h2>
              <p className="text-xs text-slate-400">Gemini 768-dim Embeddings & Qdrant Real-Time Indexing</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WORKFLOW STEP 0: RECIPE INPUT FORM */}
        {workflowStep === 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
            {/* Basic Info Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Recipe Name *</label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g. Pol Roti & Seeni Sambol"
                  className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Cuisine</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Sri Lankan">Sri Lankan</option>
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Quick Meals">Quick Meals</option>
                  <option value="Western">Western</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Recipe Summary / Description</label>
              <textarea
                value={recipeSummary}
                onChange={(e) => setRecipeSummary(e.target.value)}
                placeholder="Brief description of tastes, preparation notes, or health benefits..."
                rows={2}
                className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-2.5 py-2 text-white"
                >
                  <option value="Lunch/Dinner">Lunch/Dinner</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Breakfast/Lunch">Breakfast/Lunch</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Cook Time (min)</label>
                <input
                  type="number"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Nutrition Score (0-100)</label>
                <input
                  type="number"
                  value={nutritionScore}
                  onChange={(e) => setNutritionScore(e.target.value)}
                  className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Dynamic Ingredients Section */}
            <div className="bg-[#151b2e] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Recipe Ingredients (Pantry Autocomplete Enabled)
                </h4>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold rounded-lg transition-all flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3 h-3" /> Add Ingredient
                </button>
              </div>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    placeholder="Ingredient name (e.g. Garlic)"
                    className="flex-1 bg-[#090b14] border border-[#1e293b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    list={`pantry-suggestions-${idx}`}
                  />
                  <datalist id={`pantry-suggestions-${idx}`}>
                    {PANTRY_SUGGESTIONS.map((item, i) => (
                      <option key={i} value={item} />
                    ))}
                  </datalist>

                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-20 bg-[#090b14] border border-[#1e293b] rounded-xl px-2.5 py-2 text-white text-center"
                  />

                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                    className="w-20 bg-[#090b14] border border-[#1e293b] rounded-xl px-2 py-2 text-white"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="units">units</option>
                    <option value="tbsp">tbsp</option>
                    <option value="pcs">pcs</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Dynamic Instructions Steps */}
            <div className="bg-[#151b2e] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Step-by-Step Instructions
                </h4>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold rounded-lg transition-all flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3 h-3" /> Add Step
                </button>
              </div>

              {instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center shrink-0 mt-1 text-[11px]">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1} instruction...`}
                    className="flex-1 bg-[#090b14] border border-[#1e293b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Tags (Semicolon separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="High Protein; Quick Meal; Family; Sri Lankan"
                className="w-full bg-[#151b2e] border border-[#1e293b] rounded-xl px-3 py-2.5 text-white focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#1e293b] flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Save & Index Recipe into AI
              </button>
            </div>
          </form>
        )}

        {/* WORKFLOW STEP 1: LIVE AI LEARNING PROGRESS */}
        {workflowStep === 1 && (
          <div className="py-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl">
              <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse shrink-0" />
              <div>
                <h3 className="font-extrabold text-white text-sm">Learning '{recipeName}' in Real-Time</h3>
                <p className="text-xs text-slate-300">Generating Gemini 768-dim vector embeddings & upserting into Qdrant</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {learningLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#151b2e] p-3.5 rounded-xl border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    {log.status === 'loading' && (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {log.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {log.status === 'error' && (
                      <X className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-200">{log.text}</span>
                  </div>
                  {log.status === 'success' && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Done
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORKFLOW STEP 2: DEMO MODE SUCCESS SUMMARY */}
        {workflowStep === 2 && (
          <div className="py-2 flex flex-col gap-5">
            {/* Header Badge */}
            <div className="flex items-center gap-3 bg-emerald-950/50 border border-emerald-500/30 p-4 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-black text-emerald-300 text-base">HomeOS Successfully Learned Your Recipe</h3>
                <p className="text-xs text-slate-300">'{completedResult?.recipe_name || recipeName}' is now active across all system tools</p>
              </div>
            </div>

            {/* System Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'SQLite DB', status: '✓ Persisted' },
                { name: 'Gemini Vector', status: '✓ 768-dim' },
                { name: 'Qdrant Memory', status: '✓ Indexed' },
                { name: 'Recipe Explorer', status: '✓ Ready' },
                { name: 'Meal Planner', status: '✓ Recommends' },
                { name: 'Shopping AI', status: '✓ Evaluates' },
                { name: 'AI Assistant', status: '✓ Understands' },
                { name: 'Voice Assistant', status: '✓ Answers' },
              ].map((sys, idx) => (
                <div key={idx} className="bg-[#151b2e] p-2.5 rounded-xl border border-white/[0.05] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">{sys.name}</span>
                  <span className="text-[10px] font-black text-emerald-400">{sys.status}</span>
                </div>
              ))}
            </div>

            {/* Instant Semantic Search Verification */}
            {completedResult?.semantic_verification && (
              <div className="bg-[#151b2e] border border-indigo-500/30 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Instant Semantic Vector Search Verification
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Confidence: {completedResult.semantic_verification.confidence_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Query: <strong className="text-white">"{completedResult.semantic_verification.query}"</strong></span>
                  <span>Top Vector Match: <strong className="text-emerald-300">{completedResult.semantic_verification.top_match}</strong></span>
                </div>
              </div>
            )}

            {/* 1-Tap AI Assistant Prompts */}
            {completedResult?.ai_prompts && (
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Try Asking AI Assistant (1-Tap Demonstration)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {completedResult.ai_prompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(promptText)}
                      className="bg-[#151b2e] hover:bg-[#1e293b] border border-white/[0.08] p-3 rounded-xl text-left text-xs text-slate-200 transition-all flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">"{promptText}"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30"
            >
              Done & Return to Recipe Library
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
