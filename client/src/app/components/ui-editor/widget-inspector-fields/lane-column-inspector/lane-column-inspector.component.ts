import { CommonModule } from "@angular/common";
import { Component, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

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
  ],
})
export class LaneColumnInspectorComponent {
  settings = input.required<any>();
  widget = input<AbsoluteWidgetNode>();
  availableColumns = input<{ key: string; label: string }[]>([]);
  disableFontSizes = input<boolean>(false);
  totalLanes = input<number>(4);

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
  showReplicateModal = signal<boolean>(false);
  activeScope = signal<"grid" | "column" | "cell">("grid");

  setScope(scope: "grid" | "column" | "cell"): void {
    this.activeScope.set(scope);
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

  get onlyShowDecimalsWhenNotRacing(): boolean {
    if (this.currentSettings["onlyShowDecimalsWhenNotRacing"] !== undefined) {
      return Boolean(this.currentSettings["onlyShowDecimalsWhenNotRacing"]);
    }
    if (this.currentSettings["onlyShowSegmentsWhenNotRacing"] !== undefined) {
      return Boolean(this.currentSettings["onlyShowSegmentsWhenNotRacing"]);
    }
    return Boolean(this.currentSettings["onlyShowDecimalsIfSegments"]);
  }

  set onlyShowDecimalsWhenNotRacing(val: boolean) {
    this.currentSettings["onlyShowDecimalsWhenNotRacing"] = val;
    this.currentSettings["onlyShowSegmentsWhenNotRacing"] = val;
    this.currentSettings["onlyShowDecimalsIfSegments"] = val;
  }

  get onlyShowSegmentsWhenNotRacing(): boolean {
    return this.onlyShowDecimalsWhenNotRacing;
  }

  set onlyShowSegmentsWhenNotRacing(val: boolean) {
    this.onlyShowDecimalsWhenNotRacing = val;
  }

  get onlyShowDecimalsIfSegments(): boolean {
    return this.onlyShowDecimalsWhenNotRacing;
  }

  set onlyShowDecimalsIfSegments(val: boolean) {
    this.onlyShowDecimalsWhenNotRacing = val;
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
    } else {
      this.currentSettings["insets"][anchor] = val;
    }
    this.onFieldChange();
  }

  onColorChange(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentSettings[field] = input.value;
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
