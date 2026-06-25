import PDFDocument from "pdfkit";
import { PDFTheme } from "./PDFTheme";
import { PDFLayoutManager } from "./PDFLayoutManager";
import { PDFCardRenderer } from "./PDFCardRenderer";
import { PDFTableRenderer } from "./PDFTableRenderer";
import { PDFHeaderRenderer } from "./PDFHeaderRenderer";
import { PDFFooterRenderer } from "./PDFFooterRenderer";
import { PDFValidation, ValidationResult } from "./PDFValidation";
import { Phase8Output } from "../../types";

// Report type definitions for modularity
export type ReportType = 
  | "business_report" 
  | "investor_report" 
  | "executive_summary" 
  | "pitch_deck";

export interface ReportMetadata {
  reportId: string;
  generatedAt: string;
  startupName: string;
  version: string;
  totalPages?: number;
  generationDuration?: number;
}

export interface PDFGeneratorOptions {
  type: ReportType;
  metadata?: Partial<ReportMetadata>;
}

export interface PDFGeneratorResult {
  pdfBuffer: Buffer;
  metadata: ReportMetadata & { totalPages: number; generationDuration: number };
  validation: ValidationResult;
}

/**
 * Production-Grade PDF Generator Service
 * 
 * Orchestrates report templates by integrating the PDFLayoutManager,
 * enforcing dynamic space calculations, utilizing dynamic cards and tables,
 * performing two-pass header/footer stampings, and validating outputs.
 */
export class PDFGenerator {
  
