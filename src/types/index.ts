// Branded type for world names to ensure they are properly validated
export type WorldName = string & { readonly __brand: "WorldName" };

// Branded type for data center names
export type DataCenterName = string & { readonly __brand: "DataCenterName" };

// More expressive literal types
export type WorldStatusType =
  | "online"
  | "maintenance"
  | "partial-maintenance"
  | "unknown";
export type PopulationLevel =
  | "standard"
  | "preferred"
  | "congested"
  | "preferred+"
  | "unknown";
export type Region = "na" | "eu" | "jp" | "oc";

export interface WorldStatus {
  readonly name: WorldName;
  readonly status: WorldStatusType;
  readonly population: PopulationLevel;
  readonly newCharacterCreation: boolean;
}

export interface WorldStatusRaw {
  readonly name: string;
  readonly statusText: string;
}

export interface DataCenter {
  readonly name: DataCenterName;
  readonly region: Region;
  readonly worlds: readonly WorldStatus[];
}

// Cache statistics type
export interface CacheStatistics {
  readonly hasData: boolean;
  readonly isValid: boolean;
  readonly ageMs: number | null;
  readonly timeUntilExpirationMs: number | null;
  readonly expirationMs: number;
}

// Status parsing result type
export interface ParsedStatus {
  readonly status: WorldStatusType;
  readonly population: PopulationLevel;
  readonly newCharacterCreation: boolean;
}

// Type guards for branded types
export function isValidWorldName(name: string): name is WorldName {
  const trimmed = name.trim();
  return trimmed.length > 0 && /^[a-zA-Z0-9\s'-]+$/.test(trimmed);
}

export function isValidDataCenterName(name: string): name is DataCenterName {
  const trimmed = name.trim();
  return trimmed.length > 0 && /^[a-zA-Z0-9\s'-]+$/.test(trimmed);
}

// Helper functions to create branded types
export function createWorldName(name: string): WorldName {
  if (!isValidWorldName(name)) {
    throw new Error(`Invalid world name: ${name}`);
  }
  return name as WorldName;
}

export function createDataCenterName(name: string): DataCenterName {
  if (!isValidDataCenterName(name)) {
    throw new Error(`Invalid data center name: ${name}`);
  }
  return name as DataCenterName;
}
