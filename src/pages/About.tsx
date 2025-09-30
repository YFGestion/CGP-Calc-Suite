"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AboutPage = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aboutPage.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{t('aboutPage.content')}</p>
      </CardContent>
    </Card>
  );
};

export default AboutPage;