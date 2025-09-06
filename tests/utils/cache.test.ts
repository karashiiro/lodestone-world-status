import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cache } from "../../src/utils/cache.js";

describe("Cache", () => {
  let cache: Cache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new Cache<string>(5000); // 5 second expiration for testing
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should create cache with default expiration", () => {
      const defaultCache = new Cache();
      expect(defaultCache.getStats().expirationMs).toBe(5 * 60 * 1000); // 5 minutes
    });

    it("should create cache with custom expiration", () => {
      const customCache = new Cache(10000);
      expect(customCache.getStats().expirationMs).toBe(10000);
    });
  });

  describe("get and set", () => {
    it("should return null when cache is empty", () => {
      expect(cache.get()).toBeNull();
    });

    it("should return cached data when valid", () => {
      cache.set("test data");
      expect(cache.get()).toBe("test data");
    });

    it("should return cached data multiple times while valid", () => {
      cache.set("test data");
      expect(cache.get()).toBe("test data");
      expect(cache.get()).toBe("test data");
      expect(cache.get()).toBe("test data");
    });
  });

  describe("expiration", () => {
    it("should return cached data before expiration", () => {
      cache.set("test data");

      // Advance time but not past expiration
      vi.advanceTimersByTime(4000); // 4 seconds
      expect(cache.get()).toBe("test data");
    });

    it("should return null after expiration", () => {
      cache.set("test data");

      // Advance time past expiration
      vi.advanceTimersByTime(6000); // 6 seconds (cache expires at 5)
      expect(cache.get()).toBeNull();
    });

    it("should return null exactly at expiration time", () => {
      cache.set("test data");

      // Advance time to exactly expiration time
      vi.advanceTimersByTime(5000); // Exactly 5 seconds
      expect(cache.get()).toBeNull();
    });
  });

  describe("hasData", () => {
    it("should return false when cache is empty", () => {
      expect(cache.hasData()).toBe(false);
    });

    it("should return true when cache has data (even if expired)", () => {
      cache.set("test data");
      expect(cache.hasData()).toBe(true);

      // Even after expiration, hasData should still return true
      vi.advanceTimersByTime(6000);
      expect(cache.hasData()).toBe(true);
    });

    it("should return false after clearing", () => {
      cache.set("test data");
      expect(cache.hasData()).toBe(true);

      cache.clear();
      expect(cache.hasData()).toBe(false);
    });
  });

  describe("isValid", () => {
    it("should return false when cache is empty", () => {
      expect(cache.isValid()).toBe(false);
    });

    it("should return true when cache has valid data", () => {
      cache.set("test data");
      expect(cache.isValid()).toBe(true);
    });

    it("should return false when cache is expired", () => {
      cache.set("test data");
      vi.advanceTimersByTime(6000);
      expect(cache.isValid()).toBe(false);
    });

    it("should return false after clearing", () => {
      cache.set("test data");
      expect(cache.isValid()).toBe(true);

      cache.clear();
      expect(cache.isValid()).toBe(false);
    });
  });

  describe("getAge", () => {
    it("should return null when cache is empty", () => {
      expect(cache.getAge()).toBeNull();
    });

    it("should return 0 immediately after setting", () => {
      cache.set("test data");
      expect(cache.getAge()).toBe(0);
    });

    it("should return correct age after time passes", () => {
      cache.set("test data");
      vi.advanceTimersByTime(3000);
      expect(cache.getAge()).toBe(3000);
    });

    it("should continue returning age even after expiration", () => {
      cache.set("test data");
      vi.advanceTimersByTime(7000);
      expect(cache.getAge()).toBe(7000);
    });
  });

  describe("getTimeUntilExpiration", () => {
    it("should return null when cache is empty", () => {
      expect(cache.getTimeUntilExpiration()).toBeNull();
    });

    it("should return full expiration time immediately after setting", () => {
      cache.set("test data");
      expect(cache.getTimeUntilExpiration()).toBe(5000);
    });

    it("should return decreasing time as expiration approaches", () => {
      cache.set("test data");
      vi.advanceTimersByTime(2000);
      expect(cache.getTimeUntilExpiration()).toBe(3000);
    });

    it("should return 0 when expired", () => {
      cache.set("test data");
      vi.advanceTimersByTime(6000);
      expect(cache.getTimeUntilExpiration()).toBe(0);
    });
  });

  describe("clear", () => {
    it("should clear cached data", () => {
      cache.set("test data");
      expect(cache.hasData()).toBe(true);

      cache.clear();
      expect(cache.hasData()).toBe(false);
      expect(cache.get()).toBeNull();
    });

    it("should reset age after clearing", () => {
      cache.set("test data");
      vi.advanceTimersByTime(3000);
      expect(cache.getAge()).toBe(3000);

      cache.clear();
      expect(cache.getAge()).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return correct stats for empty cache", () => {
      const stats = cache.getStats();
      expect(stats).toEqual({
        hasData: false,
        isValid: false,
        ageMs: null,
        timeUntilExpirationMs: null,
        expirationMs: 5000,
      });
    });

    it("should return correct stats for valid cache", () => {
      cache.set("test data");
      vi.advanceTimersByTime(2000);

      const stats = cache.getStats();
      expect(stats).toEqual({
        hasData: true,
        isValid: true,
        ageMs: 2000,
        timeUntilExpirationMs: 3000,
        expirationMs: 5000,
      });
    });

    it("should return correct stats for expired cache", () => {
      cache.set("test data");
      vi.advanceTimersByTime(6000);

      const stats = cache.getStats();
      expect(stats).toEqual({
        hasData: true,
        isValid: false,
        ageMs: 6000,
        timeUntilExpirationMs: 0,
        expirationMs: 5000,
      });
    });
  });

  describe("complex data types", () => {
    it("should work with objects", () => {
      const objectCache = new Cache<{ name: string; value: number }>(5000);
      const testObj = { name: "test", value: 42 };

      objectCache.set(testObj);
      expect(objectCache.get()).toEqual(testObj);
    });

    it("should work with arrays", () => {
      const arrayCache = new Cache<string[]>(5000);
      const testArray = ["a", "b", "c"];

      arrayCache.set(testArray);
      expect(arrayCache.get()).toEqual(testArray);
    });

    it("should maintain object references", () => {
      const objectCache = new Cache<{ items: string[] }>(5000);
      const testObj = { items: ["a", "b", "c"] };

      objectCache.set(testObj);
      const retrieved = objectCache.get();

      // Should be the same reference
      expect(retrieved).toBe(testObj);
    });
  });

  describe("edge cases", () => {
    it("should handle setting null explicitly", () => {
      const nullCache = new Cache<string | null>(5000);
      nullCache.set(null);

      expect(nullCache.hasData()).toBe(true);
      expect(nullCache.isValid()).toBe(true);
      expect(nullCache.get()).toBeNull();
    });

    it("should handle setting undefined explicitly", () => {
      const undefinedCache = new Cache<string | undefined>(5000);
      undefinedCache.set(undefined);

      expect(undefinedCache.hasData()).toBe(true);
      expect(undefinedCache.isValid()).toBe(true);
      expect(undefinedCache.get()).toBeUndefined();
    });

    it("should handle very short expiration times", () => {
      const shortCache = new Cache<string>(1); // 1ms expiration
      shortCache.set("test");

      vi.advanceTimersByTime(2);
      expect(shortCache.get()).toBeNull();
    });

    it("should reject zero expiration time", () => {
      expect(() => new Cache<string>(0)).toThrow(
        "Cache expiration must be a positive integer, got: 0",
      );
    });
  });
});
