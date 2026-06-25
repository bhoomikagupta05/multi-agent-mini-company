import { PDFLayoutManager } from "./PDFLayoutManager";
import { PDFTheme } from "./PDFTheme";

/**
 * Table Component Renderer
 * 
 * Renders data grids with dynamic row heights, automatic column wrapping, zebra striping,
 * and smart pagination. If a row overflows the page boundary, a page break is automatically
 * triggered, table headers are repeated on the new page, and drawing resumes.
 */
export class PDFTableRenderer {
  public static render(
    doc: PDFKit.PDFDocument,
    layout: PDFLayoutManager,
    headers: string[],
    rows: string[][],
    colWidths: number[]
  ): void {
    const cellPadding = 6;
    const headerHeight = 20;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = PDFTheme.margins.left;

    // Helper function to draw table headers on the current page
    const drawHeader = (y: number): number => {
      doc.fillColor(PDFTheme.colors.primary);
      doc.rect(startX, y, tableWidth, headerHeight).fill();

      // Debug cells outline for header
      if (PDFTheme.isDebugMode()) {
        doc.save();
        doc.strokeColor("rgba(139, 92, 246, 0.6)") // Translucent Purple for cells
           .lineWidth(0.5)
           .rect(startX, y, tableWidth, headerHeight)
           .stroke();
        doc.restore();
      }

      doc.fillColor(PDFTheme.colors.white)
         .font(PDFTheme.fonts.bold)
         .fontSize(PDFTheme.fontSizes.body);

      let currentX = startX;
      for (let i = 0; i < headers.length; i++) {
        // Debug cell outline
        if (PDFTheme.isDebugMode()) {
          doc.save();
          doc.strokeColor("rgba(139, 92, 246, 0.5)")
             .rect(currentX, y, colWidths[i], headerHeight)
             .stroke();
          doc.restore();
        }

        doc.text(headers[i], currentX + cellPadding, y + 5, {
          width: colWidths[i] - cellPadding * 2,
          align: "left"
        });
        currentX += colWidths[i];
      }
      return y + headerHeight;
    };

    // Ensure there is enough space for the header plus at least one row (estimated at 25pt)
    layout.ensureSpace(headerHeight + 25);
    let currentY = layout.getCurrentY();

    // Draw the initial header
    currentY = drawHeader(currentY);

    // Draw row items sequentially
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];

      // Calculate row height based on text wrapping of cell values
      doc.font(PDFTheme.fonts.regular).fontSize(PDFTheme.fontSizes.body - 0.5); // 8pt for tables
      let maxCellHeight = 16;
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const text = row[colIndex] || "";
        const cellHeight = doc.heightOfString(text, { width: colWidths[colIndex] - cellPadding * 2 });
        if (cellHeight + cellPadding * 2 > maxCellHeight) {
          maxCellHeight = cellHeight + cellPadding * 2;
        }
      }

      // If the row exceeds the bottom page boundary, trigger page break and re-draw headers
      const bottomBound = PDFTheme.layout.contentEndY;
      if (currentY + maxCellHeight > bottomBound) {
        layout.addPageBreak();
        currentY = layout.getCurrentY();
        currentY = drawHeader(currentY);
      }

      // Zebra striping background
      if (rowIndex % 2 === 1) {
        doc.fillColor(PDFTheme.colors.bgLight);
        doc.rect(startX, currentY, tableWidth, maxCellHeight).fill();
      }

      // Render cells text
      let currentX = startX;
      doc.fillColor(PDFTheme.colors.textPrimary);
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const text = row[colIndex] || "";

        // Debug cell outline
        if (PDFTheme.isDebugMode()) {
          doc.save();
          doc.strokeColor("rgba(139, 92, 246, 0.4)") // Purple outline for cell bounds
             .lineWidth(0.5)
             .rect(currentX, currentY, colWidths[colIndex], maxCellHeight)
             .stroke();
          doc.restore();
        }

        doc.text(text, currentX + cellPadding, currentY + cellPadding, {
          width: colWidths[colIndex] - cellPadding * 2,
          align: "left"
        });
        currentX += colWidths[colIndex];
      }

      // Draw bottom horizontal border for the row
      doc.strokeColor(PDFTheme.colors.borderLight).lineWidth(0.5);
      doc.moveTo(startX, currentY + maxCellHeight).lineTo(startX + tableWidth, currentY + maxCellHeight).stroke();

      currentY += maxCellHeight;
    }

    // Update the layout manager's Y position
    layout.setCurrentY(currentY);
  }
}
