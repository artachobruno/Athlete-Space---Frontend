/**
 * DecisionStepsBar - Compact decision-steps visualization
 *
 * Shows 4 vertical bars representing the decision pipeline:
 * 1. Load Context (recent load vs baseline)
 * 2. Recovery State (fatigue / readiness)
 * 3. Trend Check (directionality)
 * 4. Final Decision (today's recommendation)
 *
 * Design: Quiet engineering readout, not a fitness graph.
 */

type WorkoutIntent = 'recovery' | 'aerobic' | 'endurance' | 'threshold' | 'vo2';

export interface DecisionStepsBarProps {
  /** Normalized 0–1 values for each step, length = 4 */
  steps: [number, number, number, number];
  /** Intent controls accent color for final bar */
  intent: WorkoutIntent;
}

// Intent → accent color mapping (reusing existing semantic colors)
const INTENT_COLORS: Record<WorkoutIntent, string> = {
  recovery: 'hsl(160, 60%, 45%)',    // muted green
  aerobic: 'hsl(215, 20%, 55%)',     // neutral active
  endurance: 'hsl(215, 20%, 55%)',   // neutral active
  threshold: 'hsl(38, 92%, 50%)',    // amber
  vo2: 'hsl(0, 70%, 55%)',           // red
};

// Neutral grey for non-decision bars
const NEUTRAL_COLOR = 'hsl(215, 15%, 35%)';

// Layout constants (viewBox: 0 0 100 24)
const BAR_WIDTH = 6;
const BAR_GAP = 8;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 18;
const BASELINE_Y = 22;
const TOTAL_BARS = 4;

// Calculate starting X to center bars in viewBox
const TOTAL_WIDTH = TOTAL_BARS * BAR_WIDTH + (TOTAL_BARS - 1) * BAR_GAP;
const START_X = (100 - TOTAL_WIDTH) / 2;

/**
 * Maps step value (0-1) to bar height
 */
function getBarHeight(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return MIN_HEIGHT + clamped * (MAX_HEIGHT - MIN_HEIGHT);
}

export function DecisionStepsBar({ steps, intent }: DecisionStepsBarProps) {
  const accentColor = INTENT_COLORS[intent];

  return (
    <svg
      width="100%"
      height="24"
      viewBox="0 0 100 24"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      {steps.map((stepValue, index) => {
        const height = getBarHeight(stepValue);
        const x = START_X + index * (BAR_WIDTH + BAR_GAP);
        const y = BASELINE_Y - height;
        const isDecisionBar = index === 3;
        const fill = isDecisionBar ? accentColor : NEUTRAL_COLOR;
        const opacity = isDecisionBar ? 0.9 : 0.6;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={BAR_WIDTH}
            height={height}
            fill={fill}
            fillOpacity={opacity}
            rx={1}
          />
        );
      })}
    </svg>
  );
}
