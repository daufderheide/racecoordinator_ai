import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { AudioConfig } from "@app/models/driver";
import { Theme } from "@app/models/theme";
import { deepCopy } from "@app/utils/clone.utils";

import { UIEditorState } from "./ui-editor-constants";
import { isThemeDefault } from "./ui-editor-crud.helper";
import {
  extractAssetId,
  getThemeAudioConfigForSlot,
} from "./ui-editor-theme-assets.helper";

export function sortThemesForDisplay(themes: Theme[]): Theme[] {
  const defaults = (themes || []).filter((t) => isThemeDefault(t));
  const others = (themes || []).filter((t) => !isThemeDefault(t));
  defaults.sort((a, b) => {
    if (a.entity_id === "default_classic_rc_ai") return -1;
    if (b.entity_id === "default_classic_rc_ai") return 1;
    return 0;
  });
  return [...defaults, ...others];
}

export function applyThemeSlotUpdate(
  theme: Theme,
  slot: string,
  asset: any,
  assets: any[],
): { assets: any[]; changed: boolean } {
  const assetId = extractAssetId(asset);
  if (!theme.slots) theme.slots = {};
  if (assetId === theme.slots[slot]) {
    return { assets, changed: false };
  }

  let updatedAssets = assets;
  if (assetId) {
    theme.slots[slot] = assetId;
    if (
      !assets.find(
        (a) => (a.model?.entityId || a.entity_id || a.id) === assetId,
      )
    ) {
      updatedAssets = [...assets, asset];
    }
  } else {
    delete theme.slots[slot];
  }
  return { assets: updatedAssets, changed: true };
}

export function applyAudioConfigUpdate(
  theme: Theme,
  slot: string,
  field: "type" | "url" | "text",
  value: any,
): void {
  if (!theme.audio_slots) theme.audio_slots = {};
  const current: AudioConfig = getThemeAudioConfigForSlot(slot, theme);
  theme.audio_slots[slot] = { ...current, [field]: value };
}

export function removeThemeFromUndoHistory(
  undoManager: UndoManager<UIEditorState>,
  themeIdToDelete: string,
): void {
  undoManager.updateHistory((state) => {
    const s = deepCopy(state);
    s.themes = (s.themes || []).filter(
      (t: any) => t.entity_id !== themeIdToDelete,
    );
    if (s.settings.activeThemeId === themeIdToDelete) {
      const def = (s.themes || []).find((t: any) => isThemeDefault(t));
      s.settings.activeThemeId = def ? def.entity_id : undefined;
    }
    return s;
  });
}

export async function executeCreateTheme(params: {
  displayThemes: Theme[];
  editingState: UIEditorState;
  translationService: any;
  themeService: any;
  logger: any;
}): Promise<{
  created?: Theme;
  defaultTheme?: Theme;
  successModalParams?: { title: string; message: string; params: any };
}> {
  const defaultTheme = params.displayThemes.find(
    (t) => t.entity_id === "default_classic_rc_ai" || isThemeDefault(t),
  );
  if (!defaultTheme) return {};
  try {
    const { createThemeEntity } = await import("./ui-editor-operations.helper");
    const created = await createThemeEntity(
      defaultTheme,
      params.translationService,
      params.themeService,
    );
    params.editingState.themes = [...params.editingState.themes, created];
    return {
      created,
      defaultTheme,
      successModalParams: {
        title: "GEN_SUCCESS",
        message: "UE_SUCCESS_CREATE",
        params: { name: created.name },
      },
    };
  } catch (e) {
    params.logger.error("Failed to create theme from default", e);
    alert(params.translationService.translate("UE_ERROR_CREATE_FAILED"));
    return {};
  }
}

export async function executeDuplicateTheme(params: {
  theme: Theme;
  editingState: UIEditorState;
  editingSettings: any;
  sectionsExpanded: { [key: string]: boolean };
  translationService: any;
  themeService: any;
  logger: any;
  saveExpanderState: () => void;
}): Promise<{
  created?: Theme;
  successModalParams?: { title: string; message: string; params: any };
}> {
  try {
    const { duplicateThemeEntity } =
      await import("./ui-editor-operations.helper");
    const created = await duplicateThemeEntity(
      params.theme,
      params.translationService,
      params.themeService,
    );
    params.editingState.themes = [...params.editingState.themes, created];
    const currentActiveThemeId = params.editingSettings.activeThemeId;
    params.sectionsExpanded[`theme_${created.entity_id}`] = false;
    params.saveExpanderState();
    params.editingSettings.activeThemeId = currentActiveThemeId;
    return {
      created,
      successModalParams: {
        title: "GEN_SUCCESS",
        message: "UE_SUCCESS_DUPLICATE",
        params: { name: created.name },
      },
    };
  } catch (e) {
    params.logger.error("Failed to duplicate theme", e);
    alert(params.translationService.translate("UE_ERROR_DUPLICATE_FAILED"));
    return {};
  }
}

