import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChefHat, Sparkles } from 'lucide-react';
import { getDayDetail } from '../services/api';
import MealDetailCard from '../components/MealDetailCard';

export default function DayDetail() {
  const { id } = useParams();
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    async function loadDay() {
      if (reloadCounter === 0) {
        setLoading(true);
      }
      setError('');
      try {
        const data = await getDayDetail(id);
        setDayData(data);
      } catch (err) {
        setError(err.message || `Failed to load Day ${id} details.`);
      } finally {
        setLoading(false);
      }
    }
    loadDay();
  }, [id, reloadCounter]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm">Loading Day {id} Details...</p>
      </div>
    );
  }

  if (error || !dayData) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto flex flex-col justify-center items-center text-center">
        <div className="text-rose-400 font-bold mb-4">{error || 'No plan details found.'}</div>
        <Link to="/" className="text-indigo-400 font-semibold flex items-center gap-2 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { meals, household_economics } = dayData;

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto">
      {/* Top Navigation Row */}
      <div className="mb-8">
        <Link to="/" className="text-slate-400 font-semibold flex items-center gap-2 hover:text-slate-200 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800/80">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">Day {id} Detailed Plan</h2>
          <p className="text-slate-400 text-sm mt-1">Autonomous culinary planning optimized for nutritional balance and zero waste.</p>
        </div>
        
        {/* Day Stats Badge */}
        <div className="flex items-center gap-6 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" /> {household_economics.nutrition_score}
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="text-slate-400 text-xs font-semibold">
            Status: <span className="text-emerald-400 font-bold">Approved Plan</span>
          </div>
        </div>
      </div>

      {/* Meals Grid (3 Cards: Breakfast, Lunch, Dinner) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="h-full">
          <MealDetailCard 
            type="breakfast" 
            meal={meals.breakfast} 
            dayId={id} 
            onComplete={() => setReloadCounter(prev => prev + 1)} 
          />
        </div>
        <div className="h-full">
          <MealDetailCard 
            type="lunch" 
            meal={meals.lunch} 
            dayId={id} 
            onComplete={() => setReloadCounter(prev => prev + 1)} 
          />
        </div>
        <div className="h-full">
          <MealDetailCard 
            type="dinner" 
            meal={meals.dinner} 
            dayId={id} 
            onComplete={() => setReloadCounter(prev => prev + 1)} 
          />
        </div>
      </div>

      {/* Quick Preparation Hint */}
      <div className="glass border border-indigo-500/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <ChefHat className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">Chef Recommendation</h4>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            Utilize pre-steamed rice from breakfast to reduce cooking times for lunch and dinner. Conserve carrot peels as vegetable broth bases to further improve the household zero-waste score.
          </p>
        </div>
      </div>
    </div>
  );
}
