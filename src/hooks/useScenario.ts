"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scenario } from '@/types/scenario';
import { useTranslation } from 'react-i18next';

export const useScenario = (id: string | undefined) => {
  const { t } = useTranslation('common');

  return useQuery<Scenario | null, Error>({
    queryKey: ['scenario', id],
    queryFn: async () => {
      if (!id) {
        return null;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t('authError') + ': ' + userError.message);
      }
      if (!user) {
        throw new Error(t('notAuthenticatedError'));
      }

      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only fetch their own scenarios
        .single();

      if (error) {
        // If no data is found (e.g., scenario doesn't exist or doesn't belong to user), data will be null and error will be set.
        // We can return null in this case, or throw a more specific error if needed.
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw new Error(t('fetchScenariosError') + ': ' + error.message);
      }

      return data;
    },
    enabled: !!id, // Only run the query if an ID is provided
    staleTime: 1000 * 60 * 5, // Cache scenario for 5 minutes
  });
};