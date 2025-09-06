export * from "./types/index.js";
export * from "./utils/index.js";

import {
  fetchHtml,
  parseWorldStatus,
  parseWorldStatusGeneric,
} from "./utils/scraper.js";
import { WorldStatus, DataCenter } from "./types/index.js";
import { normalizeWorldName } from "./utils/index.js";

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
      return this.cachedData;
    }

    try {
      const html = await fetchHtml(this.worldStatusUrl);

      // Try parsing with specific selectors first, fall back to generic
      let dataCenters: DataCenter[];
      try {
        dataCenters = parseWorldStatus(html);
      } catch (error) {
        // Fallback to generic parsing if specific parsing fails
        dataCenters = parseWorldStatusGeneric(html);
      }

      // Cache the results
      this.cachedData = dataCenters;
      this.lastFetchTime = now;

      return dataCenters;
    } catch (error) {
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
    const dataCenters = await this.fetchWorldStatus();

    for (const dc of dataCenters) {
      for (const world of dc.worlds) {
        if (normalizeWorldName(world.name) === normalizedName) {
          return world;
        }
      }
    }

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
    this.cachedData = null;
    this.lastFetchTime = 0;
  }
}
