import { PDFTheme } from "./PDFTheme";

/**
 * Page Header Renderer
 * 
 * Draws running page headers featuring the company name, current active section,
 * and standard decorative horizontal rules.
 */
export class PDFHeaderRenderer {
  public static render(doc: PDFKit.PDFDocument, sectionName: string): void {
    const startX = PDFTheme.margins.left;
    const endX = PDFTheme.layout.pageWidth - PDFTheme.margins.right;
    
    // Top thin accent bar (Navy primary)
    doc.strokeColor(PDFTheme.colors.primary).lineWidth(1.5);
    doc.moveTo(startX, 40).lineTo(endX, 40).stroke();
    
    // Section name (Left-aligned)
    doc.fillColor(PDFTheme.colors.textSecondary)
       .font(PDFTheme.fonts.bold)
       .fontSize(PDFTheme.fontSizes.tiny + 0.5);
    doc.text(sectionName.toUpperCase(), startX, 28);
    
    // App Title (Right-aligned)
    doc.fillColor(PDFTheme.colors.textSecondary)
       .font(PDFTheme.fonts.regular)
       .fontSize(PDFTheme.fontSizes.tiny + 0.5);
    doc.text("MINI AI COMPANY • INCUBATOR INSIGHTS", startX, 28, {
      align: "right",
      width: PDFTheme.layout.contentWidth
    });
  }
}
