import { describe, it, expect } from 'vitest';
import { computeBrutNet } from '../brutNet';
import { round } from '../utils'; // Import round from utils

describe('computeBrutNet', () => {
  it('should calculate net values correctly for monthly input with 12 paid months', () => {
    const result = computeBrutNet({
      grossValue: 3000,
      inputPeriod: 'monthly',
      paidMonths: 12,
      chargesRate: 0.25,
      withholdingRate: 0.10,
    });

    expect(result.netBeforeTaxAnnual).toBe(27000); // 3000 * 12 * (1 - 0.25) = 36000 * 0.75 = 27000
    expect(result.netBeforeTaxMonthlyAvg).toBe(2250); // 27000 / 12 = 2250
    expect(result.netAfterTaxAnnual).toBe(24300); // 27000 * (1 - 0.10) = 24300
    expect(result.netAfterTaxMonthlyAvg).toBe(2025); // 24300 / 12 = 2025
    expect(result.netPerPay).toBe(2025); // (36000 / 12) * (1 - 0.25) * (1 - 0.10) = 3000 * 0.75 * 0.9 = 2025
  });

  it('should calculate net values correctly for annual input with 13 paid months', () => {
    const result = computeBrutNet({
      grossValue: 40000,
      inputPeriod: 'annual',
      paidMonths: 13, // Paid months should not affect annual gross if input is annual
      chargesRate: 0.20,
      withholdingRate: 0.05,
    });

    const brutAnnuel = 40000;
    const netAvant = brutAnnuel * (1 - 0.20); // 40000 * 0.8 = 32000
    const netAprès = netAvant * (1 - 0.05); // 32000 * 0.95 = 30400

    expect(result.netBeforeTaxAnnual).toBe(32000);
    expect(result.netBeforeTaxMonthlyAvg).toBe(round(32000 / 12, 2)); // 32000 / 12
    expect(result.netAfterTaxAnnual).toBe(30400);
    expect(result.netAfterTaxMonthlyAvg).toBe(round(30400 / 12, 2)); // 30400 / 12
    expect(result.netPerPay).toBe(round((brutAnnuel / 13) * (1 - 0.20) * (1 - 0.05), 2)); // (40000/13) * 0.8 * 0.95 = 2338.46
  });

  it('should handle zero rates', () => {
    const result = computeBrutNet({
      grossValue: 2000,
      inputPeriod: 'monthly',
      paidMonths: 12,
      chargesRate: 0,
      withholdingRate: 0,
    });

    expect(result.netBeforeTaxAnnual).toBe(24000);
    expect(result.netBeforeTaxMonthlyAvg).toBe(2000);
    expect(result.netAfterTaxAnnual).toBe(24000);
    expect(result.netAfterTaxMonthlyAvg).toBe(2000);
    expect(result.netPerPay).toBe(2000);
  });

  it('should handle maximum rates', () => {
    const result = computeBrutNet({
      grossValue: 1000,
      inputPeriod: 'monthly',
      paidMonths: 12,
      chargesRate: 0.5,
      withholdingRate: 0.45,
    });

    const brutAnnuel = 1000 * 12; // 12000
    const netAvant = brutAnnuel * (1 - 0.5); // 12000 * 0.5 = 6000
    const netAprès = netAvant * (1 - 0.45); // 6000 * 0.55 = 3300

    expect(result.netBeforeTaxAnnual).toBe(6000);
    expect(result.netBeforeTaxMonthlyAvg).toBe(500);
    expect(result.netAfterTaxAnnual).toBe(3300);
    expect(result.netAfterTaxMonthlyAvg).toBe(275);
    expect(result.netPerPay).toBe(275);
  });

  it('should handle different paid months for monthly input', () => {
    const result = computeBrutNet({
      grossValue: 2000,
      inputPeriod: 'monthly',
      paidMonths: 14,
      chargesRate: 0.25,
      withholdingRate: 0.10,
    });

    const brutAnnuel = 2000 * 14; // 28000
    const netAvant = brutAnnuel * (1 - 0.25); // 28000 * 0.75 = 21000
    const netAprès = netAvant * (1 - 0.10); // 21000 * 0.9 = 18900

    expect(result.netBeforeTaxAnnual).toBe(21000);
    expect(result.netBeforeTaxMonthlyAvg).toBe(round(21000 / 12, 2)); // 1750
    expect(result.netAfterTaxAnnual).toBe(18900);
    expect(result.netAfterTaxMonthlyAvg).toBe(round(18900 / 12, 2)); // 1575
    expect(result.netPerPay).toBe(round((brutAnnuel / 14) * (1 - 0.25) * (1 - 0.10), 2)); // (28000/14) * 0.75 * 0.9 = 2000 * 0.75 * 0.9 = 1350
  });
});