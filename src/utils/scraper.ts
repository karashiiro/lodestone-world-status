import debug from "debug";
import { parse } from "node-html-parser";
import type {
  WorldStatusRaw,
  DataCenter,
  ParsedStatus,
  Region,
} from "../types/index.js";
import { createWorldName, createDataCenterName } from "../types/index.js";

const log = debug("lodestone-world-status:scraper");

/**
 * Fetches HTML content from a URL
 */
export async function fetchHtml(url: string): Promise<string> {
  log("Fetching HTML from: %s", url);
  const response = await fetch(url);

  if (!response.ok) {
    log("HTTP error: %d %s", response.status, response.statusText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  log("Successfully fetched HTML (%d characters)", html.length);
  return html;
}

/**
 * Parses world status information from HTML content using semantic HTML structure
 */
export function parseWorldStatus(html: string): DataCenter[] {
  log("Parsing HTML with semantic selectors (h2,h3,h4 + ul)");
  const root = parse(html);
  const dataCenters: DataCenter[] = [];
  const processedDataCenters = new Set<string>();

  // Look for headings that might be data center names
  const headings = root.querySelectorAll("h2, h3, h4");
  log("Found %d headings to check for data centers", headings.length);

  for (const heading of headings) {
    const dcName = heading.text.trim();

    // Skip if we've already processed this data center
    if (processedDataCenters.has(dcName)) {
      log("Skipping already processed data center: %s", dcName);
      continue;
    }

    log("Checking heading for data center: %s", dcName);

    // Look for a list following this heading
    let sibling = heading.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === "UL") {
        const items = sibling.querySelectorAll("li");
        const worlds: WorldStatusRaw[] = [];
        log("Found list with %d items under %s", items.length, dcName);

        for (const item of items) {
          const text = item.text.trim();

          // Pattern: "WorldName Status" or similar
          const match = text.match(
            /^([A-Za-z\s]+?)\s+(Standard|Preferred|Congested|Preferred\+|New)$/,
          );
          if (match) {
            log(
              "Matched world pattern: %s -> %s (%s)",
              text,
              match[1].trim(),
              match[2].trim(),
            );
            worlds.push({
              name: match[1].trim(),
              statusText: match[2].trim(),
            });
          }
        }

        // If we found valid worlds, add this data center
        if (worlds.length > 0) {
          log(
            "Found %d valid worlds for data center %s",
            worlds.length,
            dcName,
          );
          const parsedWorlds = worlds.map((w) => ({
            name: createWorldName(w.name),
            ...parseStatusText(w.statusText),
          }));

          dataCenters.push({
            name: createDataCenterName(dcName),
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

  log("World status parsing complete: %d data centers", dataCenters.length);
  return dataCenters;
}

/**
 * Parses status text into structured data
 */
export function parseStatusText(statusText: string): ParsedStatus {
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
function inferRegion(dcName: string): Region {
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
