"use client";

import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';

interface UseUserResult {
  id: string | null;
  email: string | null;
  role: string | null; // Assuming role is stored in user.app_metadata.user_role
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export const useUser = (): UseUserResult => {
  const { user, isLoading } = useSession();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    id: user?.id || null,
    email: user?.email || null,
    role: (user?.app_metadata?.user_role as string) || null, // Cast to string, default to null if not present
    signOut,
    isLoading,
  };
};