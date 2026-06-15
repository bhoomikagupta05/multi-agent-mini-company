import { CEOAgent } from "../agents/ceoAgent";
import { ResearchAgent } from "../agents/researchAgent";
import { ProductAgent } from "../agents/productAgent";
import { Phase3Output } from "../types";

/**
 * CompanyOrchestrator Class
 * 
 * ORCHESTRATION PATTERN DESIGN:
 * This class implements the Central Orchestrator design pattern. Instead of agents triggering
 * each other directly (choreography) or the API route handling the flow, the Orchestrator acts
 * as a single coordinator. It manages the lifecycle, execution order, and context-passing 
 * between agents.
 * 
 * why this pattern is chosen:
 * 1. Single Responsibility: The API route is kept "thin", focusing only on HTTP request parsing
 *    and HTTP response status codes. The orchestrator owns the business process.
 * 2. Loose Coupling: Individual agents (CEOAgent, ResearchAgent, ProductAgent) remain isolated.
 *    They do not know about each other's existence; they only consume inputs and return outputs.
 * 3. Environment Independence: Because the orchestration is decoupled from Next.js HTTP routes,
 *    we can run the same pipeline in CLI tools, Cron/Background tasks, or WebSocket handlers.
 * 
 * FUTURE MULTI-AGENT EXPANSION:
 * To add future agents (e.g., Product Manager, Finance, Investor):
 * 1. Import the new agent class.
 * 2. Add a new stage in the `run` method.
 * 3. Pass the previous results down as parameters.
 * 4. Update the return type interface (e.g., Phase4Output) to include the new output key.
 * No modifications are needed in the UI routing or API controller structures, keeping updates isolated.
 */
export class CompanyOrchestrator {
  /**
   * Executes the sequential agent execution pipeline.
   * 
   * @param startupIdea - The raw business description from the user.
   * @returns A consolidated object containing outputs from all agents.
   */
  async run(startupIdea: string): Promise<Phase3Output> {
    const pipelineStart = performance.now();

    console.log(`\n=================== START PIPELINE ===================`);
    console.log(`[Orchestrator] Input Idea: "${startupIdea}"`);

    // --- STAGE 1: CEO AGENT ---
    console.log("[CEO Started]");
    const ceoStart = performance.now();
    
    const ceoAgent = new CEOAgent();
    const ceoOutput = await ceoAgent.generateCompanyPlan(startupIdea);
    
    const ceoEnd = performance.now();
    const ceoDuration = ((ceoEnd - ceoStart) / 1000).toFixed(2);
    console.log(`[CEO Completed] (${ceoDuration}s)`);

    // --- STAGE 2: RESEARCH AGENT ---
    // CEO Output flows directly as context into the Research Agent
    console.log("\n[Research Started]");
    const researchStart = performance.now();
    
    const researchAgent = new ResearchAgent();
    const researchOutput = await researchAgent.generateResearch(startupIdea, ceoOutput);
    
    const researchEnd = performance.now();
    const researchDuration = ((researchEnd - researchStart) / 1000).toFixed(2);
    console.log(`[Research Completed] (${researchDuration}s)`);

    // --- STAGE 3: PRODUCT AGENT ---
    // Both CEO Output and Research Output flow directly as context into the Product Agent
    console.log("\n[Product Started]");
    const productStart = performance.now();
    
    const productAgent = new ProductAgent();
    const productOutput = await productAgent.generateProductPlan(startupIdea, ceoOutput, researchOutput);
    
    const productEnd = performance.now();
    const productDuration = ((productEnd - productStart) / 1000).toFixed(2);
    console.log(`[Product Completed] (${productDuration}s)`);

    // --- PIPELINE COMPLETE SUMMARY ---
    const pipelineEnd = performance.now();
    const totalDuration = ((pipelineEnd - pipelineStart) / 1000).toFixed(2);
    
    console.log(`\n=================== PIPELINE SUCCESS ===================`);
    console.log(`Total Pipeline Duration: ${totalDuration}s`);
    console.log(`========================================================\n`);

    // Return the aggregated result payload
    return {
      ceo: ceoOutput,
      research: researchOutput,
      product: productOutput
    };
  }
}
export const companyOrchestrator = new CompanyOrchestrator();
export default companyOrchestrator;
