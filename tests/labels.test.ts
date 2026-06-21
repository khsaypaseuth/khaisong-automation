import { describe, it, expect } from "vitest";
import { titleCase, statusVariant } from "@/lib/labels";

describe("titleCase", () => {
  it("converts SCREAMING_SNAKE to Title Case", () => {
    expect(titleCase("READY_FOR_REVIEW")).toBe("Ready For Review");
    expect(titleCase("DRAFT")).toBe("Draft");
  });
});

describe("statusVariant", () => {
  it("maps statuses to badge variants", () => {
    expect(statusVariant("APPROVED")).toBe("default");
    expect(statusVariant("POSTED")).toBe("default");
    expect(statusVariant("FAILED")).toBe("destructive");
    expect(statusVariant("REJECTED")).toBe("destructive");
    expect(statusVariant("READY_FOR_REVIEW")).toBe("secondary");
    expect(statusVariant("DRAFT")).toBe("outline");
  });
});
