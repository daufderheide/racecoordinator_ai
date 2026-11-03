import { QueryList } from "@angular/core";
import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { ArduinoEditorComponent } from "@app/components/track-editor/arduino-editor/arduino-editor.component";
import { BartEditorComponent } from "@app/components/track-editor/bart-editor/bart-editor.component";
import { PhidgetEditorComponent } from "@app/components/track-editor/phidget-editor/phidget-editor.component";
import { TrakmateEditorComponent } from "@app/components/track-editor/trakmate-editor/trakmate-editor.component";
import {
  ArduinoConfig,
  BartConfig,
  PhidgetConfig,
  TrackmateConfig,
} from "@app/models/track";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export interface TrackEditorHelpEditors {
  arduinoEditors?: QueryList<ArduinoEditorComponent>;
  bartEditors?: QueryList<BartEditorComponent>;
  phidgetEditors?: QueryList<PhidgetEditorComponent>;
  trakmateEditors?: QueryList<TrakmateEditorComponent>;
}

export interface TrackEditorHelpConfigs {
  arduinoConfigs?: ArduinoConfig[];
  bartConfigs?: BartConfig[];
  phidgetConfigs?: PhidgetConfig[];
  trackmateConfigs?: TrackmateConfig[];
}

function scrollElementToTopOfPreview(targetId: string): void {
  const element = document.getElementById(targetId);
  const container = document.querySelector(".preview-panel");
  if (element && container) {
    const topPos =
      element.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    container.scrollTo({
      top: Math.max(0, topPos - 12),
      behavior: "auto",
    });
  }
}

export class TrackEditorHelpHelper {
  static getBaseHelpSteps(
    translationService: TranslationService,
    sectionsExpanded?: {
      general?: boolean;
      interfaces?: boolean;
      lanes?: boolean;
    },
  ): GuideStep[] {
    const t = translationService;
    return [
      // 1) Track editor: Overview with link to help center
      {
        title: t.translate("TE_HELP_WELCOME_TITLE"),
        content: t.translate("TE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      // 2) Select track: Highlight selector and count
      {
        targetId: "editor-object-nav",
        selector: "#editor-object-nav",
        title: t.translate("TE_HELP_SELECTOR_TITLE"),
        content: t.translate("TE_HELP_SELECTOR_CONTENT"),
        position: "bottom",
      },
      // 3) Toolbar: Standard toolbar step pointing directly to pencil
      getEditorToolbarHelpStep(t, true),
      // 4) LHS: Name, section count, and scale with link to help center
      {
        targetId: "track-general-settings",
        selector: "#track-general-settings",
        title: t.translate("TE_HELP_LHS_TITLE"),
        content: t.translate("TE_HELP_LHS_CONTENT"),
        position: "right",
      },
      // 5) Lane expander: Highlight expander and contents, onEnter expand
      {
        targetId: "lane-editor-section",
        selector: "#lane-editor-section",
        title: t.translate("TE_HELP_LANES_TITLE"),
        content: t.translate("TE_HELP_LANES_CONTENT"),
        position: "right",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded.lanes = true;
          }
        },
      },
      // 6) Interface list on LHS: Highlight all of it, onEnter expand
      {
        targetId: "interface-list-section",
        selector: "#interface-list-section",
        title: t.translate("TE_HELP_INTERFACE_LIST_TITLE"),
        content: t.translate("TE_HELP_INTERFACE_LIST_CONTENT"),
        position: "right",
        onEnter: () => {
          if (sectionsExpanded) {
            sectionsExpanded.interfaces = true;
          }
        },
      },
    ];
  }

