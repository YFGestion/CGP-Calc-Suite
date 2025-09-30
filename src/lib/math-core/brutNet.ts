import { round } from './utils';

interface ComputeBrutNetParams {
  grossValue: number;
  inputPeriod: 'monthly' | 'annual';
  paidMonths: 12 | 13 | 14 | 15;
  chargesRate: number; // 0-0.5
  withholdingRate: number; // 0-0.45
}

interface ComputeBrutNetResult {
  netBeforeTaxAnnual: number;
  netBeforeTaxMonthlyAvg: number;
  netAfterTaxAnnual: number;
  netAfterTaxMonthlyAvg: number;
  netPerPay: number;
}

export const computeBrutNet = (params: ComputeBrutNetParams): ComputeBrutNetResult => {
  const { grossValue, inputPeriod, paidMonths, chargesRate, withholdingRate } = params;

  const brutAnnuel = inputPeriod === 'monthly' ? grossValue * paidMonths : grossValue;
  const netAvant = brutAnnuel * (1 - chargesRate);
  const netAprès = netAvant * (1 - withholdingRate);

  const netBeforeTaxAnnual = round(netAvant, 2);
  const netBeforeTaxMonthlyAvg = round(netAvant / 12, 2);
  const netAfterTaxAnnual = round(netAprès, 2);
  const netAfterTaxMonthlyAvg = round(netAprès / 12, 2);
  const netPerPay = round((brutAnnuel / paidMonths) * (1 - chargesRate) * (1 - withholdingRate), 2);

  return {
    netBeforeTaxAnnual,
    netBeforeTaxMonthlyAvg,
    netAfterTaxAnnual,
    netAfterTaxMonthlyAvg,
    netPerPay,
  };
};