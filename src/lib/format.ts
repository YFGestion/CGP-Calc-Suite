export const formatCurrency = (value: number, locale: string = 'fr-FR', currency: string = 'EUR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('fr-FR', options).format(value);
};