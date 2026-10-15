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
import {
  formatTimerDisplay,
  TimerDisplayFormat,
  TimerSubsecondMode,
} from "@app/utils/timer-format.utils";

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
export class LaneColumnInspectorComponent {
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
  activeScope = signal<"widget" | "grid" | "column" | "cell" | "inset">("grid");

  constructor() {
    effect(() => {
      const anchor = this.selectedAnchor();
      if (anchor && anchor !== "center-center") {
        this.activeScope.set("inset");
      } else if (anchor === null && this.activeScope() === "inset") {
        this.activeScope.set("column");
      }
    });
  }

  get isCustomWidget(): boolean {
    return this.widget()?.widgetType?.startsWith("custom:") ?? false;
  }

  get customWidgetDefinition(): CustomWidgetDefinition | undefined {
    const type = this.widget()?.widgetType;
    return type && this.customWidgetService
      ? this.customWidgetService.getWidgetDefinition(type)
      : undefined;
  }

  get customWidgetName(): string {
    return (
      this.customWidgetDefinition?.manifest?.name ||
      this.widget()?.widgetType?.replace(/^custom:/, "") ||
      "Custom Widget"
    );
  }

  setScope(scope: "widget" | "grid" | "column" | "cell" | "inset"): void {
    if (scope === "inset") {
      const anchor = this.effectiveSelectedAnchor;
      this.anchorChange.emit(anchor);
    } else if (this.activeScope() === "inset") {
      this.anchorChange.emit(null);
    }
    this.activeScope.set(scope);
  }

  get effectiveSelectedAnchor(): string {
    const sel = this.selectedAnchor();
    if (sel && sel !== "center-center") {
      return sel;
    }
    const placed = this.placedInsetAnchors;
    if (placed.length > 0) {
      return placed[0];
    }
    return "top-right";
  }

