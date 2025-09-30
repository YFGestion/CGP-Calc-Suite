"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form'; // Corrected import
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/store/useSettingsStore';

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  defaultTargetDTI: z.coerce.number({
    required_error: t('validation.targetDTIRange'),
    invalid_type_error: t('validation.targetDTIRange'),
  }).min(20, t('validation.targetDTIRange')).max(50, t('validation.targetDTIRange')),
  defaultRentRetention: z.coerce.number({
    required_error: t('validation.rentRetentionRange'),
    invalid_type_error: t('validation.rentRetentionRange'),
  }).min(0, t('validation.rentRetentionRange')).max(100, t('validation.rentRetentionRange')),
  defaultTMI: z.coerce.number({
    required_error: t('validation.tmiRange'),
    invalid_type_error: t('validation.tmiRange'),
  }).min(0, t('validation.tmiRange')).max(45, t('validation.tmiRange')),
  defaultPS: z.coerce.number({
    required_error: t('validation.psRange'),
    invalid_type_error: t('validation.psRange'),
  }).min(0, t('validation.psRange')).max(17.2, t('validation.psRange')),
  defaultAcqCostsPct: z.coerce.number({
    required_error: t('validation.acqCostsPctRange'),
    invalid_type_error: t('validation.acqCostsPctRange'),
  }).min(0, t('validation.acqCostsPctRange')).max(20, t('validation.acqCostsPctRange')),
  defaultLoanRate: z.coerce.number({
    required_error: t('validation.loanRateRange'),
    invalid_type_error: t('validation.loanRateRange'),
  }).min(0, t('validation.loanRateRange')).max(10, t('validation.loanRateRange')),
  defaultLoanDurationYears: z.coerce.number({
    required_error: t('validation.loanDurationYearsRange'),
    invalid_type_error: t('validation.loanDurationYearsRange'),
  }).int(t('validation.loanDurationYearsRange')).min(1, t('validation.loanDurationYearsRange')).max(60, t('validation.loanDurationYearsRange')),
  defaultLoanInsuranceRate: z.coerce.number({
    required_error: t('validation.loanInsuranceRateRange'),
    invalid_type_error: t('validation.loanInsuranceRateRange'),
  }).min(0, t('validation.loanInsuranceRateRange')).max(1, t('validation.loanInsuranceRateRange')),
});

const SettingsPage = () => {
  const { t } = useTranslation('settingsPage');
  const settings = useSettingsStore();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      defaultTargetDTI: settings.defaultTargetDTI,
      defaultRentRetention: settings.defaultRentRetention,
      defaultTMI: settings.defaultTMI,
      defaultPS: settings.defaultPS,
      defaultAcqCostsPct: settings.defaultAcqCostsPct,
      defaultLoanRate: settings.defaultLoanRate,
      defaultLoanDurationYears: settings.defaultLoanDurationYears,
      defaultLoanInsuranceRate: settings.defaultLoanInsuranceRate,
    },
  });

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    settings.setDefaultTargetDTI(values.defaultTargetDTI);
    settings.setDefaultRentRetention(values.defaultRentRetention);
    settings.setDefaultTMI(values.defaultTMI);
    settings.setDefaultPS(values.defaultPS);
    settings.setDefaultAcqCostsPct(values.defaultAcqCostsPct);
    settings.setDefaultLoanRate(values.defaultLoanRate);
    settings.setDefaultLoanDurationYears(values.defaultLoanDurationYears);
    settings.setDefaultLoanInsuranceRate(values.defaultLoanInsuranceRate);
    toast.success(t('settingsSaved'));
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
            <h3 className="text-lg font-semibold">{t('sectionGeneral')}</h3>
            <FormField
              control={form.control}
              name="defaultTargetDTI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defaultTargetDTILabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={20} max={50} step={1}
                      value={[field.value]} onValueChange={(val) => field.onChange(val[0])}
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
              name="defaultRentRetention"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defaultRentRetentionLabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0} max={100} step={1}
                      value={[field.value]} onValueChange={(val) => field.onChange(val[0])}
                      className="w-[100%]"
                    />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <h3 className="text-lg font-semibold">{t('sectionTaxation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultTMI"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('defaultTMILabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultPS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('defaultPSLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <h3 className="text-lg font-semibold">{t('sectionInvestment')}</h3>
            <FormField
              control={form.control}
              name="defaultAcqCostsPct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defaultAcqCostsPctLabel')}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0} max={20} step={0.1}
                      value={[field.value]} onValueChange={(val) => field.onChange(val[0])}
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
              name="defaultLoanRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defaultLoanRateLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                    <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultLoanDurationYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defaultLoanDurationYearsLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultLoanInsuranceRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defaultLoanInsuranceRateLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <div className="text-right text-sm text-muted-foreground">{field.value}%</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">{t('saveButton')}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;