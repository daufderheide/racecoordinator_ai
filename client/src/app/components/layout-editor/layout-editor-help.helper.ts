import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class LayoutEditorHelpHelper {
  static getHelpSteps(translationService: TranslationService): GuideStep[] {
    return [
      // 1) Layout Editor Welcome Overview
      {
        title: translationService.translate("LE_HELP_WELCOME_TITLE"),
        content: translationService.translate("LE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Select Layout Navigation
      {
        targetId: "editor-object-nav",
        selector: "#editor-object-nav",
        title: translationService.translate("LE_HELP_SELECTOR_TITLE"),
        content: translationService.translate("LE_HELP_SELECTOR_CONTENT"),
        position: "bottom",
      },
      // 3) Toolbar (Edit Pencil & Actions)
      {
        targetId: "edit-track-btn",
        highlightTargetId: "toolbar-container",
        selector: "#edit-track-btn",
        highlightSelector: ".toolbar-container",
        title: translationService.translate("TOOLBAR_HELP_TITLE"),
        content: translationService.translate("TOOLBAR_HELP_CONTENT"),
        position: "bottom",
      },
      // 4) Layout Editor Top Toolbar (Name, Zoom, Aspect Ratio, Scale, Select Widget)
      {
        targetId: "layout-controls-toolbar",
        selector: "#layout-controls-toolbar",
        title: translationService.translate("LE_HELP_CONTROLS_TITLE"),
        content: translationService.translate("LE_HELP_CONTROLS_CONTENT"),
        position: "bottom",
      },
      // 5) Widget Library and Widget Config Buttons
      {
        targetId: "layout-panel-toggles",
        selector: "#layout-panel-toggles",
        title: translationService.translate("LE_HELP_PANELS_TITLE"),
        content: translationService.translate("LE_HELP_PANELS_CONTENT"),
        position: "bottom",
      },
      // 6) The Canvas
      {
        targetId: "help-raceday-canvas",
        selector: "#help-raceday-canvas",
        title: translationService.translate("LE_HELP_CANVAS_TITLE"),
        content: translationService.translate("LE_HELP_CANVAS_CONTENT"),
        position: "top",
      },
    ];
  }
}

export function buildLayoutEditorHelpSteps(
  translationService: TranslationService,
  _selectFirstWidget?: () => void,
): GuideStep[] {
  return LayoutEditorHelpHelper.getHelpSteps(translationService);
}
