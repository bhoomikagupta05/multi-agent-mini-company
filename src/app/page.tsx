"use client";

import { useState } from "react";
import { CEOOutput, ResearchOutput, ProductOutput, FinanceOutput, InvestorOutput } from "../types";

export default function Home() {
  // 1. STATE MANAGEMENT
  const [startupIdea, setStartupIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Unified results structure containing all five agent outputs
  const [results, setResults] = useState<{
    ceo: CEOOutput;
    research: ResearchOutput;
    product: ProductOutput;
    finance: FinanceOutput;
    investor: InvestorOutput;
  } | null>(null);
  
  // Selected tab: "ceo" | "research" | "product" | "finance" | "investor" | "pipeline"
  const [activeTab, setActiveTab] = useState<"ceo" | "research" | "product" | "finance" | "investor" | "pipeline">("ceo");

  const exampleIdeas = [
    "I want to build a food delivery startup focusing on healthy salads.",
    "An AI-powered automated code review tool for git repositories.",
    "A peer-to-peer equipment rental marketplace for filmmakers."
  ];

  // 2. SUBMIT HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupIdea.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Calls the API endpoint executing CEO -> Research -> Product -> Finance -> Investor sequentially
      const response = await fetch("/api/ceo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startupIdea }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to execute agent orchestration pipeline.");
      }

      setResults(result.data);
      setActiveTab("ceo"); // Reset tab to CEO Strategy
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Mini AI Company
            </h1>
            <span className="bg-blue-900/80 text-blue-300 text-xs px-2.5 py-1 rounded font-bold border border-blue-800">
              Phase 6: CEO + Research + PM + CFO + VC Agents
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Submit a startup idea. The Orchestrator chains CEO, Research, PM, CFO, and Investor agents sequentially to review and score the viability of your business.
          </p>
        </header>

        {/* Input Box Section */}
        <section className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="startup-idea" className="block text-sm font-semibold text-slate-200 mb-2">
                Describe your Startup Idea
              </label>
              <textarea
                id="startup-idea"
                rows={4}
                className="w-full rounded bg-slate-950 border border-slate-700 text-slate-200 p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder-slate-500"
                placeholder="Example: A specialized online tutoring marketplace connecting verified medical students with premeds..."
                value={startupIdea}
                onChange={(e) => setStartupIdea(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Examples */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block font-medium">Click an example to test:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                {exampleIdeas.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="text-left text-xs bg-slate-700 hover:bg-slate-650 text-slate-350 py-1.5 px-3 rounded border border-slate-600 transition-colors"
                    onClick={() => setStartupIdea(idea)}
                    disabled={isLoading}
                  >
                    {idea.length > 55 ? `${idea.substring(0, 55)}...` : idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !startupIdea.trim()}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Running 5 AI Agents..." : "Start Agent Pipeline"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-950/80 border border-red-800 rounded text-red-200 text-sm">
              <strong className="font-bold">Pipeline Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results Sections */}
        {results && (
          <div className="space-y-6">
            
            {/* Banner */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Virtual Company Profile</span>
                <h2 className="text-2xl font-black text-white">{results.ceo.companyName}</h2>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900 py-1 px-3 rounded border border-slate-700 max-w-max">
                Due Diligence Status: <span className="text-blue-400 font-semibold">Critiqued</span>
              </div>
            </div>

            {/* Simple Tab Switcher */}
            <div className="flex border-b border-slate-700 overflow-x-auto scrollbar-none">
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "ceo"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("ceo")}
              >
                CEO Strategy & Plan
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "research"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("research")}
              >
                Market Research & Risks
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "product"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("product")}
              >
                Product Strategy & MVP
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "finance"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("finance")}
              >
                Financial Strategy
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "investor"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("investor")}
              >
                Investor Critique
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "pipeline"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("pipeline")}
              >
                How It Works (Data Flow)
              </button>
            </div>

            {/* TAB CONTENTS */}

            {/* TAB 1: CEO STRATEGY */}
            {activeTab === "ceo" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Company Vision</h3>
                    <p className="text-sm text-slate-200 italic leading-relaxed">"{results.ceo.vision}"</p>
                  </div>
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Company Mission</h3>
                    <p className="text-sm text-slate-200 italic leading-relaxed">"{results.ceo.mission}"</p>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Year-1 Core Goals</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-350 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs">
                          <th className="py-2 pr-4 font-semibold uppercase">Goal</th>
                          <th className="py-2 px-4 font-semibold uppercase">Target Timeframe</th>
                          <th className="py-2 pl-4 font-semibold uppercase">Success Metric</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.ceo.businessGoals.map((g, idx) => (
                          <tr key={idx} className="border-b border-slate-800 last:border-b-0">
                            <td className="py-3 pr-4 font-medium text-white">{g.goal}</td>
                            <td className="py-3 px-4">{g.timeframe}</td>
                            <td className="py-3 pl-4 text-emerald-450 font-mono text-xs text-emerald-450 text-emerald-400">{g.metric}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Recommended Departments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.ceo.suggestedDepartments.map((dept, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-4 rounded border border-slate-850">
                        <h4 className="font-semibold text-white text-sm mb-1">{dept.name}</h4>
                        <p className="text-xs text-slate-400 mb-2">{dept.purpose}</p>
                        <div className="border-t border-slate-800 pt-2">
                          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">90-Day Focus:</span>
                          <span className="text-xs text-slate-300">{dept.focus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-4">First 90-Day Execution Plan</h3>
                  <div className="space-y-6">
                    <div className="relative pl-6 border-l border-blue-600">
                      <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      <h4 className="font-bold text-white text-sm">{results.ceo.first90DayPlan.days30.title}</h4>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-300">
                        {results.ceo.first90DayPlan.days30.milestones.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative pl-6 border-l border-indigo-600">
                      <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                      <h4 className="font-bold text-white text-sm">{results.ceo.first90DayPlan.days60.title}</h4>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-300">
                        {results.ceo.first90DayPlan.days60.milestones.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative pl-6 border-l border-purple-600">
                      <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 bg-purple-600 rounded-full" />
                      <h4 className="font-bold text-white text-sm">{results.ceo.first90DayPlan.days90.title}</h4>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-300">
                        {results.ceo.first90DayPlan.days90.milestones.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB 2: RESEARCH ANALYSIS */}
            {activeTab === "research" && (
              <section className="space-y-6">
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Target Customer Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold uppercase">Demographics & Profile:</span>
                      <p className="text-sm text-slate-200 mt-1">{results.research.targetAudience.demographics}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-xs text-slate-400 block font-bold uppercase">Core Pain Points:</span>
                        <ul className="list-disc list-inside text-xs text-slate-300 mt-1.5 space-y-1">
                          {results.research.targetAudience.painPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-bold uppercase">Why They Buy:</span>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{results.research.targetAudience.whyTheyBuy}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Key Market Competitors</h3>
                  <div className="space-y-4">
                    {results.research.competitors.map((comp, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-4 rounded border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-white">{comp.name}</h4>
                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">Competitor {idx + 1}</span>
                        </div>
                        <p className="text-xs text-slate-400">{comp.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Strengths:</span>
                            <ul className="list-disc list-inside text-[11px] text-slate-300 mt-1">
                              {comp.strengths.map((str, sIdx) => (
                                <li key={sIdx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Weaknesses:</span>
                            <ul className="list-disc list-inside text-[11px] text-slate-300 mt-1">
                              {comp.weaknesses.map((weak, wIdx) => (
                                <li key={wIdx}>{weak}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Underserved Market Gaps</h3>
                    <div className="space-y-3">
                      {results.research.marketOpportunities.map((opp, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/40 rounded border border-slate-850">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-xs text-white">Gap {idx + 1}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              opp.potentialImpact === "High" 
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-900" 
                                : "bg-blue-950 text-blue-300 border border-blue-900"
                            }`}>
                              Impact: {opp.potentialImpact}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1.5">{opp.opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Industry Trends</h3>
                    <div className="space-y-3">
                      {results.research.industryTrends.map((tr, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/40 rounded border border-slate-855 border-slate-800">
                          <h4 className="font-semibold text-xs text-white">{tr.trend}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{tr.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Risks & Mitigation</h3>
                  <div className="space-y-3">
                    {results.research.risks.map((r, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/60 rounded border border-slate-800">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-xs text-white">{r.risk}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            r.severity === "High" 
                              ? "bg-red-950 text-red-300 border border-red-900" 
                              : "bg-amber-950 text-amber-305 text-amber-400 border border-amber-900"
                          }`}>
                            Severity: {r.severity}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-850 text-xs">
                          <span className="font-semibold text-blue-300 block text-[10px] uppercase">Mitigation:</span>
                          <p className="text-slate-300 mt-1">{r.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TAB 3: PRODUCT STRATEGY & MVP */}
            {activeTab === "product" && (
              <section className="space-y-6">
                <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 p-5 rounded-lg border border-blue-800/60 shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Unique Selling Proposition (USP)</span>
                  <h3 className="text-base font-extrabold text-white mt-1 leading-relaxed">
                    {results.product.usp}
                  </h3>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-4">Core User Personas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.product.userPersonas.map((persona, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-4 rounded border border-slate-800 space-y-3">
                        <div>
                          <h4 className="font-bold text-white text-sm">{persona.name}</h4>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{persona.role}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider block">Product Goals:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 mt-1">
                              {persona.goals.map((g, gIdx) => (
                                <li key={gIdx}>{g}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">Key Pain Points:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 mt-1">
                              {persona.painPoints.map((p, pIdx) => (
                                <li key={pIdx}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Core MVP Feature Set</h3>
                  <div className="space-y-4">
                    {results.product.mvpFeatures.map((feat, idx) => (
                      <div key={idx} className="bg-slate-900/40 p-4 rounded border border-slate-850">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-sm text-white">{feat.name}</h4>
                          <span className="text-[9px] bg-slate-950 text-slate-400 py-0.5 px-2 rounded uppercase tracking-wider font-bold">Feature {idx + 1}</span>
                        </div>
                        <p className="text-xs text-slate-305 text-slate-300 leading-relaxed">{feat.description}</p>
                        <div className="border-t border-slate-800 mt-2.5 pt-2 text-xs">
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Expected Value:</span>
                          <span className="text-slate-300">{feat.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Feature Release Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.product.featurePriorities.map((prio, idx) => {
                      const isMust = prio.tier.toLowerCase().includes("must");
                      const isShould = prio.tier.toLowerCase().includes("should");
                      const colorClass = isMust 
                        ? "text-red-400 bg-red-950/40 border-red-900" 
                        : isShould 
                          ? "text-indigo-400 bg-indigo-950/40 border-indigo-900"
                          : "text-slate-400 bg-slate-900 border-slate-800";
                          
                      return (
                        <div key={idx} className="bg-slate-900/60 rounded border border-slate-800 flex flex-col">
                          <div className={`p-2.5 border-b font-bold text-xs text-center rounded-t uppercase ${colorClass}`}>
                            {prio.tier}
                          </div>
                          <ul className="p-3 space-y-1.5 flex-1 list-disc list-inside text-xs text-slate-300">
                            {prio.features.map((f, fIdx) => (
                              <li key={fIdx}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-4">Product Roadmap Phases</h3>
                  <div className="space-y-6">
                    <div className="relative pl-6 border-l border-blue-600">
                      <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-white text-sm">{results.product.productRoadmap.phase1.phaseName}</h4>
                        <span className="text-[10px] text-blue-300 bg-blue-950 border border-blue-900 rounded py-0.2 px-2 uppercase font-semibold max-w-max">{results.product.productRoadmap.phase1.timeline}</span>
                      </div>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-300">
                        {results.product.productRoadmap.phase1.keyDeliverables.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative pl-6 border-l border-indigo-600">
                      <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-white text-sm">{results.product.productRoadmap.phase2.phaseName}</h4>
                        <span className="text-[10px] text-indigo-300 bg-indigo-950 border border-indigo-900 rounded py-0.2 px-2 uppercase font-semibold max-w-max">{results.product.productRoadmap.phase2.timeline}</span>
                      </div>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-300">
                        {results.product.productRoadmap.phase2.keyDeliverables.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative pl-6 border-l border-purple-600">
                      <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 bg-purple-600 rounded-full" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-white text-sm">{results.product.productRoadmap.phase3.phaseName}</h4>
                        <span className="text-[10px] text-purple-300 bg-purple-950 border border-purple-900 rounded py-0.2 px-2 uppercase font-semibold max-w-max">{results.product.productRoadmap.phase3.timeline}</span>
                      </div>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-300">
                        {results.product.productRoadmap.phase3.keyDeliverables.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB 4: FINANCIAL STRATEGY */}
            {activeTab === "finance" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-emerald-900/80 to-teal-900/80 p-5 rounded-lg border border-emerald-850 shadow-md flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Total 12-Month Funding Target</span>
                    <h3 className="text-3xl font-black text-white mt-1">{results.finance.fundingRequirement}</h3>
                  </div>
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-center">
                    <h4 className="text-sm font-bold uppercase text-slate-400 mb-1">Break-even Analysis</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{results.finance.breakevenAnalysis}</p>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
                  <h3 className="text-sm font-bold uppercase text-slate-200">CFO Strategic Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold uppercase">Pricing Strategy Justification:</span>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{results.finance.analysisSummary.pricingChoiceReason}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold uppercase">Funding Selection Justification:</span>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{results.finance.analysisSummary.fundingChoiceReason}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-750 pt-3">
                    <span className="text-xs text-slate-400 block font-bold uppercase">Main Financial Assumptions:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 mt-2 space-y-1">
                      {results.finance.analysisSummary.mainAssumptions.map((ass, idx) => (
                        <li key={idx}>{ass}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Startup Setup Costs (One-Time)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-700 text-slate-400">
                            <th className="py-2 pr-2 font-semibold uppercase">Cost Item</th>
                            <th className="py-2 px-2 font-semibold uppercase">Description</th>
                            <th className="py-2 pl-2 font-semibold uppercase text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.finance.startupCostEstimate.map((cost, idx) => (
                            <tr key={idx} className="border-b border-slate-800 last:border-b-0">
                              <td className="py-2.5 pr-2 font-medium text-white">{cost.item}</td>
                              <td className="py-2.5 px-2 text-slate-405">{cost.description}</td>
                              <td className="py-2.5 pl-2 text-right font-mono text-emerald-400">{cost.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Monthly Operating Expenses (OPEX)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-700 text-slate-400">
                            <th className="py-2 pr-2 font-semibold uppercase">Expense Item</th>
                            <th className="py-2 px-2 font-semibold uppercase">Frequency</th>
                            <th className="py-2 pl-2 font-semibold uppercase text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.finance.monthlyOperatingExpenses.map((exp, idx) => (
                            <tr key={idx} className="border-b border-slate-800 last:border-b-0">
                              <td className="py-2.5 pr-2 font-medium text-white">{exp.item}</td>
                              <td className="py-2.5 px-2 text-slate-405">{exp.frequency}</td>
                              <td className="py-2.5 pl-2 text-right font-mono text-rose-400">{exp.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Revenue & Monetization Models</h3>
                  <div className="mb-4 text-xs text-slate-300 bg-slate-900/60 p-3 rounded border border-slate-850 leading-relaxed">
                    <span className="font-bold text-blue-300 block mb-1">Pricing Model Summary:</span>
                    {results.finance.pricingStrategy}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.finance.revenueStreams.map((stream, idx) => (
                      <div key={idx} className="bg-slate-900/40 p-4 rounded border border-slate-850">
                        <div className="flex justify-between items-center mb-1.5">
                          <h4 className="font-bold text-sm text-white">{stream.name}</h4>
                          <span className="text-[10px] text-emerald-450 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60 font-mono">{stream.projectedRevenue} (Y1)</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{stream.description}</p>
                        <div className="border-t border-slate-800 pt-2 text-[11px]">
                          <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[9px]">Charging Model:</span>
                          <span className="text-slate-300">{stream.pricingModel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Financial Risks & Mitigation</h3>
                  <div className="space-y-3">
                    {results.finance.financialRisks.map((r, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/60 rounded border border-slate-800">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-xs text-white">{r.risk}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            r.severity === "High" ? "bg-red-950 text-red-300 border border-red-900" : "bg-amber-950 text-amber-300 border border-amber-900"
                          }`}>
                            Severity: {r.severity}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-855 border-slate-800 text-xs">
                          <span className="font-semibold text-blue-300 block text-[10px] uppercase">Mitigation strategy:</span>
                          <p className="text-slate-300 mt-1">{r.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TAB 5: INVESTOR CRITIQUE */}
            {activeTab === "investor" && (
              <section className="space-y-6">
                
                {/* Score Indicators & Verdict */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Verdict Banner */}
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 rounded-lg border border-purple-800 shadow-md flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Investment Decision</span>
                    <h3 className="text-xl font-black text-white mt-1">{results.investor.recommendation}</h3>
                    <span className="text-xs text-purple-300 mt-1 block">
                      Confidence: <span className="font-bold text-white">{results.investor.confidenceScore}%</span>
                    </span>
                  </div>

                  {/* Investment Score Card */}
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investment Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white">{results.investor.investmentScore}</span>
                      <span className="text-sm text-slate-550 text-slate-500">/ 10</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full" 
                        style={{ width: `${results.investor.investmentScore * 10}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Score Card */}
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white">{results.investor.riskScore}</span>
                      <span className="text-sm text-slate-550 text-slate-500">/ 10</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-1.5 rounded-full" 
                        style={{ width: `${results.investor.riskScore * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top reasons to Invest / Pass */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reasons to Invest */}
                  <div className="bg-slate-800/80 p-5 rounded-lg border border-emerald-900/40">
                    <h3 className="text-sm font-bold uppercase text-emerald-400 mb-3">Top 3 Reasons to Invest</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {results.investor.reasonsToInvest.map((reason, idx) => (
                        <li key={idx} className="flex gap-2.5">
                          <span className="text-emerald-450 text-emerald-400 font-bold font-mono">{idx + 1}.</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reasons to Pass */}
                  <div className="bg-slate-800/80 p-5 rounded-lg border border-rose-900/40">
                    <h3 className="text-sm font-bold uppercase text-rose-450 text-rose-455 text-rose-400 mb-3">Top 3 Reasons to pass / hold</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {results.investor.reasonsNotToInvest.map((reason, idx) => (
                        <li key={idx} className="flex gap-2.5">
                          <span className="text-rose-450 text-rose-400 font-bold font-mono">{idx + 1}.</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* SWOT: Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-2">Strengths (Due Diligence)</h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                      {results.investor.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-2">Weaknesses / Vulnerabilities</h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                      {results.investor.weaknesses.map((weak, idx) => (
                        <li key={idx}>{weak}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Exit Potential & VC Funding Recommendation */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
                  <h3 className="text-sm font-bold uppercase text-slate-200">Exit Potential & Investment Recommendation</h3>
                  
                  <div>
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">VC Funding Structure & Recommendation:</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{results.investor.fundingRecommendation}</p>
                  </div>

                  <div className="border-t border-slate-750 pt-3">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">Exit Strategy & Potential (M&A/IPO):</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{results.investor.exitPotential}</p>
                  </div>
                </div>

                {/* Questions for Founder */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Due Diligence Questions for Founder</h3>
                  <div className="space-y-2.5">
                    {results.investor.questionsForFounder.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/50 rounded border border-slate-750 border-slate-800 flex gap-3 items-start">
                        <span className="text-xs text-blue-400 font-black font-mono mt-0.5">Q{idx + 1}</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </section>
            )}

            {/* TAB 6: PIPELINE INSIGHTS */}
            {activeTab === "pipeline" && (
              <section className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-white">How CEO, Research, PM, CFO, and VC Agents Communicate</h3>
                
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    This dashboard demonstrates a multi-agent waterfall context cascade. Each agent is a separate class executing sequentially:
                  </p>

                  <div className="p-4 bg-slate-900 rounded border border-slate-750 font-mono text-xs space-y-2 text-blue-300">
                    <div>1. UI triggers POST to /api/ceo with startupIdea: "{startupIdea}"</div>
                    
                    <div>2. Orchestrator runs: <span className="text-white">CEOAgent.generateCompanyPlan(startupIdea)</span></div>
                    <div>   └─ CEO sets Company Name, Vision, Mission, Year 1 Goals, and Departments.</div>
                    
                    <div className="text-slate-500 my-1 font-sans italic text-[11px]">
                      // CEO output flows into Research Agent:
                    </div>
                    <div>3. Orchestrator runs: <span className="text-white">ResearchAgent.generateResearch(startupIdea, ceoOutput)</span></div>
                    <div>   └─ Researcher maps target audience demographics, pain points, competitor weaknesses.</div>
                    
                    <div className="text-slate-505 text-slate-500 my-1 font-sans italic text-[11px]">
                      // CEO and Research outputs flow into PM Agent:
                    </div>
                    <div>4. Orchestrator runs: <span className="text-white">ProductAgent.generateProductPlan(startupIdea, ceoOutput, researchOutput)</span></div>
                    <div>   └─ PM Agent creates user personas, MVP features, priority matrix, and release roadmaps.</div>
                    
                    <div className="text-slate-505 text-slate-500 my-1 font-sans italic text-[11px]">
                      // CEO, Research, and Product outputs flow into CFO Agent:
                    </div>
                    <div>5. Orchestrator runs: <span className="text-white">FinanceAgent.generateFinancePlan(startupIdea, ceoOutput, researchOutput, productOutput)</span></div>
                    <div>   └─ CFO structures startup setups, monthly OPEX, pricing models, revenue forecast, and risk mitigation.</div>

                    <div className="text-slate-550 text-slate-500 my-1 font-sans italic text-[11px]">
                      // Step 5: CEO, Research, Product, and Finance outputs flow into VC Agent:
                    </div>
                    <div>6. Orchestrator runs: <span className="text-white">InvestorAgent.generateInvestmentEvaluation(startupIdea, ceoOutput, researchOutput, productOutput, financeOutput)</span></div>
                    <div>   └─ VC Agent assigns scores (0-10), rates pitch, generates exit strategy and diligence questions.</div>
                    
                    <div>7. Pipeline success. Orchestrator returns combined JSON payload.</div>
                  </div>

                  <h4 className="font-bold text-white pt-2 text-sm uppercase">Advantages of this Architecture:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-450">
                    <li><strong className="text-slate-300">Decoupled & Modular:</strong> Because the outputs are returned in a clean nested structure, external reporting or PDF generation utilities can consume the results of this pipeline downstream without making expensive LLM calls.</li>
                  </ul>
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
