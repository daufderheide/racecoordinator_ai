import { DataService } from "@app/data.service";
import { Theme } from "@app/models/theme";
import { ThemeService } from "@app/services/theme.service";

import {
  extractAssetId,
  getThemeAssetForSlot,
  getThemeAudioConfigForSlot,
  getThemeAudioUrl,
  getThemeFlagUrl,
  getThemeFuelGaugeUrl,
  getThemeLampUrl,
  getThemeUrlForAsset,
} from "./ui-editor-theme-assets.helper";

describe("ui-editor-theme-assets.helper", () => {
  it("should extract asset ID from string or object", () => {
    expect(extractAssetId("asset-123")).toBe("asset-123");
    expect(extractAssetId({ entityId: "asset-456" })).toBe("asset-456");
    expect(extractAssetId({ entity_id: "asset-789" })).toBe("asset-789");
    expect(extractAssetId({ id: "asset-000" })).toBe("asset-000");
    expect(extractAssetId(null)).toBeNull();
  });

  it("should return theme url for custom asset or fall back to dataService", () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "getAssetUrl",
    ]);
    dataServiceSpy.getAssetUrl.and.returnValue("/api/asset/a1");

    const assetObj = { entity_id: "a1", type: "image" };
    expect(getThemeUrlForAsset(assetObj, dataServiceSpy)).toBe("/api/asset/a1");
  });

  it("should return audio config for slot with default speech fallback", () => {
    const theme: Theme = {
      entity_id: "t1",
      name: "Theme",
      is_default: false,
      slots: {},
      audio_slots: {
        "audio.yellowflag": { type: "preset", url: "yellow.wav" },
      },
    };

    const customConfig = getThemeAudioConfigForSlot("audio.yellowflag", theme);
    expect(customConfig.type).toBe("preset");
    expect(customConfig.url).toBe("yellow.wav");

    const defaultConfig = getThemeAudioConfigForSlot("audio.race_over", theme);
    expect(defaultConfig.type).toBe("preset");
  });

  it("should resolve audio url from theme slot or assets", () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "getAssetUrl",
    ]);
    dataServiceSpy.getAssetUrl.and.returnValue("/api/asset/audio1");

    const theme: Theme = {
      entity_id: "t1",
      name: "Theme",
      is_default: false,
      slots: {},
      audio_slots: {
        "audio.yellowflag": { type: "preset", url: "audio1" },
      },
    };

    const url = getThemeAudioUrl("audio.yellowflag", theme, dataServiceSpy, [
      { entity_id: "audio1" },
    ]);
    expect(url).toBe("/api/asset/audio1");
  });

  it("should resolve theme flag, lamp, fuel gauge and asset slot urls", () => {
    const themeServiceSpy = jasmine.createSpyObj<ThemeService>("ThemeService", [
      "resolveAssetId",
    ]);
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "getAssetUrl",
    ]);

    themeServiceSpy.resolveAssetId.and.returnValue("asset_green");
    dataServiceSpy.getAssetUrl.and.returnValue("/assets/flags/green.png");

    const assets = [{ entity_id: "asset_green" }];

    expect(
      getThemeFlagUrl(
        "flags.green",
        undefined,
        undefined,
        themeServiceSpy,
        assets,
        dataServiceSpy,
      ),
    ).toBe("/assets/flags/green.png");
    expect(
      getThemeLampUrl(
        "lamps.green",
        undefined,
        undefined,
        themeServiceSpy,
        assets,
        dataServiceSpy,
      ),
    ).toBe("/assets/flags/green.png");
    expect(
      getThemeFuelGaugeUrl(
        undefined,
        undefined,
        themeServiceSpy,
        assets,
        dataServiceSpy,
      ),
    ).toBe("/assets/flags/green.png");
    expect(
      getThemeAssetForSlot(
        "flags.green",
        undefined,
        undefined,
        themeServiceSpy,
        assets,
      ),
    ).toEqual({ entity_id: "asset_green" });
  });
});
