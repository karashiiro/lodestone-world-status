import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

describe("Cache Integration Tests", () => {
  let client: LodestoneWorldStatus;
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
        {
          name: "Cactuar",
          status: "online" as const,
          population: "congested" as const,
          newCharacterCreation: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    client = new LodestoneWorldStatus(5000); // 5 second cache for testing

    // Setup mocks
    vi.mocked(fetchHtml).mockResolvedValue("<html>mock</html>");
    vi.mocked(parseWorldStatus).mockImplementation(() => {
      throw new Error("Specific selectors not found");
    });
    vi.mocked(parseWorldStatusGeneric).mockReturnValue(mockDataCenters);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("caching behavior", () => {
    it("should cache data after first fetch", async () => {
      const result1 = await client.getAllWorlds();
      expect(result1).toEqual(mockDataCenters);
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await client.getAllWorlds();
      expect(result2).toEqual(mockDataCenters);
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1); // Still only called once
    });

    it("should return same object reference from cache", async () => {
      const result1 = await client.getAllWorlds();
      const result2 = await client.getAllWorlds();
      expect(result1).toBe(result2); // Same reference
    });

    it("should fetch fresh data after cache expires", async () => {
      // First fetch
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1);

      // Advance time past cache expiration
      vi.advanceTimersByTime(6000); // 6 seconds (cache expires at 5)

      // Second fetch should hit API again
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(2);
    });

    it("should use cache for all methods that fetch world status", async () => {
      // First call through getAllWorlds
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1);

      // All subsequent calls should use cache
      await client.getAllWorldsFlat();
      await client.checkWorldStatus("Adamantoise");
      await client.getDataCenter("Aether");
      await client.getWorldsByRegion("na");

      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1); // Still only called once
    });

    it("should clear cache and fetch fresh data", async () => {
      // First fetch
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1);

      // Clear cache
      client.clearCache();

      // Next fetch should hit API again
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(2);
    });
  });

  describe("cache statistics", () => {
    it("should report correct cache stats when empty", () => {
      const stats = client.getCacheStats();
      expect(stats.hasData).toBe(false);
      expect(stats.isValid).toBe(false);
      expect(stats.ageMs).toBeNull();
    });

    it("should report correct cache stats after caching data", async () => {
      await client.getAllWorlds();
      vi.advanceTimersByTime(2000); // 2 seconds

      const stats = client.getCacheStats();
      expect(stats.hasData).toBe(true);
      expect(stats.isValid).toBe(true);
      expect(stats.ageMs).toBe(2000);
      expect(stats.timeUntilExpirationMs).toBe(3000);
    });

    it("should report correct cache stats after expiration", async () => {
      await client.getAllWorlds();
      vi.advanceTimersByTime(6000); // 6 seconds (expired)

      const stats = client.getCacheStats();
      expect(stats.hasData).toBe(true);
      expect(stats.isValid).toBe(false);
      expect(stats.ageMs).toBe(6000);
      expect(stats.timeUntilExpirationMs).toBe(0);
    });
  });

  describe("custom cache expiration", () => {
    it("should respect custom cache expiration time", async () => {
      const shortCacheClient = new LodestoneWorldStatus(1000); // 1 second cache

      // Setup mocks for this client too
      await shortCacheClient.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1);

      // Advance time past the shorter expiration
      vi.advanceTimersByTime(1500); // 1.5 seconds

      await shortCacheClient.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(2); // Should have fetched again
    });

    it("should reject zero cache expiration", () => {
      expect(() => new LodestoneWorldStatus(0)).toThrow(
        "Cache expiration must be a positive integer, got: 0",
      );
    });
  });

  describe("error handling with cache", () => {
    it("should not cache data when fetch fails", async () => {
      vi.mocked(fetchHtml).mockRejectedValueOnce(new Error("Network error"));

      // First call should fail
      await expect(client.getAllWorlds()).rejects.toThrow("Network error");

      // Cache should be empty
      const stats = client.getCacheStats();
      expect(stats.hasData).toBe(false);

      // Fix the mock and try again
      vi.mocked(fetchHtml).mockResolvedValueOnce("<html>mock</html>");

      // Should fetch again (not from cache)
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(2);
    });

    it("should not cache data when parsing fails", async () => {
      vi.mocked(parseWorldStatusGeneric).mockImplementationOnce(() => {
        throw new Error("Parse error");
      });

      // First call should fail
      await expect(client.getAllWorlds()).rejects.toThrow("Parse error");

      // Cache should be empty
      const stats = client.getCacheStats();
      expect(stats.hasData).toBe(false);
    });

    it("should use cached data when available even if new fetch would fail", async () => {
      // First successful fetch
      await client.getAllWorlds();
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1);

      // Now make fetchHtml fail, but cache should still work
      vi.mocked(fetchHtml).mockRejectedValue(new Error("Network down"));

      // Should still return cached data
      const result = await client.getAllWorlds();
      expect(result).toEqual(mockDataCenters);
      expect(vi.mocked(fetchHtml)).toHaveBeenCalledTimes(1); // No additional calls
    });
  });
});
