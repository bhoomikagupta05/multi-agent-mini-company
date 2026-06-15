import { aiClient } from "../lib/gemini";
import { CEOOutput, ResearchOutput, ProductOutput } from "../types";

/**
 * ProductAgent Class
 * 
 * AGENT ROLE:
 * This agent acts as the Lead Product Manager (PM).
 * While the CEO establishes the strategic goals and the Researcher validates market risks/competitors,
 * the Product Agent translates these broad strategies into direct product specs:
 * - Formulating a Unique Selling Proposition (USP).
 * - Defining concrete User Personas.
 * - Detailing the specific Minimum Viable Product (MVP) Features.
 * - Mapping a Priority Matrix (Must-Have vs. Should-Have vs. Could-Have).
 * - Outlining a 3-stage Product Roadmap (MVP, Growth/Optimization, and Scaling).
 * 
 * AGENT COMMUNICATION & SEQUENTIAL DATA FLOW:
 * This agent is the third step in our sequential data pipeline:
 * 
 *     [CEO Agent Output] ──┐
 *                          ├──> [Product Agent Input] ──> [Product Strategy Output]
 *     [Research Output] ───┘
 * 
 * In order to define a successful product strategy, a PM must look both at:
 * 1. The corporate goal (CEO Output: vision, timeline, departments).
 * 2. The market reality (Research Output: competitors, audience pain points, macro trends).
 * We pass both outputs as serialized context, allowing the PM Agent to build features
 * that directly solve the validated target audience's pain points while avoiding competitors' strengths.
 * 
 * FUTURE SCALABILITY:
 * The resulting ProductOutput will be passed to:
 * - Finance Agent: To estimate engineering costs and map a pricing model based on MVP deliverables.
 * - Investor Agent: To critique the product viability, USP strength, and roadmap speed.
 */
