"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scenario } from '@/types/scenario';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface SaveScenarioParams {
  scenario: Omit<Scenario, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
}

export const useSaveScenario = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation<Scenario, Error, SaveScenarioParams>({
    mutationFn: async ({ scenario }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t('authError') + ': ' + userError.message);
      }
      if (!user) {
        throw new Error(t('notAuthenticatedError'));
      }

      const scenarioToSave = {
        ...scenario,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('scenarios')
        .insert(scenarioToSave)
        .select()
        .single();

      if (error) {
        throw new Error(t('saveScenarioError') + ': ' + error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] }); // Invalide les requêtes 'scenarios' pour rafraîchir la liste
      toast.success(t('scenarioSavedSuccess'));
    },
    onError: (error) => {
      toast.error(error.message || t('scenarioSavedError'));
    },
  });
};