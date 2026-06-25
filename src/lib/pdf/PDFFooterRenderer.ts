import { PDFTheme } from "./PDFTheme";

/**
 * Page Footer Renderer
 * 
 * Draws bottom footnotes containing confidentiality declarations, page numbering,
 * and report generation dates.
 */
export class PDFFooterRenderer {
  public static render(
    doc: PDFKit.PDFDocument,
    currentPage: number,
    totalPages: number,
    generatedAt: string
  ): void {
    const startX = PDFTheme.margins.left;
    const endX = PDFTheme.layout.pageWidth - PDFTheme.margins.right;
    
    // Bottom thin divider line
    doc.strokeColor(PDFTheme.colors.borderLight).lineWidth(0.5);
    doc.moveTo(startX, 750).lineTo(endX, 750).stroke();
    
    // Confidentiality marker (Left-aligned)
    doc.fillColor(PDFTheme.colors.textSecondary)
       .font(PDFTheme.fonts.regular)
       .fontSize(PDFTheme.fontSizes.tiny);
    doc.text("CONFIDENTIAL BUSINESS REPORT", startX, 758);
    
    // Timestamp (Center-aligned)
    const formattedDate = new Date(generatedAt).toLocaleDateString();
    doc.text(`Generated: ${formattedDate}`, startX, 758, {
      align: "center",
      width: PDFTheme.layout.contentWidth
    });
    
    // Page Numbering (Right-aligned)
    doc.text(`Page ${currentPage} of ${totalPages}`, startX, 758, {
      align: "right",
      width: PDFTheme.layout.contentWidth
    });
  }
}
