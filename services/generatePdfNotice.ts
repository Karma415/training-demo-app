import { jsPDF } from 'jspdf';

/**
 * Utility to generate a professional, printable PDF notice from AI-generated text.
 * 
 * @param letterText - The body content of the notice.
 * @param tenantName - The name of the tenant for the signature.
 * @param unitNumber - The unit number for the header/closing.
 * @param date - The date of the notice.
 */
export const generatePdfNotice = (
  letterText: string,
  tenantName: string,
  unitNumber: string,
  date: string
) => {
  const doc = new jsPDF();
  
  // Design configuration
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Set standard serif font for legal look
  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // 1. Header Information
  doc.text(`DATE: ${date}`, margin, cursorY);
  cursorY += 10;
  doc.text(`TENANT: ${tenantName}`, margin, cursorY);
  cursorY += 7;
  doc.text(`UNIT: ${unitNumber}`, margin, cursorY);
  cursorY += 15;

  // 2. Title (Centered)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const title = "NOTICE OF SUBSTANDARD CONDITION";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, cursorY);
  cursorY += 15;

  // 3. Body Content
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  
  // Wrap text to fit page width
  const lines = doc.splitTextToSize(letterText, maxLineWidth);
  
  // Handle multi-page documents if necessary
  lines.forEach((line: string) => {
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += 6; // Standard spacing
  });

  // 4. Closing
  cursorY += 10;
  if (cursorY > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    cursorY = margin;
  }
  doc.text("Sincerely,", margin, cursorY);
  cursorY += 10;
  doc.setFont('times', 'bold');
  doc.text(tenantName, margin, cursorY);

  // 5. Trigger Download
  const filename = `Notice_of_Substandard_Condition_${date.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
