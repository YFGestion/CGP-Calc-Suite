"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSaveScenario } from '@/hooks/useSaveScenario';

interface ScenarioTitleModalProps {
  moduleName: string;
  currentInputs: Record<string, unknown>;
  currentOutputs: Record<string, unknown> | null;
  triggerButtonLabel: string;
  disabled?: boolean;
}

const formSchema = (t: (key: string) => string) => z.object({
  clientName: z.string().min(1, t('scenarioTitleModal:validation.scenarioTitleRequired')).max(100, t('scenarioTitleModal:validation.scenarioTitleTooLong')),
});

export const ScenarioTitleModal: React.FC<ScenarioTitleModalProps> = ({
  moduleName,
  currentInputs,
  currentOutputs,
  triggerButtonLabel,
  disabled = false,
}) => {
  const { t } = useTranslation(['common', 'scenarioTitleModal']);
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: saveScenario, isPending } = useSaveScenario();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      clientName: '',
    },
  });

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    saveScenario(
      {
        scenario: {
          module: moduleName,
          client_name: values.clientName,
          inputs: currentInputs,
          outputs: currentOutputs || {},
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          form.reset(); // Clear the form after successful submission
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1" disabled={disabled}>
          {triggerButtonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('scenarioTitleModal:title')}</DialogTitle>
          <DialogDescription>{t('scenarioTitleModal:description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scenarioTitleModal:scenarioNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('scenarioTitleModal:scenarioNamePlaceholder')}
                      {...field}
                      aria-label={t('scenarioTitleModal:scenarioNameLabel')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('common:loading') : t('scenarioTitleModal:saveButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};