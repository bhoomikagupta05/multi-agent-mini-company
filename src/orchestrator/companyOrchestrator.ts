import { companyGraph } from "../langgraph/companyGraph";
import { Phase8Output } from "../types";

/**
 * CompanyOrchestrator Class
 * 
 * ORCHESTRATION PATTERN (LANGGRAPH MIGRATION - PHASE 8):
 * Triggers the compiled LangGraph workflow containing:
 * CEO → Research → Product → Finance → Investor → Summary Agent
 * 
 * BACKWARD COMPATIBILITY:
 * Returns all existing data nodes (ceo, research, product, finance, investor)
 * along with the new summary and metadata nodes.
 */
export class CompanyOrchestrator {
  /**
   * Executes the LangGraph multi-agent pipeline.
   * 
   * @param startupIdea - The raw business description from the user.
   * @returns A consolidated object containing outputs from all agents and execution metadata.
   */
  async run(startupIdea: string): Promise<Phase8Output> {
    const pipelineStart = performance.now();

    console.log(`\n=================== START PIPELINE (LANGGRAPH) ===================`);
    console.log(`[Orchestrator] Input Idea: "${startupIdea}"`);

    // Invoke state graph. All nodes (including the new Summary Node) execute in sequence.
    // Each node measures its own duration and updates the shared trace metadata.
    const finalState = await companyGraph.invoke({ startupIdea });

    // Calculate total duration
    const pipelineEnd = performance.now();
    const totalDuration = ((pipelineEnd - pipelineStart) / 1000).toFixed(2);
    
    console.log(`\n=================== PIPELINE SUCCESS (LANGGRAPH) ===================`);
    console.log(`Total Pipeline Duration: ${totalDuration}s`);
    console.log(`========================================================\n`);

    // Return the unified result, maintaining 100% backward compatibility
    return {
      ceo: finalState.ceoOutput,
      research: finalState.researchOutput,
      product: finalState.productOutput,
      finance: finalState.financeOutput,
      investor: finalState.investorOutput,
      summary: finalState.summaryOutput,
      metadata: finalState.metadata
    };
  }
}
export const companyOrchestrator = new CompanyOrchestrator();
export default companyOrchestrator;
