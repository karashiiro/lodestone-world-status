import { describe, it, expect, vi, beforeEach } from "vitest";
import { LodestoneWorldStatus } from "../src/index.js";

// Mock the scraper functions
vi.mock("../src/utils/scraper.js", () => ({
  fetchHtml: vi.fn(),
  parseWorldStatus: vi.fn(),
  parseWorldStatusGeneric: vi.fn(),
}));

import {
  fetchHtml,
  parseWorldStatus,
  parseWorldStatusGeneric,
} from "../src/utils/scraper.js";

describe("Error Handling Tests", () => {
  let client: LodestoneWorldStatus;

  beforeEach(() => {
    client = new LodestoneWorldStatus();
    vi.clearAllMocks();
  });

  describe("HTTP errors", () => {
    it("should handle network errors", async () => {
      vi.mocked(fetchHtml).mockRejectedValue(new Error("Network error"));

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status: Network error",
      );
    });

    it("should handle HTTP status errors", async () => {
      vi.mocked(fetchHtml).mockRejectedValue(
        new Error("HTTP error! status: 404"),
      );

      await expect(client.checkWorldStatus("Adamantoise")).rejects.toThrow(
        "Failed to fetch world status: HTTP error! status: 404",
      );
    });

    it("should handle server errors", async () => {
      vi.mocked(fetchHtml).mockRejectedValue(
        new Error("HTTP error! status: 500"),
      );

      await expect(client.getDataCenter("Aether")).rejects.toThrow(
        "Failed to fetch world status: HTTP error! status: 500",
      );
    });

    it("should handle timeout errors", async () => {
      vi.mocked(fetchHtml).mockRejectedValue(new Error("Request timeout"));

      await expect(client.getWorldsByRegion("na")).rejects.toThrow(
        "Failed to fetch world status: Request timeout",
      );
    });
  });

  describe("parsing errors", () => {
    beforeEach(() => {
      vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
    });

    it("should handle both specific and generic parsing failures", async () => {
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Specific selectors failed");
      });
      vi.mocked(parseWorldStatusGeneric).mockImplementation(() => {
        throw new Error("Generic parsing failed");
      });

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status: Generic parsing failed",
      );
    });

    it("should successfully fallback when specific parsing fails", async () => {
      const mockDataCenters = [
        {
          name: "Aether",
          region: "na" as const,
          worlds: [
            {
              name: "Adamantoise",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];

      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Specific selectors not found");
      });
      vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);

      const result = await client.getAllWorlds();
      expect(result).toEqual(mockDataCenters);
    });

    it("should handle empty or malformed HTML", async () => {
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("No valid HTML structure found");
      });
      vi.mocked(parseWorldStatusGeneric).mockImplementation(() => {
        throw new Error("Cannot parse empty HTML");
      });

      await expect(client.checkWorldStatus("Excalibur")).rejects.toThrow(
        "Failed to fetch world status: Cannot parse empty HTML",
      );
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });
    });

    it("should handle empty data center arrays", async () => {
      vi.mocked(parseWorldStatusGeneric).mockReturnValue([]);

      const result = await client.getAllWorlds();
      expect(result).toEqual([]);

      const world = await client.checkWorldStatus("Adamantoise");
      expect(world).toBeNull();
    });

    it("should handle data centers with no worlds", async () => {
      const mockDataCenters = [
        {
          name: "Empty",
          region: "na" as const,
          worlds: [],
        },
      ];
      vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);

      const result = await client.getAllWorlds();
      expect(result).toEqual(mockDataCenters);

      const flatWorlds = await client.getAllWorldsFlat();
      expect(flatWorlds).toEqual([]);
    });

    it("should handle case sensitivity in world lookups", async () => {
      const mockDataCenters = [
        {
          name: "Aether",
          region: "na" as const,
          worlds: [
            {
              name: "Adamantoise",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);

      // All these should find the world
      const world1 = await client.checkWorldStatus("Adamantoise");
      const world2 = await client.checkWorldStatus("ADAMANTOISE");
      const world3 = await client.checkWorldStatus("adamantoise");
      const world4 = await client.checkWorldStatus("  AdAmAnToIsE  ");

      expect(world1?.name).toBe("Adamantoise");
      expect(world2?.name).toBe("Adamantoise");
      expect(world3?.name).toBe("Adamantoise");
      expect(world4?.name).toBe("Adamantoise");
    });

    it("should handle case sensitivity in data center lookups", async () => {
      const mockDataCenters = [
        {
          name: "Aether",
          region: "na" as const,
          worlds: [
            {
              name: "Adamantoise",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);

      // All these should find the data center
      const dc1 = await client.getDataCenter("Aether");
      const dc2 = await client.getDataCenter("AETHER");
      const dc3 = await client.getDataCenter("aether");
      const dc4 = await client.getDataCenter("  AeThEr  ");

      expect(dc1?.name).toBe("Aether");
      expect(dc2?.name).toBe("Aether");
      expect(dc3?.name).toBe("Aether");
      expect(dc4?.name).toBe("Aether");
    });

    it("should handle regions with no data centers", async () => {
      const mockDataCenters = [
        {
          name: "Aether",
          region: "na" as const,
          worlds: [],
        },
      ];
      vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);

      const naDataCenters = await client.getWorldsByRegion("na");
      expect(naDataCenters).toHaveLength(1);

      const euDataCenters = await client.getWorldsByRegion("eu");
      expect(euDataCenters).toEqual([]);

      const jpDataCenters = await client.getWorldsByRegion("jp");
      expect(jpDataCenters).toEqual([]);

      const ocDataCenters = await client.getWorldsByRegion("oc");
      expect(ocDataCenters).toEqual([]);
    });
  });

  describe("unknown error types", () => {
    it("should handle non-Error objects being thrown", async () => {
      vi.mocked(fetchHtml).mockRejectedValue("String error");

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status: Unknown error",
      );
    });

    it("should handle null/undefined errors", async () => {
      vi.mocked(fetchHtml).mockRejectedValue(null);

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status: Unknown error",
      );
    });

    it("should handle errors without message", async () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = "";
      vi.mocked(fetchHtml).mockRejectedValue(errorWithoutMessage);

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status:",
      );
    });
  });

  describe("real-world error scenarios", () => {
    it("should handle Lodestone maintenance scenarios", async () => {
      const maintenanceHtml = `
        <html>
          <body>
            <div class="maintenance-notice">
              Site is under maintenance
            </div>
          </body>
        </html>
      `;
      vi.mocked(fetchHtml).mockResolvedValue(maintenanceHtml);
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("No world status data found during maintenance");
      });
      vi.mocked(parseWorldStatusGeneric).mockImplementation(() => {
        throw new Error("No parseable world data during maintenance");
      });

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status: No parseable world data during maintenance",
      );
    });

    it("should handle partial data scenarios", async () => {
      const mockDataCenters = [
        {
          name: "Aether",
          region: "na" as const,
          worlds: [
            {
              name: "Adamantoise",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
        {
          name: "Incomplete",
          region: "na" as const,
          worlds: [], // Empty worlds array
        },
      ];
      vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);

      const result = await client.getAllWorlds();
      expect(result).toEqual(mockDataCenters);

      // Should still be able to find worlds in complete data centers
      const world = await client.checkWorldStatus("Adamantoise");
      expect(world?.name).toBe("Adamantoise");
    });
  });
});
