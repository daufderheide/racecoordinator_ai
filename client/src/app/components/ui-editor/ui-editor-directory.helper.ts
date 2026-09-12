import {
  executeClearFolder,
  executeClearWidgetFolder,
  executeSelectFolder,
  executeSelectWidgetFolder,
} from "./ui-editor-helpers";

export async function handleSelectDirectory(comp: any): Promise<void> {
  const name = await executeSelectFolder(comp.fileSystem);
  if (name) {
    comp.customDirectoryName = name;
    comp.customDirectoryPath =
      comp.fileSystem?.getServerCustomUiPath?.() || name;
    comp.cdr.markForCheck();
  }
}

export async function handleResetDefaultDirectory(comp: any): Promise<void> {
  await executeClearFolder(comp.fileSystem);
  comp.customDirectoryName = null;
  comp.customDirectoryPath = null;
  comp.cdr.markForCheck();
}

export async function handleSelectWidgetDirectory(comp: any): Promise<void> {
  const name = await executeSelectWidgetFolder(comp.fileSystem);
  if (name) {
    comp.customWidgetDirectoryName = name;
    comp.customWidgetDirectoryPath =
      comp.fileSystem?.getServerCustomWidgetPath?.() || name;
    if (comp.customWidgetService) {
      await comp.customWidgetService.reloadCustomWidgets();
    }
    comp.cdr.markForCheck();
  }
}

export async function handleResetWidgetDirectory(comp: any): Promise<void> {
  await executeClearWidgetFolder(comp.fileSystem);
  comp.customWidgetDirectoryName = null;
  comp.customWidgetDirectoryPath = null;
  if (comp.customWidgetService) {
    await comp.customWidgetService.reloadCustomWidgets();
  }
  comp.cdr.markForCheck();
}

export function handlePromptEnterPath(comp: any, type: "ui" | "widgets"): void {
  comp.enterPathType = type;
  comp.manualPathInput =
    type === "ui"
      ? comp.customDirectoryPath || ""
      : comp.customWidgetDirectoryPath || "";
  comp.enterPathError = null;
  comp.showEnterPathModal = true;
  comp.cdr.markForCheck();
}

export function handleCancelEnterPathModal(comp: any): void {
  comp.showEnterPathModal = false;
  comp.enterPathType = null;
  comp.manualPathInput = "";
  comp.enterPathError = null;
  comp.cdr.markForCheck();
}

export async function handleConfirmEnterPath(
  comp: any,
  pathValue?: string,
): Promise<void> {
  const path = (
    pathValue !== undefined ? pathValue : comp.manualPathInput || ""
  ).trim();
  if (!path) return;
  comp.manualPathInput = path;

  if (comp.enterPathType === "ui") {
    const ok = await comp.fileSystem.setCustomFolder(path);
    if (ok) {
      const handle = await comp.fileSystem.getCustomDirectoryHandle();
      comp.customDirectoryName = handle?.name || path;
      comp.customDirectoryPath =
        comp.fileSystem?.getServerCustomUiPath?.() || path;
      comp.showEnterPathModal = false;
      comp.enterPathError = null;
    } else {
      comp.enterPathError = "UE_ERROR_DIR_NOT_FOUND";
    }
  } else {
    const ok = await comp.fileSystem.setCustomWidgetFolder(path);
    if (ok) {
      const handle = await comp.fileSystem.getCustomWidgetDirectoryHandle();
      comp.customWidgetDirectoryName = handle?.name || path;
      comp.customWidgetDirectoryPath =
        comp.fileSystem?.getServerCustomWidgetPath?.() || path;
      if (comp.customWidgetService) {
        await comp.customWidgetService.reloadCustomWidgets();
      }
      comp.showEnterPathModal = false;
      comp.enterPathError = null;
    } else {
      comp.enterPathError = "UE_ERROR_DIR_NOT_FOUND";
    }
  }
  comp.cdr.markForCheck();
}

export async function handleUpdateSampleWidgets(comp: any): Promise<void> {
  if (comp.customWidgetService) {
    try {
      const result = await comp.customWidgetService.exportStarterWidgets();
      if (result && result.success) {
        comp.openSuccessModal({
          title: "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_TITLE",
          message: "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_MSG",
          params: {
            count: result.count,
            directory: result.directory || comp.customWidgetDirectoryName || "",
          },
        });
      }
      comp.cdr.markForCheck();
    } catch (e) {
      comp.logger.error("Failed to update sample widgets", e);
    }
  }
}
