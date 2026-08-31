import { AssetType, normalizeAssetType } from "@app/models/asset";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { deepCopy } from "@app/utils/clone.utils";

import { BASE_AVAILABLE_COLUMNS, UIEditorState } from "./ui-editor-constants";
import { cloneSettings } from "./ui-editor-state.utils";

export interface LoadedEditorData {
  filteredAssets: any[];
  soundAssets: any[];
  availableColumns: { key: string; label: string }[];
  customDirectoryName: string | null;
  customWidgetDirectoryName: string | null;
  track: any;
  initialState: UIEditorState;
}

export function processLoadedEditorData(
  result: {
    assets: any[];
    dirHandle: any;
    widgetDirHandle?: any;
    themes: Theme[];
    tracks: any[];
    customUIs: CustomUI[];
  },
  currentSettings: Settings,
  setActiveThemeFn?: (themeId: string) => void,
): LoadedEditorData {
  const filteredAssets = (result.assets || []).filter(
    (a: any) =>
      a.type === "image" ||
      a.type === "image_set" ||
      normalizeAssetType(a.type) === AssetType.AUDIO ||
      a.type === "audio_set",
  );

  const soundAssets = filteredAssets.filter(
    (a) =>
      normalizeAssetType(a.type) === AssetType.AUDIO || a.type === "audio_set",
  );

  const imageSetColumns = (result.assets || [])
    .filter(
      (a: any) =>
        a.type === "image_set" &&
        a.name?.toLowerCase() !== "fuel gauge" &&
        a.name?.toLowerCase() !== "default fuel gauge" &&
        a.name?.toLowerCase() !== "default fuel guage" &&
        a.model?.entityId !== "fuel-gauge-builtin" &&
        a.model?.entityId !== "default_fuel-gauge-builtin" &&
        a.model?.entityId !== "default_fuel_gauge" &&
        a.id !== "default_fuel_gauge",
    )
    .map((a: any) => ({
      key: `imageset_${a.model?.entityId || a.id}`,
      label: a.name || "AM_UNKNOWN_ASSET",
    }));

  const availableColumns = [...BASE_AVAILABLE_COLUMNS, ...imageSetColumns];

  const customDirectoryName = result.dirHandle?.name || null;
  const customWidgetDirectoryName = result.widgetDirHandle?.name || null;
  const themes = result.themes || [];
  const tracks = result.tracks || [];
  const track = tracks.length > 0 ? tracks[0] : undefined;

  const editingSettings = cloneSettings(currentSettings);

  if (!editingSettings.racedayLayout) {
    editingSettings.racedayLayout = JSON.parse(
      JSON.stringify(Settings.DEFAULT_LAYOUT),
    );
  }

  if (!editingSettings.practiceRacedayLayout) {
    editingSettings.practiceRacedayLayout = JSON.parse(
      JSON.stringify(Settings.DEFAULT_PRACTICE_LAYOUT),
    );
  }

  if (!editingSettings.activeThemeId && themes.length > 0) {
    const defaultTheme = themes.find((t) => t.is_default);
    if (defaultTheme) {
      editingSettings.activeThemeId = defaultTheme.entity_id;
      if (setActiveThemeFn) {
        setActiveThemeFn(defaultTheme.entity_id);
      }
    }
  }

  const customUIs: CustomUI[] = (result.customUIs as CustomUI[]) || [];
  ensureDefaultCustomUis(customUIs, editingSettings);

  const initialState: UIEditorState = {
    settings: editingSettings,
    themes: deepCopy(themes),
    customUIs: deepCopy(customUIs),
  };

  return {
    filteredAssets,
    soundAssets,
    availableColumns,
    customDirectoryName,
    customWidgetDirectoryName,
    track,
    initialState,
  };
}

