import { InputSignal, OutputEmitterRef, WritableSignal } from "@angular/core";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { HighlightLapStyle } from "@app/models/settings";

import { LaneColumnGridHelper } from "./lane-column-grid.helper";

export abstract class LaneColumnInspectorGridBase {
  abstract currentSettings: any;
  abstract totalLanes: InputSignal<number>;
  abstract showReplicateModal: WritableSignal<boolean>;
  abstract requestReplicate: OutputEmitterRef<void>;
  abstract replicate: OutputEmitterRef<
    Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">
  >;
  abstract editGrid: OutputEmitterRef<string>;
  abstract detachGrid: OutputEmitterRef<string>;
  abstract deleteGrid: OutputEmitterRef<string>;
  abstract reMirrorGrid: OutputEmitterRef<string>;
  abstract bringGridToFront: OutputEmitterRef<string>;

  abstract onFieldChange(): void;
  abstract resetHeaderTextColor(): void;
  abstract resetHeaderBackgroundColor(): void;

  toValidHexColor(
    color: string | undefined | null,
    fallback: string = "#ffffff",
  ): string {
    if (!color) return fallback;
    const trimmed = color.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
      return (
        "#" +
        trimmed[1] +
        trimmed[1] +
        trimmed[2] +
        trimmed[2] +
        trimmed[3] +
        trimmed[3]
      );
    }
    return fallback;
  }

  get isHeaderWidget(): boolean {
    return Boolean(this.currentSettings["isHeaderWidget"]);
  }

  get gridHeaderPlacement(): "top" | "individual" | "none" | "left" {
    return LaneColumnGridHelper.getGridHeaderPlacement(this.currentSettings);
  }

  get currentGridHeaderHeight(): number {
    return LaneColumnGridHelper.getGridHeaderHeight(this.currentSettings);
  }

  get currentGridHeaderWidth(): number {
    return LaneColumnGridHelper.getGridHeaderWidth(this.currentSettings);
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
    this.currentSettings["_syncAction"] = "header";
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

  get highlightLapStyle(): HighlightLapStyle {
    return LaneColumnGridHelper.getHighlightLapStyle(this.currentSettings);
  }
  set highlightLapStyle(val: HighlightLapStyle) {
    LaneColumnGridHelper.setHighlightLapStyle(this.currentSettings, val, () =>
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

  get isOverallOrSeedGrid(): boolean {
    return (
      this.gridType === "overall" ||
      this.gridSortOrder === "overallPosition" ||
      this.gridSortOrder === "seed" ||
      this.currentSettings["bindingMode"] === "overallPosition" ||
      this.currentSettings["bindingMode"] === "seed"
    );
  }

  get gridEmptyRowsMode(): "remove" | "empty" | "blank" {
    return LaneColumnGridHelper.getGridEmptyRowsMode(this.currentSettings);
  }
  set gridEmptyRowsMode(val: "remove" | "empty" | "blank") {
    LaneColumnGridHelper.setGridEmptyRowsMode(this.currentSettings, val, () =>
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

  get isGridHorizontal(): boolean {
    return (
      this.gridLayoutOrientation === "horizontal" ||
      this.gridDirection === "horizontal"
    );
  }

  get isLanesMirrored(): boolean {
    return this.isGridHorizontal ? this.linkColumns : this.mirrorRows;
  }

  onGridLayoutOrientationChange(val: "vertical" | "horizontal"): void {
    LaneColumnGridHelper.setGridLayoutOrientation(
      this.currentSettings,
      val,
      () => this.onFieldChange(),
    );
  }

  onGridHeaderPlacementChange(
    placement: "top" | "individual" | "none" | "left",
  ): void {
    LaneColumnGridHelper.setGridHeaderPlacement(
      this.currentSettings,
      placement,
      () => this.onFieldChange(),
    );
  }

  onGridHeaderWidthChange(width: number): void {
    LaneColumnGridHelper.setGridHeaderWidth(this.currentSettings, width, () =>
      this.onFieldChange(),
    );
  }

  onGridHeaderHeightChange(height: number): void {
    LaneColumnGridHelper.setGridHeaderHeight(this.currentSettings, height, () =>
      this.onFieldChange(),
    );
  }

  applyHeaderStyleToAll(): void {
    this.currentSettings["_forceAllColumns"] = true;
    this.currentSettings["_syncAction"] = "header";
    this.onFieldChange();
  }

  applyValueStyleToAll(): void {
    this.currentSettings["_forceAllColumns"] = true;
    this.currentSettings["_syncAction"] = "value";
    this.onFieldChange();
  }

  applyBorderStyleToAll(): void {
    this.currentSettings["_forceAllColumns"] = true;
    this.currentSettings["_syncAction"] = "border";
    this.onFieldChange();
  }

  applyTimeFormatToAll(): void {
    this.currentSettings["_forceAllColumns"] = true;
    this.currentSettings["_syncAction"] = "time";
    this.onFieldChange();
  }

  get gridHighlightLapStyle(): HighlightLapStyle {
    return this.highlightLapStyle;
  }
  set gridHighlightLapStyle(val: HighlightLapStyle) {
    this.currentSettings["_forceAllColumns"] = true;
    this.highlightLapStyle = val;
  }

  applyHighlightStyleToAll(): void {
    this.currentSettings["_forceAllColumns"] = true;
    this.currentSettings["_syncAction"] = "highlight";
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
    if (this.isGridHorizontal) {
      this.linkColumns = true;
    } else {
      this.mirrorRows = true;
    }
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
