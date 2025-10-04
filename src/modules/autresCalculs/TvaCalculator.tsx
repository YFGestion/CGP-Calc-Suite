"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ScenarioTitleModal } from '@/components/ScenarioTitleModal'; // New import

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  priceInput: z.coerce.number({
    required_error: t('validation.positiveNumber'),
    invalid_type_error: t('validation.positiveNumber'),
  }).positive(t('validation.positiveNumber')),
  vatRate: z.coerce.number({
    required_error: t('validation.vatRateRange'),
    invalid_type_error: t('validation.vatRateRange'),
  }).min(0, t('validation.vatRateRange')).max(100, t('validation.vatRateRange')),
  priceType: z.enum(['ht', 'ttc']),
});

const TvaCalculator = () => {
  const { t } = useTranslation('tvaCalculatorPage');
  const { t: commonT } = useTranslation('common');

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      priceInput: 100,
      vatRate: 20,
      priceType: 'ht',
    },
  });

  const [results, setResults] = useState<{ priceHT: number; vatAmount: number; priceTTC: number } | null>(null);
  const [summaryContent, setSummaryContent] = useState('');

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    const vatRateDecimal = values.vatRate / 100;
    let priceHT = 0;
    let vatAmount = 0;
    let priceTTC = 0;

    if (values.priceType === 'ht') {
      priceHT = values.priceInput;
      vatAmount = priceHT * vatRateDecimal;
      priceTTC = priceHT + vatAmount;
    } else { // priceType === 'ttc'
      priceTTC = values.priceInput;
      priceHT = priceTTC / (1 + vatRateDecimal);
      vatAmount = priceTTC - priceHT;
    }

    const computedResults = {
      priceHT: parseFloat(priceHT.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      priceTTC: parseFloat(priceTTC.toFixed(2)),
    };
    setResults(computedResults);

    const formattedResults = {
      priceInput: formatCurrency(values.priceInput),
      vatRate: formatPercent(vatRateDecimal, 'fr-FR', { maximumFractionDigits: 1 }),
      priceType: t(values.priceType),
      priceHT: formatCurrency(computedResults.priceHT),
      vatAmount: formatCurrency(computedResults.vatAmount),
      priceTTC: formatCurrency(computedResults.priceTTC),
    };

    setSummaryContent(
      t('summaryContent', formattedResults)
    );
  };

  const handleExportCsv = () => {
    if (!results) return;

    const values = form.getValues();
    const vatRateDecimal = values.vatRate / 100;

    const rows = [
      [commonT('appName')],
      [t('title')],
      [],
      [t('priceInputLabel'), values.priceInput.toString()],
      [t('vatRateLabel'), values.vatRate.toString() + '%'],
      [t('priceTypeLabel'), t(values.priceType)],
      [],
      [commonT('results')],
      [t('priceHT'), formatCurrency(results.priceHT)],
      [t('vatAmount'), formatCurrency(results.vatAmount)],
      [t('priceTTC'), formatCurrency(results.priceTTC)],
    ];

    exportCsv('tva-calculation.csv', rows);
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
              name="priceInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('priceInputLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('priceInputLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('vatRateLabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      className="w-[100%]"
                      aria-label={t('vatRateLabel')}
                    />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('priceTypeLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      aria-label={t('priceTypeLabel')}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ht" id="priceType-ht" />
                        </FormControl>
                        <FormLabel htmlFor="priceType-ht" className="font-normal">
                          {t('ht')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ttc" id="priceType-ttc" />
                        </FormControl>
                        <FormLabel htmlFor="priceType-ttc" className="font-normal">
                          {t('ttc')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                <span>{t('priceHT')} :</span>
                <span className="font-medium">{formatCurrency(results.priceHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('vatAmount')} :</span>
                <span className="font-medium">{formatCurrency(results.vatAmount)}</span>
              </div>
              <div className="flex justify-between col-span-full">
                <span>{t('priceTTC')} :</span>
                <span className="font-medium">{formatCurrency(results.priceTTC)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleExportCsv} className="flex-1">
                {t('exportCsvButton')}
              </Button>
              {/* Add ScenarioTitleModal here */}
              <ScenarioTitleModal
                moduleName="tvaCalculator"
                currentInputs={form.getValues()}
                currentOutputs={results}
                triggerButtonLabel={commonT('saveScenarioButton')}
                disabled={!results}
              />
            </div>
            <CopyBlock title={t('summaryTitle')} content={summaryContent} className="mt-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TvaCalculator;