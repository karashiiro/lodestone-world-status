#!/usr/bin/env node

// ES Module import example
// This tests that the package can be imported using import/export syntax

import { LodestoneWorldStatus } from "lodestone-world-status";

async function main() {
  console.log("🔍 Testing ES Module import...");

  try {
    // Create client instance
    const client = new LodestoneWorldStatus();
    console.log("✅ LodestoneWorldStatus class imported successfully");

    // Test basic functionality
    console.log("📊 Testing basic functionality...");

    // Test cache stats to verify the instance works
    const stats = client.getCacheStats();
    console.log("✅ getCacheStats() works:", {
      hasData: stats.hasData,
      isValid: stats.isValid,
      expirationMs: stats.expirationMs,
    });

    // Test method signatures exist
    console.log("🔧 Testing method availability...");
    console.log(
      "✅ fetchWorldStatus method exists:",
      typeof client.fetchWorldStatus === "function",
    );
    console.log(
      "✅ checkWorldStatus method exists:",
      typeof client.checkWorldStatus === "function",
    );
    console.log(
      "✅ getAllWorlds method exists:",
      typeof client.getAllWorlds === "function",
    );
    console.log(
      "✅ getAllWorldsFlat method exists:",
      typeof client.getAllWorldsFlat === "function",
    );
    console.log(
      "✅ getDataCenter method exists:",
      typeof client.getDataCenter === "function",
    );
    console.log(
      "✅ getWorldsByRegion method exists:",
      typeof client.getWorldsByRegion === "function",
    );
    console.log(
      "✅ clearCache method exists:",
      typeof client.clearCache === "function",
    );

    console.log("🎉 ES Module import test completed successfully!");
  } catch (error) {
    console.error("❌ ES Module import test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
