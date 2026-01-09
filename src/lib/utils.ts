import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets or generates a conversation ID for the current session.
 * 
 * - Reads from localStorage if it exists
 * - Generates a new one in format `c_` + UUID if missing
 * - Persists immediately to localStorage
 * - Returns synchronously (no async operations)
 * 
 * @returns The conversation ID (format: `c_` + UUID)
 */
export function getConversationId(): string {
  const STORAGE_KEY = 'conversation_id';
  
  // Try to read existing ID from localStorage
  const existingId = localStorage.getItem(STORAGE_KEY);
  
  if (existingId && existingId.trim() !== '') {
    return existingId;
  }
  
  // Generate new ID: `c_` + UUID
  const uuid = crypto.randomUUID();
  const newId = `c_${uuid}`;
  
  // Persist immediately
  localStorage.setItem(STORAGE_KEY, newId);
  
  // Dev-only logging
  if (import.meta.env.DEV) {
    console.log('[Conversation ID] Generated new ID:', newId);
  }
  
  return newId;
}
