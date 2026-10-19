import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { LaneViewMigrationHelper } from "@app/components/raceday/utils/lane-view-migration.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import {
  buildLayoutExport,
  downloadJsonFile,
  exportMigrationDiagnostics,
  getDefaultLayoutResetData,
  parseLayoutImport,
  preMigrationLayoutCache,
  restorePreMigrationLayout,
  upgradePreservedHeatViewLayout,
} from "./ui-editor-io.helper";

export function applyResetLayout(
  ui: CustomUI,
  editingSettings: Settings,
  windowWidth?: number,
  windowHeight?: number,
): any {
  const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
  const data = getDefaultLayoutResetData(isPractice, windowWidth, windowHeight);

  ui.layoutJson = JSON.stringify(data.defaultLayout);
  ui.columnsJson = JSON.stringify(data.columns);
  ui.columnLayoutsJson = JSON.stringify(data.columnLayouts);
  ui.columnVisibilityJson = JSON.stringify(data.columnVisibility);
  ui.columnWidthsJson = JSON.stringify(data.columnWidths);
  ui.columnAnchorsJson = JSON.stringify(data.columnAnchors);

  if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
    editingSettings.racedayLayout = data.defaultLayout;
    editingSettings.racedayColumns = data.columns;
    editingSettings.columnLayouts = data.columnLayouts;
    editingSettings.columnVisibility = data.columnVisibility;
    editingSettings.columnWidths = data.columnWidths;
    editingSettings.columnAnchors = data.columnAnchors;
  } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
    editingSettings.practiceRacedayLayout = data.defaultLayout;
    editingSettings.practiceRacedayColumns = data.columns;
    editingSettings.practiceColumnLayouts = data.columnLayouts;
    editingSettings.practiceColumnVisibility = data.columnVisibility;
    editingSettings.practiceColumnWidths = data.columnWidths;
    editingSettings.practiceColumnAnchors = data.columnAnchors;
  }
  return data;
}

export function applyImportLayout(
  rawJson: string,
  ui: CustomUI,
  editingSettings: Settings,
): boolean {
  const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
  const parsed = parseLayoutImport(rawJson, isPractice);
  if (!parsed) return false;

  ui.layoutJson = JSON.stringify(parsed.layout);
  ui.columnsJson = JSON.stringify(parsed.columns);
  ui.columnLayoutsJson = JSON.stringify(parsed.columnLayouts);
  ui.columnVisibilityJson = JSON.stringify(parsed.columnVisibility);
  ui.columnAnchorsJson = JSON.stringify(parsed.columnAnchors);
  ui.columnWidthsJson = JSON.stringify(parsed.columnWidths);

  if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
    editingSettings.racedayLayout = parsed.layout;
    editingSettings.racedayColumns = parsed.columns;
    editingSettings.columnLayouts = parsed.columnLayouts;
    editingSettings.columnVisibility = parsed.columnVisibility;
    editingSettings.columnAnchors = parsed.columnAnchors;
    editingSettings.columnWidths = parsed.columnWidths;
  } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
    editingSettings.practiceRacedayLayout = parsed.layout;
    editingSettings.practiceRacedayColumns = parsed.columns;
    editingSettings.practiceColumnLayouts = parsed.columnLayouts;
    editingSettings.practiceColumnVisibility = parsed.columnVisibility;
    editingSettings.practiceColumnAnchors = parsed.columnAnchors;
    editingSettings.practiceColumnWidths = parsed.columnWidths;
  }
  return true;
}

export function applyClearLayout(
  ui: CustomUI,
  editingSettings: Settings,
): LayoutConfig {
  let layout: any = undefined;
  if (ui.layoutJson) {
    try {
      layout = JSON.parse(ui.layoutJson);
    } catch {
      // ignore
    }
  }
  if (!layout) {
    const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
    layout = isPractice
      ? editingSettings?.practiceRacedayLayout ||
        Settings.DEFAULT_PRACTICE_LAYOUT
      : editingSettings?.racedayLayout || Settings.DEFAULT_LAYOUT;
    layout = deepCopy(layout);
  }
  layout.widgets = [];

  ui.layoutJson = JSON.stringify(layout);

  if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
    editingSettings.racedayLayout = layout;
  } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
    editingSettings.practiceRacedayLayout = layout;
  }
  return layout;
}

export function executeClearLayout(
  ui: CustomUI,
  editingSettings: Settings,
): LayoutConfig {
  return applyClearLayout(ui, editingSettings);
}

