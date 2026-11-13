import {
  AssetView,
  calculateAssetUsagePercent,
  calculateListGridDimensions,
  calculateTotalAssetBytes,
  formatAssetBytes,
  formatAssetTooltip,
  formatTotalAssetSize,
  getAssetBytesByType,
  getAssetCountByType,
  isCsvAsset,
  mapServerAssetsToViews,
  parseAssetSize,
  readAssetFile,
  sortAudioSetEntries,
  toAudioSetEditorEntries,
  toImageSetEditorEntries,
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

  describe("readAssetFile", () => {
    it("should read an image file and determine type as image from mime type", async () => {
      const file = new File([new Uint8Array([1, 2, 3])], "photo.dat", {
        type: "image/png",
      });
      const result = await readAssetFile(file);
      expect(result.name).toBe("photo.dat");
      expect(result.type).toBe("image");
      expect(result.data.length).toBe(3);
      expect(Array.from(result.data)).toEqual([1, 2, 3]);
    });

    it("should read an image file and determine type as image from extension", async () => {
      const file = new File([new Uint8Array([7, 8])], "avatar.JPG", {
        type: "",
      });
      const result = await readAssetFile(file);
      expect(result.name).toBe("avatar.JPG");
      expect(result.type).toBe("image");
      expect(result.data.length).toBe(2);
    });

    it("should read an audio file and determine type as audio", async () => {
      const file = new File([new Uint8Array([10, 20])], "track.wav", {
        type: "audio/wav",
      });
      const result = await readAssetFile(file);
      expect(result.name).toBe("track.wav");
      expect(result.type).toBe("audio");
      expect(result.data.length).toBe(2);
    });

    it("should reject when FileReader encounters an error", async () => {
      const fakeFile = new File([], "broken.bin");
      spyOn(window as any, "FileReader").and.returnValue({
        readAsArrayBuffer: function () {
          if (this.onerror) {
            this.onerror(new Error("Read failed") as any);
          }
        },
      } as any);

      await expectAsync(readAssetFile(fakeFile)).toBeRejected();
    });
  });

  describe("isCsvAsset", () => {
    it("should return false for null or undefined", () => {
      expect(isCsvAsset(undefined)).toBeFalse();
      expect(isCsvAsset(null as any)).toBeFalse();
    });

    it("should return false for custom_rotation", () => {
      expect(
        isCsvAsset({ type: "custom_rotation", name: "test.csv" }),
      ).toBeFalse();
    });

    it("should return true when type is csv", () => {
      expect(isCsvAsset({ type: "csv", name: "test" })).toBeTrue();
    });

    it("should return true when name or url ends with .csv", () => {
      expect(isCsvAsset({ type: "image", name: "report.CSV" })).toBeTrue();
      expect(
        isCsvAsset({ type: "image", name: "report", url: "path/data.csv" }),
      ).toBeTrue();
    });

    it("should return false for non-csv assets", () => {
      expect(isCsvAsset({ type: "image", name: "car.png" })).toBeFalse();
    });
  });

  describe("total asset size helpers", () => {
    const assets: AssetView[] = [
      { id: "1", name: "img", type: "image", size: "1 KB", url: "" },
      { id: "2", name: "snd", type: "audio", size: "2 KB", url: "" },
    ];

    it("should calculate total asset bytes correctly", () => {
      expect(calculateTotalAssetBytes(assets)).toBe(3072);
      expect(calculateTotalAssetBytes([])).toBe(0);
    });

    it("should format total asset size string correctly", () => {
      expect(formatTotalAssetSize(assets)).toBe("3 KB");
      expect(formatTotalAssetSize([])).toBe("0 B");
    });
  });

  describe("editor entry converters", () => {
    it("should convert image set entries to editor format", () => {
      const entries = toImageSetEditorEntries([
        { percentage: 50, url: "/img.png", name: "img" },
      ]);
      expect(entries.length).toBe(1);
      expect(entries[0].percentage).toBe(50);
      expect(entries[0].url).toBe("/img.png");
      expect(entries[0].name).toBe("img");
      expect(entries[0].data).toEqual(new Uint8Array());
    });

    it("should handle empty or undefined images", () => {
      expect(toImageSetEditorEntries(undefined)).toEqual([]);
    });

    it("should convert audio set entries to editor format", () => {
      const entries = toAudioSetEditorEntries([
        {
          timeSeconds: 12,
          url: "/snd.wav",
          name: "snd",
          type: "preset",
          text: "hello",
          triggerMode: "elapsed",
        },
      ]);
      expect(entries.length).toBe(1);
      expect(entries[0].timeSeconds).toBe(12);
      expect(entries[0].percentage).toBe(12);
      expect(entries[0].triggerMode).toBe("elapsed");
    });

    it("should handle empty or undefined audio entries", () => {
      expect(toAudioSetEditorEntries(undefined)).toEqual([]);
    });
  });

  describe("mapServerAssetsToViews", () => {
    it("should map server assets to AssetView instances", () => {
      const serverAssets: any[] = [
        {
          model: { entityId: "cr1" },
          name: "Rotation 1",
          customRotations: [{}],
        },
        {
          model: { entityId: "as1" },
          name: "Audio Set 1",
          audioEntries: [{}],
        },
        {
          model: { entityId: "is1" },
          name: "Image Set 1",
          images: [{}],
        },
        {
          model: { entityId: "im1" },
          name: "Image 1",
          type: "image",
          size: "500 B",
          url: "/test.png",
        },
      ];

      const views = mapServerAssetsToViews(
        serverAssets,
        (a) => `http://localhost${a.url || ""}`,
      );
      expect(views.length).toBe(4);
      expect(views[0].type).toBe("custom_rotation");
      expect(views[1].type).toBe("audio_set");
      expect(views[2].type).toBe("image_set");
      expect(views[3].type).toBe("image");
      expect(views[3].url).toBe("http://localhost/test.png");
    });

    it("should return empty array for null/empty input", () => {
      expect(mapServerAssetsToViews(null as any, () => "")).toEqual([]);
    });
  });
});
