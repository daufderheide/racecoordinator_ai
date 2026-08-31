import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

import { isCustomUiDefault } from "./ui-editor-crud.helper";
import { findDefaultWidgetId } from "./ui-editor-widget.helper";

export interface UiEditorHelpContext {
  translationService: TranslationService;
  sectionsExpanded: Record<string, boolean>;
  getActiveCustomUi: () => CustomUI | undefined;
  getDefaultCustomUi: () => CustomUI | undefined;
  getActiveThemeId: () => string | undefined;
  getDefaultTheme: () => Theme | undefined;
  selectFirstWidget?: (targetUi: CustomUI) => void;
}

export function buildUiEditorHelpContext(comp: any): UiEditorHelpContext {
  return {
    translationService: comp.translationService,
    sectionsExpanded: comp.sectionsExpanded,
    getActiveCustomUi: () => comp.activeCustomUi,
    getDefaultCustomUi: () =>
      comp.displayCustomUIs.find((u: any) => isCustomUiDefault(u)),
    getActiveThemeId: () => comp.editingSettings?.activeThemeId,
    getDefaultTheme: () => comp.displayThemes.find((t: any) => t.is_default),
    selectFirstWidget: (targetUi: CustomUI) => {
      const widgetId = findDefaultWidgetId(comp.getLayout(targetUi));
      if (widgetId) {
        comp.onWidgetSelected(widgetId, targetUi);
        comp.cdr.detectChanges();
      }
    },
  };
}

function expandCustomUiSection(ctx: UiEditorHelpContext): void {
  ctx.sectionsExpanded["customUIs"] = true;
  const targetUi = ctx.getActiveCustomUi() || ctx.getDefaultCustomUi();
  if (targetUi) {
    ctx.sectionsExpanded[`ui_${targetUi.entity_id}`] = true;
  }
}

function expandThemeSection(
  ctx: UiEditorHelpContext,
  nestedKey?: string,
): void {
  ctx.sectionsExpanded["themes"] = true;
  const targetThemeId =
    ctx.getActiveThemeId() || ctx.getDefaultTheme()?.entity_id;
  if (targetThemeId) {
    ctx.sectionsExpanded[`theme_${targetThemeId}`] = true;
  }
  if (nestedKey) {
    ctx.sectionsExpanded[nestedKey] = true;
  }
}

export function getGeneralAndCustomUisHelpSteps(
  ctx: UiEditorHelpContext,
): GuideStep[] {
  const { translationService, sectionsExpanded } = ctx;
  return [
    {
      title: translationService.translate("UE_TITLE"),
      content: translationService.translate("UE_HELP_GENERAL"),
      position: "center",
    },
    {
      selector: "#help-custom-uis",
      title: translationService.translate("UE_HEADER_CUSTOM_UI_LAYOUTS"),
      content: translationService.translate("UE_HELP_RACEDAY_UI"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["customUIs"] = true;
      },
    },
    {
      selector: "#help-custom-uis-add",
      title: translationService.translate("UE_BTN_CREATE_CUSTOM_UI"),
      content: translationService.translate("UE_HELP_CREATE_CUSTOM_UI_BTN"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["customUIs"] = true;
      },
    },
    {
      selector: "#help-default-ui",
      title: translationService.translate("UE_LABEL_DEFAULT_UI"),
      content: translationService.translate("UE_HELP_DEFAULT_UI"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["customUIs"] = true;
        const defaultUi = ctx.getDefaultCustomUi();
        if (defaultUi) {
          sectionsExpanded[`ui_${defaultUi.entity_id}`] = true;
        }
      },
    },
  ];
}

