export type Intensity =
  | "easy"
  | "moderate"
  | "tempo"
  | "threshold"
  | "vo2"
  | "hill"
  | "aerobic"
  | "recovery"
  | "endurance"

/**
 * Maps intensity to a visual class.
 * Previously returned glass-glow-* classes, now returns undefined as the F1 theme was removed.
 */
export function intensityToGlow(_intensity?: Intensity | string): string | undefined {
  // F1/glass theme removed - glow effects are no longer used
  return undefined
}

/**
 * Maps workout intensity/type to Intensity type.
 * Handles various workout intensity formats from the backend.
 */
export function getGlowIntensityFromWorkout(
  intensity?: string | null,
  type?: string | null
): Intensity | undefined {
  const source = intensity || type
  if (!source) return undefined
  
  const lower = source.toLowerCase().trim()
  
  // Direct matches
  if (lower === "recovery" || lower === "easy" || lower === "rest" || lower === "aerobic") {
    return "easy"
  }
  if (lower === "threshold" || lower === "tempo") {
    return lower === "threshold" ? "threshold" : "tempo"
  }
  if (lower === "vo2" || lower === "vo2max" || lower === "interval" || lower === "hill") {
    return lower === "hill" ? "hill" : "vo2"
  }
  if (lower === "endurance" || lower === "long") {
    return "endurance"
  }
  if (lower === "moderate") {
    return "moderate"
  }
  
  // Partial matches
  if (lower.includes("recovery") || lower.includes("easy") || lower.includes("rest") || lower.includes("aerobic")) {
    return "easy"
  }
  if (lower.includes("threshold")) {
    return "threshold"
  }
  if (lower.includes("tempo")) {
    return "tempo"
  }
  if (lower.includes("vo2") || lower.includes("interval") || lower.includes("sprint")) {
    return "vo2"
  }
  if (lower.includes("hill")) {
    return "hill"
  }
  if (lower.includes("endurance") || lower.includes("long")) {
    return "endurance"
  }
  if (lower.includes("moderate")) {
    return "moderate"
  }
  
  return undefined
}
