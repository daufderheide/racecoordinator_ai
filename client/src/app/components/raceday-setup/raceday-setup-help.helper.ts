import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export function getDriverHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    {
      title: translationService.translate("RDS_HELP_WELCOME_TITLE"),
      content: translationService.translate("RDS_HELP_WELCOME_CONTENT"),
    },
    {
      targetId: "available-drivers-section",
      title: translationService.translate("RDS_HELP_DRIVER_AVAILABLE_TITLE"),
      content: translationService.translate(
        "RDS_HELP_DRIVER_AVAILABLE_CONTENT",
      ),
      position: "right",
    },
    {
      targetId: "racing-drivers-section",
      title: translationService.translate("RDS_HELP_DRIVER_RACING_TITLE"),
      content: translationService.translate("RDS_HELP_DRIVER_RACING_CONTENT"),
      position: "right",
    },
  ];
}

export function getRaceHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    {
      targetId: "race-selection-section",
      title: translationService.translate("RDS_HELP_RACE_SEASON_TITLE"),
      content: translationService.translate("RDS_HELP_RACE_SEASON_CONTENT"),
      position: "left",
    },
    {
      targetId: "race-controls",
      title: translationService.translate("RDS_HELP_START_RACE_TITLE"),
      content: translationService.translate("RDS_HELP_START_RACE_CONTENT"),
      position: "top",
    },
    {
      targetId: "setup-menu-bar",
      title: translationService.translate("RDS_HELP_MENU_BAR_TITLE"),
      content: translationService.translate("RDS_HELP_MENU_BAR_CONTENT"),
      position: "bottom",
    },
  ];
}

export function getRacedaySetupHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    ...getDriverHelpSteps(translationService),
    ...getRaceHelpSteps(translationService),
  ];
}
