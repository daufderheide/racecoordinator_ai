import { QueryList } from "@angular/core";
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

export class TrackEditorHelpHelper {
  static getBaseHelpSteps(translationService: TranslationService): GuideStep[] {
    return [
      {
        title: translationService.translate("TE_HELP_WELCOME_TITLE"),
        content: translationService.translate("TE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        title: translationService.translate("TE_HELP_GENERAL_TITLE"),
        content: translationService.translate("TE_HELP_GENERAL_CONTENT"),
        position: "center",
      },
      {
        selector: "#track-name-input",
        title: translationService.translate("TE_HELP_NAME_TITLE"),
        content: translationService.translate("TE_HELP_NAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#num-track-sections-section",
        title: translationService.translate("TE_HELP_NUM_TRACK_SECTIONS_TITLE"),
        content: translationService.translate(
          "TE_HELP_NUM_TRACK_SECTIONS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#track-scale-section",
        title: translationService.translate("TE_HELP_TRACK_SCALE_TITLE"),
        content: translationService.translate("TE_HELP_TRACK_SCALE_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#lane-editor-section",
        title: translationService.translate("TE_HELP_LANES_TITLE"),
        content: translationService.translate("TE_HELP_LANES_CONTENT"),
        position: "right",
      },
      {
        selector: "#lane-bg-0",
        title: translationService.translate("TE_HELP_LANE_BG_TITLE"),
        content: translationService.translate("TE_HELP_LANE_BG_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#lane-fg-0",
        title: translationService.translate("TE_HELP_LANE_FG_TITLE"),
        content: translationService.translate("TE_HELP_LANE_FG_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#lane-length-0",
        title: translationService.translate("TE_HELP_LANE_LENGTH_TITLE"),
        content: translationService.translate("TE_HELP_LANE_LENGTH_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#lane-drag-0",
        title: translationService.translate("TE_HELP_LANE_DRAG_TITLE"),
        content: translationService.translate("TE_HELP_LANE_DRAG_CONTENT"),
        position: "right",
      },
      {
        selector: "#lane-delete-0",
        title: translationService.translate("TE_HELP_DELETE_LANE_TITLE"),
        content: translationService.translate("TE_HELP_DELETE_LANE_CONTENT"),
        position: "right",
      },
      {
        selector: "#add-interface-btn",
        title: translationService.translate("TE_HELP_ADD_INTERFACE_TITLE"),
        content: translationService.translate("TE_HELP_ADD_INTERFACE_CONTENT"),
        position: "right",
      },
    ];
  }

  static getInterfaceHelpSteps(
    editors: TrackEditorHelpEditors,
    configs: TrackEditorHelpConfigs,
  ): GuideStep[] {
    const steps: GuideStep[] = [];

    if (configs.arduinoConfigs && configs.arduinoConfigs.length > 0) {
      const firstArduino = editors.arduinoEditors?.first;
      if (firstArduino) {
        steps.push(...firstArduino.getHelpSteps());
      }
    }

    if (configs.bartConfigs && configs.bartConfigs.length > 0) {
      const firstBart = editors.bartEditors?.first;
      if (firstBart) {
        steps.push(...firstBart.getHelpSteps());
      }
    }

    if (configs.phidgetConfigs && configs.phidgetConfigs.length > 0) {
      const firstPhidget = editors.phidgetEditors?.first;
      if (firstPhidget) {
        steps.push(...firstPhidget.getHelpSteps());
      }
    }

    if (configs.trackmateConfigs && configs.trackmateConfigs.length > 0) {
      const firstTrackmate = editors.trakmateEditors?.first;
      if (firstTrackmate) {
        steps.push(...firstTrackmate.getHelpSteps());
      }
    }

    return steps;
  }

  static getHelpSteps(
    translationService: TranslationService,
    editors: TrackEditorHelpEditors,
    configs: TrackEditorHelpConfigs,
  ): GuideStep[] {
    return [
      ...TrackEditorHelpHelper.getBaseHelpSteps(translationService),
      ...TrackEditorHelpHelper.getInterfaceHelpSteps(editors, configs),
    ];
  }

  static getToolbarHelpSteps(
    translationService: TranslationService,
  ): GuideStep[] {
    return [
      {
        targetId: "undo-btn",
        title: translationService.translate("TOOLBAR_HELP_UNDO_TITLE"),
        content: translationService.translate("TOOLBAR_HELP_UNDO_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "redo-btn",
        title: translationService.translate("TOOLBAR_HELP_REDO_TITLE"),
        content: translationService.translate("TOOLBAR_HELP_REDO_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "edit-track-btn",
        title: translationService.translate("TOOLBAR_HELP_EDIT_TITLE"),
        content: translationService.translate("TOOLBAR_HELP_EDIT_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "expand-collapse-all-btn",
        title: translationService.translate(
          "TOOLBAR_HELP_EXPAND_COLLAPSE_TITLE",
        ),
        content: translationService.translate(
          "TOOLBAR_HELP_EXPAND_COLLAPSE_CONTENT",
        ),
        position: "bottom",
      },
      {
        targetId: "copy-item-btn",
        title: translationService.translate("TOOLBAR_HELP_COPY_TITLE"),
        content: translationService.translate("TOOLBAR_HELP_COPY_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "help-track-btn",
        title: translationService.translate("TOOLBAR_HELP_HELP_TITLE"),
        content: translationService.translate("TOOLBAR_HELP_HELP_CONTENT"),
        position: "bottom",
      },
    ];
  }

  static ensureSectionsExpandedForHelp(
    sectionsExpanded: { general: boolean; interfaces: boolean; lanes: boolean },
    hasLanes: boolean,
    editors: TrackEditorHelpEditors,
    configs: TrackEditorHelpConfigs,
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

    if (
      configs.arduinoConfigs &&
      configs.arduinoConfigs.length > 0 &&
      editors.arduinoEditors?.first
    ) {
      editors.arduinoEditors.first.ensureSectionsExpanded();
    }
    if (
      configs.bartConfigs &&
      configs.bartConfigs.length > 0 &&
      editors.bartEditors?.first
    ) {
      editors.bartEditors.first.ensureSectionsExpanded();
    }
    if (
      configs.phidgetConfigs &&
      configs.phidgetConfigs.length > 0 &&
      editors.phidgetEditors?.first
    ) {
      editors.phidgetEditors.first.ensureSectionsExpanded();
    }
    if (
      configs.trackmateConfigs &&
      configs.trackmateConfigs.length > 0 &&
      editors.trakmateEditors?.first
    ) {
      editors.trakmateEditors.first.ensureSectionsExpanded();
    }

    return changed;
  }
}
