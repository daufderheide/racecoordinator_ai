import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export interface DriverEditorHelpContext {
  translationService: TranslationService;
  expandAudioSection: () => void;
}

interface AudioGroupHelpDef {
  targetId: string;
  titleKey: string;
  contentKey: string;
}

const AUDIO_GROUP_HELP_DEFS: AudioGroupHelpDef[] = [
  {
    targetId: "driver-personal-lap-group",
    titleKey: "DE_HELP_AUDIO_PERSONAL_TITLE",
    contentKey: "DE_HELP_AUDIO_PERSONAL_CONTENT",
  },
  {
    targetId: "driver-race-best-lap-group",
    titleKey: "DE_HELP_AUDIO_RACE_TITLE",
    contentKey: "DE_HELP_AUDIO_RACE_CONTENT",
  },
  {
    targetId: "driver-overall-best-lap-group",
    titleKey: "DE_HELP_AUDIO_OVERALL_TITLE",
    contentKey: "DE_HELP_AUDIO_OVERALL_CONTENT",
  },
  {
    targetId: "driver-event-sounds-group",
    titleKey: "DE_HELP_AUDIO_EVENTS_TITLE",
    contentKey: "DE_HELP_AUDIO_EVENTS_CONTENT",
  },
];

export function buildDriverEditorHelpSteps(
  ctx: DriverEditorHelpContext,
): GuideStep[] {
  const t = ctx.translationService;
  return [
    // 1) Driver editor: Brief overview of the driver editor and a link to the help center
    {
      title: t.translate("DE_HELP_WELCOME_TITLE"),
      content: t.translate("DE_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    // 2) Select driver: includes 1 of 8 count/controls next to the driver name
    {
      targetId: "editor-object-nav",
      selector: "#editor-object-nav",
      title: t.translate("DE_HELP_SELECTOR_TITLE"),
      content: t.translate("DE_HELP_SELECTOR_CONTENT"),
      position: "bottom",
    },
    // 3) Toolbar: highlight entire toolbar, point at edit/readonly pencil/checkmark
    getEditorToolbarHelpStep(t, true),
    // 4) LHS: Points to avatar, name/nickname link, and label selector
    {
      targetId: "driver-profile-panel",
      selector: "#driver-profile-panel",
      title: t.translate("DE_HELP_PROFILE_TITLE"),
      content: t.translate("DE_HELP_PROFILE_CONTENT"),
      position: "right",
    },
    // 5) Point to each of the audio sections with links to the help center
    ...AUDIO_GROUP_HELP_DEFS.map((def) => ({
      targetId: def.targetId,
      selector: `#${def.targetId}`,
      title: t.translate(def.titleKey),
      content: t.translate(def.contentKey),
      position: "left" as const,
      onEnter: ctx.expandAudioSection,
    })),
  ];
}
