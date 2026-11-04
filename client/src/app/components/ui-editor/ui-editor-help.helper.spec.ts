import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  buildUiEditorHelpContext,
  getUiEditorHelpSteps,
  handleUiEditorHelpStep,
  UiEditorHelpContext,
  UiEditorHelpHelper,
} from "./ui-editor-help.helper";

describe("ui-editor-help.helper", () => {
  let ctx: UiEditorHelpContext;
  let mockTranslationService: any;
  let sectionsExpanded: Record<string, boolean>;
  let onSectionExpandedSpy: jasmine.Spy;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    };
    sectionsExpanded = {};
    onSectionExpandedSpy = jasmine.createSpy("onSectionExpanded");

    ctx = {
      translationService: mockTranslationService,
      sectionsExpanded,
      onSectionExpanded: onSectionExpandedSpy,
    };
  });

  it("should return all 4 expected help steps in order with targets and selectors", () => {
    const steps = UiEditorHelpHelper.getHelpSteps(ctx);
    expect(steps.length).toBe(4);

    // Step 0: Welcome / Overview
    expect(steps[0].title).toBe("translated_UE_HELP_WELCOME_TITLE");
    expect(steps[0].content).toBe("translated_UE_HELP_WELCOME_CONTENT");
    expect(steps[0].position).toBe("center");
    expect(steps[0].targetId).toBeUndefined();

    // Step 1: Toolbar
    expect(steps[1].targetId).toBe("toolbar-container");
    expect(steps[1].selector).toBe(".toolbar-container");
    expect(steps[1].highlightTargetId).toBe("toolbar-container");
    expect(steps[1].highlightSelector).toBe(".toolbar-container");
    expect(steps[1].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[1].position).toBe("bottom");

    // Step 2: Customize UI Settings Expander
    expect(steps[2].targetId).toBe("ui-config-section");
    expect(steps[2].selector).toBe("#ui-config-section");
    expect(steps[2].title).toBe("translated_UE_HELP_CONFIG_SECTION_TITLE");
    expect(steps[2].position).toBe("bottom");
    steps[2].onEnter?.();
    expect(sectionsExpanded["config"]).toBeTrue();
    expect(onSectionExpandedSpy).toHaveBeenCalledTimes(1);

    // Step 3: Audio Settings Expander
    expect(steps[3].targetId).toBe("audio-settings-section");
    expect(steps[3].selector).toBe("#audio-settings-section");
    expect(steps[3].title).toBe("translated_UE_HELP_AUDIO_SECTION_TITLE");
    expect(steps[3].position).toBe("bottom");
    steps[3].onEnter?.();
    expect(sectionsExpanded["audioSettings"]).toBeTrue();
    expect(onSectionExpandedSpy).toHaveBeenCalledTimes(2);
  });

  it("should support getUiEditorHelpSteps helper function", () => {
    const steps = getUiEditorHelpSteps(ctx);
    expect(steps.length).toBe(4);
    expect(steps[0].title).toBe("translated_UE_HELP_WELCOME_TITLE");
    expect(steps[1].targetId).toBe("toolbar-container");
    expect(steps[2].targetId).toBe("ui-config-section");
    expect(steps[3].targetId).toBe("audio-settings-section");
  });

  it("should build UiEditorHelpContext from component instance", () => {
    const fakeComp = {
      translationService: mockTranslationService,
      sectionsExpanded: { config: false },
      saveExpanderState: jasmine.createSpy("saveExpanderState"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };
    const built = buildUiEditorHelpContext(fakeComp);
    expect(built.translationService).toBe(mockTranslationService);
    expect(built.sectionsExpanded).toBe(fakeComp.sectionsExpanded);
    built.onSectionExpanded?.();
    expect(fakeComp.saveExpanderState).toHaveBeenCalled();
    expect(fakeComp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should have valid help center links in all steps containing help links", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    };
    const realCtx: UiEditorHelpContext = {
      translationService: realTranslationService as any,
      sectionsExpanded: {},
    };
    const steps = UiEditorHelpHelper.getHelpSteps(realCtx);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.content.includes("help-link")) {
        GuideStepTestHelper.verifyHelpLinksInContent(
          step.content,
          `UI Editor Step ${i + 1} (${step.title})`,
        );
      }
    }

    expect(steps[0].content).toContain("help-article-ui-editor");
    expect(steps[1].content).toContain("help-article-toolbar");
    expect(steps[2].content).toContain("help-article-ui-editor");
    expect(steps[3].content).toContain("help-article-ui-editor");
  });

  describe("handleUiEditorHelpStep", () => {
    it("should return false when step is null or has no selector", () => {
      expect(handleUiEditorHelpStep(null, sectionsExpanded)).toBeFalse();
      expect(
        handleUiEditorHelpStep(
          { selector: "", title: "", content: "" },
          sectionsExpanded,
        ),
      ).toBeFalse();
    });

    it("should expand sections based on selector prefixes", () => {
      const stepConfig = {
        selector: "#ui-config-section",
        title: "",
        content: "",
      };
      expect(handleUiEditorHelpStep(stepConfig, sectionsExpanded)).toBeTrue();
      expect(sectionsExpanded["config"]).toBeTrue();

      // already expanded
      expect(handleUiEditorHelpStep(stepConfig, sectionsExpanded)).toBeFalse();

      const stepAudio = {
        selector: "#audio-settings-section",
        title: "",
        content: "",
      };
      expect(handleUiEditorHelpStep(stepAudio, sectionsExpanded)).toBeTrue();
      expect(sectionsExpanded["audioSettings"]).toBeTrue();

      // already expanded
      expect(handleUiEditorHelpStep(stepAudio, sectionsExpanded)).toBeFalse();
    });
  });
});
