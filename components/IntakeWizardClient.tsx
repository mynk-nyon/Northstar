"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getNextAdaptiveQuestion } from "@/lib/domain/intake";
import { CATEGORY_TAXONOMY, CategoryKey, EventType } from "@/lib/config/constants";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Check,
  Calendar,
  Users,
  DollarSign,
  Building,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

export function IntakeWizardClient() {
  const router = useRouter();

  const [answers, setAnswers] = useState<any>({
    eventType: "wedding",
    title: "",
    date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    location: "San Francisco, CA",
    guestCount: 100,
    totalBudget: 30000,
    currency: "USD",
    venueType: "indoor",
  });

  const [priorities, setPriorities] = useState<CategoryKey[]>([
    "catering",
    "venue",
    "photography",
    "entertainment",
    "decor",
    "attire",
    "invitations",
    "favors",
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get current active adaptive question
  const currentQuestion = getNextAdaptiveQuestion({
    ...answers,
    priorities: answers.priorities,
  });

  const handlePriorityMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= priorities.length) return;
    const updated = [...priorities];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setPriorities(updated);
  };

  const handleNextStep = async () => {
    setErrorMessage(null);

    if (currentQuestion?.id === "q_core_basics") {
      if (!answers.guestCount || answers.guestCount <= 0) {
        setErrorMessage("Please enter a valid guest count (at least 1).");
        return;
      }
      if (!answers.totalBudget || answers.totalBudget < 100) {
        setErrorMessage("Please enter an estimated budget of at least $100.");
        return;
      }
      if (!answers.date) {
        setErrorMessage("Please select a target celebration date.");
        return;
      }
      setAnswers((prev: any) => ({
        ...prev,
        title: prev.title.trim() || `${prev.eventType.toUpperCase()} Celebration`,
      }));
    } else if (currentQuestion?.id === "q_priorities") {
      setAnswers((prev: any) => ({
        ...prev,
        priorities,
      }));
    }
  };

  const handleSelectOption = (fieldKey: string, value: string) => {
    setAnswers((prev: any) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...answers,
        priorities: answers.priorities || priorities,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      const createdEvent = await res.json();
      router.push(`/events/${createdEvent.id}`);
    } catch (err: any) {
      console.error("Intake submission failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Render question bodies
  const renderQuestionBody = () => {
    if (!currentQuestion) {
      // All questions answered, review & generate
      return (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
            <div className="font-bold text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Intake Complete &bull; Ready to Generate Deterministic Plan</span>
            </div>
            <p className="text-xs text-emerald-800">
              We have synthesized your priorities, venue constraints, and headcount into a calibrated plan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Celebration</span>
              <span className="font-bold text-slate-900">{answers.title}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Event Type</span>
              <span className="font-bold text-slate-900 capitalize">{answers.eventType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Target Date</span>
              <span className="font-bold text-slate-900">{answers.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Guest Count</span>
              <span className="font-bold text-slate-900">{answers.guestCount} guests</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Budget</span>
              <span className="font-bold text-slate-900">${answers.totalBudget.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Top Priority</span>
              <span className="font-bold text-brand-700 capitalize">
                {CATEGORY_TAXONOMY[answers.priorities?.[0] as CategoryKey]?.label || answers.priorities?.[0]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? "Generating Master Plan..." : "Generate Master Plan"}</span>
          </button>
        </div>
      );
    }

    if (currentQuestion.id === "q_core_basics") {
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Event Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["wedding", "birthday", "community"] as EventType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAnswers((prev: any) => ({ ...prev, eventType: t }))}
                  className={`p-3 rounded-xl border text-center text-xs font-bold capitalize transition ${
                    answers.eventType === t
                      ? "bg-brand-50 text-brand-800 border-brand-300 ring-2 ring-brand-500 ring-offset-1"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="intake-title" className="text-xs font-bold text-slate-700 block mb-1">
              Celebration Title
            </label>
            <input
              id="intake-title"
              type="text"
              value={answers.title}
              onChange={(e) => setAnswers({ ...answers, title: e.target.value })}
              placeholder="e.g. Maya & Lucas Coastal Wedding"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intake-date" className="text-xs font-bold text-slate-700 block mb-1">
                Target Date
              </label>
              <input
                id="intake-date"
                type="date"
                value={answers.date}
                onChange={(e) => setAnswers({ ...answers, date: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="intake-location" className="text-xs font-bold text-slate-700 block mb-1">
                City / Location
              </label>
              <input
                id="intake-location"
                type="text"
                value={answers.location}
                onChange={(e) => setAnswers({ ...answers, location: e.target.value })}
                placeholder="e.g. Carmel, CA"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intake-guests" className="text-xs font-bold text-slate-700 block mb-1">
                Estimated Headcount (Guests)
              </label>
              <input
                id="intake-guests"
                type="number"
                min={1}
                value={answers.guestCount}
                onChange={(e) => setAnswers({ ...answers, guestCount: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-bold"
              />
            </div>

            <div>
              <label htmlFor="intake-budget" className="text-xs font-bold text-slate-700 block mb-1">
                Estimated Total Budget ($)
              </label>
              <input
                id="intake-budget"
                type="number"
                min={100}
                step={500}
                value={answers.totalBudget}
                onChange={(e) => setAnswers({ ...answers, totalBudget: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-bold"
              />
            </div>
          </div>
        </div>
      );
    }

    if (currentQuestion.id === "q_priorities") {
      return (
        <div className="space-y-4">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900">
            <strong>The assistant asks before assuming:</strong> We never apply a cookie-cutter budget. Categories placed at the top receive bonus funding weight, while lower-ranked areas absorb smaller percentages.
          </div>

          <div className="space-y-2">
            {priorities.map((key, idx) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-brand-300 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {CATEGORY_TAXONOMY[key]?.label || key}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {CATEGORY_TAXONOMY[key]?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePriorityMove(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 disabled:opacity-20"
                    aria-label={`Rank ${CATEGORY_TAXONOMY[key]?.label} higher`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityMove(idx, "down")}
                    disabled={idx === priorities.length - 1}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 disabled:opacity-20"
                    aria-label={`Rank ${CATEGORY_TAXONOMY[key]?.label} lower`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Standard Options Question (Adaptive deep dive, venue, contingency)
    if (currentQuestion.options) {
      return (
        <div className="space-y-3">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectOption(currentQuestion.fieldKey, opt.value)}
              className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40 transition shadow-2xs focus-visible:ring-2"
            >
              <div className="font-bold text-xs text-slate-900">{opt.label}</div>
              {opt.description && (
                <div className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {opt.description}
                </div>
              )}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
              {currentQuestion ? currentQuestion.stepNumber : 5}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Step {currentQuestion ? currentQuestion.stepNumber : 5} of 5 &bull; Adaptive Intake
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {currentQuestion ? "Personalizing your plan" : "Finalizing"}
          </span>
        </div>

        {/* Question Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentQuestion ? currentQuestion.question : "Review Your Celebration Parameters"}
          </h1>
          {currentQuestion?.helpText && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              {currentQuestion.helpText}
            </p>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Dynamic Question Body */}
        {renderQuestionBody()}

        {/* Navigation buttons */}
        {currentQuestion && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-5 py-2.5 rounded-lg shadow-xs transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
