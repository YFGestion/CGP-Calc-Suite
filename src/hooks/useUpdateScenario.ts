"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scenario } from '@/types/scenario';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/toast'; // Import toast utility functions

interface UpdateScenarioParams {
  id: string;
  updates: Partial<Omit<Scenario, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
}

export const useUpdateScenario = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation<Scenario, Error, UpdateScenarioParams>({
    mutationFn: async ({ id, updates }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t('authError') + ': ' + userError.message);
      }
      if (!user) {
        throw new Error(t('notAuthenticatedError'));
      }

      const { data, error } = await supabase
        .from('scenarios')
        .update({ ...updates, updated_at: new Date().toISOString() }) // Automatically update 'updated_at'
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own scenarios
        .select()
        .single();

      if (error) {
        throw new Error(t('scenarioUpdateError') + ': ' + error.message);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] }); // Invalidate 'scenarios' list
      queryClient.invalidateQueries({ queryKey: ['scenario', variables.id] }); // Invalidate specific scenario
      showSuccess(t('scenarioUpdatedSuccess'));
    },
    onError: (error) => {
      showError(error.message || t('scenarioUpdateError'));
    },
  });
};