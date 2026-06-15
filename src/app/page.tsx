"use client";

import { useState } from "react";
import { CEOOutput, ResearchOutput } from "../types";

export default function Home() {
  // 1. STATE MANAGEMENT
  const [startupIdea, setStartupIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stores the combined response from our API route
  const [results, setResults] = useState<{ ceo: CEOOutput; research: ResearchOutput } | null>(null);
  
  // Selected tab for displaying results: "ceo" | "research" | "pipeline"
  const [activeTab, setActiveTab] = useState<"ceo" | "research" | "pipeline">("ceo");

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
      // Calls the /api/ceo route which runs both CEO and Research agents sequentially
      const response = await fetch("/api/ceo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startupIdea }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to run agent execution pipeline.");
      }

      // Store the unified results containing both agent outputs
      setResults(result.data);
      // Reset active tab to the first tab upon receiving new results
      setActiveTab("ceo");
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
              Phase 2: CEO + Research Agents
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Enter a startup idea. The orchestrator will run the CEO Agent first, then pass its output directly to the Research Agent for market analysis.
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
                placeholder="Example: A smart gardening device that tracks soil moisture and automates watering via an app..."
                value={startupIdea}
                onChange={(e) => setStartupIdea(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block font-medium">Click an example to test:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                {exampleIdeas.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="text-left text-xs bg-slate-700 hover:bg-slate-600 text-slate-350 py-1.5 px-3 rounded border border-slate-600 transition-colors"
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
                {isLoading ? "Running CEO & Research Agents..." : "Start Agent Pipeline"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-950/80 border border-red-800 rounded text-red-200 text-sm">
              <strong className="font-bold">Execution Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results Sections */}
        {results && (
          <div className="space-y-6">
            
            {/* Banner with Generated Name */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Virtual Company Profile</span>
                <h2 className="text-2xl font-black text-white">{results.ceo.companyName}</h2>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900 py-1 px-3 rounded border border-slate-700 max-w-max">
                Industry Category: <span className="text-blue-400 font-semibold">Analyzed</span>
              </div>
            </div>

            {/* Simple Tab Switcher */}
            <div className="flex border-b border-slate-700">
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all ${
                  activeTab === "ceo"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("ceo")}
              >
                CEO Strategy & Plan
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all ${
                  activeTab === "research"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("research")}
              >
                Market Research & Risks
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all ${
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
                
                {/* Vision & Mission */}
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

                {/* Business Goals Table */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-450 mb-3 text-slate-200">Year-1 Core Goals</h3>
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
                            <td className="py-3 pl-4 text-emerald-450 font-mono text-xs text-emerald-400">{g.metric}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Suggested Departments */}
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

                {/* 90 Day Timeline */}
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
                
                {/* Target Audience Profile */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Target Customer Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-450 block font-bold text-slate-400 uppercase">Demographics & Profile:</span>
                      <p className="text-sm text-slate-250 mt-1">{results.research.targetAudience.demographics}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-xs text-slate-450 block font-bold text-slate-400 uppercase">Core Pain Points:</span>
                        <ul className="list-disc list-inside text-xs text-slate-300 mt-1.5 space-y-1">
                          {results.research.targetAudience.painPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs text-slate-450 block font-bold text-slate-400 uppercase">Why They Buy (Motivation):</span>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{results.research.targetAudience.whyTheyBuy}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitive Landscape */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Key Market Competitors</h3>
                  <div className="space-y-4">
                    {results.research.competitors.map((comp, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-4 rounded border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-white">{comp.name}</h4>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded">Competitor {idx + 1}</span>
                        </div>
                        <p className="text-xs text-slate-400">{comp.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider block text-emerald-400">Strengths:</span>
                            <ul className="list-disc list-inside text-[11px] text-slate-300 mt-1">
                              {comp.strengths.map((str, sIdx) => (
                                <li key={sIdx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[10px] text-red-405 font-bold uppercase tracking-wider block text-red-400">Weaknesses:</span>
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

                {/* Market Opportunities & Industry Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Opportunities */}
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

                  {/* Trends */}
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Relevance of Industry Trends</h3>
                    <div className="space-y-3">
                      {results.research.industryTrends.map((tr, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/40 rounded border border-slate-850">
                          <h4 className="font-semibold text-xs text-white">{tr.trend}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{tr.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Risks & Mitigations */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Risks & Mitigation Strategies</h3>
                  <div className="space-y-3">
                    {results.research.risks.map((r, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/60 rounded border border-slate-800">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-xs text-white">{r.risk}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            r.severity === "High" 
                              ? "bg-red-950 text-red-300 border border-red-900" 
                              : "bg-amber-950 text-amber-300 border border-amber-900"
                          }`}>
                            Severity: {r.severity}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-850 text-xs">
                          <span className="font-semibold text-blue-300 block text-[10px] uppercase">Mitigation Strategy:</span>
                          <p className="text-slate-300 mt-1">{r.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </section>
            )}

            {/* TAB 3: PIPELINE INSIGHTS */}
            {activeTab === "pipeline" && (
              <section className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-white">How CEO & Research Agents Communicate</h3>
                
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    This dashboard simulates a multi-agent company pipeline. The flow operates via **Data Chaining (Dependency Injection)** without the overhead of heavy orchestration frameworks:
                  </p>

                  <div className="p-4 bg-slate-900 rounded border border-slate-750 font-mono text-xs space-y-2 text-blue-300">
                    <div>1. UI triggers POST to /api/ceo with startupIdea: "{startupIdea}"</div>
                    <div>2. API route runs: <span className="text-white">CEOAgent.generateCompanyPlan(startupIdea)</span></div>
                    <div>   └─ CEO returns: name, vision, mission, goals, departments</div>
                    <div>3. API route passes CEO's output to: <span className="text-white">ResearchAgent.generateResearch(startupIdea, ceoOutput)</span></div>
                    <div>   └─ Research Agent receives CEO choices as serialized context to target its prompts</div>
                    <div>4. API consolidates both outputs and returns a unified JSON payload to the UI.</div>
                  </div>

                  <h4 className="font-bold text-white pt-2 text-sm uppercase">Advantages of this Architecture:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400">
                    <li><strong className="text-slate-350">Decoupled Code:</strong> Each agent is represented by a single TS class, making it easy to test, debug, and maintain.</li>
                    <li><strong className="text-slate-350">Strict Output Schemas:</strong> We define manual JSON schemas to ensure the AI's response is 100% parsable and type-safe.</li>
                    <li><strong className="text-slate-350">Future Scalability:</strong> To add Product Manager, Finance, or Investor agents, we can simply chain them in the same API route by passing the previous outputs as input arguments.</li>
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
