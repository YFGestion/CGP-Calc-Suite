"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Copy as CopyIcon } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface KeyFact {
  label: string;
  value: string;
}

interface ModuleSummaryExporterProps {
  moduleTitle: string;
  keyFacts: KeyFact[];
  recommendations?: string[];
  rawInputs: Record<string, unknown>;
  rawOutputs: Record<string, unknown>;
  className?: string;
}

export const ModuleSummaryExporter: React.FC<ModuleSummaryExporterProps> = ({
  moduleTitle,
  keyFacts,
  recommendations = [],
  rawInputs,
  rawOutputs,
  className,
}) => {
  const { t } = useTranslation(['common', 'moduleSummaryExporter']);

  const generatePlainTextSummary = (): string => {
    let summary = `${moduleTitle}\n\n`;
    summary += `${t('moduleSummaryExporter:keyData')}:\n`;
    keyFacts.forEach(fact => {
      summary += `- ${fact.label}: ${fact.value}\n`;
    });

    if (recommendations.length > 0) {
      summary += `\n${t('moduleSummaryExporter:recommendations')}:\n`;
      recommendations.forEach(rec => {
        summary += `- ${rec}\n`;
      });
    }

    summary += `\n${t('moduleSummaryExporter:rawInputs')}:\n`;
    summary += JSON.stringify(rawInputs, null, 2);

    summary += `\n\n${t('moduleSummaryExporter:rawOutputs')}:\n`;
    summary += JSON.stringify(rawOutputs, null, 2);

    return summary;
  };

  const generateHtmlTableSummary = (): string => {
    let html = `<div style="font-family: sans-serif; color: #333;">`;
    html += `<h2 style="color: #0b1488;">${moduleTitle}</h2>`;

    html += `<h3 style="color: #070d59;">${t('moduleSummaryExporter:keyData')}</h3>`;
    html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">`;
    html += `<thead><tr style="background-color: #f4f8fc; border-bottom: 1px solid #ceddef;">`;
    html += `<th style="padding: 8px; text-align: left; border: 1px solid #ceddef;">${t('moduleSummaryExporter:label')}</th>`;
    html += `<th style="padding: 8px; text-align: left; border: 1px solid #ceddef;">${t('moduleSummaryExporter:value')}</th>`;
    html += `</tr></thead><tbody>`;
    keyFacts.forEach(fact => {
      html += `<tr style="border-bottom: 1px solid #ceddef;">`;
      html += `<td style="padding: 8px; border: 1px solid #ceddef;">${fact.label}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ceddef;">${fact.value}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;

    if (recommendations.length > 0) {
      html += `<h3 style="color: #070d59;">${t('moduleSummaryExporter:recommendations')}</h3>`;
      html += `<ul style="list-style-type: disc; margin-left: 20px; margin-bottom: 15px;">`;
      recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += `</ul>`;
    }

    html += `<h3 style="color: #070d59;">${t('moduleSummaryExporter:rawInputs')}</h3>`;
    html += `<pre style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 10px; overflow-x: auto; font-size: 0.9em;">${JSON.stringify(rawInputs, null, 2)}</pre>`;

    html += `<h3 style="color: #070d59;">${t('moduleSummaryExporter:rawOutputs')}</h3>`;
    html += `<pre style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 10px; overflow-x: auto; font-size: 0.9em;">${JSON.stringify(rawOutputs, null, 2)}</pre>`;

    html += `</div>`;
    return html;
  };

  const copyToClipboard = async (text: string, successMessage: string, errorMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(successMessage);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError(errorMessage);
    }
  };

  const plainTextSummary = generatePlainTextSummary();
  const htmlTableSummary = generateHtmlTableSummary();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{t('moduleSummaryExporter:title')}</CardTitle>
        <CardDescription>{t('moduleSummaryExporter:description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plain Text Export */}
        <div className="space-y-2">
          <h4 className="text-md font-semibold">{t('moduleSummaryExporter:plainTextFormat')}</h4>
          <Textarea
            value={plainTextSummary}
            readOnly
            rows={10}
            className="font-mono text-xs resize-y"
            aria-label={t('moduleSummaryExporter:plainTextSummary')}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => copyToClipboard(plainTextSummary, t('common:copied'), t('common:copyError'))}
          >
            <CopyIcon className="mr-2 h-4 w-4" />
            {t('common:copy')}
          </Button>
        </div>

        <Separator />

        {/* HTML Table Export */}
        <div className="space-y-2">
          <h4 className="text-md font-semibold">{t('moduleSummaryExporter:htmlTableFormat')}</h4>
          <Textarea
            value={htmlTableSummary}
            readOnly
            rows={10}
            className="font-mono text-xs resize-y"
            aria-label={t('moduleSummaryExporter:htmlTableSummary')}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => copyToClipboard(htmlTableSummary, t('common:copied'), t('common:copyError'))}
          >
            <CopyIcon className="mr-2 h-4 w-4" />
            {t('common:copy')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};