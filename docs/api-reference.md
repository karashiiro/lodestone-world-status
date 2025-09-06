# API Reference

## `LodestoneWorldStatus`

The main class for interacting with Lodestone world status data.

### Methods

#### `checkWorldStatus(worldName: string): Promise<WorldStatus | null>`

Check the status of a specific world.

- **Parameters**:
  - `worldName` - The name of the world (case-insensitive)
- **Returns**: `WorldStatus` object or `null` if not found

#### `getAllWorlds(): Promise<DataCenter[]>`

Get all worlds organized by data center.

- **Returns**: Array of `DataCenter` objects

#### `getAllWorldsFlat(): Promise<WorldStatus[]>`

Get all worlds in a flat array.

- **Returns**: Array of `WorldStatus` objects

#### `getDataCenter(dataCenterName: string): Promise<DataCenter | null>`

Get a specific data center and its worlds.

- **Parameters**:
  - `dataCenterName` - Name of the data center (case-insensitive)
- **Returns**: `DataCenter` object or `null` if not found

#### `getWorldsByRegion(region: 'na' | 'eu' | 'jp' | 'oc'): Promise<DataCenter[]>`

Get all data centers in a specific region.

- **Parameters**:
  - `region` - Region code ('na', 'eu', 'jp', or 'oc')
- **Returns**: Array of `DataCenter` objects in the region

#### `clearCache(): void`

Clear the internal cache to force fresh data on the next request.

## Types

### `WorldStatus`

```typescript
interface WorldStatus {
  name: string;
  status: "online" | "offline" | "maintenance";
  population: "standard" | "preferred" | "congested" | "preferred+" | "new";
  newCharacterCreation: boolean;
}
```

### `DataCenter`

```typescript
interface DataCenter {
  name: string;
  region: "na" | "eu" | "jp" | "oc";
  worlds: WorldStatus[];
}
```

## Caching

The library automatically caches world status data for 5 minutes to reduce load on the Lodestone servers. You can clear the cache manually using `clearCache()` if you need fresh data immediately.

## Error Handling

The library includes robust error handling with automatic fallbacks:

1. **Primary parsing** - Uses specific CSS selectors optimized for Lodestone's structure
2. **Fallback parsing** - Falls back to generic HTML parsing if the structure changes
3. **HTTP errors** - Throws descriptive errors for network issues
4. **Invalid worlds** - Returns `null` for non-existent worlds instead of throwing
