"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useUser } from '@/hooks/useUser'; // Import useUser hook

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpenMobileSidebar?: () => void;
  isMobile?: boolean;
}

export function Topbar({ className, onOpenMobileSidebar, isMobile }: TopbarProps) {
  const { t } = useTranslation('common');
  const { firstName, lastName, isLoading: isUserLoading } = useUser(); // Get user info

  const renderGreeting = () => {
    if (isUserLoading) {
      return null; // Or a loading spinner if preferred
    }

    if (firstName && lastName) {
      return `Bonjour, ${firstName} ${lastName}`;
    } else if (firstName) {
      return `Bonjour, ${firstName}`;
    } else if (lastName) {
      return `Bonjour, ${lastName}`;
    } else {
      return t('hello'); // Fallback to a generic "Bonjour"
    }
  };

  return (
    <div className={cn("border-b bg-background py-4 px-6 flex items-center justify-between", className)}>
      <div className="flex items-center">
        {isMobile && onOpenMobileSidebar && (
          <Button variant="ghost" size="icon" onClick={onOpenMobileSidebar} className="mr-4" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <h1 className="text-xl font-bold text-foreground">{t('appName')}</h1>
      </div>
      <div className="text-foreground text-sm font-medium">
        {renderGreeting()}
      </div>
    </div>
  );
}