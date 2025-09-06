#!/usr/bin/env node

// Basic usage example
// This shows how to actually use the library in a real scenario

import { LodestoneWorldStatus } from "lodestone-world-status";

async function main() {
  console.log("🎮 Basic usage example for Lodestone World Status");
  console.log("===============================================\n");

  try {
    // Create a client with 5 minute cache
    const client = new LodestoneWorldStatus(5 * 60 * 1000);

    console.log("📋 Example 1: Check specific world status");
    console.log("------------------------------------------");

    // Note: This will make a real network request to Lodestone
    console.log("Looking up world: Excalibur...");
    const world = await client.checkWorldStatus("Excalibur");

    if (world) {
      console.log(`✅ Found world: ${world.name}`);
      console.log(`   Status: ${world.status}`);
      console.log(`   Population: ${world.population}`);
      console.log(
        `   New Character Creation: ${world.newCharacterCreation ? "Allowed" : "Restricted"}`,
      );
    } else {
      console.log("❌ World not found");
    }

    console.log("\n📋 Example 2: Get worlds by region");
    console.log("-----------------------------------");

    console.log("Getting North American data centers...");
    const naDataCenters = await client.getWorldsByRegion("na");
    console.log(
      `✅ Found ${naDataCenters.length} North American data centers:`,
    );

    for (const dc of naDataCenters.slice(0, 2)) {
      // Show first 2 for brevity
      console.log(`   📍 ${dc.name}: ${dc.worlds.length} worlds`);
    }

    console.log("\n📋 Example 3: Cache statistics");
    console.log("------------------------------");

    const stats = client.getCacheStats();
    console.log(`✅ Cache info:`);
    console.log(`   Has data: ${stats.hasData}`);
    console.log(`   Is valid: ${stats.isValid}`);
    console.log(`   Expiration: ${stats.expirationMs}ms`);
    if (stats.ageMs !== null) {
      console.log(`   Age: ${Math.round(stats.ageMs / 1000)}s`);
    }

    console.log("\n🎉 All examples completed successfully!");
  } catch (error) {
    console.error("❌ Example failed:", error.message);
    console.log(
      "\n💡 Note: This example requires internet access to fetch data from Lodestone",
    );
    process.exit(1);
  }
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node basic-usage.mjs");
  console.log("");
  console.log(
    "This example demonstrates basic usage of lodestone-world-status",
  );
  console.log(
    "Requires internet access to fetch real data from Final Fantasy XIV Lodestone",
  );
  process.exit(0);
}

main().catch(console.error);
