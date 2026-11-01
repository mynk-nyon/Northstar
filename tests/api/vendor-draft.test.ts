import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/vendors/draft-message/route";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

describe("POST /api/vendors/draft-message Integration Tests", () => {
  it("drafts personalized vendor message within strict budget ceiling", async () => {
    const req = new Request("http://localhost:3000/api/vendors/draft-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "wedding",
        eventDate: "2027-06-20",
        location: "Sonoma, CA",
        guestCount: 120,
        categoryKey: "catering",
        vendorName: "Valley Fine Catering",
        vendorContact: "info@valleyfine.com",
        budgetCeiling: 14000,
        currency: "USD",
        messageType: "inquiry",
        specificQuestions: ["Are vegan options included?", "What is staffing ratio?"],
        notes: "Historic winery venue with 10pm curfew.",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.draft.subject).toContain("2027-06-20");
    expect(data.draft.body).toContain("$14,000");
    expect(data.draft.keyPointsHighlighted.length).toBeGreaterThan(0);
    expect(data.meta.isDemoMode).toBe(true);
  });

  it("rejects invalid category key or malformed date", async () => {
    const req = new Request("http://localhost:3000/api/vendors/draft-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "wedding",
        eventDate: "invalid-date",
        location: "Sonoma",
        guestCount: 120,
        categoryKey: "fake_category",
        vendorName: "Valley Catering",
        vendorContact: "chef@example.com",
        budgetCeiling: 10000,
        messageType: "inquiry",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid vendor drafting parameters");
  });

  it("enforces rate-limiting when draft threshold exceeded", async () => {
    const ip = "10.0.0.42";
    for (let i = 0; i < 20; i++) {
      checkRateLimit(`draft:${ip}`, 20, 60);
    }

    const testReq = new Request("http://localhost:3000/api/vendors/draft-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({
        eventType: "birthday",
        eventDate: "2027-04-10",
        location: "Oakland",
        guestCount: 50,
        categoryKey: "entertainment",
        vendorName: "DJ Sound",
        vendorContact: "dj@example.com",
        budgetCeiling: 1500,
        currency: "USD",
        messageType: "inquiry",
      }),
    });

    const res = await POST(testReq as any);
    expect(res.status).toBe(429);
  });
});
