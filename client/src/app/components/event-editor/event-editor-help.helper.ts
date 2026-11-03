import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class EventEditorHelpHelper {
  static getHelpSteps(translationService: TranslationService): GuideStep[] {
    const t = translationService;
    return [
      // 1) Event editor: Brief overview of the event editor and a link to the help center
      {
        title: t.translate("EE_HELP_WELCOME_TITLE"),
        content: t.translate("EE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Select event: Setup same as the driver/team/race editor. Highlight the selector and count
      {
        targetId: "editor-object-nav",
        selector: "#editor-object-nav",
        title: t.translate("EE_HELP_SELECTOR_TITLE"),
        content: t.translate("EE_HELP_SELECTOR_CONTENT"),
        position: "bottom",
      },
      // 3) Toolbar: use the same text and help center link as the driver. Point to the pencil directly.
      getEditorToolbarHelpStep(t, true),
      // 4) LHS: Points entire left panel. Generically describe with link to help center
      {
        targetId: "event-config-panel",
        selector: "#event-config-panel",
        title: t.translate("EE_HELP_LHS_TITLE"),
        content: t.translate("EE_HELP_LHS_CONTENT"),
        position: "right",
      },
      // 5) Point to the existing race sequence with a link to the help center documentation
      {
        targetId: "event-race-list",
        selector: "#event-race-list",
        title: t.translate("EE_HELP_RACE_LIST_TITLE"),
        content: t.translate("EE_HELP_RACE_LIST_CONTENT"),
        position: "left",
      },
    ];
  }
}
