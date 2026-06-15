import { aiClient } from "../lib/gemini";
import { CEOOutput, ResearchOutput, ProductOutput, FinanceOutput, InvestorOutput } from "../types";

/**
 * InvestorAgent Class
 * 
 * AGENT ROLE:
 * This agent acts as a Venture Capitalist (VC) or Angel Investor.
 * Unlike other agents who construct the company, the Investor Agent critiques the work of all
 * preceding agents. It conducts rigorous due diligence:
 * - Assigning an Investment Score (0-10) and Risk Score (0-10).
 * - Defining its Confidence Score (0-100%) in its recommendation.
 * - Outlining a formal recommendation ("Invest", "Watchlist", "Pass").
 * - Providing exactly 3 core reasons to invest, and exactly 3 core reasons to pass/wait.
 * - Spotting structural strengths and weaknesses.
 * - Generating critical due diligence questions for the founder.
 * - Evaluating Exit Potential (ROI and acquisitions).
 * - Proposing investment terms and funding structures.
 * 
 * MODULARITY & FUTURE REPORTING SCALABILITY:
 * The output of the InvestorAgent is structured as a clean, stand-alone nested JSON.
 * This makes it extremely easy for future features (like generating a formal pitch memo,
 * exporting an executive PDF report, or sending pitch critique emails) to read this output
 * and compile structured data without repeating LLM calls.
 */
export class InvestorAgent {
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  /**
   * Evaluates the full company strategy and outputs an investment critique.
   * 
   * @param startupIdea - The raw business description.
   * @param ceoOutput - CEO Agent output context.
   * @param researchOutput - Research Agent output context.
   * @param productOutput - Product Agent output context.
   * @param financeOutput - Finance Agent output context.
   * @returns A promise resolving to the structured InvestorOutput.
   */
  async generateInvestmentEvaluation(
    startupIdea: string,
    ceoOutput: CEOOutput,
    researchOutput: ResearchOutput,
    productOutput: ProductOutput,
    financeOutput: FinanceOutput
  ): Promise<InvestorOutput> {
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

    if (!financeOutput || !financeOutput.fundingRequirement) {
      throw new Error("Finance context is missing or invalid");
    }

    const systemInstruction = `
      You are an expert Venture Capitalist (VC) partner or Angel Investor.
      Your job is to review a startup proposal and provide an honest, critical, and objective evaluation.
      Do not be overly optimistic; spot the execution risks, market size limitations, funding shortfalls,
      competition, and pricing models that might fail.
      Assign critical scores, name exactly 3 reasons to invest and exactly 3 reasons not to invest,
      detail exit opportunities, and formulate funding terms.
    `;

    // Prompt injecting all previous outputs
    const prompt = `
      Perform a comprehensive VC due diligence evaluation and investment critique for:

      --- RAW IDEA ---
      "${startupIdea}"

      --- CEO STRATEGY ---
      Company Name: ${ceoOutput.companyName}
      Goals: ${JSON.stringify(ceoOutput.businessGoals)}

      --- MARKET RESEARCH ---
      Competitors: ${JSON.stringify(researchOutput.competitors)}
      Gaps/Opportunities: ${JSON.stringify(researchOutput.marketOpportunities)}
      Target Audience: ${JSON.stringify(researchOutput.targetAudience)}

      --- PRODUCT STRATEGY ---
      USP: ${productOutput.usp}
      MVP Features: ${JSON.stringify(productOutput.mvpFeatures)}
      Roadmap: ${JSON.stringify(productOutput.productRoadmap)}

      --- FINANCIAL STRATEGY ---
      Funding Requirement: ${financeOutput.fundingRequirement}
      OPEX: ${JSON.stringify(financeOutput.monthlyOperatingExpenses)}
      Startup Costs: ${JSON.stringify(financeOutput.startupCostEstimate)}
      Revenue Streams: ${JSON.stringify(financeOutput.revenueStreams)}

      --- INSTRUCTIONS ---
      Evaluate these inputs and compile the investment scorecard.
      Return investment and risk scores (0-10), a confidence score (0-100%), a pitch recommendation, 
      exactly 3 key reasons to invest, exactly 3 key reasons not to invest, 
      overall strengths, weaknesses, exit potential, and a recommended funding structure.
    `;

    // Strict OpenAPI 3.0 response schema matching InvestorOutput
    const responseSchema = {
      type: "OBJECT",
      properties: {
        investmentScore: {
          type: "NUMBER",
          description: "Numeric viability score from 0.0 to 10.0 based on PM-fit, growth, and team feasibility."
        },
        riskScore: {
          type: "NUMBER",
          description: "Numeric threat score from 0.0 to 10.0 based on competition, opex, and execution complexity."
        },
        confidenceScore: {
          type: "INTEGER",
          description: "VC confidence percentage in recommendation from 0 to 100 (e.g. 85)."
        },
        recommendation: {
          type: "STRING",
          description: "Verdict: Invest (High Conviction), Invest (Medium Conviction), Watchlist, or Pass."
        },
        reasonsToInvest: {
          type: "ARRAY",
          description: "Provide exactly 3 distinct, strong arguments to invest.",
          items: { type: "STRING" }
        },
        reasonsNotToInvest: {
          type: "ARRAY",
          description: "Provide exactly 3 distinct, strong arguments why one should pass or be cautious.",
          items: { type: "STRING" }
        },
        strengths: {
          type: "ARRAY",
          description: "Primary operational, competitive, or technical strengths.",
          items: { type: "STRING" }
        },
        weaknesses: {
          type: "ARRAY",
          description: "Primary operational, product, or financial vulnerabilities.",
          items: { type: "STRING" }
        },
        questionsForFounder: {
          type: "ARRAY",
          description: "Top 3-4 challenging due diligence questions to ask the founder during a live pitch.",
          items: { type: "STRING" }
        },
        exitPotential: {
          type: "STRING",
          description: "Likely exit scenario (e.g. M&A, IPO, buyout) with estimated timelines and targets."
        },
        fundingRecommendation: {
          type: "STRING",
          description: "VC equity terms, tranches, or actual funding recommendation based on the CFO request."
        }
      },
      required: [
        "investmentScore",
        "riskScore",
        "confidenceScore",
        "recommendation",
        "reasonsToInvest",
        "reasonsNotToInvest",
        "strengths",
        "weaknesses",
        "questionsForFounder",
        "exitPotential",
        "fundingRecommendation"
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
        throw new Error("No response received from the Gemini API during investor evaluation");
      }

      const parsedData = JSON.parse(responseText) as InvestorOutput;
      return parsedData;

    } catch (error) {
      console.error("InvestorAgent execution failed:", error);
      throw error;
    }
  }
}
export default InvestorAgent;
