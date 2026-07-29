// Recipes.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Utensils, 
  Clock, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  X, 
  ChefHat, 
  Flame, 
  Plus, 
  DollarSign, 
  Layers,
  Share2,
  BookOpen
} from 'lucide-react';
import * as api from '../services/api';
import AddRecipeModal from '../components/AddRecipeModal';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [favorites, setFavorites] = useState({});

  const [stats, setStats] = useState(null);

  const reloadRecipes = async () => {
    try {
      setLoading(true);
      const [data, statsData] = await Promise.all([
        api.getRecipes(),
        api.getRecipeStats()
      ]);
      setRecipes(data.recipes || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    'All',
    'User Recipes',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Sri Lankan',
    'Indian',
    'Chinese',
    'Italian',
    'Quick Meals',
    'Healthy',
    'Available Now',
    'Need Shopping',
  ];

  useEffect(() => {
    reloadRecipes();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRecipes = recipes.filter(r => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      r.recipe_name.toLowerCase().includes(query) || 
      r.cuisine.toLowerCase().includes(query) ||
      r.ingredients.some(i => i.toLowerCase().includes(query)) ||
      r.tags.some(t => t.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'User Recipes') return r.is_user_created;
    if (selectedFilter === 'Available Now') return r.availability_status === 'Available Now';
    if (selectedFilter === 'Need Shopping') return r.availability_status === 'Need Shopping';

    const filterLower = selectedFilter.toLowerCase();
    const cuisineMatch = r.cuisine.toLowerCase() === filterLower;
    const mealMatch = r.meal_type.toLowerCase().includes(filterLower);
    const tagMatch = r.tags.some(t => t.toLowerCase().includes(filterLower));

    return cuisineMatch || mealMatch || tagMatch;
  });

  const recentlyAddedUserRecipes = recipes.filter(r => r.is_user_created);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 text-slate-100">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Recipe Library & Explorer</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pantry-Matched Recipe Catalog & Real-Time AI Vector Memory
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Recipe
          </button>
          <div className="px-4 py-2 bg-[#151b2e] border border-[#1e293b] rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>{recipes.length} Available Recipes</span>
          </div>
        </div>
      </div>

      {/* AI Knowledge Base Live Status Banner (Feature 6) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gradient-to-r from-[#0f172a] via-[#151b2e] to-[#0f172a] p-4 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recipes</span>
          <span className="text-base font-black text-white">{stats?.total_recipes || recipes.length} Recipes</span>
          <span className="text-[10px] text-slate-400">{stats?.homeos_recipes || 71} HomeOS • {stats?.user_recipes || 0} User</span>
        </div>

        <div className="flex flex-col gap-0.5 border-l border-white/[0.08] pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qdrant Vector Index</span>
          <span className="text-base font-black text-indigo-400">{stats?.qdrant_indexed_count || recipes.length} Vectors</span>
          <span className="text-[10px] text-slate-400">Gemini 768-dim</span>
        </div>

        <div className="flex flex-col gap-0.5 border-l border-white/[0.08] pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memory Status</span>
          <span className="text-base font-black text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {stats?.qdrant_status || 'Healthy'}
          </span>
          <span className="text-[10px] text-slate-400">Real-time Upsert</span>
        </div>

        <div className="flex flex-col gap-0.5 border-l border-white/[0.08] pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Contributions</span>
          <span className="text-base font-black text-amber-400">{stats?.user_recipes || 0} Learned</span>
          <span className="text-[10px] text-slate-400">First-Class Citizens</span>
        </div>

        <div className="flex flex-col gap-0.5 border-l border-white/[0.08] pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Indexed</span>
          <span className="text-base font-black text-cyan-400">{stats?.last_updated || 'Just now'}</span>
          <span className="text-[10px] text-slate-400">Zero Server Restart</span>
        </div>
      </div>

      {/* Recently Learned Recipes Shelf (Feature 5) */}
      {recentlyAddedUserRecipes.length > 0 && (
        <div className="bg-[#151b2e]/70 border border-indigo-500/20 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Recently Learned User Recipes ({recentlyAddedUserRecipes.length})
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              Active in AI Memory
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentlyAddedUserRecipes.map(r => (
              <div 
                key={r.id}
                onClick={() => setSelectedRecipe(r)}
                className="bg-[#090b14] hover:bg-[#0f172a] border border-indigo-500/30 p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    🧠 Learned by AI
                  </span>
                  <span className="text-[10px] text-slate-400">Added Just now</span>
                </div>

                <h4 className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors">
                  {r.recipe_name}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/[0.05] pt-2 mt-1">
                  <span>Match: <strong className="text-emerald-400">{r.pantry_match_pct}%</strong></span>
                  <span className="text-emerald-400 font-bold">AI Ready ✓</span>
                  <span className="text-cyan-400 font-bold">Indexed ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar & Filter Chips */}
      <div className="flex flex-col gap-4">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 flex items-center gap-3 shadow-inner">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes by name, cuisine, tags, or pantry ingredients..."
            className="bg-transparent text-white text-xs focus:outline-none w-full placeholder:text-slate-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white text-xs">
              Clear
            </button>
          )}
        </div>

        {/* Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {filters.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading recipe library & calculating pantry matches...</span>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-[#1e293b] rounded-3xl bg-[#0f172a]/50">
          <ChefHat className="w-10 h-10 text-slate-600" />
          <span className="text-xs text-slate-400">No recipes found matching "{searchQuery || selectedFilter}".</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {filteredRecipes.map((r) => {
            const isFav = favorites[r.id];
            const isAvailable = r.availability_status === 'Available Now';

            return (
              <div
                key={r.id}
                className="bg-[#151b2e] border border-white/[0.08] hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10 group"
              >
                <div>
                  {/* Top Row: Cuisine Tag, Origin Badge & Heart Icon */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {r.cuisine} • {r.meal_type}
                      </span>
                      {r.is_user_created ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                          🧠 Learned by AI
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          🏠 HomeOS Recipe
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(r.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {r.recipe_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.recipe_summary}</p>

                  {/* Badges Bar: Match %, Health Score, Time */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      r.pantry_match_pct >= 90
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : r.pantry_match_pct >= 70
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      Match {r.pantry_match_pct}%
                    </div>

                    <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      Health {r.health_score} / 10
                    </div>

                    <div className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.cooking_time}
                    </div>
                  </div>

                  {/* AI Recommendation Transparency Banner */}
                  <div className="mt-4 bg-[#090b14] border border-indigo-500/20 rounded-xl p-3 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                        Recommended because
                      </span>
                      <span className="text-xs text-slate-300 block mt-0.5 leading-snug">
                        {r.ai_recommendation_reason}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="pt-3 border-t border-[#1e293b]/60 flex items-center justify-between">
                  <span className={`text-xs font-bold ${isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isAvailable ? '🟢 Available Now' : `🛒 Need ${r.missing_ingredients.length} item(s)`}
                  </span>

                  <button
                    onClick={() => setSelectedRecipe(r)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto my-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1e293b] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {selectedRecipe.cuisine} • {selectedRecipe.meal_type}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">{selectedRecipe.recipe_name}</h2>
                <p className="text-xs text-slate-400 mt-1">{selectedRecipe.recipe_summary}</p>
              </div>

              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#151b2e] p-3 rounded-2xl border border-white/[0.08] text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pantry Match</span>
                <span className="text-lg font-black text-emerald-400">{selectedRecipe.pantry_match_pct}%</span>
              </div>
              <div className="bg-[#151b2e] p-3 rounded-2xl border border-white/[0.08] text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Health Score</span>
                <span className="text-lg font-black text-orange-400">{selectedRecipe.health_score} / 10</span>
              </div>
              <div className="bg-[#151b2e] p-3 rounded-2xl border border-white/[0.08] text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cook Time</span>
                <span className="text-lg font-black text-indigo-400">{selectedRecipe.cooking_time}</span>
              </div>
            </div>

            {/* AI Recommendation Rationale & Transparency Checklist (Feature 4) */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Why this recipe? (AI Recommendation Transparency)
                </h4>
                {selectedRecipe.is_user_created && (
                  <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                    👤 Custom User Recipe
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200">{selectedRecipe.ai_recommendation_reason}</p>
              
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedRecipe.recommendation_reasons?.map((reason, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                    ✓ {reason}
                  </span>
                ))}
              </div>
            </div>

            {/* Ingredients Checklist */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Required Ingredients & Pantry Availability</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedRecipe.ingredients.map((ing, idx) => {
                  const isMissing = selectedRecipe.missing_ingredients.includes(ing);
                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isMissing
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      <span className="font-semibold">{ing}</span>
                      {isMissing ? (
                        <span className="text-[10px] font-bold text-rose-400 px-2 py-0.5 bg-rose-500/20 rounded">
                          Missing
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/20 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missing Ingredients & Shopping Cost */}
            {selectedRecipe.missing_ingredients.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-400 block">Missing {selectedRecipe.missing_ingredients.length} ingredient(s)</span>
                  <span className="text-slate-300">{selectedRecipe.missing_ingredients.join(', ')}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Est. Cost</span>
                  <span className="text-sm font-black text-amber-400">LKR {selectedRecipe.estimated_shopping_cost}</span>
                </div>
              </div>
            )}

            {/* Cooking Instructions */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Step-by-Step Cooking Instructions</h3>
              <div className="flex flex-col gap-2.5">
                {selectedRecipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-[#151b2e] p-3 rounded-xl border border-white/[0.05]">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-200 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#1e293b] flex items-center gap-3">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Modal */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRecipeCreated={reloadRecipes}
      />
    </div>
  );
}
