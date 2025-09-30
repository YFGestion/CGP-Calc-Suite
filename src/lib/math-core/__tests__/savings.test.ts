import { describe, it, expect } from 'vitest';
import { savingsProjection } from '../savings';
import { round } from '../utils';

describe('savingsProjection', () => {
  it('should calculate savings projection correctly with monthly contributions and no fees', () => {
    const result = savingsProjection({
      initial: 1000,
      periodic: 100,
      periodicity: 'monthly',
      years: 1,
      grossReturn: 0.05, // 5% annual return
      entryFee: 0,
    });

    // Expected values (approximate due to compounding)
    // Initial: 1000
    // 12 contributions of 100 = 1200
    // Total contributions = 2200
    // Final capital should be > 2200 due to interest

    expect(result.totalContributions).toBe(round(1000 + (100 * 12), 2)); // Initial + 12 months of 100
    expect(result.finalCapital).toBeGreaterThan(result.totalContributions);
    expect(result.grossGains).toBe(round(result.finalCapital - result.totalContributions, 2));
    expect(result.series.length).toBe(13); // 0 + 12 periods
    expect(result.series[0].value).toBe(1000);
    expect(result.series[12].value).toBe(result.finalCapital);
  });

  it('should calculate savings projection correctly with yearly contributions and entry fees', () => {
    const result = savingsProjection({
      initial: 5000,
      periodic: 1000,
      periodicity: 'yearly',
      years: 3,
      grossReturn: 0.08, // 8% annual return
      entryFee: 0.02, // 2% entry fee
    });

    // Year 0: Capital = 5000, Contrib = 5000
    // Year 1: Capital = (5000 * 1.08) + (1000 * (1-0.02)) = 5400 + 980 = 6380. Contrib = 6000
    // Year 2: Capital = (6380 * 1.08) + (1000 * (1-0.02)) = 6890.4 + 980 = 7870.4. Contrib = 7000
    // Year 3: Capital = (7870.4 * 1.08) + (1000 * (1-0.02)) = 8500.032 + 980 = 9480.032. Contrib = 8000

    expect(result.totalContributions).toBe(round(5000 + (1000 * 3), 2)); // Initial + 3 years of 1000
    expect(result.finalCapital).toBe(round(9480.03, 2));
    expect(result.grossGains).toBe(round(result.finalCapital - result.totalContributions, 2));
    expect(result.series.length).toBe(4); // 0 + 3 periods
    expect(result.series[3].value).toBe(result.finalCapital);
  });

  it('should handle zero initial capital and periodic contributions', () => {
    const result = savingsProjection({
      initial: 0,
      periodic: 0,
      periodicity: 'monthly',
      years: 5,
      grossReturn: 0.10,
      entryFee: 0,
    });

    expect(result.finalCapital).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.grossGains).toBe(0);
    expect(result.series.length).toBe(61); // 0 + 60 periods
    expect(result.series[60].value).toBe(0);
  });

  it('should handle zero gross return', () => {
    const result = savingsProjection({
      initial: 1000,
      periodic: 100,
      periodicity: 'monthly',
      years: 1,
      grossReturn: 0,
      entryFee: 0,
    });

    expect(result.totalContributions).toBe(round(1000 + (100 * 12), 2));
    expect(result.finalCapital).toBe(round(1000 + (100 * 12), 2)); // No gains
    expect(result.grossGains).toBe(0);
  });

  it('should handle quarterly contributions', () => {
    const result = savingsProjection({
      initial: 0,
      periodic: 500,
      periodicity: 'quarterly',
      years: 2,
      grossReturn: 0.04,
      entryFee: 0,
    });

    // 2 years * 4 quarters/year = 8 contributions
    expect(result.totalContributions).toBe(round(500 * 8, 2)); // 4000
    expect(result.finalCapital).toBeGreaterThan(4000);
    expect(result.series.length).toBe(9); // 0 + 8 periods
  });
});