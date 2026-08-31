import { forkJoin, Observable, of } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { CustomUiService } from "@app/services/custom-ui.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";

import { UIEditorState } from "./ui-editor-constants";

export interface AutoSaveContext {
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  isAnyThemeNameInvalid: boolean;
  isAnyCustomUiNameInvalid: boolean;
  editingSettings: Settings;
  displayThemes: Theme[];
  displayCustomUIs: CustomUI[];
  initialState: UIEditorState | undefined;
  dataService: DataService;
  settingsService: SettingsService;
  themeService: ThemeService;
  customUiService: CustomUiService;
}

export function buildAutoSavePipeline(
  ctx: AutoSaveContext,
): Observable<any> | null {
  if (
    ctx.isLoading ||
    ctx.isSaving ||
    !ctx.hasChanges ||
    ctx.isAnyThemeNameInvalid ||
    ctx.isAnyCustomUiNameInvalid
  ) {
    return null;
  }

  // 1. Save Settings
  ctx.settingsService.saveSettings(ctx.editingSettings);

  const saveObservables: Observable<any>[] = [];
  const initialState = ctx.initialState;

  // 2. Save changed Themes
  for (const theme of ctx.displayThemes) {
    let hasChanged = true;
    if (initialState && initialState.themes) {
      const initialTheme = initialState.themes.find(
        (t) => t.entity_id === theme.entity_id,
      );
      if (
        initialTheme &&
        JSON.stringify(initialTheme) === JSON.stringify(theme)
      ) {
        hasChanged = false;
      }
    }
    if (hasChanged) {
      saveObservables.push(ctx.dataService.updateTheme(theme.entity_id, theme));
    }
  }

  // 3. Save changed Custom UIs
  for (const ui of ctx.displayCustomUIs) {
    let hasChanged = true;
    if (initialState && initialState.customUIs) {
      const initialUi = initialState.customUIs.find(
        (u) => u.entity_id === ui.entity_id,
      );
      if (initialUi && JSON.stringify(initialUi) === JSON.stringify(ui)) {
        hasChanged = false;
      }
    }
    if (hasChanged) {
      saveObservables.push(ctx.dataService.updateCustomUI(ui.entity_id, ui));
    }
  }

  return saveObservables.length > 0 ? forkJoin(saveObservables) : of([null]);
}

export function executeAutoSaveState(
  ctx: AutoSaveContext & {
    editingState: UIEditorState;
    undoManager: any;
    logger: any;
    translationService: any;
    onStart?: () => void;
    onSuccess: () => void;
    onError: (err: any) => void;
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const pipeline = buildAutoSavePipeline(ctx);
    if (!pipeline) {
      resolve();
      return;
    }
    if (ctx.onStart) ctx.onStart();
    pipeline.subscribe({
      next: () => {
        ctx.undoManager.resetTracking(ctx.editingState);
        if (
          ctx.themeService.getActiveTheme() &&
          ctx.displayThemes.some(
            (t) => t.entity_id === ctx.themeService.getActiveTheme()?.entity_id,
          )
        ) {
          ctx.themeService.refresh();
        }
        ctx.customUiService.initialize();
        ctx.onSuccess();
        resolve();
      },
      error: (err) => {
        ctx.logger.error("Auto-save failed", err);
        ctx.onError(err);
        if (err.status !== 409) {
          alert(ctx.translationService.translate("UE_ERROR_SAVE_FAILED"));
        }
        reject(err);
      },
    });
  });
}

export function buildAutoSaveContext(comp: any): any {
  return {
    isLoading: comp.isLoading,
    isSaving: comp.isSaving,
    hasChanges: comp.hasChanges(),
    isAnyThemeNameInvalid: comp.isAnyThemeNameInvalid(),
    isAnyCustomUiNameInvalid: comp.isAnyCustomUiNameInvalid(),
    editingSettings: comp.editingSettings,
    displayThemes: comp.displayThemes,
    displayCustomUIs: comp.displayCustomUIs,
    initialState: comp.undoManager.getInitialState(),
    editingState: comp.editingState,
    undoManager: comp.undoManager,
    dataService: comp.dataService,
    settingsService: comp.settingsService,
    themeService: comp.themeService,
    customUiService: comp.customUiService,
    logger: comp.logger,
    translationService: comp.translationService,
    onStart: () => {
      comp.isAutoSaving = true;
      comp.isSaving = true;
    },
    onSuccess: () => {
      comp.autoSaveTimeout = setTimeout(() => {
        comp.isAutoSaving = false;
        comp.isSaving = false;
        if (!comp.isDestroyed) comp.cdr.markForCheck();
      }, comp.getSaveDelay());
    },
    onError: () => {
      comp.isAutoSaving = false;
      comp.isSaving = false;
      if (!comp.isDestroyed) comp.cdr.markForCheck();
    },
  };
}
