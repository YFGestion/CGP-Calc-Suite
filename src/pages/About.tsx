"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AboutPage = () => {
  const { t } = useTranslation('aboutPage'); // Spécifie le namespace 'aboutPage'
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{t('content')}</p>
        <p className="text-sm text-muted-foreground italic">{t('disclaimerFull')}</p>
      </CardContent>
    </Card>
  );
};

export default AboutPage;