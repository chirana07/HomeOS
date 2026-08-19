// api.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 1. Extract host IP dynamically from Expo Constants (for Physical Devices via Expo Go)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000`;
    }
  }

  // 2. Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // 3. iOS Simulator / Web fallback
  return 'http://localhost:8000';
};

export const BASE_URL = getBaseUrl();

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    const diagMsg = isTimeout
      ? `[API Timeout] Request to ${url} timed out after ${timeoutMs}ms.`
      : `[API Connection Error] Failed to connect to ${url}.\nPossible reasons:\n• FastAPI backend not running\n• Wrong API URL (${BASE_URL})\n• Device/Emulator cannot reach server IP\n• Firewall blocking port 8000`;
    console.error(diagMsg);
    throw new Error(diagMsg);
  }
}

export async function checkHealth() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {}, 4000);
    if (!response.ok) return { status: 'unhealthy', message: 'Backend returned non-200 status' };
    return await response.json();
  } catch (err: any) {
    return { status: 'offline', message: err.message };
  }
}

export async function getPlan() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/`);
  if (!response.ok) {
    throw new Error('Failed to fetch plan.');
  }
  return response.json();
}

export async function generatePlan(budget: number, familySize: number, inventory: string[]) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/generate`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/trace`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent trace.');
  }
  return response.json();
}

export async function getDayDetail(id: number | string) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/day/${id}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || `Failed to fetch details for day ${id}.`);
  }
  return response.json();
}

export async function completeMeal(day: number, mealType: string) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/complete-meal`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/undo-meal`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/api/receipts/`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/api/receipts/pantry`);

  if (!response.ok) {
    throw new Error('Failed to fetch pantry.');
  }

  return response.json();
}

export async function getInventory() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/receipts/inventory`);
  if (!response.ok) {
    throw new Error('Failed to fetch inventory.');
  }
  return response.json();
}

export async function getPlanInventory() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/plan/inventory`);
  if (!response.ok) {
    throw new Error('Failed to fetch plan inventory.');
  }
  return response.json();
}

export async function getRecipes() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/recipes/`);
  if (!response.ok) {
    throw new Error('Failed to fetch recipes.');
  }
  return response.json();
}

export async function createRecipe(payload: any) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/recipes/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = 'Failed to create recipe.';
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export async function chatWithAssistantVoice(formData: FormData) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/assistant/voice`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = 'Failed to process voice request.';
    try {
      const err = await response.json();
      errMsg = err.detail?.message || err.detail || errMsg;
    } catch (e) {
      // ignore
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

export async function uploadReceipt(formData: FormData) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/receipts/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = 'Failed to upload receipt image.';
    try {
      const err = await response.json();
      errMsg = err.detail?.message || err.detail || errMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export interface ConfirmReceiptPayload {
  store_name: string;
  purchase_date: string;
  items: Array<{
    name: string;
    quantity: string;
    unit: string;
    price: number;
    estimated_expiry_date?: string;
  }>;
}

export async function confirmReceipt(payload: ConfirmReceiptPayload) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/receipts/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = 'Failed to confirm receipt save.';
    try {
      const err = await response.json();
      errMsg = err.detail?.message || err.detail || errMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export async function chatWithAssistantText(message: string) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let errMsg = 'Assistant request failed.';
    try {
      const err = await response.json();
      errMsg = err.detail?.message || err.detail || errMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}
