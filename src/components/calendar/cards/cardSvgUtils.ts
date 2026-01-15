export function toTitleCase(input: string): string {
  return input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Sparkline generator (0–1 normalized values)
 * NOTE: For pace graphs, adapter should invert/normalize.
 */
export function generateSparklinePath(
  data: number[],
  width: number,
  height: number
): string {
  if (!data.length) return '';

  const step = width / (data.length - 1 || 1);

  return data
    .map((v, i) => {
      const x = i * step;
      const y = height - v * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

/**
 * Generates a wavy line path for speed data (activities) or workout steps (planned)
 * @param width - Width of the path
 * @param height - Height of the path
 * @param type - 'speed' for activities or 'steps' for planned workouts
 * @returns SVG path string
 */
export function generateWavyLinePath(
  width: number,
  height: number,
  type: 'speed' | 'steps'
): string {
  const points = 40; // Number of points in the wave
  const step = width / (points - 1);
  const midHeight = height / 2;
  const amplitude = height * 0.35; // Wave amplitude
  
  // Generate wave pattern - speed has smoother variations, steps have more defined segments
  const path = Array.from({ length: points }, (_, i) => {
    const x = i * step;
    let y: number;
    
    if (type === 'speed') {
      // Speed data: smoother wave with variations (simulating pace changes)
      const baseWave = Math.sin((i / points) * Math.PI * 4) * amplitude;
      const variation = Math.sin((i / points) * Math.PI * 8) * (amplitude * 0.3);
      y = midHeight + baseWave + variation;
    } else {
      // Workout steps: more segmented pattern (simulating step changes)
      const segment = Math.floor(i / (points / 6)); // 6 segments
      const segmentWave = Math.sin((segment / 6) * Math.PI * 2) * amplitude;
      const localVariation = Math.sin((i / points) * Math.PI * 12) * (amplitude * 0.2);
      y = midHeight + segmentWave + localVariation;
    }
    
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return path;
}
