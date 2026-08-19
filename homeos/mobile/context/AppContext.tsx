// AppContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from '../services/api';

interface AppContextType {
  isJudgeMode: boolean;
  setJudgeMode: (val: boolean) => void;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  error: string | null;
  setError: (val: string | null) => void;
  
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
  ingestReceiptImage: (formData: FormData) => Promise<any>;
  confirmReceiptSave: (payload: api.ConfirmReceiptPayload) => Promise<any>;
  
  // Assistant Chat
  chatHistory: Array<{ id: string; sender: 'user' | 'assistant'; text: string; audioUrl?: string }>;
  addChatMessage: (sender: 'user' | 'assistant', text: string, audioUrl?: string) => void;
  sendChatMessage: (text: string) => Promise<void>;
  
  // Agent Replay Animation
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
  activeReplayStep: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isJudgeMode, setJudgeMode] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeReplayStep, setActiveReplayStep] = useState<number>(-1);

  // Core Data States (Initialized empty, populated strictly from backend APIs)
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [pantryList, setPantryList] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; audioUrl?: string }>>([
    { id: '1', sender: 'assistant', text: "Hello! I'm HomeOS Assistant. How can I help with your household today?" }
  ]);

  // Initial load on mount with Startup Health Check
  useEffect(() => {
    const runStartupHealthCheck = async () => {
      console.log('\n====================================================');
      console.log('[HomeOS Mobile Startup]');
      console.log('Initiating backend health check...');
      try {
        const health = await api.checkHealth();
        if (health.status === 'healthy' || health.status === 'connected') {
          console.log('✓ FastAPI Backend: Connected');
          console.log('✓ Target API URL:', api.BASE_URL);
        } else {
          console.log('⚠️ Backend Health Warning:', health.message || health.status);
        }
      } catch (err: any) {
        console.log('❌ Backend Connection Failed at Startup');
        console.log('Target API URL:', api.BASE_URL);
        console.log('Reason:', err.message);
      }
      console.log('====================================================\n');
      refreshData();
    };

    runStartupHealthCheck();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setIsOffline(false);
      
      const [planRes, invRes, pantryRes] = await Promise.allSettled([
        api.getPlan(),
        api.getInventory(),
        api.getPantry()
      ]);

      if (planRes.status === 'fulfilled') {
        setCurrentPlan(planRes.value);
      } else {
        console.log('No plan loaded or endpoint error:', planRes.reason);
      }

      if (invRes.status === 'fulfilled') {
        setInventory(Array.isArray(invRes.value) ? invRes.value : invRes.value.inventory || []);
      }

      if (pantryRes.status === 'fulfilled') {
        setPantryList(Array.isArray(pantryRes.value) ? pantryRes.value : []);
      }

    } catch (err: any) {
      console.error('Failed fetching live data from backend.', err);
      setIsOffline(true);
      setError(err?.message || 'Failed to communicate with HomeOS service.');
    } finally {
      setIsLoading(false);
    }
  };

  const addChatMessage = (sender: 'user' | 'assistant', text: string, audioUrl?: string) => {
    setChatHistory(prev => [
      ...prev,
      { id: Date.now().toString(), sender, text, audioUrl }
    ]);
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;
    addChatMessage('user', text);
    setIsThinking(true);
    
    try {
      const res = await api.chatWithAssistantText(text);
      const reply = res.response || res.transcript || "I've processed your request.";
      addChatMessage('assistant', reply);
      
      // If receipt tool call was triggered by backend, refresh data automatically
      await refreshData();
    } catch (err: any) {
      addChatMessage('assistant', "I'm sorry, I'm having trouble connecting to my backend right now.");
    } finally {
      setIsThinking(false);
    }
  };

  // Complete / Undo Meal via Backend API
  const completeMeal = async (day: number, mealType: string, isUndo = false) => {
    try {
      if (isUndo) {
        await api.undoMeal(day, mealType);
      } else {
        await api.completeMeal(day, mealType);
      }
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Error recording meal completion:', err);
      setError(err?.message || 'Failed to record meal completion.');
      return false;
    }
  };

  // Generate Plan via LangGraph Workflow API
  const generateNewPlan = async (budget: number, familySize: number) => {
    setIsThinking(true);
    setActiveReplayStep(0);

    try {
      const plan = await api.generatePlan(budget, familySize, pantryList);
      setCurrentPlan(plan);
      await refreshData();
    } catch (err: any) {
      console.error('Error generating new plan:', err);
      setError(err?.message || 'Plan generation failed.');
    } finally {
      setIsThinking(false);
      setActiveReplayStep(-1);
    }
  };

  // Receipt Text Ingestion API
  const ingestReceipt = async (storeName: string, date: string, rawText: string) => {
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
      return { success: false, message: err.message || 'Failed to ingest receipt text.' };
    }
  };

  // Receipt Image Ingestion API (Multimodal OCR - Stage 1 Parsing)
  const ingestReceiptImage = async (formData: FormData) => {
    try {
      const res = await api.uploadReceipt(formData);
      return {
        success: true,
        store_name: res.store_name || "Supermarket",
        purchase_date: res.purchase_date || new Date().toISOString().split('T')[0],
        items: res.items || [],
        timings: res.timings
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to process receipt image.' };
    }
  };

  // Receipt Confirmation API (Stage 2 Database Save)
  const confirmReceiptSave = async (payload: api.ConfirmReceiptPayload) => {
    try {
      const res = await api.confirmReceipt(payload);
      await refreshData();
      return {
        success: true,
        parsed_items: res.parsed_items,
        total_expense: res.total_expense
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to save confirmed receipt.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        isJudgeMode,
        setJudgeMode,
        isOffline,
        setIsOffline,
        isLoading,
        setIsLoading,
        error,
        setError,
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
        ingestReceiptImage,
        confirmReceiptSave,
        chatHistory,
        addChatMessage,
        sendChatMessage,
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
