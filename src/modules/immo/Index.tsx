"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSearchParams } from 'react-router-dom';

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
import { rentalCashflowIrr } from '@/lib/math-core/rental';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCcw } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  // A) Investissement
  price: z.coerce.number({
    required_error: t('validation.positiveNumber'),
    invalid_type_error: t('validation.positiveNumber'),
  }).positive(t('validation.positiveNumber')),
  applyAcqCosts: z.boolean(),
  acqCosts: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')).optional(),
  
  rentInputMode: z.enum(['fixedAmount', 'yieldPct']), // New field
  rentGross: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')).optional(), // Now optional
  expectedYield: z.coerce.number({
    required_error: t('validation.percentageRange', { min: 0, max: 20 }),
    invalid_type_error: t('validation.percentageRange', { min: 0, max: 20 }),
  }).min(0, t('validation.percentageRange', { min: 0, max: 20 })).max(20, t('validation.percentageRange', { min: 0, max: 20 })).optional(), // New field
  
  rentPeriodicity: z.enum(['monthly', 'annual']),
  vacancyRate: z.coerce.number({
    required_error: t('validation.percentageRange', { min: 0, max: 100 }),
    invalid_type_error: t('validation.percentageRange', { min: 0, max: 100 }),
  }).min(0, t('validation.percentageRange', { min: 0, max: 100 })).max(100, t('validation.percentageRange', { min: 0, max: 100 })),
  opex: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  propertyTax: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  applyMgmtFees: z.boolean(),
  mgmtFeesType: z.enum(['mgmtFeesPct', 'mgmtFeesFixed']).optional(),
  mgmtFeesValue: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')).optional(),
  capex: z.coerce.number({
    required_error: t('validation.nonNegativeNumber'),
    invalid_type_error: t('validation.nonNegativeNumber'),
  }).min(0, t('validation.nonNegativeNumber')),
  horizonYears: z.coerce.number({
    required_error: t('validation.durationMin'),
    invalid_type_error: t('validation.durationMin'),
  }).int(t('validation.durationMin')).min(1, t('validation.durationMin')).max(60, "Maximum 60 ans"),
  saleYear: z.coerce.number({
    required_error: t('validation.saleYearRange'),
    invalid_type_error: t('validation.saleYearRange'),
  }).int(t('validation.saleYearRange')).min(1, t('validation.saleYearRange')),
  salePriceMode: z.enum(['fixed', 'growth']),
  salePrice: z.coerce.number({
    required_error: t('validation.positiveNumber'),
    invalid_type_error: t('validation.positiveNumber'),
  }).positive(t('validation.positiveNumber')).optional(),
  saleGrowthRate: z.coerce.number({
    required_error: t('validation.percentageRange', { min: -10, max: 20 }),
    invalid_type_error: t('validation.percentageRange', { min: -10, max: 20 }),
  }).min(-10, t('validation.percentageRange', { min: -10, max: 20 })).max(20, t('validation.percentageRange', { min: -10, max: 20 })).optional(),
  saleCostsPct: z.coerce.number({
    required_error: t('validation.percentageRange', { min: 0, max: 100 }),
    invalid_type_error: t('validation.percentageRange', { min: 0, max: 100 }),
  }).min(0, t('validation.percentageRange', { min: 0, max: 100 })).max(100, t('validation.percentageRange', { min: 0, max: 100 })),

  // B) Crédit
  applyLoan: z.boolean(),
  loanAmount: z.coerce.number({
    required_error: t('validation.loanAmountPositive'),
    invalid_type_error: t('validation.loanAmountPositive'),
  }).positive(t('validation.loanAmountPositive')).optional(),
  loanRate: z.coerce.number({
    required_error: t('validation.loanRateRange'),
    invalid_type_error: t('validation.loanRateRange'),
  }).min(0, t('validation.loanRateRange')).max(10, t('validation.loanRateRange')).optional(),
  loanDurationYears: z.coerce.number({
    required_error: t('validation.loanDurationMin'),
    invalid_type_error: t('validation.loanDurationMin'),
  }).int(t('validation.loanDurationMin')).min(1, t('validation.loanDurationMin')).max(60, "Maximum 60 ans").optional(),
  loanApplyInsurance: z.boolean().optional(),
  loanInsuranceMode: z.enum(['initialPct', 'crdPct']).optional(),
  loanInsuranceRate: z.coerce.number({
    required_error: t('validation.loanInsuranceRateRange'),
    invalid_type_error: t('validation.loanInsuranceRateRange'),
  }).min(0, t('validation.loanInsuranceRateRange')).max(1, t('validation.loanInsuranceRateRange')).optional(),

  // C) Fiscalité simple
  taxMode: z.enum(['none', 'micro_foncier_30', 'micro_bic_50', 'effective_rate']),
  tmi: z.coerce.number({
    required_error: t('validation.percentageRange', { min: 0, max: 45 }),
    invalid_type_error: t('validation.percentageRange', { min: 0, max: 45 }),
  }).min(0, t('validation.percentageRange', { min: 0, max: 45 })).max(45, t('validation.percentageRange', { min: 0, max: 45 })).optional(),
  ps: z.coerce.number({
    required_error: t('validation.percentageRange', { min: 0, max: 17.2 }),
    invalid_type_error: t('validation.percentageRange', { min: 0, max: 17.2 }),
  }).min(0, t('validation.percentageRange', { min: 0, max: 17.2 })).max(17.2, t('validation.percentageRange', { min: 0, max: 17.2 })).optional(),
}).superRefine((data, ctx) => {
  if (data.applyAcqCosts && (data.acqCosts === undefined || data.acqCosts === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['acqCosts'] });
  }
  if (data.applyMgmtFees && (!data.mgmtFeesType || data.mgmtFeesValue === undefined || data.mgmtFeesValue === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['mgmtFeesType'] });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['mgmtFeesValue'] });
  }
  if (data.salePriceMode === 'fixed' && (data.salePrice === undefined || data.salePrice === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['salePrice'] });
  }
  if (data.salePriceMode === 'growth' && (data.saleGrowthRate === undefined || data.saleGrowthRate === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['saleGrowthRate'] });
  }
  if (data.saleYear > data.horizonYears) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.saleYearRange'), path: ['saleYear'] });
  }

  if (data.applyLoan) {
    if (data.loanAmount === undefined || data.loanAmount === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanAmount'] });
    if (data.loanRate === undefined || data.loanRate === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanRate'] });
    if (data.loanDurationYears === undefined || data.loanDurationYears === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanDurationYears'] });

    if (data.loanApplyInsurance) {
      if (!data.loanInsuranceMode) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanInsuranceMode'] });
      if (data.loanInsuranceRate === undefined || data.loanInsuranceRate === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['loanInsuranceRate'] });
    }
  }

  if (data.taxMode === 'effective_rate') {
    if (data.tmi === undefined || data.tmi === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.tmiPsRequired'), path: ['tmi'] });
    if (data.ps === undefined || data.ps === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.tmiPsRequired'), path: ['ps'] });
  }

  // Conditional validation for rent input mode
  if (data.rentInputMode === 'fixedAmount') {
    if (data.rentGross === undefined || data.rentGross === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.nonNegativeNumber'), path: ['rentGross'] });
    }
  } else if (data.rentInputMode === 'yieldPct') {
    if (data.expectedYield === undefined || data.expectedYield === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('validation.requiredField'), path: ['expectedYield'] });
    }
  }
});

