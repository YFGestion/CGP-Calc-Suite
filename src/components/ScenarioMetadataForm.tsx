"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUpdateScenario } from '@/hooks/useUpdateScenario';
import { MultiSelectCombobox } from './MultiSelectCombobox'; // Import the new component

interface ScenarioMetadataFormProps {
  scenarioId: string;
  initialDescription: string | null;
  initialTags: string[];
  onMetadataUpdated?: () => void;
}

const formSchema = (t: (key: string) => string) => z.object({
  description: z.string().max(500, t('scenarioMetadataForm:validation.descriptionTooLong')).nullable(),
  tags: z.array(z.string().min(1, t('scenarioMetadataForm:validation.tagRequired'))).max(10, t('scenarioMetadataForm:validation.tooManyTags')).default([]),
});

// Dummy options for tags for demonstration. In a real app, these might come from a database.
const predefinedTagOptions = [
  { value: "immobilier", label: "Immobilier" },
  { value: "epargne", label: "Épargne" },
  { value: "credit", label: "Crédit" },
  { value: "fiscalite", label: "Fiscalité" },
  { value: "retraite", label: "Retraite" },
];

export const ScenarioMetadataForm: React.FC<ScenarioMetadataFormProps> = ({
  scenarioId,
  initialDescription,
  initialTags,
  onMetadataUpdated,
}) => {
  const { t } = useTranslation(['common', 'scenarioMetadataForm']);
  const { mutate: updateScenario, isPending } = useUpdateScenario();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      description: initialDescription,
      tags: initialTags,
    },
    values: { // Ensure form values are updated when initial props change
      description: initialDescription,
      tags: initialTags,
    },
  });

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    updateScenario(
      {
        id: scenarioId,
        updates: {
          description: values.description,
          tags: values.tags,
        },
      },
      {
        onSuccess: () => {
          onMetadataUpdated?.();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scenarioMetadataForm:descriptionLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('scenarioMetadataForm:descriptionPlaceholder')}
                  {...field}
                  value={field.value || ''} // Ensure controlled component
                  aria-label={t('scenarioMetadataForm:descriptionLabel')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scenarioMetadataForm:tagsLabel')}</FormLabel>
              <FormControl>
                <MultiSelectCombobox
                  options={predefinedTagOptions}
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder={t('scenarioMetadataForm:tagsPlaceholder')}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? t('common:loading') : t('scenarioMetadataForm:saveButton')}
        </Button>
      </form>
    </Form>
  );
};