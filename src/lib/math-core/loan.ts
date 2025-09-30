import { round } from './utils';

interface Insurance {
  mode: 'initialPct' | 'crdPct';
  value: number; // Percentage (e.g., 0.001 for 0.1%)
}

interface AmortizationScheduleParams {
  principal: number;
  rate: number; // Annual rate (e.g., 0.03 for 3%)
  years: number;
  frequency?: 12; // Default to monthly
  insurance?: Insurance;
}

interface AmortizationPeriod {
  period: number;
  interest: number;
  principal: number;
  insurance: number;
  payment: number;
  crdEnd: number; // Capital restant dû à la fin de la période
}

interface AnnualAggregate {
  year: number;
  sumInterest: number;
  sumPrincipal: number;
  sumInsurance: number;
  sumPayment: number;
  crdEnd: number; // Capital restant dû à la fin de l'année
}

interface AmortizationScheduleResult {
  schedule: AmortizationPeriod[];
  totals: {
    interest: number;
    insurance: number;
    cost: number; // Total interest + insurance
    payments: number; // Total payments
  };
  annualAggregate: AnnualAggregate[];
}

export const amortizationSchedule = (params: AmortizationScheduleParams): AmortizationScheduleResult => {
  const { principal, rate, years, frequency = 12, insurance } = params;

  const monthlyRate = rate / frequency;
  const totalPayments = years * frequency;

  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = principal / totalPayments;
  } else {
    monthlyPayment = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments));
  }

  let remainingPrincipal = principal;
  const schedule: AmortizationPeriod[] = [];
  const annualAggregateMap = new Map<number, AnnualAggregate>();

  let totalInterest = 0;
  let totalInsurance = 0;
  let totalPaymentsSum = 0;

  for (let i = 1; i <= totalPayments; i++) {
    const interestPayment = remainingPrincipal * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    // Adjust principal payment for the last period to avoid negative remaining principal due to rounding
    if (i === totalPayments) {
      principalPayment = remainingPrincipal;
    }

    let currentInsurance = 0;
    if (insurance) {
      if (insurance.mode === 'initialPct') {
        currentInsurance = (principal * insurance.value) / totalPayments;
      } else if (insurance.mode === 'crdPct') {
        currentInsurance = remainingPrincipal * insurance.value;
      }
    }

    const totalPeriodPayment = monthlyPayment + currentInsurance;

    remainingPrincipal -= principalPayment;

    totalInterest += interestPayment;
    totalInsurance += currentInsurance;
    totalPaymentsSum += totalPeriodPayment;

    const periodData: AmortizationPeriod = {
      period: i,
      interest: round(interestPayment, 2),
      principal: round(principalPayment, 2),
      insurance: round(currentInsurance, 2),
      payment: round(totalPeriodPayment, 2),
      crdEnd: round(Math.max(0, remainingPrincipal), 2),
    };
    schedule.push(periodData);

    const year = Math.ceil(i / frequency);
    if (!annualAggregateMap.has(year)) {
      annualAggregateMap.set(year, {
        year,
        sumInterest: 0,
        sumPrincipal: 0,
        sumInsurance: 0,
        sumPayment: 0,
        crdEnd: 0,
      });
    }
    const annualData = annualAggregateMap.get(year)!;
    annualData.sumInterest = round(annualData.sumInterest + interestPayment, 2);
    annualData.sumPrincipal = round(annualData.sumPrincipal + principalPayment, 2);
    annualData.sumInsurance = round(annualData.sumInsurance + currentInsurance, 2);
    annualData.sumPayment = round(annualData.sumPayment + totalPeriodPayment, 2);
    annualData.crdEnd = periodData.crdEnd; // CRD at the end of the last period of the year
  }

  const annualAggregate = Array.from(annualAggregateMap.values());

  return {
    schedule,
    totals: {
      interest: round(totalInterest, 2),
      insurance: round(totalInsurance, 2),
      cost: round(totalInterest + totalInsurance, 2),
      payments: round(totalPaymentsSum, 2),
    },
    annualAggregate,
  };
};