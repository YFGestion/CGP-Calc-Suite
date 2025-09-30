"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EndettementPage = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.endettement')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu du module Endettement. (En développement)</p>
      </CardContent>
    </Card>
  );
};

export default EndettementPage;