import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { LoggerService } from "@app/services/logger.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import {
  buildDuplicateEntityName,
  generateUniqueCustomUiName,
  generateUniqueThemeName,
  getCustomUiDisplayNameKey,
  getThemeDisplayNameKey,
  isCustomUiDefault,
  isThemeDefault,
} from "./ui-editor-crud.helper";
import { getDefaultLayoutResetData } from "./ui-editor-io.helper";

export function getDefaultThemeFactoryData(): {
  slots: { [key: string]: string };
  audio_slots: { [key: string]: any };
  uiId: string;
} {
  return {
    slots: {
      "flag.racing": "default_flag_green",
      "flag.heat_paused": "default_flag_yellow",
      "flag.heat_over": "default_flag_red",
      "flag.race_over": "default_flag_checkered",
      "flag.not_started": "default_flag_red",
      "flag.starting": "default_flag_red",
      "flag.restarting": "default_flag_yellow",
      "flag.one_lap_to_go": "default_flag_white",
      "flag.heat_finishing": "default_flag_checkered",
      "flag.warmup": "default_flag_green_yellow",
      "flag.driver_finished": "default_flag_red",
      "flag.penalty": "default_flag_black",
      "lamp.red.on": "default_start_red_on",
      "lamp.red.dim": "default_start_red_dim",
      "lamp.green": "default_start_green",
      "gauge.fuel": "default_fuel_gauge",
    },
    audio_slots: {
      "audio.countdown": { type: "audio_set", url: "default_countdown" },
      "audio.seconds_left": { type: "audio_set", url: "default_seconds_left" },
      "audio.laps_left": { type: "audio_set", url: "default_laps_left" },
      "audio.auto_start": { type: "audio_set", url: "default_auto_start" },
      "audio.auto_advance": { type: "audio_set", url: "default_auto_advance" },
      "audio.yellowflag": { type: "preset", url: "default_yellow_flag" },
      "audio.seconds_left.halfway": {
        type: "preset",
        url: "default_heat_half",
      },
      "audio.heat_over": { type: "preset", url: "default_heat_over" },
      "audio.race_over": { type: "preset", url: "default_race_over" },
      "audio.min_lap_time": {
        type: "tts",
        text: "Min lap time for {driver.nickname}",
      },
    },
    uiId: "default_ui_layout_rc_ai",
  };
}

export async function createCustomUiEntity(
  existingUisOrUi: CustomUI[] | CustomUI,
  translationService: TranslationService,
  dataService: DataService,
): Promise<CustomUI | null> {
  const existingUis: CustomUI[] = Array.isArray(existingUisOrUi)
    ? existingUisOrUi
    : existingUisOrUi
      ? [existingUisOrUi]
      : [];
  const defaultKey = "UE_DEFAULT_CUSTOM_UI_NAME";
  const translated = translationService.translate(defaultKey);
  const baseName =
    translated && translated !== defaultKey ? translated : "New UI Layout";
  const newName = generateUniqueCustomUiName(baseName, existingUis);

  const resetData = getDefaultLayoutResetData(false);
  const newUi: CustomUI = {
    "@id": 1,
    entity_id: "new",
    name: newName,
    is_default: false,
    layoutJson: JSON.stringify(resetData.defaultLayout),
    columnsJson: JSON.stringify(resetData.columns),
    columnLayoutsJson: JSON.stringify(resetData.columnLayouts),
    columnVisibilityJson: JSON.stringify(resetData.columnVisibility),
    columnWidthsJson: JSON.stringify(resetData.columnWidths),
    columnAnchorsJson: JSON.stringify(resetData.columnAnchors),
  };

  return firstValueFrom(dataService.createCustomUI(newUi));
}

export async function duplicateCustomUiEntity(
  ui: CustomUI,
  translationService: TranslationService,
  dataService: DataService,
): Promise<CustomUI | null> {
  const newName = buildDuplicateEntityName(
    ui.name,
    isCustomUiDefault(ui),
    getCustomUiDisplayNameKey(ui, translationService),
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
  existingThemesOrTheme: Theme[] | Theme,
  translationService: TranslationService,
  themeService: ThemeService,
  dataService?: DataService,
): Promise<Theme> {
  const existingThemes: Theme[] = Array.isArray(existingThemesOrTheme)
    ? existingThemesOrTheme
    : existingThemesOrTheme
      ? [existingThemesOrTheme]
      : [];
  const defaultKey = "UE_LABEL_NEW_THEME";
  const translated = translationService.translate(defaultKey);
  const baseName =
    translated && translated !== defaultKey ? translated : "New Theme";
  const newName = generateUniqueThemeName(baseName, existingThemes);

  let factoryData: any = null;
  if (dataService?.getThemeFactorySettings) {
    try {
      factoryData = await firstValueFrom(dataService.getThemeFactorySettings());
    } catch {
      // fallback to client-side factory defaults
    }
  }
  if (!factoryData) {
    factoryData = getDefaultThemeFactoryData();
  }

  const newTheme: Partial<Theme> = {
    entity_id: "new",
    name: newName,
    is_default: false,
    slots: factoryData.slots || {},
    audio_slots: factoryData.audio_slots || {},
    uiId: factoryData.uiId || "default_ui_layout_rc_ai",
  };

  return themeService.createTheme(newTheme);
}

export async function duplicateThemeEntity(
  theme: Theme,
  translationService: TranslationService,
  themeService: ThemeService,
): Promise<Theme> {
  const newName = buildDuplicateEntityName(
    theme.name,
    isThemeDefault(theme),
    getThemeDisplayNameKey(theme, translationService),
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

export function handleConfirmDiscard(comp: any): Promise<boolean> {
  if (comp.lifecycle) {
    return comp.lifecycle.confirmDiscard();
  }
  return new Promise((resolve) => {
    executeConfirmDiscard({
      undoManager: comp.undoManager,
      hasChanges: () => comp.hasChanges(),
      isAnyThemeNameInvalid: () => comp.isAnyThemeNameInvalid(),
      isAnyCustomUiNameInvalid: () => comp.isAnyCustomUiNameInvalid(),
      autoSaveState: () => comp.autoSaveState(),
      logger: comp.logger,
      showConfirm: () => {
        comp.showDiscardConfirm = true;
        comp.pendingDeactivate = resolve;
        comp.cdr.markForCheck();
      },
    }).then((canDeactivate) => {
      if (canDeactivate) resolve(true);
    });
  });
}

export function isCountdownPreviewActiveHelper(
  comp: any,
  ui?: CustomUI,
): boolean {
  const id = ui?.entity_id || comp.activeCustomUiId;
  if (!id) return false;
  if (comp.countdownPreviewActiveByUi[id] !== undefined) {
    return !!comp.countdownPreviewActiveByUi[id];
  }
  const layout = comp.getLayout(ui || comp.activeCustomUi);
  const selected =
    comp.selectedWidgetId && layout?.widgets
      ? layout.widgets.find((w: any) => w.id === comp.selectedWidgetId)
      : null;
  return selected?.widgetType === "countdown";
}

export function toggleCountdownPreviewHelper(comp: any, ui?: CustomUI): void {
  const id = ui?.entity_id || comp.activeCustomUiId;
  if (id) {
    comp.countdownPreviewActiveByUi[id] = !comp.isCountdownPreviewActive(ui);
    comp.cdr.markForCheck();
  }
}
