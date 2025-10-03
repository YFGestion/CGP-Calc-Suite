"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminUserProfile } from '@/types/user';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/components/SessionContextProvider';
import { useUserRole } from './useUserRole'; // To check if current user is admin

export const useAdminUsers = () => {
  const { t } = useTranslation('common');
  const { session, isLoading: isSessionLoading } = useSession();
  const { role: currentUserRole, isLoading: isRoleLoading } = useUserRole();

  return useQuery<AdminUserProfile[], Error>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!session || !session.access_token) {
        throw new Error(t('notAuthenticatedError'));
      }
      if (currentUserRole !== 'admin') {
        throw new Error(t('adminDashboard.notAdminError'));
      }

      const response = await fetch('https://lxxcixzgxveaykveyywm.supabase.co/functions/v1/get-all-user-profiles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('adminDashboard.fetchUsersError'));
      }

      const data: AdminUserProfile[] = await response.json();
      return data;
    },
    enabled: !!session && !isSessionLoading && !isRoleLoading && currentUserRole === 'admin', // Only run if authenticated and admin
    staleTime: 1000 * 60 * 1, // Cache for 1 minute
  });
};