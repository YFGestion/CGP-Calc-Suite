"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/SessionContextProvider';

const DashboardPage = () => {
  const { t } = useTranslation('dashboardPage');
  const { user } = useSession();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg">
          {t('welcomeMessage')}{user?.email ? `, ${user.email}` : ''}!
        </p>
        <p className="mt-4">{t('content')}</p>
      </CardContent>
    </Card>
  );
};

export default DashboardPage;