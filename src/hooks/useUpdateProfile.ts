"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/toast';

interface UpdateProfileParams {
  firstName?: string | null;
  lastName?: string | null;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('profilePage');
  const { t: commonT } = useTranslation('common');

  return useMutation<void, Error, UpdateProfileParams>({
    mutationFn: async ({ firstName, lastName }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(commonT('authError') + ': ' + userError.message);
      }
      if (!user) {
        throw new Error(commonT('notAuthenticatedError'));
      }

      const updates: { first_name?: string | null; last_name?: string | null; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };

      if (firstName !== undefined) {
        updates.first_name = firstName;
      }
      if (lastName !== undefined) {
        updates.last_name = lastName;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw new Error(t('profileUpdateError') + ': ' + error.message);
      }
    },
    onSuccess: () => {
      // Invalider spécifiquement la requête du profil utilisateur pour forcer la mise à jour
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); 
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); // Invalidate admin users list if applicable
      showSuccess(t('profileUpdateSuccess'));
    },
    onError: (error) => {
      showError(error.message || t('profileUpdateError'));
    },
  });
};