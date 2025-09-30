import { round } from './utils';

interface SavingsProjectionParams {
  initial: number;
  periodic: number;
  periodicity: 'monthly' | 'quarterly' | 'yearly';
  years: number;
  grossReturn: number; // Annual gross return (e.g., 0.05 for 5%)
  entryFee?: number; // Percentage (e.g., 0.01 for 1%)
}

interface SavingsSeriesData {
  t: number; // Period number (e.g., month, quarter, year)
  value: number; // Capital at the end of the period
  contrib: number; // Total contributions up to this period
}

interface SavingsProjectionResult {
  finalCapital: number;
  totalContributions: number;
  grossGains: number;
  series: SavingsSeriesData[];
}

export const savingsProjection = (params: SavingsProjectionParams): SavingsProjectionResult => {
  const { initial, periodic, periodicity, years, grossReturn, entryFee = 0 } = params;

  let m: number; // Number of periods per year
  switch (periodicity) {
    case 'monthly':
      m = 12;
      break;
    case 'quarterly':
      m = 4;
      break;
    case 'yearly':
      m = 1;
      break;
  }

  const periodicReturnRate = Math.pow(1 + grossReturn, 1 / m) - 1;
  const totalPeriods = years * m;

  let currentCapital = initial;
  let totalContributions = initial;
  const series: SavingsSeriesData[] = [{ t: 0, value: round(initial, 2), contrib: round(initial, 2) }];

  for (let t = 1; t <= totalPeriods; t++) {
    // Capital grows with interest
    currentCapital *= (1 + periodicReturnRate);

    // Add periodic contribution (if any)
    if (periodic > 0) {
      const netContribution = periodic * (1 - entryFee);
      currentCapital += netContribution;
      totalContributions += periodic;
    }

    series.push({
      t,
      value: round(currentCapital, 2),
      contrib: round(totalContributions, 2),
    });
  }

  const finalCapital = round(currentCapital, 2);
  const grossGains = round(finalCapital - totalContributions, 2);

  return {
    finalCapital,
    totalContributions: round(totalContributions, 2),
    grossGains,
    series,
  };
};