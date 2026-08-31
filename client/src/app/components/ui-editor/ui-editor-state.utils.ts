import { Settings } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { UIEditorState } from "./ui-editor-constants";

export function cloneSettings(s: Settings): Settings {
  const clone = Object.assign(new Settings(), s);
  clone.recentRaceIds = [...(s.recentRaceIds || [])];
  clone.selectedDriverIds = [...(s.selectedDriverIds || [])];
  clone.racedayColumns = [...(s.racedayColumns || [])];
  clone.columnAnchors = { ...(s.columnAnchors || {}) };
  clone.practiceRacedayColumns = [...(s.practiceRacedayColumns || [])];
  clone.practiceColumnAnchors = { ...(s.practiceColumnAnchors || {}) };

  // Safely clone layouts and visibility
  const layouts = s.columnLayouts || {};
  clone.columnLayouts = deepCopy(layouts);

  const visibility = s.columnVisibility || {};
  clone.columnVisibility = deepCopy(visibility);

  const practiceLayouts = s.practiceColumnLayouts || {};
  clone.practiceColumnLayouts = deepCopy(practiceLayouts);

  const practiceVisibility = s.practiceColumnVisibility || {};
  clone.practiceColumnVisibility = deepCopy(practiceVisibility);

  clone.highlightRowOnLap = s.highlightRowOnLap ?? true;
  clone.highlightPracticeRowOnLap = s.highlightPracticeRowOnLap ?? true;
  clone.pageTransition = s.pageTransition || "slide";

  // Theme fields
  clone.activeThemeId = s.activeThemeId;
  clone.lampRedOn = s.lampRedOn;
  clone.lampRedDim = s.lampRedDim;
  clone.lampGreen = s.lampGreen;
  clone.fuelGaugeImageSet = s.fuelGaugeImageSet;
  clone.demoConfig = s.demoConfig ? { ...s.demoConfig } : undefined;
  clone.racedayLayout = s.racedayLayout ? deepCopy(s.racedayLayout) : undefined;
  clone.practiceRacedayLayout = s.practiceRacedayLayout
    ? deepCopy(s.practiceRacedayLayout)
    : undefined;

  return clone;
}

export function cloneUIEditorState(s: UIEditorState): UIEditorState {
  return {
    settings: cloneSettings(s.settings),
    themes: deepCopy(s.themes),
    customUIs: deepCopy(s.customUIs || []),
  };
}

export function areUIEditorStatesEqual(
  a: UIEditorState,
  b: UIEditorState,
): boolean {
  return (
    areSettingsEqual(a.settings, b.settings) &&
    JSON.stringify(a.themes) === JSON.stringify(b.themes) &&
    JSON.stringify(a.customUIs || []) === JSON.stringify(b.customUIs || [])
  );
}

export function syncEditorCoordinates(
  target?: Settings,
  source?: Settings,
): void {
  if (target && source) {
    target.layoutEditorMinimized = source.layoutEditorMinimized;
    target.layoutEditorPositionX = source.layoutEditorPositionX;
    target.layoutEditorPositionY = source.layoutEditorPositionY;
    target.columnEditorMinimized = source.columnEditorMinimized;
    target.columnEditorPositionX = source.columnEditorPositionX;
    target.columnEditorPositionY = source.columnEditorPositionY;
  }
}

export function areSettingsEqual(a: Settings, b: Settings): boolean {
  return (
    a.flagRacing === b.flagRacing &&
    a.flagHeatPaused === b.flagHeatPaused &&
    a.flagHeatOver === b.flagHeatOver &&
    a.flagRaceOver === b.flagRaceOver &&
    a.flagNotStarted === b.flagNotStarted &&
    a.flagStarting === b.flagStarting &&
    a.flagRestarting === b.flagRestarting &&
    a.flagOneLapToGo === b.flagOneLapToGo &&
    a.flagHeatFinishing === b.flagHeatFinishing &&
    a.flagWarmup === b.flagWarmup &&
    a.flagDriverFinished === b.flagDriverFinished &&
    a.flagPenalty === b.flagPenalty &&
    a.sortByStandings === b.sortByStandings &&
    a.highlightRowOnLap === b.highlightRowOnLap &&
    a.highlightPracticeRowOnLap === b.highlightPracticeRowOnLap &&
    a.pageTransition === b.pageTransition &&
    a.activeThemeId === b.activeThemeId &&
    a.lampRedOn === b.lampRedOn &&
    a.lampRedDim === b.lampRedDim &&
    a.lampGreen === b.lampGreen &&
    a.fuelGaugeImageSet === b.fuelGaugeImageSet &&
    JSON.stringify(a.demoConfig) === JSON.stringify(b.demoConfig) &&
    JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns) &&
    JSON.stringify(a.columnAnchors) === JSON.stringify(b.columnAnchors) &&
    JSON.stringify(a.columnLayouts) === JSON.stringify(b.columnLayouts) &&
    JSON.stringify(a.columnVisibility) === JSON.stringify(b.columnVisibility) &&
    JSON.stringify(a.racedayLayout) === JSON.stringify(b.racedayLayout) &&
    JSON.stringify(a.practiceRacedayColumns) ===
      JSON.stringify(b.practiceRacedayColumns) &&
    JSON.stringify(a.practiceColumnAnchors) ===
      JSON.stringify(b.practiceColumnAnchors) &&
    JSON.stringify(a.practiceColumnLayouts) ===
      JSON.stringify(b.practiceColumnLayouts) &&
    JSON.stringify(a.practiceColumnVisibility) ===
      JSON.stringify(b.practiceColumnVisibility) &&
    JSON.stringify(a.practiceRacedayLayout) ===
      JSON.stringify(b.practiceRacedayLayout)
  );
}
