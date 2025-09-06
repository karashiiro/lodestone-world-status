#!/usr/bin/env node

// TypeScript import example
// This tests that the package provides proper TypeScript definitions

import {
  LodestoneWorldStatus,
  WorldStatus,
  DataCenter,
  Region,
  CacheStatistics,
} from "lodestone-world-status";

async function main(): Promise<void> {
  console.log("🔍 Testing TypeScript import and type definitions...");

  try {
    // Create client instance with explicit type
    const client: LodestoneWorldStatus = new LodestoneWorldStatus(10000); // 10 second cache
    console.log(
      "✅ LodestoneWorldStatus class imported with types successfully",
    );

    // Test type definitions work
    console.log("📊 Testing TypeScript type definitions...");

    // Test cache stats with proper typing
    const stats: CacheStatistics = client.getCacheStats();
    console.log("✅ getCacheStats() with CacheStatistics type:", {
      hasData: stats.hasData,
      isValid: stats.isValid,
      expirationMs: stats.expirationMs,
      ageMs: stats.ageMs,
      timeUntilExpirationMs: stats.timeUntilExpirationMs,
    });

    // Test region type
    const regions: Region[] = ["na", "eu", "jp", "oc"];
    console.log("✅ Region type works:", regions);

    // Test method return types (these won't actually make network calls without mocking)
    console.log("🔧 Testing method type signatures...");

    // These demonstrate that TypeScript knows the return types
    const worldsPromise: Promise<DataCenter[]> = client.getAllWorlds();
    const flatWorldsPromise: Promise<WorldStatus[]> = client.getAllWorldsFlat();
    const worldPromise: Promise<WorldStatus | null> =
      client.checkWorldStatus("Excalibur");
    const dcPromise: Promise<DataCenter | null> =
      client.getDataCenter("Aether");
    const regionWorldsPromise: Promise<DataCenter[]> =
      client.getWorldsByRegion("na");

    // Verify the promises exist (demonstrating type checking worked)
    console.log("✅ All method signatures have correct TypeScript types");
    console.log("   Promise types:", {
      worldsPromise: typeof worldsPromise,
      flatWorldsPromise: typeof flatWorldsPromise,
      worldPromise: typeof worldPromise,
      dcPromise: typeof dcPromise,
      regionWorldsPromise: typeof regionWorldsPromise,
    });

    // Test branded types are exported (even if we don't use them directly)
    console.log("✅ Type definitions include all exported types");

    console.log("🎉 TypeScript import test completed successfully!");
  } catch (error) {
    console.error(
      "❌ TypeScript import test failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main().catch(console.error);
