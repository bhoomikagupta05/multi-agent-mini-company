import { aiClient } from "../lib/gemini";
import { CEOOutput } from "../types";

/**
 * CEOAgent Class
 * 
 * This agent acts as the Chief Executive Officer of the virtual company.
 * It takes a startup idea from the user and formulates the high-level strategy:
 * - Company Name (generated based on the idea)
 * - Vision & Mission Statements
 * - Key Business Goals (with metrics & timeframes)
 * - Recommended organizational departments
 * - A structured First 90-Day execution plan
 */
export class CEOAgent {
  // Define the model we want to use. We can customize this via environment variables.
  private modelName: string;

  constructor() {
    // Default to 'gemini-2.5-flash' for fast and cost-effective generation.
    // If you need a more powerful model, you can set GEMINI_MODEL in your .env.local file.
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  /**
   * Formulates a structured business plan based on the startup idea.
   * 
   * @param startupIdea - The input description of the startup idea.
   * @returns A promise that resolves to the structured CEOOutput.
   */
  async generateCompanyPlan(startupIdea: string): Promise<CEOOutput> {
    if (!startupIdea || startupIdea.trim() === "") {
      throw new Error("Startup idea cannot be empty");
    }

    // Define the system instructions for the CEO agent to set its persona.
    const systemInstruction = `
      You are the Chief Executive Officer (CEO) of a newly founded startup.
      Your job is to analyze the user's startup idea and establish the strategic foundation for the company.
      Provide realistic, actionable, and analytical insights. Avoid generic corporate speak; instead,
      deliver specific plans, metrics, and departmental goals relevant to the particular industry of the startup.
    `;

    // Prompt for the CEO agent.
    const prompt = `
      Formulate a comprehensive launch strategy and business foundation for the following startup idea:
      "${startupIdea}"
    `;

    // Define the OpenAPI 3.0 schema that the Gemini API MUST follow.
    // This forces the model to respond in a strict JSON format matching our TypeScript interfaces.
    const responseSchema = {
      type: "OBJECT",
      properties: {
        companyName: {
          type: "STRING",
          description: "A creative, brandable, and professional name for the startup."
        },
        vision: {
          type: "STRING",
          description: "The long-term (5-10 years) aspirational state and ultimate impact of the company."
        },
        mission: {
          type: "STRING",
          description: "The current focus, core purpose, and what the company does for its customers daily."
        },
        businessGoals: {
          type: "ARRAY",
          description: "Three specific, realistic, and measurable business goals for the first year.",
          items: {
            type: "OBJECT",
            properties: {
              goal: { type: "STRING", description: "The goal description." },
              timeframe: { type: "STRING", description: "Target timeframe (e.g., Q1, Month 1-3)." },
              metric: { type: "STRING", description: "Clear key performance indicator (KPI) to track success." }
            },
            required: ["goal", "timeframe", "metric"]
          }
        },
        suggestedDepartments: {
          type: "ARRAY",
          description: "The core departments required to get this startup off the ground.",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Name of the department (e.g., Product Development, Growth & Marketing)." },
              purpose: { type: "STRING", description: "The primary purpose and role of this department." },
              focus: { type: "STRING", description: "The primary focus area for the department in the first 90 days." }
            },
            required: ["name", "purpose", "focus"]
          }
        },
        first90DayPlan: {
          type: "OBJECT",
          description: "The execution roadmap broken down into three monthly phases.",
          properties: {
            days30: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Title of the first 30 days phase (e.g., Phase 1: Foundation & Market Research)." },
                milestones: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of actionable milestones to complete in the first 30 days."
                }
              },
              required: ["title", "milestones"]
            },
            days60: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Title of the 31-60 days phase (e.g., Phase 2: MVP Development & Feedback)." },
                milestones: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of actionable milestones to complete in the second month."
                }
              },
              required: ["title", "milestones"]
            },
            days90: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Title of the 61-90 days phase (e.g., Phase 3: Launch Prep & Beta Run)." },
                milestones: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of actionable milestones to complete in the third month."
                }
              },
              required: ["title", "milestones"]
            }
          },
          required: ["days30", "days60", "days90"]
        }
      },
      required: [
        "companyName",
        "vision",
        "mission",
        "businessGoals",
        "suggestedDepartments",
        "first90DayPlan"
      ]
    };

    try {
      // Execute the call using the official Google Gen AI SDK.
      const response = await aiClient.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          // Specifying 'application/json' instructs Gemini that the output should be valid JSON
          responseMimeType: "application/json",
          // The responseSchema guarantees the output adheres exactly to the structure we defined above
          responseSchema: responseSchema as any,
        },
      });

      // Retrieve the response text. The SDK guarantees that if no error occurred,
      // it matches the structure and is a parsable JSON string.
      const responseText = response.text;
      
      if (!responseText) {
        throw new Error("No response received from the Gemini API");
      }

      // Parse and return the JSON payload cast to the CEOOutput interface.
      const parsedData = JSON.parse(responseText) as CEOOutput;
      return parsedData;

    } catch (error) {
      console.error("CEOAgent execution failed:", error);
      throw error;
    }
  }
}
