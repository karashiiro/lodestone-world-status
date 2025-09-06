import { describe, it, expect, vi } from "vitest";
import {
  fetchHtml,
  parseStatusText,
  parseWorldStatusGeneric,
  parseWorldStatus,
} from "../../src/utils/scraper.js";

// Mock HTML content that simulates the Lodestone structure
const mockHtml = `
<html>
  <body>
    <div>
      <div>
        <div>
          <div>
            <h3>Aether</h3>
            <ul>
              <li>Adamantoise Standard</li>
              <li>Cactuar Congested</li>
              <li>Faerie Preferred</li>
              <li>Gilgamesh Congested</li>
              <li>Jenova Standard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div>
        <div>
          <div>
            <h3>Crystal</h3>
            <ul>
              <li>Balmung Standard</li>
              <li>Brynhildr Preferred</li>
              <li>Coeurl Preferred</li>
              <li>Diabolos Standard</li>
              <li>Goblin Standard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

describe("parseStatusText", () => {
  it("should parse standard status", () => {
    const result = parseStatusText("Standard");
    expect(result).toEqual({
      status: "online",
      population: "standard",
      newCharacterCreation: true,
    });
  });

  it("should parse preferred status", () => {
    const result = parseStatusText("Preferred");
    expect(result).toEqual({
      status: "online",
      population: "preferred",
      newCharacterCreation: true,
    });
  });

  it("should parse preferred+ status", () => {
    const result = parseStatusText("Preferred+");
    expect(result).toEqual({
      status: "online",
      population: "preferred+",
      newCharacterCreation: true,
    });
  });

  it("should parse congested status", () => {
    const result = parseStatusText("Congested");
    expect(result).toEqual({
      status: "online",
      population: "congested",
      newCharacterCreation: false,
    });
  });

  it("should parse new status", () => {
    const result = parseStatusText("New");
    expect(result).toEqual({
      status: "online",
      population: "new",
      newCharacterCreation: true,
    });
  });

  it("should handle maintenance status", () => {
    const result = parseStatusText("Maintenance");
    expect(result).toEqual({
      status: "maintenance",
      population: "standard",
      newCharacterCreation: true,
    });
  });

  it("should handle case insensitive input", () => {
    const result = parseStatusText("CONGESTED");
    expect(result.population).toBe("congested");
    expect(result.newCharacterCreation).toBe(false);
  });

  it("should handle empty string input", () => {
    const result = parseStatusText("");
    expect(result).toEqual({
      status: "online",
      population: "standard",
      newCharacterCreation: true,
    });
  });

  it("should handle whitespace-only input", () => {
    const result = parseStatusText("   ");
    expect(result).toEqual({
      status: "online",
      population: "standard",
      newCharacterCreation: true,
    });
  });

  it("should handle invalid status text", () => {
    const result = parseStatusText("InvalidStatus");
    expect(result).toEqual({
      status: "online",
      population: "standard",
      newCharacterCreation: true,
    });
  });

  it("should handle offline status", () => {
    const result = parseStatusText("Offline");
    expect(result.status).toBe("offline");
  });

  it("should handle maintenance with population", () => {
    const result = parseStatusText("Maintenance Preferred");
    expect(result.status).toBe("maintenance");
    expect(result.population).toBe("preferred");
  });
});

describe("parseWorldStatusGeneric", () => {
  it("should parse world status from generic HTML structure", () => {
    const result = parseWorldStatusGeneric(mockHtml);

    expect(result).toHaveLength(2);

    // Check first data center (Aether)
    const aether = result.find((dc) => dc.name === "Aether");
    expect(aether).toBeDefined();
    expect(aether?.region).toBe("na");
    expect(aether?.worlds).toHaveLength(5);

    // Check specific worlds
    const adamantoise = aether?.worlds.find((w) => w.name === "Adamantoise");
    expect(adamantoise).toEqual({
      name: "Adamantoise",
      status: "online",
      population: "standard",
      newCharacterCreation: true,
    });

    const cactuar = aether?.worlds.find((w) => w.name === "Cactuar");
    expect(cactuar?.population).toBe("congested");
    expect(cactuar?.newCharacterCreation).toBe(false);

    // Check second data center (Crystal)
    const crystal = result.find((dc) => dc.name === "Crystal");
    expect(crystal).toBeDefined();
    expect(crystal?.region).toBe("na");
    expect(crystal?.worlds).toHaveLength(5);
  });

  it("should handle empty HTML", () => {
    const result = parseWorldStatusGeneric("<html></html>");
    expect(result).toEqual([]);
  });

  it("should handle HTML without valid world data", () => {
    const badHtml = `
      <html>
        <body>
          <div>
            <ul>
              <li>Not a world status</li>
              <li>123 Invalid</li>
            </ul>
          </div>
        </body>
      </html>
    `;
    const result = parseWorldStatusGeneric(badHtml);
    expect(result).toEqual([]);
  });
});

describe("parseWorldStatus", () => {
  const mockSpecificHtml = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>Aether</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">Adamantoise</span>
          <span class="worldstatus__status">Standard</span>
        </li>
        <li>
          <span class="worldstatus__world-name">Cactuar</span>
          <span class="worldstatus__status">Congested</span>
        </li>
      </ul>
    </div>
    <div class="worldstatus__datacenter">
      <h3>Chaos</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">Cerberus</span>
          <span class="worldstatus__status">Preferred</span>
        </li>
      </ul>
    </div>
  </body>
</html>
  `;

  it("should parse world status with specific selectors", () => {
    const result = parseWorldStatus(mockSpecificHtml);

    expect(result).toHaveLength(2);

    // Check Aether data center
    const aether = result.find((dc) => dc.name === "Aether");
    expect(aether).toBeDefined();
    expect(aether?.region).toBe("na");
    expect(aether?.worlds).toHaveLength(2);

    const adamantoise = aether?.worlds.find((w) => w.name === "Adamantoise");
    expect(adamantoise).toEqual({
      name: "Adamantoise",
      status: "online",
      population: "standard",
      newCharacterCreation: true,
    });

    // Check Chaos data center
    const chaos = result.find((dc) => dc.name === "Chaos");
    expect(chaos?.region).toBe("eu");
  });

  it("should throw error when no specific selectors found", () => {
    const htmlWithoutSelectors =
      "<html><body><div>No selectors</div></body></html>";
    expect(() => parseWorldStatus(htmlWithoutSelectors)).toThrow(
      "Could not find world status containers",
    );
  });

  it("should skip sections without h3 elements", () => {
    const htmlMissingH3 = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <ul><li><span class="worldstatus__world-name">World</span></li></ul>
    </div>
    <div class="worldstatus__datacenter">
      <h3>Aether</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">Adamantoise</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
    `;

    const result = parseWorldStatus(htmlMissingH3);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Aether");
  });

  it("should handle data centers without world lists", () => {
    const htmlNoWorldList = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>EmptyDataCenter</h3>
    </div>
  </body>
</html>
    `;

    const result = parseWorldStatus(htmlNoWorldList);
    expect(result).toEqual([]);
  });
});

