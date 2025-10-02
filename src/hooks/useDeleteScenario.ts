"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useDeleteScenario = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation<void, Error, string>({ // string is the scenario ID
    mutationFn: async (scenarioId: string) => {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) {
        throw new Error(t('scenarioDeletedError') + ': ' + error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success(t('scenarioDeletedSuccess'));
    },
    onError: (error) => {
      toast.error(error.message || t('scenarioDeletedError'));
    },
  });
};