import { NextResponse } from "next/server";
import { CEOAgent } from "../../../agents/ceoAgent";

/**
 * Handles POST requests to /api/ceo
 * 
 * This endpoint receives the user's startup idea in the JSON body,
 * instantiates the CEOAgent, runs the AI planning process,
 * and returns the structured business strategy plan as JSON.
 */
export async function POST(request: Request) {
  try {
    // 1. Parse the JSON body from the incoming request.
    const body = await request.json().catch(() => ({}));
    
    // We support both 'idea' or 'startupIdea' fields for flexibility.
    const startupIdea = body.startupIdea || body.idea;

    // 2. Validate that the startup idea is provided.
    if (!startupIdea || typeof startupIdea !== "string" || startupIdea.trim() === "") {
      return NextResponse.json(
        { 
          success: false, 
          error: "A valid 'startupIdea' is required in the request body." 
        },
        { status: 400 }
      );
    }

    // 3. Check if the Gemini API key is configured.
    // This provides a helpful error message to the developer.
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured. Please define GEMINI_API_KEY in your .env.local file."
        },
        { status: 500 }
      );
    }

    // 4. Instantiate the CEO Agent and execute the planning process.
    const ceo = new CEOAgent();
    const result = await ceo.generateCompanyPlan(startupIdea);

    // 5. Return the successful generated plan.
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error("Error in API Route /api/ceo:", error);

    // Provide a detailed error response to help debugging.
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during CEO generation."
      },
      { status: 500 }
    );
  }
}
