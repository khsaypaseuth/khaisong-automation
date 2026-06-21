import { describe, it, expect } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  it("allows up to the limit, then blocks", () => {
    const now = 1000;
    const rl = new RateLimiter(3, 1000, () => now);

    expect(rl.check("a").allowed).toBe(true); // 1
    expect(rl.check("a").allowed).toBe(true); // 2
    const third = rl.check("a");
    expect(third.allowed).toBe(true); // 3
    expect(third.remaining).toBe(0);

    const blocked = rl.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    let now = 0;
    const rl = new RateLimiter(1, 1000, () => now);

    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);

    now = 1000; // window elapsed
    expect(rl.check("a").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const now = 0;
    const rl = new RateLimiter(1, 1000, () => now);

    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("reset() clears a key", () => {
    const now = 0;
    const rl = new RateLimiter(1, 1000, () => now);

    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
    rl.reset("a");
    expect(rl.check("a").allowed).toBe(true);
  });
});
