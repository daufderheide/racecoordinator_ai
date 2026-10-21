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
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

import {
  buildSyntheticInsetWidgetInputs,
  buildSyntheticMainWidgetInputs,
  computeHeatDataLastLaps,
  extractDroppedColumnKey,
  fitColumnLastLaps,
  fitColumnTextValue,
  formatAdjustedLapValue,
  HeatDataLapItem,
  isCustomWidgetKey,
  isLaneColumnImageProperty,
  resolveColumnHeaderLabel,
  resolveLaneColumnImageUrl,
  resolvePacingBenchmarkType,
  resolvePacingDecimalPlaces,
  resolveTargetDriver,
} from "./raceday-lane-column.utils";
import {
  deleteLaneColumnAnchor,
  fitLaneColumnHeaderText,
  formatLaneColumnInsetValue,
  isLaneColumnInsetLapCount,
  isLaneColumnLapCountClickable,
  isLaneColumnPracticeLaneResetActive,
  isLaneColumnTeamDriverSwapActive,
  notifyLaneColumnParentChange,
  resolveEffectiveHeaderFontSize,
  resolveEffectiveInsetFontSize,
  resolveLaneColumnBackgroundColor,
  resolveLaneColumnCardTooltip,
  resolveLaneColumnForegroundColor,
  setLaneColumnInset,
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
  isCustomWidget = isCustomWidgetKey;
  private insetCustomInputs = new Map<
    string,
    { widget: AbsoluteWidgetNode; parent: any; isCustomizing: boolean }
  >();
  private mainCustomInputs?: {
    widget: AbsoluteWidgetNode;
    parent: any;
    isCustomizing: boolean;
  };

  cardRef = viewChild<ElementRef<HTMLElement>>("cardElement");
  lastLapsRef = viewChild<ElementRef<HTMLElement>>("lastLapsContainer");
  teammateSelect = viewChild(CustomSelectComponent);
  maxVisibleLaps = signal<number | undefined>(undefined);
  private resizeObserver?: ResizeObserver;
  private lastFittedText = "";
  private lastFittedWidth = 0;
  private lastFittedHeight = 0;
  private lastFittedInsets = "";
  private lastFittedValueFontSize?: number;
  private lastFittedValueFontFamily?: string;
  private lastFittedScaleMode?: string;

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
      this.resizeObserver = new ResizeObserver(() => {
        this.fitContent();
      });
      this.resizeObserver.observe(cardEl);
    }
    this.fitContent();
    this.checkCustomWidgetReload();
  }

  private checkCustomWidgetReload(): void {
    if (
      this.customWidgetService &&
      this.customWidgetService.getCustomWidgets().length === 0 &&
      (this.isCustomWidget(this.columnKey) || this.hasAnyCustomInsets())
    ) {
      this.customWidgetService.reloadCustomWidgets().catch(() => {});
    }
  }

  private hasAnyCustomInsets(): boolean {
    const insets = this.settings.insets;
    if (!insets) return false;
    return Object.values(insets).some((k) => this.isCustomWidget(k));
  }

  ngAfterViewChecked(): void {
    if (
      this.isHeaderWidget ||
      this.isImageProperty() ||
      this.isPacingProperty()
    ) {
      return;
    }
    const cardEl = this.cardRef()?.nativeElement;
    if (!cardEl) return;

    if (this.isLastLaps()) {
      const w = cardEl.clientWidth;
      const h = cardEl.clientHeight;
      const valSize = this.settings.valueFontSize ?? 0;
      const scaleMode = this.widget()?.scaleMode || "";
      if (
        w > 0 &&
        h > 0 &&
        (w !== this.lastFittedWidth ||
          h !== this.lastFittedHeight ||
          valSize !== this.lastFittedValueFontSize ||
          scaleMode !== this.lastFittedScaleMode)
      ) {
        this.lastFittedWidth = w;
        this.lastFittedHeight = h;
        this.lastFittedValueFontSize = valSize;
        this.lastFittedScaleMode = scaleMode;
        this.fitLastLaps();
      }
      return;
    }

    const text = this.formattedValue?.trim() || "";
    const w = cardEl.clientWidth;
    const h = cardEl.clientHeight;
    const insetsKey = JSON.stringify(this.settings.insets || {});
    const valSize = this.settings.valueFontSize ?? 0;
    const valFamily = this.settings.valueFontFamily || "";
    const scaleMode = this.widget()?.scaleMode || "";
    if (
      w > 0 &&
      h > 0 &&
      (text !== this.lastFittedText ||
        w !== this.lastFittedWidth ||
        h !== this.lastFittedHeight ||
        insetsKey !== this.lastFittedInsets ||
        valSize !== this.lastFittedValueFontSize ||
        valFamily !== this.lastFittedValueFontFamily ||
        scaleMode !== this.lastFittedScaleMode)
    ) {
      this.lastFittedText = text;
      this.lastFittedWidth = w;
      this.lastFittedHeight = h;
      this.lastFittedInsets = insetsKey;
      this.lastFittedValueFontSize = valSize;
      this.lastFittedValueFontFamily = valFamily;
      this.lastFittedScaleMode = scaleMode;
      this.fitTextValue(cardEl);
    }
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
    if (this.settings.highlightRowOnLap === false) {
      return false;
    }
    const driverId = this.targetDriver?.objectId;
    if (!driverId) {
      return false;
    }
    return Boolean(this.parent()?.highlightedDrivers?.has(driverId));
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

  get bindingMode(): "lane" | "position" | "overallPosition" | "seed" {
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
    const w = this.widget()?.width || 0;
    const h = this.widget()?.height || 0;
    if (h > 0 && w > 0) return h >= w * 0.75;
    const cardEl = this.cardRef()?.nativeElement;
    if (cardEl && cardEl.clientHeight > 0 && cardEl.clientWidth > 0) {
      return cardEl.clientHeight >= cardEl.clientWidth * 0.75;
    }
    return false;
  }

  private syntheticHeatDrivers = new Map<string, DriverHeatData>();

  private getOrCreateSyntheticDriver(participant: any): DriverHeatData {
    let synth = this.syntheticHeatDrivers.get(participant.objectId);
    if (!synth || synth.participant !== participant) {
      synth = new DriverHeatData(
        participant.objectId,
        participant,
        -1,
        participant.driver,
      );
      this.syntheticHeatDrivers.set(participant.objectId, synth);
    }
    return synth;
  }

  get targetDriver(): DriverHeatData | undefined {
    return resolveTargetDriver(
      this.settings,
      this.columnKey,
      this.parent(),
      (p) => this.getOrCreateSyntheticDriver(p),
    );
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
    if (this.settings.headerTextColor) {
      return this.settings.headerTextColor;
    }
    if (this.isHeaderWidget) {
      return "#ffffff";
    }
    if (this.settings.useLaneColors !== false) {
      return this.foregroundColor;
    }
    return this.settings.textColor || this.foregroundColor || "#ffffff";
  }

  get effectiveHeaderBackgroundColor(): string {
    return this.settings.headerBackgroundColor || "rgba(68, 68, 68, 0.7)";
  }

  get effectiveHeaderFontSize(): number {
    return resolveEffectiveHeaderFontSize(
      this.settings,
      this.widget(),
      this.cardRef()?.nativeElement,
    );
  }

  get effectiveValueTextColor(): string {
    if (this.settings.useLaneColors !== false) {
      return this.foregroundColor;
    }
    return (
      this.settings.valueTextColor ||
      this.settings.textColor ||
      this.foregroundColor
    );
  }

  get effectiveInsetTextColor(): string {
    if (this.settings.useLaneColors !== false) {
      return this.foregroundColor;
    }
    return (
      this.settings.insetTextColor ||
      this.settings.textColor ||
      this.foregroundColor
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
    if (anchor && this.settings.insetsConfig?.[anchor]?.fontSize) {
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

  get effectiveSelectedAnchor(): string | null {
    if (this.selectedAnchor() !== null && this.selectedAnchor() !== undefined) {
      return this.selectedAnchor();
    }
    const p = this.parent();
    if (p) {
      const pSelWidget =
        typeof p.selectedWidgetId === "function"
          ? p.selectedWidgetId()
          : p.selectedWidgetId;
      if (pSelWidget === this.widget()?.id) {
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
    const wId = this.widget()?.id;
    if (!wId) return;
    const p = this.parent();
    if (p?.selectAnchor) {
      p.selectAnchor(wId, anchor);
    } else {
      if (p?.widgetSelected?.emit) {
        p.widgetSelected.emit(wId);
      }
      if (p?.anchorSelected?.emit) {
        p.anchorSelected.emit({ widgetId: wId, anchor });
      }
    }
    this.anchorSelected.emit({ widgetId: wId, anchor });
  }

  onCenterZoneClick(event: MouseEvent): void {
    if (!this.isUIEditorMode) return;
    event.stopPropagation();
    const wId = this.widget()?.id;
    if (!wId) return;
    const p = this.parent();
    if (p?.selectAnchor) {
      p.selectAnchor(wId, null);
    } else {
      if (p?.widgetSelected?.emit) {
        p.widgetSelected.emit(wId);
      }
      if (p?.anchorSelected?.emit) {
        p.anchorSelected.emit({ widgetId: wId, anchor: null });
      }
    }
    this.anchorSelected.emit({ widgetId: wId, anchor: null });
  }

  get isUIEditorMode(): boolean {
    const p = this.parent();
    if (!p) return false;
    const inEditor =
      typeof p.isUIEditorMode === "function"
        ? p.isUIEditorMode()
        : Boolean(p.isUIEditorMode);
    return inEditor || Boolean(p.isLayoutCustomizing);
  }

  get isLapCountClickable(): boolean {
    return isLaneColumnLapCountClickable(
      this.parent(),
      this.targetDriver,
      this.columnKey,
      this.isUIEditorMode,
    );
  }

  get isTeamDriverSwapActive(): boolean {
    return isLaneColumnTeamDriverSwapActive(
      this.parent(),
      this.targetDriver,
      this.columnKey,
      this.isUIEditorMode,
    );
  }

  get isPracticeLaneResetActive(): boolean {
    return isLaneColumnPracticeLaneResetActive(
      this.parent(),
      this.columnKey,
      this.isUIEditorMode,
    );
  }

  get cardTooltip(): string | null {
    return resolveLaneColumnCardTooltip(
      this.translationService,
      this.isLapCountClickable,
      this.isTeamDriverSwapActive,
      this.parent(),
      this.isUIEditorMode,
    );
  }

  onCardClick(event: MouseEvent): void {
    if (this.isUIEditorMode) return;
    const p = this.parent();
    const hd = this.targetDriver;
    if (!p || !hd) return;

    if (this.isLapCountClickable && p.onCellClick) {
      p.onCellClick(
        hd,
        { propertyName: this.columnKey } as ColumnDefinition,
        event,
      );
    } else if (this.isTeamDriverSwapActive) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("app-custom-select")
      ) {
        return;
      }
      event.stopPropagation?.();
      const select = this.teammateSelect();
      if (select) {
        select.toggleOpen();
      }
    }
  }

  isInsetLapCount(anchor: string): boolean {
    return isLaneColumnInsetLapCount(
      this.getInsetKey(anchor),
      this.isUIEditorMode,
    );
  }

  onInsetClick(anchor: string, event: MouseEvent): void {
    if (this.isUIEditorMode) return;
    const key = this.getInsetKey(anchor);
    if (isLaneColumnInsetLapCount(key, false)) {
      event.stopPropagation();
      const p = this.parent();
      const hd = this.targetDriver;
      if (p?.onCellClick && hd) {
        p.onCellClick(hd, { propertyName: key } as ColumnDefinition, event);
      }
    }
  }

  onResetLane(event: Event): void {
    event.stopPropagation();
    const p = this.parent();
    const hd = this.targetDriver;
    if (!p || !hd) return;
    const lane =
      hd.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : -1);
    if (lane >= 0) {
      p.resetLane?.(lane, event);
    }
  }

  onTeammateChange(event: any): void {
    const p = this.parent();
    const hd = this.targetDriver;
    if (!p || !hd) return;
    p.onTeammateChange?.(hd, event);
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

  get formattedValue(): string {
    const hd = this.targetDriver;
    const key = this.columnKey;
    const parent = this.parent();
    if (!hd) return "--";

    if (parent?.formatValue) {
      const colDef = parent.columns?.find((c: any) => c.propertyName === key);
      return parent.formatValue(
        key,
        RacedayFormatUtils.getPropertyValue(hd, key),
        hd,
        colDef,
        "center-center",
        this.settings,
      );
    }

    const raw = RacedayFormatUtils.getPropertyValue(hd, key);
    return formatAdjustedLapValue(raw, hd, key);
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

    if (this.isHeaderWidget) {
      this.fitHeaderText(cardEl);
      return;
    }

    if (this.isLastLaps()) {
      this.fitLastLaps();
    } else if (!this.isImageProperty() && !this.isPacingProperty()) {
      const text = this.formattedValue?.trim() || "";
      const w = cardEl.clientWidth;
      const h = cardEl.clientHeight;
      const insetsKey = JSON.stringify(this.settings.insets || {});
      const valSize = this.settings.valueFontSize ?? 0;
      const valFamily = this.settings.valueFontFamily || "";
      const scaleMode = this.widget()?.scaleMode || "";
      if (
        !force &&
        w > 0 &&
        h > 0 &&
        text === this.lastFittedText &&
        w === this.lastFittedWidth &&
        h === this.lastFittedHeight &&
        insetsKey === this.lastFittedInsets &&
        valSize === this.lastFittedValueFontSize &&
        valFamily === this.lastFittedValueFontFamily &&
        scaleMode === this.lastFittedScaleMode
      ) {
        return;
      }
      this.lastFittedText = text;
      this.lastFittedWidth = w;
      this.lastFittedHeight = h;
      this.lastFittedInsets = insetsKey;
      this.lastFittedValueFontSize = valSize;
      this.lastFittedValueFontFamily = valFamily;
      this.lastFittedScaleMode = scaleMode;
      this.fitTextValue(cardEl);
    }
  }

  private fitHeaderText(cardEl: HTMLElement): void {
    fitLaneColumnHeaderText(
      cardEl,
      this.settings,
      this.widget(),
      this.headerLabel,
    );
  }

  private fitTextValue(cardEl: HTMLElement): void {
    fitColumnTextValue(
      cardEl,
      this.lastFittedText,
      this.settings,
      this.widget()?.scaleMode,
      this.layoutOrientation,
      this.hasLeftInsets(),
      this.hasRightInsets(),
      (anchor) => this.hasInset(anchor),
      this.effectiveInsetFontSize,
    );
  }

  private fitLastLaps(): void {
    const cardEl = this.cardRef()?.nativeElement;
    if (!cardEl) return;

    const baseFontSize = Number(
      this.settings.valueFontSize ||
        (this.widget()?.fontSize ? this.widget()!.fontSize : 54),
    );
    const allLaps = this.getLastLaps();
    const explicitW = this.widget()?.width;
    const explicitH = this.widget()?.height;

    const scaleMode = this.widget()?.scaleMode;
    const isCustomScaling = scaleMode !== undefined && scaleMode !== "auto";
    if (isCustomScaling) {
      this.maxVisibleLaps.set(allLaps.length || 5);
      cardEl.style.setProperty(
        "--lane-col-last-laps-font-size",
        `${baseFontSize}px`,
      );
    } else {
      const fit = fitColumnLastLaps(
        cardEl,
        this.isVerticalLapsFlow,
        baseFontSize,
        allLaps.length,
        explicitW,
        explicitH,
      );
      this.maxVisibleLaps.set(fit.maxLaps);
      cardEl.style.setProperty(
        "--lane-col-last-laps-font-size",
        `${fit.fontSize}px`,
      );
    }
  }

  isImageProperty(key: string = this.columnKey): boolean {
    return isLaneColumnImageProperty(key);
  }

  getImageUrl(key: string = this.columnKey, anchor?: string): string {
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
    return Boolean(this.getInsetKey(anchor));
  }

  hasTopInsets(): boolean {
    return (
      this.hasInset("top-left") ||
      this.hasInset("top-center") ||
      this.hasInset("top-right")
    );
  }

  hasBottomInsets(): boolean {
    return (
      this.hasInset("bottom-left") ||
      this.hasInset("bottom-center") ||
      this.hasInset("bottom-right")
    );
  }

  hasLeftInsets(): boolean {
    return this.hasInset("top-left") || this.hasInset("bottom-left");
  }

  hasRightInsets(): boolean {
    return this.hasInset("top-right") || this.hasInset("bottom-right");
  }

  get effectiveInsetFontSize(): number {
    return resolveEffectiveInsetFontSize(
      this.settings,
      this.widget(),
      this.cardRef()?.nativeElement,
    );
  }

  getInsetValue(anchor: string): string {
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

  hasAnchorValue(anchor: string): boolean {
    if (anchor === "center-center") {
      return Boolean(this.columnKey);
    }
    return Boolean(this.settings.insets?.[anchor]);
  }

  onAnchorDragOver(event: DragEvent): void {
    if (!this.isUIEditorMode) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      const allowed = event.dataTransfer.effectAllowed;
      event.dataTransfer.dropEffect = allowed === "move" ? "move" : "copy";
    }
  }

  onAnchorDragEnter(event: DragEvent): void {
    if (!this.isUIEditorMode) return;
    event.preventDefault();
    event.stopPropagation();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.add(
      "drag-over",
    );
  }

  onAnchorDragLeave(event: DragEvent): void {
    if (!this.isUIEditorMode) return;
    event.preventDefault();
    event.stopPropagation();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
      "drag-over",
    );
  }

  onAnchorDrop(event: DragEvent, anchor: string): void {
    if (!this.isUIEditorMode) return;
    event.preventDefault();
    event.stopPropagation();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
      "drag-over",
    );

    const parent = this.parent();
    const droppedKey = extractDroppedColumnKey(event, parent);

    if (droppedKey) {
      if (parent) {
        parent.draggedWidgetType = null;
      }
      this.setInset(anchor, droppedKey);
    }
  }

  setInset(anchor: string, key: string): void {
    setLaneColumnInset(this.widget(), anchor, key);
    this.notifyChange();
  }

  deleteAnchor(anchor: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    deleteLaneColumnAnchor(
      this.widget(),
      anchor,
      this.parent(),
      this.selectedAnchor(),
      this.anchorSelected,
    );
    this.notifyChange();
  }

  private notifyChange(): void {
    notifyLaneColumnParentChange(this.parent(), this.widget());
    this.fitContent();
  }

  isPacingProperty(): boolean {
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
    const key = this.getInsetKey(anchor);
    const existing = this.insetCustomInputs.get(anchor);
    const parent = this.parent();
    const isCustomizing = this.isUIEditorMode;
    const w = this.widget();
    const fontSize = this.getEffectiveInsetFontSize(anchor);
    const targetDriver = this.targetDriver;
    const laneFg = this.getEffectiveInsetTextColor(anchor);
    const laneBg = this.backgroundColor;

    if (
      existing &&
      existing.parent === parent &&
      existing.isCustomizing === isCustomizing &&
      existing.widget?.widgetType === key &&
      existing.widget?.customSettings?.["valueFontSize"] === fontSize &&
      existing.widget?.customSettings?.["gridLane"] === this.targetIndex &&
      existing.widget?.customSettings?.["targetDriver"] === targetDriver &&
      existing.widget?.customSettings?.["laneForegroundColor"] === laneFg &&
      existing.widget?.customSettings?.["laneBackgroundColor"] === laneBg
    ) {
      return existing;
    }

    const inputs = buildSyntheticInsetWidgetInputs(
      anchor,
      key,
      w,
      this.bindingMode,
      this.targetIndex,
      fontSize,
      parent,
      isCustomizing,
      targetDriver,
      laneFg,
      laneBg,
    );
    this.insetCustomInputs.set(anchor, inputs);
    return inputs;
  }

  getCustomWidgetInputsForMain() {
    const key = this.columnKey;
    const parent = this.parent();
    const isCustomizing = this.isUIEditorMode;
    const w = this.widget();
    const targetDriver = this.targetDriver;
    const laneFg = this.effectiveValueTextColor;
    const laneBg = this.backgroundColor;

    if (
      this.mainCustomInputs &&
      this.mainCustomInputs.parent === parent &&
      this.mainCustomInputs.isCustomizing === isCustomizing &&
      this.mainCustomInputs.widget?.widgetType === key &&
      this.mainCustomInputs.widget?.customSettings?.["gridLane"] ===
        this.targetIndex &&
      this.mainCustomInputs.widget?.customSettings?.["targetDriver"] ===
        targetDriver &&
      this.mainCustomInputs.widget?.customSettings?.["laneForegroundColor"] ===
        laneFg &&
      this.mainCustomInputs.widget?.customSettings?.["laneBackgroundColor"] ===
        laneBg
    ) {
      return this.mainCustomInputs;
    }

    this.mainCustomInputs = buildSyntheticMainWidgetInputs(
      key,
      w,
      this.bindingMode,
      this.targetIndex,
      parent,
      isCustomizing,
      targetDriver,
      laneFg,
      laneBg,
    );
    return this.mainCustomInputs;
  }
}
