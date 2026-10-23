import { forkJoin, Observable, of, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { CustomUiService } from "@app/services/custom-ui.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";

import { UIEditorState } from "./ui-editor-constants";
import { handleSyncActiveGridSessionFromLayout } from "./ui-editor-grid.helper";
import {
  areUIEditorStatesEqual,
  cloneUIEditorState,
  syncEditorCoordinates,
} from "./ui-editor-state.utils";

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

function buildThemeSaveObservables(ctx: AutoSaveContext): Observable<any>[] {
  const saveObservables: Observable<any>[] = [];
  const initialState = ctx.initialState;

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
      saveObservables.push(
        ctx.dataService.updateTheme(theme.entity_id, theme).pipe(
          catchError((err: any) => {
            if (err?.status === 404) {
              return ctx.dataService.createTheme(theme);
            }
            return throwError(() => err);
          }),
        ),
      );
    }
  }

  if (initialState && initialState.themes) {
    for (const initialTheme of initialState.themes) {
      if (
        !ctx.displayThemes.some((t) => t.entity_id === initialTheme.entity_id)
      ) {
        saveObservables.push(
          ctx.dataService.deleteTheme(initialTheme.entity_id).pipe(
            catchError((err: any) => {
              if (err?.status === 404) {
                return of(null);
              }
              return throwError(() => err);
            }),
          ),
        );
      }
    }
  }
  return saveObservables;
}

function buildCustomUiSaveObservables(ctx: AutoSaveContext): Observable<any>[] {
  const saveObservables: Observable<any>[] = [];
  const initialState = ctx.initialState;

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
      saveObservables.push(
        ctx.dataService.updateCustomUI(ui.entity_id, ui).pipe(
          catchError((err: any) => {
            if (err?.status === 404) {
              return ctx.dataService.createCustomUI(ui);
            }
            return throwError(() => err);
          }),
        ),
      );
    }
  }

  if (initialState && initialState.customUIs) {
    for (const initialUi of initialState.customUIs) {
      if (
        !ctx.displayCustomUIs.some((u) => u.entity_id === initialUi.entity_id)
      ) {
        saveObservables.push(
          ctx.dataService.deleteCustomUI(initialUi.entity_id).pipe(
            catchError((err: any) => {
              if (err?.status === 404) {
                return of(null);
              }
              return throwError(() => err);
            }),
          ),
        );
      }
    }
  }
  return saveObservables;
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

  ctx.settingsService.saveSettings(ctx.editingSettings);

  const saveObservables: Observable<any>[] = [
    ...buildThemeSaveObservables(ctx),
    ...buildCustomUiSaveObservables(ctx),
  ];

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
      comp.isSaving = false;
      comp.activeAutoSavePromise = null;
      comp.autoSaveTimeout = setTimeout(() => {
        comp.isAutoSaving = false;
        if (!comp.isDestroyed) comp.cdr.markForCheck();
      }, comp.getSaveDelay());
    },
    onError: () => {
      comp.isAutoSaving = false;
      comp.isSaving = false;
      comp.activeAutoSavePromise = null;
      if (!comp.isDestroyed) comp.cdr.markForCheck();
    },
  };
}

export function handleAutoSaveState(comp: any): Promise<void> {
  if (comp.activeAutoSavePromise) {
    const currentPromise = comp.activeAutoSavePromise;
    return currentPromise.then(
      (): Promise<void> => {
        if (comp.activeAutoSavePromise === currentPromise) {
          comp.activeAutoSavePromise = null;
        }
        if (
          comp.hasChanges() &&
          !comp.isAnyThemeNameInvalid() &&
          !comp.isAnyCustomUiNameInvalid()
        ) {
          return handleAutoSaveState(comp);
        }
        return Promise.resolve();
      },
      (err: any): Promise<void> => {
        if (comp.activeAutoSavePromise === currentPromise) {
          comp.activeAutoSavePromise = null;
        }
        return Promise.reject(err);
      },
    );
  }

  const ctx = buildAutoSaveContext(comp);
  const savePromise = executeAutoSaveState(ctx).finally(() => {
    if (comp.activeAutoSavePromise === savePromise) {
      comp.activeAutoSavePromise = null;
    }
  });

  if (comp.isSaving) {
    comp.activeAutoSavePromise = savePromise;
  }

  return savePromise;
}

export function createUiEditorUndoManager(
  comp: any,
): UndoManager<UIEditorState> {
  return new UndoManager<UIEditorState>(
    {
      clonner: (s) => cloneUIEditorState(s),
      equalizer: (a, b) => areUIEditorStatesEqual(a, b),
      applier: (s) => {
        syncEditorCoordinates(s.settings, comp.editingState?.settings);
        comp.editingState = s;
        comp.refreshDisplayProperties();
        handleSyncActiveGridSessionFromLayout(comp);
        const currentLayout = comp.getLayout(comp.activeCustomUi);
        if (currentLayout) {
          comp.syncRacedayPreview(currentLayout, comp.activeCustomUi);
        }
      },
    },
    () => comp.editingState,
  );
}

export function createUiEditorLifecycle(comp: any): EditorLifecycleHelper {
  return new EditorLifecycleHelper({
    cdr: comp.cdr,
    translationService: comp.translationService,
    getUnsavedReasons: () => comp.getUnsavedReasons(),
    undoManager: comp.undoManager,
    hasChanges: () => comp.hasChanges(),
    isSaveValid: () =>
      !comp.isAnyThemeNameInvalid() && !comp.isAnyCustomUiNameInvalid(),
    isSaving: () => comp.isSaving,
    onAutoSave: () => comp.autoSaveState(),
    autoSaveOnDiscard: true,
    logger: comp.logger,
  });
}
