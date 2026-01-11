/**
 * Phase 7: Session Explanation Component
 * 
 * Critical trust layer that explains why each session exists.
 * Uses Phase 5 coach_text output (session.notes) with deterministic fallback.
 */

import type { PlanSession } from '@/types/execution';

interface SessionExplanationProps {
  session: PlanSession;
}

/**
 * Default explanation by session type (deterministic, no LLM dependency)
 */
function defaultExplanationBySessionType(sessionType: string): string {
  const explanations: Record<string, string> = {
    easy: 'Easy run to build aerobic base and promote recovery between harder sessions.',
    tempo: 'Tempo session develops sustained speed close to race pace while keeping fatigue controlled.',
    long: 'Long run builds endurance and mental toughness for race distances.',
    workout: 'Structured workout to improve specific fitness components through intervals or threshold efforts.',
    recovery: 'Recovery session to facilitate adaptation and prevent overtraining.',
    rest: 'Rest day allows your body to adapt to training stress and recover fully.',
  };

  return explanations[sessionType] || 'Training session designed to improve your fitness.';
}

export function SessionExplanation({ session }: SessionExplanationProps) {
  // Phase 5 coach_text output is in session.notes
  const explanation = session.notes || defaultExplanationBySessionType(session.type);

  return (
    <div className="text-sm text-muted-foreground pt-2 border-t">
      <p>{explanation}</p>
    </div>
  );
}
