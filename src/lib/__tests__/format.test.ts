import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, clampNumber, round2, roundToNearest } from '../format';

describe('format.ts', () => {
  describe('formatCurrency', () => {
    it('should format a number as currency in fr-FR EUR by default', () => {
      expect(formatCurrency(1234.56)).toBe('1 234,56 €');
      expect(formatCurrency(1000)).toBe('1 000,00 €');
      expect(formatCurrency(0)).toBe('0,00 €');
      expect(formatCurrency(-500.25)).toBe('-500,25 €');
    });

    it('should format a number as currency with custom locale and currency', () => {
      expect(formatCurrency(1234.56, 'en-US', 'USD')).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'de-DE', 'EUR')).toBe('1.234,56 €');
    });
  });

  describe('formatPercent', () => {
    it('should format a number as a percentage in fr-FR by default', () => {
      expect(formatPercent(0.123)).toBe('12,3 %');
      expect(formatPercent(0.5)).toBe('50 %');
      expect(formatPercent(1)).toBe('100 %');
      expect(formatPercent(0.005)).toBe('0,5 %');
      expect(formatPercent(0.0001)).toBe('0 %'); // Default maxFractionDigits: 1
    });

    it('should format a number as a percentage with custom options', () => {
      expect(formatPercent(0.12345, 'fr-FR', { maximumFractionDigits: 2 })).toBe('12,35 %');
      expect(formatPercent(0.12345, 'en-US', { minimumFractionDigits: 2 })).toBe('12.35%');
    });
  });

  describe('clampNumber', () => {
    it('should clamp a number within the specified range', () => {
      expect(clampNumber(5, 0, 10)).toBe(5);
      expect(clampNumber(-5, 0, 10)).toBe(0);
      expect(clampNumber(15, 0, 10)).toBe(10);
      expect(clampNumber(0, 0, 0)).toBe(0);
      expect(clampNumber(5.5, 5, 6)).toBe(5.5);
    });
  });

  describe('round2', () => {
    it('should round a number to 2 decimal places', () => {
      expect(round2(123.456)).toBe(123.46);
      expect(round2(123.454)).toBe(123.45);
      expect(round2(100)).toBe(100);
      expect(round2(0.125)).toBe(0.13);
      expect(round2(0.1249)).toBe(0.12);
      expect(round2(-123.456)).toBe(-123.46);
    });
  });

  describe('roundToNearest', () => {
    it('should round a number to the nearest step', () => {
      expect(roundToNearest(123, 10)).toBe(120);
      expect(roundToNearest(127, 10)).toBe(130);
      expect(roundToNearest(125, 10)).toBe(130);
      expect(roundToNearest(12.3, 0.5)).toBe(12.5);
      expect(roundToNearest(12.2, 0.5)).toBe(12);
      expect(roundToNearest(0.1, 0.2)).toBe(0);
      expect(roundToNearest(0.15, 0.2)).toBe(0.2);
      expect(roundToNearest(0, 5)).toBe(0);
    });
  });
});