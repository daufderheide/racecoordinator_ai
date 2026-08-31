import { CustomUI } from "@app/models/custom-ui";
import { deepCopy } from "@app/utils/clone.utils";

import { UIEditorState } from "./ui-editor-constants";
import { isCustomUiDefault } from "./ui-editor-crud.helper";

export function sortCustomUisForDisplay(customUIs: CustomUI[]): CustomUI[] {
  const defaultUIs = (customUIs || []).filter((u) => isCustomUiDefault(u));
  const otherUIs = (customUIs || []).filter((u) => !isCustomUiDefault(u));
  defaultUIs.sort((a, b) => {
    if (a.entity_id === "default_ui_layout_rc_ai") return -1;
    if (b.entity_id === "default_ui_layout_rc_ai") return 1;
    return 0;
  });
  return [...defaultUIs, ...otherUIs];
}

export function handleCustomUiStateDeletion(
  editingState: UIEditorState,
  activeCustomUiId: string,
  uiIdToDelete: string,
): { newActiveUiId: string } {
  if (editingState.customUIs) {
    editingState.customUIs = editingState.customUIs.filter(
      (u) => u.entity_id !== uiIdToDelete,
    );
  }
  if (editingState.themes) {
    for (const t of editingState.themes) {
      if (t.uiId === uiIdToDelete) {
        const remainingUi = (editingState.customUIs || [])[0];
        t.uiId = remainingUi
          ? remainingUi.entity_id
          : "default_ui_layout_rc_ai";
      }
    }
  }
  let newActiveUiId = activeCustomUiId;
  if (activeCustomUiId === uiIdToDelete) {
    const remainingUi = (editingState.customUIs || [])[0];
    newActiveUiId = remainingUi ? remainingUi.entity_id : "";
  }
  return { newActiveUiId };
}

export async function executeCreateCustomUi(params: {
  displayCustomUIs: CustomUI[];
  editingState: UIEditorState;
  translationService: any;
  dataService: any;
  logger: any;
}): Promise<CustomUI | undefined> {
  const defaultUi = params.displayCustomUIs.find(
    (u) => u.entity_id === "default_ui_layout_rc_ai" || isCustomUiDefault(u),
  );
  if (!defaultUi) return undefined;
  try {
    const { createCustomUiEntity } =
      await import("./ui-editor-operations.helper");
    const created = await createCustomUiEntity(
      defaultUi,
      params.translationService,
      params.dataService,
    );
    if (created) {
      if (!params.editingState.customUIs) params.editingState.customUIs = [];
      params.editingState.customUIs.push(created);
      return created;
    }
  } catch (err: any) {
    const { handleOperationError } =
      await import("./ui-editor-operations.helper");
    handleOperationError(
      err,
      "UE_ERROR_CREATE_FAILED",
      params.logger,
      params.translationService,
    );
  }
  return undefined;
}

export async function executeDuplicateCustomUi(params: {
  ui: CustomUI;
  editingState: UIEditorState;
  translationService: any;
  dataService: any;
  logger: any;
}): Promise<CustomUI | undefined> {
  try {
    const { duplicateCustomUiEntity } =
      await import("./ui-editor-operations.helper");
    const created = await duplicateCustomUiEntity(
      params.ui,
      params.translationService,
      params.dataService,
    );
    if (created) {
      if (!params.editingState.customUIs) params.editingState.customUIs = [];
      params.editingState.customUIs.push(created);
      return created;
    }
  } catch (err: any) {
    const { handleOperationError } =
      await import("./ui-editor-operations.helper");
    handleOperationError(
      err,
      "UE_ERROR_DUPLICATE_FAILED",
      params.logger,
      params.translationService,
    );
  }
  return undefined;
}

export async function executeDeleteCustomUi(params: {
  uiToDelete: CustomUI;
  editingState: UIEditorState;
  activeCustomUiId: string;
  sectionsExpanded: { [key: string]: boolean };
  dataService: any;
  logger: any;
  translationService: any;
}): Promise<{ newActiveUiId?: string }> {
  try {
    const { deleteCustomUiEntity } =
      await import("./ui-editor-operations.helper");
    await deleteCustomUiEntity(params.uiToDelete.entity_id, params.dataService);
    delete params.sectionsExpanded[`ui_${params.uiToDelete.entity_id}`];
    const { newActiveUiId } = handleCustomUiStateDeletion(
      params.editingState,
      params.activeCustomUiId,
      params.uiToDelete.entity_id,
    );
    return { newActiveUiId };
  } catch (err) {
    params.logger.error("Failed to delete UI layout", err);
    alert(params.translationService.translate("UE_ERROR_DELETE_FAILED"));
    return {};
  }
}

export async function handleCreateCustomUi(comp: any): Promise<void> {
  const created = await executeCreateCustomUi({
    displayCustomUIs: comp.displayCustomUIs,
    editingState: comp.editingState,
    translationService: comp.translationService,
    dataService: comp.dataService,
    logger: comp.logger,
  });
  if (created) {
    comp.refreshDisplayProperties();
    comp.undoManager.captureState();
    comp.toggleUiSection(created.entity_id);
    comp.cdr.markForCheck();
  }
}

export async function handleDuplicateCustomUi(
  comp: any,
  ui: CustomUI,
): Promise<void> {
  const created = await executeDuplicateCustomUi({
    ui,
    editingState: comp.editingState,
    translationService: comp.translationService,
    dataService: comp.dataService,
    logger: comp.logger,
  });
  if (created) {
    comp.refreshDisplayProperties();
    comp.undoManager.captureState();
    comp.toggleUiSection(created.entity_id);
    comp.cdr.markForCheck();
  }
}

export async function handleConfirmDeleteCustomUi(comp: any): Promise<void> {
  if (!comp.uiToDelete) return;
  const ui = comp.uiToDelete;
  comp.showDeleteUiConfirm = false;
  comp.uiToDelete = null;

  const { newActiveUiId } = await executeDeleteCustomUi({
    uiToDelete: ui,
    editingState: comp.editingState,
    activeCustomUiId: comp.activeCustomUiId,
    sectionsExpanded: comp.sectionsExpanded,
    dataService: comp.dataService,
    logger: comp.logger,
    translationService: comp.translationService,
  });
  if (newActiveUiId !== undefined) {
    comp.activeCustomUiId = newActiveUiId;
    comp.refreshDisplayProperties();
    comp.undoManager.captureState();
    comp.cdr.markForCheck();
  }
}

export function handleCustomUiSelection(comp: any, uiId: string): void {
  comp.activeCustomUiId = uiId;
  comp.ensureWidgetSelected(
    comp.displayCustomUIs.find((u: any) => u.entity_id === uiId),
  );
  if (comp.editingSettings) {
    comp.editingState.settings = { ...comp.editingSettings };
  }
  if (comp.displayCustomUIs?.length) {
    comp.editingState.customUIs = deepCopy(comp.displayCustomUIs);
  }
  comp.refreshDisplayProperties();
  comp.cdr.markForCheck();
}
