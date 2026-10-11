import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { DriverConverter } from "@app/converters/driver.converter";
import { AssetType, normalizeAssetType } from "@app/models/asset";
import { Driver } from "@app/models/driver";
import { DriverImportResult } from "@app/models/driver-import.model";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { getNextSelectionAfterDelete } from "@app/utils/editor-utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

import {
  cloneDriver,
  createNewDriverTemplate,
  generateUniqueDriverName,
  generateUniqueDriverNickname,
  loadDriverStorageJson,
  saveDriverStorageJson,
  toDriver,
} from "./driver-editor.helper";

export function removeDriverFromList(
  allDrivers: Driver[],
  idToDelete: string,
): { nextDriver: Driver | null; updatedDrivers: Driver[] } {
  const nextDriver = getNextSelectionAfterDelete(allDrivers, idToDelete);
  const updatedDrivers = (allDrivers || []).filter(
    (d) => d.entity_id !== idToDelete,
  );
  return { nextDriver, updatedDrivers };
}

export function saveExpanderState(
  state: { audio: boolean },
  logger: LoggerService,
): void {
  saveDriverStorageJson(
    "driver_editor_expanders",
    state,
    logger,
    "Error saving expander state",
  );
}

export function loadExpanderState(
  defaultState: { audio: boolean },
  logger: LoggerService,
): { audio: boolean } {
  return loadDriverStorageJson(
    "driver_editor_expanders",
    defaultState,
    logger,
    "Error loading expander state",
  );
}

export function saveLinkState(isLinked: boolean, logger: LoggerService): void {
  saveDriverStorageJson(
    "driver_editor_name_nickname_linked",
    isLinked,
    logger,
    "Error saving link state",
  );
}

export function loadLinkState(
  defaultLinked: boolean,
  logger: LoggerService,
): boolean {
  return loadDriverStorageJson(
    "driver_editor_name_nickname_linked",
    defaultLinked,
    logger,
    "Error loading link state",
  );
}

export function buildDriverSelectItems(
  allDrivers: Driver[],
): Array<{ id: string; name: string }> {
  return (allDrivers || [])
    .slice()
    .sort((a, b) => naturalSortCompare(a.name || "", b.name || ""))
    .map((d) => ({
      id: d.entity_id,
      name: d.name,
    }));
}

export function navigateNewDriver(
  router: Router,
  route: ActivatedRoute,
  location: Location,
  newId: string,
  isAutoSave: boolean,
): void {
  const queryParams = {
    id: newId,
    from: route.snapshot.queryParamMap.get("from"),
    returnUrl: route.snapshot.queryParamMap.get("returnUrl"),
  };
  if (isAutoSave) {
    const url = router.serializeUrl(
      router.createUrlTree(["/driver-editor"], { queryParams }),
    );
    location.replaceState(url);
  } else {
    router.navigate(["/driver-editor"], {
      queryParams,
      replaceUrl: true,
    });
  }
}

export function formatSaveErrorMessage(
  err: any,
  translationService: TranslationService,
): string {
  if (err?.status === 409) {
    return err.error || translationService.translate("DE_ERROR_NAME_EXISTS");
  }
  return (
    translationService.translate("DE_ERROR_SAVE_FAILED") +
    (err?.error || err?.message || "")
  );
}

export interface ApplySavedDriverParams {
  result: any;
  driverToSend: any;
  wasNew: boolean;
  isSaveAsNew: boolean;
  isAutoSave: boolean;
  transitionToReadOnlyOnSave: boolean;
  editingDriver?: Driver;
  allDrivers: Driver[];
}

export interface ApplySavedDriverResult {
  savedDriver: Driver;
  editingDriver: Driver;
  isEditMode: boolean;
  transitionToReadOnlyOnSave: boolean;
  isPreservingEditModeOnNavigation: boolean;
  allDrivers: Driver[];
}

export function applySavedDriver(
  params: ApplySavedDriverParams,
): ApplySavedDriverResult {
  const {
    result,
    driverToSend,
    wasNew,
    isSaveAsNew,
    isAutoSave,
    editingDriver,
    allDrivers,
  } = params;

  let transitionToReadOnlyOnSave = params.transitionToReadOnlyOnSave;
  let isEditMode = true;
  let isPreservingEditModeOnNavigation = false;

  const savedDriver = toDriver({
    ...driverToSend,
    entity_id: result?.entity_id || driverToSend?.entity_id,
  });
  DriverConverter.register(savedDriver);

  if (wasNew || isSaveAsNew) {
    isEditMode = true;
    isPreservingEditModeOnNavigation = true;
  } else if (!isAutoSave || transitionToReadOnlyOnSave) {
    isEditMode = false;
    transitionToReadOnlyOnSave = false;
  }

  let updatedEditing: Driver;
  if (wasNew || isSaveAsNew || !editingDriver) {
    updatedEditing = cloneDriver(savedDriver);
  } else {
    updatedEditing = cloneDriver(editingDriver);
    updatedEditing.entity_id = savedDriver.entity_id;
  }

  const nextDrivers = [...(allDrivers || [])];
  const idx = nextDrivers.findIndex((d) => d.entity_id === result?.entity_id);
  if (idx >= 0) {
    nextDrivers[idx] = cloneDriver(updatedEditing);
  } else {
    nextDrivers.push(cloneDriver(updatedEditing));
  }

  return {
    savedDriver,
    editingDriver: updatedEditing,
    isEditMode,
    transitionToReadOnlyOnSave,
    isPreservingEditModeOnNavigation,
    allDrivers: nextDrivers,
  };
}

