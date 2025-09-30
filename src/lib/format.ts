import { round } from './math-core';

export const formatCurrency = (value: number, locale: string = 'fr-FR', currency: string = 'EUR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const formatPercent = (value: number, locale: string = 'fr-FR', options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
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