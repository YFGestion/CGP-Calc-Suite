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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { MoreHorizontal, Copy, Trash2, RefreshCcw } from 'lucide-react';
import { useScenarios } from '@/hooks/useScenarios';
import { useDuplicateScenario } from '@/hooks/useDuplicateScenario';
import { useDeleteScenario } from '@/hooks/useDeleteScenario';
import { useSession } from '@/components/SessionContextProvider';
import { Scenario } from '@/types/scenario';
import { getScenarioSummary, getModulePath, getModuleTab, formatDateTime } from '@/lib/scenario-utils';

const ScenarioHistory = () => {
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

  const handleReloadClick = (scenario: Scenario) => {
    const modulePath = getModulePath(scenario.module);
    const moduleTab = getModuleTab(scenario.module);

    const params = new URLSearchParams();
    // Add all inputs as search parameters
    for (const key in scenario.inputs) {
      if (Object.prototype.hasOwnProperty.call(scenario.inputs, key)) {
        const value = scenario.inputs[key];
        // Handle boolean values specifically
        if (typeof value === 'boolean') {
          params.append(key, value.toString());
        } else if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      }
    }

    let targetPath = modulePath;
    if (moduleTab) {
      // For modules under 'autres-calculs', we need to navigate to the tab
      targetPath = `${modulePath}?tab=${moduleTab}&${params.toString()}`;
    } else {
      targetPath = `${modulePath}?${params.toString()}`;
    }

    navigate(targetPath);
    t('common:scenarioReloaded'); // Display toast message
  };

  if (isSessionLoading || isScenariosLoading) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">{t('loading')}</CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="w-full">
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
      <Card className="w-full">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-destructive">
          {t('error')} {error?.message}
        </CardContent>
      </Card>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <CardDescription>{t('noScenarios')}</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaderClientName')}</TableHead>
                <TableHead>{t('tableHeaderModule')}</TableHead>
                <TableHead>{t('tableHeaderCreatedAt')}</TableHead>
                <TableHead>{t('tableHeaderUpdatedAt')}</TableHead>
                <TableHead>{t('tableHeaderSummary')}</TableHead>
                <TableHead className="text-right">{t('tableHeaderActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((scenario) => (
                <TableRow key={scenario.id}>
                  <TableCell className="font-medium">{scenario.client_name}</TableCell>
                  <TableCell>{t(`common:${scenario.module}`)}</TableCell>
                  <TableCell>{formatDateTime(scenario.created_at)}</TableCell>
                  <TableCell>{formatDateTime(scenario.updated_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getScenarioSummary(scenario)}
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </Card>
  );
};

export default ScenarioHistory;