describe("inferRegion", () => {
  // We need to import the internal function for testing
  // Since it's not exported, we'll test it through parseWorldStatus
  it("should infer NA region for known NA data centers", () => {
    const testDataCenters = ["Aether", "Crystal", "Dynamis", "Primal"];

    testDataCenters.forEach((dcName) => {
      const html = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>${dcName}</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">TestWorld</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
      `;
      const result = parseWorldStatus(html);
      expect(result[0]?.region).toBe("na");
    });
  });

  it("should infer EU region for known EU data centers", () => {
    const testDataCenters = ["Chaos", "Light"];

    testDataCenters.forEach((dcName) => {
      const html = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>${dcName}</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">TestWorld</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
      `;
      const result = parseWorldStatus(html);
      expect(result[0]?.region).toBe("eu");
    });
  });

  it("should infer JP region for known JP data centers", () => {
    const testDataCenters = ["Elemental", "Gaia", "Mana", "Meteor"];

    testDataCenters.forEach((dcName) => {
      const html = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>${dcName}</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">TestWorld</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
      `;
      const result = parseWorldStatus(html);
      expect(result[0]?.region).toBe("jp");
    });
  });

  it("should infer OC region for known OC data centers", () => {
    const html = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>Materia</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">TestWorld</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
    `;
    const result = parseWorldStatus(html);
    expect(result[0]?.region).toBe("oc");
  });

  it("should default to NA region for unknown data centers", () => {
    const html = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>UnknownDataCenter</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">TestWorld</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
    `;
    const result = parseWorldStatus(html);
    expect(result[0]?.region).toBe("na");
  });

  it("should handle case insensitive data center names", () => {
    const html = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>CHAOS</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">TestWorld</span>
          <span class="worldstatus__status">Standard</span>
        </li>
      </ul>
    </div>
  </body>
</html>
    `;
    const result = parseWorldStatus(html);
    expect(result[0]?.region).toBe("eu");
  });
});

describe("fetchHtml", () => {
  it("should fetch HTML from URL", async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html>test</html>"),
    });

    const result = await fetchHtml("https://example.com");
    expect(result).toBe("<html>test</html>");
    expect(fetch).toHaveBeenCalledWith("https://example.com");
  });

  it("should throw error for failed requests", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchHtml("https://example.com/404")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });

  it("should handle network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(fetchHtml("https://example.com")).rejects.toThrow(
      "Network error",
    );
  });
});
