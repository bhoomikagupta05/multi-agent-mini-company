import { NextResponse } from "next/server";
import { CEOAgent } from "../../../agents/ceoAgent";
import { ResearchAgent } from "../../../agents/researchAgent";
import { ProductAgent } from "../../../agents/productAgent";

/**
 * Handles POST requests to /api/ceo
 * 
 * PHASE 3 PIPELINE:
 * Chaining sequence:
 * 
 *     [User Input: Startup Idea]
 *                 │
 *                 ▼
 *          ┌─────────────┐
 *          │  CEO Agent  │  <-- 1. [CEO Started] Sets company profile/goals [CEO Completed]
 *          └──────┬──────┘
 *                 │
 *                 ├─ (ceoOutput)
 *                 ▼
 *          ┌──────────────┐
 *          │Research Agent│ <-- 2. [Research Started] Runs market context analysis [Research Completed]
 *          └──────┬───────┘
 *                 │
 *                 ├─ (ceoOutput + researchOutput)
 *                 ▼
 *          ┌──────────────┐
 *          │Product Agent │ <-- 3. [Product Started] Defines MVP scope/personas [Product Completed]
 *          └──────┬───────┘
 *                 │
 *                 ▼
 *     [Unified JSON Response]  { success: true, data: { ceo, research, product } }
 * 
 * SCALABILITY DESIGN:
 * This decoupled structure remains modular. Adding Finance or Investor agents later
 * would follow the exact same pattern: import the agent, instantiate it, and pass
 * previous outputs as arguments.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const startupIdea = body.startupIdea || body.idea;

    if (!startupIdea || typeof startupIdea !== "string" || startupIdea.trim() === "") {
      return NextResponse.json(
        { 
          success: false, 
          error: "A valid 'startupIdea' is required in the request body." 
        },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured. Please define GEMINI_API_KEY in your .env.local file."
        },
        { status: 500 }
      );
    }

    console.log(`[Orchestrator] Starting sequential execution pipeline for idea: "${startupIdea}"`);

    // --- STAGE 1: CEO AGENT ---
    console.log("[Orchestrator] CEO Started");
    const ceoAgent = new CEOAgent();
    const ceoOutput = await ceoAgent.generateCompanyPlan(startupIdea);
    console.log("[Orchestrator] CEO Completed");

    // --- STAGE 2: RESEARCH AGENT ---
    // CEO output is passed as context to Research Agent.
    console.log("[Orchestrator] Research Started");
    const researchAgent = new ResearchAgent();
    const researchOutput = await researchAgent.generateResearch(startupIdea, ceoOutput);
    console.log("[Orchestrator] Research Completed");

    // --- STAGE 3: PRODUCT AGENT ---
    // Both CEO output and Research output are passed as context to Product Agent.
    console.log("[Orchestrator] Product Started");
    const productAgent = new ProductAgent();
    const productOutput = await productAgent.generateProductPlan(startupIdea, ceoOutput, researchOutput);
    console.log("[Orchestrator] Product Completed");

    console.log("[Orchestrator] Execution Pipeline finished successfully.");

    // --- RETURN COMBINED OUTPUT ---
    return NextResponse.json({
      success: true,
      data: {
        ceo: ceoOutput,
        research: researchOutput,
        product: productOutput
      }
    });

  } catch (error: any) {
    console.error("[Orchestrator] Pipeline error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred during agent execution."
      },
      { status: 500 }
    );
  }
}
