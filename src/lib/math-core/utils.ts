export const round = (value: number, decimals: number = 2): number => {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
};

// Fonction IRR simple pour des flux de trésorerie à périodes régulières.
// C'est une implémentation basique et peut ne pas être aussi robuste que XIRR pour des dates irrégulières.
export const irr = (cashFlows: number[], guess: number = 0.1): number => {
  const MAX_ITERATIONS = 1000;
  const PRECISION = 0.00001;

  let r = guess;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let npv = 0;
    let derivative = 0;
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + r, j);
      derivative -= j * cashFlows[j] / Math.pow(1 + r, j + 1);
    }

    if (Math.abs(npv) < PRECISION) {
      return r;
    }
    r = r - npv / derivative;
  }
  return NaN; // N'a pas pu converger
};