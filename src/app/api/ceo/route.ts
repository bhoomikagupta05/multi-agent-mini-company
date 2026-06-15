import { NextResponse } from "next/server";
import { CEOAgent } from "../../../agents/ceoAgent";
import { ResearchAgent } from "../../../agents/researchAgent";

/**
 * Handles POST requests to /api/ceo
 * 
 * ORCHESTRATION & AGENT COMMUNICATION DESIGN:
 * This API endpoint acts as the central coordinator (orchestrator) for our virtual company.
 * In Phase 2, we implement a sequential agent-chaining pipeline:
 * 
 *     [User Input: Startup Idea]
 *                 │
 *                 ▼
 *          ┌─────────────┐
 *          │  CEO Agent  │  <-- 1. Sets name, vision, mission, goals, departments
 *          └──────┬──────┘
 *                 │
 *                 ├─ (CEOOutput passed as context)
 *                 ▼
 *          ┌──────────────┐
 *          │Research Agent│ <-- 2. Performs market validation aligning with CEO goals
 *          └──────┬───────┘
 *                 │
 *                 ▼
 *     [Unified JSON Response]  { success: true, data: { ceo, research } }
 * 
 * SCALABILITY DESIGN:
 * By keeping the orchestration inside this API route, the individual agents remain isolated,
 * testable, and completely independent. If we want to add future agents:
 * 
 * Step 3: PM Agent -> const pmResult = await pmAgent.generatePRD(idea, ceoResult, researchResult);
 * Step 4: Finance Agent -> const financeResult = await financeAgent.generateFinancials(ceoResult, pmResult);
 * 
 * We would simply call them here sequentially and append their results to the final payload.
 */
export async function POST(request: Request) {
  try {
    // 1. Parse request body
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

    console.log(`[Orchestrator] Starting execution for idea: "${startupIdea}"`);

    // --- STEP 1: Execute the CEO Agent ---
    console.log("[Orchestrator] Running CEO Agent...");
    const ceoAgent = new CEOAgent();
    const ceoOutput = await ceoAgent.generateCompanyPlan(startupIdea);

    // --- STEP 2: Execute the Research Agent ---
    // Here we pass 'ceoOutput' as the second argument. This is the core data pipeline
    // where the Research Agent reads the CEO's decisions to perform contextual market research.
    console.log("[Orchestrator] Running Research Agent...");
    const researchAgent = new ResearchAgent();
    const researchOutput = await researchAgent.generateResearch(startupIdea, ceoOutput);

    console.log("[Orchestrator] Both agents completed execution successfully.");

    // --- STEP 3: Return Unified Output ---
    return NextResponse.json({
      success: true,
      data: {
        ceo: ceoOutput,
        research: researchOutput
      }
    });

  } catch (error: any) {
    console.error("[Orchestrator] Execution failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during agent execution."
      },
      { status: 500 }
    );
  }
}
