"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scenario } from '@/types/scenario';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Define the payload type for the mutation, allowing 'id' to be optional for new scenarios
type ScenarioPayload = Omit<Scenario, 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

interface SaveScenarioParams {
  scenario: ScenarioPayload;
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

      const { id, ...scenarioData } = scenario; // Destructure id from scenario payload

      let data;
      let error;

      if (id) {
        // If an ID is provided, update the existing scenario
        ({ data, error } = await supabase
          .from('scenarios')
          .update({ ...scenarioData, user_id: user.id, updated_at: new Date().toISOString() }) // Explicitly set updated_at
          .eq('id', id)
          .select()
          .single());
      } else {
        // If no ID is provided, insert a new scenario
        ({ data, error } = await supabase
          .from('scenarios')
          .insert({ ...scenarioData, user_id: user.id })
          .select()
          .single());
      }

      if (error) {
        throw new Error(t('saveScenarioError') + ': ' + error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] }); // Invalidate 'scenarios' queries to refresh the list
      toast.success(t('scenarioSavedSuccess'));
    },
    onError: (error) => {
      toast.error(error.message || t('scenarioSavedError'));
    },
  });
};