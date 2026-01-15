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

export function intensityToGlow(intensity?: Intensity | string): string | undefined {
  if (!intensity) return undefined
  
  const lower = intensity.toLowerCase()
  
  // Map workout intents and intensities to glow classes
  switch (lower) {
    case "easy":
    case "recovery":
    case "aerobic":
      return "glass-glow-easy"
    case "tempo":
    case "moderate":
    case "endurance":
      return "glass-glow-tempo"
    case "threshold":
      return "glass-glow-threshold"
    case "vo2":
    case "hill":
      return "glass-glow-vo2"
    default:
      return undefined
  }
}

/**
 * Maps workout intensity/type to Intensity type for glow effect.
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
