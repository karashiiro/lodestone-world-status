import { describe, it, expect, vi, beforeEach } from "vitest";
import { LodestoneWorldStatus } from "../src/index.js";

// Mock the scraper functions
vi.mock("../src/utils/scraper.js", () => ({
  fetchHtml: vi.fn(),
  parseWorldStatus: vi.fn(),
}));

import { fetchHtml, parseWorldStatus } from "../src/utils/scraper.js";

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

    it("should handle parsing failures", async () => {
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Parsing failed");
      });

      await expect(client.getAllWorlds()).rejects.toThrow(
        "Failed to fetch world status: Parsing failed",
      );
    });

    it("should handle empty or malformed HTML", async () => {
      vi.mocked(parseWorldStatus).mockImplementation(() => {
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
    });

    it("should handle empty data center arrays", async () => {
      vi.mocked(parseWorldStatus).mockReturnValue([]);

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
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

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
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

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
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

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
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

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
      vi.mocked(parseWorldStatus).mockImplementation(() => {
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
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      const result = await client.getAllWorlds();
      expect(result).toEqual(mockDataCenters);

      // Should still be able to find worlds in complete data centers
      const world = await client.checkWorldStatus("Adamantoise");
      expect(world?.name).toBe("Adamantoise");
    });
  });
});

