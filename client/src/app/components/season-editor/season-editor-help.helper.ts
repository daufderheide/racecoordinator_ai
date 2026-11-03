import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class SeasonEditorHelpHelper {
  static getHelpSteps(translationService: TranslationService): GuideStep[] {
    const t = translationService;
    return [
      // 1) Season editor: Brief overview of the season editor and a link to the help center
      {
        title: t.translate("SE_HELP_WELCOME_TITLE"),
        content: t.translate("SE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Select season: Setup same as the driver/team/race/etc editor. Highlight the selector and count
      {
        targetId: "editor-object-nav",
        selector: "#editor-object-nav",
        title: t.translate("SE_HELP_SELECTOR_TITLE"),
        content: t.translate("SE_HELP_SELECTOR_CONTENT"),
        position: "bottom",
      },
      // 3) Toolbar: use the same text and help center link as the driver. Point to the pencil directly.
      getEditorToolbarHelpStep(t, true),
      // 4) LHS: Points entire left panel. Generically describe these options with a link to the season help center
      {
        targetId: "season-config-panel",
        selector: "#season-config-panel",
        title: t.translate("SE_HELP_LHS_TITLE"),
        content: t.translate("SE_HELP_LHS_CONTENT"),
        position: "right",
      },
      // 5) Points to the top bar on the rhs with races run, the demo badge, and add races button
      {
        targetId: "season-info-bar",
        selector: "#season-info-bar",
        title: t.translate("SE_HELP_INFO_BAR_TITLE"),
        content: t.translate("SE_HELP_INFO_BAR_CONTENT"),
        position: "bottom",
      },
      // 6) Points to the season standings and explains briefly what it's showing, with a link to the help center
      {
        targetId: "season-editor-standings",
        selector: "#season-editor-standings",
        title: t.translate("SE_HELP_STANDINGS_TITLE"),
        content: t.translate("SE_HELP_STANDINGS_CONTENT"),
        position: "left",
      },
      // 7) Points to the race points breakdown briefly explaining that it shows the points awarded and allows removing races
      {
        targetId: "season-editor-breakdown",
        selector: "#season-editor-breakdown",
        title: t.translate("SE_HELP_BREAKDOWN_TITLE"),
        content: t.translate("SE_HELP_BREAKDOWN_CONTENT"),
        position: "left",
      },
    ];
  }
}