export function resolveInitialDriverId(
  allDrivers: Driver[],
  idParam: string | null,
  initialLastEditedId: string | null,
  currentLastEditedId: string | null,
): { target: Driver | null; isNew: boolean } {
  if (idParam === "new") {
    return { target: null, isNew: true };
  }
  if (idParam) {
    const found = allDrivers.find((d) => d.entity_id === idParam);
    if (found) {
      return { target: found, isNew: false };
    }
    const lastEdited =
      initialLastEditedId && initialLastEditedId !== idParam
        ? initialLastEditedId
        : currentLastEditedId !== idParam
          ? currentLastEditedId
          : null;
    const foundLast = lastEdited
      ? allDrivers.find((d) => d.entity_id === lastEdited)
      : undefined;
    if (foundLast) {
      return { target: foundLast, isNew: false };
    }
    if (allDrivers.length > 0) {
      return { target: allDrivers[0], isNew: false };
    }
    return { target: null, isNew: true };
  }

  const found = currentLastEditedId
    ? allDrivers.find((d) => d.entity_id === currentLastEditedId)
    : undefined;
  if (found) {
    return { target: found, isNew: false };
  }
  if (allDrivers.length > 0) {
    return { target: allDrivers[0], isNew: false };
  }
  return { target: null, isNew: true };
}

export function navigateDriverEditorBack(
  router: Router,
  route: ActivatedRoute,
): void {
  const returnUrl = route.snapshot.queryParamMap.get("returnUrl");
  const from = route.snapshot.queryParamMap.get("from");
  if (returnUrl) {
    router.navigateByUrl(returnUrl);
  } else if (from === "modify-heats") {
    router.navigate(["/default-raceday"], {
      queryParams: { modifyHeats: "true" },
    });
  } else {
    router.navigate(["/raceday-setup"]);
  }
}

export function buildNewDriverTemplate(
  allDrivers: Driver[],
  defaultName: string,
  defaultNickname: string,
): Partial<Driver> {
  const uniqueName = generateUniqueDriverName(allDrivers, defaultName, false);
  const uniqueNickname = generateUniqueDriverNickname(
    allDrivers,
    defaultNickname,
    false,
  );
  const template = createNewDriverTemplate();
  template.name = uniqueName;
  template.nickname = uniqueNickname;
  delete (template as any).entity_id;
  return template;
}

export function prepareDriverForSaveAsNew(
  driver: Driver,
  allDrivers: Driver[],
): { name: string; nickname: string } {
  const name = generateUniqueDriverName(allDrivers, driver.name, true);
  const nickname = driver.nickname
    ? generateUniqueDriverNickname(allDrivers, driver.nickname, true)
    : "";
  return { name, nickname };
}

export function resolveTargetDriverIdAfterImport(
  result: DriverImportResult,
  currentSelectedId: string | null | undefined,
): string | undefined {
  if (result.createdDriverIds && result.createdDriverIds.length > 0) {
    return result.createdDriverIds[0];
  }
  if (result.updatedDriverIds && result.updatedDriverIds.length > 0) {
    if (
      currentSelectedId &&
      result.updatedDriverIds.includes(currentSelectedId)
    ) {
      return currentSelectedId;
    }
    return result.updatedDriverIds[0];
  }
  return currentSelectedId || undefined;
}

export function processImportedAssets(assets: any[]): {
  avatarAssets: any[];
  soundAssets: any[];
} {
  const allAssets = assets || [];
  return {
    avatarAssets: allAssets.filter((a) => a.type === "image"),
    soundAssets: allAssets.filter(
      (a) => normalizeAssetType(a.type) === AssetType.AUDIO,
    ),
  };
}

export function mapRawDrivers(rawDrivers: any[]): Driver[] {
  return (rawDrivers || []).map((d) => {
    const driver = toDriver(d);
    DriverConverter.register(driver);
    return driver;
  });
}
