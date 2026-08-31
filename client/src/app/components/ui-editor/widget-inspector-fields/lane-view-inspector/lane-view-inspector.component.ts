import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-lane-view-inspector",
  templateUrl: "./lane-view-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe, DragDropModule],
})
export class LaneViewInspectorComponent {
  settings = input.required<any>();
  widget = input<any>();
  globalSettings = input<Settings>();
  customUi = input<CustomUI>();
  availableColumns = input<{ key: string; label: string }[]>([]);
  isPracticeMode = input<boolean>(false);
  disableFontSizes = input<boolean>(false);
  change = output<void>();
  fontService = inject(FontService);
  private translationService = inject(TranslationService);

  onSettingsChange() {
    this.change.emit();
  }

  onColorChange(field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.settings()) {
      this.settings()[field] = value;
      this.change.emit();
    }
  }

  resetColor(field: string) {
    if (this.settings()) {
      this.settings()[field] = "";
      this.change.emit();
    }
  }

  get currentColumns(): string[] {
    const ui = this.customUi();
    if (ui && ui.columnsJson) {
      try {
        const parsed = JSON.parse(ui.columnsJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const global = this.globalSettings();
    if (!global) return [];
    return this.isPracticeMode()
      ? global.practiceRacedayColumns || []
      : global.racedayColumns || [];
  }

  get unusedColumns(): { key: string; label: string }[] {
    const current = this.currentColumns;
    return this.availableColumns().filter(
      (c) =>
        !current.some(
          (colKey) => colKey === c.key || colKey.split("_").includes(c.key),
        ),
    );
  }

  getColumnLabel(key: string): string {
    if (
      key === "imageset_fuel-gauge-builtin" ||
      key === "imageset_default_fuel-gauge-builtin" ||
      key === "imageset_default_fuel_gauge" ||
      key === "fuel-gauge-builtin" ||
      key === "default_fuel_gauge" ||
      key.toLowerCase() === "default fuel gauge" ||
      key.toLowerCase() === "default fuel guage"
    ) {
      return "RD_COL_FUEL_GAUGE";
    }
    const pacingMap: Record<string, string> = {
      ghostPacing: "RD_COL_GHOST_PACING_LANE_RECORD",
      ghostPacingPB: "RD_COL_GHOST_PACING_PERSONAL_BEST",
      ghostPacingPersonalAvg: "RD_COL_GHOST_PACING_PERSONAL_AVG",
      ghostPacingPersonalMedian: "RD_COL_GHOST_PACING_PERSONAL_MEDIAN",
      ghostPacingLeaderAvg: "RD_COL_GHOST_PACING_LEADER_AVG",
      ghostPacingLeaderMedian: "RD_COL_GHOST_PACING_LEADER_MEDIAN",
      ghostPacingLeaderBest: "RD_COL_GHOST_PACING_LEADER_BEST",
    };
    if (pacingMap[key]) {
      return pacingMap[key];
    }
    const col = this.availableColumns().find((c) => c.key === key);
    if (col) {
      if (
        col.label?.toLowerCase() === "default fuel gauge" ||
        col.label?.toLowerCase() === "default fuel guage"
      ) {
        return "RD_COL_FUEL_GAUGE";
      }
      return col.label;
    }
    return key;
  }

  drop(event: CdkDragDrop<string[]>) {
    const columns = [...this.currentColumns];
    moveItemInArray(columns, event.previousIndex, event.currentIndex);
    this.updateColumns(columns);
  }

  deleteColumn(colKey: string) {
    const columns = this.currentColumns.filter((c) => c !== colKey);
    this.updateColumns(columns);
    const global = this.globalSettings();
    if (global) {
      if (this.isPracticeMode()) {
        if (global.practiceColumnWidths) {
          delete global.practiceColumnWidths[colKey];
        }
      } else {
        if (global.columnWidths) {
          delete global.columnWidths[colKey];
        }
      }
    }
    if (this.widget()?.customSettings?.["columnWidths"]) {
      delete this.widget().customSettings["columnWidths"][colKey];
    }
    const ui = this.customUi();
    if (ui && ui.columnWidthsJson) {
      try {
        const widths = JSON.parse(ui.columnWidthsJson);
        if (widths && widths[colKey] !== undefined) {
          delete widths[colKey];
          ui.columnWidthsJson = JSON.stringify(widths);
        }
      } catch (e) {}
    }
  }

  private updateColumns(columns: string[]) {
    const ui = this.customUi();
    if (ui) {
      ui.columnsJson = JSON.stringify(columns);
    }
    const global = this.globalSettings();
    if (global) {
      if (this.isPracticeMode()) {
        global.practiceRacedayColumns = columns;
      } else {
        global.racedayColumns = columns;
      }
    }
    this.change.emit();
  }

  getColumnWidth(colKey: string): number {
    const widgetWidths = this.widget()?.customSettings?.["columnWidths"];
    if (
      widgetWidths &&
      widgetWidths[colKey] !== undefined &&
      widgetWidths[colKey] !== null
    ) {
      return Number(widgetWidths[colKey]);
    }
    const ui = this.customUi();
    if (ui && ui.columnWidthsJson) {
      try {
        const widthsMap = JSON.parse(ui.columnWidthsJson);
        if (
          widthsMap &&
          widthsMap[colKey] !== undefined &&
          widthsMap[colKey] !== null
        ) {
          return Number(widthsMap[colKey]);
        }
      } catch (e) {}
    }
    const global = this.globalSettings();
    const widthsMap = this.isPracticeMode()
      ? global?.practiceColumnWidths
      : global?.columnWidths;
    if (
      widthsMap &&
      widthsMap[colKey] !== undefined &&
      widthsMap[colKey] !== null
    ) {
      return Number(widthsMap[colKey]);
    }
    return RacedayLayoutUtils.getDefaultColumnWidth(colKey, undefined, {
      isPractice: this.isPracticeMode(),
      isVertical: this.settings()?.isVertical ?? false,
    });
  }

  setColumnWidth(colKey: string, width: any) {
    const parsed =
      width === "" ||
      width === null ||
      width === undefined ||
      isNaN(Number(width))
        ? 0
        : Math.max(0, Math.round(Number(width)));
    const ui = this.customUi();
    if (ui) {
      let widthsMap: any = {};
      if (ui.columnWidthsJson) {
        try {
          widthsMap = JSON.parse(ui.columnWidthsJson) || {};
        } catch (e) {}
      }
      widthsMap[colKey] = parsed;
      ui.columnWidthsJson = JSON.stringify(widthsMap);
    }
    const global = this.globalSettings();
    if (global) {
      if (this.isPracticeMode()) {
        if (!global.practiceColumnWidths) global.practiceColumnWidths = {};
        global.practiceColumnWidths[colKey] = parsed;
      } else {
        if (!global.columnWidths) global.columnWidths = {};
        global.columnWidths[colKey] = parsed;
      }
    }
    const widget = this.widget();
    if (widget) {
      if (!widget.customSettings) widget.customSettings = {};
      if (!widget.customSettings["columnWidths"]) {
        widget.customSettings["columnWidths"] = {};
      }
      widget.customSettings["columnWidths"][colKey] = parsed;
    }
    this.change.emit();
  }

  onDragStart(event: DragEvent, col: { key: string; label: string }) {
    if (event.dataTransfer) {
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          type: "new-column",
          key: col.key,
          label: col.label,
        }),
      );
      event.dataTransfer.effectAllowed = "copy";
    }
  }

  getCustomLabel(colKey: string): string {
    const labels = this.widget()?.customSettings?.["columnLabels"];
    if (labels && labels[colKey] !== undefined) {
      return labels[colKey];
    }
    return this.translationService.translate(this.getColumnLabel(colKey));
  }

  setCustomLabel(colKey: string, label: string) {
    const widget = this.widget();
    if (!widget) return;
    if (!widget.customSettings) widget.customSettings = {};
    if (!widget.customSettings["columnLabels"])
      widget.customSettings["columnLabels"] = {};
    widget.customSettings["columnLabels"][colKey] = label;
    this.change.emit();
  }
}
