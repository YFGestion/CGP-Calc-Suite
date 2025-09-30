"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreditPage = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.credit')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu du module Crédit. (En développement)</p>
      </CardContent>
    </Card>
  );
};

export default CreditPage;