const ImmoPage = () => {
  const { t } = useTranslation('immoPage');
  const { t: commonT } = useTranslation('common');
  const settings = useSettingsStore();
  const [searchParams] = useSearchParams();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      price: 250000,
      applyAcqCosts: true,
      acqCosts: 250000 * (settings.defaultAcqCostsPct / 100),
      rentInputMode: 'fixedAmount', // Default to fixed amount
      rentGross: 1000,
      expectedYield: 5, // Default for yieldPct
      rentPeriodicity: 'monthly',
      vacancyRate: 5,
      opex: 500,
      propertyTax: 1000,
      applyMgmtFees: true,
      mgmtFeesType: 'mgmtFeesPct',
      mgmtFeesValue: 8,
      capex: 300,
      horizonYears: 20,
      saleYear: 20,
      salePriceMode: 'growth',
      saleGrowthRate: 2,
      saleCostsPct: 7,

      applyLoan: true,
      loanAmount: 200000,
      loanRate: settings.defaultLoanRate,
      loanDurationYears: settings.defaultLoanDurationYears,
      loanApplyInsurance: true,
      loanInsuranceMode: 'initialPct',
      loanInsuranceRate: settings.defaultLoanInsuranceRate,

      taxMode: 'micro_foncier_30',
      tmi: settings.defaultTMI,
      ps: settings.defaultPS,
    },
  });

  const { watch, handleSubmit, setValue, getValues, reset } = form;

  const applyAcqCosts = watch('applyAcqCosts');
  const rentInputMode = watch('rentInputMode'); // Watch new field
  const rentPeriodicity = watch('rentPeriodicity');
  const applyMgmtFees = watch('applyMgmtFees');
  const mgmtFeesType = watch('mgmtFeesType');
  const salePriceMode = watch('salePriceMode');
  const applyLoan = watch('applyLoan');
  const loanApplyInsurance = watch('loanApplyInsurance');
  const taxMode = watch('taxMode');

  const [results, setResults] = useState<ReturnType<typeof rentalCashflowIrr> | null>(null);
  const [summaryContent, setSummaryContent] = useState('');

  const calculate = useCallback((values: z.infer<ReturnType<typeof formSchema>>) => {
    let baseRentAnnualGross = 0;
    if (values.rentInputMode === 'fixedAmount' && values.rentGross !== undefined) {
      baseRentAnnualGross = values.rentGross * (values.rentPeriodicity === 'monthly' ? 12 : 1);
    } else if (values.rentInputMode === 'yieldPct' && values.expectedYield !== undefined) {
      baseRentAnnualGross = values.price * (values.expectedYield / 100);
    }

    const adjustedRentAnnualGross = baseRentAnnualGross; // No sensitivity
    const adjustedVacancyRate = values.vacancyRate / 100; // No sensitivity
    
    let mgmtFeesPctValue = 0;
    if (values.applyMgmtFees && values.mgmtFeesType === 'mgmtFeesPct' && values.mgmtFeesValue !== undefined) {
      mgmtFeesPctValue = values.mgmtFeesValue / 100;
    }
    if (values.applyMgmtFees && values.mgmtFeesType === 'mgmtFeesFixed' && values.mgmtFeesValue !== undefined && adjustedRentAnnualGross > 0) {
      mgmtFeesPctValue = values.mgmtFeesValue / adjustedRentAnnualGross;
    }

    const loanDetails = values.applyLoan && values.loanAmount && values.loanRate && values.loanDurationYears
      ? {
        amount: values.loanAmount,
        rate: values.loanRate / 100, // No sensitivity
        years: values.loanDurationYears,
        insurance: values.loanApplyInsurance && values.loanInsuranceMode && values.loanInsuranceRate !== undefined
          ? {
            mode: values.loanInsuranceMode,
            value: values.loanInsuranceRate / 100,
          }
          : { mode: 'initialPct' as const, value: 0 }, // Default to 0 if no insurance
      }
      : undefined;

    let salePriceValue = values.salePrice;
    let saleGrowthRateValue = values.saleGrowthRate;

    if (values.salePriceMode === 'fixed' && values.salePrice !== undefined) {
      salePriceValue = values.salePrice; // No sensitivity
    } else if (values.salePriceMode === 'growth' && values.saleGrowthRate !== undefined) {
      saleGrowthRateValue = values.saleGrowthRate / 100; // No sensitivity
    }

    const computedResults = rentalCashflowIrr({
      price: values.price,
      acqCosts: values.applyAcqCosts ? values.acqCosts : 0,
      rentAnnualGross: adjustedRentAnnualGross,
      vacancyRate: adjustedVacancyRate,
      opex: values.opex,
      propertyTax: values.propertyTax,
      mgmtFeesPct: mgmtFeesPctValue,
      capex: values.capex,
      horizonYears: values.horizonYears,
      saleYear: values.saleYear,
      salePriceMode: values.salePriceMode,
      salePrice: salePriceValue,
      saleGrowthRate: saleGrowthRateValue,
      saleCostsPct: values.saleCostsPct / 100,
      loan: loanDetails,
      taxMode: values.taxMode,
      tmi: values.taxMode === 'effective_rate' && values.tmi !== undefined ? values.tmi / 100 : 0,
      ps: values.taxMode === 'effective_rate' && values.ps !== undefined ? values.ps / 100 : 0,
    });
    setResults(computedResults);

    const formattedResults = {
      price: formatCurrency(values.price),
      horizonYears: values.horizonYears,
      loanAmount: loanDetails ? formatCurrency(loanDetails.amount) : commonT('none'),
      loanRate: loanDetails ? formatPercent(loanDetails.rate, 'fr-FR', { maximumFractionDigits: 1 }) : commonT('none'),
      loanDurationYears: loanDetails ? loanDetails.years : commonT('none'),
      saleYear: values.saleYear,
      avgSavingEffortDuringLoan: formatCurrency(computedResults.avgSavingEffortDuringLoan),
      avgPostLoanIncome: formatCurrency(computedResults.avgPostLoanIncome),
      irr: formatPercent(computedResults.irr, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };

    setSummaryContent(
      t('summaryContent', formattedResults)
    );
  }, [commonT, t]);

  const onSubmit = useCallback((values: z.infer<ReturnType<typeof formSchema>>) => {
    calculate(values);
  }, [calculate]);

  useEffect(() => {
    const loanAmountParam = searchParams.get('loanAmount');
    const loanRateParam = searchParams.get('loanRate');
    const loanDurationYearsParam = searchParams.get('loanDurationYears');
    const loanApplyInsuranceParam = searchParams.get('loanApplyInsurance');
    const loanInsuranceModeParam = searchParams.get('loanInsuranceMode');
    const loanInsuranceRateParam = searchParams.get('loanInsuranceRate');

    let shouldSubmit = false;
    if (loanAmountParam) { setValue('loanAmount', parseFloat(loanAmountParam)); shouldSubmit = true; }
    if (loanRateParam) { setValue('loanRate', parseFloat(loanRateParam)); shouldSubmit = true; }
    if (loanDurationYearsParam) { setValue('loanDurationYears', parseInt(loanDurationYearsParam)); shouldSubmit = true; }

    if (loanApplyInsuranceParam) {
      const applyInsuranceBool = loanApplyInsuranceParam === 'true';
      setValue('loanApplyInsurance', applyInsuranceBool);
      shouldSubmit = true;

      if (applyInsuranceBool) {
        if (loanInsuranceModeParam) { setValue('loanInsuranceMode', loanInsuranceModeParam as 'initialPct' | 'crdPct'); }
        if (loanInsuranceRateParam) { setValue('loanInsuranceRate', parseFloat(loanInsuranceRateParam)); }
      } else {
        setValue('loanInsuranceMode', undefined);
        setValue('loanInsuranceRate', 0);
      }
    }

    if (shouldSubmit) {
      setValue('applyLoan', true);
      setTimeout(() => {
        handleSubmit(onSubmit)();
      }, 0);
    }
  }, [searchParams, setValue, handleSubmit, onSubmit]);

  // Removed the useEffect for sensitivity changes as sensitivities are removed.

  const handleExportCsv = () => {
    if (!results) return;

    const values = getValues();
    const acqCostsValue = values.applyAcqCosts && values.acqCosts !== undefined ? values.acqCosts : 0;
    const mgmtFeesValue = values.applyMgmtFees && values.mgmtFeesValue !== undefined ? values.mgmtFeesValue : 0;
    const mgmtFeesTypeTranslated = values.applyMgmtFees && values.mgmtFeesType ? t(values.mgmtFeesType) : 'N/A';

    const loanAmountValue = values.applyLoan && values.loanAmount !== undefined ? values.loanAmount : 0;
    const loanRateValue = values.applyLoan && values.loanRate !== undefined ? values.loanRate : 0;
    const loanDurationYearsValue = values.applyLoan && values.loanDurationYears !== undefined ? values.loanDurationYears : 0;
    const loanInsuranceRateValue = values.applyLoan && values.loanApplyInsurance && values.loanInsuranceRate !== undefined ? values.loanInsuranceRate : 0;
    const loanInsuranceModeTranslated = values.applyLoan && values.loanApplyInsurance && values.loanInsuranceMode ? t(values.loanInsuranceMode) : 'N/A';

    const salePriceOrGrowth = values.salePriceMode === 'fixed' ? values.salePrice : values.saleGrowthRate;
    const salePriceOrGrowthLabel = values.salePriceMode === 'fixed' ? t('salePriceLabel') : t('saleGrowthRateLabel');

    const tmiValue = values.taxMode === 'effective_rate' && values.tmi !== undefined ? values.tmi : 0;
    const psValue = values.taxMode === 'effective_rate' && values.ps !== undefined ? values.ps : 0;

    const rentInputModeTranslated = t(values.rentInputMode);
    const rentValue = values.rentInputMode === 'fixedAmount' ? values.rentGross?.toString() : values.expectedYield?.toString() + '%';
    const rentLabel = values.rentInputMode === 'fixedAmount' ? t('rentGrossLabel') : t('expectedYieldLabel');


    const rows = [
      [commonT('appName')],
      [t('title')],
      [],
      [t('sectionInvestment')],
      [t('priceLabel'), values.price.toString()],
      [t('acqCostsToggleLabel'), values.applyAcqCosts ? 'Oui' : 'Non'],
      [t('acqCostsLabel'), acqCostsValue.toString()],
      [t('rentInputModeLabel'), rentInputModeTranslated],
      [rentLabel, rentValue],
      [t('rentPeriodicityLabel'), t(values.rentPeriodicity)],
      [t('vacancyRateLabel'), values.vacancyRate.toString() + '%'],
      [t('opexLabel'), values.opex.toString()],
      [t('propertyTaxLabel'), values.propertyTax.toString()],
      [t('mgmtFeesToggleLabel'), values.applyMgmtFees ? 'Oui' : 'Non'],
      [t('mgmtFeesTypeLabel'), mgmtFeesTypeTranslated],
      [t('mgmtFeesValueLabel'), mgmtFeesValue.toString()],
      [t('capexLabel'), values.capex.toString()],
      [t('horizonYearsLabel'), values.horizonYears.toString()],
      [t('saleYearLabel'), values.saleYear.toString()],
      [t('salePriceModeLabel'), t(values.salePriceMode === 'fixed' ? 'salePriceFixed' : 'salePriceGrowth')],
      [salePriceOrGrowthLabel, salePriceOrGrowth?.toString() + (values.salePriceMode === 'growth' ? '%' : '')],
      [t('saleCostsPctLabel'), values.saleCostsPct.toString() + '%'],
      [],
      [t('sectionLoan')],
      [t('applyLoanToggleLabel'), values.applyLoan ? 'Oui' : 'Non'],
      [t('loanAmountLabel'), loanAmountValue.toString()],
      [t('loanRateLabel'), loanRateValue.toString() + '%'],
      [t('loanDurationYearsLabel'), loanDurationYearsValue.toString()],
      [t('loanInsuranceToggleLabel'), values.loanApplyInsurance ? 'Oui' : 'Non'],
      [t('loanInsuranceModeLabel'), loanInsuranceModeTranslated],
      [t('loanInsuranceRateLabel'), loanInsuranceRateValue.toString() + '%'],
      [],
      [t('sectionTaxation')],
      [t('taxModeLabel'), t(values.taxMode)],
      [t('tmiLabel'), tmiValue.toString() + '%'],
      [t('psLabel'), psValue.toString() + '%'],
      [],
      [commonT('results')],
      [t('avgSavingEffortDuringLoan'), formatCurrency(results.avgSavingEffortDuringLoan)],
      [t('avgPostLoanIncome'), formatCurrency(results.avgPostLoanIncome)],
      [t('irr'), formatPercent(results.irr, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      [],
      [t('annualTableTitle')],
      [
        t('tableHeaderYear'), t('tableHeaderRentGross'), t('tableHeaderVacancy'), t('tableHeaderRentNet'),
        t('tableHeaderOpexTotal'), t('tableHeaderNOI'), t('tableHeaderInterest'), t('tableHeaderPrincipal'),
        t('tableHeaderInsurance'), t('tableHeaderAnnuity'), t('tableHeaderTaxableIncome'), t('tableHeaderTax'),
        t('tableHeaderCashflow'), t('tableHeaderCrdEnd')
      ],
      ...results.annualTable.map(row => [
        row.year.toString(),
        formatCurrency(row.rentGross),
        formatCurrency(row.vacancy),
        formatCurrency(row.rentNet),
        formatCurrency(row.opexTotal),
        formatCurrency(row.NOI),
        formatCurrency(row.interest),
        formatCurrency(row.principal),
        formatCurrency(row.insurance),
        formatCurrency(row.annuity),
        formatCurrency(row.taxableIncome),
        formatCurrency(row.tax),
        formatCurrency(row.cashflow),
        formatCurrency(row.crdEnd),
      ]),
    ];

    exportCsv('immo-simulation.csv', rows);
  };

  const handleDuplicateScenario = () => {
    toast.info(t('scenarioDuplicated'));
    // Future implementation: copy current form state to a new scenario
  };

  // Removed handleResetSensitivities as sensitivities are removed.

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section A: Investissement */}
            <Collapsible defaultOpen className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-xl py-2 border-b" aria-label={t('sectionInvestment')}>
                {t('sectionInvestment')}
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 p-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('priceLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          aria-label={t('priceLabel')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applyAcqCosts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base" htmlFor="applyAcqCosts-switch">{t('acqCostsToggleLabel')}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="applyAcqCosts-switch"
                          aria-label={t('acqCostsToggleLabel')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {applyAcqCosts && (
                  <FormField
                    control={form.control}
                    name="acqCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('acqCostsLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            aria-label={t('acqCostsLabel')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="rentInputMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('rentInputModeLabel')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                          aria-label={t('rentInputModeLabel')}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="fixedAmount" id="rentInputMode-fixedAmount" /></FormControl>
                            <FormLabel htmlFor="rentInputMode-fixedAmount" className="font-normal">{t('fixedAmount')}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="yieldPct" id="rentInputMode-yieldPct" /></FormControl>
                            <FormLabel htmlFor="rentInputMode-yieldPct" className="font-normal">{t('yieldPct')}</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {rentInputMode === 'fixedAmount' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rentGross"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('rentGrossLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              aria-label={t('rentGrossLabel')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rentPeriodicity"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t('rentPeriodicityLabel')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                              aria-label={t('rentPeriodicityLabel')}
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="monthly" id="rentPeriodicity-monthly" /></FormControl>
                                <FormLabel htmlFor="rentPeriodicity-monthly" className="font-normal">{t('monthly')}</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="annual" id="rentPeriodicity-annual" /></FormControl>
                                <FormLabel htmlFor="rentPeriodicity-annual" className="font-normal">{t('annual')}</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {rentInputMode === 'yieldPct' && (
                  <FormField
                    control={form.control}
                    name="expectedYield"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('expectedYieldLabel')}</FormLabel>
                        <FormControl>
                          <Slider
                            min={0} max={20} step={0.1}
                            value={[field.value || 0]} onValueChange={(val) => field.onChange(val[0])}
                            className="w-[100%]"
                            aria-label={t('expectedYieldLabel')}
                          />
                        </FormControl>
                        <div className="text-right text-sm text-muted-foreground">{field.value || 0}%</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="vacancyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vacancyRateLabel')}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0} max={100} step={0.1}
                          value={[field.value]} onValueChange={(val) => field.onChange(val[0])}
                          className="w-[100%]"
                          aria-label={t('vacancyRateLabel')}
                        />
                      </FormControl>
                      <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('opexLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          aria-label={t('opexLabel')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="propertyTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('propertyTaxLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          aria-label={t('propertyTaxLabel')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applyMgmtFees"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base" htmlFor="applyMgmtFees-switch">{t('mgmtFeesToggleLabel')}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="applyMgmtFees-switch"
                          aria-label={t('mgmtFeesToggleLabel')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {applyMgmtFees && (
                  <>
                    <FormField
                      control={form.control}
                      name="mgmtFeesType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t('mgmtFeesTypeLabel')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                              aria-label={t('mgmtFeesTypeLabel')}
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="mgmtFeesPct" id="mgmtFeesType-pct" /></FormControl>
                                <FormLabel htmlFor="mgmtFeesType-pct" className="font-normal">{t('mgmtFeesPct')}</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="mgmtFeesFixed" id="mgmtFeesType-fixed" /></FormControl>
                                <FormLabel htmlFor="mgmtFeesType-fixed" className="font-normal">{t('mgmtFeesFixed')}</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mgmtFeesValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('mgmtFeesValueLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              aria-label={t('mgmtFeesValueLabel')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="capex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('capexLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          aria-label={t('capexLabel')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="horizonYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('horizonYearsLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            aria-label={t('horizonYearsLabel')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('saleYearLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            aria-label={t('saleYearLabel')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="salePriceMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('salePriceModeLabel')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                          aria-label={t('salePriceModeLabel')}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="fixed" id="salePriceMode-fixed" /></FormControl>
                            <FormLabel htmlFor="salePriceMode-fixed" className="font-normal">{t('salePriceFixed')}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="growth" id="salePriceMode-growth" /></FormControl>
                            <FormLabel htmlFor="salePriceMode-growth" className="font-normal">{t('salePriceGrowth')}</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {salePriceMode === 'fixed' && (
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('salePriceLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            aria-label={t('salePriceLabel')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {salePriceMode === 'growth' && (
                  <FormField
                    control={form.control}
                    name="saleGrowthRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('saleGrowthRateLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            aria-label={t('saleGrowthRateLabel')}
                          />
                        </FormControl>
                        <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="saleCostsPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('saleCostsPctLabel')}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0} max={100} step={0.1}
                          value={[field.value]} onValueChange={(val) => field.onChange(val[0])}
                          className="w-[100%]"
                          aria-label={t('saleCostsPctLabel')}
                        />
                      </FormControl>
                      <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Section B: Crédit */}
            <Collapsible defaultOpen className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-xl py-2 border-b" aria-label={t('sectionLoan')}>
                {t('sectionLoan')}
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 p-4">
                <FormField
                  control={form.control}
                  name="applyLoan"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base" htmlFor="applyLoan-switch">{t('applyLoanToggleLabel')}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="applyLoan-switch"
                          aria-label={t('applyLoanToggleLabel')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {applyLoan && (
                  <>
                    <FormField
                      control={form.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('loanAmountLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              aria-label={t('loanAmountLabel')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            <FormLabel className="text-base" htmlFor="loanApplyInsurance-switch">{t('loanInsuranceToggleLabel')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="loanApplyInsurance-switch"
                              aria-label={t('loanInsuranceToggleLabel')}
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
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Section C: Fiscalité simple */}
            <Collapsible defaultOpen className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-xl py-2 border-b" aria-label={t('sectionTaxation')}>
                {t('sectionTaxation')}
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 p-4">
                <FormField
                  control={form.control}
                  name="taxMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('taxModeLabel')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                          aria-label={t('taxModeLabel')}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="none" id="taxMode-none" /></FormControl>
                            <FormLabel htmlFor="taxMode-none" className="font-normal">{t('taxModeNone')}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="micro_foncier_30" id="taxMode-micro_foncier_30" /></FormControl>
                            <FormLabel htmlFor="taxMode-micro_foncier_30" className="font-normal">{t('taxModeMicroFoncier30')}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="micro_bic_50" id="taxMode-micro_bic_50" /></FormControl>
                            <FormLabel htmlFor="taxMode-micro_bic_50" className="font-normal">{t('taxModeMicroBic50')}</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="effective_rate" id="taxMode-effective_rate" /></FormControl>
                            <FormLabel htmlFor="taxMode-effective_rate" className="font-normal">{t('taxModeEffectiveRate')}</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {taxMode === 'effective_rate' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tmi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tmiLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              aria-label={t('tmiLabel')}
                            />
                          </FormControl>
                          <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('psLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              aria-label={t('psLabel')}
                            />
                          </FormControl>
                          <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Button type="submit" className="w-full">{t('calculateButton')}</Button>
          </form>
        </Form>

        {results && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-center">{commonT('results')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('avgSavingEffortDuringLoan')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(results.avgSavingEffortDuringLoan)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('avgPostLoanIncome')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(results.avgPostLoanIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('irr')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercent(results.irr, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-4" />

            <Collapsible defaultOpen className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-lg py-2 border-b" aria-label={t('annualTableTitle')}>
                {t('annualTableTitle')}
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tableHeaderYear')}</TableHead>
                        <TableHead>{t('tableHeaderRentGross')}</TableHead>
                        <TableHead>{t('tableHeaderVacancy')}</TableHead>
                        <TableHead>{t('tableHeaderRentNet')}</TableHead>
                        <TableHead>{t('tableHeaderOpexTotal')}</TableHead>
                        <TableHead>{t('tableHeaderNOI')}</TableHead>
                        <TableHead>{t('tableHeaderInterest')}</TableHead>
                        <TableHead>{t('tableHeaderPrincipal')}</TableHead>
                        <TableHead>{t('tableHeaderInsurance')}</TableHead>
                        <TableHead>{t('tableHeaderAnnuity')}</TableHead>
                        <TableHead>{t('tableHeaderTaxableIncome')}</TableHead>
                        <TableHead>{t('tableHeaderTax')}</TableHead>
                        <TableHead>{t('tableHeaderCashflow')}</TableHead>
                        <TableHead>{t('tableHeaderCrdEnd')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.annualTable.map((row) => (
                        <TableRow key={row.year}>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{formatCurrency(row.rentGross)}</TableCell>
                          <TableCell>{formatCurrency(row.vacancy)}</TableCell>
                          <TableCell>{formatCurrency(row.rentNet)}</TableCell>
                          <TableCell>{formatCurrency(row.opexTotal)}</TableCell>
                          <TableCell>{formatCurrency(row.NOI)}</TableCell>
                          <TableCell>{formatCurrency(row.interest)}</TableCell>
                          <TableCell>{formatCurrency(row.principal)}</TableCell>
                          <TableCell>{formatCurrency(row.insurance)}</TableCell>
                          <TableCell>{formatCurrency(row.annuity)}</TableCell>
                          <TableCell>{formatCurrency(row.taxableIncome)}</TableCell>
                          <TableCell>{formatCurrency(row.tax)}</TableCell>
                          <TableCell>{formatCurrency(row.cashflow)}</TableCell>
                          <TableCell>{formatCurrency(row.crdEnd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-4" />

            <h3 className="text-lg font-semibold mb-4">{t('chartCashflowTitle')}</h3>
            <div className="h-[300px] w-full" aria-label={t('chartCashflowTitle')}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={results.annualTable}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: t('tableHeaderYear'), position: 'insideBottom', offset: 0 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value, 'fr-FR', 'EUR')} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'fr-FR', 'EUR')} />
                  <Legend />
                  <Line type="monotone" dataKey="cashflow" stroke="#8884d8" name={t('chartCashflow')} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {applyLoan && (
              <>
                <Separator className="my-4" />
                <h3 className="text-lg font-semibold mb-4">{t('chartCrdTitle')}</h3>
                <div className="h-[300px] w-full" aria-label={t('chartCrdTitle')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={results.annualTable}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" label={{ value: t('tableHeaderYear'), position: 'insideBottom', offset: 0 }} />
                      <YAxis tickFormatter={(value) => formatCurrency(value, 'fr-FR', 'EUR')} />
                      <Tooltip formatter={(value: number) => formatCurrency(value, 'fr-FR', 'EUR')} />
                      <Legend />
                      <Line type="monotone" dataKey="crdEnd" stroke="#82ca9d" name={t('chartCrd')} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleExportCsv} className="flex-1">
                {t('exportCsvButton')}
              </Button>
              <Button variant="outline" onClick={handleDuplicateScenario} className="flex-1">
                {t('duplicateScenarioButton')}
              </Button>
            </div>
            <CopyBlock title={t('summaryTitle')} content={summaryContent} className="mt-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImmoPage;