import { CommonModule } from "@angular/common";
import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { GAP_MIGRATION_MAP } from "@app/components/raceday/utils/lane-view-migration.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { CustomWidgetInspectorComponent } from "@app/components/ui-editor/widget-inspector-fields/custom-widget-inspector/custom-widget-inspector.component";
import { CustomWidgetDefinition } from "@app/models/custom-widget.model";
import { AbsoluteWidgetNode, InsetConfig } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

import { LaneColumnGridHelper } from "./lane-column-grid.helper";
import {
  INSET_ANCHOR_POSITIONS,
  LaneColumnInsetHelper,
} from "./lane-column-inset.helper";
import { LaneColumnInspectorGridBase } from "./lane-column-inspector-grid.base";

@Component({
  standalone: true,
  selector: "app-lane-column-inspector",
  templateUrl: "./lane-column-inspector.component.html",
  styleUrls: [
    "../../ui-editor.component.css",
    "./lane-column-inspector.component.css",
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomWidgetInspectorComponent,
  ],
})
export class LaneColumnInspectorComponent extends LaneColumnInspectorGridBase {
  settings = input.required<any>();
  widget = input<AbsoluteWidgetNode>();
  availableColumns = input<{ key: string; label: string }[]>([]);
  disableFontSizes = input<boolean>(false);
  totalLanes = input<number>(4);
  selectedAnchor = input<string | null>(null);
  anchorChange = output<string | null>();

  change = output<void>();
  requestReplicate = output<void>();
  replicate =
    output<Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">>();
  editGrid = output<string>();
  detachGrid = output<string>();
  deleteGrid = output<string>();
  reMirrorGrid = output<string>();
  bringGridToFront = output<string>();

  fontService = inject(FontService);
  translationService = inject(TranslationService);
  customWidgetService = inject(CustomWidgetService, { optional: true });
  showReplicateModal = signal<boolean>(false);
  activeScope = signal<"widget" | "grid" | "column" | "inset">("grid");
  activeInspectorAnchor = signal<string | null>(null);
  private previousWidgetId: string | null = null;

  constructor() {
    super();
    effect(() => {
      const currentWidgetId = this.widget()?.id ?? null;
      if (
        this.previousWidgetId !== null &&
        this.previousWidgetId !== currentWidgetId
      ) {
        this.activeInspectorAnchor.set(null);
        if (this.activeScope() === "inset") {
          this.activeScope.set("column");
        }
      }
      this.previousWidgetId = currentWidgetId;

      const anchor = this.selectedAnchor();
      if (anchor && anchor !== "center-center") {
        this.activeInspectorAnchor.set(anchor);
        this.activeScope.set("inset");
      } else if (anchor === null || anchor === "center-center") {
        this.activeInspectorAnchor.set(null);
        if (this.activeScope() === "inset") {
          this.activeScope.set("column");
        }
      }
    });
  }

  get isCustomWidget(): boolean {
    const type = this.widget()?.widgetType;
    const colKey = this.currentSettings["columnKey"];
    return Boolean(
      (type && type.startsWith("custom:")) ||
      (colKey && colKey.startsWith("custom:")),
    );
  }

  get customWidgetDefinition(): CustomWidgetDefinition | undefined {
    const colKey = this.currentSettings["columnKey"];
    const type =
      colKey && colKey.startsWith("custom:")
        ? colKey
        : this.widget()?.widgetType;
    return type && this.customWidgetService
      ? this.customWidgetService.getWidgetDefinition(type)
      : undefined;
  }

  get customWidgetName(): string {
    const colKey = this.currentSettings["columnKey"];
    const type =
      colKey && colKey.startsWith("custom:")
        ? colKey
        : this.widget()?.widgetType;
    return (
      this.customWidgetDefinition?.manifest?.name ||
      type?.replace(/^custom:/, "") ||
      "Custom Widget"
    );
  }

  get allAvailableColumns(): { key: string; label: string }[] {
    const base = [...this.availableColumns()];
    if (
      this.customWidgetService &&
      typeof this.customWidgetService.getCustomWidgets === "function"
    ) {
      const customWidgets = this.customWidgetService.getCustomWidgets() || [];
      for (const cw of customWidgets) {
        const key = `custom:${cw.manifest.id}`;
        if (!base.some((b) => b.key === key)) {
          base.push({
            key,
            label: cw.manifest?.name || cw.manifest?.id || key,
          });
        }
      }
    }
    return base;
  }

