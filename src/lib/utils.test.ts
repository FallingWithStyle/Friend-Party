import { describe, it, expect } from 'vitest';
import { deterministicShuffle } from './utils';

describe('deterministicShuffle', () => {
  it('returns same order for same seed', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const a = deterministicShuffle(input, 'seed-123');
    const b = deterministicShuffle(input, 'seed-123');
    expect(a).toEqual(b);
  });

  it('returns different order for different seeds', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const a = deterministicShuffle(input, 'seed-A');
    const b = deterministicShuffle(input, 'seed-B');
    expect(a).not.toEqual(b);
  });
});


