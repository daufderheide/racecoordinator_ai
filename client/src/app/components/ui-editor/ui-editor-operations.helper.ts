import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { LoggerService } from "@app/services/logger.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import {
  buildDuplicateEntityName,
  getCustomUiDisplayNameKey,
  getThemeDisplayNameKey,
  isCustomUiDefault,
  isThemeDefault,
} from "./ui-editor-crud.helper";

export async function createCustomUiEntity(
  defaultUi: CustomUI,
  translationService: TranslationService,
  dataService: DataService,
): Promise<CustomUI | null> {
  const newName = buildDuplicateEntityName(
    defaultUi.name,
    isCustomUiDefault(defaultUi),
    getCustomUiDisplayNameKey(defaultUi),
    translationService,
  );
  return firstValueFrom(
    dataService.duplicateCustomUI(defaultUi.entity_id, newName),
  );
}

export async function duplicateCustomUiEntity(
  ui: CustomUI,
  translationService: TranslationService,
  dataService: DataService,
): Promise<CustomUI | null> {
  const newName = buildDuplicateEntityName(
    ui.name,
    isCustomUiDefault(ui),
    getCustomUiDisplayNameKey(ui),
    translationService,
  );
  return firstValueFrom(dataService.duplicateCustomUI(ui.entity_id, newName));
}

export async function deleteCustomUiEntity(
  uiId: string,
  dataService: DataService,
): Promise<void> {
  await firstValueFrom(dataService.deleteCustomUI(uiId));
}

export async function createThemeEntity(
  defaultTheme: Theme,
  translationService: TranslationService,
  themeService: ThemeService,
): Promise<Theme> {
  const newName = buildDuplicateEntityName(
    defaultTheme.name,
    isThemeDefault(defaultTheme),
    getThemeDisplayNameKey(defaultTheme),
    translationService,
  );
  return themeService.duplicateTheme(defaultTheme.entity_id, newName);
}

export async function duplicateThemeEntity(
  theme: Theme,
  translationService: TranslationService,
  themeService: ThemeService,
): Promise<Theme> {
  const newName = buildDuplicateEntityName(
    theme.name,
    isThemeDefault(theme),
    getThemeDisplayNameKey(theme),
    translationService,
  );
  return themeService.duplicateTheme(theme.entity_id, newName);
}

export async function deleteThemeEntity(
  themeId: string,
  themeService: ThemeService,
): Promise<void> {
  await themeService.deleteTheme(themeId);
}

export function handleOperationError(
  err: any,
  defaultKey: string,
  logger: LoggerService,
  translationService: TranslationService,
): void {
  logger.error("Operation failed", err);
  const msgKey = err?.status === 409 ? "UE_ERROR_UI_NAME_EXISTS" : defaultKey;
  alert(translationService.translate(msgKey));
}

export async function executeConfirmDiscard(params: {
  undoManager: any;
  hasChanges: () => boolean;
  isAnyThemeNameInvalid: () => boolean;
  isAnyCustomUiNameInvalid: () => boolean;
  autoSaveState: () => Promise<void>;
  logger: any;
  showConfirm: () => void;
}): Promise<boolean> {
  params.undoManager.commitState();
  if (!params.hasChanges()) return true;
  if (!params.isAnyThemeNameInvalid() && !params.isAnyCustomUiNameInvalid()) {
    try {
      await params.autoSaveState();
      if (!params.hasChanges()) return true;
    } catch (e) {
      params.logger.error("Final auto-save failed before navigation", e);
    }
  }
  params.showConfirm();
  return false;
}
