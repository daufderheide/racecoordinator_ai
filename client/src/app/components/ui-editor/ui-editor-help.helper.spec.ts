import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { TranslationService } from "@app/services/translation.service";

import {
  getCustomUiConfigHelpSteps,
  getGeneralAndCustomUisHelpSteps,
  getRacedayLayoutHelpSteps,
  getThemesHelpSteps,
  getUiEditorHelpSteps,
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

    const inspectorStep = steps.find(
      (s) => s.selector === "#help-widget-inspector",
    );
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

  it("should return custom UI config steps", () => {
    const steps = getCustomUiConfigHelpSteps(ctx);
    expect(steps.length).toBeGreaterThan(3);

    const widgetDirStep = steps.find(
      (s) => s.selector === "#help-custom-widget-dir",
    );
    expect(widgetDirStep).toBeDefined();
    widgetDirStep?.onEnter?.();
    expect(sectionsExpanded["config"]).toBeTrue();
  });

  it("should return all combined steps in correct order", () => {
    const allSteps = getUiEditorHelpSteps(ctx);
    expect(allSteps.length).toBeGreaterThan(20);
    expect(allSteps[0].title).toBe("UE_TITLE");
  });
});
