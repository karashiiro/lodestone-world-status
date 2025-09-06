export * from "./scraper.js";

/**
 * Utility function to normalize world names for API calls
 * @param worldName The world name to normalize
 * @returns Normalized world name
 */
export function normalizeWorldName(worldName: string): string {
  return worldName.toLowerCase().trim();
}

/**
 * Utility function to validate world names
 * @param worldName The world name to validate
 * @returns Whether the world name is valid
 */
export function isValidWorldName(worldName: string): boolean {
  const trimmed = worldName.trim();
  return trimmed.length > 0 && /^[a-zA-Z\s]+$/.test(trimmed);
}
