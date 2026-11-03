import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class AssetManagerHelpHelper {
  static getHelpSteps(translationService: TranslationService): GuideStep[] {
    const t = translationService;
    return [
      // 1) Asset Manager Overview
      {
        title: t.translate("AM_HELP_WELCOME_TITLE"),
        content: t.translate("AM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Toolbar
      getEditorToolbarHelpStep(t, false),
      // 3) Database Statistics
      {
        targetId: "asset-stats-panel",
        selector: "#asset-stats-panel",
        title: t.translate("AM_HELP_STATS_TITLE"),
        content: t.translate("AM_HELP_STATS_CONTENT"),
        position: "right",
      },
      // 4) Add Assets (All 4 buttons on LHS)
      {
        targetId: "asset-creation-actions",
        selector: "#asset-creation-actions",
        title: t.translate("AM_HELP_ADD_ASSETS_TITLE"),
        content: t.translate("AM_HELP_ADD_ASSETS_CONTENT"),
        position: "right",
      },
      // 5) Asset Library (with hover actions: rename, delete, play)
      {
        targetId: "asset-library-panel",
        selector: "#asset-library-panel",
        title: t.translate("AM_HELP_LIBRARY_TITLE"),
        content: t.translate("AM_HELP_LIBRARY_CONTENT"),
        position: "left",
      },
      // 6) Filter Tabs (Filter by asset type)
      {
        targetId: "asset-filter-tabs",
        selector: "#asset-filter-tabs",
        title: t.translate("AM_HELP_FILTER_TABS_TITLE"),
        content: t.translate("AM_HELP_FILTER_TABS_CONTENT"),
        position: "bottom",
      },
      // 7) View Layout Options
      {
        targetId: "asset-layout-switcher",
        selector: "#asset-layout-switcher",
        title: t.translate("AM_HELP_LAYOUT_TITLE"),
        content: t.translate("AM_HELP_LAYOUT_CONTENT"),
        position: "bottom",
      },
      // 8) Filter by Name
      {
        targetId: "asset-filter-input",
        selector: "#asset-filter-input",
        title: t.translate("AM_HELP_FILTER_NAME_TITLE"),
        content: t.translate("AM_HELP_FILTER_NAME_CONTENT"),
        position: "bottom",
      },
    ];
  }
}

export function getAssetManagerHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return AssetManagerHelpHelper.getHelpSteps(translationService);
}
