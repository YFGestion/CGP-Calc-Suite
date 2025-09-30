"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Topbar({ className }: TopbarProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("border-b bg-background py-4 px-6 flex items-center justify-between", className)}>
      <h1 className="text-xl font-bold text-foreground">{t('common.appName')}</h1>
      {/* Future: User menu, notifications, etc. */}
    </div>
  );
}