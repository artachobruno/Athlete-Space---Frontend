import { conversationsApi } from './typedClient';
import type { CoachProgressResponse } from '@/types/coachProgress';

/**
 * Conversation message from backend.
 */
export interface ConversationMessage {
  id: string;
  role: 'assistant' | 'user' | 'athlete';
  content: string;
  transient?: boolean;
  stage?: string;
  message_type?: 'assistant' | 'progress' | 'final';
  show_plan?: boolean;
  plan_items?: Array<{
    id: string;
    title: string;
    description?: string;
    date?: string;
    sport?: string;
  }>;
  metadata?: {
    week_number?: number | string;
    total_weeks?: number | string;
    [key: string]: unknown;
  };
  created_at: string;
}

/**
 * Fetches coach progress for a conversation.
 * Authenticated only, read-only, no retries beyond existing API policy.
 * 
 * Uses typed API client to ensure endpoint exists.
 */
export async function fetchCoachProgress(
  conversationId: string
): Promise<CoachProgressResponse> {
  const response = await conversationsApi.getProgress(conversationId);
  return response as unknown as CoachProgressResponse;
}

/**
 * Fetches messages for a conversation.
 * Used to poll for transient progress messages during plan generation.
 * 
 * Uses typed API client to ensure endpoint exists.
 */
export async function fetchConversationMessages(
  conversationId: string
): Promise<ConversationMessage[]> {
  const response = await conversationsApi.getMessages(conversationId);
  return response as unknown as ConversationMessage[];
}