export class ProductAgent {
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  /**
   * Generates a structured product requirements plan.
   * 
   * @param startupIdea - The raw business idea.
   * @param ceoOutput - Strategy context from the CEO Agent.
   * @param researchOutput - Market analysis context from the Research Agent.
   * @returns A promise resolving to the structured ProductOutput.
   */
  async generateProductPlan(
    startupIdea: string,
    ceoOutput: CEOOutput,
    researchOutput: ResearchOutput
  ): Promise<ProductOutput> {
    if (!startupIdea || startupIdea.trim() === "") {
      throw new Error("Startup idea cannot be empty");
    }

    if (!ceoOutput || !ceoOutput.companyName) {
      throw new Error("CEO context is missing or invalid");
    }

    if (!researchOutput || !researchOutput.targetAudience) {
      throw new Error("Research context is missing or invalid");
    }

    const systemInstruction = `
      You are the Lead Product Manager of a newly founded startup.
      Your job is to translate the CEO's corporate strategy and the Market Researcher's findings
      into a concrete product requirements and strategy report.
      You must look closely at the target audience pain points, competitors' weaknesses, and the CEO's vision.
      Be realistic, technical, and analytical. Frame features clearly and justify their inclusion in the MVP.
    `;

    // Prompt injecting CEO and Research outputs.
    const prompt = `
      Compile a comprehensive Product Strategy and MVP Scope for the startup:

      --- RAW IDEA ---
      "${startupIdea}"

      --- CEO STRATEGY ---
      Company Name: ${ceoOutput.companyName}
      Vision: ${ceoOutput.vision}
      Mission: ${ceoOutput.mission}
      Goals: ${JSON.stringify(ceoOutput.businessGoals)}

      --- MARKET RESEARCH ---
      Target Audience Demographics: ${researchOutput.targetAudience.demographics}
      Target Audience Pain Points: ${JSON.stringify(researchOutput.targetAudience.painPoints)}
      Competitors: ${JSON.stringify(researchOutput.competitors)}
      Opportunities: ${JSON.stringify(researchOutput.marketOpportunities)}

      --- INSTRUCTIONS ---
      Synthesize these parameters. Generate a strong Unique Selling Proposition (USP), 
      two detailed user personas, three MVP features, a prioritization matrix, 
      and a 3-phase development roadmap.
    `;

    // Strict OpenAPI 3.0 Schema matching the ProductOutput interface.
    const responseSchema = {
      type: "OBJECT",
      properties: {
        usp: {
          type: "STRING",
          description: "Unique Selling Proposition. Why this product wins against competitors."
        },
        userPersonas: {
          type: "ARRAY",
          description: "Define exactly two primary user personas.",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Name/moniker of the persona (e.g., Savvy Freelancer Sean)." },
              role: { type: "STRING", description: "Demographic or professional role (e.g., Sole Proprietor Designer)." },
              goals: { 
                type: "ARRAY", 
                items: { type: "STRING" },
                description: "What the persona wants to achieve." 
              },
              painPoints: { 
                type: "ARRAY", 
                items: { type: "STRING" },
                description: "The core problems this persona faces that our product resolves." 
              }
            },
            required: ["name", "role", "goals", "painPoints"]
          }
        },
        mvpFeatures: {
          type: "ARRAY",
          description: "Three key, core features that define the Minimum Viable Product (MVP).",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Clear feature title (e.g., Automated Time Tracker)." },
              description: { type: "STRING", description: "How the feature operates." },
              value: { type: "STRING", description: "Specific value/benefit provided to the user." }
            },
            required: ["name", "description", "value"]
          }
        },
        featurePriorities: {
          type: "ARRAY",
          description: "Priority tiers for product releases.",
          items: {
            type: "OBJECT",
            properties: {
              tier: { type: "STRING", description: "Tier level: Must Have (MVP), Should Have (Release 1.1), or Could Have (Nice-to-Have)." },
              features: { 
                type: "ARRAY", 
                items: { type: "STRING" },
                description: "List of feature names matching this release tier." 
              }
            },
            required: ["tier", "features"]
          }
        },
        productRoadmap: {
          type: "OBJECT",
          description: "A 3-phase development roadmap.",
          properties: {
            phase1: {
              type: "OBJECT",
              properties: {
                phaseName: { type: "STRING", description: "e.g., Phase 1: MVP Core Launch" },
                timeline: { type: "STRING", description: "e.g., Months 1-3" },
                keyDeliverables: { 
                  type: "ARRAY", 
                  items: { type: "STRING" },
                  description: "Key product metrics or components built." 
                }
              },
              required: ["phaseName", "timeline", "keyDeliverables"]
            },
            phase2: {
              type: "OBJECT",
              properties: {
                phaseName: { type: "STRING", description: "e.g., Phase 2: Growth & Integrations" },
                timeline: { type: "STRING", description: "e.g., Months 4-6" },
                keyDeliverables: { 
                  type: "ARRAY", 
                  items: { type: "STRING" },
                  description: "Key product metrics or components built." 
                }
              },
              required: ["phaseName", "timeline", "keyDeliverables"]
            },
            phase3: {
              type: "OBJECT",
              properties: {
                phaseName: { type: "STRING", description: "e.g., Phase 3: AI Scale & Performance" },
                timeline: { type: "STRING", description: "e.g., Months 7-9" },
                keyDeliverables: { 
                  type: "ARRAY", 
                  items: { type: "STRING" },
                  description: "Key product metrics or components built." 
                }
              },
              required: ["phaseName", "timeline", "keyDeliverables"]
            }
          },
          required: ["phase1", "phase2", "phase3"]
        }
      },
      required: [
        "usp",
        "userPersonas",
        "mvpFeatures",
        "featurePriorities",
        "productRoadmap"
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
        throw new Error("No response received from the Gemini API during product planning");
      }

      const parsedData = JSON.parse(responseText) as ProductOutput;
      return parsedData;

    } catch (error) {
      console.error("ProductAgent execution failed:", error);
      throw error;
    }
  }
}
