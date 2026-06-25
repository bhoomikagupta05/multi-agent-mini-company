import { PDFTheme } from "./PDFTheme";

/**
 * Layout Manager for PDF Drawing
 * 
 * Tracks current Y positions, calculates remaining page space, enforces page breaks,
 * and maintains page-to-section mappings to support running headers/footers in a second pass.
 * Draws layout boundaries when DEBUG_PDF_MODE is enabled.
 */
export class PDFLayoutManager {
  private doc: PDFKit.PDFDocument;
  private currentY: number;
  private currentSectionName: string = "";
  
  // Maps page index -> section title active on that page
  private pageToSectionMap: Record<number, string> = {};
  
  // Maps page index -> final Y coordinate reached on that page (for debugging)
  private pageFinalYMap: Record<number, number> = {};

  private contentStartY = PDFTheme.layout.contentStartY;
  private contentEndY = PDFTheme.layout.contentEndY;

  constructor(doc: PDFKit.PDFDocument) {
    this.doc = doc;
    this.currentY = this.contentStartY;
  }

  public getCurrentY(): number {
    return this.currentY;
  }

  public setCurrentY(y: number): void {
    this.currentY = y;
  }

  /**
   * Enforces that the current page has at least requiredHeight points left.
   * If not, automatically appends a page break.
   */
  // public ensureSpace(requiredHeight: number): void {
  //   if (this.currentY + requiredHeight > this.contentEndY) {
  //     this.addPageBreak();
  //   }
  // }


public ensureSpace(requiredHeight: number): void {
  const availableSpace =
    this.contentEndY - this.currentY;

  if (requiredHeight > availableSpace) {
    this.addPageBreak();
  }
}


  /**
   * Starts a new major section. Under Phase 9.1 rules, every major section
   * starts on a new page.
   */

// yhn maine change kiya hai pdf k liye 
public addSection(title: string): void {
  this.currentSectionName = title;

  const pageIndex = this.doc.bufferedPageRange().count - 1;

  this.pageToSectionMap[pageIndex] = title;
}

  // public addSection(title: string): void {
  //   this.currentSectionName = title;
  //   const pageIndex = this.doc.bufferedPageRange().count - 1;

  //   // Record the final Y for the current page before moving to a new section/page
  //   this.pageFinalYMap[pageIndex] = this.currentY;

  //   if (pageIndex === 0) {
  //     // Transition from Cover Page to first content page
  //     this.addPageBreak();
  //   } else if (this.currentY > this.contentStartY) {
  //     // Force page break if the page is not fresh
  //     this.addPageBreak();
  //   } else {
  //     // Top of a fresh page, associate section name
  //     this.pageToSectionMap[pageIndex] = title;
  //   }
  // }

  /**
   * Generates a new PDF page, resets currentY to top margins, and inherits the active section name.
   */
  public addPageBreak(): void {
    const prevPageIndex = this.doc.bufferedPageRange().count - 1;
    this.pageFinalYMap[prevPageIndex] = this.currentY;

    this.doc.addPage();
    this.currentY = this.contentStartY;

    const pageIndex = this.doc.bufferedPageRange().count - 1;
    if (pageIndex > 0) {
      this.pageToSectionMap[pageIndex] = this.currentSectionName;
    }
  }

  /**
   * Records final Y coordinate for the last page of the document
   */
  public finalizeLastPage(): void {
    const pageIndex = this.doc.bufferedPageRange().count - 1;
    this.pageFinalYMap[pageIndex] = this.currentY;
  }

  public getPageToSectionMap(): Record<number, string> {
    return this.pageToSectionMap;
  }

  public getPageFinalYMap(): Record<number, number> {
    return this.pageFinalYMap;
  }

  /**
   * Draws page/content boundaries and final Y positions for visual layout diagnostics.
   * Triggered in the second pass if DEBUG_PDF_MODE is active.
   */
  public drawDebugOverlay(pageIndex: number): void {
    if (!PDFTheme.isDebugMode()) return;

    this.doc.save();

    // 1. Draw Page Boundary (Blue box around page)
    this.doc.strokeColor("rgba(59, 130, 246, 0.4)") // Translucent Blue
             .lineWidth(2)
             .rect(5, 5, PDFTheme.layout.pageWidth - 10, PDFTheme.layout.pageHeight - 10)
             .stroke();

    // 2. Draw Content Boundary (Red box outlining margins)
    const contentH = this.contentEndY - this.contentStartY;
    this.doc.strokeColor("rgba(239, 68, 68, 0.3)") // Translucent Red
             .lineWidth(1)
             .dash(4, { space: 4 })
             .rect(
               PDFTheme.margins.left, 
               this.contentStartY, 
               PDFTheme.layout.contentWidth, 
               contentH
             )
             .stroke();

    // 3. Draw final Y coordinate marker reached on this page
    const finalY = this.pageFinalYMap[pageIndex];
    if (finalY !== undefined && finalY > this.contentStartY) {
      this.doc.strokeColor("rgba(16, 185, 129, 0.6)") // Translucent Green
               .lineWidth(1)
               .undash()
               .moveTo(PDFTheme.margins.left - 20, finalY)
               .lineTo(PDFTheme.layout.pageWidth - PDFTheme.margins.right + 20, finalY)
               .stroke();

      this.doc.fillColor("#10B981")
               .font("Helvetica-Bold")
               .fontSize(6)
               .text(`PAGE END Y: ${finalY.toFixed(1)}pt`, PDFTheme.margins.left, finalY - 8);
    }

    this.doc.restore();
  }
}
