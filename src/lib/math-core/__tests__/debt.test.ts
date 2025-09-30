import { describe, it, expect } from 'vitest';
import { debtCapacity } from '../debt';
import { round } from '../utils';

describe('debtCapacity', () => {
  it('should calculate debt capacity correctly with no rental income or insurance', () => {
    const params = {
      netIncome: 3000,
      existingDebt: 500,
      charges: 0,
      targetDTI: 0.35,
      loan: { rate: 0.03, years: 20 },
    };

    const result = debtCapacity(params);

    expect(result.estimatedMonthlyRent).toBe(0);
    expect(result.consideredIncome).toBe(3000);
    expect(result.currentDTI).toBe(round(500 / 3000, 2)); // 0.17
    expect(result.maxPayment).toBe(round(3000 * 0.35 - 500, 2)); // 1050 - 500 = 550
    expect(result.affordablePrincipal).toBeGreaterThan(0);
    expect(result.projectedDTI).toBe(round((500 + 550) / 3000, 2)); // 0.35

    // Check stress test (should be less than base affordable principal)
    expect(result.stress.length).toBe(2);
    expect(result.stress[0].rateDelta).toBe(0.01);
    expect(result.stress[0].affordablePrincipal).toBeLessThan(result.affordablePrincipal);
    expect(result.stress[1].rateDelta).toBe(0.02);
    expect(result.stress[1].affordablePrincipal).toBeLessThan(result.stress[0].affordablePrincipal);
  });

  it('should calculate debt capacity with rental income', () => {
    const params = {
      netIncome: 3000,
      existingDebt: 500,
      charges: 0,
      targetDTI: 0.35,
      loan: { rate: 0.03, years: 20 },
      rentalYield: 0.05,
      propertyPrice: 200000,
      rentRetention: 0.7,
    };

    const result = debtCapacity(params);

    const expectedMonthlyRent = round((200000 * 0.05) / 12, 2); // 10000 / 12 = 833.33
    const expectedConsideredIncome = round(3000 + expectedMonthlyRent * 0.7, 2); // 3000 + 583.33 = 3583.33

    expect(result.estimatedMonthlyRent).toBe(expectedMonthlyRent);
    expect(result.consideredIncome).toBe(expectedConsideredIncome);
    expect(result.currentDTI).toBe(round(500 / expectedConsideredIncome, 2));
    expect(result.maxPayment).toBe(round(expectedConsideredIncome * 0.35 - 500, 2));
    expect(result.affordablePrincipal).toBeGreaterThan(0);
  });

  it('should handle insurance rate in affordable principal calculation', () => {
    const params = {
      netIncome: 3000,
      existingDebt: 500,
      charges: 0,
      targetDTI: 0.35,
      loan: { rate: 0.03, years: 20, insuranceRate: 0.003 }, // 0.3% annual insurance on initial principal
    };

    const result = debtCapacity(params);

    // With insurance, affordable principal should be lower than without for the same maxPayment
    const paramsNoInsurance = { ...params, loan: { ...params.loan, insuranceRate: undefined } };
    const resultNoInsurance = debtCapacity(paramsNoInsurance);

    expect(result.affordablePrincipal).toBeLessThan(resultNoInsurance.affordablePrincipal);
    expect(result.affordablePrincipal).toBeGreaterThan(0);
  });

  it('should handle zero considered income', () => {
    const params = {
      netIncome: 0,
      existingDebt: 100,
      charges: 100,
      targetDTI: 0.35,
      loan: { rate: 0.03, years: 20 },
    };

    const result = debtCapacity(params);

    expect(result.consideredIncome).toBe(-100); // 0 + 0 - 100
    expect(result.currentDTI).toBe(0); // Cannot divide by negative income, should be 0 or handle error
    expect(result.maxPayment).toBe(round(-100 * 0.35 - 100, 2)); // -35 - 100 = -135
    expect(result.affordablePrincipal).toBe(0); // Cannot afford
    expect(result.projectedDTI).toBe(0);
  });

  it('should handle zero target DTI', () => {
    const params = {
      netIncome: 3000,
      existingDebt: 0,
      charges: 0,
      targetDTI: 0,
      loan: { rate: 0.03, years: 20 },
    };

    const result = debtCapacity(params);
    expect(result.maxPayment).toBe(0);
    expect(result.affordablePrincipal).toBe(0);
    expect(result.projectedDTI).toBe(0);
  });

  it('should handle zero loan years', () => {
    const params = {
      netIncome: 3000,
      existingDebt: 0,
      charges: 0,
      targetDTI: 0.35,
      loan: { rate: 0.03, years: 0 },
    };

    const result = debtCapacity(params);
    expect(result.affordablePrincipal).toBe(0);
  });
});