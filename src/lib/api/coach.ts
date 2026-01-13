import { api } from '../api';
import type { CoachProgressResponse } from '@/types/coachProgress';

/**
 * Fetches coach progress for a conversation.
 * Authenticated only, read-only, no retries beyond existing API policy.
 */
export async function fetchCoachProgress(
  conversationId: string
): Promise<CoachProgressResponse> {
  const response = await api.get<CoachProgressResponse>(
    `/conversations/${conversationId}/progress`
  );
  return response as unknown as CoachProgressResponse;
}

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
 * Fetches messages for a conversation.
 * Used to poll for transient progress messages during plan generation.
 */
export async function fetchConversationMessages(
  conversationId: string
): Promise<ConversationMessage[]> {
  const response = await api.get<ConversationMessage[]>(
    `/conversations/${conversationId}/messages`
  );
  return response as unknown as ConversationMessage[];
}