  isCustomWidgetKey(key?: string): boolean {
    return LaneColumnInsetHelper.isCustomWidget(key);
  }

  get mainCustomWidgetNode(): AbsoluteWidgetNode {
    const colKey = this.currentSettings["columnKey"];
    const targetType =
      colKey && colKey.startsWith("custom:")
        ? colKey
        : this.widget()?.widgetType || "lane-column";
    if (this.widget()?.widgetType === targetType) {
      return this.widget()!;
    }
    return {
      ...(this.widget() || ({} as AbsoluteWidgetNode)),
      widgetType: targetType as any,
      customSettings: this.currentSettings,
    };
  }

  setScope(scope: "widget" | "grid" | "column" | "inset"): void {
    if (scope === "inset") {
      const anchor = this.effectiveSelectedAnchor;
      this.anchorChange.emit(anchor);
    } else if (this.activeScope() === "inset") {
      this.activeInspectorAnchor.set(null);
      this.anchorChange.emit(null);
    } else if (scope === "column") {
      this.activeInspectorAnchor.set(null);
      this.anchorChange.emit(null);
    }
    this.activeScope.set(scope);
  }

  get selectedMapAnchor(): string {
    return LaneColumnInsetHelper.getSelectedMapAnchor(
      this.activeInspectorAnchor(),
      this.selectedAnchor(),
    );
  }

  get effectiveSelectedAnchor(): string {
    return LaneColumnInsetHelper.getEffectiveSelectedAnchor(
      this.activeInspectorAnchor(),
      this.selectedAnchor(),
      this.currentSettings["insets"],
    );
  }

  get placedInsetAnchors(): string[] {
    return LaneColumnInsetHelper.getPlacedInsetAnchors(
      this.currentSettings["insets"],
    );
  }

  get insetBreadcrumbLabel(): string {
    const anchor = this.effectiveSelectedAnchor;
    const pos = this.ANCHOR_POSITIONS.find((p) => p.key === anchor);
    const posLabel = pos
      ? this.translationService.translate(pos.labelKey)
      : anchor;
    const colKey = this.getAnchorValue(anchor);
    if (!colKey) return `Inset (${posLabel})`;
    const colDef = this.availableColumns().find((c) => c.key === colKey);
    const colName = colDef
      ? this.translationService.translate(colDef.label)
      : colKey;
    return `Inset: ${colName}`;
  }

  selectInsetAnchor(anchor: string): void {
    this.activeInspectorAnchor.set(anchor);
    this.anchorChange.emit(anchor);
    this.activeScope.set("inset");
  }

  configureInset(anchor: string): void {
    this.selectInsetAnchor(anchor);
  }

  selectAnchorFromMap(anchor: string): void {
    if (anchor === "center-center") {
      this.activeInspectorAnchor.set(null);
      this.anchorChange.emit(null);
      this.setScope("column");
      return;
    }
    this.activeInspectorAnchor.set(anchor);
    this.anchorChange.emit(anchor);
  }

  getSelectedAnchorLabel(anchor?: string): string {
    const key = anchor || this.selectedMapAnchor;
    if (key === "center-center") {
      return this.translationService.translate(
        "UE_INSPECTOR_INSET_MAIN_COLUMN",
      );
    }
    const pos = this.ANCHOR_POSITIONS.find((p) => p.key === key);
    return pos ? this.translationService.translate(pos.labelKey) : key;
  }

  onInspectorDragOver(event: DragEvent): void {
    LaneColumnInsetHelper.handleDragOver(event);
  }

  onInspectorDragEnter(event: DragEvent): void {
    LaneColumnInsetHelper.handleDragEnter(event);
  }

  onInspectorDragLeave(event: DragEvent): void {
    LaneColumnInsetHelper.handleDragLeave(event);
  }

