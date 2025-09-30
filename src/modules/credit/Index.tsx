"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider'; // Slider is still imported but not used for rates
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CopyBlock } from '@/lib/copy';
import { exportCsv } from '@/lib/csv';
import { formatCurrency, formatPercent } from '@/lib/format';
import { amortizationSchedule } from '@/lib/math-core/loan';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  loanAmount: z.coerce.number({
    required_error: t('validation.loanAmountPositive'),
    invalid_type_error: t('validation.loanAmountPositive'),
  }).positive(t('validation.loanAmountPositive')),
  nominalRate: z.coerce.number({
    required_error: t('validation.nominalRateRange'),
    invalid_type_error: t('validation.nominalRateRange'),
  }).min(0, t('validation.nominalRateRange')).max(10, t('validation.nominalRateRange')), // User enters 0-10 for percentage
  durationYears: z.coerce.number({
    required_error: t('validation.durationMin'),
    invalid_type_error: t('validation.durationMin'),
  }).int(t('validation.durationMin')).min(1, t('validation.durationMin')).max(60, "Maximum 60 ans"),
  applyInsurance: z.boolean(),
  insuranceMode: z.enum(['initialPct', 'crdPct']).optional(),
  insuranceRate: z.coerce.number({
    required_error: t('validation.insuranceRateRange'),
    invalid_type_error: t('validation.insuranceRateRange'),
  }).min(0, t('validation.insuranceRateRange')).max(1, t('validation.insuranceRateRange')).optional(), // User enters 0-1 for percentage
}).superRefine((data, ctx) => {
  if (data.applyInsurance) {
    if (!data.insuranceMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('validation.insuranceRateRange'), // Reusing message for simplicity
        path: ['insuranceMode'],
      });
    }
    if (data.insuranceRate === undefined || data.insuranceRate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('validation.insuranceRateRange'),
        path: ['insuranceRate'],
      });
    }
  }
});

