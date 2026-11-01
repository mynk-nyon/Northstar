"use client";

import React, { useState } from "react";
import { VendorModel, EventModel, BudgetCategoryModel } from "@/lib/domain/types";
import { CATEGORY_TAXONOMY, CategoryKey } from "@/lib/config/constants";
import { formatCurrency } from "@/lib/utils/formatting";
import { Modal } from "@/components/Modal";
import {
  Store,
  Mail,
  Copy,
  Check,
  Plus,
  Sparkles,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface VendorClientProps {
  event: EventModel;
  initialVendors: VendorModel[];
  categories: BudgetCategoryModel[];
}

export function VendorClient({
  event,
  initialVendors,
  categories,
}: VendorClientProps) {
  const [vendors, setVendors] = useState<VendorModel[]>(initialVendors);
  const [selectedVendorForDraft, setSelectedVendorForDraft] = useState<VendorModel | null>(null);

  // Drafting modal state
  const [messageType, setMessageType] = useState<"inquiry" | "negotiation" | "follow_up">("inquiry");
  const [customQuestions, setCustomQuestions] = useState<string>("");
  const [specialNotes, setSpecialNotes] = useState<string>("");
  const [draftResult, setDraftResult] = useState<any>(null);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // New Vendor modal state
  const [isAddVendorOpen, setIsAddVendorOpen] = useState<boolean>(false);
  const [newVendorCategory, setNewVendorCategory] = useState<CategoryKey>("venue");
  const [newVendorName, setNewVendorName] = useState<string>("");
  const [newVendorContact, setNewVendorContact] = useState<string>("");
  const [newVendorQuote, setNewVendorQuote] = useState<number>(0);

  // Compute budget ceiling for selected vendor
  const getCategoryBudgetCeiling = (categoryKey: CategoryKey) => {
    const cat = categories.find((c) => c.categoryKey === categoryKey);
    return cat ? cat.allocatedAmount : 5000;
  };

  const handleOpenDraftModal = (vendor: VendorModel) => {
    setSelectedVendorForDraft(vendor);
    setDraftResult(null);
    setIsCopied(false);
  };

  const handleGenerateDraft = async () => {
    if (!selectedVendorForDraft) return;

    setIsDrafting(true);
    try {
      const budgetCeiling = getCategoryBudgetCeiling(selectedVendorForDraft.categoryKey);
      const questionsList = customQuestions
        .split("\n")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const res = await fetch("/api/vendors/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: event.type,
          eventDate: event.date,
          location: event.location,
          guestCount: event.guestCount,
          categoryKey: selectedVendorForDraft.categoryKey,
          vendorName: selectedVendorForDraft.name,
          vendorContact: selectedVendorForDraft.contact,
          budgetCeiling,
          currency: event.currency,
          messageType,
          specificQuestions: questionsList,
          notes: specialNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDraftResult(data.draft);
      }
    } catch (err) {
      console.error("Failed to generate vendor draft:", err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!draftResult) return;
    const fullText = `Subject: ${draftResult.subject}\n\n${draftResult.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          categoryKey: newVendorCategory,
          name: newVendorName.trim(),
          contact: newVendorContact.trim() || "Not specified",
          quoteAmount: newVendorQuote,
          depositAmount: 0,
          balanceDue: newVendorQuote,
          contractStatus: "contacted",
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setVendors((prev) => [...prev, created]);
        setIsAddVendorOpen(false);
        setNewVendorName("");
        setNewVendorContact("");
        setNewVendorQuote(0);
      }
    } catch (err) {
      console.error("Failed to add vendor:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Vendor Directory &amp; Communication Assistant
          </h2>
          <p className="text-xs text-slate-500">
            Track quotes, contracts, and generate tailored, personalized message drafts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddVendorOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3.5 py-2 rounded-lg shadow-xs transition focus-visible:ring-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendors.map((vendor) => {
          const categoryMeta = CATEGORY_TAXONOMY[vendor.categoryKey];
          const budgetCeiling = getCategoryBudgetCeiling(vendor.categoryKey);

          return (
            <div
              key={vendor.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {categoryMeta?.label || vendor.categoryKey}
                  </span>
                  <span className="text-xs font-bold capitalize text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                    {vendor.contractStatus.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{vendor.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{vendor.contact}</span>
                  </p>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quote</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(vendor.quoteAmount, event.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Deposit</span>
                    <span className="font-medium text-emerald-700">
                      {formatCurrency(vendor.depositAmount, event.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Balance</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(vendor.balanceDue, event.currency)}
                    </span>
                  </div>
                </div>

                {vendor.notes && (
                  <p className="text-xs text-slate-500 italic line-clamp-2">
                    &ldquo;{vendor.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Draft Message Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Ceiling: <span className="font-bold">{formatCurrency(budgetCeiling, event.currency)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDraftModal(vendor)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition focus-visible:ring-2"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Draft Message</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Message Drafting Modal */}
      {selectedVendorForDraft && (
        <Modal
          isOpen={Boolean(selectedVendorForDraft)}
          onClose={() => setSelectedVendorForDraft(null)}
          title={`Draft Communication with ${selectedVendorForDraft.name}`}
          description={`Generates personalized drafts personalized with your ${event.guestCount}-guest event scope and firm budget ceiling.`}
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Draft Only:</strong> AI drafts are for review and customization. Messages are NEVER automatically sent to vendors.
              </span>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Communication Intent
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "inquiry", label: "Initial Inquiry & Pricing" },
                  { value: "negotiation", label: "Scope & Price Alignment" },
                  { value: "follow_up", label: "Timeline & Run-of-Show" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMessageType(opt.value as any)}
                    className={`p-2.5 rounded-lg text-xs font-semibold border transition text-left ${
                      messageType === opt.value
                        ? "bg-brand-50 text-brand-800 border-brand-300"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions to Ask */}
            <div>
              <label htmlFor="specific-questions" className="text-xs font-bold text-slate-700 block mb-1">
                Specific Inquiries to Include (One per line)
              </label>
              <textarea
                id="specific-questions"
                rows={2}
                value={customQuestions}
                onChange={(e) => setCustomQuestions(e.target.value)}
                placeholder="e.g. Dietary options, overtime fee rate, arrival time"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus-visible:ring-2"
              />
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={isDrafting}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDrafting ? "Composing Draft..." : "Generate Personalized Draft"}</span>
            </button>

            {/* Generated Output */}
            {draftResult && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Generated Draft (Editable)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label htmlFor="draft-subject" className="text-[11px] font-bold text-slate-500 block mb-1">
                    Subject Line
                  </label>
                  <input
                    id="draft-subject"
                    type="text"
                    value={draftResult.subject}
                    onChange={(e) =>
                      setDraftResult({ ...draftResult, subject: e.target.value })
                    }
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="draft-body" className="text-[11px] font-bold text-slate-500 block mb-1">
                    Message Body
                  </label>
                  <textarea
                    id="draft-body"
                    rows={8}
                    value={draftResult.body}
                    onChange={(e) =>
                      setDraftResult({ ...draftResult, body: e.target.value })
                    }
                    className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-white leading-relaxed"
                  />
                </div>

                {draftResult.suggestedNegotiationLever && (
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-900">
                    <span className="font-bold block mb-0.5">Negotiation Strategy:</span>
                    {draftResult.suggestedNegotiationLever}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Vendor Modal */}
      {isAddVendorOpen && (
        <Modal
          isOpen={isAddVendorOpen}
          onClose={() => setIsAddVendorOpen(false)}
          title="Add New Vendor Line Item"
          description="Register a prospective or booked vendor for this celebration."
          maxWidthClass="max-w-md"
        >
          <form onSubmit={handleCreateVendor} className="space-y-4">
            <div>
              <label htmlFor="new-category" className="text-xs font-bold text-slate-700 block mb-1">
                Category
              </label>
              <select
                id="new-category"
                value={newVendorCategory}
                onChange={(e) => setNewVendorCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {categories.map((c) => (
                  <option key={c.categoryKey} value={c.categoryKey}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="new-vendor-name" className="text-xs font-bold text-slate-700 block mb-1">
                Vendor Name
              </label>
              <input
                id="new-vendor-name"
                type="text"
                required
                placeholder="e.g. Coastal Sound & DJ"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="new-vendor-contact" className="text-xs font-bold text-slate-700 block mb-1">
                Email / Phone Contact
              </label>
              <input
                id="new-vendor-contact"
                type="text"
                placeholder="booking@vendor.com"
                value={newVendorContact}
                onChange={(e) => setNewVendorContact(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="new-vendor-quote" className="text-xs font-bold text-slate-700 block mb-1">
                Quoted Amount ({event.currency})
              </label>
              <input
                id="new-vendor-quote"
                type="number"
                min={0}
                value={newVendorQuote}
                onChange={(e) => setNewVendorQuote(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
              >
                Save Vendor
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
