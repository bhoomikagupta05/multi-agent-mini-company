/**
 * ============================================================================
 * PHASE 1: CEO AGENT TYPES
 * ============================================================================
 */

export interface BusinessGoal {
  goal: string;       // e.g., "Build a minimum viable food delivery app"
  timeframe: string;  // e.g., "Q1", "Months 1-3"
  metric: string;     // e.g., "100 active beta testers"
}

export interface SuggestedDepartment {
  name: string;       // e.g., "Product & Engineering", "Marketing"
  purpose: string;    // The core reason this department exists
  focus: string;      // The primary focus area for the first 90 days (e.g., "Build core MVP features")
}

export interface MilestonePhase {
  title: string;
  milestones: string[];
}

export interface CEOOutput {
  companyName: string;                     // The AI-generated name for the startup
  vision: string;                          // Long-term aspiration of the company
  mission: string;                         // Present focus and core purpose
  businessGoals: BusinessGoal[];           // Key milestones with timeframes and metrics
  suggestedDepartments: SuggestedDepartment[]; // Initial organizational structure
  first90DayPlan: {
    days30: MilestonePhase;                // Month 1 roadmap
    days60: MilestonePhase;                // Month 2 roadmap
    days90: MilestonePhase;                // Month 3 roadmap
  };
}

/**
 * ============================================================================
 * PHASE 2: RESEARCH AGENT TYPES
 * ============================================================================
 */

export interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export interface MarketOpportunity {
  opportunity: string;
  potentialImpact: string; // e.g., "High", "Medium", "Low"
}

export interface IndustryTrend {
  trend: string;
  relevance: string; // Explanation of how it impacts the startup
}

export interface BusinessRisk {
  risk: string;
  severity: string; // e.g., "High", "Medium", "Low"
  mitigation: string; // Mitigation strategy
}

export interface TargetAudience {
  demographics: string; // e.g., "Age 18-35 tech professionals"
  painPoints: string[]; // List of core problems they face
  whyTheyBuy: string;   // Core value proposition that appeals to them
}

export interface ResearchOutput {
  competitors: Competitor[];
  marketOpportunities: MarketOpportunity[];
  industryTrends: IndustryTrend[];
  risks: BusinessRisk[];
  targetAudience: TargetAudience;
}

/**
 * ============================================================================
 * PHASE 3: PRODUCT MANAGER AGENT TYPES
 * ============================================================================
 */

export interface UserPersona {
  name: string;          // e.g., "Busy Parent Sarah"
  role: string;          // Occupation or life stage (e.g., "Working Mother")
  goals: string[];       // Goals Sarah has related to this product category
  painPoints: string[];  // Sarah's current struggles or blockers
}

export interface MVPFeature {
  name: string;          // e.g., "Instant salad recommendation wizard"
  description: string;   // What the feature does
  value: string;         // The business or user value of this feature
}

export interface FeaturePriority {
  tier: string;          // e.g., "Must Have (MVP)", "Should Have (Post-MVP)", "Could Have (Nice-to-Have)"
  features: string[];    // Names of the features belonging to this tier
}

export interface ProductRoadmapPhase {
  phaseName: string;     // e.g., "v1.0 (MVP Launch)"
  timeline: string;      // e.g., "Months 1-2"
  keyDeliverables: string[]; // List of concrete milestones or features delivered in this phase
}

export interface ProductOutput {
  usp: string;                          // Unique Selling Proposition (why this product wins)
  userPersonas: UserPersona[];          // The key user archetypes this product solves problems for
  mvpFeatures: MVPFeature[];            // Core feature set scoping
  featurePriorities: FeaturePriority[];  // Priority matrix (Must/Should/Could)
  productRoadmap: {
    phase1: ProductRoadmapPhase;        // Launch scope
    phase2: ProductRoadmapPhase;        // Optimization scope
    phase3: ProductRoadmapPhase;        // Scale scope
  };
}

/**
 * ============================================================================
 * PHASE 5: FINANCE AGENT TYPES
 * ============================================================================
 */

export interface CostItem {
  item: string;          // e.g., "Legal registration", "Initial software licenses"
  description: string;   // Brief details of the expense
  amount: string;        // Estimated amount (e.g., "$1,500")
}

export interface ExpenseItem {
  item: string;          // e.g., "Cloud hosting", "Engineering salaries"
  frequency: string;     // e.g., "Monthly", "Annual"
  amount: string;        // Estimated cost (e.g., "$500")
}

export interface RevenueStream {
  name: string;          // e.g., "SaaS subscription"
  description: string;   // Description of who pays and what they get
  pricingModel: string;  // e.g., "Flat fee", "Per user"
  projectedRevenue: string; // Projected Year 1 revenue
}

export interface FinancialRisk {
  risk: string;          // Description of financial threat (e.g., "High customer churn")
  severity: string;      // e.g., "High", "Medium", "Low"
  mitigation: string;    // Financial buffer or operational mitigation plan
}

export interface FinanceAnalysisSummary {
  pricingChoiceReason: string; // Rationale behind the chosen pricing strategy
  fundingChoiceReason: string; // Why this specific funding target was selected
  mainAssumptions: string[];   // Assumptions made (growth rate, retention rate, etc.)
}

export interface FinanceOutput {
  fundingRequirement: string;               // Total funding needed to survive and scale for 12 months (e.g., "$150,000")
  pricingStrategy: string;                  // Strategic overview of pricing tiers and structure
  breakevenAnalysis: string;                // Projections of when the business becomes profitable
  startupCostEstimate: CostItem[];         // One-off costs to register/build the company
  monthlyOperatingExpenses: ExpenseItem[];  // Recurring costs to operate the business
  revenueStreams: RevenueStream[];          // Monetization opportunities
  financialRisks: FinancialRisk[];          // Financial threats and mitigation plans
  analysisSummary: FinanceAnalysisSummary;  // Strategic narrative behind the financials
}

/**
 * ============================================================================
 * PHASE 6: INVESTOR AGENT TYPES
 * ============================================================================
 */

export interface InvestorOutput {
  investmentScore: number;                 // Numeric rating (0 to 10) on how viable this business is
  riskScore: number;                       // Numeric rating (0 to 10) representing risk exposure
  confidenceScore: number;                 // Percentage confidence in recommendation (e.g., 85)
  recommendation: string;                  // Pitch verdict (e.g., "Invest (High conviction)", "Watchlist", "Pass")
  reasonsToInvest: string[];               // Exactly 3 core reasons to invest
  reasonsNotToInvest: string[];            // Exactly 3 core reasons not to invest
  strengths: string[];                     // Key business strengths identified during critique
  weaknesses: string[];                    // Vulnerabilities or gaps in planning
  questionsForFounder: string[];           // Questions to grill the founder on in a due diligence call
  exitPotential: string;                   // Narrative of acquisition or exit models and timeline
  fundingRecommendation: string;          // CFO request vs. actual recommended allocation and equity terms
}

/**
 * Combined response payload containing CEO, Research, Product, Finance, and Investor outputs.
 * 
 * FUTURE SCALABILITY:
 * Further reporting, audit, or PDF generation agents can consume this clean nested object.
 */
export interface Phase6Output {
  ceo: CEOOutput;
  research: ResearchOutput;
  product: ProductOutput;
  finance: FinanceOutput;
  investor: InvestorOutput;
}
