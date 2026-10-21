import {
  LaneGridRepairHelper,
  StackedColumnDetectionResult,
  StackedColumnIssue,
} from "@app/components/raceday/utils/lane-grid-repair.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig } from "@app/models/settings";

import { parseLayoutImport } from "./ui-editor-io.helper";
import { applyImportLayout } from "./ui-editor-layout-actions.helper";

export interface PendingImportStackedLayout {
  rawJson: string;
  ui: CustomUI;
  onSuccess: () => void;
  detection: StackedColumnDetectionResult;
}

export class StackedColumnsController {
  private readonly DISMISSED_STACKED_STORAGE_KEY =
    "rc_dismissed_stacked_columns_uis";
  public dismissedStackedColumnsUis = new Set<string>();
  public cachedDetectionResults = new Map<
    string,
    StackedColumnDetectionResult
  >();

  constructor(private readonly comp: any) {
    this.loadDismissedUis();
  }

  private loadDismissedUis(): void {
    try {
      const stored = localStorage.getItem(this.DISMISSED_STACKED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.dismissedStackedColumnsUis = new Set(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  public saveDismissedUis(): void {
    try {
      localStorage.setItem(
        this.DISMISSED_STACKED_STORAGE_KEY,
        JSON.stringify(Array.from(this.dismissedStackedColumnsUis)),
      );
    } catch {
      // ignore storage errors
    }
  }

  public clearCache(): void {
    this.cachedDetectionResults.clear();
  }

  public detectForUi(ui: CustomUI): StackedColumnDetectionResult {
    if (!ui) {
      return { hasIssues: false, issues: [], totalDuplicatesCount: 0 };
    }
    const layout = this.comp.getLayout(ui);
    if (!layout?.widgets || layout.widgets.length === 0) {
      return { hasIssues: false, issues: [], totalDuplicatesCount: 0 };
    }

    const cacheKey = `${ui.entity_id}_${layout.widgets.length}_${ui.layoutJson?.length || 0}`;
    if (this.cachedDetectionResults.has(cacheKey)) {
      return this.cachedDetectionResults.get(cacheKey)!;
    }

    const result = LaneGridRepairHelper.detectStackedColumns(
      layout,
      this.comp.availableColumns,
    );
    this.cachedDetectionResults.set(cacheKey, result);
    return result;
  }

  public hasStackedColumns(ui: CustomUI): boolean {
    if (!ui?.entity_id) return false;
    if (this.dismissedStackedColumnsUis.has(ui.entity_id)) return false;
    const result = this.detectForUi(ui);
    return result.hasIssues;
  }

  public getStackedColumnsIssues(ui: CustomUI): StackedColumnIssue[] {
    return this.detectForUi(ui).issues;
  }

  public getStackedColumnsIssueCount(ui: CustomUI): number {
    return this.detectForUi(ui).totalDuplicatesCount;
  }

  public getStackedColumnsBannerDesc(ui: CustomUI): string {
    const count = this.getStackedColumnsIssueCount(ui);
    if (count === 1) {
      return (
        this.comp.translationService?.translate(
          "UE_STACKED_COLUMNS_BANNER_DESC_ONE",
        ) ||
        "This layout contains 1 duplicate or overlapping column that may cause display glitches and editing issues."
      );
    }
    return (
      this.comp.translationService?.translate(
        "UE_STACKED_COLUMNS_BANNER_DESC",
        {
          count,
        },
      ) ||
      `This layout contains ${count} duplicate or overlapping columns that may cause display glitches and editing issues.`
    );
  }

  public canReopenStackedColumnsBanner(ui: CustomUI): boolean {
    if (!ui?.entity_id) return false;
    if (!this.dismissedStackedColumnsUis.has(ui.entity_id)) return false;
    const result = this.detectForUi(ui);
    return result.hasIssues;
  }

  public dismissStackedColumnsBanner(ui: CustomUI): void {
    if (ui?.entity_id) {
      this.dismissedStackedColumnsUis.add(ui.entity_id);
      this.saveDismissedUis();
      this.comp.cdr?.markForCheck();
    }
  }

  public reopenStackedColumnsBanner(ui: CustomUI): void {
    if (ui?.entity_id) {
      this.dismissedStackedColumnsUis.delete(ui.entity_id);
      this.saveDismissedUis();
      this.comp.cdr?.markForCheck();
    }
  }

  public openReviewStackedColumnsModal(ui: CustomUI): void {
    const issues = this.getStackedColumnsIssues(ui);
    this.comp.detectedStackedIssues = issues;
    this.comp.pendingRepairStackedUi = ui;
    this.comp.showReviewStackedColumnsModal = true;
    this.comp.cdr?.markForCheck();
  }

  public quickFixStackedColumns(ui: CustomUI): void {
    this.comp.pendingRepairStackedUi = ui;
    this.confirmRepairStackedColumns();
  }

  public confirmRepairStackedColumns(): void {
    const ui = this.comp.pendingRepairStackedUi || this.comp.activeCustomUi;
    if (!ui) return;

    const layout = this.comp.getLayout(ui);
    if (!layout) return;

    // Capture state for undo/redo before making mutations
    this.comp.captureState?.();

    const session = this.comp.activeGridSession?.gridId
      ? this.comp.activeGridSession
      : null;
    const repairResult = LaneGridRepairHelper.repairStackedColumns(
      layout,
      session,
      this.comp.availableColumns,
    );

    this.applyRepairedLayout(ui, repairResult.layout);
    this.clearCache();

    this.comp.showReviewStackedColumnsModal = false;
    this.comp.pendingRepairStackedUi = null;

    // Show success acknowledgement modal
    this.comp.successModalTitle = "UE_STACKED_COLUMNS_MODAL_TITLE";
    this.comp.successModalMessage =
      repairResult.repairedCount === 1
        ? "UE_STACKED_COLUMNS_FIXED_SUCCESS_ONE"
        : "UE_STACKED_COLUMNS_FIXED_SUCCESS";
    this.comp.successModalParams = { count: repairResult.repairedCount };
    this.comp.showSuccessModal = true;

    this.comp.markLayoutDirty?.();
    this.comp.cdr?.markForCheck();
  }

  public applyRepairedLayout(ui: CustomUI, layout: LayoutConfig): void {
    ui.layoutJson = JSON.stringify(layout);

    if (
      ui.entity_id === "default_ui_layout_rc_ai" &&
      this.comp.editingSettings
    ) {
      this.comp.editingSettings.racedayLayout = layout;
    } else if (
      ui.entity_id === "practice_ui_layout_rc_ai" &&
      this.comp.editingSettings
    ) {
      this.comp.editingSettings.practiceRacedayLayout = layout;
    }

    if (this.comp.parsedLayouts && ui.entity_id) {
      this.comp.parsedLayouts.set(ui.entity_id, layout);
    }
    this.comp.syncRacedayPreview?.(layout, ui);

    if (this.comp.layoutChanged?.emit) {
      this.comp.layoutChanged.emit(layout);
    }
  }

  public promptRepairImportedLayout(
    rawJson: string,
    ui: CustomUI,
    onSuccess: () => void,
  ): boolean {
    const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
    const parsed = parseLayoutImport(rawJson, isPractice);
    if (!parsed?.layout) return false;

    const detection = LaneGridRepairHelper.detectStackedColumns(
      parsed.layout,
      this.comp.availableColumns,
    );

    if (!detection.hasIssues) {
      return false; // Proceed with normal import
    }

    this.comp.pendingImportStacked = {
      rawJson,
      ui,
      onSuccess,
      detection,
    };
    this.comp.importStackedCount = detection.totalDuplicatesCount;
    this.comp.showImportStackedConfirm = true;
    this.comp.cdr?.markForCheck();
    return true;
  }

  public confirmRepairImportedLayout(): void {
    if (!this.comp.pendingImportStacked) return;
    const { rawJson, ui, onSuccess } = this.comp.pendingImportStacked;
    const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
    const parsed = parseLayoutImport(rawJson, isPractice);

    if (parsed?.layout) {
      const repairResult = LaneGridRepairHelper.repairStackedColumns(
        parsed.layout,
        null,
        this.comp.availableColumns,
      );
      parsed.layout = repairResult.layout;

      // Re-serialize with repaired layout
      const repairedExport = {
        layout: parsed.layout,
        columns: parsed.columns,
        columnLayouts: parsed.columnLayouts,
        columnVisibility: parsed.columnVisibility,
        columnAnchors: parsed.columnAnchors,
        columnWidths: parsed.columnWidths,
      };

      applyImportLayout(
        JSON.stringify(repairedExport),
        ui,
        this.comp.editingSettings,
      );
      this.clearCache();
      onSuccess();

      this.comp.successModalTitle = "UE_STACKED_COLUMNS_IMPORT_ALERT_TITLE";
      this.comp.successModalMessage = "UE_STACKED_COLUMNS_FIXED_SUCCESS";
      this.comp.successModalParams = { count: repairResult.repairedCount };
      this.comp.showSuccessModal = true;
    }

    this.comp.pendingImportStacked = null;
    this.comp.showImportStackedConfirm = false;
    this.comp.cdr?.markForCheck();
  }

  public cancelRepairImportedLayout(importAsIs = false): void {
    if (!this.comp.pendingImportStacked) return;
    const { rawJson, ui, onSuccess } = this.comp.pendingImportStacked;
    this.comp.pendingImportStacked = null;
    this.comp.showImportStackedConfirm = false;

    if (importAsIs) {
      applyImportLayout(rawJson, ui, this.comp.editingSettings);
      this.clearCache();
      onSuccess();
    }
    this.comp.cdr?.markForCheck();
  }
}
