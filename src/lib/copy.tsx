"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy as CopyIcon } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast'; // Using toast utility functions

interface CopyBlockProps {
  title: string;
  content: string;
  className?: string;
}

export const CopyBlock: React.FC<CopyBlockProps> = ({ title, content, className }) => {
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess(t('common.copied'));
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError("Échec de la copie.");
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={t('common.copy')}>
          <CopyIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          readOnly
          className="font-mono text-xs resize-none h-24"
          aria-label="Contenu à copier"
        />
      </CardContent>
    </Card>
  );
};