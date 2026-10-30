import { firstValueFrom } from "rxjs";
import { isThemeDefault } from "@app/components/ui-editor/ui-editor-crud.helper";
import {
  applyAudioConfigUpdate,
  applyThemeSlotUpdate,
} from "@app/components/ui-editor/ui-editor-theme.helper";
import { AudioConfig } from "@app/models/driver";
import { Theme } from "@app/models/theme";
import { getNextSelectionAfterDelete } from "@app/utils/editor-utils";

import {
  buildDuplicateThemeTemplate,
  buildNewThemeTemplate,
  cloneTheme,
  setLastEditedThemeId,
} from "./theme-editor.helper";

export async function handleStartNewTheme(comp: any): Promise<void> {
  comp.isSaving = true;
  try {
    const template = buildNewThemeTemplate(
      comp.translationService?.translate("UE_DEFAULT_THEME_NAME") ||
        "New Theme",
      comp.allThemes,
    );
    const created: Theme = await firstValueFrom(
      comp.dataService.createTheme(template),
    );
    if (created) {
      comp.themeService?.initialize();
      comp.allThemes.push(created);
      comp.selectThemeById(created.entity_id);
      comp.isEditMode = true;
    }
  } catch (err) {
    comp.logger.error("Failed to create theme", err);
  } finally {
    comp.isSaving = false;
    comp.cdr.markForCheck();
  }
}

export async function handleDuplicateCurrentTheme(comp: any): Promise<void> {
  if (!comp.editingTheme) return;
  comp.isSaving = true;
  try {
    const template = buildDuplicateThemeTemplate(
      comp.editingTheme,
      comp.allThemes,
    );
    const created: Theme = await firstValueFrom(
      comp.dataService.createTheme(template),
    );
    if (created) {
      comp.themeService?.initialize();
      comp.allThemes.push(created);
      comp.selectThemeById(created.entity_id);
      comp.isEditMode = true;
    }
  } catch (err) {
    comp.logger.error("Failed to duplicate theme", err);
  } finally {
    comp.isSaving = false;
    comp.cdr.markForCheck();
  }
}

export async function handleDeleteCurrentTheme(comp: any): Promise<void> {
  if (!comp.editingTheme) return;
  const themeToDelete = comp.editingTheme;
  if (isThemeDefault(themeToDelete)) return;

  comp.isSaving = true;
  comp.showDeleteConfirm = false;
  try {
    const nextSelection = getNextSelectionAfterDelete(
      comp.allThemes,
      themeToDelete.entity_id,
    );
    await firstValueFrom(comp.dataService.deleteTheme(themeToDelete.entity_id));
    comp.allThemes = comp.allThemes.filter(
      (t: Theme) => t.entity_id !== themeToDelete.entity_id,
    );
    comp.themeService?.initialize();

    if (nextSelection) {
      comp.selectThemeById(nextSelection.entity_id);
    } else if (comp.allThemes.length > 0) {
      comp.selectThemeById(comp.allThemes[0].entity_id);
    } else {
      comp.selectedThemeId = null;
      comp.editingTheme = null;
      comp.originalTheme = null;
    }
  } catch (err) {
    comp.logger.error("Failed to delete theme", err);
  } finally {
    comp.isSaving = false;
    comp.cdr.markForCheck();
  }
}

export async function handleSaveCurrentTheme(
  comp: any,
  isAutoSave = false,
): Promise<any> {
  if (!comp.editingTheme) return;
  if (comp.isSaving) return;

  if (isAutoSave) {
    comp.isAutoSaving = true;
  } else {
    comp.isSaving = true;
  }

  try {
    const saved = await firstValueFrom(
      comp.dataService.updateTheme(
        comp.editingTheme.entity_id,
        comp.editingTheme,
      ),
    );
    if (saved) {
      comp.themeService?.initialize();
      setLastEditedThemeId(comp.editingTheme.entity_id, comp.navigationService);
      const index = comp.allThemes.findIndex(
        (t: Theme) => t.entity_id === comp.editingTheme.entity_id,
      );
      if (index >= 0) {
        comp.allThemes[index] = cloneTheme(comp.editingTheme);
      }
      comp.originalTheme = cloneTheme(comp.editingTheme);
      comp.undoManager?.resetTracking(comp.editingTheme);

      if (!isAutoSave) {
        comp.isEditMode = false;
      }
    }
  } catch (err) {
    comp.logger.error("Failed to save theme", err);
  } finally {
    comp.isSaving = false;
    comp.isAutoSaving = false;
    comp.cdr.markForCheck();
  }
}

export function handleThemeSlotChange(
  comp: any,
  slot: string,
  asset: any,
): void {
  if (!comp.editingTheme) return;
  const res = applyThemeSlotUpdate(comp.editingTheme, slot, asset, comp.assets);
  comp.assets = res.assets;
  if (res.changed) {
    comp.captureState();
    comp.cdr.markForCheck();
  }
}

export function handleThemeAudioChange(
  comp: any,
  slot: string,
  field: "type" | "url" | "text",
  value: any,
): void {
  if (!comp.editingTheme) return;
  applyAudioConfigUpdate(comp.editingTheme, slot, field, value);
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleDriverAudioOverrideChange(
  comp: any,
  event: { key: string; config: AudioConfig | null },
): void {
  if (!comp.editingTheme) return;
  if (!comp.editingTheme.driver_audio_overrides) {
    comp.editingTheme.driver_audio_overrides = {};
  }
  if (event.config === null) {
    delete comp.editingTheme.driver_audio_overrides[event.key];
  } else {
    comp.editingTheme.driver_audio_overrides[event.key] = event.config;
  }
  comp.captureState();
  comp.cdr.markForCheck();
}

export function handleResetDriverAudioOverrides(comp: any): void {
  if (!comp.editingTheme) return;
  comp.editingTheme.driver_audio_overrides = {};
  comp.captureState();
  comp.cdr.markForCheck();
}
