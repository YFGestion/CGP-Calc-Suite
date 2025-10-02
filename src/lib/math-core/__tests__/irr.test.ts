import { describe, it, expect } from 'vitest';
import { solveMonthlyRateForFV, monthlyToAnnual, annualToMonthly, solveAnnualRateFromAnnuityFV } from '../irr';
import { round } from '../utils';

describe('monthlyToAnnual', () => {
  it('should convert a monthly rate to an annual rate correctly', () => {
    expect(monthlyToAnnual(0.005)).toBeCloseTo(0.06167781186449999); // (1+0.005)^12 - 1
    expect(monthlyToAnnual(0)).toBe(0);
    expect(monthlyToAnnual(0.01)).toBeCloseTo(0.1268250301319697);
  });

  it('should throw an error for monthly rate <= -1', () => {
    expect(() => monthlyToAnnual(-1)).toThrow("Le taux mensuel doit être supérieur à -1 (-100%).");
    expect(() => monthlyToAnnual(-1.5)).toThrow("Le taux mensuel doit être supérieur à -1 (-100%).");
  });
});

describe('annualToMonthly', () => {
  it('should convert an annual rate to a monthly rate correctly', () => {
    expect(annualToMonthly(0.06167781186449999)).toBeCloseTo(0.005); // (1+0.06167781186449999)^(1/12) - 1
    expect(annualToMonthly(0)).toBe(0);
    expect(annualToMonthly(0.1268250301319697)).toBeCloseTo(0.01);
  });

  it('should throw an error for annual rate <= -1', () => {
    expect(() => annualToMonthly(-1)).toThrow("Le taux annuel doit être supérieur à -1 (-100%).");
    expect(() => annualToMonthly(-1.5)).toThrow("Le taux annuel doit être supérieur à -1 (-100%).");
  });
});

describe('solveMonthlyRateForFV', () => {
  // Helper function to calculate FV for verification
  const calculateFV = (C0: number, PMT: number, r: number, n: number): number => {
    if (Math.abs(r) < 1e-8) {
      return C0 * Math.pow(1 + r, n) + PMT * n;
    }
    return C0 * Math.pow(1 + r, n) + PMT * (Math.pow(1 + r, n) - 1) / r;
  };

  it('Cas 1 (vos données): C0=0, PMT=175.21, years=25 => n=300, FV=115441.12', () => {
    const C0 = 0;
    const PMT = 175.21;
    const n = 300;
    const FV = 115441.12;
    const rMonthly = solveMonthlyRateForFV({ finalCapital: FV, initialCapital: C0, monthlyContribution: PMT, months: n });
    const rAnnual = monthlyToAnnual(rMonthly);
    expect(rAnnual).toBeCloseTo(0.0582, 4); // ≈ 5,82 %
  });

  it('Cas 2 (contrôle): C0=0, PMT=100, n=120, rMonthly_théo=0.005', () => {
    const rMonthly_theo = 0.005;
    const C0 = 0;
    const PMT = 100;
    const n = 120;
    const FV_theo = calculateFV(C0, PMT, rMonthly_theo, n); // Calculate expected FV
    
    const rMonthly_solved = solveMonthlyRateForFV({ finalCapital: FV_theo, initialCapital: C0, monthlyContribution: PMT, months: n });
    expect(rMonthly_solved).toBeCloseTo(rMonthly_theo, 6);
  });

  it('Cas 3 (r proche de 0): C0=0, PMT=100, n=120, FV ≈ PMT*n', () => {
    const C0 = 0;
    const PMT = 100;
    const n = 120;
    const FV = PMT * n; // FV = 12000
    const rMonthly = solveMonthlyRateForFV({ finalCapital: FV, initialCapital: C0, monthlyContribution: PMT, months: n });
    expect(rMonthly).toBeCloseTo(0, 6);
  });

  it('Cas 4 (avec C0 > 0): C0=5000, PMT=200, n=240, rAnnual_théo=0.04', () => {
    const rAnnual_theo = 0.04;
    const rMonthly_theo = annualToMonthly(rAnnual_theo);
    const C0 = 5000;
    const PMT = 200;
    const n = 240;
    const FV_theo = calculateFV(C0, PMT, rMonthly_theo, n);

    const rMonthly_solved = solveMonthlyRateForFV({ finalCapital: FV_theo, initialCapital: C0, monthlyContribution: PMT, months: n });
    const rAnnual_solved = monthlyToAnnual(rMonthly_solved);
    expect(rAnnual_solved).toBeCloseTo(rAnnual_theo, 4);
  });

  it('should throw an error for invalid inputs (C0=0, PMT=0)', () => {
    expect(() => solveMonthlyRateForFV({ finalCapital: 100, initialCapital: 0, monthlyContribution: 0, months: 12 }))
      .toThrow("Le capital initial et le versement mensuel ne peuvent pas être tous deux nuls.");
  });

  it('should throw an error if no bracketing interval is found (e.g., FV too low)', () => {
    expect(() => solveMonthlyRateForFV({ finalCapital: 100, initialCapital: 1000, monthlyContribution: 10, months: 12 }))
      .toThrow("Impossible de trouver un intervalle de bracketing pour le taux. Vérifiez les entrées (FV, C0, PMT, months).");
  });

  it('should handle negative monthly rate if FV is less than contributions', () => {
    const C0 = 1000;
    const PMT = 100;
    const n = 12;
    const FV = 1000; // Final capital is less than initial + contributions
    const rMonthly = solveMonthlyRateForFV({ finalCapital: FV, initialCapital: C0, monthlyContribution: PMT, months: n });
    expect(rMonthly).toBeLessThan(0);
    expect(calculateFV(C0, PMT, rMonthly, n)).toBeCloseTo(FV, 2);
  });

  it('should handle large positive rates', () => {
    const C0 = 100;
    const PMT = 10;
    const n = 12;
    const FV = 10000; // Very high final value
    const rMonthly = solveMonthlyRateForFV({ finalCapital: FV, initialCapital: C0, monthlyContribution: PMT, months: n });
    expect(rMonthly).toBeGreaterThan(0.1); // Expect a high positive rate
    expect(calculateFV(C0, PMT, rMonthly, n)).toBeCloseTo(FV, 2);
  });
});

