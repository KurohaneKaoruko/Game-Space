export const SCORE_LENGTH_WEIGHT = 10_000;
export const SCORE_STEP_WEIGHT = 1;

export function computeFinalScore(input: { length: number; steps: number }): number {
  const length = Math.max(0, Math.floor(input.length));
  const steps = Math.max(0, Math.floor(input.steps));
  const numerator = length * SCORE_LENGTH_WEIGHT;
  const denominator = steps * SCORE_STEP_WEIGHT + 1;
  return Math.floor(numerator / denominator);
}
