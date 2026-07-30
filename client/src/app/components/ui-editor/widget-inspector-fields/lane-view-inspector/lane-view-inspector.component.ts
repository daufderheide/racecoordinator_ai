import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ColumnVisibility, Settings } from "@app/models/settings";
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

  get columnVisibility(): { [key: string]: ColumnVisibility } {
    const global = this.globalSettings();
    if (!global) return {};
    return this.isPracticeMode()
      ? global.practiceColumnVisibility || {}
      : global.columnVisibility || {};
  }

  getColumnLabel(key: string): string {
    const col = this.availableColumns().find((c) => c.key === key);
    return col ? col.label : key;
  }

  drop(event: CdkDragDrop<string[]>) {
    const columns = this.currentColumns;
    moveItemInArray(columns, event.previousIndex, event.currentIndex);
    this.change.emit();
  }

  changeColumnVisibility(colKey: string, visibility: string) {
    const global = this.globalSettings();
    if (!global) return;
    if (this.isPracticeMode()) {
      if (!global.practiceColumnVisibility)
        global.practiceColumnVisibility = {};
      global.practiceColumnVisibility[colKey] = visibility as ColumnVisibility;
    } else {
      if (!global.columnVisibility) global.columnVisibility = {};
      global.columnVisibility[colKey] = visibility as ColumnVisibility;
    }
    this.change.emit();
  }

  deleteColumn(colKey: string) {
    const global = this.globalSettings();
    if (!global) return;
    if (this.isPracticeMode()) {
      global.practiceRacedayColumns = (
        global.practiceRacedayColumns || []
      ).filter((c) => c !== colKey);
    } else {
      global.racedayColumns = (global.racedayColumns || []).filter(
        (c) => c !== colKey,
      );
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