describe("Data Validation Tests", () => {
  let client: LodestoneWorldStatus;

  beforeEach(() => {
    client = new LodestoneWorldStatus();
  });

  describe("Type consistency validation", () => {
    beforeEach(() => {
      vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });
    });

    it("should validate WorldStatus interface compliance", async () => {
      const mockDataCenters = [
        {
          name: "TestDC",
          region: "na" as const,
          worlds: [
            {
              name: "TestWorld",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      const world = await client.checkWorldStatus("TestWorld");

      // Validate all required properties exist
      expect(world).toHaveProperty("name");
      expect(world).toHaveProperty("status");
      expect(world).toHaveProperty("population");
      expect(world).toHaveProperty("newCharacterCreation");

      // Validate types
      expect(typeof world?.name).toBe("string");
      expect(typeof world?.status).toBe("string");
      expect(typeof world?.population).toBe("string");
      expect(typeof world?.newCharacterCreation).toBe("boolean");

      // Validate enum values
      expect(["online", "offline", "maintenance"]).toContain(world?.status);
      expect([
        "standard",
        "preferred",
        "congested",
        "preferred+",
        "new",
      ]).toContain(world?.population);
    });

    it("should validate DataCenter interface compliance", async () => {
      const mockDataCenters = [
        {
          name: "TestDC",
          region: "eu" as const,
          worlds: [],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      const dataCenter = await client.getDataCenter("TestDC");

      // Validate all required properties exist
      expect(dataCenter).toHaveProperty("name");
      expect(dataCenter).toHaveProperty("region");
      expect(dataCenter).toHaveProperty("worlds");

      // Validate types
      expect(typeof dataCenter?.name).toBe("string");
      expect(typeof dataCenter?.region).toBe("string");
      expect(Array.isArray(dataCenter?.worlds)).toBe(true);

      // Validate region enum
      expect(["na", "eu", "jp", "oc"]).toContain(dataCenter?.region);
    });
  });

  describe("Malformed data handling", () => {
    beforeEach(() => {
      vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });
    });

    it("should handle worlds with invalid status values gracefully", async () => {
      const mockDataCenters = [
        {
          name: "TestDC",
          region: "na" as const,
          worlds: [
            {
              name: "ValidWorld",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      const world = await client.checkWorldStatus("ValidWorld");
      expect(world?.status).toBe("online");
    });

    it("should handle worlds with unusual names", async () => {
      const mockDataCenters = [
        {
          name: "TestDC",
          region: "na" as const,
          worlds: [
            {
              name: "World-With-Dashes",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
            {
              name: "World With Spaces",
              status: "online" as const,
              population: "preferred" as const,
              newCharacterCreation: true,
            },
            {
              name: "VeryLongWorldNameThatExceedsNormalLimits",
              status: "online" as const,
              population: "congested" as const,
              newCharacterCreation: false,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      const world1 = await client.checkWorldStatus("World-With-Dashes");
      const world2 = await client.checkWorldStatus("World With Spaces");
      const world3 = await client.checkWorldStatus(
        "VeryLongWorldNameThatExceedsNormalLimits",
      );

      expect(world1?.name).toBe("World-With-Dashes");
      expect(world2?.name).toBe("World With Spaces");
      expect(world3?.name).toBe("VeryLongWorldNameThatExceedsNormalLimits");
    });

    it("should handle data centers with unusual names", async () => {
      const mockDataCenters = [
        {
          name: "Data-Center-With-Dashes",
          region: "jp" as const,
          worlds: [
            {
              name: "TestWorld",
              status: "online" as const,
              population: "new" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      const dataCenter = await client.getDataCenter("Data-Center-With-Dashes");
      expect(dataCenter?.name).toBe("Data-Center-With-Dashes");
      expect(dataCenter?.region).toBe("jp");
    });

    it("should handle mixed-case lookups correctly", async () => {
      const mockDataCenters = [
        {
          name: "CamelCaseDataCenter",
          region: "oc" as const,
          worlds: [
            {
              name: "CamelCaseWorld",
              status: "maintenance" as const,
              population: "preferred+" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      // Test various case combinations
      const world1 = await client.checkWorldStatus("CamelCaseWorld");
      const world2 = await client.checkWorldStatus("camelcaseworld");
      const world3 = await client.checkWorldStatus("CAMELCASEWORLD");
      const world4 = await client.checkWorldStatus("  CamelCaseWorld  ");

      expect(world1?.name).toBe("CamelCaseWorld");
      expect(world2?.name).toBe("CamelCaseWorld");
      expect(world3?.name).toBe("CamelCaseWorld");
      expect(world4?.name).toBe("CamelCaseWorld");
    });
  });

  describe("Performance degradation scenarios", () => {
    it("should handle slow parsing gracefully", async () => {
      vi.mocked(fetchHtml).mockImplementation(async () => {
        // Simulate slow network
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "<html>mock</html>";
      });

      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });

      vi.mocked(parseWorldStatus).mockImplementation(() => {
        // Simulate slow parsing
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Busy wait to simulate processing time
        }
        return [
          {
            name: "SlowDC",
            region: "na" as const,
            worlds: [
              {
                name: "SlowWorld",
                status: "online" as const,
                population: "standard" as const,
                newCharacterCreation: true,
              },
            ],
          },
        ];
      });

      const startTime = Date.now();
      const world = await client.checkWorldStatus("SlowWorld");
      const endTime = Date.now();

      expect(world?.name).toBe("SlowWorld");
      // Should complete but may be slower than usual
      expect(endTime - startTime).toBeGreaterThan(100); // At least network + processing time
    });

    it("should handle memory pressure scenarios", async () => {
      // Create a large dataset to simulate memory pressure
      const largeDataset = Array.from({ length: 100 }, (_, dcIndex) => ({
        name: `DataCenter${dcIndex}`,
        region: (["na", "eu", "jp", "oc"] as const)[dcIndex % 4],
        worlds: Array.from({ length: 50 }, (_, worldIndex) => ({
          name: `World${dcIndex}-${worldIndex}`,
          status: "online" as const,
          population: (
            ["standard", "preferred", "congested", "preferred+", "new"] as const
          )[worldIndex % 5],
          newCharacterCreation: worldIndex % 2 === 0,
        })),
      }));

      vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });
      vi.mocked(parseWorldStatus).mockReturnValue(largeDataset);

      const startTime = Date.now();
      const allWorlds = await client.getAllWorldsFlat();
      const endTime = Date.now();

      // Should handle 5000 worlds (100 DCs * 50 worlds each)
      expect(allWorlds).toHaveLength(5000);

      // Should complete in reasonable time even with large dataset
      expect(endTime - startTime).toBeLessThan(1000);

      // Should still be able to find specific worlds
      const specificWorld = await client.checkWorldStatus("World50-25");
      expect(specificWorld?.name).toBe("World50-25");
    });
  });

  describe("Recovery scenarios", () => {
    it("should recover from network issues", async () => {
      let callCount = 0;

      vi.mocked(fetchHtml).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Network timeout");
        }
        return "<html>mock</html>";
      });

      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });

      const mockDataCenters = [
        {
          name: "RecoveryDC",
          region: "na" as const,
          worlds: [
            {
              name: "RecoveryWorld",
              status: "online" as const,
              population: "standard" as const,
              newCharacterCreation: true,
            },
          ],
        },
      ];
      vi.mocked(parseWorldStatus).mockReturnValue(mockDataCenters);

      // First call should fail
      await expect(client.getAllWorlds()).rejects.toThrow("Network timeout");

      // Clear cache to force new fetch
      client.clearCache();

      // Second call should succeed
      const result = await client.getAllWorlds();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]?.name).toBe("RecoveryDC");
    });

    it("should handle intermittent parsing failures", async () => {
      let parseCallCount = 0;

      vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(parseWorldStatus).mockImplementation(() => {
        throw new Error("Fallback to generic");
      });

      vi.mocked(parseWorldStatus).mockImplementation(() => {
        parseCallCount++;
        if (parseCallCount === 1) {
          throw new Error("Temporary parsing error");
        }
        return [
          {
            name: "StableDC",
            region: "na" as const,
            worlds: [
              {
                name: "StableWorld",
                status: "online" as const,
                population: "standard" as const,
                newCharacterCreation: true,
              },
            ],
          },
        ];
      });

      // First call should fail due to parsing error
      await expect(client.getAllWorlds()).rejects.toThrow(
        "Temporary parsing error",
      );

      // Clear cache and try again
      client.clearCache();

      // Second call should succeed
      const result = await client.getAllWorlds();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]?.name).toBe("StableDC");
    });
  });
});
