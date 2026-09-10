import {
  AssetType,
  compareAssetsByTypeThenName,
  normalizeAssetType,
} from "./asset";

describe("Asset Model", () => {
  describe("normalizeAssetType", () => {
    it("should return IMAGE for null, undefined, or empty strings", () => {
      expect(normalizeAssetType(null)).toBe(AssetType.IMAGE);
      expect(normalizeAssetType(undefined)).toBe(AssetType.IMAGE);
      expect(normalizeAssetType("")).toBe(AssetType.IMAGE);
    });

    it("should normalize sound and audio to AUDIO", () => {
      expect(normalizeAssetType("sound")).toBe(AssetType.AUDIO);
      expect(normalizeAssetType("SOUND")).toBe(AssetType.AUDIO);
      expect(normalizeAssetType("audio")).toBe(AssetType.AUDIO);
      expect(normalizeAssetType("Audio")).toBe(AssetType.AUDIO);
    });

    it("should normalize image_set, audio_set, and custom_rotation", () => {
      expect(normalizeAssetType("image_set")).toBe(AssetType.IMAGE_SET);
      expect(normalizeAssetType("IMAGE_SET")).toBe(AssetType.IMAGE_SET);
      expect(normalizeAssetType("audio_set")).toBe(AssetType.AUDIO_SET);
      expect(normalizeAssetType("AUDIO_SET")).toBe(AssetType.AUDIO_SET);
      expect(normalizeAssetType("custom_rotation")).toBe(
        AssetType.CUSTOM_ROTATION,
      );
      expect(normalizeAssetType("CUSTOM_ROTATION")).toBe(
        AssetType.CUSTOM_ROTATION,
      );
    });

    it("should fallback to IMAGE for unrecognized types", () => {
      expect(normalizeAssetType("unknown_type")).toBe(AssetType.IMAGE);
    });
  });

  describe("compareAssetsByTypeThenName", () => {
    it("should sort assets first by type, then by name", () => {
      const assets = [
        { name: "Zebra", type: "image" },
        { name: "Alpha", type: "image_set" },
        { name: "Bravo", type: "audio" },
        { name: "Echo", type: "custom_rotation" },
        { name: "Delta", type: "audio_set" },
        { name: "Apple", type: "image" },
        { name: "Charlie", type: "sound" },
      ];

      assets.sort((a, b) => compareAssetsByTypeThenName(a, b));

      expect(assets.map((a) => `${a.type}:${a.name}`)).toEqual([
        "audio:Bravo",
        "sound:Charlie",
        "audio_set:Delta",
        "custom_rotation:Echo",
        "image:Apple",
        "image:Zebra",
        "image_set:Alpha",
      ]);
    });

    it("should use natural numeric sorting for names", () => {
      const assets = [
        { name: "Car 10", type: "image" },
        { name: "Car 2", type: "image" },
        { name: "Car 1", type: "image" },
      ];

      assets.sort((a, b) => compareAssetsByTypeThenName(a, b));

      expect(assets.map((a) => a.name)).toEqual(["Car 1", "Car 2", "Car 10"]);
    });

    it("should use defaultType when item type is omitted", () => {
      const assets = [
        { name: "Zebra" },
        { name: "Alpha", type: "audio" },
        { name: "Beta" },
      ];

      assets.sort((a, b) => compareAssetsByTypeThenName(a, b, "image"));

      expect(assets.map((a) => a.name)).toEqual(["Alpha", "Beta", "Zebra"]);
    });

    it("should handle undefined or missing names gracefully", () => {
      const a = { type: "image" };
      const b = { name: "Test", type: "image" };

      expect(compareAssetsByTypeThenName(a, b)).toBeLessThan(0);
      expect(compareAssetsByTypeThenName(b, a)).toBeGreaterThan(0);
      expect(compareAssetsByTypeThenName(a, a)).toBe(0);
    });

    it("should break ties on case differences when base sensitivity matches", () => {
      const a = { name: "apple", type: "image" };
      const b = { name: "Apple", type: "image" };

      const diff = compareAssetsByTypeThenName(a, b);
      expect(diff).not.toBe(0);
    });
  });
});
