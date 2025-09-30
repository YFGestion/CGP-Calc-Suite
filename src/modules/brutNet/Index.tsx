"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BrutNetPage = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.brutNet')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu du module Brut → Net. (En développement)</p>
      </CardContent>
    </Card>
  );
};

export default BrutNetPage;