export * from "./scraper.js";
export * from "./cache.js";

/**
 * Utility function to normalize world names for API calls
 * @param worldName The world name to normalize
 * @returns Normalized world name
 */
export function normalizeWorldName(worldName: string): string {
  return worldName.toLowerCase().trim();
}
