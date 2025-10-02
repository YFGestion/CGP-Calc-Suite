"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scenario } from '@/types/scenario';
import { useTranslation } from 'react-i18next';

export const useScenarios = () => {
  const { t } = useTranslation('common');

  return useQuery<Scenario[], Error>({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t('authError') + ': ' + userError.message);
      }
      if (!user) {
        // If no user is logged in, return an empty array.
        // The UI can then display a message like "Please log in to see your scenarios."
        return [];
      }

      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(t('fetchScenariosError') + ': ' + error.message);
      }

      return data || [];
    },
    // Refetch every 5 minutes to keep the list fresh, or adjust as needed
    staleTime: 1000 * 60 * 5,
  });
};