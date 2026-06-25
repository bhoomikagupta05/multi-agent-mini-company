import { PDFLayoutManager } from "./PDFLayoutManager";
import { PDFTheme } from "./PDFTheme";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * PDF Validation Utility
 * 
 * Inspects layout manager metadata and generated pages to verify page counts,
 * coordinate boundaries, and page reference mappings.
 * 
 * Requirement 2: Add a PDFValidation utility.
 */
export class PDFValidation {
  /**
   * Validates document metrics.
   * 
   * Checks:
   * - Content never exceeds page height (Y coordinate bounds).
   * - No negative coordinates.
   * - No invalid page references.
   * 
   * @param layout The layout manager instance containing page coordinates state
   * @param totalPages The total number of pages in the generated document
   */
  public static validate(layout: PDFLayoutManager, totalPages: number): ValidationResult {
    const errors: string[] = [];
    const finalYMap = layout.getPageFinalYMap();
    const sectionMap = layout.getPageToSectionMap();

    // 1. Verify page count is positive
    if (totalPages <= 0) {
      errors.push("Validation Error: Document contains no pages.");
    }

    // 2. Verify coordinate boundaries for each page
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const finalY = finalYMap[pageIndex];

      if (finalY !== undefined) {
        // Coordinate bounds verification (Must be positive)
        if (finalY < 0) {
          errors.push(`Validation Error: Page ${pageIndex + 1} has a negative final Y coordinate (${finalY.toFixed(1)}pt).`);
        }

        // Check if Y coordinate exceeds page height
        if (finalY > PDFTheme.layout.pageHeight) {
          errors.push(`Validation Error: Page ${pageIndex + 1} exceeds page height (height: ${finalY.toFixed(1)}pt, limit: ${PDFTheme.layout.pageHeight}pt).`);
        }
      }
    }

    // 3. Verify section map references valid page indexes
    for (const key in sectionMap) {
      const pageIdx = parseInt(key, 10);
      if (isNaN(pageIdx)) {
        errors.push(`Validation Error: Non-numeric page index key '${key}' in section map.`);
        continue;
      }

      if (pageIdx < 0 || pageIdx >= totalPages) {
        errors.push(`Validation Error: Section map references page index ${pageIdx} (total pages: ${totalPages}).`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