  onInspectorDrop(event: DragEvent, anchor: string): void {
    event.preventDefault();
    event.stopPropagation();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
      "drag-over",
    );
    const droppedKey = LaneColumnInsetHelper.extractDroppedWidgetKey(event);
    if (droppedKey) {
      if (anchor !== "center-center") {
        this.activeInspectorAnchor.set(anchor);
      }
      this.setAnchorValue(anchor, droppedKey);
    }
  }

  getInsetCustomWidgetNode(anchor: string): AbsoluteWidgetNode {
    const key = this.getAnchorValue(anchor);
    const config = this.getInsetConfig(anchor);
    return LaneColumnInsetHelper.buildSyntheticInsetCustomWidgetNode(
      this.widget(),
      anchor,
      key,
      config,
    );
  }

  onInsetCustomWidgetChange(
    anchor: string,
    updatedWidget?: AbsoluteWidgetNode,
  ): void {
    if (updatedWidget?.customSettings) {
      const config = this.getInsetConfig(anchor);
      Object.assign(config, updatedWidget.customSettings);
      if (config.decimalPlaces !== undefined) {
        config.lapDecimalPlaces = config.decimalPlaces;
      } else if (config.lapDecimalPlaces !== undefined) {
        config.decimalPlaces = config.lapDecimalPlaces;
      }
    }
    this.onFieldChange();
  }

  getWidgetDisplayName(key: string): string {
    return LaneColumnInsetHelper.getWidgetDisplayName(
      key,
      this.availableColumns(),
      this.customWidgetService,
      this.translationService,
    );
  }

  getWidgetIcon(key: string): string {
    return LaneColumnInsetHelper.getWidgetIcon(key);
  }

  backToColumn(): void {
    this.activeInspectorAnchor.set(null);
    this.anchorChange.emit(null);
    this.activeScope.set("column");
  }

  removeInset(anchor: string): void {
    this.setAnchorValue(anchor, "");
    if (this.currentSettings["insetsConfig"]?.[anchor]) {
      delete this.currentSettings["insetsConfig"][anchor];
    }
    this.onFieldChange();
    this.backToColumn();
  }

  getInsetConfig(anchor: string): InsetConfig {
    return LaneColumnInsetHelper.getOrCreateInsetConfig(
      this.currentSettings,
      anchor,
    );
  }

  getInsetTimeDisplayFormat(anchor: string): string {
    return LaneColumnInsetHelper.getInsetTimeDisplayFormat(
      this.currentSettings,
      anchor,
    );
  }

  setInsetTimeDisplayFormat(anchor: string, val: string): void {
    LaneColumnInsetHelper.setInsetTimeDisplayFormat(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetTimeSubsecondMode(anchor: string): string {
    return LaneColumnInsetHelper.getInsetTimeSubsecondMode(
      this.currentSettings,
      anchor,
    );
  }

  setInsetTimeSubsecondMode(anchor: string, val: string): void {
    LaneColumnInsetHelper.setInsetTimeSubsecondMode(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetTimeSubsecondThreshold(anchor: string): number {
    return LaneColumnInsetHelper.getInsetTimeSubsecondThreshold(
      this.currentSettings,
      anchor,
    );
  }

  setInsetTimeSubsecondThreshold(anchor: string, val: number): void {
    LaneColumnInsetHelper.setInsetTimeSubsecondThreshold(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetTimeSubsecondDecimals(anchor: string): number {
    return LaneColumnInsetHelper.getInsetTimeSubsecondDecimals(
      this.currentSettings,
      anchor,
    );
  }

  setInsetTimeSubsecondDecimals(anchor: string, val: number): void {
    LaneColumnInsetHelper.setInsetTimeSubsecondDecimals(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetTimeDecimalPlaces(anchor: string): number {
    return LaneColumnInsetHelper.getInsetTimeDecimalPlaces(
      this.currentSettings,
      anchor,
    );
  }

  setInsetTimeDecimalPlaces(anchor: string, val: number): void {
    LaneColumnInsetHelper.setInsetTimeDecimalPlaces(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetLapDecimalPlaces(anchor: string): number {
    return LaneColumnInsetHelper.getInsetLapDecimalPlaces(
      this.currentSettings,
      anchor,
    );
  }

  setInsetLapDecimalPlaces(anchor: string, val: number): void {
    LaneColumnInsetHelper.setInsetLapDecimalPlaces(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetDecimalPlaces(anchor: string): number {
    return LaneColumnInsetHelper.getInsetDecimalPlaces(
      this.currentSettings,
      anchor,
    );
  }

  setInsetDecimalPlaces(anchor: string, val: number): void {
    LaneColumnInsetHelper.setInsetDecimalPlaces(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetHorizontalAlignment(anchor: string): "left" | "center" | "right" {
    return LaneColumnInsetHelper.getInsetHorizontalAlignment(
      this.currentSettings,
      anchor,
    );
  }

  setInsetHorizontalAlignment(
    anchor: string,
    val: "left" | "center" | "right",
  ): void {
    LaneColumnInsetHelper.setInsetHorizontalAlignment(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetVerticalAlignment(anchor: string): "top" | "center" | "bottom" {
    return LaneColumnInsetHelper.getInsetVerticalAlignment(
      this.currentSettings,
      anchor,
    );
  }

  setInsetVerticalAlignment(
    anchor: string,
    val: "top" | "center" | "bottom",
  ): void {
    LaneColumnInsetHelper.setInsetVerticalAlignment(
      this.currentSettings,
      anchor,
      val,
    );
    this.onFieldChange();
  }

  getInsetFontFamily(anchor: string): string {
    return LaneColumnInsetHelper.getInsetFontFamily(
      this.currentSettings,
      anchor,
    );
  }

  setInsetFontFamily(anchor: string, val: string): void {
    LaneColumnInsetHelper.setInsetFontFamily(this.currentSettings, anchor, val);
    this.onFieldChange();
  }

  getInsetFontSize(anchor: string): number {
    return LaneColumnInsetHelper.getInsetFontSize(this.currentSettings, anchor);
  }

  setInsetFontSize(anchor: string, val: number): void {
    LaneColumnInsetHelper.setInsetFontSize(this.currentSettings, anchor, val);
    this.onFieldChange();
  }

  getInsetTextColor(anchor: string): string {
    return LaneColumnInsetHelper.getInsetTextColor(
      this.currentSettings,
      anchor,
    );
  }

  setInsetTextColor(anchor: string, val: string): void {
    LaneColumnInsetHelper.setInsetTextColor(this.currentSettings, anchor, val);
    this.onFieldChange();
  }

  hasCustomInsetTextColor(anchor: string): boolean {
    return LaneColumnInsetHelper.hasCustomInsetTextColor(
      this.currentSettings,
      anchor,
    );
  }

  resetInsetCustomColor(anchor: string): void {
    LaneColumnInsetHelper.resetInsetCustomColor(
      this.currentSettings,
      anchor,
      () => this.onFieldChange(),
    );
  }

  getInsetPreview(anchor: string, seconds: number): string {
    return LaneColumnInsetHelper.getInsetPreview(
      this.currentSettings,
      anchor,
      seconds,
    );
  }

  isInsetTotalTime(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetTotalTime(this.getAnchorValue(anchor));
  }

  isInsetGapColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetGapColumn(this.getAnchorValue(anchor));
  }

  getInsetGapTarget(anchor: string): "leader" | "position" {
    return LaneColumnInsetHelper.getInsetGapTarget(
      this.currentSettings,
      anchor,
    );
  }

  setInsetGapTarget(anchor: string, val: "leader" | "position"): void {
    LaneColumnInsetHelper.setInsetGapTarget(this.currentSettings, anchor, val);
    this.onFieldChange();
  }

  getInsetGapMode(
    anchor: string,
  ): "always_time" | "laps_and_time" | "always_laps" {
    return LaneColumnInsetHelper.getInsetGapMode(this.currentSettings, anchor);
  }

  setInsetGapMode(
    anchor: string,
    val: "always_time" | "laps_and_time" | "always_laps",
  ): void {
    LaneColumnInsetHelper.setInsetGapMode(this.currentSettings, anchor, val);
    this.onFieldChange();
  }

  isInsetTimeColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetTimeColumn(
      this.getAnchorValue(anchor),
      this.currentSettings,
      anchor,
    );
  }

  isInsetLapColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetLapColumn(
      this.getAnchorValue(anchor),
      this.currentSettings,
      anchor,
    );
  }

  isInsetNumericColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetNumericColumn(
      this.getAnchorValue(anchor),
    );
  }

  isInsetHeatsCount(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetHeatsCountColumn(
      this.getAnchorValue(anchor),
    );
  }

  getInsetHeatsDisplayMode(anchor: string): "raced" | "remaining" {
    return LaneColumnInsetHelper.getInsetHeatsDisplayMode(
      this.currentSettings,
      anchor,
    );
  }

  setInsetHeatsDisplayMode(anchor: string, mode: "raced" | "remaining"): void {
    LaneColumnInsetHelper.setInsetHeatsDisplayMode(
      this.currentSettings,
      anchor,
      mode,
    );
    this.onFieldChange();
  }

  get isMasterCell(): boolean {
    return LaneColumnGridHelper.isMasterCell(
      this.currentSettings,
      this.isHeaderWidget,
    );
  }

  get widgetBreadcrumbLabel(): string {
    if (this.isCustomWidget) {
      return this.customWidgetName;
    }
    const colKey = this.currentSettings["columnKey"];
    const col = this.availableColumns().find((c) => c.key === colKey);
    const raw =
      col?.label ||
      (colKey ? RacedayLayoutUtils.COLUMN_LABELS[colKey] : undefined) ||
      colKey ||
      "Widget";
    return this.translationService.translate(raw);
  }

  get gridBreadcrumbLabel(): string {
    return LaneColumnGridHelper.getGridBreadcrumbLabel(
      this.currentSettings,
      this.totalLanes(),
    );
  }

  get columnBreadcrumbLabel(): string {
    if (this.currentSettings["customLabel"]) {
      return this.currentSettings["customLabel"];
    }
    const colKey = this.currentSettings["columnKey"];
    const col = this.availableColumns().find((c) => c.key === colKey);
    const raw =
      col?.label ||
      (colKey ? RacedayLayoutUtils.COLUMN_LABELS[colKey] : undefined) ||
      colKey ||
      (this.isCustomWidget ? this.customWidgetName : undefined) ||
      "Column";
    return this.translationService.translate(raw);
  }

  get cellBreadcrumbLabel(): string {
    return LaneColumnGridHelper.getCellBreadcrumbLabel(
      this.currentSettings,
      this.isHeaderWidget,
    );
  }

  get availableIndices(): number[] {
    return LaneColumnGridHelper.getAvailableIndices(
      this.currentSettings,
      this.totalLanes(),
    );
  }

  readonly ANCHOR_POSITIONS = INSET_ANCHOR_POSITIONS;

  get currentSettings(): any {
    return LaneColumnInsetHelper.normalizeSettings(this.settings());
  }

  get isTotalTimeColumn(): boolean {
    return RacedayLayoutUtils.isTotalTimeColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isGapColumn(): boolean {
    const key = this.currentSettings["columnKey"] || "";
    return (
      key === "gap" || key === "overallGap" || Boolean(GAP_MIGRATION_MAP[key])
    );
  }

  get gapTarget(): "leader" | "position" {
    if (this.currentSettings["gapTarget"]) {
      return this.currentSettings["gapTarget"] as "leader" | "position";
    }
    const key = this.currentSettings["columnKey"];
    if (key && GAP_MIGRATION_MAP[key]) {
      return GAP_MIGRATION_MAP[key].gapTarget;
    }
    return "leader";
  }

  set gapTarget(value: "leader" | "position") {
    this.currentSettings["gapTarget"] = value;
    this.onFieldChange();
  }

  get gapMode(): "always_time" | "laps_and_time" | "always_laps" {
    if (this.currentSettings["gapMode"]) {
      return this.currentSettings["gapMode"] as
        | "always_time"
        | "laps_and_time"
        | "always_laps";
    }
    const key = this.currentSettings["columnKey"];
    if (key && GAP_MIGRATION_MAP[key]) {
      return GAP_MIGRATION_MAP[key].gapMode;
    }
    return "always_time";
  }

  set gapMode(value: "always_time" | "laps_and_time" | "always_laps") {
    this.currentSettings["gapMode"] = value;
    this.onFieldChange();
  }

  get isTimeColumn(): boolean {
    if (this.isGapColumn) {
      return this.gapMode !== "always_laps";
    }
    return RacedayLayoutUtils.isTimeColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isLapColumn(): boolean {
    if (this.isGapColumn) {
      return this.gapMode === "always_laps";
    }
    return RacedayLayoutUtils.isLapColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isHeatsCountColumn(): boolean {
    const key = this.currentSettings["columnKey"] || "";
    return key === "heatsRaced" || key === "heatsRemaining";
  }

  get isImageColumn(): boolean {
    return RacedayLayoutUtils.isImageProperty(
      this.currentSettings["columnKey"] || "",
    );
  }

  get hasAnyInsets(): boolean {
    const insets = this.currentSettings["insets"];
    return Boolean(insets && Object.values(insets).some(Boolean));
  }

  get hasTimeInset(): boolean {
    const insets = this.currentSettings["insets"];
    if (!insets) return false;
    return Object.entries(insets).some(([anchor, v]) => {
      const val = String(v || "");
      if (LaneColumnInsetHelper.isInsetGapColumn(val)) {
        return (
          LaneColumnInsetHelper.getInsetGapMode(
            this.currentSettings,
            anchor,
          ) !== "always_laps"
        );
      }
      return RacedayLayoutUtils.isTimeColumnKey(val);
    });
  }

  get hasLapInset(): boolean {
    const insets = this.currentSettings["insets"];
    if (!insets) return false;
    return Object.entries(insets).some(([anchor, v]) => {
      const val = String(v || "");
      if (LaneColumnInsetHelper.isInsetGapColumn(val)) {
        return (
          LaneColumnInsetHelper.getInsetGapMode(
            this.currentSettings,
            anchor,
          ) === "always_laps"
        );
      }
      return RacedayLayoutUtils.isLapColumnKey(val);
    });
  }

  onFieldChange(): void {
    LaneColumnInsetHelper.sanitizeSettings(
      this.currentSettings,
      this.isCustomWidget,
    );
    this.change.emit();
  }

  onUseLaneColorsChange(): void {
    if (!this.currentSettings["useLaneColors"]) {
      if (!this.currentSettings["backgroundColor"]) {
        this.currentSettings["backgroundColor"] = "#000000";
      }
      if (
        !this.currentSettings["textColor"] ||
        (this.currentSettings["textColor"] === "#000000" &&
          this.currentSettings["backgroundColor"] === "#000000")
      ) {
        this.currentSettings["textColor"] = "#ffffff";
      }
    }
    this.onFieldChange();
  }

  onCustomWidgetChange(updatedWidget?: AbsoluteWidgetNode): void {
    if (updatedWidget?.customSettings) {
      Object.assign(this.currentSettings, updatedWidget.customSettings);
      if (this.currentSettings["decimalPlaces"] !== undefined) {
        this.currentSettings["lapDecimalPlaces"] =
          this.currentSettings["decimalPlaces"];
      }
    }
    this.onFieldChange();
  }

  getPreview(seconds: number): string {
    return formatTimerDisplay(seconds, {
      format: this.currentSettings["timeDisplayFormat"] || "dynamic",
      subsecondMode: this.currentSettings["timeSubsecondMode"] || "never",
      subsecondThreshold: this.currentSettings["timeSubsecondThreshold"] ?? 10,
      subsecondDecimals: this.currentSettings["timeSubsecondDecimals"] ?? 2,
    });
  }

  getAnchorValue(anchor: string): string {
    return LaneColumnInsetHelper.getAnchorValue(
      this.currentSettings,
      this.widget(),
      anchor,
    );
  }

  setAnchorValue(anchor: string, val: string): void {
    LaneColumnInsetHelper.setAnchorValue(
      this.currentSettings,
      anchor,
      val,
      () => this.onFieldChange(),
    );
  }

  onColorChange(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentSettings[field] = input.value;
    delete this.currentSettings["_reset_" + field];
    if (field.startsWith("header")) {
      this.currentSettings["_syncAction"] = "header";
    }
    this.onFieldChange();
  }

  resetColor(field: string): void {
    delete this.currentSettings[field];
    this.currentSettings["_reset_" + field] = true;
    if (field.startsWith("header")) {
      this.currentSettings["_syncAction"] = "header";
    } else {
      this.currentSettings["_syncAction"] = "value";
    }
    this.onFieldChange();
  }

  resetHeaderTextColor(): void {
    this.resetColor("headerTextColor");
  }

  resetHeaderBackgroundColor(): void {
    this.resetColor("headerBackgroundColor");
  }

  resetInsetTextColor(): void {
    this.resetColor("insetTextColor");
  }
}
