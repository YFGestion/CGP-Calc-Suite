import { amortizationSchedule } from './loan';
import { irr, round } from './utils';

interface LoanDetails {
  amount: number;
  rate: number; // Annual rate
  years: number;
  insurance: {
    mode: 'initialPct' | 'crdPct';
    value: number; // Percentage (e.g., 0.001 for 0.1%)
  };
}

interface RentalCashflowIrrParams {
  price: number; // Prix d'acquisition du bien
  acqCosts?: number; // Frais d'acquisition (notaire, agence, etc.)
  rentAnnualGross: number;
  vacancyRate: number; // Taux de vacance (e.g., 0.05 pour 5%)
  opex: number; // Dépenses d'exploitation annuelles (hors taxe foncière, gestion, travaux)
  propertyTax: number; // Taxe foncière annuelle
  mgmtFeesPct?: number; // Frais de gestion locative (pourcentage du loyer brut)
  capex: number; // Dépenses de travaux/entretien annuelles (provision)
  horizonYears: number; // Durée de la projection
  saleYear: number; // Année de la vente (doit être <= horizonYears)
  salePriceMode: 'fixed' | 'growth';
  salePrice?: number; // Si 'fixed'
  saleGrowthRate?: number; // Si 'growth' (e.g., 0.02 pour 2% annuel)
  saleCostsPct?: number; // Frais de vente (pourcentage du prix de vente)
  loan?: LoanDetails;
  taxMode: 'none' | 'micro_foncier_30' | 'micro_bic_50' | 'effective_rate';
  tmi?: number; // Taux Marginal d'Imposition (e.g., 0.30)
  ps?: number; // Prélèvements Sociaux (e.g., 0.172)
}

interface AnnualTableEntry {
  year: number;
  rentGross: number;
  vacancy: number;
  rentNet: number;
  opexTotal: number;
  NOI: number; // Net Operating Income
  interest: number;
  principal: number;
  insurance: number;
  annuity: number; // Mensualité de prêt (principal + intérêt + assurance)
  taxableIncome: number;
  tax: number;
  cashflow: number;
  crdEnd: number; // Capital restant dû du prêt à la fin de l'année
}

interface RentalCashflowIrrResult {
  annualTable: AnnualTableEntry[];
  avgSavingEffortDuringLoan: number; // Annual
  avgPostLoanIncome: number; // Annual
  irr: number; // Original TRI
  salePriceAtSale: number;
  crdAtSale: number;
  capitalRecoveredAtSale: number;
  irrSavingEffort: number; // New TRI based on saving effort
}

