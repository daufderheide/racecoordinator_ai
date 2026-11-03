import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

import { ThemeEditorSections } from "./theme-editor.component";

export interface ThemeEditorHelpContext {
  translationService: TranslationService;
  sectionsExpanded?: ThemeEditorSections | Record<string, boolean>;
  expandSection?: (sectionKey: string) => void;
  onSectionExpanded?: () => void;
}

export class ThemeEditorHelpHelper {
  static getHelpSteps(
    translationService: TranslationService,
    sectionsExpanded?: ThemeEditorSections | Record<string, boolean>,
    onSectionExpanded?: () => void,
  ): GuideStep[] {
    const t = translationService;
    return [
      // 1) Theme editor: General overview with Help Center link
      {
        title: t.translate("THM_HELP_WELCOME_TITLE"),
        content: t.translate("THM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Select theme: Nav with count
      {
        targetId: "editor-object-nav",
        selector: "#editor-object-nav",
        title: t.translate("THM_HELP_SELECTOR_TITLE"),
        content: t.translate("THM_HELP_SELECTOR_CONTENT"),
        position: "bottom",
      },
      // 3) Toolbar: Standard toolbar step pointing at pencil
      getEditorToolbarHelpStep(t, true),
      // 4) Top selectors: Name, UI layout, driver station theme, driver view theme
      {
        targetId: "theme-controls-bar",
        selector: "#theme-controls-bar",
        title: t.translate("THM_HELP_TOP_SELECTORS_TITLE"),
        content: t.translate("THM_HELP_TOP_SELECTORS_CONTENT"),
        position: "bottom",
      },
      // 5) Flags expander
      {
        targetId: "theme-flags-section",
        selector: "#theme-flags-section",
        title: t.translate("THM_HELP_FLAGS_TITLE"),
        content: t.translate("THM_HELP_FLAGS_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded["flags"] = true;
          }
          onSectionExpanded?.();
        },
      },
      // 6) Countdown expander
      {
        targetId: "theme-countdown-section",
        selector: "#theme-countdown-section",
        title: t.translate("THM_HELP_COUNTDOWN_TITLE"),
        content: t.translate("THM_HELP_COUNTDOWN_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded["countdown"] = true;
          }
          onSectionExpanded?.();
        },
      },
      // 7) Fuel Gauge expander
      {
        targetId: "theme-fuel-section",
        selector: "#theme-fuel-section",
        title: t.translate("THM_HELP_FUEL_TITLE"),
        content: t.translate("THM_HELP_FUEL_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded["fuelGauge"] = true;
          }
          onSectionExpanded?.();
        },
      },
      // 8) Audio expander
      {
        targetId: "theme-audio-section",
        selector: "#theme-audio-section",
        title: t.translate("THM_HELP_AUDIO_TITLE"),
        content: t.translate("THM_HELP_AUDIO_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded["audio"] = true;
          }
          onSectionExpanded?.();
        },
      },
      // 9) Driver Audio Overrides expander
      {
        targetId: "theme-driver-audio-section",
        selector: "#theme-driver-audio-section",
        title: t.translate("THM_HELP_DRIVER_AUDIO_TITLE"),
        content: t.translate("THM_HELP_DRIVER_AUDIO_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded["driverAudioOverrides"] = true;
          }
          onSectionExpanded?.();
        },
      },
    ];
  }
}

export function buildThemeEditorHelpSteps(
  ctx: ThemeEditorHelpContext,
): GuideStep[] {
  const sections = ctx.sectionsExpanded || {
    flags: false,
    countdown: false,
    fuelGauge: false,
    audio: false,
    driverAudioOverrides: false,
  };
  return ThemeEditorHelpHelper.getHelpSteps(
    ctx.translationService,
    sections,
    () => {
      if (ctx.expandSection) {
        if (sections["flags"]) ctx.expandSection("flags");
        if (sections["countdown"]) ctx.expandSection("countdown");
        if (sections["fuelGauge"]) ctx.expandSection("fuelGauge");
        if (sections["audio"]) ctx.expandSection("audio");
        if (sections["driverAudioOverrides"])
          ctx.expandSection("driverAudioOverrides");
      }
      ctx.onSectionExpanded?.();
    },
  );
}
