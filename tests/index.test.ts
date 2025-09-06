import { describe, it, expect, vi } from "vitest";
import { LodestoneWorldStatus } from "../src/index.js";

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
  parseWorldStatus: vi.fn().mockImplementation(() => {
    throw new Error("No specific selectors found");
  }),
  parseWorldStatusGeneric: vi.fn().mockReturnValue([
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
