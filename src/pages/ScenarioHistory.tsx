"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Copy, Trash2, RefreshCcw, Eye } from 'lucide-react'; // Added Eye icon
import { useScenarios } from '@/hooks/useScenarios';
import { useDuplicateScenario } from '@/hooks/useDuplicateScenario';
import { useDeleteScenario } from '@/hooks/useDeleteScenario';
import { useSession } from '@/components/SessionContextProvider';
import { Scenario } from '@/types/scenario';
import { formatDateTime, reloadScenarioInModule } from '@/lib/scenario-utils'; // Import reloadScenarioInModule
import { Badge } from '@/components/ui/badge'; // Import Badge

const ScenarioHistoryPage = () => {
  const { t } = useTranslation(['scenarioHistoryPage', 'common']);
  const navigate = useNavigate();
  const { session, isLoading: isSessionLoading } = useSession();
  const { data: scenarios, isLoading: isScenariosLoading, isError, error } = useScenarios();
  const { mutate: duplicateScenario } = useDuplicateScenario();
  const { mutate: deleteScenario } = useDeleteScenario();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

  const handleDeleteClick = (scenarioId: string) => {
    setScenarioToDelete(scenarioId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (scenarioToDelete) {
      deleteScenario({ id: scenarioToDelete });
      setScenarioToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleDuplicateClick = (scenario: Scenario) => {
    duplicateScenario({ scenario });
  };

  const handleViewClick = (scenario: Scenario) => {
    navigate(`/scenarios/${scenario.id}`);
  };

  const handleReloadClick = (scenario: Scenario) => {
    reloadScenarioInModule(scenario, navigate);
  };

  if (isSessionLoading || isScenariosLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">{t('loading')}</CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <CardDescription>{t('notAuthenticated')}</CardDescription>
          <Button onClick={() => navigate('/login')} className="mt-4">{t('common:login')}</Button>
        </CardContent>
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

  if (!scenarios || scenarios.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <CardDescription>{t('noScenarios')}</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">{scenario.client_name}</CardTitle>
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {t(`common:${scenario.module}`)}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  {t('tableHeaderCreatedAt')}: {formatDateTime(scenario.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('tableHeaderUpdatedAt')}: {formatDateTime(scenario.updated_at)}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <Button variant="outline" size="sm" onClick={() => handleViewClick(scenario)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t('actionView')}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('common:openMenu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleReloadClick(scenario)}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        <span>{t('actionReload')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateClick(scenario)}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>{t('actionDuplicate')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(scenario.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t('actionDelete')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('deleteConfirmCancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('deleteConfirmAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </div>
  );
};

export default ScenarioHistoryPage;