/**
 * PDF Style Theme Constants
 * 
 * Defines standard style guidelines for report rendering, including color palettes,
 * typography (Helvetica), page margins, layout sizing, and debug configurations.
 */
export const PDFTheme = {
  colors: {
    primary: "#1E3A8A",       // Navy Blue
    secondary: "#3B82F6",     // Royal Blue
    success: "#10B981",       // Emerald Green
    warning: "#EF4444",       // Coral Red
    textPrimary: "#1F2937",   // Charcoal
    textSecondary: "#4B5563", // Slate Gray
    bgLight: "#F9FAFB",       // Background Light Gray
    bgWarningLight: "#FEF2F2", // Background Light Red for warnings
    borderLight: "#E5E7EB",   // Border Gray
    borderWarning: "#FCA5A5", // Border Light Red
    white: "#FFFFFF"
  },
  fonts: {
    regular: "Helvetica",
    bold: "Helvetica-Bold",
    italic: "Helvetica-Oblique",
    boldItalic: "Helvetica-BoldOblique"
  },
  fontSizes: {
    coverTitle: 28,
    coverSubtitle: 12,
    sectionTitle: 12,
    subsectionTitle: 9.5,
    body: 8.5,
    small: 7.5,
    tiny: 6.5
  },
  margins: {
    top: 55,
    bottom: 55,
    left: 50,
    right: 50
  },
  layout: {
    pageWidth: 612,       // US Letter Width in points
    pageHeight: 792,      // US Letter Height in points
    contentWidth: 512,    // 612 - 50 - 50
    contentStartY: 70,    // Top Y for section content (below running header)
    contentEndY: 737      // Bottom boundary for content (792 - 55)
  },
  // Toggle boundary and position marker drawing for layout diagnostics
  isDebugMode(): boolean {
    return process.env.DEBUG_PDF_MODE === "true" || (global as any).DEBUG_PDF_MODE === true;
  }
};
export type PDFThemeType = typeof PDFTheme;
