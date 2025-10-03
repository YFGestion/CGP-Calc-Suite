"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';

interface UpdateUserRoleParams {
  userId: string;
  newRole: string;
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  const { session } = useSession();

  return useMutation<any, Error, UpdateUserRoleParams>({
    mutationFn: async ({ userId, newRole }) => {
      if (!session || !session.access_token) {
        throw new Error(t('notAuthenticatedError'));
      }

      const response = await fetch('https://lxxcixzgxveaykveyywm.supabase.co/functions/v1/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('adminDashboard.updateRoleError'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); // Invalidate the list of users
      queryClient.invalidateQueries({ queryKey: ['userRole'] }); // Invalidate user roles in case current user's role changed
      showSuccess(t('adminDashboard.roleUpdateSuccess'));
    },
    onError: (error) => {
      showError(error.message || t('adminDashboard.roleUpdateError'));
    },
  });
};