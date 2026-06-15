import { NextResponse } from "next/server";
import { companyOrchestrator } from "../../../orchestrator/companyOrchestrator";

/**
 * Handles POST requests to /api/ceo
 * 
 * THIN API CONTROLLER DESIGN:
 * Following clean architecture principles, this endpoint acts strictly as an entry point:
 * 1. Parses and validates the HTTP Request body.
 * 2. Checks that required environments are present (GEMINI_API_KEY).
 * 3. Hands execution off to the business layer (CompanyOrchestrator).
 * 4. Returns the result with the correct HTTP Status and Content-Type.
 * 
 * By delegating orchestration, this file remains under 50 lines of code,
 * making it easy to read, test, and adapt to any future routing changes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const startupIdea = body.startupIdea || body.idea;

    // 1. Basic validation
    if (!startupIdea || typeof startupIdea !== "string" || startupIdea.trim() === "") {
      return NextResponse.json(
        { 
          success: false, 
          error: "A valid 'startupIdea' is required in the request body." 
        },
        { status: 400 }
      );
    }

    // 2. Pre-requisite validation
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured. Please define GEMINI_API_KEY in your .env.local file."
        },
        { status: 550 }
      );
    }

    // 3. Delegate execution to the Orchestrator
    const result = await companyOrchestrator.run(startupIdea);

    // 4. Return successful response
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error("[API Controller Error]:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred during agent execution."
      },
      { status: 550 }
    );
  }
}
