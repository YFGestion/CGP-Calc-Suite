import { Scenario } from '@/types/scenario';
import { formatCurrency, formatPercent } from './format';
import i18n from '@/app/i18n'; // Import i18n instance for translations
import { NavigateFunction } from 'react-router-dom';
import { showInfo } from '@/utils/toast';

export const getScenarioSummary = (scenario: Scenario): string => {
  const { module, outputs } = scenario;
  const { t } = i18n; // Use the i18n instance for translation

  if (!outputs) {
    return t('scenarioHistoryPage.summaryGeneric');
  }

  switch (module) {
    case 'epargne':
      const epargneOutputs = outputs as { finalCapital?: number; grossGains?: number };
      return t('scenarioHistoryPage.summaryEpargne', {
        finalCapital: formatCurrency(epargneOutputs.finalCapital || 0),
        grossGains: formatCurrency(epargneOutputs.grossGains || 0),
      });
    case 'endettement':
      const endettementOutputs = outputs as { affordablePrincipal?: number; maxPayment?: number };
      return t('scenarioHistoryPage.summaryEndettement', {
        affordablePrincipal: formatCurrency(endettementOutputs.affordablePrincipal || 0),
        maxPayment: formatCurrency(endettementOutputs.maxPayment || 0),
      });
    case 'credit':
      const creditOutputs = outputs as { totals?: { cost?: number }; schedule?: Array<{ payment: number }> };
      const monthlyPayment = creditOutputs.schedule && creditOutputs.schedule.length > 0
        ? creditOutputs.schedule[0].payment
        : 0;
      return t('scenarioHistoryPage.summaryCredit', {
        totalCost: formatCurrency(creditOutputs.totals?.cost || 0),
        monthlyPayment: formatCurrency(monthlyPayment),
      });
    case 'immo':
      const immoOutputs = outputs as { cagr?: number; capitalRecoveredAtSale?: number };
      return t('scenarioHistoryPage.summaryImmo', {
        cagr: isNaN(immoOutputs.cagr || 0) ? t('common.none') : formatPercent(immoOutputs.cagr || 0, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        capitalRecoveredAtSale: formatCurrency(immoOutputs.capitalRecoveredAtSale || 0),
      });
    default:
      return t('scenarioHistoryPage.summaryGeneric');
  }
};

export const getModulePath = (moduleName: string): string => {
  switch (moduleName) {
    case 'epargne': return '/epargne';
    case 'endettement': return '/endettement';
    case 'credit': return '/credit';
    case 'immo': return '/immo';
    case 'brutNet': return '/autres-calculs';
    case 'rateSolver': return '/autres-calculs';
    case 'tvaCalculator': return '/autres-calculs';
    case 'scenario-history': return '/scenarios'; // Updated path for scenario history
    default: return '/';
  }
};

export const getModuleTab = (moduleName: string): string | undefined => {
  switch (moduleName) {
    case 'brutNet': return 'brut-net';
    case 'rateSolver': return 'rate-solver';
    case 'tvaCalculator': return 'tva-calculator';
    default: return undefined; // ScenarioHistory is now a page, not a tab
  }
};

// Helper to format date strings
export const formatDateTime = (isoString: string, locale: string = 'fr-FR'): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const reloadScenarioInModule = (scenario: Scenario, navigate: NavigateFunction) => {
  const modulePath = getModulePath(scenario.module);
  const moduleTab = getModuleTab(scenario.module);

  const params = new URLSearchParams();
  // Add all inputs as search parameters
  for (const key in scenario.inputs) {
    if (Object.prototype.hasOwnProperty.call(scenario.inputs, key)) {
      const value = scenario.inputs[key];
      // Handle boolean values specifically
      if (typeof value === 'boolean') {
        params.append(key, value.toString());
      } else if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    }
  }

  let targetPath = modulePath;
  if (moduleTab) {
    // For modules under 'autres-calculs', we need to navigate to the tab
    targetPath = `${modulePath}?tab=${moduleTab}&${params.toString()}`;
  } else {
    targetPath = `${modulePath}?${params.toString()}`;
  }

  navigate(targetPath);
  showInfo(i18n.t('common:scenarioReloaded')); // Display toast message
};