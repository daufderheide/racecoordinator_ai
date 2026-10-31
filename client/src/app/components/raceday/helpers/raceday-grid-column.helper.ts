import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import {
  GridResizeHandle,
  LaneGridReplicationHelper,
} from "@app/components/raceday/utils/lane-grid-replication.helper";

export class RacedayGridColumnHelper {
  static onColumnDrop(host: any, event: CdkDragDrop<string[]>): void {
    if (!host.isUIEditorMode?.()) return;
    const settings = host.editingSettings?.();
    if (!settings || !host.currentRacedayColumns) return;

    const cols = [...host.currentRacedayColumns];
    moveItemInArray(cols, event.previousIndex, event.currentIndex);
    host.currentRacedayColumns = cols;
    host.loadColumns?.();
    host.cdr?.markForCheck();
    host.columnsChanged?.emit();
  }

  static onColumnDragOver(host: any, event: DragEvent): void {
    if (!host.isUIEditorMode?.() || host.draggedWidgetType) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    (event.currentTarget as HTMLElement)?.classList.add("drag-over");
  }

  static onColumnDragLeave(host: any, event: DragEvent): void {
    if (!host.isUIEditorMode?.() || host.draggedWidgetType) return;
    (event.currentTarget as HTMLElement)?.classList.remove("drag-over");
  }

  static onColumnHeaderDrop(
    host: any,
    event: DragEvent,
    dropColData: ColumnDefinition,
  ): void {
    if (!host.isUIEditorMode?.() || host.draggedWidgetType) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement)?.classList.remove("drag-over");

    if (event.dataTransfer) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            const settings = host.editingSettings?.();
            if (!settings) return;
            let changed = false;

            const cols = [...host.currentRacedayColumns];
            const idx = cols.indexOf(dropColData.propertyName);
            if (!cols.includes(data.key)) {
              if (idx >= 0) {
                cols.splice(idx, 0, data.key);
              } else {
                cols.push(data.key);
              }
              changed = true;
            }

