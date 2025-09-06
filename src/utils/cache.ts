import debug from "debug";

const log = debug("lodestone-world-status:cache");

/**
 * Generic cache implementation with expiration support
 */
export class Cache<T> {
  private cachedData: T | null = null;
  private hasValidData: boolean = false;
  private lastFetchTime: number = 0;
  private readonly expirationMs: number;

  constructor(expirationMs: number = 5 * 60 * 1000) {
    this.expirationMs = expirationMs;
    log("Cache initialized with %dms expiration", expirationMs);
  }

  /**
   * Get cached data if it's still valid
   * @returns Cached data or null if expired/empty
   */
  get(): T | null {
    const now = Date.now();
    const isExpired = now - this.lastFetchTime >= this.expirationMs;

    if (this.hasValidData && !isExpired) {
      const ageSeconds = Math.round((now - this.lastFetchTime) / 1000);
      log("Cache hit - returning cached data (age: %ds)", ageSeconds);
      return this.cachedData;
    }

    if (this.hasValidData && isExpired) {
      const ageSeconds = Math.round((now - this.lastFetchTime) / 1000);
      log(
        "Cache expired - data age: %ds (max: %ds)",
        ageSeconds,
        this.expirationMs / 1000,
      );
    } else if (!this.hasValidData) {
      log("Cache miss - no cached data");
    }

    return null;
  }

  /**
   * Set cached data with current timestamp
   * @param data Data to cache
   */
  set(data: T): void {
    this.cachedData = data;
    this.hasValidData = true;
    this.lastFetchTime = Date.now();
    log("Data cached at %d", this.lastFetchTime);
  }

  /**
   * Check if cache has data (regardless of expiration)
   * @returns True if cache has data
   */
  hasData(): boolean {
    return this.hasValidData;
  }

  /**
   * Check if cached data is still valid (not expired)
   * @returns True if cache is valid
   */
  isValid(): boolean {
    if (!this.hasValidData) return false;
    const now = Date.now();
    return now - this.lastFetchTime < this.expirationMs;
  }

  /**
   * Get cache age in milliseconds
   * @returns Age of cached data in ms, or null if no data
   */
  getAge(): number | null {
    if (!this.hasValidData) return null;
    return Date.now() - this.lastFetchTime;
  }

  /**
   * Get remaining time until expiration in milliseconds
   * @returns Time until expiration in ms, or null if no data
   */
  getTimeUntilExpiration(): number | null {
    if (!this.hasValidData) return null;
    const age = this.getAge()!;
    return Math.max(0, this.expirationMs - age);
  }

  /**
   * Clear cached data
   */
  clear(): void {
    log("Cache cleared - next request will fetch fresh data");
    this.cachedData = null;
    this.hasValidData = false;
    this.lastFetchTime = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStats(): {
    hasData: boolean;
    isValid: boolean;
    ageMs: number | null;
    timeUntilExpirationMs: number | null;
    expirationMs: number;
  } {
    return {
      hasData: this.hasData(),
      isValid: this.isValid(),
      ageMs: this.getAge(),
      timeUntilExpirationMs: this.getTimeUntilExpiration(),
      expirationMs: this.expirationMs,
    };
  }
}
