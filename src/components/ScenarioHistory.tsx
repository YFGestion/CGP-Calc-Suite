"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale'; // Import French locale for date formatting

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MoreHorizontal, Trash2, Copy, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { useScenarios } from '@/hooks/useScenarios';
import { useDeleteScenario } from '@/hooks/useDeleteScenario';
import { useSaveScenario } from '@/hooks/useSaveScenario';
import { Scenario } from '@/types/scenario';
import { formatCurrency, formatPercent } from '@/lib/format';

const getModulePath = (moduleName: string): string => {
  switch (moduleName) {
    case 'Épargne':
      return '/epargne';
    case 'Endettement':
      return '/endettement';
    case 'Crédit':
      return '/credit';
    case 'Immo':
      return '/immo';
    case 'Brut → Net':
      return '/autres-calculs?tab=brut-net'; // Assuming BrutNet is under 'autres-calculs' tab
    case 'Taux Épargne (TRI)':
      return '/autres-calculs?tab=rate-solver'; // Assuming RateSolver is under 'autres-calculs' tab
    case 'Calculateur TVA':
      return '/autres-calculs?tab=tva-calculator'; // Assuming TvaCalculator is under 'autres-calculs' tab
    default:
      return '/';
  }
};

const getScenarioSummary = (scenario: Scenario, t: (key: string, options?: any) => string): string => {
  const { module, outputs } = scenario;

  try {
    switch (module) {
      case 'Épargne':
        const epargneOutputs = outputs as { finalCapital?: number; grossGains?: number };
        return t('scenarioHistoryPage.summaryEpargne', {
          finalCapital: epargneOutputs.finalCapital !== undefined ? formatCurrency(epargneOutputs.finalCapital) : 'N/A',
          grossGains: epargneOutputs.grossGains !== undefined ? formatCurrency(epargneOutputs.grossGains) : 'N/A',
        });
      case 'Endettement':
        const endettementOutputs = outputs as { affordablePrincipal?: number; maxPayment?: number };
        return t('scenarioHistoryPage.summaryEndettement', {
          affordablePrincipal: endettementOutputs.affordablePrincipal !== undefined ? formatCurrency(endettementOutputs.affordablePrincipal) : 'N/A',
          maxPayment: endettementOutputs.maxPayment !== undefined ? formatCurrency(endettementOutputs.maxPayment) : 'N/A',
        });
      case 'Crédit':
        const creditOutputs = outputs as { totals?: { cost?: number }; schedule?: { payment?: number }[] };
        return t('scenarioHistoryPage.summaryCredit', {
          totalCost: creditOutputs.totals?.cost !== undefined ? formatCurrency(creditOutputs.totals.cost) : 'N/A',
          monthlyPayment: creditOutputs.schedule?.[0]?.payment !== undefined ? formatCurrency(creditOutputs.schedule[0].payment) : 'N/A',
        });
      case 'Immo':
        const immoOutputs = outputs as { cagr?: number; capitalRecoveredAtSale?: number };
        return t('scenarioHistoryPage.summaryImmo', {
          cagr: immoOutputs.cagr !== undefined && !isNaN(immoOutputs.cagr) ? formatPercent(immoOutputs.cagr, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A',
          capitalRecoveredAtSale: immoOutputs.capitalRecoveredAtSale !== undefined ? formatCurrency(immoOutputs.capitalRecoveredAtSale) : 'N/A',
        });
      default:
        return t('scenarioHistoryPage.summaryGeneric');
    }
  } catch (e) {
    console.error("Error generating scenario summary:", e);
    return t('scenarioHistoryPage.summaryGeneric');
  }
};

const ScenarioHistory = () => {
  const { t } = useTranslation('scenarioHistoryPage');
  const { t: commonT } = useTranslation('common');
  const navigate = useNavigate();

  const { data: scenarios, isLoading, isError, error } = useScenarios();
  const deleteMutation = useDeleteScenario();
  const saveMutation = useSaveScenario(); // For duplicating

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

  const handleDeleteClick = (scenarioId: string) => {
    setScenarioToDelete(scenarioId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (scenarioToDelete) {
      deleteMutation.mutate(scenarioToDelete);
      setScenarioToDelete(null);
    }
  };

  const handleDuplicateScenario = (scenario: Scenario) => {
    const { id, user_id, created_at, updated_at, ...scenarioToDuplicate } = scenario;
    saveMutation.mutate({ scenario: scenarioToDuplicate });
  };

  const handleReloadScenario = (scenario: Scenario) => {
    const modulePath = getModulePath(scenario.module);
    const params = new URLSearchParams();

    // Convert inputs object to URL search parameters
    for (const key in scenario.inputs) {
      const value = scenario.inputs[key];
      if (value !== undefined && value !== null) {
        // Special handling for boolean values to ensure they are 'true'/'false' strings
        if (typeof value === 'boolean') {
          params.append(key, value.toString());
        } else if (typeof value === 'object' && value !== null) {
          // For nested objects (like loan.insurance), stringify them
          params.append(key, JSON.stringify(value));
        }
        else {
          params.append(key, String(value));
        }
      }
    }
    navigate(`${modulePath}?${params.toString()}`);
    toast.info(commonT('scenarioReloaded')); // Add a translation for this
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent><p>{t('loading')}</p></CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">{t('error')}: {error?.message}</p></CardContent>
      </Card>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent><p>{t('noScenarios')}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
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
                  <TableCell>{scenario.module}</TableCell>
                  <TableCell>{format(new Date(scenario.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                  <TableCell>{format(new Date(scenario.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getScenarioSummary(scenario, t)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{commonT('openMenu')}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReloadScenario(scenario)}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          {t('actionReload')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateScenario(scenario)}>
                          <Copy className="mr-2 h-4 w-4" />
                          {t('actionDuplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(scenario.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('actionDelete')}
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
              <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setScenarioToDelete(null)}>{t('deleteConfirmCancel')}</AlertDialogCancel>
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