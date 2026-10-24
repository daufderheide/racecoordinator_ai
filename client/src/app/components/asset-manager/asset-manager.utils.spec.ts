import {
  AssetView,
  calculateAssetUsagePercent,
  calculateListGridDimensions,
  formatAssetBytes,
  formatAssetTooltip,
  getAssetBytesByType,
  getAssetCountByType,
  parseAssetSize,
  sortAudioSetEntries,
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

  describe("calculateListGridDimensions", () => {
    it("should calculate columns and visible rows when itemCount is smaller than visible rows", () => {
      // availableWidth = 1200, availableHeight = 600, itemCount = 10
      // cols = floor((1200 + 6) / 246) = 4
      // usableHeight = 600 - 20 = 580; visibleRows = floor((580 + 6) / 44) = 13
      // minRowsToFit = ceil(10 / 4) = 3
      // rows = max(13, 3) = 13
      const dims = calculateListGridDimensions(1200, 600, 10);
      expect(dims.cols).toBe(4);
      expect(dims.rows).toBe(13);
    });

    it("should expand rows beyond visible rows when items exceed visible capacity to minimize vertical scrolling", () => {
      // availableWidth = 1200, availableHeight = 600, itemCount = 100
      // cols = 4; visibleRows = 13; minRowsToFit = ceil(100 / 4) = 25
      // rows = max(13, 25) = 25
      const dims = calculateListGridDimensions(1200, 600, 100);
      expect(dims.cols).toBe(4);
      expect(dims.rows).toBe(25);
    });

    it("should handle custom column width, row height, and padding", () => {
      const dims = calculateListGridDimensions(1000, 500, 30, {
        colMinWidth: 300,
        rowHeight: 40,
        gap: 10,
        paddingBottom: 0,
      });
      // cols = floor((1000 + 10) / 310) = 3
      // usableHeight = 500; visibleRows = floor((500 + 10) / 50) = 10
      // minRowsToFit = ceil(30 / 3) = 10 -> rows = 10
      expect(dims.cols).toBe(3);
      expect(dims.rows).toBe(10);
    });

    it("should guarantee minimum of 1 col and 1 row for tiny viewports", () => {
      const dims = calculateListGridDimensions(50, 10, 5);
      expect(dims.cols).toBe(1);
      expect(dims.rows).toBe(5);
    });
  });

  describe("asset breakdown helpers", () => {
    const testAssets: AssetView[] = [
      { id: "1", name: "img1.png", type: "image", size: "1 KB", url: "" },
      { id: "2", name: "img2.png", type: "image", size: "2 KB", url: "" },
      { id: "3", name: "snd1.wav", type: "sound", size: "3 KB", url: "" },
      { id: "4", name: "aud1.wav", type: "audio", size: "4 KB", url: "" },
      { id: "5", name: "set1", type: "image_set", size: "5 KB", url: "" },
      { id: "6", name: "audset1", type: "audio_set", size: "6 KB", url: "" },
      { id: "7", name: "rot1", type: "custom_rotation", size: "7 KB", url: "" },
    ];

    it("should get asset bytes by type correctly", () => {
      expect(getAssetBytesByType(testAssets, "image")).toBe(3 * 1024);
      expect(getAssetBytesByType(testAssets, "sound")).toBe(7 * 1024);
      expect(getAssetBytesByType(testAssets, "image_set")).toBe(5 * 1024);
      expect(getAssetBytesByType(testAssets, "audio_set")).toBe(6 * 1024);
      expect(getAssetBytesByType(testAssets, "custom_rotation")).toBe(7 * 1024);
    });

    it("should calculate asset usage percent correctly", () => {
      expect(calculateAssetUsagePercent(0, 0)).toBe(0);
      expect(calculateAssetUsagePercent(25, 100)).toBe(25);
      expect(calculateAssetUsagePercent(50, 200)).toBe(25);
    });

    it("should get asset count by type correctly", () => {
      expect(getAssetCountByType(testAssets, "image")).toBe(2);
      expect(getAssetCountByType(testAssets, "sound")).toBe(2);
      expect(getAssetCountByType(testAssets, "image_set")).toBe(1);
      expect(getAssetCountByType(testAssets, "audio_set")).toBe(1);
      expect(getAssetCountByType(testAssets, "custom_rotation")).toBe(1);
    });
  });

  describe("sortAudioSetEntries", () => {
    it("should sort elapsed entries ascending and remaining entries descending", () => {
      const entries: any[] = [
        { timeSeconds: 30, triggerMode: "remaining" },
        { timeSeconds: 10, triggerMode: "elapsed" },
        { timeSeconds: 60, triggerMode: "remaining" },
        { timeSeconds: 5, triggerMode: "elapsed" },
      ];
      const sorted = sortAudioSetEntries(entries);
      expect(sorted[0].timeSeconds).toBe(5); // elapsed 5
      expect(sorted[1].timeSeconds).toBe(10); // elapsed 10
      expect(sorted[2].timeSeconds).toBe(60); // remaining 60
      expect(sorted[3].timeSeconds).toBe(30); // remaining 30
    });
  });
});
