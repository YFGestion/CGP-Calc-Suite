"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

interface UpgradeMessageProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onUpgradeClick?: () => void;
  className?: string;
}

export const UpgradeMessage: React.FC<UpgradeMessageProps> = ({
  title,
  description,
  buttonText,
  onUpgradeClick,
  className,
}) => {
  const { t } = useTranslation('common');

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <CardTitle className="text-2xl font-bold">{title || t('upgradeMessageTitle')}</CardTitle>
        <CardDescription>{description || t('upgradeMessageDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={onUpgradeClick} className="mt-4">
          {buttonText || t('upgradeButton')}
        </Button>
      </CardContent>
    </Card>
  );
};