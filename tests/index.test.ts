import { describe, it, expect } from "vitest";
import {
  LodestoneWorldStatus,
  normalizeWorldName,
  isValidWorldName,
} from "../src/index.js";

describe("LodestoneWorldStatus", () => {
  const client = new LodestoneWorldStatus();

  it("should check world status", async () => {
    const result = await client.checkWorldStatus("Excalibur");
    expect(result).toHaveProperty("world", "Excalibur");
    expect(result).toHaveProperty("status");
  });

  it("should get all worlds", async () => {
    const result = await client.getAllWorlds();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Utils", () => {
  it("should normalize world names", () => {
    expect(normalizeWorldName("  Excalibur  ")).toBe("excalibur");
    expect(normalizeWorldName("HYPERION")).toBe("hyperion");
  });

  it("should validate world names", () => {
    expect(isValidWorldName("Excalibur")).toBe(true);
    expect(isValidWorldName("Primal Server")).toBe(true);
    expect(isValidWorldName("")).toBe(false);
    expect(isValidWorldName("123")).toBe(false);
  });
});
