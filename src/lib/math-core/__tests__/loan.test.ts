import { describe, it, expect } from 'vitest';
import { amortizationSchedule } from '../loan';
import { round } from '../utils';

describe('amortizationSchedule', () => {
  it('should calculate a basic amortization schedule correctly (no insurance)', () => {
    const principal = 100000;
    const rate = 0.03; // 3% annual
    const years = 10;
    const frequency = 12;

    const result = amortizationSchedule({ principal, rate, years, frequency });

    expect(result.schedule.length).toBe(years * frequency);
    expect(result.annualAggregate.length).toBe(years);

    // Verify first period
    const firstPeriod = result.schedule[0];
    const monthlyRate = rate / frequency;
    const expectedMonthlyPayment = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -(years * frequency)));
    const expectedFirstInterest = principal * monthlyRate;
    const expectedFirstPrincipal = expectedMonthlyPayment - expectedFirstInterest;

    expect(firstPeriod.payment).toBe(round(expectedMonthlyPayment, 2));
    expect(firstPeriod.interest).toBe(round(expectedFirstInterest, 2));
    expect(firstPeriod.principal).toBe(round(expectedFirstPrincipal, 2));
    expect(firstPeriod.insurance).toBe(0);
    expect(firstPeriod.crdEnd).toBe(round(principal - expectedFirstPrincipal, 2));

    // Verify last period
    const lastPeriod = result.schedule[result.schedule.length - 1];
    expect(lastPeriod.crdEnd).toBe(0); // Principal should be fully repaid

    // Verify totals
    expect(result.totals.interest).toBeGreaterThan(0);
    expect(result.totals.insurance).toBe(0);
    expect(result.totals.cost).toBe(result.totals.interest);
    expect(result.totals.payments).toBe(round(expectedMonthlyPayment * years * frequency, 2));

    // Verify annual aggregate
    const firstAnnual = result.annualAggregate[0];
    expect(firstAnnual.year).toBe(1);
    expect(firstAnnual.sumInterest).toBeGreaterThan(0);
    expect(firstAnnual.sumPrincipal).toBeGreaterThan(0);
    expect(firstAnnual.sumInsurance).toBe(0);
    expect(firstAnnual.sumPayment).toBe(round(expectedMonthlyPayment * frequency, 2));
    expect(firstAnnual.crdEnd).toBeLessThan(principal);
  });

  it('should handle zero interest rate', () => {
    const principal = 12000;
    const rate = 0;
    const years = 1;
    const frequency = 12;

    const result = amortizationSchedule({ principal, rate, years, frequency });

    expect(result.schedule.length).toBe(12);
    const firstPeriod = result.schedule[0];
    expect(firstPeriod.interest).toBe(0);
    expect(firstPeriod.principal).toBe(1000); // 12000 / 12
    expect(firstPeriod.payment).toBe(1000);
    expect(firstPeriod.crdEnd).toBe(11000);

    const lastPeriod = result.schedule[11];
    expect(lastPeriod.crdEnd).toBe(0);

    expect(result.totals.interest).toBe(0);
    expect(result.totals.payments).toBe(12000);
  });

  it('should calculate insurance based on initialPct mode', () => {
    const principal = 100000;
    const rate = 0.03;
    const years = 10;
    const frequency = 12;
    const insurance = { mode: 'initialPct' as const, value: 0.001 }; // 0.1% of initial principal

    const result = amortizationSchedule({ principal, rate, years, frequency, insurance });

    const totalPeriods = years * frequency;
    const expectedMonthlyInsurance = (principal * insurance.value) / totalPeriods; // 100000 * 0.001 / 120 = 0.08333...
    expect(result.schedule[0].insurance).toBe(round(expectedMonthlyInsurance, 2));
    expect(result.schedule[50].insurance).toBe(round(expectedMonthlyInsurance, 2)); // Constant

    expect(result.totals.insurance).toBe(round(principal * insurance.value, 2)); // 100000 * 0.001 = 100
  });

  it('should calculate insurance based on crdPct mode', () => {
    const principal = 100000;
    const rate = 0.03;
    const years = 1;
    const frequency = 12;
    const insurance = { mode: 'crdPct' as const, value: 0.0001 }; // 0.01% of remaining principal

    const result = amortizationSchedule({ principal, rate, years, frequency, insurance });

    // First period insurance
    const expectedFirstInsurance = principal * insurance.value; // 100000 * 0.0001 = 10
    expect(result.schedule[0].insurance).toBe(round(expectedFirstInsurance, 2));

    // Insurance should decrease as CRD decreases
    expect(result.schedule[0].insurance).toBeGreaterThan(result.schedule[1].insurance);
    expect(result.schedule[11].insurance).toBeGreaterThanOrEqual(0); // Should be very small or 0
    expect(result.schedule[11].insurance).toBeLessThan(expectedFirstInsurance);

    expect(result.totals.insurance).toBeGreaterThan(0);
    expect(result.totals.insurance).toBeLessThan(round(principal * insurance.value * totalPeriods, 2)); // Should be less than if it was always on initial principal
  });

  it('should correctly aggregate annual totals', () => {
    const principal = 100000;
    const rate = 0.03;
    const years = 2;
    const frequency = 12;
    const insurance = { mode: 'initialPct' as const, value: 0.001 };

    const result = amortizationSchedule({ principal, rate, years, frequency, insurance });

    expect(result.annualAggregate.length).toBe(2);

    const firstYear = result.annualAggregate[0];
    const secondYear = result.annualAggregate[1];

    // Sum of first 12 periods for year 1
    const sumInterestY1 = result.schedule.slice(0, 12).reduce((sum, p) => sum + p.interest, 0);
    const sumPrincipalY1 = result.schedule.slice(0, 12).reduce((sum, p) => sum + p.principal, 0);
    const sumInsuranceY1 = result.schedule.slice(0, 12).reduce((sum, p) => sum + p.insurance, 0);
    const sumPaymentY1 = result.schedule.slice(0, 12).reduce((sum, p) => sum + p.payment, 0);

    expect(firstYear.sumInterest).toBe(round(sumInterestY1, 2));
    expect(firstYear.sumPrincipal).toBe(round(sumPrincipalY1, 2));
    expect(firstYear.sumInsurance).toBe(round(sumInsuranceY1, 2));
    expect(firstYear.sumPayment).toBe(round(sumPaymentY1, 2));
    expect(firstYear.crdEnd).toBe(result.schedule[11].crdEnd);

    // Sum of next 12 periods for year 2
    const sumInterestY2 = result.schedule.slice(12, 24).reduce((sum, p) => sum + p.interest, 0);
    const sumPrincipalY2 = result.schedule.slice(12, 24).reduce((sum, p) => sum + p.principal, 0);
    const sumInsuranceY2 = result.schedule.slice(12, 24).reduce((sum, p) => sum + p.insurance, 0);
    const sumPaymentY2 = result.schedule.slice(12, 24).reduce((sum, p) => sum + p.payment, 0);

    expect(secondYear.sumInterest).toBe(round(sumInterestY2, 2));
    expect(secondYear.sumPrincipal).toBe(round(sumPrincipalY2, 2));
    expect(secondYear.sumInsurance).toBe(round(sumInsuranceY2, 2));
    expect(secondYear.sumPayment).toBe(round(sumPaymentY2, 2));
    expect(secondYear.crdEnd).toBe(result.schedule[23].crdEnd);
    expect(secondYear.crdEnd).toBe(0);
  });
});