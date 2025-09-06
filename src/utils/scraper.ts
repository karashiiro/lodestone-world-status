import { parse } from "node-html-parser";
import { WorldStatus, WorldStatusRaw, DataCenter } from "../types/index.js";

/**
 * Fetches HTML content from a URL
 */
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

/**
 * Parses world status information from HTML content using specific selectors
 */
export function parseWorldStatus(html: string): DataCenter[] {
  const root = parse(html);
  const dataCenters: DataCenter[] = [];

  // Look for data center sections with specific classes
  const datacenterSections = root.querySelectorAll(".worldstatus__datacenter");

  if (datacenterSections.length === 0) {
    throw new Error("Could not find world status containers");
  }

  for (const section of datacenterSections) {
    const dcNameElement = section.querySelector("h3");
    if (!dcNameElement) continue;

    const dcName = dcNameElement.text.trim();
    const worlds: WorldStatus[] = [];

    // Find world list within this data center
    const worldList = section.querySelector("ul");
    if (worldList) {
      const worldItems = worldList.querySelectorAll("li");

      for (const item of worldItems) {
        const worldName = item
          .querySelector(".worldstatus__world-name")
          ?.text.trim();
        const statusText = item
          .querySelector(".worldstatus__status")
          ?.text.trim();

        if (worldName && statusText) {
          worlds.push({
            name: worldName,
            ...parseStatusText(statusText),
          });
        }
      }
    }

    if (worlds.length > 0) {
      dataCenters.push({
        name: dcName,
        region: inferRegion(dcName),
        worlds,
      });
    }
  }

  return dataCenters;
}

/**
 * Alternative parsing method using more generic selectors
 * Fallback for when specific classes aren't available
 */
export function parseWorldStatusGeneric(html: string): DataCenter[] {
  const root = parse(html);
  const dataCenters: DataCenter[] = [];
  const processedDataCenters = new Set<string>();

  // Look for headings that might be data center names
  const headings = root.querySelectorAll("h2, h3, h4");

  for (const heading of headings) {
    const dcName = heading.text.trim();

    // Skip if we've already processed this data center
    if (processedDataCenters.has(dcName)) {
      continue;
    }

    // Look for a list following this heading
    let sibling = heading.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === "UL") {
        const items = sibling.querySelectorAll("li");
        const worlds: WorldStatusRaw[] = [];

        for (const item of items) {
          const text = item.text.trim();

          // Pattern: "WorldName Status" or similar
          const match = text.match(
            /^([A-Za-z\s]+?)\s+(Standard|Preferred|Congested|Preferred\+|New)$/,
          );
          if (match) {
            worlds.push({
              name: match[1].trim(),
              statusText: match[2].trim(),
            });
          }
        }

        // If we found valid worlds, add this data center
        if (worlds.length > 0) {
          const parsedWorlds = worlds.map((w) => ({
            name: w.name,
            ...parseStatusText(w.statusText),
          }));

          dataCenters.push({
            name: dcName,
            region: inferRegion(dcName),
            worlds: parsedWorlds,
          });

          processedDataCenters.add(dcName);
        }
        break;
      }
      sibling = sibling.nextElementSibling;
    }
  }

  return dataCenters;
}

/**
 * Parses status text into structured data
 */
export function parseStatusText(statusText: string): {
  status: "online" | "offline" | "maintenance";
  population: "standard" | "preferred" | "congested" | "preferred+" | "new";
  newCharacterCreation: boolean;
} {
  const text = statusText.toLowerCase().trim();

  // Default to online unless we detect otherwise
  let status: "online" | "offline" | "maintenance" = "online";

  if (text.includes("maintenance")) {
    status = "maintenance";
  } else if (text.includes("offline")) {
    status = "offline";
  }

  // Determine population status
  let population:
    | "standard"
    | "preferred"
    | "congested"
    | "preferred+"
    | "new" = "standard";
  let newCharacterCreation = true;

  if (text.includes("preferred+")) {
    population = "preferred+";
  } else if (text.includes("preferred")) {
    population = "preferred";
  } else if (text.includes("congested")) {
    population = "congested";
    newCharacterCreation = false;
  } else if (text.includes("new")) {
    population = "new";
  }

  return {
    status,
    population,
    newCharacterCreation,
  };
}

/**
 * Infers region from data center name
 */
function inferRegion(dcName: string): "na" | "eu" | "jp" | "oc" {
  const name = dcName.toLowerCase();

  // North American data centers
  if (["aether", "crystal", "dynamis", "primal"].includes(name)) {
    return "na";
  }

  // European data centers
  if (["chaos", "light"].includes(name)) {
    return "eu";
  }

  // Japanese data centers
  if (["elemental", "gaia", "mana", "meteor"].includes(name)) {
    return "jp";
  }

  // Oceania data centers
  if (["materia"].includes(name)) {
    return "oc";
  }

  // Default to NA if unknown
  return "na";
}
