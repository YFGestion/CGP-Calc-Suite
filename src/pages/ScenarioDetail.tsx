"use client";

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useScenario } from '@/hooks/useScenario';
import { formatDateTime } from '@/lib/scenario-utils';
import { ScenarioTitleEditor } from '@/components/ScenarioTitleEditor'; // Import the new editor

const ScenarioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['scenarioDetailPage', 'common']);

  const { data: scenario, isLoading, isError, error } = useScenario(id);

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">{t('common:loading')}</CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-destructive">
          {t('error')} {error?.message}
        </CardContent>
      </Card>
    );
  }

  if (!scenario) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <CardDescription>{t('scenarioNotFound')}</CardDescription>
          <Button onClick={() => navigate('/scenarios')} className="mt-4">{t('backToScenarios')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('scenarioInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>{t('scenarioName')}:</strong> {scenario.client_name}</p>
            <p><strong>{t('module')}:</strong> {t(`common:${scenario.module}`)}</p>
            <p><strong>{t('createdAt')}:</strong> {formatDateTime(scenario.created_at)}</p>
            <p><strong>{t('updatedAt')}:</strong> {formatDateTime(scenario.updated_at)}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('editTitle')}</h3>
          <ScenarioTitleEditor
            scenarioId={scenario.id}
            initialTitle={scenario.client_name}
            onTitleUpdated={(newTitle) => {
              // Optionally update local state or refetch if needed,
              // but useUpdateScenario already invalidates queries.
              console.log(`Scenario title updated to: ${newTitle}`);
            }}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('inputs')}</h3>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(scenario.inputs, null, 2)}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('outputs')}</h3>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(scenario.outputs, null, 2)}
          </pre>
        </div>

        <Button onClick={() => navigate('/scenarios')} className="w-full">
          {t('backToScenarios')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScenarioDetail;