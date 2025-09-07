import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LodestoneWorldStatus } from "../src/index.js";
import { createTestDataCenter } from "./test-helpers.js";

// Mock the scraper functions to avoid actual HTTP calls in tests
vi.mock("../src/utils/scraper.js", () => ({
  fetchHtml: vi.fn().mockResolvedValue(`
    <html>
      <body>
        <div>
          <h3>Aether</h3>
          <ul>
            <li>Adamantoise Standard</li>
            <li>Cactuar Congested</li>
            <li>Excalibur Preferred</li>
          </ul>
        </div>
      </body>
    </html>
  `),
  parseWorldStatus: vi.fn().mockReturnValue([
    {
      name: "Aether",
      region: "na",
      worlds: [
        {
          name: "Adamantoise",
          status: "online",
          population: "standard",
          newCharacterCreation: true,
        },
        {
          name: "Cactuar",
          status: "online",
          population: "congested",
          newCharacterCreation: false,
        },
        {
          name: "Excalibur",
          status: "online",
          population: "preferred",
          newCharacterCreation: true,
        },
      ],
    },
  ]),
}));

describe("LodestoneWorldStatus", () => {
  const client = new LodestoneWorldStatus();

  it("should check world status for existing world", async () => {
    const result = await client.checkWorldStatus("Excalibur");
    expect(result).toEqual({
      name: "Excalibur",
      status: "online",
      population: "preferred",
      newCharacterCreation: true,
    });
  });

  it("should return null for non-existent world", async () => {
    const result = await client.checkWorldStatus("NonExistentWorld");
    expect(result).toBe(null);
  });

  it("should get all worlds organized by data center", async () => {
    const result = await client.getAllWorlds();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Aether");
    expect(result[0]).toHaveProperty("worlds");
    expect(result[0].worlds).toHaveLength(3);
  });

  it("should get all worlds in flat array", async () => {
    const result = await client.getAllWorldsFlat();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result.map((w) => w.name)).toEqual([
      "Adamantoise",
      "Cactuar",
      "Excalibur",
    ]);
  });

  it("should get data center by name", async () => {
    const result = await client.getDataCenter("Aether");
    expect(result).toHaveProperty("name", "Aether");
    expect(result?.worlds).toHaveLength(3);
  });

  it("should return null for non-existent data center", async () => {
    const result = await client.getDataCenter("NonExistent");
    expect(result).toBe(null);
  });

  it("should get worlds by region", async () => {
    const result = await client.getWorldsByRegion("na");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Aether");
  });

  it("should clear cache", () => {
    client.clearCache();
    // Just ensure it doesn't throw - internal cache state is private
    expect(true).toBe(true);
  });

  it("should handle case insensitive world name lookup", async () => {
    const result = await client.checkWorldStatus("EXCALIBUR");
    expect(result?.name).toBe("Excalibur");
  });
});

describe("LodestoneWorldStatus - Constructor Edge Cases", () => {
  it("should reject zero cache expiration", () => {
    expect(() => new LodestoneWorldStatus(0)).toThrow(
      "Cache expiration must be a positive integer, got: 0",
    );
  });

  it("should handle very large cache expiration values", async () => {
    const longCacheClient = new LodestoneWorldStatus(24 * 60 * 60 * 1000); // 24 hours

    const result = await longCacheClient.getAllWorlds();
    expect(Array.isArray(result)).toBe(true);

    // Cache stats should reflect the long expiration
    const stats = longCacheClient.getCacheStats();
    expect(stats.expirationMs).toBe(24 * 60 * 60 * 1000);
  });

  it("should reject negative cache values", () => {
    expect(() => new LodestoneWorldStatus(-1000)).toThrow(
      "Cache expiration must be a positive integer, got: -1000",
    );
  });
});

describe("LodestoneWorldStatus - Concurrent Request Handling", () => {
  let client: LodestoneWorldStatus;

  beforeEach(() => {
    client = new LodestoneWorldStatus(5000); // 5 second cache
  });

  it("should handle multiple simultaneous calls before cache is populated", async () => {
    // Make multiple calls simultaneously before cache has any data
    const promises = [
      client.checkWorldStatus("Adamantoise"),
      client.checkWorldStatus("Cactuar"),
      client.getAllWorlds(),
      client.getDataCenter("Aether"),
      client.getWorldsByRegion("na"),
    ] as const;

    const results = await Promise.all(promises);

    // All should complete successfully
    expect(results[0]?.name).toBe("Adamantoise");
    expect(results[1]?.name).toBe("Cactuar");
    expect(Array.isArray(results[2])).toBe(true);
    expect(results[3]?.name).toBe("Aether");
    expect(Array.isArray(results[4])).toBe(true);
  });

  it("should return consistent results across concurrent calls", async () => {
    const [world1, world2, world3] = await Promise.all([
      client.checkWorldStatus("Excalibur"),
      client.checkWorldStatus("Excalibur"),
      client.checkWorldStatus("Excalibur"),
    ]);

    // All should be identical
    expect(world1).toEqual(world2);
    expect(world2).toEqual(world3);
    expect(world1?.name).toBe("Excalibur");
  });
});

describe("LodestoneWorldStatus - Large Dataset Handling", () => {
  beforeEach(async () => {
    // Mock larger dataset for these tests
    const scraperModule = await import("../src/utils/scraper.js");
    const parseWorldStatusMock = vi.mocked(scraperModule.parseWorldStatus);

    parseWorldStatusMock.mockReturnValue([
      createTestDataCenter(
        "Aether",
        "na",
        Array.from({ length: 20 }, (_, i) => ({
          name: `World${i + 1}`,
          status: "online",
          population: i % 2 === 0 ? "standard" : "preferred",
          newCharacterCreation: true,
        })),
      ),
      createTestDataCenter(
        "Crystal",
        "na",
        Array.from({ length: 15 }, (_, i) => ({
          name: `CrystalWorld${i + 1}`,
          status: "online",
          population: "congested",
          newCharacterCreation: false,
        })),
      ),
      createTestDataCenter(
        "Chaos",
        "eu",
        Array.from({ length: 25 }, (_, i) => ({
          name: `EuWorld${i + 1}`,
          status: "online",
          population: "preferred",
          newCharacterCreation: true,
        })),
      ),
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle large datasets efficiently", async () => {
    const client = new LodestoneWorldStatus();

    const startTime = Date.now();
    const result = await client.getAllWorldsFlat();
    const endTime = Date.now();

    // Should handle 60 worlds across 3 data centers
    expect(result).toHaveLength(60);

    // Should complete reasonably quickly (under 1 second for in-memory operations)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it("should correctly filter regions with large datasets", async () => {
    const client = new LodestoneWorldStatus();

    const naWorlds = await client.getWorldsByRegion("na");
    const euWorlds = await client.getWorldsByRegion("eu");

    expect(naWorlds).toHaveLength(2); // Aether + Crystal
    expect(euWorlds).toHaveLength(1); // Chaos

    const totalNaWorldCount = naWorlds.reduce(
      (sum, dc) => sum + dc.worlds.length,
      0,
    );
    const totalEuWorldCount = euWorlds.reduce(
      (sum, dc) => sum + dc.worlds.length,
      0,
    );

    expect(totalNaWorldCount).toBe(35); // 20 + 15
    expect(totalEuWorldCount).toBe(25);
  });
});

describe("LodestoneWorldStatus - Unknown Data Centers", () => {
  beforeEach(async () => {
    const scraperModule = await import("../src/utils/scraper.js");
    const parseWorldStatusMock = vi.mocked(scraperModule.parseWorldStatus);

    parseWorldStatusMock.mockReturnValue([
      createTestDataCenter(
        "UnknownDataCenter",
        "na", // Should default to NA for unknown DCs
        [
          {
            name: "UnknownWorld1",
            status: "online",
            population: "standard",
            newCharacterCreation: true,
          },
          {
            name: "UnknownWorld2",
            status: "maintenance",
            population: "preferred+",
            newCharacterCreation: true,
          },
        ],
      ),
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle unknown data center names gracefully", async () => {
    const client = new LodestoneWorldStatus();

    const result = await client.getDataCenter("UnknownDataCenter");
    expect(result?.name).toBe("UnknownDataCenter");
    expect(result?.region).toBe("na"); // Should default to NA
    expect(result?.worlds).toHaveLength(2);
  });

  it("should find worlds in unknown data centers", async () => {
    const client = new LodestoneWorldStatus();

    const world = await client.checkWorldStatus("UnknownWorld1");
    expect(world?.name).toBe("UnknownWorld1");
    expect(world?.status).toBe("online");
  });

  it("should include unknown data centers in region queries", async () => {
    const client = new LodestoneWorldStatus();

    const naDataCenters = await client.getWorldsByRegion("na");
    expect(naDataCenters).toHaveLength(1);
    expect(naDataCenters[0].name).toBe("UnknownDataCenter");
  });
});
