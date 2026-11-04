import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export interface UiEditorHelpContext {
  translationService: TranslationService;
  sectionsExpanded?: Record<string, boolean>;
  onSectionExpanded?: () => void;
}

export function buildUiEditorHelpContext(comp: any): UiEditorHelpContext {
  return {
    translationService: comp.translationService,
    sectionsExpanded: comp.sectionsExpanded,
    onSectionExpanded: () => {
      comp.saveExpanderState?.();
      comp.cdr?.markForCheck?.();
    },
  };
}

export class UiEditorHelpHelper {
  static getHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
    const t = ctx.translationService;
    return [
      // 1) Customize UI overview with Help Center link
      {
        title: t.translate("UE_HELP_WELCOME_TITLE"),
        content: t.translate("UE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Toolbar
      getEditorToolbarHelpStep(t, false),
      // 3) Customize UI Settings expander
      {
        targetId: "ui-config-section",
        selector: "#ui-config-section",
        title: t.translate("UE_HELP_CONFIG_SECTION_TITLE"),
        content: t.translate("UE_HELP_CONFIG_SECTION_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (ctx.sectionsExpanded) {
            ctx.sectionsExpanded["config"] = true;
          }
          ctx.onSectionExpanded?.();
        },
      },
      // 4) Audio Settings expander
      {
        targetId: "audio-settings-section",
        selector: "#audio-settings-section",
        title: t.translate("UE_HELP_AUDIO_SECTION_TITLE"),
        content: t.translate("UE_HELP_AUDIO_SECTION_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (ctx.sectionsExpanded) {
            ctx.sectionsExpanded["audioSettings"] = true;
          }
          ctx.onSectionExpanded?.();
        },
      },
    ];
  }
}

export function getUiEditorHelpSteps(ctx: UiEditorHelpContext): GuideStep[] {
  return UiEditorHelpHelper.getHelpSteps(ctx);
}

export function handleUiEditorHelpStep(
  step: GuideStep | null,
  sectionsExpanded: Record<string, boolean>,
): boolean {
  if (!step?.selector) return false;
  let changed = false;
  const expandMap: Record<string, string> = {
    "#ui-config-section": "config",
    "#help-custom-ui": "config",
    "#audio-settings-section": "audioSettings",
    "#help-audio-settings": "audioSettings",
  };
  for (const [prefix, sec] of Object.entries(expandMap)) {
    if (step.selector.startsWith(prefix) && !sectionsExpanded[sec]) {
      sectionsExpanded[sec] = true;
      changed = true;
    }
  }
  return changed;
}
