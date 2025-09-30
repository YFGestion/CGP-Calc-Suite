import { amortizationSchedule } from './loan';
import { round } from './utils';

interface DebtCapacityParams {
  netIncome: number; // Revenu net mensuel
  existingDebt: number; // Dettes existantes (mensualités)
  charges: number; // Charges fixes mensuelles (loyer, autres crédits, etc.)
  targetDTI: number; // Taux d'endettement cible (e.g., 0.35 pour 35%)
  loan: {
    rate: number; // Taux annuel du nouveau prêt
    years: number;
    insuranceRate?: number; // Taux d'assurance annuel (pourcentage du capital initial)
  };
  rentalYield?: number; // Rendement locatif annuel (e.g., 0.05 pour 5%)
  propertyPrice?: number; // Prix du bien immobilier (si investissement locatif)
  rentRetention?: number; // Pourcentage des loyers pris en compte (e.g., 0.7 pour 70%)
}

interface DebtCapacityResult {
  estimatedMonthlyRent: number;
  consideredIncome: number;
  currentDTI: number;
  maxPayment: number;
  affordablePrincipal: number;
  projectedDTI: number;
  stress: Array<{
    rateDelta: number;
    maxPayment: number;
    affordablePrincipal: number;
  }>;
}

export const debtCapacity = (params: DebtCapacityParams): DebtCapacityResult => {
  const {
    netIncome,
    existingDebt,
    charges,
    targetDTI,
    loan,
    rentalYield,
    propertyPrice,
    rentRetention = 0.7, // Default to 70% retention
  } = params;

  // 1. Loyer estimé
  const estimatedMonthlyRent = (rentalYield && propertyPrice)
    ? round((propertyPrice * rentalYield) / 12, 2)
    : 0;

  // 2. Revenu pris en compte
  const consideredIncome = round(netIncome + estimatedMonthlyRent * rentRetention - charges, 2);

  // 3. Taux d'endettement actuel (avant nouveau prêt)
  const currentDTI = consideredIncome > 0 ? round(existingDebt / consideredIncome, 2) : 0;

  // 4. Mensualité maximale du nouveau prêt
  const maxPayment = round(consideredIncome * targetDTI - existingDebt, 2);

  // 5. Capital empruntable maximal
  let affordablePrincipal = 0;
  if (maxPayment > 0 && loan.years > 0) {
    const monthlyRate = loan.rate / 12;
    const totalPayments = loan.years * 12;
    let effectiveMonthlyPayment = maxPayment;

    // Adjust maxPayment for insurance if applicable (assuming initialPct for simplicity here)
    let monthlyInsuranceCost = 0;
    if (loan.insuranceRate && loan.insuranceRate > 0) {
      // For initialPct, insurance is based on the principal, so we need to solve for principal
      // P = (maxPayment - (P * insuranceRate / totalPayments)) / (r / (1-(1+r)^-n))
      // P * (r / (1-(1+r)^-n) + insuranceRate / totalPayments) = maxPayment
      // P = maxPayment / (r / (1-(1+r)^-n) + insuranceRate / totalPayments)
      const factor = monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments));
      affordablePrincipal = maxPayment / (factor + (loan.insuranceRate / totalPayments));
      monthlyInsuranceCost = (affordablePrincipal * loan.insuranceRate) / totalPayments;
      effectiveMonthlyPayment = maxPayment - monthlyInsuranceCost; // This is the part for principal+interest
    } else {
      // No insurance or insurance is handled separately
      if (monthlyRate === 0) {
        affordablePrincipal = effectiveMonthlyPayment * totalPayments;
      } else {
        affordablePrincipal = effectiveMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate;
      }
    }
    affordablePrincipal = round(affordablePrincipal, 2);
  }

  // 6. Taux d'endettement projeté (si prêt max est contracté)
  const projectedDTI = consideredIncome > 0
    ? round((existingDebt + maxPayment) / consideredIncome, 2)
    : 0;

  // 7. Stress test
  const stress: Array<{ rateDelta: number; maxPayment: number; affordablePrincipal: number }> = [];
  [0.01, 0.02].forEach(delta => { // +1% and +2% rate increase
    const stressedRate = loan.rate + delta;
    let stressedMonthlyPayment = 0;
    const totalPayments = loan.years * 12;
    const stressedMonthlyRate = stressedRate / 12;

    if (stressedMonthlyRate === 0) {
      stressedMonthlyPayment = affordablePrincipal / totalPayments;
    } else {
      stressedMonthlyPayment = affordablePrincipal * stressedMonthlyRate / (1 - Math.pow(1 + stressedMonthlyRate, -totalPayments));
    }

    let stressedInsuranceCost = 0;
    if (loan.insuranceRate && loan.insuranceRate > 0) {
      stressedInsuranceCost = (affordablePrincipal * loan.insuranceRate) / totalPayments;
    }
    const stressedTotalPayment = round(stressedMonthlyPayment + stressedInsuranceCost, 2);

    const stressedMaxPayment = round(consideredIncome * targetDTI - existingDebt, 2); // Max payment is still limited by DTI
    let stressedAffordablePrincipal = 0;

    if (stressedMaxPayment > 0 && loan.years > 0) {
      let effectiveStressedMonthlyPayment = stressedMaxPayment;
      let stressedMonthlyInsuranceForPrincipalCalc = 0;
      if (loan.insuranceRate && loan.insuranceRate > 0) {
        // Recalculate affordable principal with stressed rate and insurance
        const factor = stressedMonthlyRate / (1 - Math.pow(1 + stressedMonthlyRate, -totalPayments));
        stressedAffordablePrincipal = stressedMaxPayment / (factor + (loan.insuranceRate / totalPayments));
        stressedMonthlyInsuranceForPrincipalCalc = (stressedAffordablePrincipal * loan.insuranceRate) / totalPayments;
        effectiveStressedMonthlyPayment = stressedMaxPayment - stressedMonthlyInsuranceForPrincipalCalc;
      } else {
        if (stressedMonthlyRate === 0) {
          stressedAffordablePrincipal = effectiveStressedMonthlyPayment * totalPayments;
        } else {
          stressedAffordablePrincipal = effectiveStressedMonthlyPayment * (1 - Math.pow(1 + stressedMonthlyRate, -totalPayments)) / stressedMonthlyRate;
        }
      }
      stressedAffordablePrincipal = round(stressedAffordablePrincipal, 2);
    }

    stress.push({
      rateDelta: delta,
      maxPayment: stressedMaxPayment,
      affordablePrincipal: stressedAffordablePrincipal,
    });
  });

  return {
    estimatedMonthlyRent,
    consideredIncome,
    currentDTI,
    maxPayment,
    affordablePrincipal,
    projectedDTI,
    stress,
  };
};