            if (changed) {
              host.currentRacedayColumns = cols;
              host.loadColumns?.();
              host.cdr?.markForCheck();
              host.columnsChanged?.emit();
            }
          }
        }
      } catch (_) {}
    }
  }

  static onColumnHeaderRowDrop(host: any, event: DragEvent): void {
    if (!host.isUIEditorMode?.() || host.draggedWidgetType) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement)?.classList.remove("drag-over");

    if (event.dataTransfer) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            const settings = host.editingSettings?.();
            if (!settings) return;
            let changed = false;

            const cols = [...host.currentRacedayColumns];
            if (!cols.includes(data.key)) {
              cols.push(data.key);
              changed = true;
            }

            if (changed) {
              host.currentRacedayColumns = cols;
              host.loadColumns?.();
              host.cdr?.markForCheck();
              host.columnsChanged?.emit();
            }
          }
        }
      } catch (_) {}
    }
  }

  static deleteColumn(host: any, colData: ColumnDefinition): void {
    if (!host.isUIEditorMode?.()) return;
    const settings = host.editingSettings?.();
    if (!settings) return;

    host.currentRacedayColumns = (host.currentRacedayColumns || []).filter(
      (c: string) => c !== colData.propertyName,
    );
    if (host.currentColumnWidths) {
      delete host.currentColumnWidths[colData.propertyName];
    }
    host.loadColumns?.();
    host.cdr?.markForCheck();
    host.columnsChanged?.emit();
  }

  static canAcceptAnchorDrop(host: any): boolean {
    const isEditing = host.isUIEditorMode?.() || host.isLayoutCustomizing;
    if (!isEditing) return false;
    return (
      !host.draggedWidgetType ||
      host.draggedWidgetType.startsWith("lane-col:") ||
      host.draggedWidgetType.startsWith("custom:")
    );
  }

  static onAnchorDragOver(host: any, event: DragEvent): void {
    if (!RacedayGridColumnHelper.canAcceptAnchorDrop(host)) return;
    event.preventDefault();
    if (event.dataTransfer) {
      const allowed = event.dataTransfer.effectAllowed;
      event.dataTransfer.dropEffect = allowed === "move" ? "move" : "copy";
    }
  }

  static onAnchorDragEnter(host: any, event: DragEvent): void {
    if (!RacedayGridColumnHelper.canAcceptAnchorDrop(host)) return;
    event.preventDefault();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.add(
      "drag-over",
    );
  }

  static onAnchorDragLeave(host: any, event: DragEvent): void {
    if (!RacedayGridColumnHelper.canAcceptAnchorDrop(host)) return;
    ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
      "drag-over",
    );
  }

  static onAnchorDrop(
    host: any,
    event: DragEvent,
    colData: ColumnDefinition,
    anchor: string,
  ): void {
    if (!RacedayGridColumnHelper.canAcceptAnchorDrop(host)) return;
    event.preventDefault();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
      "drag-over",
    );

    const droppedKey = RacedayGridColumnHelper.extractDroppedKey(host, event);
    if (host.draggedWidgetType) {
      host.draggedWidgetType = null;
    }

    if (droppedKey) {
      const settings =
        host.editingSettings?.() || host.settingsService?.getSettings();
      if (!settings) return;
      const layouts = { ...(host.currentColumnLayouts || {}) };
      if (!layouts[colData.propertyName]) {
        layouts[colData.propertyName] = {
          "center-center": colData.propertyName,
        };
      } else {
        layouts[colData.propertyName] = {
          ...layouts[colData.propertyName],
        };
      }
      layouts[colData.propertyName][anchor as AnchorPoint] = droppedKey;
      host.currentColumnLayouts = layouts;
      host.loadColumns?.();
      host.cdr?.markForCheck();
      host.columnsChanged?.emit();
    }
  }

  private static extractDroppedKey(
    host: any,
    event: DragEvent,
  ): string | undefined {
    let droppedKey: string | undefined;
    if (
      event.dataTransfer &&
      typeof event.dataTransfer.getData === "function"
    ) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            droppedKey = data.key;
          } else if (data.key) {
            droppedKey = data.key;
          }
        }
      } catch (_) {}

      if (!droppedKey) {
        const text = event.dataTransfer.getData("text/plain");
        if (text) {
          droppedKey = text.startsWith("lane-col:")
            ? text.substring("lane-col:".length)
            : text;
        }
      }
    }

    if (!droppedKey && host.draggedWidgetType) {
      if (host.draggedWidgetType.startsWith("lane-col:")) {
        droppedKey = host.draggedWidgetType.substring("lane-col:".length);
      } else if (host.draggedWidgetType.startsWith("custom:")) {
        droppedKey = host.draggedWidgetType;
      }
    }
    return droppedKey;
  }

  static deleteAnchor(
    host: any,
    colData: ColumnDefinition,
    anchor: string,
    event: Event,
  ): void {
    if (!host.isUIEditorMode?.()) return;
    event.stopPropagation();
    const settings = host.editingSettings?.();
    if (!settings) return;
    const layouts = { ...(host.currentColumnLayouts || {}) };
    if (layouts[colData.propertyName]) {
      layouts[colData.propertyName] = { ...layouts[colData.propertyName] };
      delete layouts[colData.propertyName][anchor as AnchorPoint];
      host.currentColumnLayouts = layouts;
    }
    host.loadColumns?.();
    host.cdr?.markForCheck();
    host.columnsChanged?.emit();
  }

  static hasAnchorValue(
    host: any,
    colData: ColumnDefinition,
    anchor: string,
  ): boolean {
    const settings = host.editingSettings?.();
    if (
      !settings ||
      !host.currentColumnLayouts ||
      !host.currentColumnLayouts[colData.propertyName]
    ) {
      return false;
    }
    const val =
      host.currentColumnLayouts[colData.propertyName][anchor as AnchorPoint];
    return !!val && val !== "";
  }

  static onGridResizeStart(
    host: any,
    event: PointerEvent,
    handle: GridResizeHandle,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    const session = host.gridSession?.();
    if (!session) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const initialBounds = { ...session.bounds };
    const scale = host.visualScale || 1;
    const baseWidth = host.layout?.baseWidth || 1920;
    const baseHeight = host.layout?.baseHeight || 1080;

    const nonGridWidgets = (host.layout?.widgets || []).filter(
      (w: any) => w.customSettings?.["gridId"] !== session.gridId,
    );
    const snapEdgesX: number[] = [0, baseWidth];
    const snapEdgesY: number[] = [0, baseHeight];
    for (const w of nonGridWidgets) {
      snapEdgesX.push(w.x, w.x + w.width);
      snapEdgesY.push(w.y, w.y + w.height);
    }

    let hasResized = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      const newBounds = LaneGridReplicationHelper.resizeGridBounds(
        initialBounds,
        handle,
        deltaX,
        deltaY,
        baseWidth,
        baseHeight,
        100,
        60,
        snapEdgesX,
        snapEdgesY,
        8,
      );

      hasResized = true;
      host.gridBoundsChange?.emit(newBounds);
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (hasResized && host.layout) {
        host.layoutChanged?.emit(host.layout);
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  static onGridMoveStart(host: any, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const session = host.gridSession?.();
    if (!session) return;
    if (host.bringGridToFront) {
      host.bringGridToFront(session.gridId);
    } else {
      RacedayGridColumnHelper.bringGridToFront(host, session.gridId);
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const initialBounds = { ...session.bounds };
    const scale = host.visualScale || 1;
    const baseWidth = host.layout?.baseWidth || 1920;
    const baseHeight = host.layout?.baseHeight || 1080;

    const nonGridWidgets = (host.layout?.widgets || []).filter(
      (w: any) => w.customSettings?.["gridId"] !== session.gridId,
    );
    const snapEdgesX: number[] = [0, baseWidth];
    const snapEdgesY: number[] = [0, baseHeight];
    for (const w of nonGridWidgets) {
      snapEdgesX.push(w.x, w.x + w.width);
      snapEdgesY.push(w.y, w.y + w.height);
    }

    let hasMoved = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      const newBounds = LaneGridReplicationHelper.moveGridBounds(
        initialBounds,
        deltaX,
        deltaY,
        baseWidth,
        baseHeight,
        snapEdgesX,
        snapEdgesY,
        8,
      );

      hasMoved = true;
      host.gridBoundsChange?.emit(newBounds);
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (hasMoved && host.layout) {
        host.layoutChanged?.emit(host.layout);
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  static onDeleteGridClicked(host: any): void {
    const session = host.gridSession?.();
    if (session) {
      host.deleteGrid?.emit(session.gridId);
    }
  }

  static bringGridToFront(host: any, gridId: string): void {
    if (!host.layout?.widgets || !gridId) return;

    const gridWidgets = host.layout.widgets.filter(
      (w: any) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return;

    const otherNonCountdown = host.layout.widgets.filter(
      (w: any) =>
        w.customSettings?.["gridId"] !== gridId && w.widgetType !== "countdown",
    );
    if (otherNonCountdown.length === 0) return;

    const maxOtherZ = Math.max(
      ...otherNonCountdown.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
    );

    const newBaseZ = maxOtherZ + 1;
    let changed = false;

    const minGridZ = Math.min(
      ...gridWidgets.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
    );
    if (minGridZ <= maxOtherZ) {
      for (const gw of gridWidgets) {
        const relativeOffset = Math.max(
          0,
          (gw.zIndex != null ? gw.zIndex : 100) - minGridZ,
        );
        const targetZ = newBaseZ + relativeOffset;
        if (gw.zIndex !== targetZ) {
          gw.zIndex = targetZ;
          changed = true;
        }
      }
    }

    const maxGridZ = Math.max(
      ...gridWidgets.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
    );
    for (const cw of host.layout.widgets) {
      if (cw.widgetType === "countdown") {
        if (cw.zIndex == null || cw.zIndex <= maxGridZ) {
          cw.zIndex = Math.max(2000, maxGridZ + 100);
          changed = true;
        }
      }
    }

    if (changed) {
      host.layoutChanged?.emit(host.layout);
      host.cdr?.markForCheck();
    }
  }

  static onGridContainerPointerDown(
    host: any,
    event: PointerEvent,
    gridId: string,
  ): void {
    if (!host.isLayoutCustomizing && !host.isUIEditorMode?.()) return;
    if (host.gridSession?.()?.gridId === gridId) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("app-raceday-absolute-widget")) {
      return;
    }

    if (host.bringGridToFront) {
      host.bringGridToFront(gridId);
    } else {
      RacedayGridColumnHelper.bringGridToFront(host, gridId);
    }

    const gridWidgets = (host.layout?.widgets || []).filter(
      (w: any) => w.customSettings?.["gridId"] === gridId,
    );
    const masterWidget =
      gridWidgets.find(
        (w: any) =>
          !w.customSettings?.["gridMasterId"] &&
          !w.customSettings?.["isHeaderWidget"],
      ) || gridWidgets[0];

    if (masterWidget) {
      host.widgetSelected?.emit(masterWidget.id);
    }
  }

  static getGridSessionZIndex(host: any): number {
    const session = host.gridSession?.();
    if (!session || !host.layout?.widgets) return 200;
    const gridWidgets = host.layout.widgets.filter(
      (w: any) => w.customSettings?.["gridId"] === session.gridId,
    );
    const maxZ =
      gridWidgets.length > 0
        ? Math.max(
            ...gridWidgets.map((w: any) => (w.zIndex != null ? w.zIndex : 100)),
          )
        : 100;
    return maxZ + 10;
  }
}