export function executeResetLayout(
  ui: CustomUI,
  editingSettings: Settings,
  windowWidth?: number,
  windowHeight?: number,
): any {
  return applyResetLayout(ui, editingSettings, windowWidth, windowHeight);
}

export function executeExportLayout(
  ui: CustomUI,
  editingSettings: Settings,
): void {
  const { layoutExport, fileName } = (
    require("./ui-editor-io.helper") as typeof import("./ui-editor-io.helper")
  ).buildLayoutExport(ui, editingSettings);
  (
    require("./ui-editor-io.helper") as typeof import("./ui-editor-io.helper")
  ).downloadJsonFile(layoutExport, fileName);
}

export function executeImportLayout(
  event: Event,
  ui: CustomUI,
  editingSettings: Settings,
  logger: any,
  onSuccess: () => void,
): void {
  const input = event?.target as HTMLInputElement;
  if (!input?.files || input.files.length === 0) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (applyImportLayout(e.target?.result as string, ui, editingSettings)) {
        onSuccess();
      }
    } catch (err) {
      logger.error("Failed to parse layout file", err);
    }
  };
  reader.readAsText(input.files[0]);
  input.value = "";
}

export function resolveTargetCustomUi(
  kind: "practice" | "raceday" | "current" | undefined,
  activeCustomUiId: string,
  displayCustomUIs: CustomUI[],
  isCurrentLayoutPractice: boolean,
): CustomUI | undefined {
  if (kind === "practice" || (kind === "current" && isCurrentLayoutPractice)) {
    return displayCustomUIs.find(
      (x) => x.entity_id === "practice_ui_layout_rc_ai",
    );
  }
  if (
    kind === "raceday" ||
    (kind === "current" && activeCustomUiId === "default_ui_layout_rc_ai")
  ) {
    return displayCustomUIs.find(
      (x) => x.entity_id === "default_ui_layout_rc_ai",
    );
  }
  return (
    displayCustomUIs.find((u) => u.entity_id === activeCustomUiId) ||
    displayCustomUIs[0]
  );
}

export function handleResetLayout(comp: any, ui?: CustomUI): void {
  const targetUi = ui || comp.activeCustomUi;
  if (!targetUi) return;
  const resetData = executeResetLayout(targetUi, comp.editingSettings);
  if (comp.editingState?.settings) {
    comp.editingState.settings = deepCopy(comp.editingSettings);
  }
  if (comp.parsedLayouts && targetUi.entity_id && resetData?.defaultLayout) {
    comp.parsedLayouts.set(targetUi.entity_id, resetData.defaultLayout);
  }
  comp.activeGridSession = null;
  LaneGridAnimationHelper.reset();
  if (comp.selectedAnchor !== undefined) {
    comp.selectedAnchor = null;
  }
  if (resetData?.defaultLayout) {
    comp.syncRacedayPreview?.(resetData.defaultLayout, targetUi);
  }
  comp.undoManager?.captureState?.() || comp.captureState?.();
  comp.refreshDisplayProperties?.();
  comp.cdr?.detectChanges?.() || comp.cdr?.markForCheck?.();
}

export function handleClearLayout(comp: any, ui?: CustomUI): void {
  const targetUi = ui || comp.activeCustomUi;
  if (!targetUi) return;
  const clearedLayout = executeClearLayout(targetUi, comp.editingSettings);
  if (comp.editingState?.settings) {
    comp.editingState.settings = deepCopy(comp.editingSettings);
  }
  if (comp.parsedLayouts && targetUi.entity_id) {
    comp.parsedLayouts.set(targetUi.entity_id, clearedLayout);
  }
  comp.activeGridSession = null;
  LaneGridAnimationHelper.reset();
  comp.selectedWidgetId = null;
  if (comp.selectedAnchor !== undefined) {
    comp.selectedAnchor = null;
  }
  if (
    "currentSelectedWidget" in comp &&
    typeof comp.currentSelectedWidget !== "function"
  ) {
    try {
      comp.currentSelectedWidget = null;
    } catch {
      // ignore if currentSelectedWidget is a getter
    }
  }
  const uiId = targetUi.entity_id || comp.activeCustomUiId;
  if (uiId && comp.countdownPreviewActiveByUi) {
    comp.countdownPreviewActiveByUi[uiId] = false;
  }
  comp.syncRacedayPreview?.(clearedLayout, targetUi);
  comp.undoManager?.captureState?.() || comp.captureState?.();
  comp.refreshDisplayProperties?.();
  comp.cdr?.detectChanges?.() || comp.cdr?.markForCheck?.();
}

