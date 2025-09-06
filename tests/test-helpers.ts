import type { DataCenter, WorldStatus } from "../src/types/index.js";
import { createWorldName, createDataCenterName } from "../src/types/index.js";

/**
 * Helper function to create test data center objects with proper branded types
 */
export function createTestDataCenter(
  name: string,
  region: "na" | "eu" | "jp" | "oc" = "na",
  worlds: Array<{
    name: string;
    status: "online" | "offline" | "maintenance";
    population: "standard" | "preferred" | "congested" | "preferred+" | "new";
    newCharacterCreation: boolean;
  }> = [],
): DataCenter {
  return {
    name: createDataCenterName(name),
    region,
    worlds: worlds.map((world) => ({
      name: createWorldName(world.name),
      status: world.status,
      population: world.population,
      newCharacterCreation: world.newCharacterCreation,
    })),
  };
}

/**
 * Helper function to create test world status objects with proper branded types
 */
export function createTestWorld(
  name: string,
  status: "online" | "offline" | "maintenance" = "online",
  population:
    | "standard"
    | "preferred"
    | "congested"
    | "preferred+"
    | "new" = "standard",
  newCharacterCreation: boolean = true,
): WorldStatus {
  return {
    name: createWorldName(name),
    status,
    population,
    newCharacterCreation,
  };
}