  static getInterfaceHelpSteps(
    translationService: TranslationService,
    editors: TrackEditorHelpEditors,
    configs: TrackEditorHelpConfigs,
  ): GuideStep[] {
    const t = translationService;
    const steps: GuideStep[] = [];

    // 7) For each type of interface configured on RHS:
    // Arduino
    if (configs.arduinoConfigs && configs.arduinoConfigs.length > 0) {
      steps.push({
        targetId: "interface-arduino-0",
        selector: "#interface-arduino-0",
        title: t.translate("TE_HELP_ARDUINO_TITLE"),
        content: t.translate("TE_HELP_ARDUINO_CONTENT"),
        position: "left",
        onEnter: () => {
          const firstArduino = editors.arduinoEditors?.first;
          if (firstArduino) {
            firstArduino.sectionsExpanded = {
              arduino: true,
              main: false,
              digital: false,
              analog: false,
              voltage: false,
              leds: false,
            };
            firstArduino.ledStringExpanded = [];
            (firstArduino as any).cdr?.detectChanges?.();
          }
          scrollElementToTopOfPreview("interface-arduino-0");
        },
      });
    }

    // Trackmate
    if (configs.trackmateConfigs && configs.trackmateConfigs.length > 0) {
      steps.push({
        targetId: "interface-trackmate-0",
        selector: "#interface-trackmate-0",
        title: t.translate("TE_HELP_TRAKMATE_TITLE"),
        content: t.translate("TE_HELP_TRAKMATE_CONTENT"),
        position: "left",
        onEnter: () => {
          const firstTrackmate = editors.trakmateEditors?.first;
          if (firstTrackmate) {
            firstTrackmate.sectionsExpanded = {
              trakmate: true,
              main: false,
              rw: false,
            };
            (firstTrackmate as any).cdr?.detectChanges?.();
          }
          scrollElementToTopOfPreview("interface-trackmate-0");
        },
      });
    }

    // Phidget
    if (configs.phidgetConfigs && configs.phidgetConfigs.length > 0) {
      steps.push({
        targetId: "interface-phidget-0",
        selector: "#interface-phidget-0",
        title: t.translate("TE_HELP_PHIDGET_TITLE"),
        content: t.translate("TE_HELP_PHIDGET_CONTENT"),
        position: "left",
        onEnter: () => {
          const firstPhidget = editors.phidgetEditors?.first;
          if (firstPhidget) {
            firstPhidget.sectionsExpanded = {
              phidget: true,
              main: false,
              pins: false,
              digitalIn: false,
              digitalOut: false,
            };
            (firstPhidget as any).cdr?.detectChanges?.();
          }
          scrollElementToTopOfPreview("interface-phidget-0");
        },
      });
    }

    // BART
    if (configs.bartConfigs && configs.bartConfigs.length > 0) {
      steps.push({
        targetId: "interface-bart-0",
        selector: "#interface-bart-0",
        title: t.translate("TE_HELP_BART_TITLE"),
        content: t.translate("TE_HELP_BART_CONTENT"),
        position: "left",
        onEnter: () => {
          const firstBart = editors.bartEditors?.first;
          if (firstBart) {
            firstBart.sectionsExpanded = {
              bart: true,
              main: false,
              rw: false,
            };
            (firstBart as any).cdr?.detectChanges?.();
          }
          scrollElementToTopOfPreview("interface-bart-0");
        },
      });
    }

    return steps;
  }

  static getHelpSteps(
    translationService: TranslationService,
    editors: TrackEditorHelpEditors,
    configs: TrackEditorHelpConfigs,
    sectionsExpanded?: {
      general?: boolean;
      interfaces?: boolean;
      lanes?: boolean;
    },
  ): GuideStep[] {
    return [
      ...TrackEditorHelpHelper.getBaseHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...TrackEditorHelpHelper.getInterfaceHelpSteps(
        translationService,
        editors,
        configs,
      ),
    ];
  }

  static getToolbarHelpSteps(
    translationService: TranslationService,
  ): GuideStep[] {
    return [getEditorToolbarHelpStep(translationService, true)];
  }

  static ensureSectionsExpandedForHelp(
    sectionsExpanded: {
      general?: boolean;
      interfaces?: boolean;
      lanes?: boolean;
    },
    hasLanes: boolean,
    _editors?: TrackEditorHelpEditors,
    _configs?: TrackEditorHelpConfigs,
  ): boolean {
    let changed = false;

    if (sectionsExpanded && !sectionsExpanded.lanes && hasLanes) {
      sectionsExpanded.lanes = true;
      changed = true;
    }

    if (sectionsExpanded && !sectionsExpanded.interfaces) {
      sectionsExpanded.interfaces = true;
      changed = true;
    }

    return changed;
  }
}
