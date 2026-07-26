// AppContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  MOCK_PLAN, 
  MOCK_INVENTORY, 
  MOCK_PANTRY_NAMES, 
  MOCK_CONVERSATIONS 
} from '../services/mockData';
import * as api from '../services/api';

interface AppContextType {
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  isJudgeMode: boolean;
  setJudgeMode: (val: boolean) => void;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  currentPlan: any;
  setCurrentPlan: (plan: any) => void;
  inventory: any[];
  setInventory: (inv: any[]) => void;
  pantryList: string[];
  setPantryList: (list: string[]) => void;
  
  // Actions
  refreshData: () => Promise<void>;
  completeMeal: (day: number, mealType: string, isUndo?: boolean) => Promise<boolean>;
  generateNewPlan: (budget: number, familySize: number) => Promise<void>;
  ingestReceipt: (storeName: string, date: string, rawText: string) => Promise<any>;
  
  // Assistant Chat
  chatHistory: Array<{ id: string; sender: 'user' | 'assistant'; text: string; audioUrl?: string }>;
  addChatMessage: (sender: 'user' | 'assistant', text: string, audioUrl?: string) => void;
  
  // Agent Replay Animation
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
  activeReplayStep: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setDemoMode] = useState<boolean>(true);
  const [isJudgeMode, setJudgeMode] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeReplayStep, setActiveReplayStep] = useState<number>(-1);

  // Core Data States
  const [currentPlan, setCurrentPlan] = useState<any>(MOCK_PLAN);
  const [inventory, setInventory] = useState<any[]>(MOCK_INVENTORY);
  const [pantryList, setPantryList] = useState<string[]>(MOCK_PANTRY_NAMES);
  const [chatHistory, setChatHistory] = useState<any[]>(MOCK_CONVERSATIONS);

  // Sync state if demo mode changes
  useEffect(() => {
    if (isDemoMode) {
      setCurrentPlan(MOCK_PLAN);
      setInventory(MOCK_INVENTORY);
      setPantryList(MOCK_PANTRY_NAMES);
      setChatHistory(MOCK_CONVERSATIONS);
    } else {
      refreshData();
    }
  }, [isDemoMode]);

  const refreshData = async () => {
    if (isDemoMode) return;
    try {
      setIsOffline(false);
      const plan = await api.getPlan();
      setCurrentPlan(plan);

      const inv = await api.getInventory();
      setInventory(inv);

      const pnt = await api.getPantry();
      setPantryList(pnt);
    } catch (err) {
      console.log('Failed fetching live data. Running offline cached mode.', err);
      setIsOffline(true);
    }
  };

  const addChatMessage = (sender: 'user' | 'assistant', text: string, audioUrl?: string) => {
    setChatHistory(prev => [
      ...prev,
      { id: Date.now().toString(), sender, text, audioUrl }
    ]);
  };

  // Complete / Undo Meal
  const completeMeal = async (day: number, mealType: string, isUndo = false) => {
    if (isDemoMode) {
      // Simulate inventory logic locally
      const planCopy = JSON.parse(JSON.stringify(currentPlan));
      const dayKey = `day_${day}`;
      if (!planCopy.daily_plan[dayKey] || !planCopy.daily_plan[dayKey][mealType]) return false;

      const meal = planCopy.daily_plan[dayKey][mealType];
      meal.status = isUndo ? 'Pending' : 'Completed';

      // Scaling ingredients by family size
      const familySize = planCopy.household_economics?.family_size || 4;
      const ingredients = meal.ingredients_used || [];
      const updatedInventory = [...inventory];
      const newlyDepleted: any[] = [];

      ingredients.forEach((ingName: string) => {
        const itemIdx = updatedInventory.findIndex(i => i.name.toLowerCase() === ingName.toLowerCase());
        if (itemIdx !== -1) {
          const item = updatedInventory[itemIdx];
          const unitScale = item.unit === 'g' || item.unit === 'ml' ? 100 : 1; // simple unit scalar
          const deduction = unitScale * familySize;
          
          if (isUndo) {
            item.current_stock += deduction;
            if (item.current_stock > item.original_quantity) {
              item.original_quantity = item.current_stock;
            }
          } else {
            item.current_stock = Math.max(0, item.current_stock - deduction);
            // If drops to <= 20% of original, add to shopping list
            if (item.current_stock <= item.original_quantity * 0.2) {
              newlyDepleted.push({
                item: item.name,
                qty: `${unitScale * 2} ${item.unit}`,
                cost: item.avg_price || 150,
                priority: item.current_stock === 0 ? 'high' : 'medium'
              });
            }
          }
        }
      });

      // Update trace
      if (isUndo) {
        // filter trace
        planCopy.agent_reasoning.agent_trace = planCopy.agent_reasoning.agent_trace.filter(
          (t: any) => !t.input.includes(`Meal Completed: Day ${day} ${mealType}`)
        );
      } else {
        const traceEntry = {
          agent: "Inventory Update Agent",
          input: `Meal Completed: Day ${day} ${mealType} (${meal.meal_name})`,
          decision: `Deducted recipe ingredients scaled for family size ${familySize}.`,
          output: `Deducted ingredients from local SQLite db. Remaining stock updated.`
        };
        planCopy.agent_reasoning.agent_trace.push(traceEntry);

        // Update Shopping List
        if (newlyDepleted.length > 0) {
          if (!planCopy.shopping_list) planCopy.shopping_list = [];
          newlyDepleted.forEach(newItem => {
            const exists = planCopy.shopping_list.some((s: any) => s.item.toLowerCase() === newItem.item.toLowerCase());
            if (!exists) {
              planCopy.shopping_list.push(newItem);
            }
          });
        }
      }

      setInventory(updatedInventory);
      setCurrentPlan(planCopy);
      return true;
    } else {
      try {
        if (isUndo) {
          await api.undoMeal(day, mealType);
        } else {
          await api.completeMeal(day, mealType);
        }
        await refreshData();
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    }
  };

  // Generate Plan Simulation
  const generateNewPlan = async (budget: number, familySize: number) => {
    setIsThinking(true);
    setActiveReplayStep(0);

    // Simulate Agent Replay Steps over 3.5 seconds
    const totalSteps = 7;
    for (let i = 0; i < totalSteps; i++) {
      setActiveReplayStep(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (isDemoMode) {
      // Setup reset plan
      const resetPlan = JSON.parse(JSON.stringify(MOCK_PLAN));
      // Reset statuses
      Object.keys(resetPlan.daily_plan).forEach(day => {
        resetPlan.daily_plan[day].breakfast.status = 'Pending';
        resetPlan.daily_plan[day].lunch.status = 'Pending';
        resetPlan.daily_plan[day].dinner.status = 'Pending';
      });
      resetPlan.household_economics.family_size = familySize;
      resetPlan.household_economics.estimated_savings = budget - resetPlan.household_economics.estimated_cost;
      
      setCurrentPlan(resetPlan);
      // Reset inventory mock quantities to full
      const resetInventory = inventory.map(item => ({
        ...item,
        current_stock: item.original_quantity
      }));
      setInventory(resetInventory);
    } else {
      try {
        const plan = await api.generatePlan(budget, familySize, pantryList);
        setCurrentPlan(plan);
        const inv = await api.getInventory();
        setInventory(inv);
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsThinking(false);
    setActiveReplayStep(-1);
  };

  // Receipt Ingestion
  const ingestReceipt = async (storeName: string, date: string, rawText: string) => {
    if (isDemoMode) {
      // Simulate parser logic locally
      // split lines and match
      const lines = rawText.split('\n');
      const parsedItems: any[] = [];
      let totalExpense = 0;

      lines.forEach(line => {
        const match = line.match(/(.+?)\s+(\d+)\s*(\w+)?\s*-\s*(\d+)/i);
        if (match) {
          const name = match[1].trim();
          const qty = parseFloat(match[2]);
          const unit = match[3] || 'pcs';
          const price = parseFloat(match[4]);
          parsedItems.push({ name, qty, unit, price });
          totalExpense += price;
        } else {
          // fallback parser
          const words = line.split(' ');
          if (words.length >= 2) {
            const name = words[0];
            const qty = parseFloat(words[1]) || 1;
            parsedItems.push({ name, qty, unit: 'pcs', price: 150 });
            totalExpense += 150;
          }
        }
      });

      if (parsedItems.length === 0) {
        return { success: false, message: 'I couldn\'t parse any items from this receipt. Try format: "item 2 pcs - 200"' };
      }

      // Update local inventory state
      const updatedInventory = [...inventory];
      parsedItems.forEach(item => {
        const idx = updatedInventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (idx !== -1) {
          updatedInventory[idx].current_stock += item.qty;
          updatedInventory[idx].original_quantity = Math.max(updatedInventory[idx].original_quantity, updatedInventory[idx].current_stock);
          updatedInventory[idx].avg_price = (updatedInventory[idx].avg_price + item.price) / 2;
        } else {
          updatedInventory.push({
            id: Date.now() + Math.random(),
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
            current_stock: item.qty,
            original_quantity: item.qty,
            unit: item.unit,
            expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            avg_price: item.price
          });
        }

        // Add to pantry names
        if (!pantryList.includes(item.name)) {
          setPantryList(prev => [...prev, item.name]);
        }
      });

      setInventory(updatedInventory);
      return {
        success: true,
        parsed_items: parsedItems.length,
        total_expense: totalExpense,
        warnings: []
      };
    } else {
      try {
        const res = await api.addReceipt({
          raw_text: rawText,
          purchase_date: date,
          store_name: storeName
        });
        await refreshData();
        return {
          success: true,
          parsed_items: res.parsed_items,
          total_expense: res.total_expense,
          warnings: res.warnings || []
        };
      } catch (err: any) {
        return { success: false, message: err.message || 'Failed to communicate with receipt ingestion API.' };
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        isJudgeMode,
        setJudgeMode,
        isOffline,
        setIsOffline,
        currentPlan,
        setCurrentPlan,
        inventory,
        setInventory,
        pantryList,
        setPantryList,
        refreshData,
        completeMeal,
        generateNewPlan,
        ingestReceipt,
        chatHistory,
        addChatMessage,
        isThinking,
        setIsThinking,
        activeReplayStep
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
