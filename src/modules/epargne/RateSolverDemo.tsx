"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/format';
import { solveAnnualRateFromAnnuityFV } from '@/lib/math-core/irr'; // Import the new function
import { showError, showSuccess } from '@/utils/toast'; // Import toast utility functions
import { ModuleSummaryExporter } from '@/components/ModuleSummaryExporter'; // New import

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  finalCapital: z.coerce.number({
    required_error: t('validation.positiveNumber'),
    invalid_type_error: t('validation.positiveNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  initialCapital: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  monthlyContribution: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  years: z.coerce.number({
    required_error: t('validation.durationMin'),
    invalid_type_error: t('validation.durationMin'),
  }).int(t('validation.durationMin')).min(1, t('validation.durationMin')).max(60, "Maximum 60 ans"),
}).superRefine((data, ctx) => {
  if (data.initialCapital === 0 && data.monthlyContribution === 0 && data.finalCapital > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('rateSolverPage.validation.noCapitalOrContribution'),
      path: ['initialCapital'], // Attach to initialCapital for visibility
    });
  }
});

const RateSolverDemo = () => {
  const { t } = useTranslation('rateSolverPage');
  const { t: commonT } = useTranslation('common');

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      finalCapital: 115441.12,
      initialCapital: 0,
      monthlyContribution: 175.21,
      years: 25,
    },
  });

  const [results, setResults] = useState<{ rMonthly: number; rAnnual: number } | null>(null);
  const [summaryContent, setSummaryContent] = useState('');

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    try {
      const computedRates = solveAnnualRateFromAnnuityFV({
        finalCapital: values.finalCapital,
        initialCapital: values.initialCapital,
        monthlyContribution: values.monthlyContribution,
        years: values.years,
      });
      setResults(computedRates);

      const formattedResults = {
        finalCapital: formatCurrency(values.finalCapital),
        initialCapital: formatCurrency(values.initialCapital),
        monthlyContribution: formatCurrency(values.monthlyContribution),
        years: values.years,
        rMonthly: formatPercent(computedRates.rMonthly, 'fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        rAnnual: formatPercent(computedRates.rAnnual, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      };

      setSummaryContent(
        t('summaryContent', formattedResults)
      );
    } catch (error: any) {
      showError(error.message || t('calculationError'));
      setResults(null);
      setSummaryContent('');
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="finalCapital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('finalCapitalLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('finalCapitalLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialCapital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('initialCapitalLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('initialCapitalLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyContribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('monthlyContributionLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('monthlyContributionLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('yearsLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      aria-label={t('yearsLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">{t('calculateButton')}</Button>
          </form>
        </Form>

        {results && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">{commonT('results')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>{t('monthlyRate')} :</span>
                <span className="font-medium">{formatPercent(results.rMonthly, 'fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('annualRate')} :</span>
                <span className="font-medium">{formatPercent(results.rAnnual, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <ModuleSummaryExporter
              moduleName="rateSolver"
              moduleTitle={t('title')}
              inputs={form.getValues()}
              outputs={results}
              summaryText={summaryContent}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RateSolverDemo;