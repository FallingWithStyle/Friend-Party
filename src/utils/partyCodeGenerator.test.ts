import { describe, it, expect } from 'vitest';
import { generatePartyCode } from './partyCodeGenerator';

describe('generatePartyCode', () => {
  it('generates a 6-character code with 4 letters and 2 digits', () => {
    const code = generatePartyCode();
    expect(code).toHaveLength(6);
    const letters = code.slice(0, 4);
    const digits = code.slice(4);
    expect(/^[A-Z]{4}$/.test(letters)).toBe(true);
    expect(/^\d{2}$/.test(digits)).toBe(true);
  });

  it('uses allowed character sets (no 0/1, I/O, etc.)', () => {
    const attempts = Array.from({ length: 50 }, () => generatePartyCode());
    for (const c of attempts) {
      expect(/^[ABCDEFGHJKLMNPQRSTUVWXYZ]{4}[23456789]{2}$/.test(c)).toBe(true);
    }
  });
});


