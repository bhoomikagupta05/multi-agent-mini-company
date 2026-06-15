"use client";

import { useState } from "react";
import { CEOOutput } from "../types";

export default function Home() {
  // 1. State management for the input idea, loading status, errors, and agent output.
  const [startupIdea, setStartupIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceoResult, setCeoResult] = useState<CEOOutput | null>(null);

  // Suggested ideas to help the user test quickly.
  const exampleIdeas = [
    "I want to build a food delivery startup focusing on healthy salads.",
    "An AI-powered automated code review tool for git repositories.",
    "A peer-to-peer equipment rental marketplace for filmmakers."
  ];

  // 2. Handle form submission to trigger the CEO Agent API.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupIdea.trim()) return;

    setIsLoading(true);
    setError(null);
    setCeoResult(null);

    try {
      // Send the idea to the Node.js API route we created.
      const response = await fetch("/api/ceo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startupIdea }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to formulate company plan.");
      }

      // Store the structured output in state.
      setCeoResult(result.data);
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
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Mini AI Company
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Phase 1: CEO Agent — Input a startup idea to generate a structured core strategy and execution plan.
          </p>
        </header>

        {/* Input Form Section */}
        <section className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="startup-idea" className="block text-sm font-semibold text-slate-200 mb-2">
                Describe your Startup Idea
              </label>
              <textarea
                id="startup-idea"
                rows={4}
                className="w-full rounded-md bg-slate-950 border border-slate-700 text-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-500"
                placeholder="Example: I want to build a decentralized micro-learning platform for web developers..."
                value={startupIdea}
                onChange={(e) => setStartupIdea(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Quick-select examples */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block font-medium">Or select an example to get started:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                {exampleIdeas.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="text-left text-xs bg-slate-700 hover:bg-slate-650 text-slate-300 py-1.5 px-3 rounded border border-slate-600 transition-colors"
                    onClick={() => setStartupIdea(idea)}
                    disabled={isLoading}
                  >
                    {idea.length > 55 ? `${idea.substring(0, 55)}...` : idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button & Loader */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !startupIdea.trim()}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "CEO Agent is thinking..." : "Formulate Strategic Plan"}
              </button>
            </div>
          </form>

          {/* Error Message Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-200 text-sm">
              <strong className="font-bold">Error:</strong> {error}
            </div>
          )}
        </section>

        {/* CEO Output Plan Section */}
        {ceoResult && (
          <section className="space-y-6 animate-fade-in">
            
            {/* 1. Generated Company Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-lg border border-blue-800 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Generated Company Name</span>
              <h2 className="text-2xl font-bold text-white mt-1">{ceoResult.companyName}</h2>
            </div>

            {/* 2. Vision & Mission Statements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                <h3 className="text-base font-bold text-blue-400 mb-2">Company Vision</h3>
                <p className="text-sm text-slate-350 italic leading-relaxed">"{ceoResult.vision}"</p>
              </div>
              <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                <h3 className="text-base font-bold text-blue-400 mb-2">Company Mission</h3>
                <p className="text-sm text-slate-350 italic leading-relaxed">"{ceoResult.mission}"</p>
              </div>
            </div>

            {/* 3. Business Goals */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <h3 className="text-base font-bold text-blue-400 mb-3">Core Year-1 Business Goals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                      <th className="py-2 pr-4 font-semibold">Goal</th>
                      <th className="py-2 px-4 font-semibold">Timeframe</th>
                      <th className="py-2 pl-4 font-semibold">Success Metric</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ceoResult.businessGoals.map((g, idx) => (
                      <tr key={idx} className="border-b border-slate-800 last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-white">{g.goal}</td>
                        <td className="py-3 px-4 text-slate-400">{g.timeframe}</td>
                        <td className="py-3 pl-4 text-emerald-400 font-mono text-xs">{g.metric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Suggested Departments */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <h3 className="text-base font-bold text-blue-400 mb-3">Initial Organizational Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ceoResult.suggestedDepartments.map((dept, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded border border-slate-800">
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

            {/* 5. First 90-Day Plan Timeline */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <h3 className="text-base font-bold text-blue-400 mb-4">First 90-Day Execution Plan</h3>
              <div className="space-y-6">
                
                {/* Days 30 */}
                <div className="relative pl-6 border-l-2 border-blue-600">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-blue-600 rounded-full" />
                  <h4 className="font-bold text-white text-sm">{ceoResult.first90DayPlan.days30.title}</h4>
                  <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-slate-300">
                    {ceoResult.first90DayPlan.days30.milestones.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>

                {/* Days 60 */}
                <div className="relative pl-6 border-l-2 border-indigo-655">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-indigo-550 rounded-full" />
                  <h4 className="font-bold text-white text-sm">{ceoResult.first90DayPlan.days60.title}</h4>
                  <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-slate-300">
                    {ceoResult.first90DayPlan.days60.milestones.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>

                {/* Days 90 */}
                <div className="relative pl-6 border-l-2 border-purple-600">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-purple-655 rounded-full" />
                  <h4 className="font-bold text-white text-sm">{ceoResult.first90DayPlan.days90.title}</h4>
                  <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-slate-300">
                    {ceoResult.first90DayPlan.days90.milestones.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

          </section>
        )}

      </div>
    </main>
  );
}
