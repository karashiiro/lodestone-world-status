import { describe, it, expect } from "vitest";
import { normalizeWorldName, isValidWorldName } from "../../src/utils/index.js";

describe("Utils", () => {
  describe("normalizeWorldName", () => {
    it("should normalize world names", () => {
      expect(normalizeWorldName("  Excalibur  ")).toBe("excalibur");
      expect(normalizeWorldName("HYPERION")).toBe("hyperion");
      expect(normalizeWorldName("Midgardsormr")).toBe("midgardsormr");
      expect(normalizeWorldName("")).toBe("");
    });

    it("should handle special characters", () => {
      expect(normalizeWorldName("Primal Server")).toBe("primal server");
      expect(normalizeWorldName("Test-World")).toBe("test-world");
    });
  });

  describe("isValidWorldName", () => {
    it("should validate world names", () => {
      expect(isValidWorldName("Excalibur")).toBe(true);
      expect(isValidWorldName("Primal Server")).toBe(true);
      expect(isValidWorldName("Midgardsormr")).toBe(true);
    });

    it("should reject invalid world names", () => {
      expect(isValidWorldName("")).toBe(false);
      expect(isValidWorldName("123")).toBe(false);
      expect(isValidWorldName("World123")).toBe(false);
      expect(isValidWorldName("@#$%")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidWorldName("A")).toBe(true);
      expect(isValidWorldName("World Name")).toBe(true);
      expect(isValidWorldName("   ")).toBe(false);
    });
  });
});
