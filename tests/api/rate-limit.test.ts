import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

describe("Rate Limiter Utility", () => {
  it("allows requests below the limit", () => {
    const id = "client-test-allow";
    const res1 = checkRateLimit(id, 5, 60);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = checkRateLimit(id, 5, 60);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("blocks requests once limit is reached and provides reset time", () => {
    const id = "client-test-block";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(id, 3, 60);
    }

    const blocked = checkRateLimit(id, 3, 60);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetSeconds).toBeGreaterThan(0);
  });
});
