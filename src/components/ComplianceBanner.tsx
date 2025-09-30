"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function ComplianceBanner() {
  const { t } = useTranslation('compliance'); // Spécifie le namespace 'compliance'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-2 text-center text-sm z-50">
      <Alert className="flex items-center justify-center p-2">
        <Info className="h-4 w-4 mr-2" />
        <AlertDescription className="text-muted-foreground">
          {t('banner')}
        </AlertDescription>
      </Alert>
    </div>
  );
}