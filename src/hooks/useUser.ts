"use client";

import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface UseUserResult {
  id: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null; // Assuming role is stored in user.app_metadata.user_role
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export const useUser = (): UseUserResult => {
  const { user: authUser, isLoading: isSessionLoading } = useSession();
  const { t } = useTranslation('common');

  const { data: profileData, isLoading: isProfileLoading } = useQuery<{ first_name: string | null; last_name: string | null; role: string | null } | null, Error>({
    queryKey: ['userProfile', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine if profile doesn't exist yet
        console.error('Error fetching user profile:', error);
        // Optionally throw an error or handle it more gracefully
        // throw new Error(t('fetchUserProfileError') + ': ' + error.message);
      }
      return data;
    },
    enabled: !!authUser?.id && !isSessionLoading,
    staleTime: 1000 * 60 * 5, // Cache profile for 5 minutes
  });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    id: authUser?.id || null,
    email: authUser?.email || null,
    firstName: profileData?.first_name || null,
    lastName: profileData?.last_name || null,
    role: profileData?.role || null,
    signOut,
    isLoading: isSessionLoading || isProfileLoading,
  };
};