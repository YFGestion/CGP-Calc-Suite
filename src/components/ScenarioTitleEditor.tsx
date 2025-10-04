"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUpdateScenario } from '@/hooks/useUpdateScenario';

interface ScenarioTitleEditorProps {
  scenarioId: string;
  initialTitle: string;
  onTitleUpdated?: (newTitle: string) => void;
}

const formSchema = (t: (key: string) => string) => z.object({
  clientName: z.string().min(1, t('scenarioTitleEditor:validation.scenarioTitleRequired')).max(100, t('scenarioTitleEditor:validation.scenarioTitleTooLong')),
});

export const ScenarioTitleEditor: React.FC<ScenarioTitleEditorProps> = ({
  scenarioId,
  initialTitle,
  onTitleUpdated,
}) => {
  const { t } = useTranslation(['common', 'scenarioTitleEditor']);
  const { mutate: updateScenario, isPending } = useUpdateScenario();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      clientName: initialTitle,
    },
  });

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    updateScenario(
      {
        id: scenarioId,
        updates: { client_name: values.clientName },
      },
      {
        onSuccess: () => {
          onTitleUpdated?.(values.clientName);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scenarioTitleEditor:scenarioNameLabel')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('scenarioTitleEditor:scenarioNamePlaceholder')}
                  {...field}
                  aria-label={t('scenarioTitleEditor:scenarioNameLabel')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? t('common:loading') : t('scenarioTitleEditor:saveButton')}
        </Button>
      </form>
    </Form>
  );
};