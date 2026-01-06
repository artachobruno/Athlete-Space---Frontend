import type { CoachContext } from '@/types';

/**
 * Generates a static, data-safe greeting with optional personalization
 * based on backend-provided coach context.
 * 
 * Rules:
 * - Always returns a safe default greeting
 * - Only personalizes if data_confidence >= 0.5
 * - Never infers training state client-side
 * - Deterministic and fast (no LLM calls)
 */
export function generateCoachGreeting(coachContext: CoachContext | null | undefined): string {
  // Default static greeting (always safe)
  let greeting = "Good to see you. What would you like to focus on today?";

  // Only personalize if we have context with sufficient confidence
  if (coachContext?.data_confidence !== undefined) {
    if (coachContext.data_confidence < 0.5) {
      // Low confidence: acknowledge lack of data
      greeting = "Good to see you. I don't have enough recent training data yet. What would you like help with?";
    } else if (coachContext.data_confidence >= 0.5) {
      // Sufficient confidence: apply personalization based on summary_hint
      if (coachContext.summary_hint === "consistent") {
        greeting = "Good to see you. Your recent training has been consistent. What would you like to discuss?";
      } else if (coachContext.summary_hint === "fatigue") {
        greeting = "Good to see you. There are signs you may benefit from a conservative approach today.";
      }
      // If summary_hint is "insufficient" or undefined, use default greeting
    }
  }

  return greeting;
}

