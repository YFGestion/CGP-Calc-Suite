"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { CopyBlock } from '@/lib/copy';
import { exportCsv } from '@/lib/csv';
import { formatCurrency, formatPercent } from '@/lib/format';
import { computeBrutNet } from '@/lib/math-core/brutNet';

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  grossValue: z.coerce.number({
    required_error: t('validation.grossValuePositive'),
    invalid_type_error: t('validation.grossValuePositive'),
  }).positive(t('validation.grossValuePositive')),
  inputPeriod: z.enum(['monthly', 'annual']),
  paidMonths: z.coerce.number().int().min(12).max(15),
  employeeStatus: z.enum(['cadre', 'nonCadre']), // New field for employee status
  withholdingRate: z.coerce.number({
    required_error: t('validation.withholdingRateRange'),
    invalid_type_error: t('validation.withholdingRateRange'),
  }).min(0, t('validation.withholdingRateRange')).max(45, t('validation.withholdingRateRange')), // User enters 0-45 for percentage
});

const BrutNetPage = () => {
  const { t } = useTranslation('brutNetPage'); // Use specific namespace for brutNetPage
  const { t: commonT } = useTranslation('common'); // Use common namespace for common terms

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      grossValue: 3000,
      inputPeriod: 'monthly',
      paidMonths: 12,
      employeeStatus: 'cadre', // Default to 'cadre'
      withholdingRate: 8, // Default 8%
    },
  });

  const [results, setResults] = useState<ReturnType<typeof computeBrutNet> | null>(null);
  const [summaryContent, setSummaryContent] = useState('');

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    // Determine chargesRate based on employeeStatus
    const chargesRateValue = values.employeeStatus === 'cadre' ? 25 : 22;

    const computedResults = computeBrutNet({
      grossValue: values.grossValue,
      inputPeriod: values.inputPeriod,
      paidMonths: values.paidMonths as 12 | 13 | 14 | 15, // Type assertion as Zod ensures it
      chargesRate: chargesRateValue / 100, // Convert percentage to decimal
      withholdingRate: values.withholdingRate / 100, // Convert percentage to decimal
    });
    setResults(computedResults);

    const formattedResults = {
      grossValue: formatCurrency(values.grossValue),
      inputPeriod: values.inputPeriod === 'monthly' ? t('monthly') : t('annual'),
      paidMonths: values.paidMonths,
      employeeStatus: t(values.employeeStatus), // Translate employee status
      withholdingRate: formatPercent(values.withholdingRate / 100, 'fr-FR', { maximumFractionDigits: 1 }),
      netBeforeTaxAnnual: formatCurrency(computedResults.netBeforeTaxAnnual),
      netBeforeTaxMonthlyAvg: formatCurrency(computedResults.netBeforeTaxMonthlyAvg),
      netAfterTaxAnnual: formatCurrency(computedResults.netAfterTaxAnnual),
      netAfterTaxMonthlyAvg: formatCurrency(computedResults.netAfterTaxMonthlyAvg),
      netPerPay: formatCurrency(computedResults.netPerPay),
    };

    setSummaryContent(
      t('summaryContent', formattedResults)
    );
  };

  const handleExportCsv = () => {
    if (!results) return;

    const chargesRateValue = form.getValues('employeeStatus') === 'cadre' ? 25 : 22;

    const rows = [
      [commonT('appName')],
      [t('title')],
      [],
      [t('grossInputLabel'), form.getValues('grossValue').toString()],
      [t('inputPeriodLabel'), form.getValues('inputPeriod') === 'monthly' ? t('monthly') : t('annual')],
      [t('paidMonthsLabel'), form.getValues('paidMonths').toString()],
      [t('employeeStatusLabel'), t(form.getValues('employeeStatus'))], // Export translated status
      [t('chargesRateLabel'), chargesRateValue.toString() + '%'], // Export actual rate used
      [t('withholdingRateLabel'), form.getValues('withholdingRate').toString() + '%'],
      [],
      [t('netBeforeTaxAnnual'), formatCurrency(results.netBeforeTaxAnnual)],
      [t('netBeforeTaxMonthlyAvg'), formatCurrency(results.netBeforeTaxMonthlyAvg)],
      [t('netAfterTaxAnnual'), formatCurrency(results.netAfterTaxAnnual)],
      [t('netAfterTaxMonthlyAvg'), formatCurrency(results.netAfterTaxMonthlyAvg)],
      [t('netPerPay'), formatCurrency(results.netPerPay)],
    ];

    exportCsv('brut-net-calculation.csv', rows);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="grossValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('grossInputLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('grossInputLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inputPeriod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('inputPeriodLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      aria-label={t('inputPeriodLabel')}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="monthly" id="inputPeriod-monthly" />
                        </FormControl>
                        <FormLabel htmlFor="inputPeriod-monthly" className="font-normal">
                          {t('monthly')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="annual" id="inputPeriod-annual" />
                        </FormControl>
                        <FormLabel htmlFor="inputPeriod-annual" className="font-normal">
                          {t('annual')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidMonths"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('paidMonthsLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={value => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      className="flex space-x-4"
                      aria-label={t('paidMonthsLabel')}
                    >
                      {[12, 13, 14, 15].map(months => (
                        <FormItem key={months} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={months.toString()} id={`paidMonths-${months}`} />
                          </FormControl>
                          <FormLabel htmlFor={`paidMonths-${months}`} className="font-normal">
                            {months}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('employeeStatusLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      aria-label={t('employeeStatusLabel')}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="cadre" id="employeeStatus-cadre" />
                        </FormControl>
                        <FormLabel htmlFor="employeeStatus-cadre" className="font-normal">
                          {t('cadre')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="nonCadre" id="employeeStatus-nonCadre" />
                        </FormControl>
                        <FormLabel htmlFor="employeeStatus-nonCadre" className="font-normal">
                          {t('nonCadre')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="withholdingRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('withholdingRateLabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={45}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      className="w-[100%]"
                      aria-label={t('withholdingRateLabel')}
                    />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
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
                <span>{t('netBeforeTaxAnnual')} :</span>
                <span className="font-medium">{formatCurrency(results.netBeforeTaxAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('netBeforeTaxMonthlyAvg')} :</span>
                <span className="font-medium">{formatCurrency(results.netBeforeTaxMonthlyAvg)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('netAfterTaxAnnual')} :</span>
                <span className="font-medium">{formatCurrency(results.netAfterTaxAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('netAfterTaxMonthlyAvg')} :</span>
                <span className="font-medium">{formatCurrency(results.netAfterTaxMonthlyAvg)}</span>
              </div>
              <div className="flex justify-between col-span-full">
                <span>{t('netPerPay')} :</span>
                <span className="font-medium">{formatCurrency(results.netPerPay)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleExportCsv} className="flex-1">
                {t('exportCsvButton')}
              </Button>
            </div>
            <CopyBlock title={t('summaryTitle')} content={summaryContent} className="mt-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrutNetPage;