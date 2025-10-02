"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile'; // Import the hook

import BrutNetPage from '@/modules/brutNet/Index';
import RateSolverDemo from '@/modules/epargne/RateSolverDemo';
import TvaCalculator from '@/modules/autresCalculs/TvaCalculator';
import ScenarioHistory from '@/components/ScenarioHistory'; // Import the new component

const AutresCalculsPage = () => {
  const { t } = useTranslation('autresCalculsPage');
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("brut-net"); // State to manage active tab

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMobile ? (
            <Select onValueChange={setActiveTab} defaultValue={activeTab}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder={t('brutNetTab')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brut-net">{t('brutNetTab')}</SelectItem>
                <SelectItem value="rate-solver">{t('rateSolverTab')}</SelectItem>
                <SelectItem value="tva-calculator">{t('tvaCalculatorTab')}</SelectItem>
                <SelectItem value="scenario-history">{t('scenarioHistoryTab')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <TabsList className="flex flex-wrap justify-center w-full gap-2 mb-4">
              <TabsTrigger value="brut-net">{t('brutNetTab')}</TabsTrigger>
              <TabsTrigger value="rate-solver">{t('rateSolverTab')}</TabsTrigger>
              <TabsTrigger value="tva-calculator">{t('tvaCalculatorTab')}</TabsTrigger>
              <TabsTrigger value="scenario-history">{t('scenarioHistoryTab')}</TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="brut-net">
            <BrutNetPage />
          </TabsContent>
          <TabsContent value="rate-solver">
            <RateSolverDemo />
          </TabsContent>
          <TabsContent value="tva-calculator">
            <TvaCalculator />
          </TabsContent>
          <TabsContent value="scenario-history">
            <ScenarioHistory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutresCalculsPage;