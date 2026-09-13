import { buildDriverEditorHelpSteps } from "./driver-editor-help.helper";

describe("DriverEditorHelpHelper", () => {
  it("should generate all 14 help steps in the expected order with onEnter callbacks", () => {
    let audioExpanded = false;
    const mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    } as any;

    const steps = buildDriverEditorHelpSteps({
      translationService: mockTranslationService,
      expandAudioSection: () => {
        audioExpanded = true;
      },
    });

    expect(steps.length).toBe(16);
    expect(steps[0].title).toBe("translated_DE_HELP_WELCOME_TITLE");
    expect(steps[0].position).toBe("center");

    const selectors = steps.map((s) => s.selector).filter(Boolean);
    expect(selectors).toEqual([
      "#driver-avatar-section",
      "#driver-name-section",
      "#driver-name-nickname-link-section",
      "#driver-nickname-section",
      "#driver-audio-section",
      "#driver-lap-audio",
      "#driver-best-lap-audio",
      "#driver-race-best-lap-audio",
      "#driver-race-lane-best-lap-audio",
      "#driver-heat-best-lap-audio",
      "#driver-new-race-leader-audio",
      "#driver-new-heat-leader-audio",
      "#driver-overall-best-lap-audio",
      "#driver-overall-lane-best-lap-audio",
      "#driver-false-start-audio",
    ]);

    // Test onEnter for an audio step
    expect(audioExpanded).toBeFalse();
    const audioStep = steps.find((s) => s.selector === "#driver-audio-section");
    expect(audioStep).toBeDefined();
    audioStep?.onEnter?.();
    expect(audioExpanded).toBeTrue();
  });
});
