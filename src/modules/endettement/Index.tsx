"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { exportCsv } from '@/lib/csv';
import { formatCurrency, formatPercent } from '@/lib/format';
import { debtCapacity } from '@/lib/math-core/debt';
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
import { useSettingsStore } from '@/store/useSettingsStore';
import { showError, showSuccess } from '@/utils/toast';
import { ScenarioTitleModal } from '@/components/ScenarioTitleModal';
import { ModuleSummaryExporter } from '@/components/ModuleSummaryExporter'; // New import

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  netIncome: z.coerce.number({
    required_error: t('validation.netIncomePositive'),
    invalid_type_error: t('validation.netIncomePositive'),
  }).positive(t('validation.netIncomePositive')),
  existingDebt: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  charges: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  targetDTI: z.coerce.number({
    required_error: t('validation.targetDTIRange'),
    invalid_type_error: t('validation.targetDTIRange'),
  }).min(20, t('validation.targetDTIRange')).max(50, t('validation.targetDTIRange')), // 20-50%

  // Projet de crédit
  loanRate: z.coerce.number({
    required_error: t('validation.loanRateRange'),
    invalid_type_error: t('validation.loanRateRange'),
  }).min(0, t('validation.loanRateRange')).max(10, t('validation.loanRateRange')),
  loanDurationYears: z.coerce.number({
    required_error: t('validation.loanDurationMin'),
    invalid_type_error: t('validation.loanDurationMin'),
  }).int(t('validation.loanDurationMin')).min(1, t('validation.loanDurationMin')).max(60, "Maximum 60 ans"),
  loanApplyInsurance: z.boolean(),
  loanInsuranceMode: z.enum(['initialPct', 'crdPct']).optional(),
  loanInsuranceRate: z.coerce.number({
    required_error: t('validation.loanInsuranceRateRange'),
    invalid_type_error: t('validation.loanInsuranceRateRange'),
  }).min(0, t('validation.loanInsuranceRateRange')).max(1, t('validation.loanInsuranceRateRange')).optional(),

  // Investissement locatif (optionnel)
  applyRentalInvestment: z.boolean(),
  propertyPrice: z.coerce.number({
    required_error: t('validation.propertyPricePositive'),
    invalid_type_error: t('validation.propertyPricePositive'),
  }).positive(t('validation.propertyPricePositive')).optional(),
  rentalYield: z.coerce.number({
    required_error: t('validation.rentalYieldRange'),
    invalid_type_error: t('validation.rentalYieldRange'),
  }).min(0, t('validation.rentalYieldRange')).max(20, t('validation.rentalYieldRange')).optional(),
  rentRetention: z.coerce.number({
    required_error: t('validation.rentRetentionRange'),
    invalid_type_error: t('validation.rentRetentionRange'),
  }).min(0, t('validation.rentRetentionRange')).max(100, t('validation.rentRetentionRange')).optional(),
}).superRefine((data, ctx) => {
  if (data.loanApplyInsurance) {
    if (!data.loanInsuranceMode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanInsuranceMode'] });
    }
    if (data.loanInsuranceRate === undefined || data.loanInsuranceRate === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanInsuranceRate'] });
    }
  }
  if (data.applyRentalInvestment) {
    if (data.propertyPrice === undefined || data.propertyPrice === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['propertyPrice'] });
    if (data.rentalYield === undefined || data.rentalYield === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['rentalYield'] });
    if (data.rentRetention === undefined || data.rentRetention === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['rentRetention'] });
  }
});

