import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Sun, Moon, ChevronRight } from 'lucide-react';

export default function MealCard({ dayId, dayData }) {
  const navigate = useNavigate();
  const dayName = `Day ${dayId}`;

  return (
    <div 
      onClick={() => navigate(`/day/${dayId}`)}
      className="glass rounded-2xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      {/* Top ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-80" />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-100 uppercase tracking-tight">{dayName}</h3>
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Breakfast */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Breakfast</div>
            <div className="text-xs text-slate-300 font-medium line-clamp-1">{dayData.breakfast.meal_name}</div>
          </div>
        </div>

        {/* Lunch */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <Sun className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Lunch</div>
            <div className="text-xs text-slate-300 font-medium line-clamp-1">{dayData.lunch.meal_name}</div>
          </div>
        </div>

        {/* Dinner */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Dinner</div>
            <div className="text-xs text-slate-300 font-medium line-clamp-1">{dayData.dinner.meal_name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
