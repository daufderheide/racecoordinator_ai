import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class DatabaseManagerHelpHelper {
  static getHelpSteps(
    translationService: TranslationService,
    ensureDatabaseSelected?: () => void,
  ): GuideStep[] {
    const t = translationService;
    return [
      // 1) Database List (LHS sidebar)
      {
        targetId: "sidebar-list",
        selector: "#sidebar-list",
        title: t.translate("DBM_HELP_SIDEBAR_TITLE"),
        content: t.translate("DBM_HELP_SIDEBAR_CONTENT"),
        position: "right",
      },
      // 2) Database Summary (Statistics panel)
      {
        targetId: "detail-panel",
        selector: "#detail-panel",
        title: t.translate("DBM_HELP_DETAIL_TITLE"),
        content: t.translate("DBM_HELP_DETAIL_CONTENT"),
        position: "left",
        onEnter: ensureDatabaseSelected,
      },
      // 3) Active Database Status Checkmark
      {
        targetId: "database-active-status",
        selector: "#database-active-status",
        title: t.translate("DBM_HELP_STATUS_TITLE"),
        content: t.translate("DBM_HELP_STATUS_CONTENT"),
        position: "bottom",
        onEnter: ensureDatabaseSelected,
      },
      // 4) Database Management Toolbar
      getEditorToolbarHelpStep(t, false),
    ];
  }
}

export function getDatabaseManagerHelpSteps(
  translationService: TranslationService,
  ensureDatabaseSelected?: () => void,
): GuideStep[] {
  return DatabaseManagerHelpHelper.getHelpSteps(
    translationService,
    ensureDatabaseSelected,
  );
}
