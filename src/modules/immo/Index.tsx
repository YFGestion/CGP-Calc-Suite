"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ImmoPage = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.immo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu du module Immo (Effort & TRI). (En développement)</p>
      </CardContent>
    </Card>
  );
};

export default ImmoPage;