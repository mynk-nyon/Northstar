import React from "react";
import { Sparkles } from "lucide-react";

export function DemoModeBanner() {
  const isKeyConfigured = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""
  );

  if (isKeyConfigured) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="demo-banner bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2 w-full">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
        <span className="font-semibold text-amber-950">
          Demo mode — rule-based planner active.
        </span>
        <span className="hidden sm:inline text-amber-800">
          Deterministic local engine is generating all trade-off narratives and vendor drafts offline. Zero configuration required.
        </span>
      </div>
    </div>
  );
}
