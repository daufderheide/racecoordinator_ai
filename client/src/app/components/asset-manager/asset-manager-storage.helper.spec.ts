import {
  ASSET_MANAGER_FILTER_FALLBACK_STORAGE_KEY,
  ASSET_MANAGER_FILTER_STORAGE_KEY,
  ASSET_MANAGER_LAYOUT_STORAGE_KEY,
  AssetFilterType,
  loadSavedAssetFilterType,
  loadSavedAssetLayoutMode,
  saveAssetFilterType,
  saveAssetLayoutMode,
} from "./asset-manager-storage.helper";

describe("asset-manager-storage.helper", () => {
  beforeEach(() => {
    localStorage.removeItem(ASSET_MANAGER_FILTER_STORAGE_KEY);
    localStorage.removeItem(ASSET_MANAGER_FILTER_FALLBACK_STORAGE_KEY);
    localStorage.removeItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(ASSET_MANAGER_FILTER_STORAGE_KEY);
    localStorage.removeItem(ASSET_MANAGER_FILTER_FALLBACK_STORAGE_KEY);
    localStorage.removeItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY);
  });

  describe("loadSavedAssetFilterType", () => {
    it("should return default fallback when no value is stored", () => {
      expect(loadSavedAssetFilterType()).toBe("all");
      expect(loadSavedAssetFilterType("image")).toBe("image");
    });

    it("should return stored filter tab when valid", () => {
      const validTypes: AssetFilterType[] = [
        "all",
        "image",
        "sound",
        "audio",
        "image_set",
        "audio_set",
        "custom_rotation",
      ];
      for (const type of validTypes) {
        localStorage.setItem(ASSET_MANAGER_FILTER_STORAGE_KEY, type);
        expect(loadSavedAssetFilterType()).toBe(type);
      }
    });

    it("should fallback to am_filter_type if am_filter_tab is absent", () => {
      localStorage.setItem(
        ASSET_MANAGER_FILTER_FALLBACK_STORAGE_KEY,
        "audio_set",
      );
      expect(loadSavedAssetFilterType()).toBe("audio_set");
    });

    it("should ignore invalid values in storage and return fallback", () => {
      localStorage.setItem(
        ASSET_MANAGER_FILTER_STORAGE_KEY,
        "invalid_filter_name",
      );
      expect(loadSavedAssetFilterType()).toBe("all");
    });

    it("should handle localStorage errors gracefully", () => {
      spyOn(localStorage, "getItem").and.throwError("Permission denied");
      expect(loadSavedAssetFilterType("custom_rotation")).toBe(
        "custom_rotation",
      );
    });
  });

  describe("saveAssetFilterType", () => {
    it("should save filter type to am_filter_tab", () => {
      saveAssetFilterType("image_set");
      expect(localStorage.getItem(ASSET_MANAGER_FILTER_STORAGE_KEY)).toBe(
        "image_set",
      );

      saveAssetFilterType("all");
      expect(localStorage.getItem(ASSET_MANAGER_FILTER_STORAGE_KEY)).toBe(
        "all",
      );
    });

    it("should handle localStorage.setItem errors gracefully", () => {
      spyOn(localStorage, "setItem").and.throwError("QuotaExceeded");
      expect(() => saveAssetFilterType("image")).not.toThrow();
    });
  });

  describe("loadSavedAssetLayoutMode", () => {
    it("should return default fallback when no value is stored", () => {
      expect(loadSavedAssetLayoutMode()).toBe("medium");
      expect(loadSavedAssetLayoutMode("large")).toBe("large");
    });

    it("should return stored layout mode when valid", () => {
      const validModes = ["list", "small", "medium", "large"] as const;
      for (const mode of validModes) {
        localStorage.setItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY, mode);
        expect(loadSavedAssetLayoutMode()).toBe(mode);
      }
    });

    it("should ignore invalid layout modes in storage and return fallback", () => {
      localStorage.setItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY, "invalid_mode");
      expect(loadSavedAssetLayoutMode("small")).toBe("small");
    });

    it("should handle localStorage errors gracefully", () => {
      spyOn(localStorage, "getItem").and.throwError("Access restricted");
      expect(loadSavedAssetLayoutMode("list")).toBe("list");
    });
  });

  describe("saveAssetLayoutMode", () => {
    it("should save layout mode to storage", () => {
      saveAssetLayoutMode("small");
      expect(localStorage.getItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY)).toBe(
        "small",
      );

      saveAssetLayoutMode("large");
      expect(localStorage.getItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY)).toBe(
        "large",
      );
    });

    it("should handle localStorage.setItem errors gracefully", () => {
      spyOn(localStorage, "setItem").and.throwError("QuotaExceeded");
      expect(() => saveAssetLayoutMode("list")).not.toThrow();
    });
  });
});
