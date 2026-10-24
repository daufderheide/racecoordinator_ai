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
  computeHeatDataLastLaps,
  fitColumnTextValue,
  getInsetDefaultAlignment,
  getInsetDefaultVerticalAlignment,
  getSvgPreserveAspectRatio,
  HeatDataLapItem,
  isCustomWidgetKey,
  isLaneColumnImageProperty,
  resolveColumnHeaderLabel,
  resolveLaneColumnImageUrl,
  resolvePacingBenchmarkType,
  resolvePacingDecimalPlaces,
  resolveTargetDriver,
} from "./raceday-lane-column.utils";
import { isOverallDataSource } from "./raceday-lane-column-driver.helper";
import {
  applyLaneColumnLastLapsFit,
  deleteLaneColumnAnchor,
  dispatchLaneColumnAnchorSelection,
  fitLaneColumnHeaderText,
  formatLaneColumnInsetValue,
  handleLaneColumnAnchorDragEnter,
  handleLaneColumnAnchorDragLeave,
  handleLaneColumnAnchorDragOver,
  handleLaneColumnAnchorDrop,
  handleLaneColumnCardClick,
  handleLaneColumnInsetClick,
  isLaneColumnInsetLapCount,
  isLaneColumnLapCountClickable,
  isLaneColumnPracticeLaneResetActive,
  isLaneColumnTeamDriverSwapActive,
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
  private insetCustomInputs = new Map<string, any>();
  private mainCustomInputsRef: { current?: any } = {};
  readonly avatarHelper = new LaneColumnAvatarHelper();

  cardRef = viewChild<ElementRef<HTMLElement>>("cardElement");
  lastLapsRef = viewChild<ElementRef<HTMLElement>>("lastLapsContainer");
  teammateSelect = viewChild(CustomSelectComponent);
  maxVisibleLaps = signal<number | undefined>(undefined);
  private resizeObserver?: ResizeObserver;
  private cachedWidth = 0;
  private cachedHeight = 0;
  private lastInsetsRef: any = null;
  private lastInsetsKey = "";
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

  private cachedTargetDriver?: DriverHeatData;
  private lastTargetDriverSettings?: LaneColumnWidgetSettings;
  private lastTargetDriverColumnKey?: string;
  private lastTargetDriverParent?: any;
  private lastTargetDriverParticipants?: any;
  private lastTargetDriverDrivers?: any;
  private lastTargetDriverRankings?: any;
  private lastTargetDriverStandings?: any;
  private lastTargetDriverRaceState?: any;
  private lastTargetDriverHeatId?: any;

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
    const w = this.widget()?.width || this.cachedWidth || 0;
    const h = this.widget()?.height || this.cachedHeight || 0;
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
    const parent = this.parent();
    const settings = this.settings;
    const colKey = this.columnKey;
    const drivers =
      parent?.sortedHeatDrivers ||
      parent?.heatDrivers ||
      parent?.heat?.heatDrivers;
    const participants = parent?.participants;
    const rankings = parent?.driverRankings;
    const standings = parent?.heat?.standings;
    const raceState = parent?.raceState;
    const heatId = parent?.heat?.objectId;

    if (
      this.cachedTargetDriver !== undefined &&
      this.lastTargetDriverSettings === settings &&
      this.lastTargetDriverColumnKey === colKey &&
      this.lastTargetDriverParent === parent &&
      this.lastTargetDriverParticipants === participants &&
      this.lastTargetDriverDrivers === drivers &&
      this.lastTargetDriverRankings === rankings &&
      this.lastTargetDriverStandings === standings &&
      this.lastTargetDriverRaceState === raceState &&
      this.lastTargetDriverHeatId === heatId
    ) {
      return this.cachedTargetDriver;
    }

    this.lastTargetDriverSettings = settings;
    this.lastTargetDriverColumnKey = colKey;
    this.lastTargetDriverParent = parent;
    this.lastTargetDriverParticipants = participants;
    this.lastTargetDriverDrivers = drivers;
    this.lastTargetDriverRankings = rankings;
    this.lastTargetDriverStandings = standings;
    this.lastTargetDriverRaceState = raceState;
    this.lastTargetDriverHeatId = heatId;

    this.cachedTargetDriver = resolveTargetDriver(
      settings,
      colKey,
      parent,
      (p) => this.getOrCreateSyntheticDriver(p),
    );
    return this.cachedTargetDriver;
  }

  get isOverallNoDataRow(): boolean {
    const parent = this.parent();
    const isEditor = Boolean(
      (typeof parent?.isUIEditorMode === "function"
        ? parent.isUIEditorMode()
        : parent?.isUIEditorMode) || parent?.isLayoutCustomizing,
    );
    if (isEditor) {
      return false;
    }
    const settings = this.settings;
    if (settings?.isHeaderWidget) {
      return false;
    }
    const bindingMode = settings?.bindingMode || "lane";
    if (!isOverallDataSource(settings, parent, bindingMode)) {
      return false;
    }
    const targetDriver = this.targetDriver;
    return !targetDriver || RacedayFormatUtils.isEmptyDriver(targetDriver);
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

  getInsetHorizontalAlignment(anchor: string): "left" | "center" | "right" {
    const cfg = this.settings.insetsConfig?.[anchor];
    const val = cfg?.horizontalAlignment || cfg?.valueAlignment;
    if (val === "start" || val === "left") return "left";
    if (val === "end" || val === "right") return "right";
    if (val === "center") return "center";
    return getInsetDefaultAlignment(anchor);
  }

  getInsetVerticalAlignment(anchor: string): "top" | "center" | "bottom" {
    const cfg = this.settings.insetsConfig?.[anchor];
    const val = cfg?.verticalAlignment;
    if (val === "top" || val === "center" || val === "bottom") return val;
    return getInsetDefaultVerticalAlignment(anchor);
  }

  getInsetJustifyContent(anchor: string): string {
    const align = this.getInsetHorizontalAlignment(anchor);
    if (align === "left") return "flex-start";
    if (align === "right") return "flex-end";
    return "center";
  }

  getInsetAlignItems(anchor: string): string {
    const align = this.getInsetVerticalAlignment(anchor);
    if (align === "top") return "flex-start";
    if (align === "bottom") return "flex-end";
    return "center";
  }

  getInsetTextAlign(anchor: string): string {
    return this.getInsetHorizontalAlignment(anchor);
  }

  getInsetObjectPosition(anchor: string): string {
    const h = this.getInsetHorizontalAlignment(anchor);
    const v = this.getInsetVerticalAlignment(anchor);
    return `${h} ${v}`;
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
    dispatchLaneColumnAnchorSelection(
      this.parent(),
      this.widget()?.id,
      anchor,
      this.anchorSelected,
    );
  }

  onCenterZoneClick(event: MouseEvent): void {
    if (!this.isUIEditorMode) return;
    event.stopPropagation();
    dispatchLaneColumnAnchorSelection(
      this.parent(),
      this.widget()?.id,
      null,
      this.anchorSelected,
    );
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

  get isGridCellUnselected(): boolean {
    const gridId = this.widget()?.customSettings?.["gridId"];
    if (!gridId) return false;
    const parent = this.parent();
    const session =
      typeof parent?.gridSession === "function" ? parent.gridSession() : null;
    return !session || session.gridId !== gridId;
  }

  get isWidgetInGrid(): boolean {
    return Boolean(this.widget()?.customSettings?.["gridId"]);
  }

  get isSelectedWidget(): boolean {
    const p = this.parent();
    if (!p) return false;
    const selId =
      typeof p.selectedWidgetId === "function"
        ? p.selectedWidgetId()
        : p.selectedWidgetId;
    return Boolean(selId && selId === this.widget()?.id);
  }

  get shouldRenderAnchorDropGrid(): boolean {
    if (!this.isUIEditorMode || this.isGridCellUnselected) {
      return false;
    }
    if (!this.isWidgetInGrid) {
      return true;
    }
    const parent = this.parent();
    if (parent?.draggedWidgetType) {
      return true;
    }
    const selId =
      typeof parent?.selectedWidgetId === "function"
        ? parent.selectedWidgetId()
        : parent?.selectedWidgetId;
    if (!selId) {
      return true;
    }
    return this.isSelectedWidget;
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

    if (this.isHeaderWidget) {
      this.fitHeaderText(cardEl);
      return;
    }

    if (this.isLastLaps()) {
      this.fitLastLaps();
    } else if (!this.isImageProperty() && !this.isPacingProperty()) {
      const text = this.formattedValue?.trim() || "";
      const w = this.cachedWidth || cardEl.clientWidth;
      const h = this.cachedHeight || cardEl.clientHeight;
      let insetsKey = this.lastInsetsKey;
      if (this.settings.insets !== this.lastInsetsRef) {
        this.lastInsetsRef = this.settings.insets;
        insetsKey = JSON.stringify(this.settings.insets || {});
        this.lastInsetsKey = insetsKey;
      }
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
    const explicitW = this.cachedWidth || cardEl.clientWidth;
    const explicitH = this.cachedHeight || cardEl.clientHeight;
    fitLaneColumnHeaderText(
      cardEl,
      this.settings,
      this.widget(),
      this.headerLabel,
      explicitW,
      explicitH,
    );
  }

  private fitTextValue(cardEl: HTMLElement): void {
    const explicitW = this.cachedWidth || cardEl.clientWidth;
    const explicitH = this.cachedHeight || cardEl.clientHeight;
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
      explicitW,
      explicitH,
    );
  }

  private fitLastLaps(): void {
    applyLaneColumnLastLapsFit(
      this.cardRef()?.nativeElement,
      this.settings,
      this.widget(),
      this.getLastLaps().length,
      this.isVerticalLapsFlow,
      (count) => this.maxVisibleLaps.set(count),
    );
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
    return Boolean(
      this.getInsetKey("top-left") ||
      this.getInsetKey("top-center") ||
      this.getInsetKey("top-right"),
    );
  }

  hasBottomInsets(): boolean {
    return Boolean(
      this.getInsetKey("bottom-left") ||
      this.getInsetKey("bottom-center") ||
      this.getInsetKey("bottom-right"),
    );
  }

  hasLeftInsets(): boolean {
    return Boolean(
      this.getInsetKey("top-left") || this.getInsetKey("bottom-left"),
    );
  }

  hasRightInsets(): boolean {
    return Boolean(
      this.getInsetKey("top-right") || this.getInsetKey("bottom-right"),
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
    if (anchor === "center-center") {
      return Boolean(this.columnKey);
    }
    return Boolean(this.settings.insets?.[anchor]);
  }

  onAnchorDragOver(event: DragEvent): void {
    handleLaneColumnAnchorDragOver(
      event,
      this.isUIEditorMode,
      this.isGridCellUnselected,
    );
  }

  onAnchorDragEnter(event: DragEvent): void {
    handleLaneColumnAnchorDragEnter(
      event,
      this.isUIEditorMode,
      this.isGridCellUnselected,
    );
  }

  onAnchorDragLeave(event: DragEvent): void {
    handleLaneColumnAnchorDragLeave(event, this.isUIEditorMode);
  }

  onAnchorDrop(event: DragEvent, anchor: string): void {
    const droppedKey = handleLaneColumnAnchorDrop(
      event,
      anchor,
      this.isUIEditorMode,
      this.isGridCellUnselected,
      this.parent(),
    );
    if (droppedKey) {
      this.setInset(anchor, droppedKey);
    }
  }

  setInset(anchor: string, key: string): void {
    setLaneColumnInset(this.widget(), anchor, key);
    this.notifyChange();
  }

  deleteAnchor(anchor: string, event?: Event): void {
    if (this.isGridCellUnselected) return;
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
