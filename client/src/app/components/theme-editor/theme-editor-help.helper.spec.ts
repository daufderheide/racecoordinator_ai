import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  buildThemeEditorHelpSteps,
  ThemeEditorHelpContext,
  ThemeEditorHelpHelper,
} from "./theme-editor-help.helper";

describe("ThemeEditorHelpHelper", () => {
  let mockTranslationService: any;
  let sectionsExpanded: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    };
    sectionsExpanded = {
      flags: false,
      countdown: false,
      fuelGauge: false,
      audio: false,
      driverAudioOverrides: false,
    };
  });

  it("should generate all 9 help steps in the expected order with targets, positions, and onEnter callbacks", () => {
    const steps = ThemeEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBe(9);

    // Step 0: Overview (General info)
    expect(steps[0].title).toBe("translated_THM_HELP_WELCOME_TITLE");
    expect(steps[0].content).toBe("translated_THM_HELP_WELCOME_CONTENT");
    expect(steps[0].position).toBe("center");
    expect(steps[0].targetId).toBeUndefined();

    // Step 1: Select theme nav
    expect(steps[1].targetId).toBe("editor-object-nav");
    expect(steps[1].selector).toBe("#editor-object-nav");
    expect(steps[1].title).toBe("translated_THM_HELP_SELECTOR_TITLE");
    expect(steps[1].position).toBe("bottom");

    // Step 2: Toolbar (pointing at edit button, highlighting toolbar container)
    expect(steps[2].targetId).toBe("edit-track-btn");
    expect(steps[2].highlightTargetId).toBe("toolbar-container");
    expect(steps[2].selector).toBe("#edit-track-btn");
    expect(steps[2].highlightSelector).toBe(".toolbar-container");
    expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[2].position).toBe("bottom");

    // Step 3: Top selectors (theme controls bar)
    expect(steps[3].targetId).toBe("theme-controls-bar");
    expect(steps[3].selector).toBe("#theme-controls-bar");
    expect(steps[3].title).toBe("translated_THM_HELP_TOP_SELECTORS_TITLE");
    expect(steps[3].position).toBe("bottom");

    // Step 4: Flags section
    expect(steps[4].targetId).toBe("theme-flags-section");
    expect(steps[4].selector).toBe("#theme-flags-section");
    expect(steps[4].title).toBe("translated_THM_HELP_FLAGS_TITLE");
    expect(steps[4].position).toBe("bottom");

    // Step 5: Countdown section
    expect(steps[5].targetId).toBe("theme-countdown-section");
    expect(steps[5].selector).toBe("#theme-countdown-section");
    expect(steps[5].title).toBe("translated_THM_HELP_COUNTDOWN_TITLE");
    expect(steps[5].position).toBe("bottom");

    // Step 6: Fuel gauge section
    expect(steps[6].targetId).toBe("theme-fuel-section");
    expect(steps[6].selector).toBe("#theme-fuel-section");
    expect(steps[6].title).toBe("translated_THM_HELP_FUEL_TITLE");
    expect(steps[6].position).toBe("bottom");

    // Step 7: Audio section
    expect(steps[7].targetId).toBe("theme-audio-section");
    expect(steps[7].selector).toBe("#theme-audio-section");
    expect(steps[7].title).toBe("translated_THM_HELP_AUDIO_TITLE");
    expect(steps[7].position).toBe("bottom");

    // Step 8: Driver audio overrides section
    expect(steps[8].targetId).toBe("theme-driver-audio-section");
    expect(steps[8].selector).toBe("#theme-driver-audio-section");
    expect(steps[8].title).toBe("translated_THM_HELP_DRIVER_AUDIO_TITLE");
    expect(steps[8].position).toBe("bottom");

    // Verify onEnter callbacks expand corresponding sections
    expect(sectionsExpanded.flags).toBeFalse();
    steps[4].onEnter?.();
    expect(sectionsExpanded.flags).toBeTrue();

    expect(sectionsExpanded.countdown).toBeFalse();
    steps[5].onEnter?.();
    expect(sectionsExpanded.countdown).toBeTrue();

    expect(sectionsExpanded.fuelGauge).toBeFalse();
    steps[6].onEnter?.();
    expect(sectionsExpanded.fuelGauge).toBeTrue();

    expect(sectionsExpanded.audio).toBeFalse();
    steps[7].onEnter?.();
    expect(sectionsExpanded.audio).toBeTrue();

    expect(sectionsExpanded.driverAudioOverrides).toBeFalse();
    steps[8].onEnter?.();
    expect(sectionsExpanded.driverAudioOverrides).toBeTrue();
  });

  it("should handle null or undefined sectionsExpanded gracefully in onEnter", () => {
    const steps = ThemeEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      undefined,
    );
    expect(() => steps[4].onEnter?.()).not.toThrow();
  });

  it("should invoke onSectionExpanded callback when provided on onEnter", () => {
    const onExpandedSpy = jasmine.createSpy("onSectionExpanded");
    const steps = ThemeEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      sectionsExpanded,
      onExpandedSpy,
    );
    steps[4].onEnter?.();
    expect(onExpandedSpy).toHaveBeenCalledTimes(1);
    steps[8].onEnter?.();
    expect(onExpandedSpy).toHaveBeenCalledTimes(2);
  });

  it("should support backward-compatible buildThemeEditorHelpSteps function", () => {
    const expandSectionSpy = jasmine.createSpy("expandSection");
    const onSectionExpandedSpy = jasmine.createSpy("onSectionExpanded");
    const ctx: ThemeEditorHelpContext = {
      translationService: mockTranslationService,
      sectionsExpanded,
      expandSection: expandSectionSpy,
      onSectionExpanded: onSectionExpandedSpy,
    };

    const steps = buildThemeEditorHelpSteps(ctx);
    expect(steps.length).toBe(9);

    steps[4].onEnter?.();
    expect(sectionsExpanded.flags).toBeTrue();
    expect(expandSectionSpy).toHaveBeenCalledWith("flags");
    expect(onSectionExpandedSpy).toHaveBeenCalled();
  });

  it("should verify that all help links in en.json for theme editor steps are well-formed", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    } as any;

    const steps = ThemeEditorHelpHelper.getHelpSteps(
      realTranslationService,
      sectionsExpanded,
    );

    expect(steps.length).toBe(9);

    for (const step of steps) {
      expect(step.title).not.toBe("");
      expect(step.content).not.toBe("");

      if (step.content.includes("help-link")) {
        GuideStepTestHelper.verifyHelpLinksInContent(
          step.content,
          `Step: ${step.title}`,
        );
      }
    }

    // Step-specific link destination checks
    expect(steps[0].content).toContain("help-article-themes");
    expect(steps[2].content).toContain("help-article-toolbar");
    expect(steps[3].content).toContain("help-article-themes");
    expect(steps[3].content).toContain("help-section-top-selectors");
    expect(steps[4].content).toContain("help-article-themes");
    expect(steps[4].content).toContain("help-section-flags");
    expect(steps[5].content).toContain("help-article-themes");
    expect(steps[5].content).toContain("help-section-countdown");
    expect(steps[6].content).toContain("help-article-themes");
    expect(steps[6].content).toContain("help-section-fuel-gauge");
    expect(steps[7].content).toContain("help-article-themes");
    expect(steps[7].content).toContain("help-section-audio");
    expect(steps[8].content).toContain("help-article-themes");
    expect(steps[8].content).toContain("help-section-driver-audio-overrides");
  });
});
