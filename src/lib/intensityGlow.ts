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