export function handleExportLayout(comp: any, ui: CustomUI): void {
  const { layoutExport, fileName } = buildLayoutExport(
    ui,
    comp.editingSettings,
  );
  if (comp?.downloadJson) {
    comp.downloadJson(layoutExport, fileName);
  } else {
    downloadJsonFile(layoutExport, fileName);
  }
}

export function handleImportLayout(
  comp: any,
  event: Event,
  ui: CustomUI,
): void {
  executeImportLayout(event, ui, comp.editingSettings, comp.logger, () => {
    if (comp.editingState?.settings) {
      comp.editingState.settings = deepCopy(comp.editingSettings);
    }
    comp.activeGridSession = null;
    LaneGridAnimationHelper.reset();
    const layout = comp.getLayout(ui);
    if (comp.parsedLayouts && ui?.entity_id) {
      comp.parsedLayouts.set(ui.entity_id, layout);
    }
    comp.syncRacedayPreview?.(layout, ui);
    comp.undoManager?.captureState?.() || comp.captureState?.();
    comp.refreshDisplayProperties?.();
    comp.cdr?.detectChanges?.() || comp.cdr?.markForCheck?.();
  });
}

export function handleResetCurrentLayout(comp: any): void {
  if (comp.isCurrentLayoutPractice) {
    comp.resetPracticeRacedayLayout();
  } else if (comp.activeCustomUiId === "default_ui_layout_rc_ai") {
    comp.resetRacedayLayout();
  } else if (comp.activeCustomUi) {
    comp.resetLayout(comp.activeCustomUi);
  }
}

export function handleClearCurrentLayout(comp: any): void {
  if (comp.isCurrentLayoutPractice) {
    const u = comp.getTargetCustomUi("practice");
    if (u) comp.clearLayout(u);
  } else if (comp.activeCustomUiId === "default_ui_layout_rc_ai") {
    const u = comp.getTargetCustomUi("raceday");
    if (u) comp.clearLayout(u);
  } else if (comp.activeCustomUi) {
    comp.clearLayout(comp.activeCustomUi);
  }
}

export function handleExportCurrentLayout(comp: any): void {
  if (comp.isCurrentLayoutPractice) {
    comp.exportPracticeRacedayLayout();
  } else if (comp.activeCustomUiId === "default_ui_layout_rc_ai") {
    comp.exportRacedayLayout();
  } else if (comp.activeCustomUi) {
    comp.exportLayout(comp.activeCustomUi);
  }
}

export function handleImportCurrentLayout(comp: any, event: Event): void {
  if (comp.isCurrentLayoutPractice) {
    comp.onImportPracticeRacedayLayout(event);
  } else if (comp.activeCustomUiId === "default_ui_layout_rc_ai") {
    comp.onImportRacedayLayout(event);
  } else if (comp.activeCustomUi) {
    comp.onImportLayout(event, comp.activeCustomUi);
  }
}

export function handleResetRacedayLayout(comp: any): void {
  const u = comp.getTargetCustomUi("raceday");
  if (u) comp.resetLayout(u);
}

export function handleResetPracticeRacedayLayout(comp: any): void {
  comp.selectedWidgetId = "widget-lane-view";
  const u = comp.getTargetCustomUi("practice");
  if (u) comp.resetLayout(u);
}

export function handleExportRacedayLayout(comp: any): void {
  const u = comp.getTargetCustomUi("raceday");
  if (u) comp.exportLayout(u);
}

export function handleExportPracticeRacedayLayout(comp: any): void {
  const u = comp.getTargetCustomUi("practice");
  if (u) comp.exportLayout(u);
}

export function handleImportRacedayLayout(comp: any, event: Event): void {
  const u = comp.getTargetCustomUi("raceday");
  if (u) comp.onImportLayout(event, u);
}

export function handleImportPracticeRacedayLayout(
  comp: any,
  event: Event,
): void {
  const u = comp.getTargetCustomUi("practice");
  if (u) comp.onImportLayout(event, u);
}

export function handleRestorePreMigrationBackup(comp: any, ui: CustomUI): void {
  const res = restorePreMigrationLayout(ui, comp.customUIs);
  if (res.restored && res.layout) {
    comp.activeGridSession = null;
    comp.dismissedMigrationUis?.delete(ui.entity_id);
    comp.saveDismissedMigrationUis?.();
    comp.onLayoutChanged(res.layout, ui);
    comp.syncRacedayPreview(res.layout, ui);
    comp.showSuccessModal = true;
    comp.successModalTitle = "COMMON_RESTORE";
    comp.successModalMessage = "UE_MIGRATION_RESTORE_SUCCESS";
    comp.cdr?.markForCheck();
  } else {
    comp.logger?.warn(
      "Could not find pre-migration layout to restore for",
      ui?.name,
    );
  }
}

