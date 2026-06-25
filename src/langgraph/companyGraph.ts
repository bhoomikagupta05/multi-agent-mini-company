import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { CEOAgent } from "../agents/ceoAgent";
import { ResearchAgent } from "../agents/researchAgent";
import { ProductAgent } from "../agents/productAgent";
import { FinanceAgent } from "../agents/financeAgent";
import { InvestorAgent } from "../agents/investorAgent";
import { SummaryAgent } from "../agents/summaryAgent";
import { 
  CEOOutput, 
  ResearchOutput, 
  ProductOutput, 
  FinanceOutput, 
  InvestorOutput, 
  SummaryOutput,
  GraphExecutionMetadata,
  NodeMetadata
} from "../types";

/**
 * ============================================================================
 * 1. SHARED STATE DEFINITION (Annotation.Root)
 * ============================================================================
 * 
 * Shared database state containing outputs from CEO, Research, PM, CFO, Investor,
 * and the newly introduced Summary Agent.
 */
export const CompanyStateAnnotation = Annotation.Root({
  startupIdea: Annotation<string>,
  ceoOutput: Annotation<CEOOutput>,
  researchOutput: Annotation<ResearchOutput>,
  productOutput: Annotation<ProductOutput>,
  financeOutput: Annotation<FinanceOutput>,
  investorOutput: Annotation<InvestorOutput>,
  summaryOutput: Annotation<SummaryOutput>,
  metadata: Annotation<GraphExecutionMetadata>
});

// Helper utility to generate helper metadata state updates
function updateMetadata(
  currentMetadata: GraphExecutionMetadata | undefined, 
  nodeName: string, 
  startTime: number, 
  endTime: number, 
  status: NodeMetadata["status"]
): GraphExecutionMetadata {
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const trace = [...(currentMetadata?.trace || []), nodeName];
  const nodes = {
    ...(currentMetadata?.nodes || {}),
    [nodeName]: {
      startTime,
      endTime,
      duration: `${duration}s`,
      status
    }
  };
  return { trace, nodes };
}

/**
 * ============================================================================
 * 2. GRAPH NODES (Execution Units)
 * ============================================================================
 */

// CEO Node
const runCEONode = async (state: typeof CompanyStateAnnotation.State) => {
  console.log("[CEO Started]");
  const startTime = Date.now();
  
  const ceoAgent = new CEOAgent();
  const ceoOutput = await ceoAgent.generateCompanyPlan(state.startupIdea);
  
  const endTime = Date.now();
  const metadata = updateMetadata(state.metadata, "ceo", startTime, endTime, "completed");
  console.log(`[CEO Completed] (${metadata.nodes.ceo.duration})`);

  return { ceoOutput, metadata };
};

// Research Node
const runResearchNode = async (state: typeof CompanyStateAnnotation.State) => {
  console.log("\n[Research Started]");
  const startTime = Date.now();

  const researchAgent = new ResearchAgent();
  const researchOutput = await researchAgent.generateResearch(state.startupIdea, state.ceoOutput);
  
  const endTime = Date.now();
  const metadata = updateMetadata(state.metadata, "research", startTime, endTime, "completed");
  console.log(`[Research Completed] (${metadata.nodes.research.duration})`);

  return { researchOutput, metadata };
};

// Product Node
const runProductNode = async (state: typeof CompanyStateAnnotation.State) => {
  console.log("\n[Product Started]");
  const startTime = Date.now();

  const productAgent = new ProductAgent();
  const productOutput = await productAgent.generateProductPlan(
    state.startupIdea, 
    state.ceoOutput, 
    state.researchOutput
  );
  
  const endTime = Date.now();
  const metadata = updateMetadata(state.metadata, "product", startTime, endTime, "completed");
  console.log(`[Product Completed] (${metadata.nodes.product.duration})`);

  return { productOutput, metadata };
};

// Finance Node
const runFinanceNode = async (state: typeof CompanyStateAnnotation.State) => {
  console.log("\n[Finance Started]");
  const startTime = Date.now();

  const financeAgent = new FinanceAgent();
  const financeOutput = await financeAgent.generateFinancePlan(
    state.startupIdea, 
    state.ceoOutput, 
    state.researchOutput, 
    state.productOutput
  );
  
  const endTime = Date.now();
  const metadata = updateMetadata(state.metadata, "finance", startTime, endTime, "completed");
  console.log(`[Finance Completed] (${metadata.nodes.finance.duration})`);

  return { financeOutput, metadata };
};

// Investor Node
const runInvestorNode = async (state: typeof CompanyStateAnnotation.State) => {
  console.log("\n[Investor Started]");
  const startTime = Date.now();

  const investorAgent = new InvestorAgent();
  const investorOutput = await investorAgent.generateInvestmentEvaluation(
    state.startupIdea, 
    state.ceoOutput, 
    state.researchOutput, 
    state.productOutput, 
    state.financeOutput
  );
  
  const endTime = Date.now();
  const metadata = updateMetadata(state.metadata, "investor", startTime, endTime, "completed");
  console.log(`[Investor Completed] (${metadata.nodes.investor.duration})`);

  return { investorOutput, metadata };
};

// Summary Node (Incubator Synthesis)
const runSummaryNode = async (state: typeof CompanyStateAnnotation.State) => {
  console.log("\n[Summary Started]");
  const startTime = Date.now();

  const summaryAgent = new SummaryAgent();
  // Context Ingestion: Passes ALL previous outputs to the summary agent
  const summaryOutput = await summaryAgent.generateExecutiveSummary(
    state.startupIdea,
    state.ceoOutput,
    state.researchOutput,
    state.productOutput,
    state.financeOutput,
    state.investorOutput
  );

  const endTime = Date.now();
  const metadata = updateMetadata(state.metadata, "summary", startTime, endTime, "completed");
  console.log(`[Summary Completed] (${metadata.nodes.summary.duration})`);

  return { summaryOutput, metadata };
};

/**
 * ============================================================================
 * 3. STATE GRAPH CONSTITUTION
 * ============================================================================
 * 
 * Edges trace: START -> ceo -> research -> product -> finance -> investor -> summary -> END.
 */
const workflow = new StateGraph(CompanyStateAnnotation)
  // Register Nodes
  .addNode("ceo", runCEONode)
  .addNode("research", runResearchNode)
  .addNode("product", runProductNode)
  .addNode("finance", runFinanceNode)
  .addNode("investor", runInvestorNode)
  .addNode("summary", runSummaryNode)
  
  // Wire Edges
  .addEdge(START, "ceo")
  .addEdge("ceo", "research")
  .addEdge("research", "product")
  .addEdge("product", "finance")
  .addEdge("finance", "investor")
  .addEdge("investor", "summary")
  .addEdge("summary", END);

// Compile workflow
export const companyGraph = workflow.compile();
export default companyGraph;
