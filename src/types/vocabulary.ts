/**
 * Coach Vocabulary Level
 * 
 * This defines the canonical language layer that sits between:
 * 1. Internal intent/logic (machine truth: 'easy', 'tempo', etc.)
 * 2. Canonical coach language (this layer: 'Aerobic Maintenance Run', etc.)
 * 3. Presentation layer (UI cards, LLM responses, narratives)
 * 
 * This vocabulary level is used by:
 * - UI card titles
 * - Weekly narrative text
 * - Modal narrative blocks
 * - LLM coach responses (as a consumer, not generator)
 * 
 * The LLM is a consumer of this language system, not the author of it.
 * This ensures consistent coach voice across all touchpoints.
 */
export type CoachVocabularyLevel =
  | 'foundational'
  | 'intermediate'
  | 'advanced';

/**
 * @deprecated Use CoachVocabularyLevel instead
 * Kept for backward compatibility during migration
 */
export type VocabularyLevel = CoachVocabularyLevel;
