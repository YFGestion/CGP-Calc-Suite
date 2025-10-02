"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showSuccess, showInfo } from '@/utils/toast'; // Import toast utility functions

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        if (location.pathname === '/login') {
          navigate('/'); // Redirect to home page after successful login
          showSuccess(t('loggedInSuccess'));
        }
      } else {
        setSession(null);
        setUser(null);
        if (location.pathname !== '/login' && location.pathname !== '/about' && location.pathname !== '/') {
          navigate('/login'); // Redirect to login if not authenticated and not on public pages
          showInfo(t('loggedOutInfo'));
        }
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        if (location.pathname === '/login') {
          navigate('/'); // Redirect to home page
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, t]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};