export function handleUpgradeLegacyHeatView(comp: any, ui: CustomUI): void {
  const isPractice =
    ui.entity_id === "practice_ui_layout_rc_ai" ||
    ui.name?.toLowerCase().includes("practice");
  const res = upgradePreservedHeatViewLayout(ui, isPractice);
  if (res.upgraded && res.layout) {
    comp.dismissedMigrationUis?.delete(ui.entity_id);
    comp.saveDismissedMigrationUis?.();
    comp.onLayoutChanged(res.layout, ui);
    comp.syncRacedayPreview(res.layout, ui);
    comp.showSuccessModal = true;
    comp.successModalTitle = "COMMON_SUCCESS";
    comp.successModalMessage = "UE_MIGRATION_UPGRADE_SUCCESS";
    comp.cdr?.markForCheck();
  }
}

export function handleExportMigrationDiagnostics(
  comp: any,
  ui: CustomUI,
): void {
  exportMigrationDiagnostics(ui, comp.getLayout(ui));
}

export class MigrationController {
  private readonly DISMISSED_MIGRATION_STORAGE_KEY =
    "rc_dismissed_migration_uis";
  dismissedMigrationUis: Set<string> = this.loadDismissedMigrationUis();

  constructor(private comp: any) {}

  public loadDismissedMigrationUis(): Set<string> {
    try {
      const raw = localStorage.getItem(this.DISMISSED_MIGRATION_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return new Set(arr);
        }
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  }

  public saveDismissedMigrationUis(): void {
    try {
      localStorage.setItem(
        this.DISMISSED_MIGRATION_STORAGE_KEY,
        JSON.stringify(Array.from(this.dismissedMigrationUis)),
      );
    } catch {
      // ignore
    }
  }

  public isPreMigrationBackup(ui: CustomUI): boolean {
    return Boolean(ui?.name && ui.name.endsWith(" (Pre-Migration Backup)"));
  }

  public hasAvailablePreMigrationBackup(ui: CustomUI): boolean {
    if (!ui || this.isPreMigrationBackup(ui)) {
      return false;
    }
    const layout = this.comp.getLayout(ui);
    if (
      layout?.preserveLegacyHeatView ||
      layout?.widgets?.some((w: any) => w.widgetType === "lane-view")
    ) {
      return false;
    }
    if ((ui as any)?._wasMigrated || (ui as any)?._preMigrationLayout) {
      return true;
    }
    if (ui.entity_id && preMigrationLayoutCache.has(ui.entity_id)) {
      return true;
    }
    const backupName =
      `${(ui.name || "").trim()} (Pre-Migration Backup)`.toLowerCase();
    if (
      this.comp.customUIs?.some(
        (u: CustomUI) => (u.name || "").trim().toLowerCase() === backupName,
      )
    ) {
      return true;
    }
    if (
      ui.entity_id === "default_ui_layout_rc_ai" ||
      ui.entity_id === "practice_ui_layout_rc_ai" ||
      ui.is_default
    ) {
      return true;
    }
    return false;
  }

  public isMigratedLayout(ui: CustomUI): boolean {
    if (!ui?.entity_id) {
      return false;
    }
    if (this.dismissedMigrationUis.has(ui.entity_id)) {
      return false;
    }
    return this.hasAvailablePreMigrationBackup(ui);
  }

  public canUpgradeLegacyHeatView(ui: CustomUI): boolean {
    if (!ui?.entity_id) {
      return false;
    }
    if (this.dismissedMigrationUis.has(ui.entity_id)) {
      return false;
    }
    const layout = this.comp.getLayout(ui);
    return LaneViewMigrationHelper.canUpgradeLegacyHeatView(layout, ui?.name);
  }

  public canReopenMigrationBanner(ui: CustomUI): boolean {
    if (!ui?.entity_id) {
      return false;
    }
    if (!this.dismissedMigrationUis.has(ui.entity_id)) {
      return false;
    }
    const layout = this.comp.getLayout(ui);
    const canUpgrade = LaneViewMigrationHelper.canUpgradeLegacyHeatView(
      layout,
      ui?.name,
    );
    const canRestore = this.hasAvailablePreMigrationBackup(ui);
    return canUpgrade || canRestore;
  }

  public dismissMigrationBanner(ui: CustomUI): void {
    if (ui?.entity_id) {
      this.dismissedMigrationUis.add(ui.entity_id);
      this.saveDismissedMigrationUis();
      this.comp.cdr?.markForCheck();
    }
  }

  public reopenMigrationBanner(ui: CustomUI): void {
    if (ui?.entity_id) {
      this.dismissedMigrationUis.delete(ui.entity_id);
      this.saveDismissedMigrationUis();
      this.comp.cdr?.markForCheck();
    }
  }

  public restorePreMigrationBackup(ui: CustomUI): void {
    this.comp.pendingRestoreBackupUi = ui;
    this.comp.showRestoreBackupConfirm = true;
    this.comp.cdr?.markForCheck();
  }

  public confirmRestorePreMigrationBackup(): void {
    if (this.comp.pendingRestoreBackupUi) {
      const ui = this.comp.pendingRestoreBackupUi;
      this.comp.pendingRestoreBackupUi = null;
      this.comp.showRestoreBackupConfirm = false;
      handleRestorePreMigrationBackup(this.comp, ui);
    }
  }

  public cancelRestorePreMigrationBackup(): void {
    this.comp.pendingRestoreBackupUi = null;
    this.comp.showRestoreBackupConfirm = false;
    this.comp.cdr?.markForCheck();
  }

  public upgradeLegacyHeatView(ui: CustomUI): void {
    this.comp.pendingUpgradeHeatViewUi = ui;
    this.comp.showUpgradeHeatViewConfirm = true;
    this.comp.cdr?.markForCheck();
  }

  public confirmUpgradeLegacyHeatView(): void {
    if (this.comp.pendingUpgradeHeatViewUi) {
      const ui = this.comp.pendingUpgradeHeatViewUi;
      this.comp.pendingUpgradeHeatViewUi = null;
      this.comp.showUpgradeHeatViewConfirm = false;
      handleUpgradeLegacyHeatView(this.comp, ui);
    }
  }

  public cancelUpgradeLegacyHeatView(): void {
    this.comp.pendingUpgradeHeatViewUi = null;
    this.comp.showUpgradeHeatViewConfirm = false;
    this.comp.cdr?.markForCheck();
  }

  public exportMigrationDiagnostics(ui: CustomUI): void {
    handleExportMigrationDiagnostics(this.comp, ui);
  }
}

export class LayoutActionsController {
  constructor(private comp: any) {}

