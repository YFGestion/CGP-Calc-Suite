import jsPDF from 'jspdf';
import 'jspdf-autotable'; // This import extends jsPDF.prototype

interface KeyFact {
  label: string;
  value: string;
}

export const generateModuleSummaryPdf = (
  moduleTitle: string,
  keyFacts: KeyFact[],
  t: (key: string, options?: any) => string // Pass translation function
) => {
  try {
    const doc = new jsPDF();
    let yOffset = 20;

    doc.setFontSize(18);
    doc.text(moduleTitle, 14, yOffset);
    yOffset += 10;

    doc.setFontSize(14);
    doc.text(t('moduleSummaryExporter:keyData'), 14, yOffset);
    yOffset += 5;

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
        fillColor: [244, 248, 252],
        textColor: [7, 13, 89],
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

    doc.save(`${moduleTitle.replace(/\s/g, '-')}-summary.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Error in generateModuleSummaryPdf:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};