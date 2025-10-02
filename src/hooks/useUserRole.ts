"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useTranslation } from 'react-i18next';

interface UseUserRoleResult {
  role: string | null;
  isPremium: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const useUserRole = (): UseUserRoleResult => {
  const { user, isLoading: isSessionLoading } = useSession();
  const { t } = useTranslation('common');

  const { data, isLoading, isError, error } = useQuery<string | null, Error>({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error(t('fetchUserRoleError') + ': ' + error.message);
      }
      return data?.role || null;
    },
    enabled: !!user?.id && !isSessionLoading, // Only run query if user ID is available and session is not loading
    staleTime: 1000 * 60 * 5, // Cache role for 5 minutes
  });

  const isPremium = data !== null && data !== 'free';

  return {
    role: data,
    isPremium,
    isLoading: isLoading || isSessionLoading,
    isError,
    error,
  };
};