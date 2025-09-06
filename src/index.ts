export * from "./types/index.js";
export * from "./utils/index.js";

import debug from "debug";
import {
  fetchHtml,
  parseWorldStatus,
  parseWorldStatusGeneric,
} from "./utils/scraper.js";
import { WorldStatus, DataCenter } from "./types/index.js";
import { normalizeWorldName } from "./utils/index.js";

const log = debug("lodestone-world-status");

/**
 * Main library functionality for checking Lodestone world status
 */
export class LodestoneWorldStatus {
  private baseUrl = "https://na.finalfantasyxiv.com/lodestone";
  private worldStatusUrl = `${this.baseUrl}/worldstatus/`;

  private cachedData: DataCenter[] | null = null;
  private lastFetchTime: number = 0;
  private cacheExpirationMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetches fresh world status data from Lodestone
   * @returns Promise resolving to array of data centers with world status
   */
  async fetchWorldStatus(): Promise<DataCenter[]> {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (this.cachedData && now - this.lastFetchTime < this.cacheExpirationMs) {
      const cacheAge = Math.round((now - this.lastFetchTime) / 1000);
      log("Cache hit - returning cached data (age: %ds)", cacheAge);
      return this.cachedData;
    }

    log("Cache miss - fetching fresh data from %s", this.worldStatusUrl);

    try {
      const html = await fetchHtml(this.worldStatusUrl);
      log("Successfully fetched HTML (%d characters)", html.length);

      // Try parsing with specific selectors first, fall back to generic
      let dataCenters: DataCenter[];
      try {
        log("Attempting to parse with specific selectors");
        dataCenters = parseWorldStatus(html);
        log(
          "Successfully parsed with specific selectors: %d data centers",
          dataCenters.length,
        );
      } catch (specificError) {
        log(
          "Specific selector parsing failed: %s",
          specificError instanceof Error
            ? specificError.message
            : "Unknown error",
        );
        log("Falling back to generic parsing");
        dataCenters = parseWorldStatusGeneric(html);
        log(
          "Successfully parsed with generic selectors: %d data centers",
          dataCenters.length,
        );
      }

      // Cache the results
      this.cachedData = dataCenters;
      this.lastFetchTime = now;

      const totalWorlds = dataCenters.reduce(
        (sum, dc) => sum + dc.worlds.length,
        0,
      );
      log(
        "Cached %d data centers with %d total worlds",
        dataCenters.length,
        totalWorlds,
      );

      return dataCenters;
    } catch (error) {
      log(
        "Failed to fetch world status: %s",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw new Error(
        `Failed to fetch world status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check the status of a specific world
   * @param worldName The name of the world to check
   * @returns Promise resolving to world status information, or null if not found
   */
  async checkWorldStatus(worldName: string): Promise<WorldStatus | null> {
    const normalizedName = normalizeWorldName(worldName);
    log(
      "Looking up world status for: %s (normalized: %s)",
      worldName,
      normalizedName,
    );

    const dataCenters = await this.fetchWorldStatus();

    for (const dc of dataCenters) {
      for (const world of dc.worlds) {
        if (normalizeWorldName(world.name) === normalizedName) {
          log(
            "Found world %s in data center %s: %s (%s)",
            world.name,
            dc.name,
            world.population,
            world.status,
          );
          return world;
        }
      }
    }

    log("World %s not found in any data center", worldName);
    return null;
  }

  /**
   * Get all available worlds organized by data center
   * @returns Promise resolving to array of data centers with worlds
   */
  async getAllWorlds(): Promise<DataCenter[]> {
    return this.fetchWorldStatus();
  }

  /**
   * Get all worlds in a flat array
   * @returns Promise resolving to array of all worlds
   */
  async getAllWorldsFlat(): Promise<WorldStatus[]> {
    const dataCenters = await this.fetchWorldStatus();
    return dataCenters.flatMap((dc) => dc.worlds);
  }

  /**
   * Get worlds by data center name
   * @param dataCenterName The name of the data center
   * @returns Promise resolving to data center info with worlds, or null if not found
   */
  async getDataCenter(dataCenterName: string): Promise<DataCenter | null> {
    const normalizedName = normalizeWorldName(dataCenterName);
    const dataCenters = await this.fetchWorldStatus();

    for (const dc of dataCenters) {
      if (normalizeWorldName(dc.name) === normalizedName) {
        return dc;
      }
    }

    return null;
  }

  /**
   * Get worlds by region
   * @param region The region to filter by
   * @returns Promise resolving to array of data centers in the region
   */
  async getWorldsByRegion(
    region: "na" | "eu" | "jp" | "oc",
  ): Promise<DataCenter[]> {
    const dataCenters = await this.fetchWorldStatus();
    return dataCenters.filter((dc) => dc.region === region);
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  clearCache(): void {
    log("Cache cleared - next request will fetch fresh data");
    this.cachedData = null;
    this.lastFetchTime = 0;
  }
}
