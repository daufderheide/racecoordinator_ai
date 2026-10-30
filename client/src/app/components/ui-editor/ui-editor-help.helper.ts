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
      content: translationService.translate("UE_LAYOUTS_LINK_DESC"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["customUIs"] = true;
      },
    },
    {
      selector: "#btn-open-layout-editor",
      title: translationService.translate("UE_BTN_OPEN_LAYOUT_EDITOR"),
      content: translationService.translate("UE_LAYOUTS_LINK_DESC"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["customUIs"] = true;
      },
    },
  ];
}

export function getRacedayLayoutHelpSteps(
  ctx: UiEditorHelpContext,
): GuideStep[] {
  const { translationService } = ctx;
  const selectInspectorWidget = () => {
    expandCustomUiSection(ctx);
    const targetUi = ctx.getActiveCustomUi() || ctx.getDefaultCustomUi();
    if (targetUi && ctx.selectFirstWidget) {
      ctx.selectFirstWidget(targetUi);
    }
  };

  return [
    {
      selector: "#help-raceday-zoom",
      title: translationService.translate("UI_EDITOR_ZOOM_TITLE"),
      content: translationService.translate("UE_HELP_RACEDAY_ZOOM"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-aspect-ratio",
      title: translationService.translate("UI_EDITOR_LAYOUT_ASPECT_RATIO"),
      content: translationService.translate("UE_HELP_RACEDAY_ASPECT_RATIO"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-scale-mode",
      title: translationService.translate("UI_EDITOR_LAYOUT_SCALE_MODE"),
      content: translationService.translate("UE_HELP_RACEDAY_SCALE_MODE"),
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
      selector: "#help-raceday-clear",
      title: translationService.translate("UI_EDITOR_CLEAR_LAYOUT"),
      content: translationService.translate("UE_HELP_RACEDAY_CLEAR"),
      position: "bottom",
      onEnter: () => expandCustomUiSection(ctx),
    },
    {
      selector: "#help-raceday-import-export",
      title: translationService.translate("UI_EDITOR_IMPORT_EXPORT_TITLE"),
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
        ) || "Widget Configuration",
      content: translationService.translate("UE_HELP_RACEDAY_WIDGET_INSPECTOR"),
      position: "left",
      onEnter: selectInspectorWidget,
    },
    {
      selector: "#help-raceday-sort",
      title: translationService.translate("UE_LABEL_SORT_STANDINGS"),
      content: translationService.translate("UE_HELP_RACEDAY_SORT"),
      position: "left",
      onEnter: selectInspectorWidget,
    },
    {
      selector: "#help-raceday-highlight",
      title: translationService.translate("UE_LABEL_HIGHLIGHT_LAP"),
      content: translationService.translate("UE_HELP_RACEDAY_HIGHLIGHT"),
      position: "left",
      onEnter: selectInspectorWidget,
    },
  ];
}

export function getThemesHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
  const { translationService, sectionsExpanded } = ctx;
  return [
    {
      selector: "#help-themes",
      title: translationService.translate("UE_HEADER_THEMES_ALL"),
      content: translationService.translate("UE_THEMES_LINK_DESC"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["themes"] = true;
      },
    },
    {
      selector: "#btn-open-theme-editor",
      title: translationService.translate("UE_BTN_OPEN_THEME_EDITOR"),
      content: translationService.translate("UE_THEMES_LINK_DESC"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["themes"] = true;
      },
    },
  ];
}

export function getAudioHelpSteps(_ctx: UiEditorHelpContext): GuideStep[] {
  return [];
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

export function getAudioSettingsHelpSteps(
  ctx: UiEditorHelpContext,
): GuideStep[] {
  const { translationService, sectionsExpanded } = ctx;
  return [
    {
      selector: "#help-audio-settings",
      title: translationService.translate("UE_HEADER_AUDIO_SETTINGS"),
      content: translationService.translate("UE_HELP_AUDIO_SETTINGS_DESC"),
      position: "top",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-audio-master-volume",
      title: translationService.translate("UE_LABEL_MASTER_VOLUME"),
      content: translationService.translate("UE_HELP_AUDIO_MASTER_VOLUME"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-audio-urgent-timeout",
      title: translationService.translate("UE_LABEL_URGENT_QUEUE_TIMEOUT"),
      content: translationService.translate("UE_HELP_URGENT_QUEUE_TIMEOUT"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-audio-callout-spacing",
      title: translationService.translate("UE_LABEL_CALLOUT_SPACING"),
      content: translationService.translate("UE_HELP_CALLOUT_SPACING"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-tts-voice",
      title: translationService.translate("UE_LABEL_TTS_VOICE"),
      content: translationService.translate("UE_HELP_TTS_VOICE"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-tts-rate",
      title: translationService.translate("UE_LABEL_TTS_RATE"),
      content: translationService.translate("UE_HELP_TTS_RATE"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-tts-pitch",
      title: translationService.translate("UE_LABEL_TTS_PITCH"),
      content: translationService.translate("UE_HELP_TTS_PITCH"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-tts-volume",
      title: translationService.translate("UE_LABEL_TTS_VOLUME"),
      content: translationService.translate("UE_HELP_TTS_VOLUME"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
    {
      selector: "#help-tts-preview",
      title: translationService.translate("UE_LABEL_TTS_PREVIEW"),
      content: translationService.translate("UE_HELP_TTS_PREVIEW"),
      position: "bottom",
      onEnter: () => {
        sectionsExpanded["audioSettings"] = true;
      },
    },
  ];
}

export function getUiEditorHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
  return [
    ...getGeneralAndCustomUisHelpSteps(ctx),
    ...getThemesHelpSteps(ctx),
    ...getCustomUiConfigHelpSteps(ctx),
    ...getAudioSettingsHelpSteps(ctx),
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
    "#btn-open-theme-editor": "themes",
    "#help-theme-": "themes",
    "#help-custom-ui": "config",
    "#help-export-template": "config",
    "#help-page-transition": "config",
    "#help-audio-settings": "audioSettings",
    "#help-audio-urgent-timeout": "audioSettings",
    "#help-audio-callout-spacing": "audioSettings",
    "#help-tts-": "audioSettings",
  };
  for (const [prefix, sec] of Object.entries(expandMap)) {
    if (step.selector.startsWith(prefix) && !sectionsExpanded[sec]) {
      sectionsExpanded[sec] = true;
      changed = true;
    }
  }
  return changed;
}
