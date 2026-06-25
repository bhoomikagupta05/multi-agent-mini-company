import { NextResponse } from "next/server";
import { PDFGenerator } from "../../../lib/pdf/pdfGenerator";
import { ReportType } from "../../../lib/pdf/pdfGenerator";

/**
 * Handles POST requests to /api/report
 * 
 * THIN API CONTROLLER DESIGN:
 * 1. Parses the request body to extract the LangGraph execution data (`results`) and optional `reportType`.
 * 2. Calls the reusable `PDFGenerator` service to assemble the PDF.
 * 3. Returns the PDF binary stream as a response with appropriate headers.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { results, type = "business_report" } = body;

    // 1. Validation
    if (!results || !results.ceo || !results.summary) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload. LangGraph pipeline results are required." },
        { status: 400 }
      );
    }

    // 2. Determine filename based on startup name
    const companyName = results.ceo.companyName || "startup";
    const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${safeCompanyName}_report.pdf`;

    // 3. Generate the PDF buffer using the modular generator
    const { pdfBuffer } = await PDFGenerator.generate(results, {
      type: type as ReportType,
      metadata: {
        generatedAt: new Date().toISOString(),
        startupName: companyName
      }
    });

    // 4. Return binary PDF response
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error("[Report Generation API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report PDF." },
      { status: 500 }
    );
  }
}
