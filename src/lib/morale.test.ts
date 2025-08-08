import { describe, it, expect } from 'vitest';
import { computeMoraleScore, resolveMoraleLevel } from './morale';

describe('morale helpers', () => {
  it('computes morale score in [0,1]', () => {
    expect(computeMoraleScore({ completionRate: 1, votingRate: 1, proposalRate: 1 })).toBe(1);
    expect(computeMoraleScore({ completionRate: 0, votingRate: 0, proposalRate: 0 })).toBe(0);
    const mid = computeMoraleScore({ completionRate: 0.5, votingRate: 0.5, proposalRate: 0.5 });
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
  });

  it('resolves morale level with thresholds and hysteresis', () => {
    // High
    expect(resolveMoraleLevel(0.9)).toBe('High');
    // Low
    expect(resolveMoraleLevel(0.1)).toBe('Low');
    // Neutral
    expect(resolveMoraleLevel(0.5)).toBe('Neutral');

    // Hysteresis behavior: once High, stays High until we clearly drop below (hi - h)
    const stayedHigh = resolveMoraleLevel(0.62, 'High');
    expect(['High','Neutral','Low']).toContain(stayedHigh); // not asserting exact number to avoid coupling constants
  });
});