describe('solveAnnualRateFromAnnuityFV', () => {
  it('should calculate annual rate correctly for Cas 1', () => {
    const result = solveAnnualRateFromAnnuityFV({ finalCapital: 115441.12, initialCapital: 0, monthlyContribution: 175.21, years: 25 });
    expect(result.rAnnual).toBeCloseTo(0.0582, 4);
  });

  it('should calculate annual rate correctly for Cas 4', () => {
    const rAnnual_theo = 0.04;
    const rMonthly_theo = annualToMonthly(rAnnual_theo);
    const C0 = 5000;
    const PMT = 200;
    const n = 240; // 20 years * 12 months
    const FV_theo = (C0 * Math.pow(1 + rMonthly_theo, n) + PMT * (Math.pow(1 + rMonthly_theo, n) - 1) / rMonthly_theo);
    
    const result = solveAnnualRateFromAnnuityFV({ finalCapital: FV_theo, initialCapital: C0, monthlyContribution: PMT, years: 20 });
    expect(result.rAnnual).toBeCloseTo(rAnnual_theo, 4);
  });

  it('should return 0 for no capital movement', () => {
    const result = solveAnnualRateFromAnnuityFV({ finalCapital: 0, initialCapital: 0, monthlyContribution: 0, years: 10 });
    expect(result.rMonthly).toBe(0);
    expect(result.rAnnual).toBe(0);
  });

  it('should throw an error for invalid years', () => {
    expect(() => solveAnnualRateFromAnnuityFV({ finalCapital: 100, initialCapital: 0, monthlyContribution: 10, years: 0 }))
      .toThrow("La durée en années doit être un entier supérieur ou égal à 1.");
    expect(() => solveAnnualRateFromAnnuityFV({ finalCapital: 100, initialCapital: 0, monthlyContribution: 10, years: -5 }))
      .toThrow("La durée en années doit être un entier supérieur ou égal à 1.");
  });

  it('should throw an error if finalCapital is positive but no contributions/initial capital', () => {
    expect(() => solveAnnualRateFromAnnuityFV({ finalCapital: 100, initialCapital: 0, monthlyContribution: 0, years: 1 }))
      .toThrow("Impossible d'atteindre un capital final positif sans capital initial ni contributions.");
  });

  it('should handle cases where FV is less than total contributions', () => {
    const result = solveAnnualRateFromAnnuityFV({ finalCapital: 5000, initialCapital: 10000, monthlyContribution: 100, years: 1 }); // 10000 + 1200 = 11200, but FV is 5000
    expect(result.rAnnual).toBeLessThan(0);
  });
});