import { describe, it, expect } from 'vitest';
import { generatePartyCode } from './partyCodeGenerator';

describe('partyCodeGenerator', () => {
  describe('generatePartyCode', () => {
    it('generates a 6-character code', () => {
      const code = generatePartyCode();
      expect(code).toHaveLength(6);
    });

    it('generates 4 letters followed by 2 digits', () => {
      const code = generatePartyCode();
      const letters = code.slice(0, 4);
      const digits = code.slice(4);
      
      expect(letters).toMatch(/^[A-Z]{4}$/);
      expect(digits).toMatch(/^[0-9]{2}$/);
    });

    it('generates different codes on multiple calls', () => {
      const code1 = generatePartyCode();
      const code2 = generatePartyCode();
      expect(code1).not.toBe(code2);
    });

    it('uses allowed character sets (no 0/1, I/O, etc.)', () => {
      const attempts = Array.from({ length: 50 }, () => generatePartyCode());
      for (const code of attempts) {
        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ]{4}[23456789]{2}$/);
      }
    });

    it('generates codes with expected format', () => {
      const code = generatePartyCode();
      expect(code).toMatch(/^[A-Z]{4}\d{2}$/);
    });
  });

  describe('code characteristics', () => {
    it('generates codes with consistent length', () => {
      for (let i = 0; i < 100; i++) {
        const code = generatePartyCode();
        expect(code).toHaveLength(6);
      }
    });

    it('generates codes with valid characters only', () => {
      const validLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const validNumbers = '23456789';
      
      for (let i = 0; i < 100; i++) {
        const code = generatePartyCode();
        const letters = code.slice(0, 4);
        const digits = code.slice(4);
        
        for (const letter of letters) {
          expect(validLetters).toContain(letter);
        }
        
        for (const digit of digits) {
          expect(validNumbers).toContain(digit);
        }
      }
    });
  });
});


