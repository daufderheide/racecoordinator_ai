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

function buildAudioHelpSteps(ctx: DriverEditorHelpContext): GuideStep[] {
  const t = ctx.translationService;
  const onEnter = ctx.expandAudioSection;
  return [
    {
      selector: "#driver-audio-section",
      title: t.translate("DE_HELP_AUDIO_SECTION_TITLE"),
      content: t.translate("DE_HELP_AUDIO_SECTION_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-lap-audio",
      title: t.translate("DE_HELP_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-best-lap-audio",
      title: t.translate("DE_HELP_BEST_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_BEST_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-race-best-lap-audio",
      title: t.translate("DE_HELP_RACE_BEST_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_RACE_BEST_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-race-lane-best-lap-audio",
      title: t.translate("DE_HELP_RACE_LANE_BEST_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_RACE_LANE_BEST_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-heat-best-lap-audio",
      title: t.translate("DE_HELP_HEAT_BEST_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_HEAT_BEST_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-new-race-leader-audio",
      title: t.translate("DE_HELP_NEW_RACE_LEADER_SOUND_TITLE"),
      content: t.translate("DE_HELP_NEW_RACE_LEADER_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-new-heat-leader-audio",
      title: t.translate("DE_HELP_NEW_HEAT_LEADER_SOUND_TITLE"),
      content: t.translate("DE_HELP_NEW_HEAT_LEADER_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-overall-best-lap-audio",
      title: t.translate("DE_HELP_OVERALL_BEST_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_OVERALL_BEST_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-overall-lane-best-lap-audio",
      title: t.translate("DE_HELP_OVERALL_LANE_BEST_LAP_SOUND_TITLE"),
      content: t.translate("DE_HELP_OVERALL_LANE_BEST_LAP_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-pit-in-audio",
      title: t.translate("DE_HELP_PIT_IN_SOUND_TITLE"),
      content: t.translate("DE_HELP_PIT_IN_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-fuel-audio",
      title: t.translate("DE_HELP_FUEL_SOUND_TITLE"),
      content: t.translate("DE_HELP_FUEL_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
    {
      selector: "#driver-false-start-audio",
      title: t.translate("DE_HELP_FALSE_START_SOUND_TITLE"),
      content: t.translate("DE_HELP_FALSE_START_SOUND_CONTENT"),
      position: "left",
      onEnter,
    },
  ];
}

export function buildDriverEditorHelpSteps(
  ctx: DriverEditorHelpContext,
): GuideStep[] {
  return [...buildGeneralHelpSteps(ctx), ...buildAudioHelpSteps(ctx)];
}
