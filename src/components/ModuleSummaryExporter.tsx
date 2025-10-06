"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Copy as CopyIcon, Download, FileText, FileInput } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// For DOCX export
import { saveAs } from 'file-saver';

// For PDF export
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Extends jsPDF with autoTable method

interface KeyFact {
  label: string;
  value: string;
}

interface ModuleSummaryExporterProps {
  moduleTitle: string;
  keyFacts: KeyFact[];
  className?: string;
}

export const ModuleSummaryExporter: React.FC<ModuleSummaryExporterProps> = ({
  moduleTitle,
  keyFacts,
  className,
}) => {
  const { t } = useTranslation(['common', 'moduleSummaryExporter']);

  const generatePlainTextSummary = (): string => {
    let summary = `${moduleTitle}\n\n`;
    summary += `${t('moduleSummaryExporter:keyData')}:\n`;
    keyFacts.forEach(fact => {
      summary += `- ${fact.label}: ${fact.value}\n`;
    });
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

  const handleExportDocx = async () => {
    try {
      const htmlContent = generateHtmlTableSummary();
      const response = await fetch('/api/export-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlContent, moduleTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('moduleSummaryExporter:exportDocxError'));
      }

      const blob = await response.blob();
      saveAs(blob, `${moduleTitle.replace(/\s/g, '-')}-summary.docx`);
      showSuccess(t('moduleSummaryExporter:exportDocxSuccess'));
    } catch (error: any) {
      console.error('Error exporting to DOCX:', error);
      showError(error.message || t('moduleSummaryExporter:exportDocxError'));
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      let yOffset = 20;

      doc.setFontSize(18);
      doc.text(moduleTitle, 14, yOffset);
      yOffset += 10;

      doc.setFontSize(14);
      doc.text(t('moduleSummaryExporter:keyData'), 14, yOffset);
      yOffset += 5;

      // Prepare data for autoTable
      const tableColumn = [t('moduleSummaryExporter:label'), t('moduleSummaryExporter:value')];
      const tableRows = keyFacts.map(fact => [fact.label, fact.value]);

      (doc as any).autoTable({
        startY: yOffset,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [244, 248, 252], // --background-light
          textColor: [7, 13, 89], // --foreground-dark
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        bodyStyles: {
          textColor: [7, 13, 89],
        },
        margin: { left: 14, right: 14 },
      });

      yOffset = (doc as any).autoTable.previous.finalY + 10;

      doc.save(`${moduleTitle.replace(/\s/g, '-')}-summary.pdf`);
      showSuccess(t('moduleSummaryExporter:exportPdfSuccess'));
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showError(t('moduleSummaryExporter:exportPdfError'));
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
        {/* Plain Text Preview */}
        <div className="space-y-2">
          <h4 className="text-md font-semibold">{t('moduleSummaryExporter:plainTextFormat')}</h4>
          <Textarea
            value={plainTextSummary}
            readOnly
            rows={10}
            className="font-mono text-xs resize-y"
            aria-label={t('moduleSummaryExporter:plainTextSummary')}
          />
        </div>

        <Separator />

        {/* HTML Table Preview */}
        <div className="space-y-2">
          <h4 className="text-md font-semibold">{t('moduleSummaryExporter:htmlTableFormat')}</h4>
          <div
            className="border rounded-md p-4 bg-background text-foreground overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: htmlTableSummary }}
            aria-label={t('moduleSummaryExporter:htmlTableSummary')}
          />
        </div>

        <Separator />

        {/* Export Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {t('moduleSummaryExporter:exportButton')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => copyToClipboard(plainTextSummary, t('common:copied'), t('common:copyError'))}>
              <CopyIcon className="mr-2 h-4 w-4" />
              <span>{t('moduleSummaryExporter:copyPlainText')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(htmlTableSummary, t('common:copied'), t('common:copyError'))}>
              <CopyIcon className="mr-2 h-4 w-4" />
              <span>{t('moduleSummaryExporter:copyHtmlTable')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportDocx}>
              <FileText className="mr-2 h-4 w-4" />
              <span>{t('moduleSummaryExporter:exportDocx')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf}>
              <FileInput className="mr-2 h-4 w-4" />
              <span>{t('moduleSummaryExporter:exportPdf')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};