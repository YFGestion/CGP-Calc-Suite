"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/toast'; // Import toast utility functions

interface DeleteScenarioParams {
  id: string;
}

export const useDeleteScenario = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation<void, Error, DeleteScenarioParams>({
    mutationFn: async ({ id }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t('authError') + ': ' + userError.message);
      }
      if (!user) {
        throw new Error(t('notAuthenticatedError'));
      }

      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own scenarios

      if (error) {
        throw new Error(t('scenarioDeletedError') + ': ' + error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] }); // Invalidate 'scenarios' queries to refresh the list
      showSuccess(t('scenarioDeletedSuccess'));
    },
    onError: (error) => {
      showError(error.message || t('scenarioDeletedError'));
    },
  });
};