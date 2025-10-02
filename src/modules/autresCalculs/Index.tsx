"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import BrutNetPage from '@/modules/brutNet/Index';
import RateSolverDemo from '@/modules/epargne/RateSolverDemo';

const AutresCalculsPage = () => {
  const { t } = useTranslation('autresCalculsPage');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="brut-net" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="brut-net">{t('brutNetTab')}</TabsTrigger>
            <TabsTrigger value="rate-solver">{t('rateSolverTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="brut-net">
            <BrutNetPage />
          </TabsContent>
          <TabsContent value="rate-solver">
            <RateSolverDemo />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutresCalculsPage;