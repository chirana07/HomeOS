// AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [pantryList, setPantryList] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: '1', sender: 'assistant', text: 'Hello! I am your HomeOS Household AI Operating System. How can I assist your home today?' }
  ]);
  const [isJudgeMode, setJudgeMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

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
        console.warn('Plan fetch failed:', planRes.reason);
      }

      if (invRes.status === 'fulfilled') {
        const fetchedInv = Array.isArray(invRes.value) ? invRes.value : (invRes.value.inventory || []);
        setInventory(fetchedInv);
        if (pantryRes.status !== 'fulfilled' || !Array.isArray(pantryRes.value) || pantryRes.value.length === 0) {
          setPantryList(fetchedInv.map(i => i.ingredient || i.name));
        }
      } else {
        console.warn('Inventory fetch failed:', invRes.reason);
      }

      if (pantryRes.status === 'fulfilled' && Array.isArray(pantryRes.value) && pantryRes.value.length > 0) {
        setPantryList(pantryRes.value);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
      setIsOffline(true);
      setError(err?.message || 'Failed to sync with HomeOS backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addChatMessage = (sender, text, audioUrl = null) => {
    setChatHistory(prev => [
      ...prev,
      { id: Date.now().toString(), sender, text, audioUrl }
    ]);
  };

  const sendChatMessage = async (text) => {
    if (!text.trim()) return;
    addChatMessage('user', text);
    setIsThinking(true);
    try {
      const res = await api.chatWithAssistantText(text);
      const reply = res.response || res.transcript || "I've processed your request.";
      addChatMessage('assistant', reply);
      await refreshData();
    } catch (err) {
      addChatMessage('assistant', "I'm sorry, I'm having trouble connecting to my backend service right now.");
    } finally {
      setIsThinking(false);
    }
  };

  const completeMeal = async (day, mealType, isUndo = false) => {
    try {
      if (isUndo) {
        await api.undoMeal(day, mealType);
      } else {
        await api.completeMeal(day, mealType);
      }
      await refreshData();
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to update meal execution.');
      return false;
    }
  };

  const generateNewPlan = async (budget = 10000, familySize = 4) => {
    setIsThinking(true);
    try {
      const plan = await api.generatePlan({ budget, familySize, inventory: pantryList });
      setCurrentPlan(plan);
      await refreshData();
    } catch (err) {
      setError(err?.message || 'Plan generation failed.');
    } finally {
      setIsThinking(false);
    }
  };

  // Stage 1 Receipt Image Ingest (OCR Parsing ONLY)
  const ingestReceiptImage = async (formData) => {
    try {
      const res = await api.uploadReceipt(formData);
      return {
        success: true,
        store_name: res.store_name || "Supermarket",
        purchase_date: res.purchase_date || new Date().toISOString().split('T')[0],
        items: res.items || [],
        timings: res.timings
      };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to process receipt image.' };
    }
  };

  // Stage 2 Receipt Save Commitment (SQLite Insertion)
  const confirmReceiptSave = async (payload) => {
    try {
      const res = await api.confirmReceipt(payload);
      await refreshData();
      return {
        success: true,
        parsed_items: res.parsed_items,
        total_expense: res.total_expense
      };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to save confirmed receipt.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        inventory,
        currentPlan,
        pantryList,
        chatHistory,
        isJudgeMode,
        setJudgeMode,
        isOffline,
        isLoading,
        isThinking,
        error,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        refreshData,
        sendChatMessage,
        completeMeal,
        generateNewPlan,
        ingestReceiptImage,
        confirmReceiptSave
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