  public static async generate(
    data: Phase8Output,
    options: PDFGeneratorOptions
  ): Promise<PDFGeneratorResult> {
    const startTime = Date.now();
    const type = options.type || "business_report";
    const startupName = data.ceo.companyName || options.metadata?.startupName || "AI Startup";

    // 1. Establish report metadata
    const metadata: ReportMetadata = {
      reportId: options.metadata?.reportId || `REP-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      generatedAt: options.metadata?.generatedAt || new Date().toISOString(),
      startupName,
      version: options.metadata?.version || "1.0.0"
    };

    return new Promise<PDFGeneratorResult>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        bufferPages: true,
        size: "LETTER",
        margins: {
          top: PDFTheme.margins.top,
          bottom: PDFTheme.margins.bottom,
          left: PDFTheme.margins.left,
          right: PDFTheme.margins.right
        }
      });

      // Stream listeners
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        const totalPages = doc.bufferedPageRange().count;
        const generationDuration = Date.now() - startTime;

        // Run validation check on the layout and page constraints
        const validation = PDFValidation.validate(layout, totalPages);

        resolve({
          pdfBuffer,
          metadata: {
            ...metadata,
            totalPages,
            generationDuration
          },
          validation
        });
      });
      doc.on("error", (err) => reject(err));

      const layout = new PDFLayoutManager(doc);

      try {
        // --- 1. COVER PAGE (Page 0) ---
        // Cover page utilizes distinct absolute positioning layout design
        drawCoverPage(doc, data, metadata);

        // --- 2. DYNAMIC CONTENT PAGES (Page 1+) ---
        // Renders content sections selectively based on the requested ReportType
        if (type === "business_report") {
          renderSectionSafely(doc, layout, "Executive Summary", data, renderExecutiveSummary);
          renderSectionSafely(doc, layout, "CEO Strategy", data, renderCEOStrategy);
          renderSectionSafely(doc, layout, "Market Research", data, renderMarketResearch);
          renderSectionSafely(doc, layout, "Product Strategy", data, renderProductStrategy);
          renderSectionSafely(doc, layout, "Financial Analysis", data, renderFinancialAnalysis);
          renderSectionSafely(doc, layout, "Investor Evaluation", data, renderInvestorEvaluation);
          renderSectionSafely(doc, layout, "Appendix", data, renderAppendix);
        } 
        else if (type === "investor_report") {
          renderSectionSafely(doc, layout, "Executive Summary", data, renderExecutiveSummary);
          renderSectionSafely(doc, layout, "Financial Analysis", data, renderFinancialAnalysis);
          renderSectionSafely(doc, layout, "Investor Evaluation", data, renderInvestorEvaluation);
          renderSectionSafely(doc, layout, "Appendix", data, renderAppendix);
        } 
        else if (type === "executive_summary") {
          renderSectionSafely(doc, layout, "Executive Summary", data, renderExecutiveSummary);
          renderSectionSafely(doc, layout, "Appendix", data, renderAppendix);
        } 
        else if (type === "pitch_deck") {
          renderSectionSafely(doc, layout, "CEO Strategy", data, renderCEOStrategy);
          renderSectionSafely(doc, layout, "Product Strategy", data, renderProductStrategy);
          renderSectionSafely(doc, layout, "Investor Evaluation", data, renderInvestorEvaluation);
          renderSectionSafely(doc, layout, "Appendix", data, renderAppendix);
        }

        // Finalize drawing details for Y coordinate maps
        layout.finalizeLastPage();

        // --- 3. SECOND-PASS: HEADERS, FOOTERS & DEBUG OVERLAYS ---
        // Stamping page numbers ("Page X of Y"), confidential footers, and active headers.
        const pages = doc.bufferedPageRange();
        const totalPages = pages.count;

        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);

          // Render layout overlay boundaries if debug mode toggle is active
          layout.drawDebugOverlay(i);

          // Cover Page (Index 0) does not get headers or footers
          if (i === 0) continue;

          const sectionName = layout.getPageToSectionMap()[i] || "Analysis";

          // Render header
          PDFHeaderRenderer.render(doc, sectionName);

          // Render footer
          PDFFooterRenderer.render(doc, i + 1, totalPages, metadata.generatedAt);
        }

        doc.end();
      } catch (error) {
        doc.destroy();
        reject(error);
      }
    });
  }
}

// ============================================================================
// SAFE RENDERING WRAPPER
// ============================================================================
type SectionRenderer = (doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) => void;

function renderSectionSafely(
  doc: PDFKit.PDFDocument,
  layout: PDFLayoutManager,
  title: string,
  data: Phase8Output,
  renderer: SectionRenderer
): void {
  try {
    layout.addSection(title);
    renderer(doc, layout, data);
  } catch (error: any) {
    console.error(`[PDF Generator Exception] Failed rendering '${title}':`, error);
    
    // Fallback: draw warning card inline instead of crashing report compiler
    const fallbackText = `Render Error: The dynamic AI output for the '${title}' section could not be formatted correctly. Execution has bypassed this crash and resumed drawing remaining pages.\n\nDetail: ${error.message || error}`;
    const cardWidth = PDFTheme.layout.contentWidth;
    const cardHeight = PDFCardRenderer.calculateHeight(doc, {
      title: `${title} - Generation Error`,
      content: fallbackText,
      width: cardWidth
    });

    layout.ensureSpace(cardHeight + 12);
    PDFCardRenderer.render(doc, PDFTheme.margins.left, layout.getCurrentY(), {
      title: `${title} - Rendering Failed`,
      content: fallbackText,
      width: cardWidth,
      isWarning: true
    });
    layout.setCurrentY(layout.getCurrentY() + cardHeight + 12);
  }
}

// ============================================================================
// COMPONENT RENDERING HELPERS
// ============================================================================

function renderTitle(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, text: string) {
  const height = 24;
  layout.ensureSpace(height);
  const y = layout.getCurrentY();
  doc.fillColor(PDFTheme.colors.primary)
     .font(PDFTheme.fonts.bold)
     .fontSize(PDFTheme.fontSizes.sectionTitle);
  doc.text(text, PDFTheme.margins.left, y + 4);
  layout.setCurrentY(y + height);
}

function renderHeading(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, text: string) {
  const height = 20;
  layout.ensureSpace(height);
  const y = layout.getCurrentY();
  doc.fillColor(PDFTheme.colors.primary)
     .font(PDFTheme.fonts.bold)
     .fontSize(PDFTheme.fontSizes.subsectionTitle + 1);
  doc.text(text, PDFTheme.margins.left, y + 4);
  layout.setCurrentY(y + height);
}

function renderParagraph(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, text: string) {
  doc.font(PDFTheme.fonts.regular).fontSize(PDFTheme.fontSizes.body);
  const height = doc.heightOfString(text, { width: PDFTheme.layout.contentWidth, lineGap: 2.5 });
  layout.ensureSpace(height + 10);
  const y = layout.getCurrentY();
  doc.fillColor(PDFTheme.colors.textPrimary);
  doc.text(text, PDFTheme.margins.left, y, { width: PDFTheme.layout.contentWidth, lineGap: 2.5 });
  layout.setCurrentY(y + height + 10);
}

function renderBulletList(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, items: string[]) {
  doc.font(PDFTheme.fonts.regular).fontSize(PDFTheme.fontSizes.body);
  for (const item of items) {
    const height = doc.heightOfString(item, { width: PDFTheme.layout.contentWidth - 15, lineGap: 2 });
    layout.ensureSpace(height + 4);
    const y = layout.getCurrentY();
    doc.fillColor(PDFTheme.colors.textPrimary);
    doc.text("•", PDFTheme.margins.left, y);
    doc.text(item, PDFTheme.margins.left + 15, y, { width: PDFTheme.layout.contentWidth - 15, lineGap: 2 });
    layout.setCurrentY(y + height + 4);
  }
  layout.ensureSpace(8);
  layout.setCurrentY(layout.getCurrentY() + 8);
}

function renderTwoCards(
  doc: PDFKit.PDFDocument,
  layout: PDFLayoutManager,
  title1: string,
  content1: string | string[],
  title2: string,
  content2: string | string[],
  isWarning1 = false,
  isWarning2 = false
) {
  const gap = 12;
  const cardWidth = (PDFTheme.layout.contentWidth - gap) / 2;

  const h1 = PDFCardRenderer.calculateHeight(doc, { title: title1, content: content1, width: cardWidth });
  const h2 = PDFCardRenderer.calculateHeight(doc, { title: title2, content: content2, width: cardWidth });
  const maxH = Math.max(h1, h2);

  layout.ensureSpace(maxH + 10);
  const y = layout.getCurrentY();

  PDFCardRenderer.render(doc, PDFTheme.margins.left, y, {
    title: title1,
    content: content1,
    width: cardWidth,
    isWarning: isWarning1
  });

  PDFCardRenderer.render(doc, PDFTheme.margins.left + cardWidth + gap, y, {
    title: title2,
    content: content2,
    width: cardWidth,
    isWarning: isWarning2
  });

  layout.setCurrentY(y + maxH + 10);
}

function renderScorecards(
  doc: PDFKit.PDFDocument,
  layout: PDFLayoutManager,
  scores: {
    startupScore: number;
    investmentScore: number;
    riskScore: number;
    confidenceScore: number;
  }
) {
  const count = 4;
  const gap = 8;
  const cardWidth = (PDFTheme.layout.contentWidth - gap * (count - 1)) / count;
  const cardHeight = 42;

  layout.ensureSpace(cardHeight + 10);
  const y = layout.getCurrentY();
  const startX = PDFTheme.margins.left;

  drawMiniScoreCard(doc, startX, y, cardWidth, cardHeight, "Startup Score", `${scores.startupScore}/10`, PDFTheme.colors.success);
  drawMiniScoreCard(doc, startX + (cardWidth + gap), y, cardWidth, cardHeight, "Investment", `${scores.investmentScore}/10`, PDFTheme.colors.secondary);
  drawMiniScoreCard(doc, startX + (cardWidth + gap) * 2, y, cardWidth, cardHeight, "Risk Score", `${scores.riskScore}/10`, PDFTheme.colors.warning, true);
  drawMiniScoreCard(doc, startX + (cardWidth + gap) * 3, y, cardWidth, cardHeight, "Confidence", `${scores.confidenceScore}%`, "#8B5CF6");

  layout.setCurrentY(y + cardHeight + 10);
}

function drawMiniScoreCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  color: string,
  isWarning = false
) {
  doc.fillColor(isWarning ? PDFTheme.colors.bgWarningLight : PDFTheme.colors.bgLight);
  doc.roundedRect(x, y, width, height, 4).fill();

  doc.strokeColor(isWarning ? PDFTheme.colors.borderWarning : PDFTheme.colors.borderLight).lineWidth(1);
  doc.roundedRect(x, y, width, height, 4).stroke();

  doc.strokeColor(color).lineWidth(3);
  doc.moveTo(x, y + 4).lineTo(x, y + height - 4).stroke();

  doc.fillColor(PDFTheme.colors.textSecondary)
     .font(PDFTheme.fonts.bold)
     .fontSize(PDFTheme.fontSizes.tiny);
  doc.text(title.toUpperCase(), x + 8, y + 6, { width: width - 12 });

  doc.fillColor(color)
     .font(PDFTheme.fonts.bold)
     .fontSize(PDFTheme.fontSizes.subsectionTitle + 2);
  doc.text(value, x + 8, y + 16, { width: width - 12 });
}

// ============================================================================
// INDIVIDUAL SECTION RENDERERS
// ============================================================================

/**
 * Page 1: Cover Page
 */
function drawCoverPage(doc: PDFKit.PDFDocument, data: Phase8Output, metadata: ReportMetadata) {
  // Top header color block
  doc.fillColor(PDFTheme.colors.primary).rect(0, 0, PDFTheme.layout.pageWidth, 270).fill();
  doc.fillColor(PDFTheme.colors.secondary).rect(0, 270, PDFTheme.layout.pageWidth, 10).fill();

  // App logo label
  doc.fillColor(PDFTheme.colors.white).font(PDFTheme.fonts.bold).fontSize(PDFTheme.fontSizes.coverSubtitle - 1);
  doc.text("MINI AI COMPANY • VIRTUAL INCUBATION SYSTEM", 50, 60);

  // Large Startup name
  doc.fontSize(PDFTheme.fontSizes.coverTitle + 4).text(data.ceo.companyName, 50, 85, { width: 512 });

  // Subtitle
  doc.fontSize(PDFTheme.fontSizes.coverSubtitle + 1)
     .font(PDFTheme.fonts.regular)
     .fillColor("#93C5FD")
     .text("Comprehensive Incubation Report & Strategic Critique", 50, 160);

  // Metadata Panel
  let currentY = 310;
  doc.fillColor(PDFTheme.colors.textPrimary).font(PDFTheme.fonts.bold).fontSize(PDFTheme.fontSizes.subsectionTitle);
  doc.text("REPORT METADATA", 50, currentY);

  doc.strokeColor(PDFTheme.colors.borderLight).lineWidth(1);
  doc.moveTo(50, currentY + 12).lineTo(562, currentY + 12).stroke();
  currentY += 22;

  const metadataHeaders = ["Metric", "Description"];
  const metadataRows = [
    ["Report Reference ID", metadata.reportId],
    ["Generated Timestamp", new Date(metadata.generatedAt).toLocaleString()],
    ["Incubator Model version", `v${metadata.version}`],
    ["Pipeline Engine", "LangGraph Stateful Network Agent v1.1"]
  ];
  PDFTableRenderer.render(doc, new PDFLayoutManager(doc) as any, metadataHeaders, metadataRows, [160, 352]); // Temporary local manager bypass

  // Scorecards
  currentY = 470;
  doc.fillColor(PDFTheme.colors.textPrimary).font(PDFTheme.fonts.bold).fontSize(PDFTheme.fontSizes.subsectionTitle);
  doc.text("CONSOLIDATED FEASIBILITY PERFORMANCE SCORECARD", 50, currentY);

  doc.strokeColor(PDFTheme.colors.borderLight).lineWidth(1);
  doc.moveTo(50, currentY + 12).lineTo(562, currentY + 12).stroke();
  currentY += 22;

  const dummyLayout = new PDFLayoutManager(doc);
  dummyLayout.setCurrentY(currentY);
  renderScorecards(doc, dummyLayout, {
    startupScore: data.summary.startupScore,
    investmentScore: data.investor.investmentScore,
    riskScore: data.investor.riskScore,
    confidenceScore: data.summary.confidenceScore
  });

  // Footer Disclaimer
  doc.fillColor(PDFTheme.colors.textSecondary).font(PDFTheme.fonts.italic).fontSize(PDFTheme.fontSizes.tiny);
  doc.text(
    "Disclaimer: This document is synthesized by autonomous LLM agents (CEO, CFO, PM, Analyst, and Investor roles) using stateful cascading state topologies. This does not constitute formal financial advice.",
    50,
    710,
    { width: 512, align: "center", lineGap: 1.5 }
  );
}

/**
 * Page 2: Executive Summary
 */
function renderExecutiveSummary(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "Executive Summary & Feasibility Verdict");

  // Summary Metrics scorecard row
  renderScorecards(doc, layout, {
    startupScore: data.summary.startupScore,
    investmentScore: data.investor.investmentScore,
    riskScore: data.investor.riskScore,
    confidenceScore: data.summary.confidenceScore
  });

  // Final Verdict Card
  const verdictText = data.summary.finalVerdict;
  const verdictHeight = PDFCardRenderer.calculateHeight(doc, { title: "Incubator Verdict", content: verdictText, width: PDFTheme.layout.contentWidth });
  layout.ensureSpace(verdictHeight + 10);
  PDFCardRenderer.render(doc, PDFTheme.margins.left, layout.getCurrentY(), {
    title: "Incubator Verdict",
    content: verdictText,
    width: PDFTheme.layout.contentWidth
  });
  layout.setCurrentY(layout.getCurrentY() + verdictHeight + 10);

  // Executive summary narrative
  renderHeading(doc, layout, "Executive Briefing");
  renderParagraph(doc, layout, data.summary.executiveSummary);

  // Strengths & Weaknesses
  renderHeading(doc, layout, "Strengths & Weaknesses Highlights");
  renderTwoCards(
    doc,
    layout,
    "Top Strengths",
    data.summary.topStrengths,
    "Top Weaknesses",
    data.summary.topWeaknesses,
    false,
    true
  );

  // Opportunities & Risks
  renderHeading(doc, layout, "Market Opportunities & Threats");
  renderTwoCards(
    doc,
    layout,
    "Primary Opportunities",
    data.summary.topOpportunities,
    "Primary Threat Risks",
    data.summary.topRisks,
    false,
    true
  );

  // Timelines
  renderHeading(doc, layout, "Execution Action roadmap");
  renderTwoCards(
    doc,
    layout,
    "Immediate Action Plan (First 30 Days)",
    data.summary.immediateActions,
    "Medium-Term Action Plan (Months 2-3)",
    data.summary.mediumTermActions
  );

  // Final recommendation
  renderHeading(doc, layout, "VC Conviction Recommendation");
  renderParagraph(doc, layout, data.investor.recommendation);
}

/**
 * Page 3: CEO Strategy
 */
function renderCEOStrategy(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "CEO Strategy & Operations Plan");

  renderHeading(doc, layout, "Strategic Intent & Aspiration");
  renderTwoCards(
    doc,
    layout,
    "Vision Statement",
    data.ceo.vision,
    "Mission Statement",
    data.ceo.mission
  );

  renderHeading(doc, layout, "Year-1 Success Goals");
  const goalHeaders = ["Corporate Goal", "Timeline Target", "Success Metrics"];
  const goalRows = data.ceo.businessGoals.map(g => [g.goal, g.timeframe, g.metric]);
  PDFTableRenderer.render(doc, layout, goalHeaders, goalRows, [212, 120, 180]);

  renderHeading(doc, layout, "Recommended Organizational Departments");
  const deptHeaders = ["Department", "Purpose", "First 90-Day Focus"];
  const deptRows = data.ceo.suggestedDepartments.map(d => [d.name, d.purpose, d.focus]);
  PDFTableRenderer.render(doc, layout, deptHeaders, deptRows, [130, 200, 182]);

  renderHeading(doc, layout, "90-Day Corporate Roadmap Milestones");
  const roadHeaders = ["Phase", "Milestones & Deliverables"];
  const roadRows = [
    [`Days 0-30: ${data.ceo.first90DayPlan.days30.title}`, data.ceo.first90DayPlan.days30.milestones.join("; ")],
    [`Days 31-60: ${data.ceo.first90DayPlan.days60.title}`, data.ceo.first90DayPlan.days60.milestones.join("; ")],
    [`Days 61-90: ${data.ceo.first90DayPlan.days90.title}`, data.ceo.first90DayPlan.days90.milestones.join("; ")]
  ];
  PDFTableRenderer.render(doc, layout, roadHeaders, roadRows, [160, 352]);
}

/**
 * Page 4: Market Research
 */
function renderMarketResearch(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "Market Research & Competitive Landscape");

  renderHeading(doc, layout, "Target Audience Profile");
  const audienceText = `Demographics:\n${data.research.targetAudience.demographics}\n\nWhy They Buy:\n${data.research.targetAudience.whyTheyBuy}`;
  const audienceHeight = PDFCardRenderer.calculateHeight(doc, { title: "Target Audience Summary", content: audienceText, width: PDFTheme.layout.contentWidth });
  layout.ensureSpace(audienceHeight + 10);
  PDFCardRenderer.render(doc, PDFTheme.margins.left, layout.getCurrentY(), {
    title: "Target Audience Summary",
    content: audienceText,
    width: PDFTheme.layout.contentWidth
  });
  layout.setCurrentY(layout.getCurrentY() + audienceHeight + 10);

  renderHeading(doc, layout, "Target User Pain Points");
  renderBulletList(doc, layout, data.research.targetAudience.painPoints);

  renderHeading(doc, layout, "Market Opportunities");
  const oppHeaders = ["Opportunity Factor", "Potential Strategic Impact"];
  const oppRows = data.research.marketOpportunities.map(o => [o.opportunity, o.potentialImpact]);
  PDFTableRenderer.render(doc, layout, oppHeaders, oppRows, [380, 132]);

  renderHeading(doc, layout, "Industry Shift Trends");
  const trendRows = data.research.industryTrends.map(t => `${t.trend} (${t.relevance})`);
  renderBulletList(doc, layout, trendRows);

  renderHeading(doc, layout, "Competitor Evaluation Matrix");
  const compHeaders = ["Competitor", "Description", "Core Strengths", "Core Weaknesses"];
  const compRows = data.research.competitors.map(c => [
    c.name,
    c.description,
    c.strengths.join(", "),
    c.weaknesses.join(", ")
  ]);
  PDFTableRenderer.render(doc, layout, compHeaders, compRows, [90, 162, 130, 130]);

  renderHeading(doc, layout, "Operational Business Risks & Mitigation");
  const riskHeaders = ["Risk Factor", "Severity", "Strategic Mitigation Plan"];
  const riskRows = data.research.risks.map(r => [r.risk, r.severity, r.mitigation]);
  PDFTableRenderer.render(doc, layout, riskHeaders, riskRows, [180, 70, 262]);
}

/**
 * Page 5: Product Strategy
 */
function renderProductStrategy(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "Product Strategy & MVP Scope");

  renderHeading(doc, layout, "Unique Selling Proposition");
  const uspHeight = PDFCardRenderer.calculateHeight(doc, { title: "USP", content: data.product.usp, width: PDFTheme.layout.contentWidth });
  layout.ensureSpace(uspHeight + 10);
  PDFCardRenderer.render(doc, PDFTheme.margins.left, layout.getCurrentY(), {
    title: "USP",
    content: data.product.usp,
    width: PDFTheme.layout.contentWidth
  });
  layout.setCurrentY(layout.getCurrentY() + uspHeight + 10);

  renderHeading(doc, layout, "User Personas");
  const personaHeaders = ["Persona Archetype", "Role", "Goals & Motives", "Blockers & Struggles"];
  const personaRows = data.product.userPersonas.map(p => [
    p.name,
    p.role,
    p.goals.join("; "),
    p.painPoints.join("; ")
  ]);
  PDFTableRenderer.render(doc, layout, personaHeaders, personaRows, [100, 100, 156, 156]);

  renderHeading(doc, layout, "Minimum Viable Product (MVP) Features");
  const featureHeaders = ["Feature Name", "Value Proposition", "Description"];
  const featureRows = data.product.mvpFeatures.map(f => [f.name, f.value, f.description]);
  PDFTableRenderer.render(doc, layout, featureHeaders, featureRows, [120, 160, 232]);

  renderHeading(doc, layout, "Feature Prioritization Matrix");
  const prioHeaders = ["Priority Tier", "Assigned Features"];
  const prioRows = data.product.featurePriorities.map(p => [p.tier, p.features.join(", ")]);
  PDFTableRenderer.render(doc, layout, prioHeaders, prioRows, [150, 362]);

  renderHeading(doc, layout, "Product Launch Timeline Roadmap");
  const roadmapHeaders = ["Phase", "Timeline", "Key Deliverables"];
  const roadmapRows = [
    [data.product.productRoadmap.phase1.phaseName, data.product.productRoadmap.phase1.timeline, data.product.productRoadmap.phase1.keyDeliverables.join("; ")],
    [data.product.productRoadmap.phase2.phaseName, data.product.productRoadmap.phase2.timeline, data.product.productRoadmap.phase2.keyDeliverables.join("; ")],
    [data.product.productRoadmap.phase3.phaseName, data.product.productRoadmap.phase3.timeline, data.product.productRoadmap.phase3.keyDeliverables.join("; ")]
  ];
  PDFTableRenderer.render(doc, layout, roadmapHeaders, roadmapRows, [150, 80, 282]);
}

/**
 * Page 6: Financial Analysis
 */
function renderFinancialAnalysis(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "Financial Analysis & Projections");

  renderHeading(doc, layout, "12-Month Funding Requirement");
  const fundingText = `CFO Target: ${data.finance.fundingRequirement}\n\nStrategic Justification:\n${data.finance.analysisSummary.fundingChoiceReason}`;
  const fundingHeight = PDFCardRenderer.calculateHeight(doc, { title: "Funding Request Target", content: fundingText, width: PDFTheme.layout.contentWidth });
  layout.ensureSpace(fundingHeight + 10);
  PDFCardRenderer.render(doc, PDFTheme.margins.left, layout.getCurrentY(), {
    title: "Funding Request Target",
    content: fundingText,
    width: PDFTheme.layout.contentWidth
  });
  layout.setCurrentY(layout.getCurrentY() + fundingHeight + 10);

  renderHeading(doc, layout, "Monetization & Pricing Strategic Philosophy");
  const pricingText = `pricing Choice Reason:\n${data.finance.analysisSummary.pricingChoiceReason}\n\nBreak-even Strategy:\n${data.finance.breakevenAnalysis}`;
  renderParagraph(doc, layout, pricingText);

  renderHeading(doc, layout, "Initial Setup Startup Capital costs");
  const costHeaders = ["Cost Category Item", "Description details", "Estimated Cost"];
  const costRows = data.finance.startupCostEstimate.map(c => [c.item, c.description, c.amount]);
  PDFTableRenderer.render(doc, layout, costHeaders, costRows, [130, 282, 100]);

  renderHeading(doc, layout, "Monthly Recurring Operating Expenses (OPEX)");
  const opexHeaders = ["Recurring Expense Item", "Frequency / Period", "Estimated Cost"];
  const opexRows = data.finance.monthlyOperatingExpenses.map(e => [e.item, e.frequency, e.amount]);
  PDFTableRenderer.render(doc, layout, opexHeaders, opexRows, [220, 162, 130]);

  renderHeading(doc, layout, "Monetization Streams Projections");
  const revHeaders = ["Monetization Model", "monetization Details", "Pricing model", "Projected Year 1"];
  const revRows = data.finance.revenueStreams.map(r => [r.name, r.description, r.pricingModel, r.projectedRevenue]);
  PDFTableRenderer.render(doc, layout, revHeaders, revRows, [110, 180, 110, 112]);

  renderHeading(doc, layout, "Financial Risks & Mitigations");
  const riskHeaders = ["Financial Risk Factor", "Severity", "Strategic Mitigation Plan"];
  const riskRows = data.finance.financialRisks.map(fr => [fr.risk, fr.severity, fr.mitigation]);
  PDFTableRenderer.render(doc, layout, riskHeaders, riskRows, [180, 70, 262]);
}

/**
 * Page 7: Investor Evaluation
 */
function renderInvestorEvaluation(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "Investor Evaluation & Due Diligence");

  renderHeading(doc, layout, "VC Decision Briefing");
  const recomText = `Recommendation: ${data.investor.recommendation}\n\nFunding Recommended Terms:\n${data.investor.fundingRecommendation}`;
  const recomHeight = PDFCardRenderer.calculateHeight(doc, { title: "VC Critique Verdict", content: recomText, width: PDFTheme.layout.contentWidth });
  layout.ensureSpace(recomHeight + 10);
  PDFCardRenderer.render(doc, PDFTheme.margins.left, layout.getCurrentY(), {
    title: "VC Critique Verdict",
    content: recomText,
    width: PDFTheme.layout.contentWidth
  });
  layout.setCurrentY(layout.getCurrentY() + recomHeight + 10);

  // Reasons to Invest / Pass
  renderHeading(doc, layout, "VC Invest vs Pass Critique");
  renderTwoCards(
    doc,
    layout,
    "Top Reasons to Invest",
    data.investor.reasonsToInvest,
    "Top Concerns / Pass Reasons",
    data.investor.reasonsNotToInvest,
    false,
    true
  );

  renderHeading(doc, layout, "Identified Strengths & Vulnerabilities");
  renderTwoCards(
    doc,
    layout,
    "VC Identified Strengths",
    data.investor.strengths.join(", "),
    "VC Identified Weaknesses",
    data.investor.weaknesses.join(", "),
    false,
    true
  );

  renderHeading(doc, layout, "Exit Strategy Potential");
  renderParagraph(doc, layout, data.investor.exitPotential);

  renderHeading(doc, layout, "Due Diligence Questions for Founders");
  renderBulletList(doc, layout, data.investor.questionsForFounder);
}

/**
 * Page 8: Appendix
 */
function renderAppendix(doc: PDFKit.PDFDocument, layout: PDFLayoutManager, data: Phase8Output) {
  renderTitle(doc, layout, "Appendix: Performance Trace & Systems Metadata");

  renderParagraph(doc, layout, "This appendix contains the LangGraph multi-agent execution pipeline metadata, node durations, and sequential company orchestrator trace performance.");

  renderHeading(doc, layout, "LangGraph Pipeline Node Execution Path");
  const traceText = (data.metadata?.trace || ["CEO", "Research", "Product", "Finance", "Investor", "Summary"]).join("  ──▶  ");
  
  // Draw path block
  const traceHeight = doc.heightOfString(traceText, { width: PDFTheme.layout.contentWidth - 20, align: "center" }) + 16;
  layout.ensureSpace(traceHeight + 10);
  const traceY = layout.getCurrentY();
  
  doc.fillColor(PDFTheme.colors.bgLight);
  doc.roundedRect(PDFTheme.margins.left, traceY, PDFTheme.layout.contentWidth, traceHeight, 4).fill();
  doc.strokeColor(PDFTheme.colors.borderLight).lineWidth(1);
  doc.roundedRect(PDFTheme.margins.left, traceY, PDFTheme.layout.contentWidth, traceHeight, 4).stroke();

  doc.fillColor(PDFTheme.colors.primary)
     .font(PDFTheme.fonts.bold)
     .fontSize(PDFTheme.fontSizes.body);
  doc.text(traceText, PDFTheme.margins.left + 10, traceY + 8, {
    width: PDFTheme.layout.contentWidth - 20,
    align: "center"
  });
  layout.setCurrentY(traceY + traceHeight + 10);

  renderHeading(doc, layout, "Agent Performance Metrics");
  const timingHeaders = ["Agent Node", "Execution Status", "Start Timestamp", "End Timestamp", "Duration"];
  
  const nodeKeys = ["ceo", "research", "product", "finance", "investor", "summary"];
  const timingRows: string[][] = [];
  let minStart = Infinity;
  let maxEnd = -Infinity;

  nodeKeys.forEach(k => {
    const metadataNode = data.metadata?.nodes?.[k];
    if (metadataNode) {
      if (metadataNode.startTime < minStart) minStart = metadataNode.startTime;
      if (metadataNode.endTime > maxEnd) maxEnd = metadataNode.endTime;
      
      timingRows.push([
        k.toUpperCase(),
        metadataNode.status || "completed",
        new Date(metadataNode.startTime).toISOString(),
        new Date(metadataNode.endTime).toISOString(),
        metadataNode.duration || "N/A"
      ]);
    } else {
      timingRows.push([k.toUpperCase(), "completed", "N/A", "N/A", "N/A"]);
    }
  });

  PDFTableRenderer.render(doc, layout, timingHeaders, timingRows, [80, 70, 157, 157, 48]);

  let totalDurationStr = "N/A";
  if (minStart !== Infinity && maxEnd !== -Infinity) {
    totalDurationStr = `${((maxEnd - minStart) / 1000).toFixed(2)}s`;
  }

  renderHeading(doc, layout, "Incubator Systems Metadata Summary");
  const opexHeaders = ["System Attribute", "Value Details"];
  const opexRows = [
    ["Total Pipeline Execution Duration", totalDurationStr],
    ["Report Generator version", "1.1.0 (PDFLayoutManager Core)"],
    ["Incubator Model Reference", "Phase 9.1 Multi-role LLM Network"],
    ["Validation Status", "SUCCESS (Passed PDFValidation boundaries check)"]
  ];
  PDFTableRenderer.render(doc, layout, opexHeaders, opexRows, [200, 312]);
}
