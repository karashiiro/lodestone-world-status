import { describe, it, expect, vi } from "vitest";
import {
  fetchHtml,
  parseStatusText,
  parseWorldStatus,
} from "../../src/utils/scraper.js";

// Mock HTML content that mirrors the real Lodestone structure more accurately
// The key insight is that when the complex HTML is parsed by node-html-parser,
// the .text property collapses nested content with whitespace, making patterns like "Adamantoise\n\t\tCongested"
const mockHtml = `
<html>
  <body>
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">Aether</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Adamantoise</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Congested</p>
            </div>
            <div class="world-list__create_character">
              
              <i class="world-ic__unavailable js__tooltip" data-tooltip="Creation of New Characters Unavailable"></i>
              
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Cactuar</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Congested</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__unavailable js__tooltip" data-tooltip="Creation of New Characters Unavailable"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Faerie</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__available js__tooltip" data-tooltip="Creation of New Characters Available"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Gilgamesh</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__available js__tooltip" data-tooltip="Creation of New Characters Available"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Jenova</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__available js__tooltip" data-tooltip="Creation of New Characters Available"></i>
            </div>
          </div>
        </li>
      </ul>
      
      <h2 class="world-dcgroup__header">Crystal</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Balmung</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Congested</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__unavailable js__tooltip" data-tooltip="Creation of New Characters Unavailable"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Brynhildr</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Congested</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__unavailable js__tooltip" data-tooltip="Creation of New Characters Unavailable"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Coeurl</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__available js__tooltip" data-tooltip="Creation of New Characters Available"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Diabolos</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Congested</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__unavailable js__tooltip" data-tooltip="Creation of New Characters Unavailable"></i>
            </div>
          </div>
        </li>
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__status_icon">
              <i class="world-ic__1 js__tooltip" data-tooltip="Online"></i>
            </div>
            <div class="world-list__world_name">
              
              <p>Goblin</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Congested</p>
            </div>
            <div class="world-list__create_character">
              <i class="world-ic__unavailable js__tooltip" data-tooltip="Creation of New Characters Unavailable"></i>
            </div>
          </div>
        </li>
      </ul>
    </section>
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

describe("parseWorldStatus", () => {
  it("should parse world status from semantic HTML structure", () => {
    const result = parseWorldStatus(mockHtml);

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
      population: "congested",
      newCharacterCreation: false,
    });

    const faerie = aether?.worlds.find((w) => w.name === "Faerie");
    expect(faerie?.population).toBe("standard");
    expect(faerie?.newCharacterCreation).toBe(true);

    // Check second data center (Crystal)
    const crystal = result.find((dc) => dc.name === "Crystal");
    expect(crystal).toBeDefined();
    expect(crystal?.region).toBe("na");
    expect(crystal?.worlds).toHaveLength(5);
  });

  it("should handle empty HTML", () => {
    const result = parseWorldStatus("<html></html>");
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
    const result = parseWorldStatus(badHtml);
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
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">${dcName}</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__world_name">
              
              <p>TestWorld</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
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
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">${dcName}</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__world_name">
              
              <p>TestWorld</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
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
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">${dcName}</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__world_name">
              
              <p>TestWorld</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
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
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">Materia</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__world_name">
              
              <p>TestWorld</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
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
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">UnknownDataCenter</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__world_name">
              
              <p>TestWorld</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
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
    <section class="ldst__contents--worldstatus">
      <h2 class="world-dcgroup__header">CHAOS</h2>
      <ul class="world-dcgroup__list">
        <li class="item-list">
          <div class="world-list__item">
            <div class="world-list__world_name">
              
              <p>TestWorld</p>
              
            </div>
            <div class="world-list__world_category">
              <p>Standard</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
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
