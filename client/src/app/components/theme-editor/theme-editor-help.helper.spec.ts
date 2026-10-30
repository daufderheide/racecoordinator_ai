import { TranslationService } from "@app/services/translation.service";

import {
  buildThemeEditorHelpSteps,
  ThemeEditorHelpContext,
} from "./theme-editor-help.helper";

describe("theme-editor-help.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let expandSectionSpy: jasmine.Spy;
  let ctx: ThemeEditorHelpContext;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    mockTranslationService.translate.and.callFake(
      (key: string) => `translated_${key}`,
    );
    expandSectionSpy = jasmine.createSpy("expandSection");

    ctx = {
      translationService: mockTranslationService,
      expandSection: expandSectionSpy,
    };
  });

  it("should build 11 tour steps with valid selectors and translated keys", () => {
    const steps = buildThemeEditorHelpSteps(ctx);
    expect(steps.length).toBe(11);

    expect(steps[0].selector).toBe("#editor-object-selector");
    expect(steps[0].title).toBe("translated_THM_HELP_SELECTOR_TITLE");

    expect(steps[1].selector).toBe(".header-actions");
    expect(steps[1].title).toBe("translated_THM_HELP_TOOLBAR_TITLE");

    expect(steps[2].selector).toBe("#theme-name-section");
    expect(steps[2].title).toBe("translated_THM_HELP_NAME_TITLE");

    expect(steps[3].selector).toBe("#theme-ui-selector");
    expect(steps[3].title).toBe("translated_THM_HELP_UI_SELECTOR_TITLE");

    expect(steps[4].selector).toBe("#theme-driver-station-theme");
    expect(steps[4].title).toBe("translated_THM_HELP_DRIVER_STATION_TITLE");

    expect(steps[5].selector).toBe("#theme-driver-view-theme");
    expect(steps[5].title).toBe("translated_THM_HELP_DRIVER_VIEW_TITLE");

    expect(steps[6].selector).toBe("#theme-flags-section");
    expect(steps[6].title).toBe("translated_THM_HELP_FLAGS_TITLE");

    expect(steps[7].selector).toBe("#theme-countdown-section");
    expect(steps[7].title).toBe("translated_THM_HELP_COUNTDOWN_TITLE");

    expect(steps[8].selector).toBe("#theme-fuel-section");
    expect(steps[8].title).toBe("translated_THM_HELP_FUEL_TITLE");

    expect(steps[9].selector).toBe("#theme-audio-section");
    expect(steps[9].title).toBe("translated_THM_HELP_AUDIO_TITLE");

    expect(steps[10].selector).toBe("#theme-driver-audio-section");
    expect(steps[10].title).toBe("translated_THM_HELP_DRIVER_AUDIO_TITLE");
  });

  it("should trigger expandSection on onEnter hooks for collapsible sections", () => {
    const steps = buildThemeEditorHelpSteps(ctx);

    steps[6].onEnter?.();
    expect(expandSectionSpy).toHaveBeenCalledWith("flags");

    steps[7].onEnter?.();
    expect(expandSectionSpy).toHaveBeenCalledWith("countdown");

    steps[8].onEnter?.();
    expect(expandSectionSpy).toHaveBeenCalledWith("fuelGauge");

    steps[9].onEnter?.();
    expect(expandSectionSpy).toHaveBeenCalledWith("audio");

    steps[10].onEnter?.();
    expect(expandSectionSpy).toHaveBeenCalledWith("driverAudioOverrides");
  });
});
