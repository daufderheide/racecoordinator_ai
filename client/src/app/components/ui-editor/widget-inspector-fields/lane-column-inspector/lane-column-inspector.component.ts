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
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

import { LaneColumnGridHelper } from "./lane-column-grid.helper";
import {
  INSET_ANCHOR_POSITIONS,
  LaneColumnInsetHelper,
} from "./lane-column-inset.helper";

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
  activeScope = signal<"widget" | "grid" | "column" | "inset">("grid");
  activeInspectorAnchor = signal<string | null>(null);

  constructor() {
    effect(() => {
      const anchor = this.selectedAnchor();
      if (anchor && anchor !== "center-center") {
        this.activeInspectorAnchor.set(anchor);
        this.activeScope.set("inset");
      } else if (anchor === null && this.activeScope() === "inset") {
        this.activeScope.set("column");
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
      this.anchorChange.emit(null);
    }
    this.activeScope.set(scope);
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
      this.setScope("column");
      return;
    }
    this.activeInspectorAnchor.set(anchor);
    this.anchorChange.emit(anchor);
  }

  getSelectedAnchorLabel(anchor?: string): string {
    const key = anchor || this.effectiveSelectedAnchor;
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

  isInsetTimeColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetTimeColumn(this.getAnchorValue(anchor));
  }

  isInsetLapColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetLapColumn(this.getAnchorValue(anchor));
  }

  isInsetNumericColumn(anchor: string): boolean {
    return LaneColumnInsetHelper.isInsetNumericColumn(
      this.getAnchorValue(anchor),
    );
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
    return Boolean(insets && Object.values(insets).some(Boolean));
  }

  get hasTimeInset(): boolean {
    const insets = this.currentSettings["insets"];
    return Boolean(
      insets &&
      Object.values(insets).some((v) =>
        RacedayLayoutUtils.isTimeColumnKey(String(v || "")),
      ),
    );
  }

  get hasLapInset(): boolean {
    const insets = this.currentSettings["insets"];
    return Boolean(
      insets &&
      Object.values(insets).some((v) =>
        RacedayLayoutUtils.isLapColumnKey(String(v || "")),
      ),
    );
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
    return LaneColumnGridHelper.getGridHeaderPlacement(this.currentSettings);
  }

  get currentGridHeaderHeight(): number {
    return LaneColumnGridHelper.getGridHeaderHeight(this.currentSettings);
  }

  get gridHeaderFontFamily(): string {
    return LaneColumnGridHelper.getGridHeaderFontFamily(this.currentSettings);
  }
  set gridHeaderFontFamily(val: string) {
    LaneColumnGridHelper.setGridHeaderFontFamily(
      this.currentSettings,
      val,
      () => this.onHeaderStyleChange(),
    );
  }

  get gridHeaderFontSize(): number {
    return LaneColumnGridHelper.getGridHeaderFontSize(this.currentSettings);
  }
  set gridHeaderFontSize(val: number) {
    LaneColumnGridHelper.setGridHeaderFontSize(this.currentSettings, val, () =>
      this.onHeaderStyleChange(),
    );
  }

  get gridHeaderTextColor(): string {
    return LaneColumnGridHelper.getGridHeaderTextColor(this.currentSettings);
  }
  set gridHeaderTextColor(val: string) {
    LaneColumnGridHelper.setGridHeaderTextColor(this.currentSettings, val, () =>
      this.onHeaderStyleChange(),
    );
  }

  get gridHeaderBackgroundColor(): string {
    return LaneColumnGridHelper.getGridHeaderBackgroundColor(
      this.currentSettings,
    );
  }
  set gridHeaderBackgroundColor(val: string) {
    LaneColumnGridHelper.setGridHeaderBackgroundColor(
      this.currentSettings,
      val,
      () => this.onHeaderStyleChange(),
    );
  }

  get gridHeaderAlignment(): "start" | "center" | "end" {
    return LaneColumnGridHelper.getGridHeaderAlignment(this.currentSettings);
  }
  set gridHeaderAlignment(val: "start" | "center" | "end") {
    LaneColumnGridHelper.setGridHeaderAlignment(this.currentSettings, val, () =>
      this.onHeaderStyleChange(),
    );
  }

  onGridHeaderBgColorChange(event: Event): void {
    this.gridHeaderBackgroundColor = (event.target as HTMLInputElement).value;
  }
  onGridHeaderTextColorChange(event: Event): void {
    this.gridHeaderTextColor = (event.target as HTMLInputElement).value;
  }
  resetGridHeaderTextColor(): void {
    this.resetHeaderTextColor();
  }
  resetGridHeaderBackgroundColor(): void {
    this.resetHeaderBackgroundColor();
  }

  onHeaderStyleChange(): void {
    if (this.linkColumns) {
      this.currentSettings["_syncAction"] = "header";
    }
    this.onFieldChange();
  }

  get highlightRowOnLap(): boolean {
    return LaneColumnGridHelper.getHighlightRowOnLap(this.currentSettings);
  }
  set highlightRowOnLap(val: boolean) {
    LaneColumnGridHelper.setHighlightRowOnLap(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get linkColumns(): boolean {
    return LaneColumnGridHelper.getLinkColumns(this.currentSettings);
  }
  set linkColumns(val: boolean) {
    LaneColumnGridHelper.setLinkColumns(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get mirrorRows(): boolean {
    return LaneColumnGridHelper.getMirrorRows(this.currentSettings);
  }
  set mirrorRows(val: boolean) {
    LaneColumnGridHelper.setMirrorRows(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridType(): "heat" | "overall" {
    return LaneColumnGridHelper.getGridType(this.currentSettings);
  }
  set gridType(val: "heat" | "overall") {
    LaneColumnGridHelper.setGridType(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridSortOrder(): "lane" | "position" | "overallPosition" | "seed" {
    return LaneColumnGridHelper.getGridSortOrder(this.currentSettings);
  }
  set gridSortOrder(val: "lane" | "position" | "overallPosition" | "seed") {
    LaneColumnGridHelper.setGridSortOrder(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get sortByBindingMode(): boolean {
    return LaneColumnGridHelper.getSortByBindingMode(this.currentSettings);
  }
  set sortByBindingMode(val: boolean) {
    LaneColumnGridHelper.setSortByBindingMode(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridTotalLanes(): number {
    return LaneColumnGridHelper.getGridTotalLanes(
      this.currentSettings,
      this.totalLanes(),
    );
  }

  onGridTotalLanesChange(val: number): void {
    LaneColumnGridHelper.setGridTotalLanes(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridDirection(): "horizontal" | "vertical" {
    return LaneColumnGridHelper.getGridDirection(this.currentSettings);
  }

  get gridLayoutOrientation(): "vertical" | "horizontal" {
    return LaneColumnGridHelper.getGridLayoutOrientation(this.currentSettings);
  }

  onGridLayoutOrientationChange(val: "vertical" | "horizontal"): void {
    LaneColumnGridHelper.setGridLayoutOrientation(
      this.currentSettings,
      val,
      () => this.onFieldChange(),
    );
  }

  onGridHeaderPlacementChange(placement: "top" | "individual" | "none"): void {
    LaneColumnGridHelper.setGridHeaderPlacement(
      this.currentSettings,
      placement,
      () => this.onFieldChange(),
    );
  }

  onGridHeaderHeightChange(height: number): void {
    LaneColumnGridHelper.setGridHeaderHeight(this.currentSettings, height, () =>
      this.onFieldChange(),
    );
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
    return LaneColumnGridHelper.getGridLabelPosition(this.currentSettings);
  }

  onGridLabelPositionChange(
    pos: "none" | "top" | "bottom" | "left" | "right",
  ): void {
    LaneColumnGridHelper.setGridLabelPosition(this.currentSettings, pos, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelText(): string {
    return LaneColumnGridHelper.getGridLabelText(this.currentSettings);
  }
  set gridLabelText(val: string) {
    LaneColumnGridHelper.setGridLabelText(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelSize(): number {
    return LaneColumnGridHelper.getGridLabelSize(this.currentSettings);
  }
  set gridLabelSize(val: number) {
    LaneColumnGridHelper.setGridLabelSize(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelFontFamily(): string {
    return LaneColumnGridHelper.getGridLabelFontFamily(this.currentSettings);
  }
  set gridLabelFontFamily(val: string) {
    LaneColumnGridHelper.setGridLabelFontFamily(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelFontSize(): number {
    return LaneColumnGridHelper.getGridLabelFontSize(this.currentSettings);
  }
  set gridLabelFontSize(val: number) {
    LaneColumnGridHelper.setGridLabelFontSize(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelFontBold(): boolean {
    return LaneColumnGridHelper.getGridLabelFontBold(this.currentSettings);
  }
  set gridLabelFontBold(val: boolean) {
    LaneColumnGridHelper.setGridLabelFontBold(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelFontItalic(): boolean {
    return LaneColumnGridHelper.getGridLabelFontItalic(this.currentSettings);
  }
  set gridLabelFontItalic(val: boolean) {
    LaneColumnGridHelper.setGridLabelFontItalic(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelAlignment(): "start" | "center" | "end" {
    return LaneColumnGridHelper.getGridLabelAlignment(this.currentSettings);
  }
  set gridLabelAlignment(val: "start" | "center" | "end") {
    LaneColumnGridHelper.setGridLabelAlignment(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelTextColor(): string {
    return LaneColumnGridHelper.getGridLabelTextColor(this.currentSettings);
  }
  set gridLabelTextColor(val: string) {
    LaneColumnGridHelper.setGridLabelTextColor(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelBackgroundColor(): string {
    return LaneColumnGridHelper.getGridLabelBackgroundColor(
      this.currentSettings,
    );
  }
  set gridLabelBackgroundColor(val: string) {
    LaneColumnGridHelper.setGridLabelBackgroundColor(
      this.currentSettings,
      val,
      () => this.onFieldChange(),
    );
  }

  onGridLabelBgColorChange(event: Event): void {
    this.gridLabelBackgroundColor = (event.target as HTMLInputElement).value;
  }
  onGridLabelTextColorChange(event: Event): void {
    this.gridLabelTextColor = (event.target as HTMLInputElement).value;
  }
  resetGridLabelTextColor(): void {
    LaneColumnGridHelper.resetGridLabelTextColor(this.currentSettings, () =>
      this.onFieldChange(),
    );
  }
  resetGridLabelBackgroundColor(): void {
    LaneColumnGridHelper.resetGridLabelBackgroundColor(
      this.currentSettings,
      () => this.onFieldChange(),
    );
  }

  get gridLabelShowBorder(): boolean {
    return LaneColumnGridHelper.getGridLabelShowBorder(this.currentSettings);
  }
  set gridLabelShowBorder(val: boolean) {
    LaneColumnGridHelper.setGridLabelShowBorder(this.currentSettings, val, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelBorderColor(): string {
    return LaneColumnGridHelper.getGridLabelBorderColor(this.currentSettings);
  }
  set gridLabelBorderColor(val: string) {
    LaneColumnGridHelper.setGridLabelBorderColor(
      this.currentSettings,
      val,
      () => this.onFieldChange(),
    );
  }

  onGridLabelBorderColorChange(event: Event): void {
    this.gridLabelBorderColor = (event.target as HTMLInputElement).value;
  }
  resetGridLabelBorderColor(): void {
    LaneColumnGridHelper.resetGridLabelBorderColor(this.currentSettings, () =>
      this.onFieldChange(),
    );
  }

  get gridLabelBorderWidth(): number {
    return LaneColumnGridHelper.getGridLabelBorderWidth(this.currentSettings);
  }
  set gridLabelBorderWidth(val: number) {
    LaneColumnGridHelper.setGridLabelBorderWidth(
      this.currentSettings,
      val,
      () => this.onFieldChange(),
    );
  }

  get gridLabelBorderRadius(): number {
    return LaneColumnGridHelper.getGridLabelBorderRadius(this.currentSettings);
  }
  set gridLabelBorderRadius(val: number) {
    LaneColumnGridHelper.setGridLabelBorderRadius(
      this.currentSettings,
      val,
      () => this.onFieldChange(),
    );
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
