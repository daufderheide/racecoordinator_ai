import { OutputEmitterRef } from "@angular/core";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";

import {
  hasSideInsets,
  resolveInsetAlignItems,
  resolveInsetHorizontalAlignment,
  resolveInsetJustifyContent,
  resolveInsetObjectPosition,
  resolveInsetVerticalAlignment,
} from "./raceday-lane-column.utils";
import {
  deleteLaneColumnAnchor,
  dispatchLaneColumnAnchorSelection,
  handleLaneColumnAnchorDragEnter,
  handleLaneColumnAnchorDragLeave,
  handleLaneColumnAnchorDragOver,
  handleLaneColumnAnchorDrop,
  setLaneColumnInset,
} from "./raceday-lane-column-interaction.helper";

export class LaneColumnAnchorHelper {
  constructor(
    private getWidget: () => AbsoluteWidgetNode | null,
    private getParent: () => any,
    private getSettings: () => LaneColumnWidgetSettings,
    private getSelectedAnchor: () => string | null | undefined,
    private anchorSelected: OutputEmitterRef<{
      widgetId: string;
      anchor: string | null;
    }>,
    private onNotifyChange: () => void,
  ) {}

  get isUIEditorMode(): boolean {
    const p = this.getParent();
    if (!p) return false;
    const inEditor =
      typeof p.isUIEditorMode === "function"
        ? p.isUIEditorMode()
        : Boolean(p.isUIEditorMode);
    return inEditor || Boolean(p.isLayoutCustomizing);
  }

  get isGridCellUnselected(): boolean {
    const gridId = this.getWidget()?.customSettings?.["gridId"];
    if (!gridId) return false;
    const parent = this.getParent();
    const session =
      typeof parent?.gridSession === "function" ? parent.gridSession() : null;
    return !session || session.gridId !== gridId;
  }

  get isWidgetInGrid(): boolean {
    return Boolean(this.getWidget()?.customSettings?.["gridId"]);
  }

  get isSelectedWidget(): boolean {
    const p = this.getParent();
    if (!p) return false;
    const selId =
      typeof p.selectedWidgetId === "function"
        ? p.selectedWidgetId()
        : p.selectedWidgetId;
    return Boolean(selId && selId === this.getWidget()?.id);
  }

  get shouldRenderAnchorDropGrid(): boolean {
    if (!this.isUIEditorMode || this.isGridCellUnselected) {
      return false;
    }
    if (!this.isWidgetInGrid) {
      return true;
    }
    const parent = this.getParent();
    if (parent?.draggedWidgetType) {
      return true;
    }
    const selId =
      typeof parent?.selectedWidgetId === "function"
        ? parent.selectedWidgetId()
        : parent?.selectedWidgetId;
    if (!selId) {
      return true;
    }
    return this.isSelectedWidget;
  }

  get effectiveSelectedAnchor(): string | null {
    const explicit = this.getSelectedAnchor();
    if (explicit !== null && explicit !== undefined) {
      return explicit;
    }
    const p = this.getParent();
    if (p) {
      const pSelWidget =
        typeof p.selectedWidgetId === "function"
          ? p.selectedWidgetId()
          : p.selectedWidgetId;
      if (pSelWidget === this.getWidget()?.id) {
        return typeof p.selectedAnchor === "function"
          ? p.selectedAnchor()
          : (p.selectedAnchor ?? null);
      }
    }
    return null;
  }

  isAnchorSelected(anchor: string): boolean {
    return this.effectiveSelectedAnchor === anchor;
  }

  onAnchorClick(anchor: string, event: MouseEvent): void {
    if (!this.isUIEditorMode) return;
    event.stopPropagation();
    dispatchLaneColumnAnchorSelection(
      this.getParent(),
      this.getWidget()?.id,
      anchor,
      this.anchorSelected,
    );
  }

  onCenterZoneClick(event: MouseEvent): void {
    if (!this.isUIEditorMode) return;
    event.stopPropagation();
    dispatchLaneColumnAnchorSelection(
      this.getParent(),
      this.getWidget()?.id,
      null,
      this.anchorSelected,
    );
  }

  hasAnchorValue(anchor: string, columnKey: string): boolean {
    if (anchor === "center-center") {
      return Boolean(columnKey);
    }
    return Boolean(this.getSettings().insets?.[anchor]);
  }

  onAnchorDragOver(event: DragEvent): void {
    handleLaneColumnAnchorDragOver(
      event,
      this.isUIEditorMode,
      this.isGridCellUnselected,
    );
  }

  onAnchorDragEnter(event: DragEvent): void {
    handleLaneColumnAnchorDragEnter(
      event,
      this.isUIEditorMode,
      this.isGridCellUnselected,
    );
  }

  onAnchorDragLeave(event: DragEvent): void {
    handleLaneColumnAnchorDragLeave(event, this.isUIEditorMode);
  }

  onAnchorDrop(event: DragEvent, anchor: string): void {
    const droppedKey = handleLaneColumnAnchorDrop(
      event,
      anchor,
      this.isUIEditorMode,
      this.isGridCellUnselected,
      this.getParent(),
    );
    if (droppedKey) {
      this.setInset(anchor, droppedKey);
    }
  }

  setInset(anchor: string, key: string): void {
    setLaneColumnInset(this.getWidget(), anchor, key);
    this.onNotifyChange();
  }

  deleteAnchor(anchor: string, event?: Event): void {
    if (this.isGridCellUnselected) return;
    if (event) {
      event.stopPropagation();
    }
    deleteLaneColumnAnchor(
      this.getWidget(),
      anchor,
      this.getParent(),
      this.getSelectedAnchor() ?? null,
      this.anchorSelected,
    );
    this.onNotifyChange();
  }

  hasInset(anchor: string, isBlankRow: boolean): boolean {
    if (isBlankRow) return false;
    return Boolean(this.getSettings().insets?.[anchor]);
  }

  hasSideInsets(
    side: "top" | "bottom" | "left" | "right",
    isBlankRow: boolean,
  ): boolean {
    return hasSideInsets(this.getSettings().insets, side, isBlankRow);
  }

  getInsetHorizontalAlignment(anchor: string): "left" | "center" | "right" {
    return resolveInsetHorizontalAlignment(this.getSettings(), anchor);
  }

  getInsetVerticalAlignment(anchor: string): "top" | "center" | "bottom" {
    return resolveInsetVerticalAlignment(this.getSettings(), anchor);
  }

  getInsetJustifyContent(anchor: string): string {
    return resolveInsetJustifyContent(this.getSettings(), anchor);
  }

  getInsetAlignItems(anchor: string): string {
    return resolveInsetAlignItems(this.getSettings(), anchor);
  }

  getInsetObjectPosition(anchor: string): string {
    return resolveInsetObjectPosition(this.getSettings(), anchor);
  }

  getInsetFontFamily(anchor: string): string | null {
    const s = this.getSettings();
    return s.insetsConfig?.[anchor]?.fontFamily || s.insetFontFamily || null;
  }
}
