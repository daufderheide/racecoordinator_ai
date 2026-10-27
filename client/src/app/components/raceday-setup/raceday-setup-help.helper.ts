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
      selector: "#available-drivers-section .header-actions",
      title: translationService.translate("RDS_HELP_DRIVER_TEAM_STATS_TITLE"),
      content: translationService.translate(
        "RDS_HELP_DRIVER_TEAM_STATS_CONTENT",
      ),
      position: "bottom",
    },
    {
      selector: "#available-drivers-section .list-search",
      title: translationService.translate(
        "RDS_HELP_SEARCH_AVAILABLE_DRIVERS_TITLE",
      ),
      content: translationService.translate(
        "RDS_HELP_SEARCH_AVAILABLE_DRIVERS_CONTENT",
      ),
      position: "bottom",
    },
    {
      targetId: "racing-drivers-section",
      title: translationService.translate("RDS_HELP_DRIVER_RACING_TITLE"),
      content: translationService.translate("RDS_HELP_DRIVER_RACING_CONTENT"),
      position: "right",
    },
    {
      selector: "#racing-drivers-section .section-header",
      title: translationService.translate("RDS_HELP_DRIVER_ACTIONS_TITLE"),
      content: translationService.translate("RDS_HELP_DRIVER_ACTIONS_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#racing-drivers-section .list-search",
      title: translationService.translate("RDS_HELP_SEARCH_DRIVERS_TITLE"),
      content: translationService.translate("RDS_HELP_SEARCH_DRIVERS_CONTENT"),
      position: "bottom",
    },
  ];
}

export function getRaceHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    {
      selector: ".custom-dropdown-container",
      title: translationService.translate("RDS_HELP_RACE_SELECTION_TITLE"),
      content: translationService.translate("RDS_HELP_RACE_SELECTION_CONTENT"),
      position: "top",
    },
    {
      selector: ".event-details-card",
      title: translationService.translate("RDS_HELP_SELECTION_SUMMARY_TITLE"),
      content: translationService.translate(
        "RDS_HELP_SELECTION_SUMMARY_CONTENT",
      ),
      position: "top",
    },
    {
      selector: ".preview-panel .search-wrapper",
      title: translationService.translate("RDS_HELP_SEARCH_TITLE"),
      content: translationService.translate("RDS_HELP_SEARCH_CONTENT"),
      position: "top",
    },
    {
      selector: ".season-selection-wrapper",
      title: translationService.translate("RDS_HELP_SEASON_TITLE"),
      content: translationService.translate("RDS_HELP_SEASON_CONTENT"),
      position: "top",
    },
    {
      targetId: "race-card-0",
      title: translationService.translate("RDS_HELP_RECENT_RACE_TITLE"),
      content: translationService.translate(
        "RDS_HELP_RECENT_RACE_MOST_RECENT_CONTENT",
      ),
      position: "bottom",
    },
    {
      targetId: "race-card-1",
      title: translationService.translate("RDS_HELP_RECENT_RACE_TITLE"),
      content: translationService.translate("RDS_HELP_RECENT_RACE_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".btn-start",
      title: translationService.translate("RDS_HELP_START_RACE_TITLE"),
      content: translationService.translate("RDS_HELP_START_RACE_CONTENT"),
      position: "top",
    },
    {
      selector: ".btn-demo",
      title: translationService.translate("RDS_HELP_START_DEMO_TITLE"),
      content: translationService.translate("RDS_HELP_START_DEMO_CONTENT"),
      position: "top",
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
