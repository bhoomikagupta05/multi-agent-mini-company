import { PDFTheme } from "./PDFTheme";

interface CardOptions {
  title: string;
  content: string | string[];
  width: number;
  isWarning?: boolean;
  color?: string;
}

/**
 * Card Component Renderer
 * 
 * Draws container boxes with dynamic heights, paddings, rounded corners,
 * and left color accents. Prevents text overflow by pre-calculating string sizes.
 */
export class PDFCardRenderer {
  /**
   * Pre-calculates the exact Y-space required by a card using heightOfString.
   */
  public static calculateHeight(doc: PDFKit.PDFDocument, options: CardOptions): number {
    let height = 8; // Top padding

    // Title height
    doc.font(PDFTheme.fonts.bold).fontSize(PDFTheme.fontSizes.subsectionTitle);
    height += doc.heightOfString(options.title, { width: options.width - 20 });
    height += 6; // Space between title and content

    // Content height
    doc.font(PDFTheme.fonts.regular).fontSize(PDFTheme.fontSizes.body);
    if (typeof options.content === "string") {
      height += doc.heightOfString(options.content, { width: options.width - 20, lineGap: 2 } as any);
    } else {
      for (const bullet of options.content) {
        height += doc.heightOfString(bullet, { width: options.width - 32, lineGap: 2 } as any) + 4;
      }
    }

    height += 8; // Bottom padding
    return height;
  }

  /**
   * Draws a card at coordinate (x, y) with dynamic height.
   * Returns the final height of the drawn card.
   */
  public static render(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    options: CardOptions
  ): number {
    const height = this.calculateHeight(doc, options);

    const isWarning = options.isWarning ?? false;
    const bgColor = isWarning ? PDFTheme.colors.bgWarningLight : PDFTheme.colors.bgLight;
    const borderColor = isWarning ? PDFTheme.colors.borderWarning : PDFTheme.colors.borderLight;
    const accentColor = options.color ?? (isWarning ? PDFTheme.colors.warning : PDFTheme.colors.primary);

    // 1. Draw card background
    doc.fillColor(bgColor);
    doc.roundedRect(x, y, options.width, height, 4).fill();

    // 2. Draw border
    doc.strokeColor(borderColor).lineWidth(1);
    doc.roundedRect(x, y, options.width, height, 4).stroke();

    // 3. Draw left border accent strip
    doc.strokeColor(accentColor).lineWidth(3);
    doc.moveTo(x, y + 4).lineTo(x, y + height - 4).stroke();

    // 4. Debug Bounding Box Overlay
    if (PDFTheme.isDebugMode()) {
      doc.save();
      doc.strokeColor("rgba(245, 158, 11, 0.7)") // Orange dash for card bounds
         .lineWidth(0.8)
         .dash(2, { space: 2 })
         .rect(x - 2, y - 2, options.width + 4, height + 4)
         .stroke();
      doc.restore();
    }

    let currentY = y + 8;

    // 5. Draw Title
    doc.fillColor(accentColor)
       .font(PDFTheme.fonts.bold)
       .fontSize(PDFTheme.fontSizes.subsectionTitle);
    doc.text(options.title, x + 10, currentY, { width: options.width - 20 });
    currentY += doc.heightOfString(options.title, { width: options.width - 20 }) + 6;

    // 6. Draw Content
    doc.fillColor(PDFTheme.colors.textPrimary)
       .font(PDFTheme.fonts.regular)
       .fontSize(PDFTheme.fontSizes.body);

    if (typeof options.content === "string") {
      doc.text(options.content, x + 10, currentY, { width: options.width - 20, lineGap: 2 });
    } else {
      for (const bullet of options.content) {
        doc.text("•", x + 10, currentY, { width: 10 });
        doc.text(bullet, x + 22, currentY, { width: options.width - 32, lineGap: 2 });
        currentY += doc.heightOfString(bullet, { width: options.width - 32, lineGap: 2 }) + 4;
      }
    }

    return height;
  }
}
