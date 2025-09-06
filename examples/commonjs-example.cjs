#!/usr/bin/env node

// CommonJS import example
// This tests that the package can be imported from CommonJS using dynamic import()
// Note: Since this package is ESM-only ("type": "module"), we need to use dynamic import()

async function main() {
  console.log("🔍 Testing CommonJS dynamic import...");

  try {
    // Dynamic import for ESM package from CommonJS
    const { LodestoneWorldStatus } = await import("lodestone-world-status");

    // Create client instance
    const client = new LodestoneWorldStatus();
    console.log("✅ LodestoneWorldStatus class imported successfully");

    // Test basic functionality (will use cached mock data if tests were run)
    console.log("📊 Testing basic functionality...");

    // Test cache stats to verify the instance works
    const stats = client.getCacheStats();
    console.log("✅ getCacheStats() works:", {
      hasData: stats.hasData,
      isValid: stats.isValid,
      expirationMs: stats.expirationMs,
    });

    console.log("🎉 CommonJS dynamic import test completed successfully!");
  } catch (error) {
    console.error("❌ CommonJS dynamic import test failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
