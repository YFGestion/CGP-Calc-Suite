import { round } from './math-core/utils';

export const formatCurrency = (value: number, locale: string = 'fr-FR', currency: string = 'EUR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2, // Toujours 2 décimales pour la devise
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number, locale: string = 'fr-FR', options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0, // Par défaut 0 décimale
    maximumFractionDigits: 1, // Par défaut 1 décimale
    ...options,
  }).format(value);
};

export const clampNumber = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

export const round2 = (value: number): number => {
  return round(value, 2);
};

export const roundToNearest = (value: number, step: number): number => {
  return Math.round(value / step) * step;
};