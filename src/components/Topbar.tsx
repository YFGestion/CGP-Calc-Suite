"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Import Button
import { Menu } from 'lucide-react'; // Import Menu icon

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpenMobileSidebar?: () => void;
  isMobile?: boolean;
}

export function Topbar({ className, onOpenMobileSidebar, isMobile }: TopbarProps) {
  const { t } = useTranslation('common'); // Explicitly use 'common' namespace

  return (
    <div className={cn("border-b bg-background py-4 px-6 flex items-center justify-between", className)}>
      {isMobile && onOpenMobileSidebar && (
        <Button variant="ghost" size="icon" onClick={onOpenMobileSidebar} className="mr-4" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </Button>
      )}
      <h1 className="text-xl font-bold text-foreground">{t('appName')}</h1>
      {/* Future: User menu, notifications, etc. */}
    </div>
  );
}