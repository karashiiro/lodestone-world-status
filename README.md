# Lodestone World Status

A TypeScript library for fetching and parsing world status information from the Final Fantasy XIV Lodestone.

## Features

- **Real-time world status** - Fetches live data from the official Lodestone
- **Robust parsing** - Automatic fallback between specific and generic HTML selectors
- **Smart caching** - 5-minute cache to minimize API calls
- **TypeScript support** - Full type definitions included
- **Region filtering** - Filter worlds by region (NA, EU, JP, OC)
- **Debug logging** - Detailed logging for troubleshooting
- **Comprehensive testing** - Unit and integration tests included

## Installation

```bash
npm install lodestone-world-status
# or
pnpm add lodestone-world-status
# or
yarn add lodestone-world-status
```

## Quick Start

```typescript
import { LodestoneWorldStatus } from "lodestone-world-status";

const client = new LodestoneWorldStatus();

// Check a specific world's status
const world = await client.checkWorldStatus("Adamantoise");
console.log(world);
// Output: {
//   name: 'Adamantoise',
//   status: 'online',
//   population: 'congested',
//   newCharacterCreation: false
// }

// Get all worlds organized by data center
const allWorlds = await client.getAllWorlds();
console.log(`Found ${allWorlds.length} data centers`);

// Get worlds by region
const naWorlds = await client.getWorldsByRegion("na");
console.log(`North America has ${naWorlds.length} data centers`);
```

## Documentation

- **[API Reference](docs/api-reference.md)** - Complete API documentation and type definitions
- **[Examples](docs/examples.md)** - Practical usage examples and common patterns
- **[Debug Logging](docs/debug-logging.md)** - Troubleshooting and debugging guide

## Quick Debug

Enable debug logging to see what's happening:

```bash
DEBUG="lodestone-world-status*" node your-script.js
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint

# Format code
pnpm format
```
