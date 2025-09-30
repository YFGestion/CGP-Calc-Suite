import { describe, it, expect } from 'vitest';
import { rentalCashflowIrr } from '../rental';
import { round } from '../utils';

describe('rentalCashflowIrr', () => {
  const baseParams = {
    price: 200000,
    acqCosts: 10000,
    rentAnnualGross: 12000, // 1000/month
    vacancyRate: 0.05, // 5%
    opex: 1000,
    propertyTax: 800,
    mgmtFeesPct: 0.08, // 8%
    capex: 500,
    horizonYears: 10,
    saleYear: 10,
    salePriceMode: 'growth' as const,
    saleGrowthRate: 0.02,
    saleCostsPct: 0.07,
    taxMode: 'none' as const,
    tmi: 0,
    ps: 0,
  };

  it('should calculate cashflow and IRR correctly without a loan or taxes', () => {
    const result = rentalCashflowIrr(baseParams);

    expect(result.annualTable.length).toBe(baseParams.horizonYears);
    expect(result.annualTable[0].year).toBe(1);

    // Check first year calculations
    const firstYear = result.annualTable[0];
    const expectedRentNet = baseParams.rentAnnualGross * (1 - baseParams.vacancyRate); // 12000 * 0.95 = 11400
    const expectedMgmtFees = baseParams.rentAnnualGross * baseParams.mgmtFeesPct; // 12000 * 0.08 = 960
    const expectedOpexTotal = baseParams.opex + baseParams.propertyTax + expectedMgmtFees + baseParams.capex; // 1000 + 800 + 960 + 500 = 3260
    const expectedNOI = expectedRentNet - expectedOpexTotal; // 11400 - 3260 = 8140

    expect(firstYear.rentNet).toBe(round(expectedRentNet, 2));
    expect(firstYear.opexTotal).toBe(round(expectedOpexTotal, 2));
    expect(firstYear.NOI).toBe(round(expectedNOI, 2));
    expect(firstYear.interest).toBe(0);
    expect(firstYear.principal).toBe(0);
    expect(firstYear.insurance).toBe(0);
    expect(firstYear.annuity).toBe(0);
    expect(firstYear.tax).toBe(0);
    expect(firstYear.cashflow).toBe(round(expectedNOI, 2));

    // Check IRR is calculated
    expect(result.irr).not.toBeNaN();
    expect(result.irr).toBeGreaterThan(-1); // Should be a reasonable positive IRR
  });

  it('should calculate cashflow and IRR with a loan (initialPct insurance)', () => {
    const loanDetails = {
      amount: 160000,
      rate: 0.02,
      years: 15,
      insurance: { mode: 'initialPct' as const, value: 0.001 }, // 0.1%
    };
    const paramsWithLoan = { ...baseParams, loan: loanDetails, horizonYears: 15, saleYear: 15 };
    const result = rentalCashflowIrr(paramsWithLoan);

    expect(result.annualTable.length).toBe(paramsWithLoan.horizonYears);
    expect(result.annualTable[0].annuity).toBeGreaterThan(0);
    expect(result.annualTable[0].interest).toBeGreaterThan(0);
    expect(result.annualTable[0].principal).toBeGreaterThan(0);
    expect(result.annualTable[0].insurance).toBeGreaterThan(0);

    // CRD should decrease over time
    expect(result.annualTable[0].crdEnd).toBeLessThan(loanDetails.amount);
    expect(result.annualTable[loanDetails.years - 1].crdEnd).toBe(0); // Loan fully repaid

    // Cashflow should be lower during loan period
    expect(result.annualTable[0].cashflow).toBeLessThan(baseParams.rentAnnualGross);

    // Post-loan income should be higher
    expect(result.avgPostLoanIncome).toBeGreaterThan(result.avgSavingEffortDuringLoan);
    expect(result.irr).not.toBeNaN();
  });

  it('should calculate cashflow and IRR with a loan (crdPct insurance)', () => {
    const loanDetails = {
      amount: 160000,
      rate: 0.02,
      years: 15,
      insurance: { mode: 'crdPct' as const, value: 0.0001 }, // 0.01% of CRD
    };
    const paramsWithLoan = { ...baseParams, loan: loanDetails, horizonYears: 15, saleYear: 15 };
    const result = rentalCashflowIrr(paramsWithLoan);

    expect(result.annualTable[0].insurance).toBeGreaterThan(result.annualTable[1].insurance); // Insurance should decrease
    expect(result.irr).not.toBeNaN();
  });

  it('should handle different tax modes (micro_foncier_30)', () => {
    const paramsWithTax = { ...baseParams, taxMode: 'micro_foncier_30' as const, tmi: 0.30, ps: 0.172 };
    const result = rentalCashflowIrr(paramsWithTax);

    const firstYear = result.annualTable[0];
    const expectedTaxableIncome = baseParams.rentAnnualGross * 0.70; // 12000 * 0.7 = 8400
    const expectedTax = expectedTaxableIncome * (0.30 + 0.172); // 8400 * 0.472 = 3964.8
    expect(firstYear.taxableIncome).toBe(round(expectedTaxableIncome, 2));
    expect(firstYear.tax).toBe(round(expectedTax, 2));
    expect(firstYear.cashflow).toBe(round(firstYear.NOI - expectedTax, 2));
    expect(result.irr).not.toBeNaN();
  });

  it('should handle different tax modes (effective_rate) with a loan', () => {
    const loanDetails = {
      amount: 160000,
      rate: 0.02,
      years: 1, // Short loan for easier testing
      insurance: { mode: 'initialPct' as const, value: 0.001 },
    };
    const paramsWithTaxAndLoan = {
      ...baseParams,
      loan: loanDetails,
      taxMode: 'effective_rate' as const,
      tmi: 0.30,
      ps: 0.172,
      horizonYears: 2,
      saleYear: 2,
    };
    const result = rentalCashflowIrr(paramsWithTaxAndLoan);

    const firstYear = result.annualTable[0];
    // NOI = 8140 (from baseParams)
    // Interest from loan schedule for year 1
    const loanResult = amortizationSchedule({ principal: loanDetails.amount, rate: loanDetails.rate, years: loanDetails.years, insurance: loanDetails.insurance });
    const expectedInterestY1 = loanResult.annualAggregate[0].sumInterest;

    const expectedTaxableIncome = Math.max(0, firstYear.NOI - expectedInterestY1);
    const expectedTax = expectedTaxableIncome * (0.30 + 0.172);

    expect(firstYear.taxableIncome).toBe(round(expectedTaxableIncome, 2));
    expect(firstYear.tax).toBe(round(expectedTax, 2));
    expect(result.irr).not.toBeNaN();
  });

  it('should handle fixed sale price', () => {
    const paramsFixedSale = { ...baseParams, salePriceMode: 'fixed' as const, salePrice: 250000, saleYear: 5, horizonYears: 5 };
    const result = rentalCashflowIrr(paramsFixedSale);

    const initialInvestment = baseParams.price + baseParams.acqCosts; // 210000
    const expectedSalePrice = 250000;
    const expectedNetSaleProceeds = round(expectedSalePrice * (1 - baseParams.saleCostsPct), 2); // 250000 * 0.93 = 232500

    // The cashflow of the sale year should include the net sale proceeds
    const cashFlows = [-initialInvestment];
    for (let i = 0; i < 4; i++) { // First 4 years
      cashFlows.push(result.annualTable[i].cashflow);
    }
    cashFlows.push(round(result.annualTable[4].cashflow + expectedNetSaleProceeds, 2)); // Year 5 cashflow + net sale proceeds

    expect(result.irr).toBe(round(irr(cashFlows), 4));
  });

  it('should handle growth sale price', () => {
    const paramsGrowthSale = { ...baseParams, salePriceMode: 'growth' as const, saleGrowthRate: 0.03, saleYear: 5, horizonYears: 5 };
    const result = rentalCashflowIrr(paramsGrowthSale);

    const initialInvestment = baseParams.price + baseParams.acqCosts; // 210000
    const expectedSalePrice = baseParams.price * Math.pow(1 + paramsGrowthSale.saleGrowthRate, paramsGrowthSale.saleYear); // 200000 * (1.03)^5 = 231854.65
    const expectedNetSaleProceeds = round(expectedSalePrice * (1 - baseParams.saleCostsPct), 2); // 231854.65 * 0.93 = 215624.82

    const cashFlows = [-initialInvestment];
    for (let i = 0; i < 4; i++) { // First 4 years
      cashFlows.push(result.annualTable[i].cashflow);
    }
    cashFlows.push(round(result.annualTable[4].cashflow + expectedNetSaleProceeds, 2)); // Year 5 cashflow + net sale proceeds

    expect(result.irr).toBe(round(irr(cashFlows), 4));
  });

  it('should correctly calculate avgSavingEffortDuringLoan and avgPostLoanIncome', () => {
    const loanDetails = {
      amount: 100000,
      rate: 0.04,
      years: 5,
      insurance: { mode: 'initialPct' as const, value: 0.002 },
    };
    const paramsWithLoan = { ...baseParams, loan: loanDetails, horizonYears: 10, saleYear: 10 };
    const result = rentalCashflowIrr(paramsWithLoan);

    let expectedSavingEffort = 0;
    for (let i = 0; i < loanDetails.years; i++) {
      expectedSavingEffort += Math.max(0, -result.annualTable[i].cashflow);
    }
    expect(result.avgSavingEffortDuringLoan).toBe(round(expectedSavingEffort / loanDetails.years, 2));

    let expectedPostLoanIncome = 0;
    for (let i = loanDetails.years; i < baseParams.horizonYears; i++) {
      expectedPostLoanIncome += result.annualTable[i].cashflow;
    }
    expect(result.avgPostLoanIncome).toBe(round(expectedPostLoanIncome / (baseParams.horizonYears - loanDetails.years), 2));
  });

  it('should handle zero horizon years', () => {
    const params = { ...baseParams, horizonYears: 0, saleYear: 0 };
    const result = rentalCashflowIrr(params);
    expect(result.annualTable.length).toBe(0);
    expect(result.irr).toBeNaN();
  });

  it('should handle saleYear before horizonYears', () => {
    const params = { ...baseParams, saleYear: 2, horizonYears: 5 };
    const result = rentalCashflowIrr(params);
    expect(result.annualTable.length).toBe(5);
    // The cashflow for year 2 should include sale proceeds
    const initialInvestment = baseParams.price + baseParams.acqCosts;
    const expectedSalePrice = baseParams.price * Math.pow(1 + baseParams.saleGrowthRate, params.saleYear);
    const expectedNetSaleProceeds = round(expectedSalePrice * (1 - baseParams.saleCostsPct), 2);

    const cashFlows = [-initialInvestment];
    cashFlows.push(result.annualTable[0].cashflow); // Year 1
    cashFlows.push(round(result.annualTable[1].cashflow + expectedNetSaleProceeds, 2)); // Year 2 with sale
    cashFlows.push(result.annualTable[2].cashflow); // Year 3
    cashFlows.push(result.annualTable[3].cashflow); // Year 4
    cashFlows.push(result.annualTable[4].cashflow); // Year 5

    expect(result.irr).toBe(round(irr(cashFlows), 4));
  });
});