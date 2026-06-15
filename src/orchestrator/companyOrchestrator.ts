import { CEOAgent } from "../agents/ceoAgent";
import { ResearchAgent } from "../agents/researchAgent";
import { ProductAgent } from "../agents/productAgent";
import { FinanceAgent } from "../agents/financeAgent";
import { InvestorAgent } from "../agents/investorAgent";
import { Phase6Output } from "../types";

/**
 * CompanyOrchestrator Class
 * 
 * ORCHESTRATION PATTERN DESIGN:
 * Centralised orchestrator controlling agent lifecycles and cascading outputs.
 * 
 * PHASE 6 DATA PIPELINE FLOW:
 * 
 *   [User Startup Idea]
 *           │
 *           ▼
 *     ┌───────────┐
 *     │ CEO Agent │  <-- 1. [CEO Started] / [CEO Completed]
 *     └─────┬─────┘
 *           │
 *           ├─ (ceoOutput)
 *           ▼
 *     ┌──────────────┐
 *     │Research Agent│ <-- 2. [Research Started] / [Research Completed]
 *     └─────┬────────┘
 *           │
 *           ├─ (ceoOutput + researchOutput)
 *           ▼
 *     ┌──────────────┐
 *     │Product Agent │ <-- 3. [Product Started] / [Product Completed]
 *     └─────┬────────┘
 *           │
 *           ├─ (ceoOutput + researchOutput + productOutput)
 *           ▼
 *     ┌──────────────┐
 *     │Finance Agent │ <-- 4. [Finance Started] / [Finance Completed]
 *     └─────┬────────┘
 *           │
 *           ├─ (ceoOutput + researchOutput + productOutput + financeOutput)
 *           ▼
 *     ┌──────────────┐
 *     │Investor Agent│ <-- 5. [Investor Started] / [Investor Completed]
 *     └─────┬────────┘
 *           │
 *           ▼
 *     [Unified JSON Response]  { success: true, data: { ceo, research, product, finance, investor } }
 */
export class CompanyOrchestrator {
  /**
   * Executes the sequential agent execution pipeline.
   * 
   * @param startupIdea - The raw business description from the user.
   * @returns A consolidated object containing outputs from all agents.
   */
  async run(startupIdea: string): Promise<Phase6Output> {
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
    console.log("\n[Research Started]");
    const researchStart = performance.now();
    const researchAgent = new ResearchAgent();
    const researchOutput = await researchAgent.generateResearch(startupIdea, ceoOutput);
    const researchEnd = performance.now();
    const researchDuration = ((researchEnd - researchStart) / 1000).toFixed(2);
    console.log(`[Research Completed] (${researchDuration}s)`);

    // --- STAGE 3: PRODUCT AGENT ---
    console.log("\n[Product Started]");
    const productStart = performance.now();
    const productAgent = new ProductAgent();
    const productOutput = await productAgent.generateProductPlan(startupIdea, ceoOutput, researchOutput);
    const productEnd = performance.now();
    const productDuration = ((productEnd - productStart) / 1000).toFixed(2);
    console.log(`[Product Completed] (${productDuration}s)`);

    // --- STAGE 4: FINANCE AGENT ---
    console.log("\n[Finance Started]");
    const financeStart = performance.now();
    const financeAgent = new FinanceAgent();
    const financeOutput = await financeAgent.generateFinancePlan(startupIdea, ceoOutput, researchOutput, productOutput);
    const financeEnd = performance.now();
    const financeDuration = ((financeEnd - financeStart) / 1000).toFixed(2);
    console.log(`[Finance Completed] (${financeDuration}s)`);

    // --- STAGE 5: INVESTOR AGENT ---
    // Ingests CEO, Research, Product, and Finance outputs as context.
    console.log("\n[Investor Started]");
    const investorStart = performance.now();
    const investorAgent = new InvestorAgent();
    const investorOutput = await investorAgent.generateInvestmentEvaluation(
      startupIdea,
      ceoOutput,
      researchOutput,
      productOutput,
      financeOutput
    );
    const investorEnd = performance.now();
    const investorDuration = ((investorEnd - investorStart) / 1000).toFixed(2);
    console.log(`[Investor Completed] (${investorDuration}s)`);

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
      product: productOutput,
      finance: financeOutput,
      investor: investorOutput
    };
  }
}
export const companyOrchestrator = new CompanyOrchestrator();
export default companyOrchestrator;
