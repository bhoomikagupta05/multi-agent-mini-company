import { aiClient } from "../lib/gemini";
import { CEOOutput, ResearchOutput, ProductOutput, FinanceOutput } from "../types";

/**
 * FinanceAgent Class
 * 
 * AGENT ROLE:
 * This agent acts as the Chief Financial Officer (CFO).
 * The CFO translates the CEO's operations, the Researcher's market realities, and the PM's roadmap
 * into concrete financial forecasts, cost allocations, and revenue streams.
 * 
 * AGENT DEPENDENCIES & DATA FLOW:
 * Finance is inherently dependent on previous agent outputs (Waterfall Context Ingestion):
 * 1. CEO Suggested Departments: Dictates staffing and operational team departments to list under OPEX.
 * 2. Market Research Competitors & Target Audience: Guides pricing models (premium vs. freemium)
 *    and helps identify financial risks like user churn.
 * 3. PM MVP Features & Roadmap: Identifies direct costs for infrastructure, APIs, and release schedules.
 * 
 * FUTURE SCALABILITY:
 * The outputs of CEO, Research, Product, and Finance will be consumed next by the InvestorAgent
 * to verify the financial viability, calculate ROI, and score the investability of the startup idea.
 */
export class FinanceAgent {
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  /**
   * Generates a structured financial requirements analysis.
   * 
   * @param startupIdea - The raw business description.
   * @param ceoOutput - CEO Agent outputs.
   * @param researchOutput - Research Agent outputs.
   * @param productOutput - Product Agent outputs.
   * @returns A promise resolving to the structured FinanceOutput.
   */
  async generateFinancePlan(
    startupIdea: string,
    ceoOutput: CEOOutput,
    researchOutput: ResearchOutput,
    productOutput: ProductOutput
  ): Promise<FinanceOutput> {
    if (!startupIdea || startupIdea.trim() === "") {
      throw new Error("Startup idea cannot be empty");
    }

    if (!ceoOutput || !ceoOutput.companyName) {
      throw new Error("CEO context is missing or invalid");
    }

    if (!researchOutput || !researchOutput.targetAudience) {
      throw new Error("Research context is missing or invalid");
    }

    if (!productOutput || !productOutput.usp) {
      throw new Error("Product context is missing or invalid");
    }

    const systemInstruction = `
      You are the Chief Financial Officer (CFO) of a newly founded startup.
      Your job is to translate the corporate vision, market research, and product features/roadmaps 
      into initial financial projections.
      Be realistic, analytical, and highly cost-conscious. Propose budgets that match a lean startup.
      Ensure all numbers (staffing OPEX, developer tool costs, hosting, and marketing) align with the 
      suggested departments, timeline, and features.
    `;

    // Prompt injecting CEO, Research, and Product outputs.
    const prompt = `
      Formulate the financial strategy, costs, expenses, and revenue model for the startup:

      --- RAW IDEA ---
      "${startupIdea}"

      --- CEO STRATEGY ---
      Company Name: ${ceoOutput.companyName}
      Goals: ${JSON.stringify(ceoOutput.businessGoals)}
      Suggested Departments: ${JSON.stringify(ceoOutput.suggestedDepartments)}

      --- MARKET RESEARCH ---
      Competitors: ${JSON.stringify(researchOutput.competitors)}
      Gaps/Opportunities: ${JSON.stringify(researchOutput.marketOpportunities)}
      Target Audience Demographics: ${researchOutput.targetAudience.demographics}

      --- PRODUCT STRATEGY ---
      USP: ${productOutput.usp}
      MVP Features: ${JSON.stringify(productOutput.mvpFeatures)}
      Roadmap: ${JSON.stringify(productOutput.productRoadmap)}

      --- INSTRUCTIONS ---
      Synthesize these parameters. Provide a total 12-month funding requirement, pricing tiers, 
      break-even milestones, a startup cost estimate table, monthly operating expenses, 
      revenue streams, and financial risks. 
      Include a clear analysisSummary detailing why these targets and pricing strategies were chosen, 
      along with the underlying financial assumptions.
    `;

    // Strict OpenAPI 3.0 Schema matching the FinanceOutput interface.
    const responseSchema = {
      type: "OBJECT",
      properties: {
        fundingRequirement: {
          type: "STRING",
          description: "Total funding required to survive and scale for 12 months (e.g. '$120,000')."
        },
        pricingStrategy: {
          type: "STRING",
          description: "Overview of the monetization tiers and pricing logic."
        },
        breakevenAnalysis: {
          type: "STRING",
          description: "Milestones/timeline showing when operating costs are covered by revenue streams."
        },
        startupCostEstimate: {
          type: "ARRAY",
          description: "Initial one-off setup costs required to launch.",
          items: {
            type: "OBJECT",
            properties: {
              item: { type: "STRING", description: "Name of cost item (e.g., Domain and Server Setup)." },
              description: { type: "STRING", description: "What this expense covers." },
              amount: { type: "STRING", description: "Estimated amount (e.g., '$800')." }
            },
            required: ["item", "description", "amount"]
          }
        },
        monthlyOperatingExpenses: {
          type: "ARRAY",
          description: "Monthly recurring operating expenses (OPEX).",
          items: {
            type: "OBJECT",
            properties: {
              item: { type: "STRING", description: "Expense item name (e.g., Cloud Hosting, Marketing Spend)." },
              frequency: { type: "STRING", description: "Frequency of cost (typically 'Monthly' or 'Annual')." },
              amount: { type: "STRING", description: "Amount (e.g., '$1,200')." }
            },
            required: ["item", "frequency", "amount"]
          }
        },
        revenueStreams: {
          type: "ARRAY",
          description: "Projected year-1 revenue streams.",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Name of revenue stream (e.g., Premium Subscription)." },
              description: { type: "STRING", description: "Who pays and what they get." },
              pricingModel: { type: "STRING", description: "e.g., Monthly SaaS Subscription, 2% Transaction fee." },
              projectedRevenue: { type: "STRING", description: "Projected Year 1 revenue (e.g., '$45,000')." }
            },
            required: ["name", "description", "pricingModel", "projectedRevenue"]
          }
        },
        financialRisks: {
          type: "ARRAY",
          description: "Financial risks and mitigation strategies.",
          items: {
            type: "OBJECT",
            properties: {
              risk: { type: "STRING", description: "Description of the risk (e.g., Low initial user retention)." },
              severity: { type: "STRING", description: "Severity: High, Medium, or Low." },
              mitigation: { type: "STRING", description: "Plan to mitigate this risk financially." }
            },
            required: ["risk", "severity", "mitigation"]
          }
        },
        analysisSummary: {
          type: "OBJECT",
          description: "Brief strategic narrative explaining key financial decisions.",
          properties: {
            pricingChoiceReason: { type: "STRING", description: "Detailed rationale behind pricing models." },
            fundingChoiceReason: { type: "STRING", description: "Justification for the chosen 12-month funding requirement." },
            mainAssumptions: { 
              type: "ARRAY", 
              items: { type: "STRING" },
              description: "Assumptions made (e.g., conversion rate, customer acquisition cost)." 
            }
          },
          required: ["pricingChoiceReason", "fundingChoiceReason", "mainAssumptions"]
        }
      },
      required: [
        "fundingRequirement",
        "pricingStrategy",
        "breakevenAnalysis",
        "startupCostEstimate",
        "monthlyOperatingExpenses",
        "revenueStreams",
        "financialRisks",
        "analysisSummary"
      ]
    };

    try {
      const response = await aiClient.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
        },
      });

      const responseText = response.text;
      
      if (!responseText) {
        throw new Error("No response received from the Gemini API during finance generation");
      }

      const parsedData = JSON.parse(responseText) as FinanceOutput;
      return parsedData;

    } catch (error) {
      console.error("FinanceAgent execution failed:", error);
      throw error;
    }
  }
}
export default FinanceAgent;
