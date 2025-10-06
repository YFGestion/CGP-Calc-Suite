import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Import html2canvas

export const generateModuleSummaryPdf = async (
  moduleTitle: string,
  htmlElement: HTMLElement, // Now accepts an HTMLElement
  t: (key: string, options?: any) => string // Pass translation function
) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
    const margin = 10; // mm
    let yOffset = margin;

    doc.setFontSize(18);
    doc.text(moduleTitle, margin, yOffset);
    yOffset += 10;

    // Use html2canvas to render the HTML element to a canvas
    const canvas = await html2canvas(htmlElement, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // Important for images loaded from external sources
      windowWidth: htmlElement.scrollWidth, // Capture full width
      windowHeight: htmlElement.scrollHeight, // Capture full height
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190; // A4 width - 2*margin (210 - 2*10)
    const pageHeight = 295; // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;

    doc.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
    heightLeft -= pageHeight - yOffset;

    while (heightLeft >= 0) {
      doc.addPage();
      yOffset = margin;
      doc.addImage(imgData, 'PNG', margin, yOffset - heightLeft, imgWidth, imgHeight);
      heightLeft -= pageHeight - yOffset;
    }

    doc.save(`${moduleTitle.replace(/\s/g, '-')}-summary.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Error in generateModuleSummaryPdf:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};