import type { CoachDecisionV2, DailyDecisionV1 } from '@/types/coachDecision';

/**
 * Extract signals from explanation text (heuristic fallback)
 */
function extractSignals(explanation: string): string[] {
  const signals: string[] = [];
  const lower = explanation.toLowerCase();
  
  // Look for fatigue indicators
  if (lower.includes('fatigue') || lower.includes('tired') || lower.includes('elevated')) {
    if (lower.includes('recent') || lower.includes('yesterday') || lower.includes('last')) {
      signals.push('Elevated fatigue following recent training');
    } else {
      signals.push('Elevated fatigue detected');
    }
  }
  
  // Look for recovery indicators
  if (lower.includes('recovery') || lower.includes('rest day')) {
    if (lower.includes('no') && (lower.includes('rest') || lower.includes('recovery'))) {
      signals.push('No full rest day in recent period');
    } else if (lower.includes('below') || lower.includes('low')) {
      signals.push('Recovery signals below baseline');
    }
  }
  
  // Look for training load indicators
  if (lower.includes('load') || lower.includes('volume') || lower.includes('training')) {
    if (lower.includes('high') || lower.includes('elevated') || lower.includes('accumulated')) {
      signals.push('Accumulated training load');
    }
  }
  
  // Look for time-based indicators
  if (lower.includes('day') && (lower.includes('6') || lower.includes('7') || lower.includes('week'))) {
    signals.push('Extended training period without rest');
  }
  
  // If no specific signals found, extract first key phrase
  if (signals.length === 0) {
    const sentences = explanation.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length > 0 && firstSentence.length < 100) {
        signals.push(firstSentence);
      }
    }
  }
  
  // Limit to 3 most relevant signals
  return signals.slice(0, 3);
}

/**
 * Normalize decision string to v2 format
 */
function normalizeDecision(recommendation: string): 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL' {
  const lower = recommendation.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'REST';
  if (lower.includes('easy_with_caution') || lower.includes('moderate_with_caution')) return 'MODIFY';
  if (lower.includes('modify') || lower.includes('adjust')) return 'MODIFY';
  if (lower.includes('cancel') || lower.includes('skip')) return 'CANCEL';
  return 'PROCEED';
}

/**
 * Get default focus items based on decision type
 */
function defaultFocusForDecision(decision: 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL'): string[] {
  switch (decision) {
    case 'REST':
      return [
        'No structured training',
        'Optional: light mobility or short walk',
        'Prioritize sleep and hydration'
      ];
    case 'PROCEED':
      return [
        'Follow planned workout structure',
        'Maintain target intensity zones',
        'Complete full session as designed'
      ];
    case 'MODIFY':
      return [
        'Reduce intensity or volume as needed',
        'Listen to body signals',
        'Prioritize recovery if feeling fatigued'
      ];
    case 'CANCEL':
      return [
        'Skip planned session',
        'Focus on recovery',
        'Resume training when ready'
      ];
  }
}

/**
 * Adapt legacy v1 decision to v2 format
 * 
 * This guarantees zero regression - any v1 decision can be safely converted to v2
 */
export function adaptLegacyDecision(v1: DailyDecisionV1): CoachDecisionV2 {
  const normalizedDecision = normalizeDecision(v1.recommendation);
  const signals = extractSignals(v1.explanation);
  const lowerRec = v1.recommendation.toLowerCase();
  
  // Determine primary focus from decision type, with special handling for caution recommendations
  let primaryFocus: string;
  let recommendedFocus: string[];
  
  if (lowerRec.includes('easy_with_caution')) {
    primaryFocus = 'Take the easy run easy, don\'t push';
    recommendedFocus = [
      'Proceed with planned easy run',
      'Keep effort very easy and conversational',
      'Listen to your body and cut short if needed'
    ];
  } else if (lowerRec.includes('moderate_with_caution')) {
    primaryFocus = 'Reduce intensity on moderate session';
    recommendedFocus = [
      'Proceed with planned moderate session',
      'Reduce pace/intensity by 10-15%',
      'Prioritize completion over intensity'
    ];
  } else {
    const primaryFocusMap: Record<'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL', string> = {
      REST: 'Recovery and adaptation',
      PROCEED: 'Execute planned session',
      MODIFY: 'Adjust intensity or volume',
      CANCEL: 'Skip and recover'
    };
    primaryFocus = primaryFocusMap[normalizedDecision];
    recommendedFocus = defaultFocusForDecision(normalizedDecision);
  }
  
  return {
    version: 'coach_decision_v2',
    decision: normalizedDecision,
    primary_focus: primaryFocus,
    confidence: v1.confidence.score,
    signals: signals.length > 0 ? signals : ['Based on current training state'],
    recommended_focus: recommendedFocus,
    explanation: v1.explanation, // Preserve for fallback
  };
}
