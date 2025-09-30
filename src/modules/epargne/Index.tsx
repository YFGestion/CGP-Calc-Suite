"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CopyBlock } from '@/lib/copy';
import { exportCsv } from '@/lib/csv';
import { formatCurrency, formatPercent } from '@/lib/format';
import { savingsProjection } from '@/lib/math-core/savings';

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  initialDeposit: z.coerce.number({
    required_error: t('validation.initialDepositNonNegative'),
    invalid_type_error: t('validation.initialDepositNonNegative'),
  }).min(0, t('validation.initialDepositNonNegative')),
  periodicDeposit: z.coerce.number({
    required_error: t('validation.periodicDepositNonNegative'),
    invalid_type_error: t('validation.periodicDepositNonNegative'),
  }).min(0, t('validation.periodicDepositNonNegative')),
  periodicity: z.enum(['monthly', 'quarterly', 'yearly']),
  duration: z.coerce.number({
    required_error: t('validation.durationMin'),
    invalid_type_error: t('validation.durationMin'),
  }).int(t('validation.durationMin')).min(1, t('validation.durationMin')).max(60, "Maximum 60 ans"),
  returnRate: z.coerce.number({
    required_error: t('validation.returnRateRange'),
    invalid_type_error: t('validation.returnRateRange'),
  }).min(-10, t('validation.returnRateRange')).max(20, t('validation.returnRateRange')), // User enters -10 to 20 for percentage
  applyEntryFee: z.boolean(),
  entryFee: z.coerce.number({
    required_error: t('validation.entryFeeRange'),
    invalid_type_error: t('validation.entryFeeRange'),
  }).min(0, t('validation.entryFeeRange')).max(10, t('validation.entryFeeRange')).optional(), // User enters 0-10 for percentage
}).superRefine((data, ctx) => {
  if (data.applyEntryFee && (data.entryFee === undefined || data.entryFee === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('validation.entryFeeRange'),
      path: ['entryFee'],
    });
  }
});

const EpargnePage = () => {
  const { t } = useTranslation('epargnePage');
  const { t: commonT } = useTranslation('common');

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      initialDeposit: 10000,
      periodicDeposit: 100,
      periodicity: 'monthly',
      duration: 10,
      returnRate: 5,
      applyEntryFee: false,
      entryFee: 0,
    },
  });

  const applyEntryFee = form.watch('applyEntryFee');

  const [results, setResults] = useState<ReturnType<typeof savingsProjection> | null>(null);
  const [summaryContent, setSummaryContent] = useState('');

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    const computedResults = savingsProjection({
      initial: values.initialDeposit,
      periodic: values.periodicDeposit,
      periodicity: values.periodicity,
      years: values.duration,
      grossReturn: values.returnRate / 100, // Convert percentage to decimal
      entryFee: values.applyEntryFee && values.entryFee !== undefined ? values.entryFee / 100 : 0, // Convert percentage to decimal
    });
    setResults(computedResults);

    const formattedResults = {
      initialDeposit: formatCurrency(values.initialDeposit),
      periodicDeposit: formatCurrency(values.periodicDeposit),
      periodicity: t(values.periodicity),
      duration: values.duration,
      returnRate: formatPercent(values.returnRate / 100),
      entryFee: values.applyEntryFee && values.entryFee !== undefined ? formatPercent(values.entryFee / 100) : formatPercent(0),
      finalCapital: formatCurrency(computedResults.finalCapital),
      totalContributions: formatCurrency(computedResults.totalContributions),
      grossGains: formatCurrency(computedResults.grossGains),
    };

    setSummaryContent(
      t('summaryContent', formattedResults)
    );
  };

  const handleExportCsv = () => {
    if (!results) return;

    const values = form.getValues();
    const entryFeeValue = values.applyEntryFee && values.entryFee !== undefined ? values.entryFee : 0;

    const rows = [
      [commonT('appName')],
      [t('title')],
      [],
      [t('initialDepositLabel'), values.initialDeposit.toString()],
      [t('periodicDepositLabel'), values.periodicDeposit.toString()],
      [t('periodicityLabel'), t(values.periodicity)],
      [t('durationLabel'), values.duration.toString()],
      [t('returnRateLabel'), values.returnRate.toString() + '%'],
      [t('entryFeeToggleLabel'), values.applyEntryFee ? 'Oui' : 'Non'],
      [t('entryFeeLabel'), entryFeeValue.toString() + '%'],
      [],
      [t('finalCapital'), formatCurrency(results.finalCapital)],
      [t('totalContributions'), formatCurrency(results.totalContributions)],
      [t('grossGains'), formatCurrency(results.grossGains)],
      [],
      [t('chartTitle')],
      ['Période', t('chartCapital'), t('chartContributions')],
      ...results.series.map(data => [data.t.toString(), data.value.toString(), data.contrib.toString()]),
    ];

    exportCsv('epargne-projection.csv', rows);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="initialDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('initialDepositLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodicDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('periodicDepositLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodicity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('periodicityLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="monthly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('monthly')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="quarterly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('quarterly')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yearly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('yearly')}
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
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('durationLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('returnRateLabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={-10}
                      max={20}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      className="w-[100%]"
                    />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applyEntryFee"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('entryFeeToggleLabel')}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {applyEntryFee && (
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('entryFeeLabel')}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={10}
                        step={0.1}
                        value={[field.value || 0]}
                        onValueChange={(val) => field.onChange(val[0])}
                        className="w-[100%]"
                      />
                    </FormControl>
                    <div className="text-right text-sm text-muted-foreground">{field.value || 0}%</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full">{t('calculateButton')}</Button>
          </form>
        </Form>

        {results && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">{commonT('results')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>{t('finalCapital')} :</span>
                <span className="font-medium">{formatCurrency(results.finalCapital)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('totalContributions')} :</span>
                <span className="font-medium">{formatCurrency(results.totalContributions)}</span>
              </div>
              <div className="flex justify-between col-span-full">
                <span>{t('grossGains')} :</span>
                <span className="font-medium">{formatCurrency(results.grossGains)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="text-lg font-semibold mb-4">{t('chartTitle')}</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={results.series}
                  margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" label={{ value: t('durationLabel'), position: 'insideBottom', offset: 0 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value, 'fr-FR', 'EUR')} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'fr-FR', 'EUR')} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" name={t('chartCapital')} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="contrib" stroke="#82ca9d" name={t('chartContributions')} />
                </LineChart>
              </ResponsiveContainer>
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

export default EpargnePage;