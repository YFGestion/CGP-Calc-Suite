import { amortizationSchedule } from './loan';
import { round } from './utils'; // Removed irr import as it's no longer used here

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
  cagr: number; // Changed from irr to cagr
  salePriceAtSale: number; // Prix de cession brut
  netSalePriceBeforeCrd: number; // Nouveau: Prix de cession net de frais (avant remboursement CRD)
  crdAtSale: number;
  capitalRecoveredAtSale: number;
}

export const rentalCashflowIrr = (params: RentalCashflowIrrParams): RentalCashflowIrrResult => {
  const {
    price,
    acqCosts = 0,
    rentAnnualGross,
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
  
  let totalSavingEffortDuringLoan = 0;
  let loanPeriodsCount = 0;
  let postLoanIncomeSum = 0;
  let postLoanYearsCount = 0;

  let finalSalePriceAtSale = 0;
  let finalNetSalePriceBeforeCrd = 0;
  let finalCrdAtSale = 0;
  let finalCapitalRecoveredAtSale = 0;

  for (let year = 1; year <= horizonYears; year++) {
    const currentRentGross = rentAnnualGross;
    const currentRentNet = currentRentGross; // No vacancy rate applied

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
        annuity = annualLoanData.sumPayment;
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
        taxableIncome = Math.max(0, NOI - interest);
        tax = taxableIncome * (tmi + ps);
        break;
    }
    tax = round(tax, 2);

    const cashflow = round(NOI - annuity - tax, 2);
    
    annualTable.push({
      year,
      rentGross: round(currentRentGross, 2),
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

      finalNetSalePriceBeforeCrd = round(currentSalePrice * (1 - saleCostsPct), 2);
      finalCrdAtSale = round(crdEnd, 2);
      finalCapitalRecoveredAtSale = round(finalNetSalePriceBeforeCrd - finalCrdAtSale, 2);

      finalSalePriceAtSale = round(currentSalePrice, 2);
    }
  }

  const avgSavingEffortDuringLoan = loanPeriodsCount > 0 ? round(totalSavingEffortDuringLoan / loanPeriodsCount, 2) : 0;
  const avgPostLoanIncome = postLoanYearsCount > 0 ? round(postLoanIncomeSum / postLoanYearsCount, 2) : 0;

  // Calculate CAGR (TCAC) based on user's formula
  let finalCagr = NaN;
  const initialEquity = round(price + acqCosts - (loan?.amount || 0), 2);

  // Sum of all negative cashflows (efforts) over the entire horizon
  let totalEffortOverHorizon = 0;
  for (const entry of annualTable) {
    if (entry.cashflow < 0) {
      totalEffortOverHorizon += Math.abs(entry.cashflow);
    }
  }

  const totalInvestedCapital = initialEquity + totalEffortOverHorizon;

  if (horizonYears > 0 && totalInvestedCapital > 0) {
    const base = finalCapitalRecoveredAtSale / totalInvestedCapital;
    if (base >= 0) { // Base for Math.pow must be non-negative
      finalCagr = Math.pow(base, 1 / horizonYears) - 1;
    } else {
      finalCagr = -1; // Represents a total loss if final value is negative
    }
  } else if (horizonYears === 0) {
    finalCagr = 0; // No duration, no growth
  } else if (totalInvestedCapital === 0 && finalCapitalRecoveredAtSale > 0) {
    finalCagr = Infinity; // Infinite return if no investment but positive final value
  } else if (totalInvestedCapital === 0 && finalCapitalRecoveredAtSale === 0) {
    finalCagr = 0; // No investment, no return
  } else if (totalInvestedCapital > 0 && finalCapitalRecoveredAtSale <= 0) {
    finalCagr = -1; // Total loss
  }


  return {
    annualTable,
    avgSavingEffortDuringLoan,
    avgPostLoanIncome,
    cagr: round(finalCagr, 4), // Round CAGR to 4 decimal places for percentage
    salePriceAtSale: finalSalePriceAtSale,
    netSalePriceBeforeCrd: finalNetSalePriceBeforeCrd,
    crdAtSale: finalCrdAtSale,
    capitalRecoveredAtSale: finalCapitalRecoveredAtSale,
  };
};