  resetLayout = (ui: CustomUI) => handleResetLayout(this.comp, ui);
  clearLayout = (ui: CustomUI) => handleClearLayout(this.comp, ui);
  clearCurrentLayout = () => handleClearCurrentLayout(this.comp);
  resetCurrentLayout = () => handleResetCurrentLayout(this.comp);
  resetRacedayLayout = () => handleResetRacedayLayout(this.comp);
  resetPracticeRacedayLayout = () =>
    handleResetPracticeRacedayLayout(this.comp);
  exportCurrentLayout = () => handleExportCurrentLayout(this.comp);
  exportLayout = (ui: CustomUI) => handleExportLayout(this.comp, ui);
  exportRacedayLayout = () => handleExportRacedayLayout(this.comp);
  exportPracticeRacedayLayout = () =>
    handleExportPracticeRacedayLayout(this.comp);
  onImportCurrentLayout = (event: Event) =>
    handleImportCurrentLayout(this.comp, event);
  onImportLayout = (event: Event, ui: CustomUI) =>
    handleImportLayout(this.comp, event, ui);
  onImportRacedayLayout = (event: Event) =>
    handleImportRacedayLayout(this.comp, event);
  onImportPracticeRacedayLayout = (event: Event) =>
    handleImportPracticeRacedayLayout(this.comp, event);
  onRacedayLayoutChanged = (newLayout: any) =>
    this.comp.onLayoutChanged(
      newLayout,
      this.comp.displayCustomUIs.find(
        (u: any) => u.entity_id === "default_ui_layout_rc_ai",
      ),
    );
  onPracticeRacedayLayoutChanged = (newLayout: any) =>
    this.comp.onLayoutChanged(
      newLayout,
      this.comp.displayCustomUIs.find(
        (u: any) => u.entity_id === "practice_ui_layout_rc_ai",
      ),
    );
  getScaledDefaultLayout = (isPractice = false) =>
    getDefaultLayoutResetData(isPractice).defaultLayout;
  getTargetCustomUi = (kind?: "practice" | "raceday" | "current") =>
    resolveTargetCustomUi(
      kind,
      this.comp.activeCustomUiId,
      this.comp.displayCustomUIs,
      this.comp.isCurrentLayoutPractice,
    );
}
