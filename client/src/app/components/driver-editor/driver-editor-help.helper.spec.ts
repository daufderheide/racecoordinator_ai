import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import { buildDriverEditorHelpSteps } from "./driver-editor-help.helper";

describe("DriverEditorHelpHelper", () => {
  it("should generate all 8 help steps in the expected order with targets and onEnter callbacks", () => {
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

    expect(steps.length).toBe(8);

    // Step 0: Overview (General info)
    expect(steps[0].title).toBe("translated_DE_HELP_WELCOME_TITLE");
    expect(steps[0].content).toBe("translated_DE_HELP_WELCOME_CONTENT");
    expect(steps[0].position).toBe("center");
    expect(steps[0].targetId).toBeUndefined();

    // Step 1: Select driver nav
    expect(steps[1].targetId).toBe("editor-object-nav");
    expect(steps[1].selector).toBe("#editor-object-nav");
    expect(steps[1].title).toBe("translated_DE_HELP_SELECTOR_TITLE");
    expect(steps[1].position).toBe("bottom");

    // Step 2: Toolbar (pointing at edit button, highlighting toolbar container)
    expect(steps[2].targetId).toBe("edit-track-btn");
    expect(steps[2].highlightTargetId).toBe("toolbar-container");
    expect(steps[2].selector).toBe("#edit-track-btn");
    expect(steps[2].highlightSelector).toBe(".toolbar-container");
    expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[2].position).toBe("bottom");

    // Step 3: LHS (driver profile panel)
    expect(steps[3].targetId).toBe("driver-profile-panel");
    expect(steps[3].selector).toBe("#driver-profile-panel");
    expect(steps[3].title).toBe("translated_DE_HELP_PROFILE_TITLE");
    expect(steps[3].position).toBe("right");

    // Step 4: Personal lap sounds
    expect(steps[4].targetId).toBe("driver-personal-lap-group");
    expect(steps[4].selector).toBe("#driver-personal-lap-group");
    expect(steps[4].title).toBe("translated_DE_HELP_AUDIO_PERSONAL_TITLE");
    expect(steps[4].position).toBe("left");

    // Step 5: Race best lap sounds
    expect(steps[5].targetId).toBe("driver-race-best-lap-group");
    expect(steps[5].selector).toBe("#driver-race-best-lap-group");
    expect(steps[5].title).toBe("translated_DE_HELP_AUDIO_RACE_TITLE");
    expect(steps[5].position).toBe("left");

    // Step 6: Overall best lap sounds
    expect(steps[6].targetId).toBe("driver-overall-best-lap-group");
    expect(steps[6].selector).toBe("#driver-overall-best-lap-group");
    expect(steps[6].title).toBe("translated_DE_HELP_AUDIO_OVERALL_TITLE");
    expect(steps[6].position).toBe("left");

    // Step 7: Event sounds
    expect(steps[7].targetId).toBe("driver-event-sounds-group");
    expect(steps[7].selector).toBe("#driver-event-sounds-group");
    expect(steps[7].title).toBe("translated_DE_HELP_AUDIO_EVENTS_TITLE");
    expect(steps[7].position).toBe("left");

    // Verify audio onEnter callbacks
    expect(audioExpanded).toBeFalse();
    steps[4].onEnter?.();
    expect(audioExpanded).toBeTrue();

    audioExpanded = false;
    steps[5].onEnter?.();
    expect(audioExpanded).toBeTrue();

    audioExpanded = false;
    steps[6].onEnter?.();
    expect(audioExpanded).toBeTrue();

    audioExpanded = false;
    steps[7].onEnter?.();
    expect(audioExpanded).toBeTrue();
  });

  it("should verify that all help links in en.json for driver editor steps are well-formed", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    } as any;

    const steps = buildDriverEditorHelpSteps({
      translationService: realTranslationService,
      expandAudioSection: () => {},
    });

    expect(steps.length).toBe(8);

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
    expect(steps[0].content).toContain("help-article-driver-editor");
    expect(steps[2].content).toContain("help-article-toolbar");
    expect(steps[3].content).toContain("help-article-driver-editor");
    expect(steps[3].content).toContain("help-section-driver-profile");
    expect(steps[4].content).toContain("help-article-driver-editor");
    expect(steps[4].content).toContain("help-section-personal-lap-sounds");
    expect(steps[5].content).toContain("help-article-driver-editor");
    expect(steps[5].content).toContain("help-section-race-lap-sounds");
    expect(steps[6].content).toContain("help-article-driver-editor");
    expect(steps[6].content).toContain("help-section-overall-best-lap-sounds");
    expect(steps[7].content).toContain("help-article-driver-editor");
    expect(steps[7].content).toContain("help-section-event-sounds");
  });
});
