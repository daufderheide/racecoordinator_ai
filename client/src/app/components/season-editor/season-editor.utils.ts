import { Season } from "@app/models/season";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export function cloneSeason(season: Season): Season {
  return JSON.parse(JSON.stringify(season));
}

export function areSeasonsEqual(a: Season, b: Season): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function getSeasonEditorHelpSteps(
  hasDemoRaces: boolean,
  translationService: TranslationService,
): GuideStep[] {
  const demoStep: GuideStep = hasDemoRaces
    ? {
        selector: "#season-editor-demo-badge",
        title: translationService.translate("SE_HELP_DEMO_BADGE_TITLE"),
        content: translationService.translate(
          "SE_HELP_DEMO_BADGE_PRESENT_CONTENT",
        ),
        position: "bottom",
      }
    : {
        selector: "#season-editor-meta",
        title: translationService.translate("SE_HELP_DEMO_BADGE_TITLE"),
        content: translationService.translate(
          "SE_HELP_DEMO_BADGE_ABSENT_CONTENT",
        ),
        position: "bottom",
      };

  return [
    {
      title: translationService.translate("SE_HELP_WELCOME_TITLE"),
      content: translationService.translate("SE_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    {
      selector: "#season-name",
      title: translationService.translate("SE_HELP_NAME_TITLE"),
      content: translationService.translate("SE_HELP_NAME_CONTENT"),
      position: "right",
    },
    {
      selector: "#season-drops",
      title: translationService.translate("SE_HELP_DROPS_TITLE"),
      content: translationService.translate("SE_HELP_DROPS_CONTENT"),
      position: "right",
    },
    {
      selector: "#season-editor-races-run",
      title: translationService.translate("SE_HELP_RACES_RUN_TITLE"),
      content: translationService.translate("SE_HELP_RACES_RUN_CONTENT"),
      position: "bottom",
    },
    demoStep,
    {
      selector: "#btn-add-race",
      title: translationService.translate("SE_HELP_ADD_RACE_TITLE"),
      content: translationService.translate("SE_HELP_ADD_RACE_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#season-editor-standings",
      title: translationService.translate("SE_HELP_STANDINGS_TITLE"),
      content: translationService.translate("SE_HELP_STANDINGS_CONTENT"),
      position: "left",
    },
    {
      selector: "#season-editor-breakdown",
      title: translationService.translate("SE_HELP_BREAKDOWN_TITLE"),
      content: translationService.translate("SE_HELP_BREAKDOWN_CONTENT"),
      position: "left",
    },
  ];
}
