import { describe, it, expect, vi } from "vitest";
import {
  fetchHtml,
  parseStatusText,
  parseWorldStatusGeneric,
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

const mockHtmlWithClasses = `
<html>
  <body>
    <div class="worldstatus__datacenter">
      <h3>Primal</h3>
      <ul>
        <li>
          <span class="worldstatus__world-name">Behemoth</span>
          <span class="worldstatus__status">Standard</span>
        </li>
        <li>
          <span class="worldstatus__world-name">Excalibur</span>
          <span class="worldstatus__status">Congested</span>
        </li>
      </ul>
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