const CreditPage = () => {
  const { t } = useTranslation('creditPage');
  const { t: commonT } = useTranslation('common');

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      loanAmount: 200000,
      nominalRate: 2.5,
      durationYears: 20,
      applyInsurance: false,
      insuranceMode: 'initialPct',
      insuranceRate: 0.3,
    },
  });

  const applyInsurance = form.watch('applyInsurance');
  const insuranceMode = form.watch('insuranceMode');

  const [results, setResults] = useState<ReturnType<typeof amortizationSchedule> | null>(null);
  const [summaryContent, setSummaryContent] = useState('');

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    const insuranceDetails = values.applyInsurance && values.insuranceMode && values.insuranceRate !== undefined
      ? {
        mode: values.insuranceMode,
        value: values.insuranceRate / 100, // Convert percentage to decimal
      }
      : undefined;

    const computedResults = amortizationSchedule({
      principal: values.loanAmount,
      rate: values.nominalRate / 100, // Convert percentage to decimal
      years: values.durationYears,
      frequency: 12, // Fixed to monthly
      insurance: insuranceDetails,
    });
    setResults(computedResults);

    const totalMonthlyPayment = computedResults.schedule.length > 0 ? computedResults.schedule[0].payment : 0;

    let insuranceSummaryText = t('insuranceDetailsNone');
    if (values.applyInsurance && values.insuranceMode && values.insuranceRate !== undefined) {
      const formattedInsuranceRate = formatPercent(values.insuranceRate / 100, 'fr-FR', { maximumFractionDigits: 2 });
      if (values.insuranceMode === 'initialPct') {
        insuranceSummaryText = t('insuranceDetailsInitialPct', { insuranceRate: formattedInsuranceRate });
      } else if (values.insuranceMode === 'crdPct') {
        insuranceSummaryText = t('insuranceDetailsCrdPct', { insuranceRate: formattedInsuranceRate });
      }
    }

    const formattedResults = {
      loanAmount: formatCurrency(values.loanAmount),
      durationYears: values.durationYears,
      nominalRate: formatPercent(values.nominalRate / 100, 'fr-FR', { maximumFractionDigits: 2 }),
      insuranceDetails: insuranceSummaryText,
      totalMonthlyPayment: formatCurrency(totalMonthlyPayment),
      totalInterest: formatCurrency(computedResults.totals.interest),
      totalInsurance: formatCurrency(computedResults.totals.insurance),
      totalCost: formatCurrency(computedResults.totals.cost),
    };

    setSummaryContent(
      t('summaryContent', formattedResults)
    );
  };

  const handleExportCsv = () => {
    if (!results) return;

    const values = form.getValues();
    const insuranceRateValue = values.applyInsurance && values.insuranceRate !== undefined ? values.insuranceRate : 0;
    const insuranceModeValue = values.applyInsurance && values.insuranceMode ? t(values.insuranceMode) : 'N/A';

    const rows = [
      [commonT('appName')],
      [t('title')],
      [],
      [t('loanAmountLabel'), values.loanAmount.toString()],
      [t('nominalRateLabel'), values.nominalRate.toString() + '%'],
      [t('durationYearsLabel'), values.durationYears.toString()],
      [t('insuranceToggleLabel'), values.applyInsurance ? 'Oui' : 'Non'],
      [t('insuranceModeLabel'), insuranceModeValue],
      [t('insuranceRateLabel'), insuranceRateValue.toString() + '%'],
      [],
      [t('totalInterest'), formatCurrency(results.totals.interest)],
      [t('totalInsurance'), formatCurrency(results.totals.insurance)],
      [t('totalCost'), formatCurrency(results.totals.cost)],
      [t('totalPayments'), formatCurrency(results.totals.payments)],
      [],
      [t('amortizationTableTitle')],
      [t('period'), t('interest'), t('principal'), t('insurance'), t('payment'), t('crdEnd')],
      ...results.schedule.map(data => [
        data.period.toString(),
        formatCurrency(data.interest),
        formatCurrency(data.principal),
        formatCurrency(data.insurance),
        formatCurrency(data.payment),
        formatCurrency(data.crdEnd),
      ]),
      [],
      [t('annualAggregatesTitle')],
      [t('year'), t('sumInterest'), t('sumPrincipal'), t('sumInsurance'), t('sumPayment'), t('crdEnd')],
      ...results.annualAggregate.map(data => [
        data.year.toString(),
        formatCurrency(data.sumInterest),
        formatCurrency(data.sumPrincipal),
        formatCurrency(data.sumInsurance),
        formatCurrency(data.sumPayment),
        formatCurrency(data.crdEnd),
      ]),
    ];

    exportCsv('credit-amortization-schedule.csv', rows);
  };

  const handleSendToImmo = () => {
    // For now, just show a toast as the Immo module is not set up to receive data
    toast.info(t('immoNotReady'));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loanAmountLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nominalRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nominalRateLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01" // Allow decimal input for percentage
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      suffix="%" // Visual suffix, not part of value
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('durationYearsLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applyInsurance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('insuranceToggleLabel')}
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

            {applyInsurance && (
              <>
                <FormField
                  control={form.control}
                  name="insuranceMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('insuranceModeLabel')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="initialPct" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('initialPct')}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="crdPct" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('crdPct')}
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
                  name="insuranceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('insuranceRateLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01" // Allow decimal input for percentage
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          suffix="%" // Visual suffix, not part of value
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" className="w-full">{t('calculateButton')}</Button>
          </form>
        </Form>

        {results && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">{commonT('results')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>{t('monthlyPayment')} :</span>
                <span className="font-medium">{formatCurrency(results.schedule[0].payment)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('totalInterest')} :</span>
                <span className="font-medium">{formatCurrency(results.totals.interest)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('totalInsurance')} :</span>
                <span className="font-medium">{formatCurrency(results.totals.insurance)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('totalCost')} :</span>
                <span className="font-medium">{formatCurrency(results.totals.cost)}</span>
              </div>
              <div className="flex justify-between col-span-full">
                <span>{t('totalPayments')} :</span>
                <span className="font-medium">{formatCurrency(results.totals.payments)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <Collapsible className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-lg">
                {t('amortizationTableTitle')}
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('period')}</TableHead>
                        <TableHead>{t('interest')}</TableHead>
                        <TableHead>{t('principal')}</TableHead>
                        <TableHead>{t('insurance')}</TableHead>
                        <TableHead>{t('payment')}</TableHead>
                        <TableHead>{t('crdEnd')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.schedule.map((row) => (
                        <TableRow key={row.period}>
                          <TableCell>{row.period}</TableCell>
                          <TableCell>{formatCurrency(row.interest)}</TableCell>
                          <TableCell>{formatCurrency(row.principal)}</TableCell>
                          <TableCell>{formatCurrency(row.insurance)}</TableCell>
                          <TableCell>{formatCurrency(row.payment)}</TableCell>
                          <TableCell>{formatCurrency(row.crdEnd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-4" />

            <Collapsible className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-lg">
                {t('annualAggregatesTitle')}
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('year')}</TableHead>
                        <TableHead>{t('sumInterest')}</TableHead>
                        <TableHead>{t('sumPrincipal')}</TableHead>
                        <TableHead>{t('sumInsurance')}</TableHead>
                        <TableHead>{t('sumPayment')}</TableHead>
                        <TableHead>{t('crdEnd')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.annualAggregate.map((row) => (
                        <TableRow key={row.year}>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{formatCurrency(row.sumInterest)}</TableCell>
                          <TableCell>{formatCurrency(row.sumPrincipal)}</TableCell>
                          <TableCell>{formatCurrency(row.sumInsurance)}</TableCell>
                          <TableCell>{formatCurrency(row.sumPayment)}</TableCell>
                          <TableCell>{formatCurrency(row.crdEnd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleExportCsv} className="flex-1">
                {t('exportCsvButton')}
              </Button>
              <Button variant="outline" onClick={handleSendToImmo} className="flex-1">
                {t('sendToImmoButton')}
              </Button>
            </div>
            <CopyBlock title={t('summaryTitle')} content={summaryContent} className="mt-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditPage;