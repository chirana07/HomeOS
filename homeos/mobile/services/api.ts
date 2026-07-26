// api.ts
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

export async function getPlan() {
  const response = await fetch(`${BASE_URL}/api/plan/`);
  if (!response.ok) {
    throw new Error('Failed to fetch plan.');
  }
  return response.json();
}

export async function generatePlan(budget: number, familySize: number, inventory: string[]) {
  const response = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      budget: parseFloat(budget.toString()),
      family_size: parseInt(familySize.toString(), 10),
      inventory: inventory,
    }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to generate plan.');
  }
  
  return response.json();
}

export async function getTrace() {
  const response = await fetch(`${BASE_URL}/api/plan/trace`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent trace.');
  }
  return response.json();
}

export async function getDayDetail(id: number | string) {
  const response = await fetch(`${BASE_URL}/api/plan/day/${id}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || `Failed to fetch details for day ${id}.`);
  }
  return response.json();
}

export async function completeMeal(day: number, mealType: string) {
  const response = await fetch(`${BASE_URL}/api/plan/complete-meal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      day: parseInt(day.toString(), 10),
      meal_type: mealType,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to complete meal.');
  }

  return response.json();
}

export async function undoMeal(day: number, mealType: string) {
  const response = await fetch(`${BASE_URL}/api/plan/undo-meal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      day: parseInt(day.toString(), 10),
      meal_type: mealType,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to undo meal.');
  }

  return response.json();
}

export interface ReceiptData {
  raw_text: string;
  purchase_date: string;
  store_name: string;
}

export async function addReceipt(data: ReceiptData) {
  const response = await fetch(`${BASE_URL}/api/receipts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail?.message || 'Failed to add receipt.');
  }

  return response.json();
}

export async function getPantry() {
  const response = await fetch(`${BASE_URL}/api/receipts/pantry`);

  if (!response.ok) {
    throw new Error('Failed to fetch pantry.');
  }

  return response.json();
}

export async function getInventory() {
  const response = await fetch(`${BASE_URL}/api/receipts/inventory`);
  if (!response.ok) {
    throw new Error('Failed to fetch inventory.');
  }
  return response.json();
}

export async function getPlanInventory() {
  const response = await fetch(`${BASE_URL}/api/plan/inventory`);
  if (!response.ok) {
    throw new Error('Failed to fetch plan inventory.');
  }
  return response.json();
}

export async function chatWithAssistantVoice(formData: FormData) {
  const response = await fetch(`${BASE_URL}/api/assistant/voice`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = 'Failed to process voice request.';
    try {
      const err = await response.json();
      errMsg = err.detail?.message || err.detail || errMsg;
    } catch (e) {
      // response might not be JSON if it's a 500 error
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const transcriptHeader = response.headers.get('X-Assistant-Transcript');
  let transcript = '';
  if (transcriptHeader) {
    transcript = decodeURIComponent(transcriptHeader);
  }

  return { blob, transcript };
}
