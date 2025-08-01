/**
 * Party Morale configuration and helpers (centralized).
 * Thresholds can be tuned here; optional hysteresis avoids flip-flopping.
 */

export const MORALE_HIGH_THRESHOLD = 0.66;
export const MORALE_LOW_THRESHOLD = 0.33;

// Optional hysteresis window (e.g., 0.05 -> 5% buffer)
// If previousLevel is provided, widen the band to prevent rapid flips.
export const MORALE_HYSTERESIS = 0.05;

export type MoraleLevel = 'Low' | 'Neutral' | 'High';

/**
 * Compute normalized morale score [0..1] from participation signals.
 */
export function computeMoraleScore(params: {
  completionRate: number; // [0..1]
  votingRate: number;     // [0..1]
  proposalRate: number;   // [0..1]
}): number {
  const { completionRate = 0, votingRate = 0, proposalRate = 0 } = params;
  const clamped = (n: number) => (isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
  const score = (clamped(completionRate) + clamped(votingRate) + clamped(proposalRate)) / 3;
  return clamped(score);
}

/**
 * Resolve morale level from score with optional hysteresis.
 * If previousLevel provided, use a slightly wider band to avoid thrashing.
 */
export function resolveMoraleLevel(score: number, previousLevel?: MoraleLevel | null): MoraleLevel {
  const s = Math.max(0, Math.min(1, isFinite(score) ? score : 0));
  const hi = MORALE_HIGH_THRESHOLD;
  const lo = MORALE_LOW_THRESHOLD;
  const h  = MORALE_HYSTERESIS;

  if (previousLevel === 'High') {
    // Stay High until we clearly drop below hi - h
    if (s >= hi - h) return 'High';
  } else if (previousLevel === 'Low') {
    // Stay Low until we clearly rise above lo + h
    if (s <= lo + h) return 'Low';
  }

  if (s >= hi) return 'High';
  if (s < lo) return 'Low';
  return 'Neutral';
}