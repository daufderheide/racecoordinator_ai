import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { TranslationService } from "@app/services/translation.service";

import {
  getAudioHelpSteps,
  getCustomUiConfigHelpSteps,
  getGeneralAndCustomUisHelpSteps,
  getRacedayLayoutHelpSteps,
  getThemesHelpSteps,
  getUiEditorHelpSteps,
  handleUiEditorHelpStep,
  UiEditorHelpContext,
} from "./ui-editor-help.helper";

describe("ui-editor-help.helper", () => {
  let ctx: UiEditorHelpContext;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;
  let defaultUi: CustomUI;
  let defaultTheme: Theme;
  let sectionsExpanded: Record<string, boolean>;

  beforeEach(() => {
    translationServiceSpy = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    translationServiceSpy.translate.and.callFake((key: string) => key);

    defaultUi = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
    };

    defaultTheme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    sectionsExpanded = {};

    ctx = {
      translationService: translationServiceSpy,
      sectionsExpanded,
      getActiveCustomUi: () => defaultUi,
      getDefaultCustomUi: () => defaultUi,
      getActiveThemeId: () => defaultTheme.entity_id,
      getDefaultTheme: () => defaultTheme,
      selectFirstWidget: jasmine.createSpy("selectFirstWidget"),
    };
  });

  it("should return general and custom UI steps", () => {
    const steps = getGeneralAndCustomUisHelpSteps(ctx);
    expect(steps.length).toBeGreaterThan(2);
    expect(steps[0].title).toBe("UE_TITLE");

    steps[1].onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();
  });

  it("should return raceday layout steps and handle onEnter callbacks", () => {
    const steps = getRacedayLayoutHelpSteps(ctx);
    expect(steps.length).toBeGreaterThan(4);

    const sortStep = steps.find((s) => s.selector === "#help-raceday-sort");
    sortStep?.onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();
    expect(sectionsExpanded["ui_default_ui_layout_rc_ai"]).toBeTrue();

    const zoomStep = steps.find((s) => s.selector === "#help-raceday-zoom");
    expect(zoomStep).toBeDefined();
    zoomStep?.onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();

    const aspectStep = steps.find(
      (s) => s.selector === "#help-raceday-aspect-ratio",
    );
    expect(aspectStep).toBeDefined();
    aspectStep?.onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();

    const scaleModeStep = steps.find(
      (s) => s.selector === "#help-raceday-scale-mode",
    );
    expect(scaleModeStep).toBeDefined();
    scaleModeStep?.onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();

    const resetStep = steps.find((s) => s.selector === "#help-raceday-reset");
    expect(resetStep).toBeDefined();
    resetStep?.onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();

    const clearStep = steps.find((s) => s.selector === "#help-raceday-clear");
    expect(clearStep).toBeDefined();
    clearStep?.onEnter?.();
    expect(sectionsExpanded["customUIs"]).toBeTrue();

    const inspectorStep = steps.find(
      (s) => s.selector === "#help-widget-inspector",
    );
    expect(inspectorStep).toBeDefined();
    inspectorStep?.onEnter?.();
    expect(ctx.selectFirstWidget).toHaveBeenCalledWith(defaultUi);
  });

  it("should return themes steps and expand themes section", () => {
    const steps = getThemesHelpSteps(ctx);
    expect(steps.length).toBeGreaterThan(3);

    const themeStep = steps.find((s) => s.selector === "#help-themes");
    themeStep?.onEnter?.();
    expect(sectionsExpanded["themes"]).toBeTrue();
  });

  it("should return custom UI config steps including urgent timeout and callout spacing", () => {
    const steps = getCustomUiConfigHelpSteps(ctx);
    expect(steps.length).toBeGreaterThan(5);

    const widgetDirStep = steps.find(
      (s) => s.selector === "#help-custom-widget-dir",
    );
    expect(widgetDirStep).toBeDefined();
    widgetDirStep?.onEnter?.();
    expect(sectionsExpanded["config"]).toBeTrue();

    const urgentTimeoutStep = steps.find(
      (s) => s.selector === "#help-audio-urgent-timeout",
    );
    expect(urgentTimeoutStep).toBeDefined();
    expect(urgentTimeoutStep?.title).toBe("UE_LABEL_URGENT_QUEUE_TIMEOUT");
    urgentTimeoutStep?.onEnter?.();
    expect(sectionsExpanded["config"]).toBeTrue();

    const calloutSpacingStep = steps.find(
      (s) => s.selector === "#help-audio-callout-spacing",
    );
    expect(calloutSpacingStep).toBeDefined();
    expect(calloutSpacingStep?.title).toBe("UE_LABEL_CALLOUT_SPACING");
    calloutSpacingStep?.onEnter?.();
    expect(sectionsExpanded["config"]).toBeTrue();
  });

  it("should return theme audio help steps", () => {
    const steps = getAudioHelpSteps(ctx);
    expect(steps.length).toBeGreaterThan(4);

    const yellowFlagStep = steps.find(
      (s) => s.selector === "#help-audio-yellowflag",
    );
    expect(yellowFlagStep).toBeDefined();
    expect(yellowFlagStep?.title).toBe("UE_LABEL_YELLOW_FLAG_AUDIO");
    yellowFlagStep?.onEnter?.();
    expect(sectionsExpanded["themes"]).toBeTrue();
    expect(sectionsExpanded["theme_default_classic_rc_ai"]).toBeTrue();
    expect(sectionsExpanded["audio"]).toBeTrue();
  });

  it("should return all combined steps in correct order", () => {
    const allSteps = getUiEditorHelpSteps(ctx);
    expect(allSteps.length).toBeGreaterThan(20);
    expect(allSteps[0].title).toBe("UE_TITLE");
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
      const step1 = {
        selector: "#help-audio-urgent-timeout",
        title: "",
        content: "",
      };
      expect(handleUiEditorHelpStep(step1, sectionsExpanded)).toBeTrue();
      expect(sectionsExpanded["config"]).toBeTrue();

      // already expanded
      expect(handleUiEditorHelpStep(step1, sectionsExpanded)).toBeFalse();

      const step2 = {
        selector: "#help-audio-callout-spacing",
        title: "",
        content: "",
      };
      // config already true
      expect(handleUiEditorHelpStep(step2, sectionsExpanded)).toBeFalse();

      const step3 = { selector: "#help-themes-list", title: "", content: "" };
      expect(handleUiEditorHelpStep(step3, sectionsExpanded)).toBeTrue();
      expect(sectionsExpanded["themes"]).toBeTrue();
    });
  });
});
