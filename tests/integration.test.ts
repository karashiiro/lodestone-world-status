import { describe, it, expect, vi } from "vitest";
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

  it("should find EU data centers", async () => {
    const euDataCenters = await client.getWorldsByRegion("eu");
    expect(euDataCenters.length).toBeGreaterThan(0);

    // Should include well-known EU data centers
    const dcNames = euDataCenters.map((dc) => dc.name.toLowerCase());
    expect(dcNames).toEqual(expect.arrayContaining(["chaos", "light"]));

    // All data centers should have EU region
    euDataCenters.forEach((dc) => {
      expect(dc.region).toBe("eu");
    });
  }, 10000);

  it("should find JP data centers", async () => {
    const jpDataCenters = await client.getWorldsByRegion("jp");
    expect(jpDataCenters.length).toBeGreaterThan(0);

    // Should include well-known JP data centers
    const dcNames = jpDataCenters.map((dc) => dc.name.toLowerCase());
    expect(dcNames).toEqual(
      expect.arrayContaining(["elemental", "gaia", "mana"]),
    );

    // All data centers should have JP region
    jpDataCenters.forEach((dc) => {
      expect(dc.region).toBe("jp");
    });
  }, 10000);

  it("should find OC data centers", async () => {
    const ocDataCenters = await client.getWorldsByRegion("oc");
    expect(ocDataCenters.length).toBeGreaterThan(0);

    // Should include Materia
    const dcNames = ocDataCenters.map((dc) => dc.name.toLowerCase());
    expect(dcNames).toContain("materia");

    // All data centers should have OC region
    ocDataCenters.forEach((dc) => {
      expect(dc.region).toBe("oc");
    });
  }, 10000);

  it("should handle concurrent requests efficiently", async () => {
    const startTime = Date.now();

    // Make 3 concurrent requests
    const [worlds1, worlds2, worlds3] = await Promise.all([
      client.getAllWorlds(),
      client.getAllWorlds(),
      client.getAllWorlds(),
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All results should be identical (from cache)
    expect(worlds1).toEqual(worlds2);
    expect(worlds2).toEqual(worlds3);

    // Should be fast due to caching (under 5 seconds even with network)
    expect(duration).toBeLessThan(5000);
  }, 10000);

  it("should test parsing fallback mechanism", async () => {
    // This test temporarily mocks parseWorldStatus to fail
    // to test that the fallback to parseWorldStatusGeneric works

    const originalModule = await import("../src/utils/scraper.js");
    const parseWorldStatusSpy = vi.spyOn(originalModule, "parseWorldStatus");
    const parseWorldStatusGenericSpy = vi.spyOn(
      originalModule,
      "parseWorldStatusGeneric",
    );

    // Make specific parsing fail
    parseWorldStatusSpy.mockImplementationOnce(() => {
      throw new Error("Specific selectors not found");
    });

    // Let generic parsing work normally
    parseWorldStatusGenericSpy.mockImplementationOnce(
      originalModule.parseWorldStatusGeneric,
    );

    const client = new LodestoneWorldStatus();
    const result = await client.getAllWorlds();

    // Should still get results via fallback
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Verify both functions were called
    expect(parseWorldStatusSpy).toHaveBeenCalled();
    expect(parseWorldStatusGenericSpy).toHaveBeenCalled();

    // Cleanup
    parseWorldStatusSpy.mockRestore();
    parseWorldStatusGenericSpy.mockRestore();
  }, 15000);
});
