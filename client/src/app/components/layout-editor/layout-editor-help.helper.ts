import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export function buildLayoutEditorHelpSteps(
  translationService: TranslationService,
  selectFirstWidget?: () => void,
): GuideStep[] {
  return [
    {
      selector: "#editor-object-selector",
      title: translationService.translate("LE_HELP_SELECTOR_TITLE"),
      content: translationService.translate("LE_HELP_SELECTOR_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".header-actions",
      title: translationService.translate("LE_HELP_TOOLBAR_TITLE"),
      content: translationService.translate("LE_HELP_TOOLBAR_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#help-raceday-canvas",
      title: translationService.translate("LE_HELP_CANVAS_TITLE"),
      content: translationService.translate("LE_HELP_CANVAS_CONTENT"),
      position: "top",
    },
    {
      selector: "#help-widget-inspector",
      title: translationService.translate("LE_HELP_INSPECTOR_TITLE"),
      content: translationService.translate("LE_HELP_INSPECTOR_CONTENT"),
      position: "left",
      onEnter: () => {
        if (selectFirstWidget) {
          selectFirstWidget();
        }
      },
    },
  ];
}
