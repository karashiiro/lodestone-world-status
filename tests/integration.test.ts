import { describe, it, expect } from "vitest";
import { LodestoneWorldStatus } from "../src/index.js";

describe("Integration Tests", () => {
  const client = new LodestoneWorldStatus();

  it("should fetch real world status data", async () => {
    // This test hits the actual Lodestone API
    // It might be slow and could fail if the site is down
    const result = await client.getAllWorlds();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that we have proper data structure
    const firstDC = result[0];
    expect(firstDC).toHaveProperty("name");
    expect(firstDC).toHaveProperty("region");
    expect(firstDC).toHaveProperty("worlds");
    expect(Array.isArray(firstDC.worlds)).toBe(true);

    if (firstDC.worlds.length > 0) {
      const firstWorld = firstDC.worlds[0];
      expect(firstWorld).toHaveProperty("name");
      expect(firstWorld).toHaveProperty("status");
      expect(firstWorld).toHaveProperty("population");
      expect(firstWorld).toHaveProperty("newCharacterCreation");

      // Validate status values
      expect(["online", "offline", "maintenance"]).toContain(firstWorld.status);
      expect([
        "standard",
        "preferred",
        "congested",
        "preferred+",
        "new",
      ]).toContain(firstWorld.population);
      expect(typeof firstWorld.newCharacterCreation).toBe("boolean");
    }
  }, 15000); // 15 second timeout for network request

  it("should find a known world (Adamantoise)", async () => {
    const world = await client.checkWorldStatus("Adamantoise");
    expect(world).not.toBeNull();
    expect(world?.name).toBe("Adamantoise");
  }, 10000);

  it("should return null for invalid world", async () => {
    const world = await client.checkWorldStatus("InvalidWorldName123");
    expect(world).toBeNull();
  }, 10000);

  it("should find NA data centers", async () => {
    const naDataCenters = await client.getWorldsByRegion("na");
    expect(naDataCenters.length).toBeGreaterThan(0);

    // Should include well-known NA data centers
    const dcNames = naDataCenters.map((dc) => dc.name.toLowerCase());
    expect(dcNames).toEqual(
      expect.arrayContaining(["aether", "crystal", "primal"]),
    );
  }, 10000);
});
