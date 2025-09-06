# Examples

## Basic Usage

### Check a Single World

```typescript
import { LodestoneWorldStatus } from "lodestone-world-status";

const client = new LodestoneWorldStatus();

const world = await client.checkWorldStatus("Adamantoise");
if (world) {
  console.log(`${world.name}: ${world.population} (${world.status})`);
  console.log(`New character creation: ${world.newCharacterCreation}`);
} else {
  console.log("World not found");
}
```

### Get All Worlds

```typescript
const client = new LodestoneWorldStatus();

// Get all worlds organized by data center
const dataCenters = await client.getAllWorlds();
dataCenters.forEach((dc) => {
  console.log(
    `${dc.name} (${dc.region.toUpperCase()}): ${dc.worlds.length} worlds`,
  );
});

// Get all worlds in a flat array
const allWorlds = await client.getAllWorldsFlat();
console.log(`Total worlds: ${allWorlds.length}`);
```

## Advanced Usage

### Check Multiple Worlds

```typescript
const client = new LodestoneWorldStatus();

const worlds = ["Adamantoise", "Excalibur", "Cactuar"];
const results = await Promise.all(
  worlds.map((name) => client.checkWorldStatus(name)),
);

results.forEach((world, index) => {
  if (world) {
    console.log(`${worlds[index]}: ${world.population} (${world.status})`);
  } else {
    console.log(`${worlds[index]}: Not found`);
  }
});
```

### Find All Preferred Worlds

```typescript
const client = new LodestoneWorldStatus();

const allWorlds = await client.getAllWorldsFlat();
const preferredWorlds = allWorlds.filter(
  (world) =>
    world.population === "preferred" || world.population === "preferred+",
);

console.log("Preferred worlds for new characters:");
preferredWorlds.forEach((world) => {
  console.log(`- ${world.name}: ${world.population}`);
});
```

### Get Worlds by Region

```typescript
const client = new LodestoneWorldStatus();

// Get North American worlds
const naWorlds = await client.getWorldsByRegion("na");
console.log("North American Data Centers:");
naWorlds.forEach((dc) => {
  console.log(`  ${dc.name}: ${dc.worlds.length} worlds`);
});

// Get European worlds
const euWorlds = await client.getWorldsByRegion("eu");
console.log("European Data Centers:");
euWorlds.forEach((dc) => {
  console.log(`  ${dc.name}: ${dc.worlds.length} worlds`);
});
```

### Get Specific Data Center

```typescript
const client = new LodestoneWorldStatus();

const aether = await client.getDataCenter("Aether");
if (aether) {
  console.log(`${aether.name} Data Center (${aether.region.toUpperCase()}):`);
  aether.worlds.forEach((world) => {
    console.log(
      `  ${world.name}: ${world.population} - New chars: ${world.newCharacterCreation}`,
    );
  });
}
```

## Monitoring and Automation

### Monitor World Status Changes

```typescript
const client = new LodestoneWorldStatus();

async function checkWorldPeriodically(worldName: string, intervalMinutes = 10) {
  const world = await client.checkWorldStatus(worldName);
  const timestamp = new Date().toISOString();

  console.log(
    `[${timestamp}] ${worldName}: ${world?.population} - New chars: ${world?.newCharacterCreation}`,
  );

  // Clear cache and check again after interval
  setTimeout(
    () => {
      client.clearCache();
      checkWorldPeriodically(worldName, intervalMinutes);
    },
    intervalMinutes * 60 * 1000,
  );
}

// Monitor Balmung every 10 minutes
checkWorldPeriodically("Balmung", 10);
```

### Find Worlds with Character Creation Available

```typescript
const client = new LodestoneWorldStatus();

async function findAvailableWorlds(region?: "na" | "eu" | "jp" | "oc") {
  const dataCenters = region
    ? await client.getWorldsByRegion(region)
    : await client.getAllWorlds();

  const availableWorlds = dataCenters
    .flatMap((dc) => dc.worlds)
    .filter((world) => world.newCharacterCreation);

  console.log(`Worlds with character creation available:`);
  availableWorlds.forEach((world) => {
    console.log(`  ${world.name}: ${world.population}`);
  });

  return availableWorlds;
}

// Find available worlds in North America
await findAvailableWorlds("na");
```

### Create a Status Dashboard

```typescript
const client = new LodestoneWorldStatus();

async function createStatusDashboard() {
  const dataCenters = await client.getAllWorlds();
  const totalWorlds = dataCenters.reduce(
    (sum, dc) => sum + dc.worlds.length,
    0,
  );

  console.log("=== FFXIV World Status Dashboard ===");
  console.log(`Total Worlds: ${totalWorlds}`);
  console.log(`Last Updated: ${new Date().toLocaleString()}`);
  console.log("");

  // Group by region
  const regions = {
    na: dataCenters.filter((dc) => dc.region === "na"),
    eu: dataCenters.filter((dc) => dc.region === "eu"),
    jp: dataCenters.filter((dc) => dc.region === "jp"),
    oc: dataCenters.filter((dc) => dc.region === "oc"),
  };

  Object.entries(regions).forEach(([region, dcs]) => {
    if (dcs.length === 0) return;

    console.log(`${region.toUpperCase()} Region:`);
    dcs.forEach((dc) => {
      const congestedCount = dc.worlds.filter(
        (w) => w.population === "congested",
      ).length;
      const preferredCount = dc.worlds.filter((w) =>
        ["preferred", "preferred+"].includes(w.population),
      ).length;

      console.log(
        `  ${dc.name}: ${dc.worlds.length} worlds (${congestedCount} congested, ${preferredCount} preferred)`,
      );
    });
    console.log("");
  });
}

// Run dashboard
await createStatusDashboard();
```

## Error Handling

### Handling Network Issues

```typescript
const client = new LodestoneWorldStatus();

async function robustWorldCheck(worldName: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const world = await client.checkWorldStatus(worldName);
      return world;
    } catch (error) {
      console.warn(
        `Attempt ${attempt} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      if (attempt === maxRetries) {
        console.error(
          `Failed to check ${worldName} after ${maxRetries} attempts`,
        );
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );

      // Clear cache before retry
      client.clearCache();
    }
  }
}

// Use with error handling
try {
  const world = await robustWorldCheck("Excalibur");
  console.log(world ? `${world.name}: ${world.population}` : "World not found");
} catch (error) {
  console.error("Failed to get world status:", error);
}
```

### Timeout Protection

```typescript
const client = new LodestoneWorldStatus();

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Operation timed out")), timeoutMs),
  );

  return Promise.race([promise, timeoutPromise]);
}

// Check world with 10-second timeout
try {
  const world = await withTimeout(
    client.checkWorldStatus("Adamantoise"),
    10000,
  );
  console.log(world ? `${world.name}: ${world.population}` : "World not found");
} catch (error) {
  if (error instanceof Error && error.message === "Operation timed out") {
    console.error("Request timed out - Lodestone may be slow");
  } else {
    console.error("Error:", error);
  }
}
```
