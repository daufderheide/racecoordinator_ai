import {
  formatAssetBytes,
  formatAssetTooltip,
  parseAssetSize,
} from "./asset-manager.utils";

describe("asset-manager.utils", () => {
  describe("parseAssetSize", () => {
    it("should return 0 for empty or null strings", () => {
      expect(parseAssetSize("")).toBe(0);
      expect(parseAssetSize(null as any)).toBe(0);
      expect(parseAssetSize(undefined as any)).toBe(0);
    });

    it("should return 0 for invalid formats", () => {
      expect(parseAssetSize("100")).toBe(0);
      expect(parseAssetSize("100 KB extra")).toBe(0);
      expect(parseAssetSize("100 INVALID")).toBe(0);
    });

    it("should parse bytes correctly", () => {
      expect(parseAssetSize("500 B")).toBe(500);
      expect(parseAssetSize("1 KB")).toBe(1024);
      expect(parseAssetSize("2 MB")).toBe(2 * 1024 * 1024);
      expect(parseAssetSize("1 GB")).toBe(1024 * 1024 * 1024);
    });

    it("should normalize IEC units (KiB, MiB)", () => {
      expect(parseAssetSize("1 KiB")).toBe(1024);
      expect(parseAssetSize("2 MiB")).toBe(2 * 1024 * 1024);
    });
  });

  describe("formatAssetBytes", () => {
    it("should format 0 B correctly", () => {
      expect(formatAssetBytes(0)).toBe("0 B");
    });

    it("should format bytes, KB, MB, and GB accurately", () => {
      expect(formatAssetBytes(500)).toBe("500 B");
      expect(formatAssetBytes(1024)).toBe("1 KB");
      expect(formatAssetBytes(1536)).toBe("1.5 KB");
      expect(formatAssetBytes(1024 * 1024)).toBe("1 MB");
      expect(formatAssetBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });
  });

  describe("formatAssetTooltip", () => {
    it("should format byte and MB tooltip string", () => {
      const tooltip = formatAssetTooltip(1048576);
      expect(tooltip).toContain("1,048,576 bytes");
      expect(tooltip).toContain("1.00 MB");
    });
  });
});
