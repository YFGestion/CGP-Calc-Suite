"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy as CopyIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '@/utils/toast';
import { formatCurrency, formatPercent } from '@/lib/format';
import i18n from '@/app/i18n'; // Import i18n instance for formatting

interface ModuleSummaryExporterProps {
  moduleName: string; // e.g., "epargne", "immo"
  moduleTitle: string; // Translated title of the module
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  summaryText: string; // The existing detailed text summary
  recommendations?: string; // Optional recommendations text
}

// Helper function to generate HTML table summary based on module
const generateHtmlTableSummary = (
  moduleName: string,
  moduleTitle: string,
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown> | null,
  recommendations: string | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  let html = `<h3 class="text-lg font-semibold mb-2">${moduleTitle}</h3>`;
  html += `<p class="text-sm text-muted-foreground mb-4">${t('moduleSummaryExporter:generatedOn', { date: new Date().toLocaleDateString(i18n.language) })}</p>`;

  // Inputs Section
  html += `<h4 class="text-md font-semibold mt-4 mb-2">${t('moduleSummaryExporter:keyInputs')}</h4>`;
  html += `<table class="w-full border-collapse text-sm"><thead><tr><th class="border p-2 text-left bg-accent text-accent-foreground">${t('moduleSummaryExporter:parameter')}</th><th class="border p-2 text-left bg-accent text-accent-foreground">${t('moduleSummaryExporter:value')}</th></tr></thead><tbody>`;

  const addInputRow = (labelKey: string, value: unknown, formatter?: (val: unknown) => string) => {
    const formattedValue = formatter ? formatter(value) : String(value);
    html += `<tr><td class="border p-2">${t(labelKey)}</td><td class="border p-2">${formattedValue}</td></tr>`;
  };

  switch (moduleName) {
    case 'epargne':
      addInputRow('epargnePage:initialDepositLabel', inputs.initialDeposit, (val) => formatCurrency(val as number));
      addInputRow('epargnePage:periodicDepositLabel', inputs.periodicDeposit, (val) => formatCurrency(val as number));
      addInputRow('epargnePage:periodicityLabel', inputs.periodicity, (val) => t(`epargnePage:${val as string}`));
      addInputRow('epargnePage:durationLabel', inputs.duration, (val) => `${val} ${t('common:years')}`);
      addInputRow('epargnePage:returnRateLabel', inputs.returnRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      if (inputs.applyEntryFee) {
        addInputRow('epargnePage:entryFeeLabel', inputs.entryFee, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      }
      break;
    case 'endettement':
      addInputRow('endettementPage:netIncomeLabel', inputs.netIncome, (val) => formatCurrency(val as number));
      addInputRow('endettementPage:existingDebtLabel', inputs.existingDebt, (val) => formatCurrency(val as number));
      addInputRow('endettementPage:chargesLabel', inputs.charges, (val) => formatCurrency(val as number));
      addInputRow('endettementPage:targetDTILabel', inputs.targetDTI, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      addInputRow('endettementPage:loanRateLabel', inputs.loanRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      addInputRow('endettementPage:loanDurationYearsLabel', inputs.loanDurationYears, (val) => `${val} ${t('common:years')}`);
      if (inputs.loanApplyInsurance) {
        addInputRow('endettementPage:loanInsuranceModeLabel', inputs.loanInsuranceMode, (val) => t(`endettementPage:${val as string}`));
        addInputRow('endettementPage:loanInsuranceRateLabel', inputs.loanInsuranceRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      }
      if (inputs.applyRentalInvestment) {
        addInputRow('endettementPage:propertyPriceLabel', inputs.propertyPrice, (val) => formatCurrency(val as number));
        addInputRow('endettementPage:rentalYieldLabel', inputs.rentalYield, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
        addInputRow('endettementPage:rentRetentionLabel', inputs.rentRetention, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      }
      break;
    case 'credit':
      addInputRow('creditPage:loanAmountLabel', inputs.loanAmount, (val) => formatCurrency(val as number));
      addInputRow('creditPage:nominalRateLabel', inputs.nominalRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      addInputRow('creditPage:durationYearsLabel', inputs.durationYears, (val) => `${val} ${t('common:years')}`);
      if (inputs.applyInsurance) {
        addInputRow('creditPage:insuranceModeLabel', inputs.insuranceMode, (val) => t(`creditPage:${val as string}`));
        addInputRow('creditPage:insuranceRateLabel', inputs.insuranceRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      }
      break;
    case 'immo':
      addInputRow('immoPage:priceLabel', inputs.price, (val) => formatCurrency(val as number));
      if (inputs.applyAcqCosts) {
        addInputRow('immoPage:acqCostsLabel', inputs.acqCosts, (val) => formatCurrency(val as number));
      }
      addInputRow('immoPage:rentInputModeLabel', inputs.rentInputMode, (val) => t(`immoPage:${val as string}`));
      if (inputs.rentInputMode === 'fixedAmount') {
        addInputRow('immoPage:rentGrossLabel', inputs.rentGross, (val) => formatCurrency(val as number));
        addInputRow('immoPage:rentPeriodicityLabel', inputs.rentPeriodicity, (val) => t(`immoPage:${val as string}`));
      } else if (inputs.rentInputMode === 'yieldPct') {
        addInputRow('immoPage:expectedYieldLabel', inputs.expectedYield, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      }
      if (inputs.applyOpexAndTax) {
        addInputRow('immoPage:opexLabel', inputs.opex, (val) => formatCurrency(val as number));
        addInputRow('immoPage:propertyTaxLabel', inputs.propertyTax, (val) => formatCurrency(val as number));
        addInputRow('immoPage:capexLabel', inputs.capex, (val) => formatCurrency(val as number));
      }
      if (inputs.applyMgmtFees) {
        addInputRow('immoPage:mgmtFeesTypeLabel', inputs.mgmtFeesType, (val) => t(`immoPage:${val as string}`));
        addInputRow('immoPage:mgmtFeesValueLabel', inputs.mgmtFeesValue, (val) => formatCurrency(val as number));
      }
      addInputRow('immoPage:horizonYearsLabel', inputs.horizonYears, (val) => `${val} ${t('common:years')}`);
      addInputRow('immoPage:saleYearLabel', inputs.saleYear, (val) => `${val} ${t('common:years')}`);
      addInputRow('immoPage:salePriceModeLabel', inputs.salePriceMode, (val) => t(`immoPage:salePrice${(val as string).charAt(0).toUpperCase() + (val as string).slice(1)}`));
      if (inputs.salePriceMode === 'fixed') {
        addInputRow('immoPage:salePriceLabel', inputs.salePrice, (val) => formatCurrency(val as number));
      } else if (inputs.salePriceMode === 'growth') {
        addInputRow('immoPage:saleGrowthRateLabel', inputs.saleGrowthRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      }
      addInputRow('immoPage:saleCostsPctLabel', inputs.saleCostsPct, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      if (inputs.applyLoan) {
        addInputRow('immoPage:loanAmountLabel', inputs.loanAmount, (val) => formatCurrency(val as number));
        addInputRow('immoPage:loanRateLabel', inputs.loanRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
        addInputRow('immoPage:loanDurationYearsLabel', inputs.loanDurationYears, (val) => `${val} ${t('common:years')}`);
        if (inputs.loanApplyInsurance) {
          addInputRow('immoPage:loanInsuranceModeLabel', inputs.loanInsuranceMode, (val) => t(`immoPage:${val as string}`));
          addInputRow('immoPage:loanInsuranceRateLabel', inputs.loanInsuranceRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
        }
      }
      addInputRow('immoPage:tmiLabel', inputs.tmi, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      addInputRow('immoPage:psLabel', inputs.ps, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      break;
    case 'brutNet':
      addInputRow('brutNetPage:grossInputLabel', inputs.grossValue, (val) => formatCurrency(val as number));
      addInputRow('brutNetPage:inputPeriodLabel', inputs.inputPeriod, (val) => t(`brutNetPage:${val as string}`));
      addInputRow('brutNetPage:paidMonthsLabel', inputs.paidMonths);
      addInputRow('brutNetPage:employeeStatusLabel', inputs.employeeStatus, (val) => t(`brutNetPage:${val as string}`));
      addInputRow('brutNetPage:withholdingRateLabel', inputs.withholdingRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      break;
    case 'rateSolver':
      addInputRow('rateSolverPage:finalCapitalLabel', inputs.finalCapital, (val) => formatCurrency(val as number));
      addInputRow('rateSolverPage:initialCapitalLabel', inputs.initialCapital, (val) => formatCurrency(val as number));
      addInputRow('rateSolverPage:monthlyContributionLabel', inputs.monthlyContribution, (val) => formatCurrency(val as number));
      addInputRow('rateSolverPage:yearsLabel', inputs.years, (val) => `${val} ${t('common:years')}`);
      break;
    case 'tvaCalculator':
      addInputRow('tvaCalculatorPage:priceInputLabel', inputs.priceInput, (val) => formatCurrency(val as number));
      addInputRow('tvaCalculatorPage:vatRateLabel', inputs.vatRate, (val) => formatPercent((val as number) / 100, i18n.language, { maximumFractionDigits: 1 }));
      addInputRow('tvaCalculatorPage:priceTypeLabel', inputs.priceType, (val) => t(`tvaCalculatorPage:${val as string}`));
      break;
    default:
      html += `<tr><td class="border p-2" colspan="2">${t('moduleSummaryExporter:noSpecificInputs')}</td></tr>`;
  }
  html += `</tbody></table>`;

  // Results Section
  if (outputs) {
    html += `<h4 class="text-md font-semibold mt-4 mb-2">${t('moduleSummaryExporter:keyResults')}</h4>`;
    html += `<table class="w-full border-collapse text-sm"><thead><tr><th class="border p-2 text-left bg-accent text-accent-foreground">${t('moduleSummaryExporter:metric')}</th><th class="border p-2 text-left bg-accent text-accent-foreground">${t('moduleSummaryExporter:value')}</th></tr></thead><tbody>`;

    const addOutputRow = (labelKey: string, value: unknown, formatter?: (val: unknown) => string) => {
      const formattedValue = formatter ? formatter(value) : String(value);
      html += `<tr><td class="border p-2">${t(labelKey)}</td><td class="border p-2">${formattedValue}</td></tr>`;
    };

    switch (moduleName) {
      case 'epargne':
        addOutputRow('epargnePage:finalCapital', outputs.finalCapital, (val) => formatCurrency(val as number));
        addOutputRow('epargnePage:totalContributions', outputs.totalContributions, (val) => formatCurrency(val as number));
        addOutputRow('epargnePage:grossGains', outputs.grossGains, (val) => formatCurrency(val as number));
        break;
      case 'endettement':
        addOutputRow('endettementPage:currentDTI', outputs.currentDTI, (val) => formatPercent(val as number, i18n.language, { maximumFractionDigits: 1 }));
        addOutputRow('endettementPage:projectedDTI', outputs.projectedDTI, (val) => formatPercent(val as number, i18n.language, { maximumFractionDigits: 1 }));
        addOutputRow('endettementPage:maxPayment', outputs.maxPayment, (val) => formatCurrency(val as number));
        addOutputRow('endettementPage:affordablePrincipal', outputs.affordablePrincipal, (val) => formatCurrency(val as number));
        break;
      case 'credit':
        addOutputRow('creditPage:monthlyPayment', (outputs.schedule as Array<{ payment: number }>)?.[0]?.payment, (val) => formatCurrency(val as number));
        addOutputRow('creditPage:totalInterest', (outputs.totals as { interest: number })?.interest, (val) => formatCurrency(val as number));
        addOutputRow('creditPage:totalInsurance', (outputs.totals as { insurance: number })?.insurance, (val) => formatCurrency(val as number));
        addOutputRow('creditPage:totalCost', (outputs.totals as { cost: number })?.cost, (val) => formatCurrency(val as number));
        addOutputRow('creditPage:totalPayments', (outputs.totals as { payments: number })?.payments, (val) => formatCurrency(val as number));
        break;
      case 'immo':
        addOutputRow('immoPage:avgSavingEffortDuringLoanAnnual', outputs.avgSavingEffortDuringLoan, (val) => formatCurrency(val as number));
        addOutputRow('immoPage:avgPostLoanIncomeAnnual', outputs.avgPostLoanIncome, (val) => formatCurrency(val as number));
        addOutputRow('immoPage:cagr', outputs.cagr, (val) => isNaN(val as number) ? t('common:none') : formatPercent(val as number, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        addOutputRow('immoPage:capitalRecoveredAtSale', outputs.capitalRecoveredAtSale, (val) => formatCurrency(val as number));
        break;
      case 'brutNet':
        addOutputRow('brutNetPage:netBeforeTaxAnnual', outputs.netBeforeTaxAnnual, (val) => formatCurrency(val as number));
        addOutputRow('brutNetPage:netAfterTaxAnnual', outputs.netAfterTaxAnnual, (val) => formatCurrency(val as number));
        addOutputRow('brutNetPage:netPerPay', outputs.netPerPay, (val) => formatCurrency(val as number));
        break;
      case 'rateSolver':
        addOutputRow('rateSolverPage:annualRate', outputs.rAnnual, (val) => formatPercent(val as number, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        break;
      case 'tvaCalculator':
        addOutputRow('tvaCalculatorPage:priceHT', outputs.priceHT, (val) => formatCurrency(val as number));
        addOutputRow('tvaCalculatorPage:vatAmount', outputs.vatAmount, (val) => formatCurrency(val as number));
        addOutputRow('tvaCalculatorPage:priceTTC', outputs.priceTTC, (val) => formatCurrency(val as number));
        break;
      default:
        html += `<tr><td class="border p-2" colspan="2">${t('moduleSummaryExporter:noSpecificResults')}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  // Recommendations Section
  if (recommendations) {
    html += `<h4 class="text-md font-semibold mt-4 mb-2">${t('moduleSummaryExporter:recommendations')}</h4>`;
    html += `<p class="text-sm">${recommendations}</p>`;
  }

  return html;
};

export const ModuleSummaryExporter: React.FC<ModuleSummaryExporterProps> = ({
  moduleName,
  moduleTitle,
  inputs,
  outputs,
  summaryText,
  recommendations,
}) => {
  const { t } = useTranslation(['common', 'moduleSummaryExporter']);
  const [activeTab, setActiveTab] = useState('text');

  const fullTextSummary = `${summaryText}\n\n${recommendations ? `${t('moduleSummaryExporter:recommendations')}:\n${recommendations}` : ''}`;
  const htmlTableSummary = generateHtmlTableSummary(moduleName, moduleTitle, inputs, outputs, recommendations, t);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess(t('common:copied'));
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError(t('common:copyError'));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('moduleSummaryExporter:title')}</CardTitle>
        <CardDescription>{t('moduleSummaryExporter:description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">{t('moduleSummaryExporter:textSummaryTab')}</TabsTrigger>
            <TabsTrigger value="html">{t('moduleSummaryExporter:htmlTableTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4">
            <Textarea
              value={fullTextSummary}
              readOnly
              rows={10}
              className="font-mono text-xs resize-none mb-4"
              aria-label={t('moduleSummaryExporter:textSummaryTab')}
            />
            <Button onClick={() => handleCopy(fullTextSummary)} className="w-full">
              <CopyIcon className="mr-2 h-4 w-4" />
              {t('moduleSummaryExporter:copyText')}
            </Button>
          </TabsContent>
          <TabsContent value="html" className="mt-4">
            <div
              className="border rounded-md p-4 bg-background text-foreground overflow-auto max-h-[400px] mb-4"
              dangerouslySetInnerHTML={{ __html: htmlTableSummary }}
              aria-label={t('moduleSummaryExporter:htmlTableTab')}
            />
            <Button onClick={() => handleCopy(htmlTableSummary)} className="w-full">
              <CopyIcon className="mr-2 h-4 w-4" />
              {t('moduleSummaryExporter:copyHtml')}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};