import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export interface DriverEditorHelpContext {
  translationService: TranslationService;
  expandAudioSection: () => void;
}

function buildGeneralHelpSteps(ctx: DriverEditorHelpContext): GuideStep[] {
  const t = ctx.translationService;
  return [
    {
      title: t.translate("DE_HELP_WELCOME_TITLE"),
      content: t.translate("DE_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    {
      selector: "#editor-object-selector",
      title: t.translate("DE_HELP_SELECTOR_TITLE"),
      content: t.translate("DE_HELP_SELECTOR_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#driver-avatar-section",
      title: t.translate("DE_HELP_AVATAR_TITLE"),
      content: t.translate("DE_HELP_AVATAR_CONTENT"),
      position: "right",
    },
    {
      selector: "#driver-name-section",
      title: t.translate("DE_HELP_NAME_TITLE"),
      content: t.translate("DE_HELP_NAME_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#driver-name-nickname-link-section",
      title: t.translate("DE_HELP_LINK_TITLE"),
      content: t.translate("DE_HELP_LINK_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#driver-nickname-section",
      title: t.translate("DE_HELP_NICKNAME_TITLE"),
      content: t.translate("DE_HELP_NICKNAME_CONTENT"),
      position: "bottom",
    },
  ];
}

interface AudioHelpDef {
  selector: string;
  titleKey: string;
  contentKey: string;
}

const AUDIO_HELP_DEFS: AudioHelpDef[] = [
  {
    selector: "#driver-audio-section",
    titleKey: "DE_HELP_AUDIO_SECTION_TITLE",
    contentKey: "DE_HELP_AUDIO_SECTION_CONTENT",
  },
  {
    selector: "#driver-lap-audio",
    titleKey: "DE_HELP_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-best-lap-audio",
    titleKey: "DE_HELP_BEST_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_BEST_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-race-best-lap-audio",
    titleKey: "DE_HELP_RACE_BEST_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_RACE_BEST_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-race-lane-best-lap-audio",
    titleKey: "DE_HELP_RACE_LANE_BEST_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_RACE_LANE_BEST_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-heat-best-lap-audio",
    titleKey: "DE_HELP_HEAT_BEST_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_HEAT_BEST_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-new-race-leader-audio",
    titleKey: "DE_HELP_NEW_RACE_LEADER_SOUND_TITLE",
    contentKey: "DE_HELP_NEW_RACE_LEADER_SOUND_CONTENT",
  },
  {
    selector: "#driver-new-heat-leader-audio",
    titleKey: "DE_HELP_NEW_HEAT_LEADER_SOUND_TITLE",
    contentKey: "DE_HELP_NEW_HEAT_LEADER_SOUND_CONTENT",
  },
  {
    selector: "#driver-overall-best-lap-audio",
    titleKey: "DE_HELP_OVERALL_BEST_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_OVERALL_BEST_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-overall-lane-best-lap-audio",
    titleKey: "DE_HELP_OVERALL_LANE_BEST_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_OVERALL_LANE_BEST_LAP_SOUND_CONTENT",
  },
  {
    selector: "#driver-pit-in-audio",
    titleKey: "DE_HELP_PIT_IN_SOUND_TITLE",
    contentKey: "DE_HELP_PIT_IN_SOUND_CONTENT",
  },
  {
    selector: "#driver-fuel-audio",
    titleKey: "DE_HELP_FUEL_SOUND_TITLE",
    contentKey: "DE_HELP_FUEL_SOUND_CONTENT",
  },
  {
    selector: "#driver-false-start-audio",
    titleKey: "DE_HELP_FALSE_START_SOUND_TITLE",
    contentKey: "DE_HELP_FALSE_START_SOUND_CONTENT",
  },
  {
    selector: "#driver-drift-lap-audio",
    titleKey: "DE_HELP_DRIFT_LAP_SOUND_TITLE",
    contentKey: "DE_HELP_DRIFT_LAP_SOUND_CONTENT",
  },
];

function buildAudioHelpSteps(ctx: DriverEditorHelpContext): GuideStep[] {
  const t = ctx.translationService;
  const onEnter = ctx.expandAudioSection;
  return AUDIO_HELP_DEFS.map((def) => ({
    selector: def.selector,
    title: t.translate(def.titleKey),
    content: t.translate(def.contentKey),
    position: "left" as const,
    onEnter,
  }));
}

export function buildDriverEditorHelpSteps(
  ctx: DriverEditorHelpContext,
): GuideStep[] {
  return [...buildGeneralHelpSteps(ctx), ...buildAudioHelpSteps(ctx)];
}