const EndettementPage = () => {
  const { t } = useTranslation('endettementPage');
  const { t: commonT } = useTranslation('common');
  const navigate = useNavigate();
  const settings = useSettingsStore();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      netIncome: 3000,
      existingDebt: 500,
      charges: 0,
      targetDTI: settings.defaultTargetDTI,
      loanRate: settings.defaultLoanRate,
      loanDurationYears: settings.defaultLoanDurationYears,
      loanApplyInsurance: true,
      loanInsuranceMode: 'initialPct',
      loanInsuranceRate: settings.defaultLoanInsuranceRate,
      applyRentalInvestment: false,
      propertyPrice: 200000,
      rentalYield: 5,
      rentRetention: settings.defaultRentRetention,
    },
  });

  const applyRentalInvestment = form.watch('applyRentalInvestment');
  const loanApplyInsurance = form.watch('loanApplyInsurance');
  const loanInsuranceMode = form.watch('loanInsuranceMode');

  const [results, setResults] = useState<ReturnType<typeof debtCapacity> | null>(null);

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    const computedResults = debtCapacity({
      netIncome: values.netIncome,
      existingDebt: values.existingDebt,
      charges: values.charges,
      targetDTI: values.targetDTI / 100,
      loan: {
        rate: values.loanRate / 100,
        years: values.loanDurationYears,
        insuranceRate: values.loanApplyInsurance && values.loanInsuranceRate !== undefined
          ? values.loanInsuranceRate / 100
          : undefined,
      },
      rentalYield: values.applyRentalInvestment && values.rentalYield !== undefined
        ? values.rentalYield / 100
        : undefined,
      propertyPrice: values.applyRentalInvestment ? values.propertyPrice : undefined,
      rentRetention: values.applyRentalInvestment && values.rentRetention !== undefined
        ? values.rentRetention / 100
        : undefined,
    });
    setResults(computedResults);
  };

  const handleExportCsv = () => {
    if (!results) return;

    const values = form.getValues();
    const loanInsuranceRateValue = values.loanApplyInsurance && values.loanInsuranceRate !== undefined ? values.loanInsuranceRate : 0;
    const loanInsuranceModeTranslated = values.loanApplyInsurance && values.loanInsuranceMode ? t(values.loanInsuranceMode) : 'N/A';

    const rentalYieldValue = values.applyRentalInvestment && values.rentalYield !== undefined ? values.rentalYield : 0;
    const rentRetentionValue = values.applyRentalInvestment && values.rentRetention !== undefined ? values.rentRetention : 0;

    const rows = [
      [commonT('appName')],
      [t('title')],
      [],
      [t('netIncomeLabel'), values.netIncome.toString()],
      [t('existingDebtLabel'), values.existingDebt.toString()],
      [t('chargesLabel'), values.charges.toString()],
      [t('targetDTILabel'), values.targetDTI.toString() + '%'],
      [],
      [t('loanProjectSection')],
      [t('loanRateLabel'), values.loanRate.toString() + '%'],
      [t('loanDurationYearsLabel'), values.loanDurationYears.toString()],
      [t('loanApplyInsuranceToggleLabel'), values.loanApplyInsurance ? 'Oui' : 'Non'],
      [t('loanInsuranceModeLabel'), loanInsuranceModeTranslated],
      [t('loanInsuranceRateLabel'), loanInsuranceRateValue.toString() + '%'],
      [],
      [t('rentalInvestmentSection')],
      [t('applyRentalInvestment'), values.applyRentalInvestment ? 'Oui' : 'Non'],
      [t('propertyPriceLabel'), values.propertyPrice?.toString() || 'N/A'],
      [t('rentalYieldLabel'), rentalYieldValue.toString() + '%'],
      [t('rentRetentionLabel'), rentRetentionValue.toString() + '%'],
      [],
      [commonT('results')],
      [t('currentDTI'), formatPercent(results.currentDTI)],
      [t('projectedDTI'), formatPercent(results.projectedDTI)],
      [t('maxPayment'), formatCurrency(results.maxPayment)],
      [t('affordablePrincipal'), formatCurrency(results.affordablePrincipal)],
      [],
      [t('stressTestTitle')],
      [t('stressRateDelta'), t('stressMaxPayment'), t('stressAffordablePrincipal')],
      ...results.stress.map(s => [
        formatPercent(s.rateDelta, 'fr-FR', { maximumFractionDigits: 1 }),
        formatCurrency(s.maxPayment),
        formatCurrency(s.affordablePrincipal),
      ]),
    ];

    exportCsv('endettement-capacity.csv', rows);
  };

  const handleSendToCredit = () => {
    if (!results) {
      showError(t('validation.noResultsYet'));
      return;
    }
    const values = form.getValues();
    const params = new URLSearchParams({
      loanAmount: results.affordablePrincipal.toString(),
      nominalRate: values.loanRate.toString(),
      durationYears: values.loanDurationYears.toString(),
      applyInsurance: values.loanApplyInsurance.toString(),
      insuranceMode: values.loanInsuranceMode || '',
      insuranceRate: (values.loanInsuranceRate || 0).toString(),
    });
    navigate(`/credit?${params.toString()}`);
    showSuccess(t('creditSentSuccess'));
  };

  const endettementSummaryData = results ? {
    moduleTitle: t('title'),
    keyFacts: [
      { label: t('currentDTI'), value: formatPercent(results.currentDTI) },
      { label: t('projectedDTI'), value: formatPercent(results.projectedDTI) },
      { label: t('maxPayment'), value: formatCurrency(results.maxPayment) },
      { label: t('affordablePrincipal'), value: formatCurrency(results.affordablePrincipal) },
    ],
  } : null;

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
              name="netIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('netIncomeLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('netIncomeLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="existingDebt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('existingDebtLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('existingDebtLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="charges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('chargesLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('chargesLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDTI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('targetDTILabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={20}
                      max={50}
                      step={1}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      className="w-[100%]"
                      aria-label={t('targetDTILabel')}
                    />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />
            <h3 className="text-lg font-semibold">{t('loanProjectSection')}</h3>
            <FormField
              control={form.control}
              name="loanRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loanRateLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      aria-label={t('loanRateLabel')}
                    />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanDurationYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loanDurationYearsLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      aria-label={t('loanDurationYearsLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanApplyInsurance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base" htmlFor="loanApplyInsurance-switch">{t('loanApplyInsuranceToggleLabel')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="loanApplyInsurance-switch"
                      aria-label={t('loanApplyInsuranceToggleLabel')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {loanApplyInsurance && (
              <>
                <FormField
                  control={form.control}
                  name="loanInsuranceMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('loanInsuranceModeLabel')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                          aria-label={t('loanInsuranceModeLabel')}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="initialPct" id="loanInsuranceMode-initialPct" /></FormControl>
                            <FormLabel htmlFor="loanInsuranceMode-initialPct" className="font-normal">{t('initialPct')}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="crdPct" id="loanInsuranceMode-crdPct" /></FormControl>
                            <FormLabel htmlFor="loanInsuranceMode-crdPct" className="font-normal">{t('crdPct')}</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loanInsuranceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loanInsuranceRateLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          aria-label={t('loanInsuranceRateLabel')}
                        />
                      </FormControl>
                      <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Separator className="my-4" />
            <h3 className="text-lg font-semibold">{t('rentalInvestmentSection')}</h3>
            <FormField
              control={form.control}
              name="applyRentalInvestment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base" htmlFor="applyRentalInvestment-switch">{t('rentalInvestmentSection')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="applyRentalInvestment-switch"
                      aria-label={t('rentalInvestmentSection')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {applyRentalInvestment && (
              <>
                <FormField
                  control={form.control}
                  name="propertyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('propertyPriceLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          aria-label={t('propertyPriceLabel')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentalYield"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalYieldLabel')}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={20}
                          step={0.1}
                          value={[field.value || 0]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="w-[100%]"
                          aria-label={t('rentalYieldLabel')}
                        />
                      </FormControl>
                      <div className="text-right text-sm text-muted-foreground">{field.value || 0}%</div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentRetention"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentRetentionLabel')}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[field.value || 0]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="w-[100%]"
                          aria-label={t('rentRetentionLabel')}
                        />
                      </FormControl>
                      <div className="text-right text-sm text-muted-foreground">{field.value || 0}%</div>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('currentDTI')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercent(results.currentDTI)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('projectedDTI')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercent(results.projectedDTI)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('maxPayment')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(results.maxPayment)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('affordablePrincipal')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(results.affordablePrincipal)}</div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-4" />

            <Collapsible className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-lg" aria-label={t('stressTestTitle')}>
                {t('stressTestTitle')}
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('stressRateDelta')}</TableHead>
                        <TableHead>{t('stressMaxPayment')}</TableHead>
                        <TableHead>{t('stressAffordablePrincipal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.stress.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatPercent(row.rateDelta, 'fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                          <TableCell>{formatCurrency(row.maxPayment)}</TableCell>
                          <TableCell>{formatCurrency(row.affordablePrincipal)}</TableCell>
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
              <Button variant="outline" onClick={handleSendToCredit} className="flex-1">
                {t('sendToCreditButton')}
              </Button>
              <ScenarioTitleModal
                moduleName="endettement"
                currentInputs={form.getValues()}
                currentOutputs={results}
                triggerButtonLabel={commonT('saveScenarioButton')}
                disabled={!results}
              />
            </div>
            {endettementSummaryData && (
              <ModuleSummaryExporter
                moduleTitle={endettementSummaryData.moduleTitle}
                keyFacts={endettementSummaryData.keyFacts}
                className="mt-8"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EndettementPage;