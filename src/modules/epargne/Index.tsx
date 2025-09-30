"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EpargnePage = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.epargne')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu du module Épargne. (En développement)</p>
      </CardContent>
    </Card>
  );
};

export default EpargnePage;