import { CommonModule } from "@angular/common";
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { RacedayGhostPacingComponent } from "@app/components/raceday/components/raceday-ghost-pacing/raceday-ghost-pacing.component";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import {
  AbsoluteWidgetNode,
  HighlightLapStyle,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";
import { isColorLight } from "@app/utils/color.utils";

import {
  checkCustomWidgetReload,
  computeHeatDataLastLaps,
  fitColumnTextValue,
  getSvgPreserveAspectRatio,
  HeatDataLapItem,
  isCustomWidgetKey,
  isLaneColumnImageProperty,
  resolveColumnHeaderLabel,
  resolveLaneColumnImageUrl,
  resolvePacingBenchmarkType,
  resolvePacingDecimalPlaces,
} from "./raceday-lane-column.utils";
import { LaneColumnAnchorHelper } from "./raceday-lane-column-anchor.helper";
import {
  isLaneColumnExtraGridRow,
  isOverallOrSeedDataSource,
  LaneColumnDriverCache,
  resolveLaneColumnEmptyRowsMode,
} from "./raceday-lane-column-driver.helper";
import { LaneColumnFitHelper } from "./raceday-lane-column-fit.helper";
import {
  formatLaneColumnInsetValue,
  handleLaneColumnCardClick,
  handleLaneColumnInsetClick,
  isLaneColumnInsetLapCount,
  isLaneColumnLapCountClickable,
  isLaneColumnPracticeLaneResetActive,
  isLaneColumnTeamDriverSwapActive,
  isNameOrNicknameProperty,
  LaneColumnAvatarHelper,
  notifyLaneColumnParentChange,
  resolveCachedSyntheticInsetInputs,
  resolveCachedSyntheticMainInputs,
  resolveEffectiveHeaderFontSize,
  resolveEffectiveInsetFontSize,
  resolveLaneColumnBackgroundColor,
  resolveLaneColumnCardTooltip,
  resolveLaneColumnEffectiveHeaderTextColor,
  resolveLaneColumnEffectiveInsetTextColor,
  resolveLaneColumnEffectiveValueTextColor,
  resolveLaneColumnForegroundColor,
  resolveLaneColumnFormattedValue,
} from "./raceday-lane-column-interaction.helper";

export { HeatDataLapItem };

@Component({
  standalone: true,
  selector: "app-raceday-lane-column",
  templateUrl: "./raceday-lane-column.component.html",
  styleUrls: ["./raceday-lane-column.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    RacedayGhostPacingComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class RacedayLaneColumnComponent
  implements AfterViewInit, AfterViewChecked, OnDestroy
{
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);
  selectedAnchor = input<string | null>(null);
  anchorSelected = output<{ widgetId: string; anchor: string | null }>();

  protected translationService = inject(TranslationService);
  protected customWidgetService = inject(CustomWidgetService, {
    optional: true,
  });
  private cdr = inject(ChangeDetectorRef);
  private customWidgetSub?: Subscription;
  isCustomWidget(key?: string): boolean {
    return isCustomWidgetKey(key);
  }
  private insetCustomInputs = new Map<string, any>();
  private mainCustomInputsRef: { current?: any } = {};
  readonly avatarHelper = new LaneColumnAvatarHelper();
  readonly anchorHelper = new LaneColumnAnchorHelper(
    () => this.widget(),
    () => this.parent(),
    () => this.settings,
    () => this.selectedAnchor(),
    this.anchorSelected,
    () => this.notifyChange(),
  );
  readonly driverCache = new LaneColumnDriverCache();

  cardRef = viewChild<ElementRef<HTMLElement>>("cardElement");
  lastLapsRef = viewChild<ElementRef<HTMLElement>>("lastLapsContainer");
  teammateSelect = viewChild(CustomSelectComponent);
  maxVisibleLaps = signal<number | undefined>(undefined);
  private resizeObserver?: ResizeObserver;
  private cachedWidth = 0;
  private cachedHeight = 0;
  private fitHelper = new LaneColumnFitHelper();

  constructor() {
    if (this.customWidgetService?.customWidgets$) {
      this.customWidgetSub = this.customWidgetService.customWidgets$.subscribe(
        () => {
          this.cdr.markForCheck();
        },
      );
    }
  }

  ngAfterViewInit(): void {
    const cardEl = this.cardRef()?.nativeElement;
    if (cardEl && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (entries && entries[0] && entries[0].contentRect) {
          const rect = entries[0].contentRect;
          this.cachedWidth = Math.round(rect.width);
          this.cachedHeight = Math.round(rect.height);
        }
        this.fitContent();
      });
      this.resizeObserver.observe(cardEl);
    }
    this.fitContent();
    checkCustomWidgetReload(
      this.customWidgetService,
      this.columnKey,
      this.settings.insets,
    );
  }

  ngAfterViewChecked(): void {
    if (
      this.isHeaderWidget ||
      this.isImageProperty() ||
      this.isPacingProperty()
    ) {
      return;
    }
    this.fitContent(false);
  }

  ngOnDestroy(): void {
    this.customWidgetSub?.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  get settings(): LaneColumnWidgetSettings {
    return (
      (this.widget()?.customSettings as LaneColumnWidgetSettings) ||
      ({} as LaneColumnWidgetSettings)
    );
  }

  get isHeaderWidget(): boolean {
    return Boolean(this.settings.isHeaderWidget);
  }

  get isHighlighted(): boolean {
    if (this.isHeaderWidget) {
      return false;
    }
    if (
      this.highlightLapStyle === "none" ||
      this.settings.highlightRowOnLap === false
    ) {
      return false;
    }
    const driverId = this.targetDriver?.objectId;
    if (!driverId) {
      return false;
    }
    return Boolean(this.parent()?.highlightedDrivers?.has(driverId));
  }

  get highlightLapStyle(): HighlightLapStyle {
    if (this.settings?.highlightLapStyle) {
      return this.settings.highlightLapStyle;
    }
    if (this.settings?.highlightRowOnLap === false) {
      return "none";
    }
    if (this.settings?.highlightRowOnLap === true) {
      return "classic";
    }
    return this.parent()?.highlightLapStyle || "classic";
  }

  get isLightBackground(): boolean {
    return isColorLight(this.backgroundColor);
  }

  get columnKey(): string {
    if (this.settings.columnKey) {
      return this.settings.columnKey;
    }
    const type = this.widget()?.widgetType;
    if (type && isCustomWidgetKey(type)) {
      return type;
    }
    return "lastLapTime";
  }

  get bindingMode():
    | "lane"
    | "position"
    | "overallPosition"
    | "seed"
    | "hostLane"
    | "hostDriver" {
    return this.settings.bindingMode || "lane";
  }

  get targetIndex(): number {
    return this.settings.targetIndex ?? 0;
  }

  get layoutOrientation(): "vertical" | "horizontal" {
    return this.settings.layoutOrientation || "vertical";
  }

  get isVerticalLapsFlow(): boolean {
    if (this.settings.gridDirection === "horizontal") return true;
    if (this.settings.gridDirection === "vertical") return false;
    const w = this.widget()?.width || this.cachedWidth || 0;
    const h = this.widget()?.height || this.cachedHeight || 0;
    if (h > 0 && w > 0) return h >= w * 0.75;
    const cardEl = this.cardRef()?.nativeElement;
    if (cardEl && cardEl.clientHeight > 0 && cardEl.clientWidth > 0) {
      return cardEl.clientHeight >= cardEl.clientWidth * 0.75;
    }
    return false;
  }

  get targetDriver(): DriverHeatData | undefined {
    return this.driverCache.resolve(
      this.settings,
      this.columnKey,
      this.parent(),
    );
  }

  get emptyRowsMode(): "remove" | "empty" | "blank" {
    return resolveLaneColumnEmptyRowsMode(
      this.settings,
      this.parent(),
      this.bindingMode,
    );
  }

  get isExtraGridRow(): boolean {
    return isLaneColumnExtraGridRow(
      this.parent(),
      this.settings,
      this.targetDriver,
    );
  }

  get isEmptyDriver(): boolean {
    const targetDriver = this.targetDriver;
    return !targetDriver || RacedayFormatUtils.isEmptyDriver(targetDriver);
  }

  get isOverallNoDataRow(): boolean {
    return this.emptyRowsMode === "remove" && this.isExtraGridRow;
  }

  get backgroundColor(): string {
    if (this.isHeaderWidget) {
      return this.effectiveHeaderBackgroundColor;
    }
    return resolveLaneColumnBackgroundColor(
      this.settings,
      this.targetDriver,
      this.parent(),
      this.bindingMode,
      this.targetIndex,
    );
  }

  get foregroundColor(): string {
    if (this.isHeaderWidget) {
      return this.effectiveHeaderTextColor;
    }
    return resolveLaneColumnForegroundColor(
      this.settings,
      this.targetDriver,
      this.parent(),
      this.bindingMode,
      this.targetIndex,
    );
  }

  get effectiveHeaderTextColor(): string {
    return resolveLaneColumnEffectiveHeaderTextColor(
      this.settings,
      this.isHeaderWidget,
      () => this.foregroundColor,
    );
  }

  get effectiveHeaderBackgroundColor(): string {
    return this.settings.headerBackgroundColor || "rgba(68, 68, 68, 0.7)";
  }

  get effectiveHeaderFontSize(): number {
    return resolveEffectiveHeaderFontSize(
      this.settings,
      this.widget(),
      this.cardRef()?.nativeElement,
      this.cachedHeight,
    );
  }

  get effectiveValueTextColor(): string {
    return resolveLaneColumnEffectiveValueTextColor(
      this.settings,
      this.foregroundColor,
    );
  }

  get effectiveInsetTextColor(): string {
    return resolveLaneColumnEffectiveInsetTextColor(
      this.settings,
      this.foregroundColor,
    );
  }

  getInsetFontFamily(anchor: string): string | null {
    return (
      this.settings.insetsConfig?.[anchor]?.fontFamily ||
      this.settings.insetFontFamily ||
      null
    );
  }

  getEffectiveInsetFontSize(anchor?: string): number {
    if (
      this.widget()?.scaleMode !== "auto" &&
      anchor &&
      this.settings.insetsConfig?.[anchor]?.fontSize
    ) {
      return this.settings.insetsConfig[anchor].fontSize!;
    }
    return this.effectiveInsetFontSize;
  }

  getEffectiveInsetTextColor(anchor?: string): string {
    if (anchor && this.settings.insetsConfig?.[anchor]?.textColor) {
      return this.settings.insetsConfig[anchor].textColor!;
    }
    return this.effectiveInsetTextColor;
  }

  getInsetHorizontalAlignment(anchor: string): "left" | "center" | "right" {
    return this.anchorHelper.getInsetHorizontalAlignment(anchor);
  }

  getInsetVerticalAlignment(anchor: string): "top" | "center" | "bottom" {
    return this.anchorHelper.getInsetVerticalAlignment(anchor);
  }

  getInsetJustifyContent(anchor: string): string {
    return this.anchorHelper.getInsetJustifyContent(anchor);
  }

  getInsetAlignItems(anchor: string): string {
    return this.anchorHelper.getInsetAlignItems(anchor);
  }

  getInsetTextAlign(anchor: string): string {
    return this.anchorHelper.getInsetHorizontalAlignment(anchor);
  }

  getInsetObjectPosition(anchor: string): string {
    return this.anchorHelper.getInsetObjectPosition(anchor);
  }

  get effectiveSelectedAnchor(): string | null {
    return this.anchorHelper.effectiveSelectedAnchor;
  }

  isAnchorSelected(anchor: string): boolean {
    return this.anchorHelper.isAnchorSelected(anchor);
  }

  onAnchorClick(anchor: string, event: MouseEvent): void {
    this.anchorHelper.onAnchorClick(anchor, event);
  }

  onCenterZoneClick(event: MouseEvent): void {
    this.anchorHelper.onCenterZoneClick(event);
  }

  get isUIEditorMode(): boolean {
    return this.anchorHelper.isUIEditorMode;
  }

  get isGridCellUnselected(): boolean {
    return this.anchorHelper.isGridCellUnselected;
  }

  get isWidgetInGrid(): boolean {
    return this.anchorHelper.isWidgetInGrid;
  }

  get isSelectedWidget(): boolean {
    return this.anchorHelper.isSelectedWidget;
  }

  get shouldRenderAnchorDropGrid(): boolean {
    return this.anchorHelper.shouldRenderAnchorDropGrid;
  }

  get isLapCountClickable(): boolean {
    if (this.isExtraGridRow) return false;
    return isLaneColumnLapCountClickable(
      this.parent(),
      this.targetDriver,
      this.columnKey,
      this.isUIEditorMode,
    );
  }

  get isTeamDriverSwapActive(): boolean {
    if (this.isExtraGridRow) return false;
    return isLaneColumnTeamDriverSwapActive(
      this.parent(),
      this.targetDriver,
      this.columnKey,
      this.isUIEditorMode,
    );
  }

  get isPracticeLaneResetActive(): boolean {
    if (this.isExtraGridRow) return false;
    return isLaneColumnPracticeLaneResetActive(
      this.parent(),
      this.columnKey,
      this.isUIEditorMode,
    );
  }

  get cardTooltip(): string | null {
    if (this.isExtraGridRow) return null;
    return resolveLaneColumnCardTooltip(
      this.translationService,
      this.isLapCountClickable,
      this.isTeamDriverSwapActive,
      this.parent(),
      this.isUIEditorMode,
    );
  }

  onCardClick(event: MouseEvent): void {
    handleLaneColumnCardClick(
      event,
      this.parent(),
      this.targetDriver,
      this.columnKey,
      this.isUIEditorMode,
      this.isLapCountClickable,
      this.isTeamDriverSwapActive,
      this.teammateSelect(),
    );
  }

  isInsetLapCount(anchor: string): boolean {
    return isLaneColumnInsetLapCount(
      this.getInsetKey(anchor),
      this.isUIEditorMode,
    );
  }

  onInsetClick(anchor: string, event: MouseEvent): void {
    handleLaneColumnInsetClick(
      event,
      anchor,
      this.settings.insets,
      this.parent(),
      this.targetDriver,
      this.isUIEditorMode,
    );
  }

  onResetLane(event: Event): void {
    event.stopPropagation();
    const p = this.parent();
    const hd = this.targetDriver;
    const lane =
      hd?.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : -1);
    if (lane >= 0) {
      p?.resetLane?.(lane, event);
    }
  }

  onTeammateChange(event: any): void {
    const hd = this.targetDriver;
    if (hd) {
      this.parent()?.onTeammateChange?.(hd, event);
    }
  }

  get borderColor(): string {
    if (this.settings.showBorder === false) return "transparent";
    if (this.settings.borderColor) return this.settings.borderColor;
    return this.foregroundColor;
  }

  get headerLabel(): string {
    return resolveColumnHeaderLabel(
      this.columnKey,
      this.settings,
      this.parent(),
      (k) => this.translationService.translate(k),
    );
  }

  private cachedColDefKey?: string;
  private cachedColDefsRef?: any;
  private cachedColDef?: ColumnDefinition;

  private getColumnDefinition(
    key: string,
    parent: any,
  ): ColumnDefinition | undefined {
    if (
      this.cachedColDefKey === key &&
      this.cachedColDefsRef === parent?.columns
    ) {
      return this.cachedColDef;
    }
    this.cachedColDefKey = key;
    this.cachedColDefsRef = parent?.columns;
    this.cachedColDef = parent?.columns?.find(
      (c: any) => c.propertyName === key,
    );
    return this.cachedColDef;
  }

  get formattedValue(): string {
    if (this.isExtraGridRow) {
      if (this.emptyRowsMode === "blank") {
        return "";
      }
      if (
        !isOverallOrSeedDataSource(
          this.settings,
          this.parent(),
          this.bindingMode,
        ) &&
        isNameOrNicknameProperty(this.columnKey)
      ) {
        return this.translationService.translate("RD_EMPTY_LANE");
      }
      return "--";
    }
    const parent = this.parent();
    const colDef = parent?.formatValue
      ? this.getColumnDefinition(this.columnKey, parent)
      : undefined;
    return resolveLaneColumnFormattedValue(
      this.targetDriver,
      this.columnKey,
      parent,
      this.settings,
      this.bindingMode,
      colDef,
    );
  }

  isLastLaps(): boolean {
    return this.columnKey === "lastLaps";
  }

  getLastLaps(): HeatDataLapItem[] {
    return computeHeatDataLastLaps(
      this.targetDriver,
      this.settings,
      this.parent(),
    );
  }

  getVisibleLastLaps(): HeatDataLapItem[] {
    const all = this.getLastLaps();
    const max = this.maxVisibleLaps();
    if (max !== undefined && max > 0) {
      return all.slice(0, max);
    }
    return all;
  }

  fitContent(force = false): void {
    const cardEl = this.cardRef()?.nativeElement;
    if (!cardEl) return;

    this.fitHelper.fitContent(cardEl, force, {
      isHeaderWidget: this.isHeaderWidget,
      isLastLaps: this.isLastLaps(),
      isImageProperty: this.isImageProperty(),
      isPacingProperty: this.isPacingProperty(),
      formattedValue: this.formattedValue,
      cachedWidth: this.cachedWidth,
      cachedHeight: this.cachedHeight,
      settings: this.settings,
      widget: this.widget(),
      headerLabel: this.headerLabel,
      lastLapsLength: this.getLastLaps().length,
      isVerticalLapsFlow: this.isVerticalLapsFlow,
      setMaxVisibleLaps: (count) => this.maxVisibleLaps.set(count),
      onFitTextValue: (el) => this.fitTextValue(el),
    });
  }

  private fitTextValue(cardEl: HTMLElement): void {
    const explicitW = this.cachedWidth || cardEl.clientWidth;
    const explicitH = this.cachedHeight || cardEl.clientHeight;
    fitColumnTextValue(
      cardEl,
      this.formattedValue?.trim() || "",
      this.settings,
      this.widget()?.scaleMode,
      this.layoutOrientation,
      this.hasLeftInsets(),
      this.hasRightInsets(),
      (anchor) => this.hasInset(anchor),
      this.effectiveInsetFontSize,
      explicitW,
      explicitH,
    );
  }

  isImageProperty(key: string = this.columnKey): boolean {
    if (this.isExtraGridRow) return false;
    return isLaneColumnImageProperty(key);
  }

  getImageUrl(key: string = this.columnKey, anchor?: string): string {
    if (this.isExtraGridRow) return "";
    return resolveLaneColumnImageUrl(
      key,
      this.targetDriver,
      this.parent(),
      anchor,
      this.targetIndex,
    );
  }

  getInsetKey(anchor: string): string | undefined {
    return this.settings.insets?.[anchor];
  }

  hasInset(anchor: string): boolean {
    return this.anchorHelper.hasInset(
      anchor,
      this.isExtraGridRow && this.emptyRowsMode === "blank",
    );
  }

  hasTopInsets(): boolean {
    return this.anchorHelper.hasSideInsets(
      "top",
      this.isExtraGridRow && this.emptyRowsMode === "blank",
    );
  }

  hasBottomInsets(): boolean {
    return this.anchorHelper.hasSideInsets(
      "bottom",
      this.isExtraGridRow && this.emptyRowsMode === "blank",
    );
  }

  hasLeftInsets(): boolean {
    return this.anchorHelper.hasSideInsets(
      "left",
      this.isExtraGridRow && this.emptyRowsMode === "blank",
    );
  }

  hasRightInsets(): boolean {
    return this.anchorHelper.hasSideInsets(
      "right",
      this.isExtraGridRow && this.emptyRowsMode === "blank",
    );
  }

  get effectiveInsetFontSize(): number {
    return resolveEffectiveInsetFontSize(
      this.settings,
      this.widget(),
      this.cardRef()?.nativeElement,
      this.cachedHeight,
    );
  }

  getInsetValue(anchor: string): string {
    if (this.isExtraGridRow) {
      if (this.emptyRowsMode === "blank") {
        return "";
      }
      const insetKey = this.getInsetKey(anchor);
      if (!insetKey) {
        return "";
      }
      if (
        !isOverallOrSeedDataSource(
          this.settings,
          this.parent(),
          this.bindingMode,
        ) &&
        isNameOrNicknameProperty(insetKey)
      ) {
        return this.translationService.translate("RD_EMPTY_LANE");
      }
      return "--";
    }
    return formatLaneColumnInsetValue(
      this.targetDriver,
      anchor,
      this.getInsetKey(anchor),
      this.settings,
      this.parent(),
    );
  }

  getInsetImageUrl(anchor: string): string {
    const key = this.getInsetKey(anchor);
    if (!key || !this.isImageProperty(key)) return "";
    return this.getImageUrl(key, anchor);
  }

  get imageErrors(): Set<string> {
    return this.avatarHelper.imageErrors;
  }

  get mainImageError(): boolean {
    return this.avatarHelper.mainImageError;
  }

  isPlaceholderAvatar(url?: string, _key?: string, anchor?: string): boolean {
    if (this.isExtraGridRow) return false;
    return this.avatarHelper.isPlaceholderAvatar(
      this.targetDriver,
      url,
      anchor,
    );
  }

  getSvgPreserveAspectRatio(anchor?: string): string {
    const h = anchor ? this.getInsetHorizontalAlignment(anchor) : undefined;
    const v = anchor ? this.getInsetVerticalAlignment(anchor) : undefined;
    return getSvgPreserveAspectRatio(anchor, h, v);
  }

  onImageError(event: Event, anchor?: string): void {
    this.avatarHelper.onImageError(event, anchor);
    this.cdr.markForCheck();
  }

  hasAnchorValue(anchor: string): boolean {
    return this.anchorHelper.hasAnchorValue(anchor, this.columnKey);
  }

  onAnchorDragOver(event: DragEvent): void {
    this.anchorHelper.onAnchorDragOver(event);
  }

  onAnchorDragEnter(event: DragEvent): void {
    this.anchorHelper.onAnchorDragEnter(event);
  }

  onAnchorDragLeave(event: DragEvent): void {
    this.anchorHelper.onAnchorDragLeave(event);
  }

  onAnchorDrop(event: DragEvent, anchor: string): void {
    this.anchorHelper.onAnchorDrop(event, anchor);
  }

  setInset(anchor: string, key: string): void {
    this.anchorHelper.setInset(anchor, key);
  }

  deleteAnchor(anchor: string, event?: Event): void {
    this.anchorHelper.deleteAnchor(anchor, event);
  }

  private notifyChange(): void {
    notifyLaneColumnParentChange(this.parent(), this.widget());
    this.fitContent();
  }

  isPacingProperty(): boolean {
    if (this.isExtraGridRow) return false;
    return RacedayLayoutUtils.isPacingProperty(this.columnKey);
  }

  getPacingDecimalPlaces(): number {
    return resolvePacingDecimalPlaces(
      this.settings,
      this.parent(),
      this.columnKey,
    );
  }

  getPacingBenchmarkType(): GhostBenchmarkType {
    return resolvePacingBenchmarkType(this.columnKey);
  }

  isDriftLap(): boolean {
    if (this.isExtraGridRow) return false;
    const hd = this.targetDriver;
    const parent = this.parent();
    if (!hd || !parent) return false;
    return Boolean(
      hd.isLastLapDrift &&
      (this.columnKey === "lastLapTime" || this.columnKey === "lapTime"),
    );
  }

  getCustomWidgetComponent(key: string | undefined): any {
    if (!key) return null;
    return this.customWidgetService?.getWidgetComponent(key) || null;
  }

  getCustomWidgetInputsForInset(anchor: string) {
    return resolveCachedSyntheticInsetInputs(
      this.insetCustomInputs,
      anchor,
      this.getInsetKey(anchor),
      this.widget(),
      this.bindingMode,
      this.targetIndex,
      this.getEffectiveInsetFontSize(anchor),
      this.parent(),
      this.isUIEditorMode,
      this.targetDriver,
      this.getEffectiveInsetTextColor(anchor),
      this.backgroundColor,
    );
  }

  getCustomWidgetInputsForMain() {
    return resolveCachedSyntheticMainInputs(
      this.mainCustomInputsRef,
      this.columnKey,
      this.widget(),
      this.bindingMode,
      this.targetIndex,
      this.parent(),
      this.isUIEditorMode,
      this.targetDriver,
      this.effectiveValueTextColor,
      this.backgroundColor,
    );
  }
}
