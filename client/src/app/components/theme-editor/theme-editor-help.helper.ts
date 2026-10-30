import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export interface ThemeEditorHelpContext {
  translationService: TranslationService;
  expandSection: (sectionKey: string) => void;
}

export function buildThemeEditorHelpSteps(
  ctx: ThemeEditorHelpContext,
): GuideStep[] {
  const { translationService, expandSection } = ctx;
  return [
    {
      selector: "#editor-object-selector",
      title: translationService.translate("THM_HELP_SELECTOR_TITLE"),
      content: translationService.translate("THM_HELP_SELECTOR_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".header-actions",
      title: translationService.translate("THM_HELP_TOOLBAR_TITLE"),
      content: translationService.translate("THM_HELP_TOOLBAR_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#theme-name-section",
      title: translationService.translate("THM_HELP_NAME_TITLE"),
      content: translationService.translate("THM_HELP_NAME_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#theme-ui-selector",
      title: translationService.translate("THM_HELP_UI_SELECTOR_TITLE"),
      content: translationService.translate("THM_HELP_UI_SELECTOR_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#theme-driver-station-theme",
      title: translationService.translate("THM_HELP_DRIVER_STATION_TITLE"),
      content: translationService.translate("THM_HELP_DRIVER_STATION_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#theme-driver-view-theme",
      title: translationService.translate("THM_HELP_DRIVER_VIEW_TITLE"),
      content: translationService.translate("THM_HELP_DRIVER_VIEW_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#theme-flags-section",
      title: translationService.translate("THM_HELP_FLAGS_TITLE"),
      content: translationService.translate("THM_HELP_FLAGS_CONTENT"),
      position: "bottom",
      onEnter: () => expandSection("flags"),
    },
    {
      selector: "#theme-countdown-section",
      title: translationService.translate("THM_HELP_COUNTDOWN_TITLE"),
      content: translationService.translate("THM_HELP_COUNTDOWN_CONTENT"),
      position: "bottom",
      onEnter: () => expandSection("countdown"),
    },
    {
      selector: "#theme-fuel-section",
      title: translationService.translate("THM_HELP_FUEL_TITLE"),
      content: translationService.translate("THM_HELP_FUEL_CONTENT"),
      position: "bottom",
      onEnter: () => expandSection("fuelGauge"),
    },
    {
      selector: "#theme-audio-section",
      title: translationService.translate("THM_HELP_AUDIO_TITLE"),
      content: translationService.translate("THM_HELP_AUDIO_CONTENT"),
      position: "bottom",
      onEnter: () => expandSection("audio"),
    },
    {
      selector: "#theme-driver-audio-section",
      title: translationService.translate("THM_HELP_DRIVER_AUDIO_TITLE"),
      content: translationService.translate("THM_HELP_DRIVER_AUDIO_CONTENT"),
      position: "bottom",
      onEnter: () => expandSection("driverAudioOverrides"),
    },
  ];
}