export function getRacedayLayoutHelpSteps(
  ctx: UiEditorHelpContext,
): GuideStep[] {
  const { translationService } = ctx;
  return [
    {
      selector: "#help-raceday-sort",
      title: translationService.translate("UE_LABEL_SORT_STANDINGS"),
      content: translationService.translate("UE_HELP_RACEDAY_SORT"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-highlight",
      title: translationService.translate("UE_LABEL_HIGHLIGHT_LAP"),
      content: translationService.translate("UE_HELP_RACEDAY_HIGHLIGHT"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-reset",
      title: translationService.translate("UI_EDITOR_RESET_LAYOUT_DEFAULTS"),
      content: translationService.translate("UE_HELP_RACEDAY_RESET"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-import-export",
      title:
        translationService.translate("UE_HELP_RACEDAY_IMPORT_EXPORT_TITLE") ||
        "Import / Export Layout",
      content: translationService.translate("UE_HELP_RACEDAY_IMPORT_EXPORT"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-canvas",
      title:
        translationService.translate("UE_HELP_RACEDAY_CANVAS_TITLE") ||
        "Canvas Area",
      content: translationService.translate("UE_HELP_RACEDAY_CANVAS"),
      position: "center",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-widget-inspector",
      title:
        translationService.translate(
          "UE_HELP_RACEDAY_WIDGET_INSPECTOR_TITLE",
        ) || "Widget Inspector",
      content: translationService.translate("UE_HELP_RACEDAY_WIDGET_INSPECTOR"),
      position: "left",
      onEnter: () => {
        expandCustomUiSection(ctx);
        const targetUi = ctx.getActiveCustomUi() || ctx.getDefaultCustomUi();
        if (targetUi && ctx.selectFirstWidget) {
          ctx.selectFirstWidget(targetUi);
        }
      },
    },
  ];
}

export function getThemesHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
  const { translationService, sectionsExpanded } = ctx;
  return [
    {
      selector: "#help-themes",
      title: translationService.translate("UE_HEADER_THEMES_ALL"),
      content: translationService.translate("UE_HELP_THEMES"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["themes"] = true;
      },
    },
    {
      selector: "#help-themes-add",
      title: translationService.translate("UE_BTN_CREATE_THEME"),
      content: translationService.translate("UE_HELP_CREATE_THEME_BTN"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["themes"] = true;
      },
    },
    {
      selector: "#help-default-theme",
      title: translationService.translate("UE_LABEL_DEFAULT_THEME"),
      content: translationService.translate("UE_HELP_DEFAULT_THEME"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["themes"] = true;
        const defaultTheme = ctx.getDefaultTheme();
        if (defaultTheme) {
          sectionsExpanded[`theme_${defaultTheme.entity_id}`] = true;
        }
      },
    },
    {
      selector: "#help-theme-ui-selector",
      title: translationService.translate("UE_LABEL_CUSTOM_UI"),
      content: translationService.translate("UE_HELP_THEME_UI_SELECTOR"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx),
    },
    {
      selector: "#help-theme-flags",
      title: translationService.translate("UE_HEADER_FLAGS"),
      content: translationService.translate("UE_HELP_THEME_FLAGS"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "flags"),
    },
    {
      selector: "#help-theme-countdown",
      title: translationService.translate("UE_HEADER_COUNTDOWN"),
      content: translationService.translate("UE_HELP_THEME_COUNTDOWN"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "countdown"),
    },
    {
      selector: "#help-theme-fuel",
      title: translationService.translate("UE_HEADER_FUEL_GAUGE"),
      content: translationService.translate("UE_HELP_THEME_FUEL"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "fuelGauge"),
    },
    {
      selector: "#help-theme-audio",
      title: translationService.translate("UE_HEADER_AUDIO"),
      content: translationService.translate("UE_HELP_THEME_AUDIO"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
  ];
}

export function getAudioHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
  const { translationService } = ctx;
  return [
    {
      selector: "#help-audio-yellowflag",
      title: translationService.translate("UE_LABEL_YELLOW_FLAG_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_YELLOWFLAG"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-countdown",
      title: translationService.translate("UE_LABEL_COUNTDOWN_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_COUNTDOWN"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-seconds-left",
      title: translationService.translate("UE_LABEL_SECONDS_LEFT_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_SECONDS_LEFT"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-halfway",
      title: translationService.translate("UE_LABEL_SECONDS_LEFT_HALFWAY"),
      content: translationService.translate("UE_HELP_AUDIO_HALFWAY"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-heat-over",
      title: translationService.translate("UE_LABEL_HEAT_OVER_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_HEAT_OVER"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-race-over",
      title: translationService.translate("UE_LABEL_RACE_OVER_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_RACE_OVER"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-min-lap-time",
      title: translationService.translate("UE_LABEL_MIN_LAP_TIME_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_MIN_LAP_TIME"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
    {
      selector: "#help-audio-drift-lap",
      title: translationService.translate("UE_LABEL_DRIFT_LAP_AUDIO"),
      content: translationService.translate("UE_HELP_AUDIO_DRIFT_LAP"),
      position: "bottom",
      onEnter: () => expandThemeSection(ctx, "audio"),
    },
  ];
}

export function getCustomUiConfigHelpSteps(
  ctx: UiEditorHelpContext,
): GuideStep[] {
  const { translationService, sectionsExpanded } = ctx;
  return [
    {
      selector: "#help-custom-ui",
      title: translationService.translate("UE_HEADER_CUSTOM_UI"),
      content: translationService.translate("UE_HELP_CUSTOM_UI_SETTINGS"),
      position: "top",
      onEnter: () => {
        sectionsExpanded["config"] = true;
      },
    },
    {
      selector: "#help-custom-ui-dir",
      title: translationService.translate("UE_DIRECTORY_LABEL"),
      content: translationService.translate("UE_HELP_CUSTOM_UI_DIR"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["config"] = true;
      },
    },
    {
      selector: "#help-custom-widget-dir",
      title: translationService.translate("UE_WIDGET_DIRECTORY_LABEL"),
      content: translationService.translate("UE_HELP_CUSTOM_WIDGET_DIR"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["config"] = true;
      },
    },
    {
      selector: "#help-export-template",
      title: translationService.translate("UE_LABEL_EXPORT_TEMPLATE"),
      content: translationService.translate("UE_HELP_EXPORT_TEMPLATE"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["config"] = true;
      },
    },
    {
      selector: "#help-page-transition",
      title: translationService.translate("UE_LABEL_PAGE_TRANSITION"),
      content: translationService.translate("UE_HELP_PAGE_TRANSITION"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["config"] = true;
      },
    },
  ];
}

export function getUiEditorHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
  return [
    ...getGeneralAndCustomUisHelpSteps(ctx),
    ...getRacedayLayoutHelpSteps(ctx),
    ...getThemesHelpSteps(ctx),
    ...getAudioHelpSteps(ctx),
    ...getCustomUiConfigHelpSteps(ctx),
  ];
}

export function handleUiEditorHelpStep(
  step: GuideStep | null,
  sectionsExpanded: Record<string, boolean>,
): boolean {
  if (!step?.selector) return false;
  let changed = false;
  const expandMap: Record<string, string> = {
    "#help-raceday-": "racedayLayout",
    "#help-practice-ui": "practiceRacedayLayout",
    "#help-themes": "themes",
    "#help-custom-ui": "config",
  };
  for (const [prefix, sec] of Object.entries(expandMap)) {
    if (step.selector.startsWith(prefix) && !sectionsExpanded[sec]) {
      sectionsExpanded[sec] = true;
      changed = true;
    }
  }
  return changed;
}