export function ensureDefaultCustomUis(
  customUIs: CustomUI[],
  s: Settings,
): void {
  if (!customUIs.some((u: any) => u.entity_id === "default_ui_layout_rc_ai")) {
    customUIs.push({
      name: "Default UI Layout",
      is_default: true,
      layoutJson: JSON.stringify(s.racedayLayout || Settings.DEFAULT_LAYOUT),
      columnsJson: JSON.stringify(s.racedayColumns || Settings.DEFAULT_COLUMNS),
      columnLayoutsJson: JSON.stringify(
        s.columnLayouts || new Settings().columnLayouts,
      ),
      columnVisibilityJson: JSON.stringify(
        s.columnVisibility || new Settings().columnVisibility,
      ),
      columnWidthsJson: JSON.stringify(s.columnWidths || {}),
      columnAnchorsJson: JSON.stringify(s.columnAnchors || {}),
      entity_id: "default_ui_layout_rc_ai",
      _id: "default_ui_layout_rc_ai",
    });
  }
  if (!customUIs.some((u: any) => u.entity_id === "practice_ui_layout_rc_ai")) {
    customUIs.push({
      name: "Practice UI Layout",
      is_default: true,
      layoutJson: JSON.stringify(
        s.practiceRacedayLayout || Settings.DEFAULT_PRACTICE_LAYOUT,
      ),
      columnsJson: JSON.stringify(
        s.practiceRacedayColumns || Settings.DEFAULT_PRACTICE_COLUMNS,
      ),
      columnLayoutsJson: JSON.stringify(
        s.practiceColumnLayouts || new Settings().practiceColumnLayouts,
      ),
      columnVisibilityJson: JSON.stringify(
        s.practiceColumnVisibility || new Settings().practiceColumnVisibility,
      ),
      columnWidthsJson: JSON.stringify(s.practiceColumnWidths || {}),
      columnAnchorsJson: JSON.stringify(s.practiceColumnAnchors || {}),
      entity_id: "practice_ui_layout_rc_ai",
      _id: "practice_ui_layout_rc_ai",
    });
  }
}

export function fetchUiEditorData(dataService: any, fileSystem: any): any {
  const { forkJoin, of } = require("rxjs");
  const { catchError } = require("rxjs/operators");
  return forkJoin({
    assets: dataService.listAssets(),
    dirHandle: fileSystem.getCustomDirectoryHandle(),
    widgetDirHandle: fileSystem.getCustomWidgetDirectoryHandle
      ? fileSystem.getCustomWidgetDirectoryHandle()
      : of(null),
    themes: dataService.getThemes(),
    tracks: dataService.getTracks(),
    customUIs: dataService.getCustomUIs().pipe(catchError(() => of([]))),
  });
}

export function buildDisplayColumnSlots(
  racedayColumns: string[] | undefined,
  availableColumns: { key: string; label: string }[],
): { key: string; label: string }[] {
  if (!racedayColumns) return [];
  return racedayColumns.map((key) => {
    const col = availableColumns.find((c) => c.key === key);
    return { key, label: col ? col.label : key };
  });
}

export function applyLoadedUiEditorData(comp: any, res: any): void {
  const loaded = processLoadedEditorData(
    res,
    comp.settingsService.getSettings(),
    (id) => comp.themeService.setActiveTheme(id),
  );
  comp.assets = loaded.filteredAssets;
  comp.soundAssets = loaded.soundAssets;
  comp.availableColumns = loaded.availableColumns;
  comp.sortAvailableColumns();
  comp.customDirectoryName = loaded.customDirectoryName;
  comp.customWidgetDirectoryName = loaded.customWidgetDirectoryName;
  if (loaded.track) comp.track = loaded.track;

  comp.editingState = loaded.initialState;
  comp.refreshDisplayProperties();
  comp.undoManager.initialize(comp.editingState);
  comp.isLoading = false;
  if (!comp.isDestroyed) comp.cdr.markForCheck();
}

export function handleUiEditorDataLoadError(comp: any, err: any): void {
  comp.logger.error("Failed to load UI editor data", err);
  comp.isLoading = false;
  if (!comp.editingState) {
    comp.editingState = {
      settings: cloneSettings(comp.settingsService.getSettings()),
      themes: [],
      customUIs: [],
    };
    comp.undoManager.initialize(comp.editingState);
  }
  comp.refreshDisplayProperties();
  if (!comp.isDestroyed) comp.cdr.markForCheck();
}

export function handleUiEditorDestroy(comp: any): void {
  comp.isDestroyed = true;
  if (comp.saveTimeout) clearTimeout(comp.saveTimeout);
  if (comp.autoSaveTimeout) clearTimeout(comp.autoSaveTimeout);
  comp.raceConnectionService.disconnect();
  comp.dataSubscription?.unsubscribe();
  comp.helpSubscription?.unsubscribe();
  comp.undoManager.destroy();

  const destUrl =
    comp.router.getCurrentNavigation()?.extractedUrl?.toString() ||
    comp.pendingNavigationUrl ||
    comp.router.url ||
    "";
  if (!comp.childWindowManagerService.isRacePreservingRoute(destUrl)) {
    comp.childWindowManagerService.closeAllWindows();
  }
}

export function handleUiEditorKeyboardShortcut(
  event: KeyboardEvent,
  onUndo: () => void,
  onRedo: () => void,
): void {
  if ((event.metaKey || event.ctrlKey) && event.key === "z") {
    event.preventDefault();
    if (event.shiftKey) onRedo();
    else onUndo();
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "y") {
    event.preventDefault();
    onRedo();
  }
}
