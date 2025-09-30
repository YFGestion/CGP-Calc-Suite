export const exportCsv = (filename: string, rows: string[][]): void => {
  const csvContent = rows.map(e => e.join(';')).join('\n');
  const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for UTF-8
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};