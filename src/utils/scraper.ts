import debug from "debug";
import { parse } from "node-html-parser";
import { WorldStatus, WorldStatusRaw, DataCenter } from "../types/index.js";

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
 * Parses world status information from HTML content using specific selectors
 */
export function parseWorldStatus(html: string): DataCenter[] {
  log("Parsing HTML with specific selectors (.worldstatus__datacenter)");
  const root = parse(html);
  const dataCenters: DataCenter[] = [];

  // Look for data center sections with specific classes
  const datacenterSections = root.querySelectorAll(".worldstatus__datacenter");
  log(
    "Found %d data center sections with specific selectors",
    datacenterSections.length,
  );

  if (datacenterSections.length === 0) {
    log("No world status containers found with specific selectors");
    throw new Error("Could not find world status containers");
  }

  for (const section of datacenterSections) {
    const dcNameElement = section.querySelector("h3");
    if (!dcNameElement) {
      log("Skipping section without h3 element");
      continue;
    }

    const dcName = dcNameElement.text.trim();
    log("Processing data center: %s", dcName);
    const worlds: WorldStatus[] = [];

    // Find world list within this data center
    const worldList = section.querySelector("ul");
    if (worldList) {
      const worldItems = worldList.querySelectorAll("li");
      log("Found %d world items in %s", worldItems.length, dcName);

      for (const item of worldItems) {
        const worldName = item
          .querySelector(".worldstatus__world-name")
          ?.text.trim();
        const statusText = item
          .querySelector(".worldstatus__status")
          ?.text.trim();

        if (worldName && statusText) {
          log("Found world: %s (%s)", worldName, statusText);
          worlds.push({
            name: worldName,
            ...parseStatusText(statusText),
          });
        }
      }
    }

    if (worlds.length > 0) {
      log("Added data center %s with %d worlds", dcName, worlds.length);
      dataCenters.push({
        name: dcName,
        region: inferRegion(dcName),
        worlds,
      });
    }
  }

  log(
    "Specific selector parsing complete: %d data centers",
    dataCenters.length,
  );
  return dataCenters;
}

/**
 * Alternative parsing method using more generic selectors
 * Fallback for when specific classes aren't available
 */
export function parseWorldStatusGeneric(html: string): DataCenter[] {
  log("Parsing HTML with generic selectors (h2,h3,h4 + ul)");
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

  log("Generic parsing complete: %d data centers", dataCenters.length);
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
