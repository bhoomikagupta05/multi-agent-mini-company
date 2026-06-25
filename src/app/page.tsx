"use client";

import { useState } from "react";
import { CEOOutput, ResearchOutput, ProductOutput, FinanceOutput, InvestorOutput, SummaryOutput } from "../types";

export default function Home() {
  // 1. STATE MANAGEMENT
  const [startupIdea, setStartupIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Unified results structure containing all six agent outputs
  const [results, setResults] = useState<{
    ceo: CEOOutput;
    research: ResearchOutput;
    product: ProductOutput;
    finance: FinanceOutput;
    investor: InvestorOutput;
    summary: SummaryOutput;
  } | null>(null);
  
  // Selected tab: "summary" | "ceo" | "research" | "product" | "finance" | "investor" | "pipeline"
  // Default active tab is 'ceo' initially, but we switch to 'summary' once results are loaded.
  const [activeTab, setActiveTab] = useState<"summary" | "ceo" | "research" | "product" | "finance" | "investor" | "pipeline">("ceo");

  // Report Export States
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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
      const response = await fetch("/api/ceo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startupIdea }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to execute LangGraph pipeline.");
      }

      setResults(result.data);
      // REQUIREMENT: Make Executive Summary the default tab after pipeline completion
      setActiveTab("summary");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. REPORT DOWNLOAD HANDLER
  const handleDownloadReport = async (reportType: string = "business_report") => {
    if (!results) return;
    setIsGeneratingReport(true);
    setReportError(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          results,
          type: reportType,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate report PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const companyName = results.ceo.companyName || "startup";
      const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.setAttribute("download", `${safeCompanyName}_${reportType}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || "An error occurred during report generation.");
    } finally {
      setIsGeneratingReport(false);
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
              Phase 8: LangGraph Sequential Agent Network
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Submit a startup idea. A stateful LangGraph coordinates the workflow across six agents sequentially, outputting a complete launch synthesis.
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
                placeholder="Example: An app for scheduling mobile pet grooming vans locally with user ratings..."
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
                {isLoading ? "Running 6 LangGraph Nodes..." : "Start Graph Pipeline"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-950/80 border border-red-800 rounded text-red-200 text-sm">
              <strong className="font-bold">Graph Execution Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results Sections */}
        {results && (
          <div className="space-y-6">
            
            {/* Banner */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Virtual Company Profile</span>
                <h2 className="text-2xl font-black text-white">{results.ceo.companyName}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs text-slate-400 bg-slate-900 py-1.5 px-3 rounded border border-slate-700 max-w-max">
                  Graph Status: <span className="text-blue-400 font-semibold">Compiled & Executed</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadReport("business_report")}
                    disabled={isGeneratingReport}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isGeneratingReport ? (
                      <>
                        <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download Business Report
                      </>
                    )}
                  </button>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDownloadReport(e.target.value);
                        e.target.value = ""; // Reset
                      }
                    }}
                    disabled={isGeneratingReport}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                    defaultValue=""
                  >
                    <option value="" disabled>Other PDF Exports</option>
                    <option value="investor_report">Investor Critique PDF</option>
                    <option value="executive_summary">Executive Summary PDF</option>
                    <option value="pitch_deck">Pitch Deck PDF</option>
                  </select>
                </div>
              </div>
            </div>

            {reportError && (
              <div className="p-3 bg-red-955/80 border border-red-800 rounded text-red-200 text-sm">
                <strong className="font-bold">Report Export Error:</strong> {reportError}
              </div>
            )}

            {/* Simple Tab Switcher */}
            <div className="flex border-b border-slate-700 overflow-x-auto scrollbar-none">
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                  activeTab === "summary"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("summary")}
              >
                Executive Summary
              </button>
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

            {/* TAB 0: EXECUTIVE SUMMARY (Default) */}
            {activeTab === "summary" && (
              <section className="space-y-6">
                
                {/* Visual Scores & Verdict */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Verdict */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 rounded-lg border border-blue-800 shadow-md flex flex-col justify-center md:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Incubator Verdict</span>
                    <h3 className="text-xl font-black text-white mt-1 leading-tight">{results.summary.finalVerdict}</h3>
                  </div>

                  {/* Startup Score */}
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Startup Score</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-white">{results.summary.startupScore}</span>
                      <span className="text-xs text-slate-500">/ 10</span>
                    </div>
                  </div>

                  {/* Confidence / Readiness Double Score */}
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-center space-y-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Readiness:</span>
                      <span className="text-sm font-bold text-white">{results.summary.startupReadinessScore}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Confidence:</span>
                      <span className="text-sm font-bold text-white">{results.summary.confidenceScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Brief */}
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-2.5">Executive Summary</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">{results.summary.executiveSummary}</p>
                </div>

                {/* Opportunities & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-2">Synthesized Opportunities</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-350 text-slate-300">
                      {results.summary.topOpportunities.map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-2">Primary Threat Risks</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-350 text-slate-300">
                      {results.summary.topRisks.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* SWOT Highlights: Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-slate-800/60 p-5 rounded-lg border border-emerald-950">
                    <h3 className="text-sm font-bold uppercase text-emerald-400 mb-3">Top 3 Strengths</h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {results.summary.topStrengths.map((str, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-emerald-400 font-bold font-mono">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-slate-800/60 p-5 rounded-lg border border-rose-950">
                    <h3 className="text-sm font-bold uppercase text-rose-400 mb-3">Top 3 Weaknesses</h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {results.summary.topWeaknesses.map((weak, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-rose-450 text-rose-400 font-bold font-mono">✗</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Items: 30-Day vs 90-Day */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Next 30 Days */}
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-blue-400 mb-3">Immediate Actions (Next 30 Days)</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {results.summary.immediateActions.map((action, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="bg-blue-950 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">DAY {idx * 10 + 10}</span>
                          <span className="leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next 90 Days */}
                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold uppercase text-indigo-400 mb-3">Medium-Term Actions (Next 90 Days)</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {results.summary.mediumTermActions.map((action, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="bg-indigo-950 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">DAY {idx * 15 + 45}</span>
                          <span className="leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </section>
            )}

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
                            <td className="py-3 pl-4 text-emerald-450 font-mono text-xs text-emerald-400">{g.metric}</td>
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
                              opp.potentialImpact === "High" ? "bg-emerald-950 text-emerald-300 border border-emerald-900" : "bg-blue-950 text-blue-300 border border-blue-900"
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
                            r.severity === "High" ? "bg-red-955 text-red-300 border border-red-900" : "bg-amber-955 text-amber-300 border border-amber-900"
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
                  <h3 className="text-base font-extrabold text-white mt-1 leading-relaxed">{results.product.usp}</h3>
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
                        <p className="text-xs text-slate-300 leading-relaxed">{feat.description}</p>
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
                      const colorClass = isMust ? "text-red-400 bg-red-955/40 border-red-900" : isShould ? "text-indigo-400 bg-indigo-955/40 border-indigo-900" : "text-slate-400 bg-slate-900 border-slate-800";
                      return (
                        <div key={idx} className="bg-slate-900/60 rounded border border-slate-800 flex flex-col">
                          <div className={`p-2.5 border-b font-bold text-xs text-center rounded-t uppercase ${colorClass}`}>{prio.tier}</div>
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
                              <td className="py-2.5 px-2 text-slate-400">{cost.description}</td>
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
                              <td className="py-2.5 px-2 text-slate-400">{exp.frequency}</td>
                              <td className="py-2.5 pl-2 text-right font-mono text-rose-450 text-rose-400">{exp.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-805 p-5 rounded-lg border border-slate-700 bg-slate-800">
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
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60 font-mono">{stream.projectedRevenue} (Y1)</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{stream.description}</p>
                        <div className="border-t border-slate-800 pt-2 text-[11px]">
                          <span className="text-slate-505 font-semibold uppercase tracking-wider block text-[9px]">Charging Model:</span>
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
                            r.severity === "High" ? "bg-red-955 text-red-300 border border-red-900" : "bg-amber-955 text-amber-300 border border-amber-900"
                          }`}>
                            Severity: {r.severity}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-850 text-xs">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 rounded-lg border border-purple-800 shadow-md flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Investment Decision</span>
                    <h3 className="text-xl font-black text-white mt-1">{results.investor.recommendation}</h3>
                    <span className="text-xs text-purple-300 mt-1 block">
                      Confidence: <span className="font-bold text-white">{results.investor.confidenceScore}%</span>
                    </span>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investment Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white">{results.investor.investmentScore}</span>
                      <span className="text-sm text-slate-500">/ 10</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${results.investor.investmentScore * 10}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white">{results.investor.riskScore}</span>
                      <span className="text-sm text-slate-500">/ 10</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${results.investor.riskScore * 10}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/80 p-5 rounded-lg border border-emerald-950">
                    <h3 className="text-sm font-bold uppercase text-emerald-450 text-emerald-400 mb-3">Top 3 Reasons to Invest</h3>
                    <ul className="space-y-2 text-xs text-slate-350 text-slate-300">
                      {results.investor.reasonsToInvest.map((reason, idx) => (
                        <li key={idx} className="flex gap-2.5">
                          <span className="text-emerald-400 font-bold font-mono">{idx + 1}.</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-lg border border-rose-950">
                    <h3 className="text-sm font-bold uppercase text-rose-455 text-rose-400 mb-3">Top 3 Reasons to Pass</h3>
                    <ul className="space-y-2 text-xs text-slate-350 text-slate-300">
                      {results.investor.reasonsNotToInvest.map((reason, idx) => (
                        <li key={idx} className="flex gap-2.5">
                          <span className="text-rose-400 font-bold font-mono">{idx + 1}.</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

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
                    <h3 className="text-sm font-bold uppercase text-slate-200 mb-2">Weaknesses / Gaps</h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                      {results.investor.weaknesses.map((weak, idx) => (
                        <li key={idx}>{weak}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
                  <h3 className="text-sm font-bold uppercase text-slate-200">Exit Potential & VC Terms</h3>
                  <div>
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">VC Funding Recommendation:</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{results.investor.fundingRecommendation}</p>
                  </div>
                  <div className="border-t border-slate-750 pt-3">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">Exit Strategy (Acquisition/IPO):</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{results.investor.exitPotential}</p>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-200 mb-3">Due Diligence Questions for Founder</h3>
                  <div className="space-y-2.5">
                    {results.investor.questionsForFounder.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/50 rounded border border-slate-750 flex gap-3 items-start">
                        <span className="text-xs text-blue-450 text-blue-450 text-blue-400 font-black font-mono mt-0.5">Q{idx + 1}</span>
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
                <h3 className="text-lg font-bold text-white">How CEO, Research, PM, CFO, VC, and Summary Agents Communicate</h3>
                
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    This dashboard operates via a stateful **LangGraph Workflow** containing six nodes executing sequentially:
                  </p>

                  <div className="p-4 bg-slate-900 rounded border border-slate-750 font-mono text-xs space-y-2 text-blue-300">
                    <div>1. UI triggers POST to /api/ceo with startupIdea: "{startupIdea}"</div>
                    
                    <div>2. Graph runs CEO Node: <span className="text-white">ceoNode</span></div>
                    <div>   └─ Sets Company Name, Vision, Mission, Year 1 Goals, and Departments.</div>
                    
                    <div className="text-slate-500 my-1 font-sans italic text-[11px]">
                      // CEO output passes to Research Node:
                    </div>
                    <div>3. Graph runs Research Node: <span className="text-white">researchNode</span></div>
                    <div>   └─ Analyzes target demographics, pain points, competitor weaknesses.</div>
                    
                    <div className="text-slate-505 text-slate-500 my-1 font-sans italic text-[11px]">
                      // CEO and Research outputs cascade to PM Node:
                    </div>
                    <div>4. Graph runs Product Node: <span className="text-white">productNode</span></div>
                    <div>   └─ Scopes user personas, MVP features, priority matrix, and roadmaps.</div>
                    
                    <div className="text-slate-505 text-slate-500 my-1 font-sans italic text-[11px]">
                      // CEO, Research, and Product outputs cascade to Finance Node:
                    </div>
                    <div>5. Graph runs Finance Node: <span className="text-white">financeNode</span></div>
                    <div>   └─ Forecasts startup setup costs, monthly OPEX, pricing, revenue, and risks.</div>

                    <div className="text-slate-505 text-slate-500 my-1 font-sans italic text-[11px]">
                      // Previous outputs cascade to Investor Node:
                    </div>
                    <div>6. Graph runs Investor Node: <span className="text-white">investorNode</span></div>
                    <div>   └─ Assigns scores (0-10), verdict, strengths, weaknesses, exit potential, and terms.</div>

                    <div className="text-slate-550 text-slate-500 my-1 font-sans italic text-[11px]">
                      // All outputs are synthesized by Summary Node:
                    </div>
                    <div>7. Graph runs Summary Node: <span className="text-white">summaryNode</span> [NEW]</div>
                    <div>   └─ Synthesizes Executive Summary briefing, Startup Readiness, Incubator Verdict, and SWOT.</div>
                    
                    <div>8. Graph reaches END. Returns consolidated state object containing all outputs.</div>
                  </div>

                  <h4 className="font-bold text-white pt-2 text-sm uppercase">Advantages of LangGraph Stateful Architecture:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-450">
                    <li><strong className="text-slate-300">Centralized Shared State:</strong> Schema annotation `CompanyStateAnnotation` eliminates parameters passing mess.</li>
                    <li><strong className="text-slate-300">Robust Extensibility:</strong> Graph structure remains backward compatible, paving the way for parallel agent branches, checkpointers (memory saving), or human loops.</li>
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
