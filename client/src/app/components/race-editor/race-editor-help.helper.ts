import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

import { RaceEditorSections } from "./race-editor-ui.helper";

interface ExpanderHelpDef {
  targetId: string;
  titleKey: string;
  contentKey: string;
  sectionKey: keyof RaceEditorSections;
}

const EXPANDER_HELP_DEFS: ExpanderHelpDef[] = [
  {
    targetId: "general-section",
    titleKey: "RE_HELP_EXPANDER_GENERAL_TITLE",
    contentKey: "RE_HELP_EXPANDER_GENERAL_CONTENT",
    sectionKey: "general",
  },
  {
    targetId: "heats-section",
    titleKey: "RE_HELP_EXPANDER_HEATS_TITLE",
    contentKey: "RE_HELP_EXPANDER_HEATS_CONTENT",
    sectionKey: "heats",
  },
  {
    targetId: "scoring-section",
    titleKey: "RE_HELP_EXPANDER_SCORING_TITLE",
    contentKey: "RE_HELP_EXPANDER_SCORING_CONTENT",
    sectionKey: "scoring",
  },
  {
    targetId: "points-scoring-section",
    titleKey: "RE_HELP_EXPANDER_POINTS_SCORING_TITLE",
    contentKey: "RE_HELP_EXPANDER_POINTS_SCORING_CONTENT",
    sectionKey: "points_scoring",
  },
  {
    targetId: "group-section",
    titleKey: "RE_HELP_EXPANDER_GROUPS_TITLE",
    contentKey: "RE_HELP_EXPANDER_GROUPS_CONTENT",
    sectionKey: "groups",
  },
  {
    targetId: "start-method-section",
    titleKey: "RE_HELP_EXPANDER_START_METHOD_TITLE",
    contentKey: "RE_HELP_EXPANDER_START_METHOD_CONTENT",
    sectionKey: "start_method",
  },
  {
    targetId: "team-options-section",
    titleKey: "RE_HELP_EXPANDER_TEAM_OPTIONS_TITLE",
    contentKey: "RE_HELP_EXPANDER_TEAM_OPTIONS_CONTENT",
    sectionKey: "team",
  },
  {
    targetId: "analog-fuel-section",
    titleKey: "RE_HELP_EXPANDER_ANALOG_FUEL_TITLE",
    contentKey: "RE_HELP_EXPANDER_ANALOG_FUEL_CONTENT",
    sectionKey: "fuel_analog",
  },
  {
    targetId: "digital-fuel-outer-section",
    titleKey: "RE_HELP_EXPANDER_DIGITAL_FUEL_TITLE",
    contentKey: "RE_HELP_EXPANDER_DIGITAL_FUEL_CONTENT",
    sectionKey: "fuel_digital",
  },
  {
    targetId: "season-points-section",
    titleKey: "RE_HELP_EXPANDER_SEASON_POINTS_TITLE",
    contentKey: "RE_HELP_EXPANDER_SEASON_POINTS_CONTENT",
    sectionKey: "season_points",
  },
];

export class RaceEditorHelpHelper {
  static getHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
    onSectionExpanded?: () => void,
  ): GuideStep[] {
    const t = translationService;
    return [
      // 1) Race editor: Brief overview of the race editor and a link to the help center
      {
        title: t.translate("RE_HELP_WELCOME_TITLE"),
        content: t.translate("RE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Select race: Setup same as the driver/team editor. Highlight the selector and count
      {
        targetId: "editor-object-nav",
        selector: "#editor-object-nav",
        title: t.translate("RE_HELP_SELECTOR_TITLE"),
        content: t.translate("RE_HELP_SELECTOR_CONTENT"),
        position: "bottom",
      },
      // 3) Toolbar, use the same text and help center link as the driver. Point to pencil directly
      getEditorToolbarHelpStep(t, true),
      // 4) LHS: Points entire left panel. Generically describe with link to help center
      {
        targetId: "race-config-panel",
        selector: "#race-config-panel",
        title: t.translate("RE_HELP_LHS_TITLE"),
        content: t.translate("RE_HELP_LHS_CONTENT"),
        position: "right",
      },
      // 5) Point to the entire tab bar at the top explaining it is a shortcut
      {
        targetId: "race-editor-tabs",
        selector: "#race-editor-tabs",
        title: t.translate("RE_HELP_TABS_TITLE"),
        content: t.translate("RE_HELP_TABS_CONTENT"),
        position: "bottom",
      },
      // 6) Point to each expander title and explain at a high level what each expander controls
      ...EXPANDER_HELP_DEFS.map((def) => ({
        targetId: def.targetId,
        selector: `#${def.targetId}`,
        title: t.translate(def.titleKey),
        content: t.translate(def.contentKey),
        position: "left" as const,
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded[def.sectionKey] = true;
          }
          if (onSectionExpanded) {
            onSectionExpanded();
          }
        },
      })),
    ];
  }
}