  get placedInsetAnchors(): string[] {
    const insets = this.currentSettings["insets"] || {};
    return Object.keys(insets).filter(
      (k) => k !== "center-center" && Boolean(insets[k]),
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
    this.anchorChange.emit(anchor);
    this.activeScope.set("inset");
  }

  configureInset(anchor: string): void {
    this.anchorChange.emit(anchor);
    this.activeScope.set("inset");
  }

  backToColumn(): void {
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
    if (!this.currentSettings["insetsConfig"]) {
      this.currentSettings["insetsConfig"] = {};
    }
    if (!this.currentSettings["insetsConfig"][anchor]) {
      this.currentSettings["insetsConfig"][anchor] = {};
    }
    return this.currentSettings["insetsConfig"][anchor];
  }

  getInsetTimeDisplayFormat(anchor: string): string {
    return this.getInsetConfig(anchor).timeDisplayFormat || "dynamic";
  }

  setInsetTimeDisplayFormat(anchor: string, val: string): void {
    this.getInsetConfig(anchor).timeDisplayFormat = val as TimerDisplayFormat;
    this.onFieldChange();
  }

  getInsetTimeSubsecondMode(anchor: string): string {
    return this.getInsetConfig(anchor).timeSubsecondMode || "never";
  }

  setInsetTimeSubsecondMode(anchor: string, val: string): void {
    this.getInsetConfig(anchor).timeSubsecondMode = val as TimerSubsecondMode;
    this.onFieldChange();
  }

  getInsetTimeSubsecondThreshold(anchor: string): number {
    return this.getInsetConfig(anchor).timeSubsecondThreshold ?? 10;
  }

  setInsetTimeSubsecondThreshold(anchor: string, val: number): void {
    this.getInsetConfig(anchor).timeSubsecondThreshold = Math.max(
      0,
      Number(val) || 0,
    );
    this.onFieldChange();
  }

  getInsetTimeSubsecondDecimals(anchor: string): number {
    return this.getInsetConfig(anchor).timeSubsecondDecimals ?? 2;
  }

  setInsetTimeSubsecondDecimals(anchor: string, val: number): void {
    this.getInsetConfig(anchor).timeSubsecondDecimals = Math.min(
      3,
      Math.max(0, Number(val) || 0),
    );
    this.onFieldChange();
  }

  getInsetTimeDecimalPlaces(anchor: string): number {
    return this.getInsetConfig(anchor).timeDecimalPlaces ?? 3;
  }

  setInsetTimeDecimalPlaces(anchor: string, val: number): void {
    this.getInsetConfig(anchor).timeDecimalPlaces = Math.min(
      3,
      Math.max(0, Number(val) || 0),
    );
    this.onFieldChange();
  }

  getInsetLapDecimalPlaces(anchor: string): number {
    return this.getInsetConfig(anchor).lapDecimalPlaces ?? 2;
  }

  setInsetLapDecimalPlaces(anchor: string, val: number): void {
    this.getInsetConfig(anchor).lapDecimalPlaces = Math.min(
      3,
      Math.max(0, Number(val) || 0),
    );
    this.onFieldChange();
  }

  getInsetDecimalPlaces(anchor: string): number {
    return this.getInsetConfig(anchor).decimalPlaces ?? 2;
  }

  setInsetDecimalPlaces(anchor: string, val: number): void {
    this.getInsetConfig(anchor).decimalPlaces = Math.min(
      3,
      Math.max(0, Number(val) || 0),
    );
    this.onFieldChange();
  }

  getInsetFontFamily(anchor: string): string {
    return (
      this.getInsetConfig(anchor).fontFamily ||
      this.currentSettings["insetFontFamily"] ||
      ""
    );
  }

  setInsetFontFamily(anchor: string, val: string): void {
    this.getInsetConfig(anchor).fontFamily = val;
    this.onFieldChange();
  }

  getInsetFontSize(anchor: string): number {
    return (
      this.getInsetConfig(anchor).fontSize ??
      this.currentSettings["insetFontSize"] ??
      18
    );
  }

  setInsetFontSize(anchor: string, val: number): void {
    this.getInsetConfig(anchor).fontSize = Math.min(
      36,
      Math.max(8, Number(val) || 18),
    );
    this.onFieldChange();
  }

  getInsetTextColor(anchor: string): string {
    return (
      this.getInsetConfig(anchor).textColor ||
      this.currentSettings["insetTextColor"] ||
      "#ffffff"
    );
  }

  setInsetTextColor(anchor: string, val: string): void {
    this.getInsetConfig(anchor).textColor = val;
    this.onFieldChange();
  }

  hasCustomInsetTextColor(anchor: string): boolean {
    return Boolean(this.currentSettings["insetsConfig"]?.[anchor]?.textColor);
  }

  resetInsetCustomColor(anchor: string): void {
    if (this.currentSettings["insetsConfig"]?.[anchor]) {
      delete this.currentSettings["insetsConfig"][anchor].textColor;
    }
    this.onFieldChange();
  }

  getInsetPreview(anchor: string, seconds: number): string {
    const cfg = this.getInsetConfig(anchor);
    return formatTimerDisplay(seconds, {
      format: cfg.timeDisplayFormat || "dynamic",
      subsecondMode: cfg.timeSubsecondMode || "never",
      subsecondThreshold: cfg.timeSubsecondThreshold ?? 10,
      subsecondDecimals: cfg.timeSubsecondDecimals ?? 2,
    });
  }

  isInsetTotalTime(anchor: string): boolean {
    const key = this.getAnchorValue(anchor);
    if (!key) return false;
    const baseKey = key.split("_")[0];
    return baseKey === "totalTime" || baseKey === "overallTotalTime";
  }

  isInsetTimeColumn(anchor: string): boolean {
    const key = this.getAnchorValue(anchor);
    if (!key) return false;
    return (
      RacedayLayoutUtils.isTimeColumnKey(key) && !this.isInsetTotalTime(anchor)
    );
  }

  isInsetLapColumn(anchor: string): boolean {
    const key = this.getAnchorValue(anchor);
    if (!key) return false;
    return RacedayLayoutUtils.isLapColumnKey(key);
  }

  isInsetNumericColumn(anchor: string): boolean {
    const key = this.getAnchorValue(anchor);
    if (!key) return false;
    if (
      this.isInsetTotalTime(anchor) ||
      this.isInsetTimeColumn(anchor) ||
      this.isInsetLapColumn(anchor)
    ) {
      return false;
    }
    return [
      "points",
      "overallPoints",
      "trackCalls",
      "overallTrackCalls",
      "lapsLed",
      "overallLapsLed",
      "speed",
      "topSpeed",
      "averageSpeed",
      "physicalLapCount",
      "overallPhysicalLapCount",
    ].includes(key.split("_")[0]);
  }

  get isMasterCell(): boolean {
    if (this.isHeaderWidget) {
      return false;
    }
    const idx =
      this.currentSettings["gridLane"] != null
        ? this.currentSettings["gridLane"]
        : this.currentSettings["targetIndex"] != null
          ? this.currentSettings["targetIndex"]
          : 0;
    return Number(idx) === 0;
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
    const count =
      this.currentSettings["gridTotalLanes"] || this.totalLanes() || 4;
    const mode = this.currentSettings["bindingMode"];
    if (mode === "position") return `Grid (${count} Pos)`;
    return `Grid (${count} Lanes)`;
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
    if (this.isHeaderWidget) {
      return "Header";
    }
    const mode = this.currentSettings["bindingMode"];
    const idx =
      (this.currentSettings["gridLane"] != null
        ? this.currentSettings["gridLane"]
        : this.currentSettings["targetIndex"] != null
          ? this.currentSettings["targetIndex"]
          : 0) + 1;
    if (mode === "position") return `Pos ${idx}`;
    if (mode === "overallPosition") return `Overall Pos ${idx}`;
    if (mode === "seed") return `Seed ${idx}`;
    return `Lane ${idx}`;
  }

  get availableIndices(): number[] {
    const mode = this.currentSettings["bindingMode"];
    if (mode === "overallPosition" || mode === "seed") {
      const count = Math.max(16, Math.min(64, (this.totalLanes() || 4) * 4));
      return Array.from({ length: count }, (_, i) => i);
    }
    const laneCount = Math.max(8, this.totalLanes() || 8);
    return Array.from({ length: laneCount }, (_, i) => i);
  }

  readonly ANCHOR_POSITIONS = [
    { key: "top-left", labelKey: "UE_ANCHOR_top-left" },
    { key: "top-center", labelKey: "UE_ANCHOR_top-center" },
    { key: "top-right", labelKey: "UE_ANCHOR_top-right" },
    { key: "center-left", labelKey: "UE_ANCHOR_center-left" },
    { key: "center-right", labelKey: "UE_ANCHOR_center-right" },
    { key: "bottom-left", labelKey: "UE_ANCHOR_bottom-left" },
    { key: "bottom-center", labelKey: "UE_ANCHOR_bottom-center" },
    { key: "bottom-right", labelKey: "UE_ANCHOR_bottom-right" },
  ];

  get currentSettings(): any {
    const s = this.settings() || {};
    if (!s["layoutOrientation"]) {
      s["layoutOrientation"] = "vertical";
    }
    if (!s["backgroundColor"]) {
      s["backgroundColor"] = "#000000";
    }
    if (
      !s["textColor"] ||
      (s["textColor"] === "#000000" && s["backgroundColor"] === "#000000")
    ) {
      s["textColor"] = "#ffffff";
    }
    return s;
  }

  get isTotalTimeColumn(): boolean {
    return RacedayLayoutUtils.isTotalTimeColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isTimeColumn(): boolean {
    return RacedayLayoutUtils.isTimeColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isLapColumn(): boolean {
    return RacedayLayoutUtils.isLapColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isImageColumn(): boolean {
    return RacedayLayoutUtils.isImageProperty(
      this.currentSettings["columnKey"] || "",
    );
  }

  get hasAnyInsets(): boolean {
    const insets = this.currentSettings["insets"];
    if (!insets) return false;
    return Object.values(insets).some((v) => Boolean(v));
  }

  get hasTimeInset(): boolean {
    const insets = this.currentSettings["insets"];
    if (!insets) return false;
    return Object.values(insets).some((v) =>
      Boolean(v && RacedayLayoutUtils.isTimeColumnKey(String(v))),
    );
  }

  get hasLapInset(): boolean {
    const insets = this.currentSettings["insets"];
    if (!insets) return false;
    return Object.values(insets).some((v) =>
      Boolean(v && RacedayLayoutUtils.isLapColumnKey(String(v))),
    );
  }

  onFieldChange(): void {
    if (this.currentSettings["timeDecimalPlaces"] !== undefined) {
      this.currentSettings["timeDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["timeDecimalPlaces"])),
      );
    }
    if (this.currentSettings["lapDecimalPlaces"] !== undefined) {
      this.currentSettings["lapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["lapDecimalPlaces"])),
      );
      if (this.isCustomWidget) {
        this.currentSettings["decimalPlaces"] =
          this.currentSettings["lapDecimalPlaces"];
      }
    }
    if (this.currentSettings["decimalPlaces"] !== undefined) {
      this.currentSettings["decimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["decimalPlaces"])),
      );
      if (this.isCustomWidget) {
        this.currentSettings["lapDecimalPlaces"] =
          this.currentSettings["decimalPlaces"];
      }
    }
    if (this.currentSettings["insetTimeDecimalPlaces"] !== undefined) {
      this.currentSettings["insetTimeDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["insetTimeDecimalPlaces"])),
      );
    }
    if (this.currentSettings["insetLapDecimalPlaces"] !== undefined) {
      this.currentSettings["insetLapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["insetLapDecimalPlaces"])),
      );
    }
    if (this.currentSettings["timeSubsecondThreshold"] !== undefined) {
      this.currentSettings["timeSubsecondThreshold"] = Math.max(
        0,
        Number(this.currentSettings["timeSubsecondThreshold"]),
      );
    }
    if (this.currentSettings["timeSubsecondDecimals"] !== undefined) {
      this.currentSettings["timeSubsecondDecimals"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["timeSubsecondDecimals"])),
      );
    }
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
    return this.currentSettings["insets"]?.[anchor] || "";
  }

  setAnchorValue(anchor: string, val: string): void {
    if (!this.currentSettings["insets"]) {
      this.currentSettings["insets"] = {};
    }
    if (!val) {
      delete this.currentSettings["insets"][anchor];
      if (this.currentSettings["insetsConfig"]?.[anchor]) {
        delete this.currentSettings["insetsConfig"][anchor];
      }
    } else {
      this.currentSettings["insets"][anchor] = val;
    }
    this.onFieldChange();
  }

  onColorChange(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentSettings[field] = input.value;
    delete this.currentSettings["_reset_" + field];
    if (field.startsWith("header") && this.linkColumns) {
      this.currentSettings["_syncAction"] = "header";
    }
    this.onFieldChange();
  }

  resetColor(field: string): void {
    delete this.currentSettings[field];
    this.currentSettings["_reset_" + field] = true;
    if (field.startsWith("header") && this.linkColumns) {
      this.currentSettings["_syncAction"] = "header";
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

  get isHeaderWidget(): boolean {
    return Boolean(this.currentSettings["isHeaderWidget"]);
  }

  get gridHeaderPlacement(): "top" | "individual" | "none" {
    return this.currentSettings["headerPlacement"] || "individual";
  }

  get currentGridHeaderHeight(): number {
    return Number(this.currentSettings["headerHeight"]) || 36;
  }

  get gridHeaderFontFamily(): string {
    return this.currentSettings["headerFontFamily"] || "";
  }

  set gridHeaderFontFamily(val: string) {
    this.currentSettings["headerFontFamily"] = val;
    this.onHeaderStyleChange();
  }

  get gridHeaderFontSize(): number {
    return Number(this.currentSettings["headerFontSize"]) || 14;
  }

  set gridHeaderFontSize(val: number) {
    this.currentSettings["headerFontSize"] = Math.max(
      8,
      Math.min(72, Number(val) || 14),
    );
    this.onHeaderStyleChange();
  }

  get gridHeaderTextColor(): string {
    return this.currentSettings["headerTextColor"] || "";
  }

  set gridHeaderTextColor(val: string) {
    this.currentSettings["headerTextColor"] = val;
    delete this.currentSettings["_reset_headerTextColor"];
    this.onHeaderStyleChange();
  }

  get gridHeaderBackgroundColor(): string {
    return this.currentSettings["headerBackgroundColor"] || "";
  }

  set gridHeaderBackgroundColor(val: string) {
    this.currentSettings["headerBackgroundColor"] = val;
    delete this.currentSettings["_reset_headerBackgroundColor"];
    this.onHeaderStyleChange();
  }

  get gridHeaderAlignment(): "start" | "center" | "end" {
    return this.currentSettings["headerAlignment"] || "center";
  }

  set gridHeaderAlignment(val: "start" | "center" | "end") {
    this.currentSettings["headerAlignment"] = val;
    this.onHeaderStyleChange();
  }

  onGridHeaderBgColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.gridHeaderBackgroundColor = input.value;
  }

  onGridHeaderTextColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.gridHeaderTextColor = input.value;
  }

  resetGridHeaderTextColor(): void {
    this.resetColor("headerTextColor");
  }

  resetGridHeaderBackgroundColor(): void {
    this.resetColor("headerBackgroundColor");
  }

  onHeaderStyleChange(): void {
    if (this.linkColumns) {
      this.currentSettings["_syncAction"] = "header";
    }
    this.onFieldChange();
  }

  get highlightRowOnLap(): boolean {
    return this.currentSettings["highlightRowOnLap"] !== false;
  }

  set highlightRowOnLap(val: boolean) {
    this.currentSettings["highlightRowOnLap"] = Boolean(val);
    this.onFieldChange();
  }

  get linkColumns(): boolean {
    return this.currentSettings["linkColumns"] !== false;
  }

  set linkColumns(val: boolean) {
    this.currentSettings["linkColumns"] = Boolean(val);
    this.currentSettings["_linkColumnsChanged"] = true;
    this.onFieldChange();
  }

  get mirrorRows(): boolean {
    return this.currentSettings["mirrorRows"] !== false;
  }

  set mirrorRows(val: boolean) {
    this.currentSettings["mirrorRows"] = Boolean(val);
    this.currentSettings["_mirrorRowsChanged"] = true;
    this.onFieldChange();
  }

  get sortByBindingMode(): boolean {
    return this.currentSettings["sortByBindingMode"] !== false;
  }

  set sortByBindingMode(val: boolean) {
    this.currentSettings["sortByBindingMode"] = Boolean(val);
    this.currentSettings["_sortByBindingModeChanged"] = true;
    this.onFieldChange();
  }

  get gridTotalLanes(): number {
    return Math.max(
      1,
      Math.min(
        32,
        Number(this.currentSettings["gridTotalLanes"]) ||
          this.totalLanes() ||
          4,
      ),
    );
  }

  onGridTotalLanesChange(val: number): void {
    const count = Math.max(1, Math.min(32, Math.round(Number(val) || 1)));
    this.currentSettings["gridTotalLanes"] = count;
    this.currentSettings["_gridTotalLanesChanged"] = true;
    this.onFieldChange();
  }

  get gridDirection(): "horizontal" | "vertical" {
    return this.currentSettings["gridDirection"] === "horizontal"
      ? "horizontal"
      : "vertical";
  }

  get gridLayoutOrientation(): "vertical" | "horizontal" {
    return this.currentSettings["layoutOrientation"] === "horizontal"
      ? "horizontal"
      : "vertical";
  }

  onGridLayoutOrientationChange(val: "vertical" | "horizontal"): void {
    const orientation = val === "horizontal" ? "horizontal" : "vertical";
    this.currentSettings["layoutOrientation"] = orientation;
    this.currentSettings["_layoutOrientationChanged"] = true;
    this.onFieldChange();
  }

  onGridHeaderPlacementChange(placement: "top" | "individual" | "none"): void {
    this.currentSettings["headerPlacement"] = placement;
    this.currentSettings["_headerPlacementChanged"] = true;
    this.onFieldChange();
  }

  onGridHeaderHeightChange(height: number): void {
    this.currentSettings["headerHeight"] = Math.max(
      20,
      Math.min(200, Number(height) || 36),
    );
    this.currentSettings["_headerHeightChanged"] = true;
    this.onFieldChange();
  }

  applyHeaderStyleToAll(): void {
    this.currentSettings["_syncAction"] = "header";
    this.onFieldChange();
  }

  applyValueStyleToAll(): void {
    this.currentSettings["_syncAction"] = "value";
    this.onFieldChange();
  }

  applyBorderStyleToAll(): void {
    this.currentSettings["_syncAction"] = "border";
    this.onFieldChange();
  }

  applyTimeFormatToAll(): void {
    this.currentSettings["_syncAction"] = "time";
    this.onFieldChange();
  }

  get gridLabelPosition(): "none" | "top" | "bottom" | "left" | "right" {
    return this.currentSettings["gridLabelPosition"] || "none";
  }

  onGridLabelPositionChange(
    pos: "none" | "top" | "bottom" | "left" | "right",
  ): void {
    this.currentSettings["gridLabelPosition"] = pos;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelText(): string {
    return this.currentSettings["gridLabelText"] || "";
  }

  set gridLabelText(val: string) {
    this.currentSettings["gridLabelText"] = val;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelSize(): number {
    return Number(this.currentSettings["gridLabelSize"]) || 40;
  }

  set gridLabelSize(val: number) {
    this.currentSettings["gridLabelSize"] = Math.max(
      16,
      Math.min(200, Number(val) || 40),
    );
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelFontFamily(): string {
    return this.currentSettings["gridLabelFontFamily"] || "";
  }

  set gridLabelFontFamily(val: string) {
    this.currentSettings["gridLabelFontFamily"] = val;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelFontSize(): number {
    return Number(this.currentSettings["gridLabelFontSize"]) || 18;
  }

  set gridLabelFontSize(val: number) {
    this.currentSettings["gridLabelFontSize"] = Math.max(
      8,
      Math.min(72, Number(val) || 18),
    );
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelFontBold(): boolean {
    return this.currentSettings["gridLabelFontBold"] !== false;
  }

  set gridLabelFontBold(val: boolean) {
    this.currentSettings["gridLabelFontBold"] = Boolean(val);
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelFontItalic(): boolean {
    return Boolean(this.currentSettings["gridLabelFontItalic"]);
  }

  set gridLabelFontItalic(val: boolean) {
    this.currentSettings["gridLabelFontItalic"] = Boolean(val);
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelAlignment(): "start" | "center" | "end" {
    return this.currentSettings["gridLabelAlignment"] || "center";
  }

  set gridLabelAlignment(val: "start" | "center" | "end") {
    this.currentSettings["gridLabelAlignment"] = val;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelTextColor(): string {
    return this.currentSettings["gridLabelTextColor"] || "#ffffff";
  }

  set gridLabelTextColor(val: string) {
    this.currentSettings["gridLabelTextColor"] = val;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelBackgroundColor(): string {
    return (
      this.currentSettings["gridLabelBackgroundColor"] ||
      "rgba(15, 23, 42, 0.85)"
    );
  }

  set gridLabelBackgroundColor(val: string) {
    this.currentSettings["gridLabelBackgroundColor"] = val;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  onGridLabelBgColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.gridLabelBackgroundColor = input.value;
  }

  onGridLabelTextColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.gridLabelTextColor = input.value;
  }

  resetGridLabelTextColor(): void {
    delete this.currentSettings["gridLabelTextColor"];
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  resetGridLabelBackgroundColor(): void {
    delete this.currentSettings["gridLabelBackgroundColor"];
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelShowBorder(): boolean {
    return this.currentSettings["gridLabelShowBorder"] !== false;
  }

  set gridLabelShowBorder(val: boolean) {
    this.currentSettings["gridLabelShowBorder"] = Boolean(val);
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelBorderColor(): string {
    return (
      this.currentSettings["gridLabelBorderColor"] ||
      this.gridLabelTextColor ||
      "#ffffff"
    );
  }

  set gridLabelBorderColor(val: string) {
    this.currentSettings["gridLabelBorderColor"] = val;
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  onGridLabelBorderColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.gridLabelBorderColor = input.value;
  }

  resetGridLabelBorderColor(): void {
    delete this.currentSettings["gridLabelBorderColor"];
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelBorderWidth(): number {
    return this.currentSettings["gridLabelBorderWidth"] != null
      ? Math.max(
          0,
          Math.min(10, Number(this.currentSettings["gridLabelBorderWidth"])),
        )
      : 1;
  }

  set gridLabelBorderWidth(val: number) {
    this.currentSettings["gridLabelBorderWidth"] = Math.max(
      0,
      Math.min(10, Number(val) || 0),
    );
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  get gridLabelBorderRadius(): number {
    return this.currentSettings["gridLabelBorderRadius"] != null
      ? Math.max(
          0,
          Math.min(32, Number(this.currentSettings["gridLabelBorderRadius"])),
        )
      : 4;
  }

  set gridLabelBorderRadius(val: number) {
    this.currentSettings["gridLabelBorderRadius"] = Math.max(
      0,
      Math.min(32, Number(val) || 0),
    );
    this.currentSettings["_gridLabelChanged"] = true;
    this.onFieldChange();
  }

  onEditGridTemplate(): void {
    if (this.currentSettings["gridId"]) {
      this.editGrid.emit(this.currentSettings["gridId"]);
    }
  }

  onDetachFromGrid(): void {
    if (this.currentSettings["gridId"]) {
      this.detachGrid.emit(this.currentSettings["gridId"]);
    }
  }

  onDeleteGrid(): void {
    if (this.currentSettings["gridId"]) {
      this.deleteGrid.emit(this.currentSettings["gridId"]);
    }
  }

  onReMirrorGrid(): void {
    this.mirrorRows = true;
    if (this.currentSettings["gridId"]) {
      this.reMirrorGrid.emit(this.currentSettings["gridId"]);
    }
  }

  onBringGridToFront(): void {
    if (this.currentSettings["gridId"]) {
      this.bringGridToFront.emit(this.currentSettings["gridId"]);
    }
  }

  openReplicateModal(): void {
    this.showReplicateModal.set(true);
    this.requestReplicate.emit();
  }

  closeReplicateModal(): void {
    this.showReplicateModal.set(false);
  }

  onReplicateConfirm(
    options: Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">,
  ): void {
    this.showReplicateModal.set(false);
    this.replicate.emit(options);
  }
}
