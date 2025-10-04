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
import { formatDateTime, reloadScenarioInModule } from '@/lib/scenario-utils';
import { ScenarioTitleEditor } from '@/components/ScenarioTitleEditor';
import { ScenarioMetadataForm } from '@/components/ScenarioMetadataForm'; // Import new component
import { RefreshCcw } from 'lucide-react';

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

  const handleReloadClick = () => {
    reloadScenarioInModule(scenario, navigate);
  };

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
            onTitleUpdated={() => {
              // No need to do anything here, useUpdateScenario invalidates queries
            }}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('editAdditionalInfo')}</h3> {/* Updated translation key */}
          <ScenarioMetadataForm
            scenarioId={scenario.id}
            initialDescription={scenario.description}
            initialTags={scenario.tags}
            onMetadataUpdated={() => {
              // No need to do anything here, useUpdateScenario invalidates queries
            }}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('loadScenario')}</h3>
          <Button onClick={handleReloadClick} className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('loadScenarioButton')}
          </Button>
        </div>

        <Button onClick={() => navigate('/scenarios')} className="w-full">
          {t('backToScenarios')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScenarioDetail;