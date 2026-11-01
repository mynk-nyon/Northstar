import type { Metadata } from "next";
import "./globals.css";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { Navbar } from "@/components/Navbar";
import { SkipToContent } from "@/components/SkipToContent";

export const metadata: Metadata = {
  title: "Northstar — Celebration & Event Planner",
  description:
    "A GenAI-powered planning assistant for weddings, birthdays, and community events with deterministic math and decision-support trade-off simulations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <SkipToContent />
        <DemoModeBanner />
        <Navbar />
        <main id="main-content" className="flex-1 flex flex-col focus:outline-none">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>Northstar Celebration & Event Planner &bull; Deterministic math, generative language.</p>
            <p className="text-slate-400">Built with Next.js, TypeScript, Tailwind CSS, Prisma, and Vitest.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