export const rentalCashflowIrr = (params: RentalCashflowIrrParams): RentalCashflowIrrResult => {
  const {
    price,
    acqCosts = 0,
    rentAnnualGross,
    vacancyRate,
    opex,
    propertyTax,
    mgmtFeesPct = 0,
    capex,
    horizonYears,
    saleYear,
    salePriceMode,
    salePrice = 0,
    saleGrowthRate = 0,
    saleCostsPct = 0,
    loan,
    taxMode,
    tmi = 0,
    ps = 0,
  } = params;

  const initialInvestment = price + acqCosts;
  let loanScheduleResult = loan ? amortizationSchedule({
    principal: loan.amount,
    rate: loan.rate,
    years: loan.years,
    insurance: loan.insurance,
  }) : null;

  const annualTable: AnnualTableEntry[] = [];
  const cashFlows: number[] = [-initialInvestment]; // Initial cash outflow

  let totalSavingEffortDuringLoan = 0;
  let loanPeriodsCount = 0;
  let postLoanIncomeSum = 0;
  let postLoanYearsCount = 0;

  let finalSalePriceAtSale = 0;
  let finalCrdAtSale = 0;
  let finalCapitalRecoveredAtSale = 0;

  for (let year = 1; year <= horizonYears; year++) {
    const currentRentGross = rentAnnualGross; // Assuming rent is constant for simplicity, or could add growth
    const currentVacancy = currentRentGross * vacancyRate;
    const currentRentNet = currentRentGross - currentVacancy;

    const currentMgmtFees = currentRentGross * mgmtFeesPct;
    const opexTotal = opex + propertyTax + currentMgmtFees + capex;

    const NOI = currentRentNet - opexTotal;

    let interest = 0;
    let principal = 0;
    let insurance = 0;
    let annuity = 0;
    let crdEnd = 0;

    if (loanScheduleResult && year <= loan.years) {
      const annualLoanData = loanScheduleResult.annualAggregate.find(agg => agg.year === year);
      if (annualLoanData) {
        interest = annualLoanData.sumInterest;
        principal = annualLoanData.sumPrincipal;
        insurance = annualLoanData.sumInsurance;
        annuity = annualLoanData.sumPayment; // sumPayment includes principal, interest, insurance
        crdEnd = annualLoanData.crdEnd;
      }
    }

    let taxableIncome = 0;
    let tax = 0;

    switch (taxMode) {
      case 'none':
        taxableIncome = 0;
        tax = 0;
        break;
      case 'micro_foncier_30':
        taxableIncome = currentRentGross * 0.70; // 30% abattement
        tax = taxableIncome * (tmi + ps);
        break;
      case 'micro_bic_50':
        taxableIncome = currentRentGross * 0.50; // 50% abattement
        tax = taxableIncome * (tmi + ps);
        break;
      case 'effective_rate':
        // Simplified: taxable income is NOI minus interest, capped at 0
        taxableIncome = Math.max(0, NOI - interest);
        tax = taxableIncome * (tmi + ps);
        break;
    }
    tax = round(tax, 2);

    const cashflow = round(NOI - annuity - tax, 2);
    cashFlows.push(cashflow);

    annualTable.push({
      year,
      rentGross: round(currentRentGross, 2),
      vacancy: round(currentVacancy, 2),
      rentNet: round(currentRentNet, 2),
      opexTotal: round(opexTotal, 2),
      NOI: round(NOI, 2),
      interest: round(interest, 2),
      principal: round(principal, 2),
      insurance: round(insurance, 2),
      annuity: round(annuity, 2),
      taxableIncome: round(taxableIncome, 2),
      tax: round(tax, 2),
      cashflow,
      crdEnd: round(crdEnd, 2),
    });

    if (loan && year <= loan.years) {
      totalSavingEffortDuringLoan += Math.max(0, -cashflow); // If cashflow is negative, it's an effort
      loanPeriodsCount++;
    } else if (year > (loan?.years || 0)) {
      postLoanIncomeSum += cashflow;
      postLoanYearsCount++;
    }

    // Handle sale in the saleYear
    if (year === saleYear) {
      let currentSalePrice = 0;
      if (salePriceMode === 'fixed') {
        currentSalePrice = salePrice;
      } else if (salePriceMode === 'growth') {
        currentSalePrice = price * Math.pow(1 + saleGrowthRate, saleYear);
      }

      const netSaleProceeds = round(currentSalePrice * (1 - saleCostsPct) - crdEnd, 2);
      cashFlows[cashFlows.length - 1] = round(cashFlows[cashFlows.length - 1] + netSaleProceeds, 2);

      finalSalePriceAtSale = round(currentSalePrice, 2);
      finalCrdAtSale = round(crdEnd, 2);
      finalCapitalRecoveredAtSale = round(netSaleProceeds, 2);
    }
  }

  const avgSavingEffortDuringLoan = loanPeriodsCount > 0 ? round(totalSavingEffortDuringLoan / loanPeriodsCount, 2) : 0;
  const avgPostLoanIncome = postLoanYearsCount > 0 ? round(postLoanIncomeSum / postLoanYearsCount, 2) : 0;

  const calculatedIrr = irr(cashFlows);

  // Calculate irrSavingEffort
  let irrSavingEffort = NaN;
  if (avgSavingEffortDuringLoan > 0 && finalCapitalRecoveredAtSale > 0) {
    const avgSavingEffortMonthly = avgSavingEffortDuringLoan / 12;
    const numMonths = horizonYears * 12;
    const savingEffortCashFlows: number[] = [];

    for (let i = 0; i < numMonths; i++) {
      savingEffortCashFlows.push(-avgSavingEffortMonthly);
    }
    savingEffortCashFlows.push(finalCapitalRecoveredAtSale); // Final inflow

    const monthlyIrr = irr(savingEffortCashFlows);
    if (!isNaN(monthlyIrr) && monthlyIrr > -1) { // Ensure monthlyIrr is valid for annualization
      irrSavingEffort = Math.pow(1 + monthlyIrr, 12) - 1;
    }
  } else if (avgSavingEffortDuringLoan === 0 && finalCapitalRecoveredAtSale > 0) {
    // If no saving effort but recovered capital, it's an infinite return, or 0 if no initial investment.
    // For this specific TRI, if there's no effort, it's not a "placement de l'effort".
    irrSavingEffort = NaN; // Or 0 if we consider 0 effort -> 0 return
  } else if (avgSavingEffortDuringLoan > 0 && finalCapitalRecoveredAtSale === 0) {
    // If effort but no recovered capital, it's -100% return
    irrSavingEffort = -1;
  }


  return {
    annualTable,
    avgSavingEffortDuringLoan,
    avgPostLoanIncome,
    irr: round(calculatedIrr, 4), // Round IRR to 4 decimal places for percentage
    salePriceAtSale: finalSalePriceAtSale,
    crdAtSale: finalCrdAtSale,
    capitalRecoveredAtSale: finalCapitalRecoveredAtSale,
    irrSavingEffort: round(irrSavingEffort, 4),
  };
};