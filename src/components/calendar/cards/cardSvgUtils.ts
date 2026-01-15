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