export async function executeDeleteTheme(params: {
  themeToDelete: Theme;
  editingState: UIEditorState;
  editingSettings: any;
  displayThemes: Theme[];
  sectionsExpanded: { [key: string]: boolean };
  themeService: any;
  undoManager: UndoManager<UIEditorState>;
  onThemeSelected: (id: string) => void;
}): Promise<void> {
  const themeIdToDelete = params.themeToDelete.entity_id;
  const wasActive = params.editingSettings.activeThemeId === themeIdToDelete;

  const { deleteThemeEntity } = await import("./ui-editor-operations.helper");
  await deleteThemeEntity(themeIdToDelete, params.themeService);
  delete params.sectionsExpanded[`theme_${themeIdToDelete}`];
  params.editingState.themes = params.editingState.themes.filter(
    (t) => t.entity_id !== themeIdToDelete,
  );

  if (wasActive) {
    const remaining = params.displayThemes.find(
      (t) => t.entity_id !== themeIdToDelete,
    );
    if (remaining) params.onThemeSelected(remaining.entity_id);
  }
  removeThemeFromUndoHistory(params.undoManager, themeIdToDelete);
  params.undoManager.resetTracking(params.editingState);
}

export async function handleCreateTheme(comp: any): Promise<void> {
  const res = await executeCreateTheme({
    displayThemes: comp.displayThemes,
    editingState: comp.editingState,
    translationService: comp.translationService,
    themeService: comp.themeService,
    logger: comp.logger,
  });
  if (res.created) {
    comp.refreshDisplayProperties();
    comp.toggleThemeSection(res.created.entity_id, false);
    comp.captureState();
    comp.openSuccessModal(
      res.successModalParams,
      res.defaultTheme?.entity_id || null,
    );
  }
}

export async function handleDuplicateTheme(
  comp: any,
  theme: Theme,
): Promise<void> {
  const res = await executeDuplicateTheme({
    theme,
    editingState: comp.editingState,
    editingSettings: comp.editingSettings,
    sectionsExpanded: comp.sectionsExpanded,
    translationService: comp.translationService,
    themeService: comp.themeService,
    logger: comp.logger,
    saveExpanderState: () => comp.saveExpanderState(),
  });
  if (res.created) {
    comp.refreshDisplayProperties();
    comp.captureState();
    comp.openSuccessModal(res.successModalParams, theme.entity_id);
  }
}

export async function handleConfirmDeleteTheme(comp: any): Promise<void> {
  if (!comp.themeToDelete) return;
  const themeToDelete = comp.themeToDelete;
  comp.showDeleteConfirm = false;
  comp.themeToDelete = null;

  await executeDeleteTheme({
    themeToDelete,
    editingState: comp.editingState,
    editingSettings: comp.editingSettings,
    displayThemes: comp.displayThemes,
    sectionsExpanded: comp.sectionsExpanded,
    themeService: comp.themeService,
    undoManager: comp.undoManager,
    onThemeSelected: (id) => comp.onThemeSelected(id),
  });
  comp.refreshDisplayProperties();
  comp.cdr.markForCheck();
}

export function handleThemeSlotChange(
  comp: any,
  theme: Theme,
  slot: string,
  asset: any,
): void {
  const res = applyThemeSlotUpdate(theme, slot, asset, comp.assets);
  comp.assets = res.assets;
  if (res.changed) {
    comp.captureState();
    comp.cdr.markForCheck();
  }
}

export function handleThemeAudioChange(
  comp: any,
  theme: Theme,
  slot: string,
  field: "type" | "url" | "text",
  value: any,
): void {
  applyAudioConfigUpdate(theme, slot, field, value);
  comp.captureState();
  comp.cdr.markForCheck();
}
