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
    `/coach/conversations/${conversationId}/progress`
  );
  return response as unknown as CoachProgressResponse;
}
