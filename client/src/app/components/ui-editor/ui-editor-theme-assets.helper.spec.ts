import { DataService } from "@app/data.service";
import { Theme } from "@app/models/theme";
import { ThemeService } from "@app/services/theme.service";

import {
  executeTestTtsVoice,
  extractAssetId,
  getThemeAssetForSlot,
  getThemeAudioConfigForSlot,
  getThemeAudioUrl,
  getThemeFlagUrl,
  getThemeFuelGaugeUrl,
  getThemeLampUrl,
  getThemeUrlForAsset,
  handleCalloutSpacingChange,
  handleClearCustomTemplate,
  handleMasterVolumeChange,
  handleTtsPitchChange,
  handleTtsRateChange,
  handleTtsVoiceChange,
  handleTtsVolumeChange,
  handleUrgentQueueTtlChange,
  initAvailableVoices,
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

  it("should clear custom template and capture state", () => {
    const comp = {
      editingSettings: {
        customExportTemplateBase64: "data:abc",
        customExportTemplateName: "custom.xlsx",
        customExportTemplatePath: "/path/custom.xlsx",
      } as any,
      captureState: jasmine.createSpy("captureState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };
    handleClearCustomTemplate(comp);
    expect(comp.editingSettings.customExportTemplateBase64).toBeUndefined();
    expect(comp.editingSettings.customExportTemplateName).toBeUndefined();
    expect(comp.editingSettings.customExportTemplatePath).toBeUndefined();
    expect(comp.captureState).toHaveBeenCalled();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should update urgentQueueTtl and capture state", () => {
    const comp = {
      editingSettings: { urgentQueueTtl: 5000 } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleUrgentQueueTtlChange(comp, 3000);
    expect(comp.editingSettings.urgentQueueTtl).toBe(3000);
    expect(comp.captureState).toHaveBeenCalled();
  });

  it("should update calloutSpacing and capture state", () => {
    const comp = {
      editingSettings: { calloutSpacing: 500 } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleCalloutSpacingChange(comp, 1000);
    expect(comp.editingSettings.calloutSpacing).toBe(1000);
    expect(comp.captureState).toHaveBeenCalled();
  });

  it("should update masterVolume and capture state", () => {
    const comp = {
      editingSettings: { masterVolume: 100 } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleMasterVolumeChange(comp, 75);
    expect(comp.editingSettings.masterVolume).toBe(75);
    expect(comp.captureState).toHaveBeenCalled();

    handleMasterVolumeChange(comp, "65");
    expect(comp.editingSettings.masterVolume).toBe(65);
  });

  it("should update ttsVoice and capture state", () => {
    const comp = {
      editingSettings: { ttsVoice: "" } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleTtsVoiceChange(comp, "Alex");
    expect(comp.editingSettings.ttsVoice).toBe("Alex");
    expect(comp.captureState).toHaveBeenCalled();
  });

  it("should update ttsRate and capture state", () => {
    const comp = {
      editingSettings: { ttsRate: 1.0 } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleTtsRateChange(comp, 1.25);
    expect(comp.editingSettings.ttsRate).toBe(1.25);
    expect(comp.captureState).toHaveBeenCalled();

    handleTtsRateChange(comp, "1.45");
    expect(comp.editingSettings.ttsRate).toBe(1.45);
  });

  it("should update ttsPitch and capture state", () => {
    const comp = {
      editingSettings: { ttsPitch: 1.0 } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleTtsPitchChange(comp, 0.8);
    expect(comp.editingSettings.ttsPitch).toBe(0.8);
    expect(comp.captureState).toHaveBeenCalled();

    handleTtsPitchChange(comp, "1.15");
    expect(comp.editingSettings.ttsPitch).toBe(1.15);
  });

  it("should update ttsVolume and capture state", () => {
    const comp = {
      editingSettings: { ttsVolume: 100 } as any,
      captureState: jasmine.createSpy("captureState"),
    };
    handleTtsVolumeChange(comp, 85);
    expect(comp.editingSettings.ttsVolume).toBe(85);
    expect(comp.captureState).toHaveBeenCalled();

    handleTtsVolumeChange(comp, "60");
    expect(comp.editingSettings.ttsVolume).toBe(60);
  });

  it("should initialize available voices using speechSynthesis", () => {
    const mockVoices = [
      { name: "Samantha", voiceURI: "Samantha", lang: "en-US" },
      { name: "Alex", voiceURI: "Alex", lang: "en-US" },
    ];
    const origSynth = window.speechSynthesis;
    const mockSynth = {
      getVoices: jasmine.createSpy("getVoices").and.returnValue(mockVoices),
      onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynth,
      configurable: true,
      writable: true,
    });

    const comp = {
      availableVoices: [] as any[],
      isDestroyed: false,
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    initAvailableVoices(comp);
    expect(comp.availableVoices.length).toBe(2);
    expect(comp.availableVoices[0].name).toBe("Alex");
    expect(comp.availableVoices[1].name).toBe("Samantha");
    expect(comp.cdr.markForCheck).toHaveBeenCalled();

    Object.defineProperty(window, "speechSynthesis", {
      value: origSynth,
      configurable: true,
      writable: true,
    });
  });

  it("should execute test TTS voice via audioService if present", () => {
    const comp = {
      translationService: {
        translate: jasmine
          .createSpy("translate")
          .and.returnValue("Sample text"),
      },
      editingSettings: {
        masterVolume: 80,
        ttsVoice: "Alex",
        ttsRate: 1.2,
        ttsPitch: 0.9,
        ttsVolume: 90,
      },
      audioService: {
        previewTTS: jasmine.createSpy("previewTTS"),
      },
    };

    executeTestTtsVoice(comp);
    expect(comp.audioService.previewTTS).toHaveBeenCalledWith(
      "Sample text",
      "Alex",
      1.2,
      0.9,
      90,
      80,
    );
  });
});
