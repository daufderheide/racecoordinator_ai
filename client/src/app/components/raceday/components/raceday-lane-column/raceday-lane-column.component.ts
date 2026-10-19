import { CommonModule } from "@angular/common";
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  effect,
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
import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { RacedayGhostPacingComponent } from "@app/components/raceday/components/raceday-ghost-pacing/raceday-ghost-pacing.component";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { Role } from "@app/models/role";
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

  constructor() {
    effect(() => {
      this.widget();
      this.parent();
      setTimeout(() => this.fitContent(), 0);
    });
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
  }

  ngAfterViewChecked(): void {
    if (
      this.isHeaderWidget ||
      this.isLastLaps() ||
      this.isImageProperty() ||
      this.isPacingProperty()
    ) {
      return;
    }
    const cardEl = this.cardRef()?.nativeElement;
    if (!cardEl) return;
    const text = this.formattedValue?.trim() || "";
    const w = cardEl.clientWidth;
    const h = cardEl.clientHeight;
    const insetsKey = JSON.stringify(this.settings.insets || {});
    if (
      w > 0 &&
      h > 0 &&
      (text !== this.lastFittedText ||
        w !== this.lastFittedWidth ||
        h !== this.lastFittedHeight ||
        insetsKey !== this.lastFittedInsets)
    ) {
      this.lastFittedText = text;
      this.lastFittedWidth = w;
      this.lastFittedHeight = h;
      this.lastFittedInsets = insetsKey;
      this.fitTextValue(cardEl);
    }
  }

  ngOnDestroy(): void {
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
    if (this.settings.useLaneColors === false) {
      return this.settings.backgroundColor || "#000000";
    }
    const hd = this.targetDriver;
    const parent = this.parent();
    if (hd && parent?.getLaneColor) {
      const bg = parent.getLaneColor(hd, "background_color");
      if (bg) return bg;
    }
    const laneIdx =
      hd?.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : 0);
    const track =
      parent?.track ||
      parent?.race?.track ||
      parent?.raceService?.getRace()?.track;
    const trackLaneBg =
      laneIdx >= 0 ? track?.lanes?.[laneIdx]?.background_color : undefined;
    return trackLaneBg || "transparent";
  }

  get foregroundColor(): string {
    if (this.isHeaderWidget) {
      return this.effectiveHeaderTextColor;
    }
    if (this.settings.useLaneColors === false) {
      return this.settings.textColor || "#ffffff";
    }
    const hd = this.targetDriver;
    const parent = this.parent();
    if (hd && parent?.getLaneColor) {
      const fg = parent.getLaneColor(hd, "foreground_color");
      if (fg) return fg;
    }
    const laneIdx =
      hd?.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : 0);
    const track =
      parent?.track ||
      parent?.race?.track ||
      parent?.raceService?.getRace()?.track;
    const trackLaneFg =
      laneIdx >= 0 ? track?.lanes?.[laneIdx]?.foreground_color : undefined;
    return trackLaneFg || "#ffffff";
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
    const custom = this.settings.headerFontSize;
    if (this.widget()?.scaleMode === "auto") {
      const cardEl = this.cardRef()?.nativeElement;
      const cardH = cardEl?.clientHeight || 0;
      if (cardH > 0) {
        const autoSize = Math.round(cardH * 0.18);
        return Math.max(10, Math.min(28, autoSize));
      }
    }
    return custom && custom > 0 ? custom : 14;
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
    const p = this.parent();
    const hd = this.targetDriver;
    if (!p || !hd) return false;
    if (this.isUIEditorMode) return false;
    if (p.isLapCountColumnClickable) {
      return p.isLapCountColumnClickable(hd, {
        propertyName: this.columnKey,
      } as ColumnDefinition);
    }
    return (
      this.columnKey === "lapCount" ||
      this.columnKey === "physicalLapCount" ||
      this.columnKey === "totalTime" ||
      this.columnKey === "overallTotalTime"
    );
  }

  get isTeamDriverSwapActive(): boolean {
    const p = this.parent();
    const hd = this.targetDriver;
    if (!p || !hd) return false;
    if (this.isUIEditorMode) return false;
    if (p.isTeamDriverSwapActive) {
      return p.isTeamDriverSwapActive(hd, {
        propertyName: this.columnKey,
      } as ColumnDefinition);
    }
    const baseKey = (this.columnKey || "").split("_")[0];
    const isTeamOrName =
      (p.isNameProperty ? p.isNameProperty(this.columnKey) : false) ||
      this.columnKey === "driver.name" ||
      this.columnKey === "driver.nickname" ||
      baseKey === "participant.team.name";
    if (!isTeamOrName) return false;
    if (!p.isTeam?.(hd) || p.isDriverSwapDisabled?.(hd)) return false;
    if (p.authService?.currentRole === Role.VIEWER) return false;
    return true;
  }

  get isPracticeLaneResetActive(): boolean {
    const p = this.parent();
    if (!p) return false;
    if (this.isUIEditorMode) return false;
    if (!p.race?.practice) return false;
    if (p.authService?.currentRole === Role.VIEWER) return false;
    const isName = p.isNameProperty
      ? p.isNameProperty(this.columnKey)
      : this.columnKey === "driver.name" ||
        this.columnKey === "driver.nickname";
    return Boolean(isName || this.columnKey === "laneNumber");
  }

  get cardTooltip(): string | null {
    if (this.isUIEditorMode) return null;
    if (this.isLapCountClickable) {
      return this.translationService.translate("RD_LAP_COLUMN_TOOLTIP");
    }
    if (this.isTeamDriverSwapActive) {
      const p = this.parent();
      return this.translationService.translate(
        p?.race?.practice
          ? "RD_PRACTICE_DRIVER_TOOLTIP"
          : "RD_TEAM_DRIVER_TOOLTIP",
      );
    }
    return null;
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
    if (this.isUIEditorMode) return false;
    const key = this.getInsetKey(anchor);
    return (
      key === "lapCount" ||
      key === "physicalLapCount" ||
      key === "totalTime" ||
      key === "overallTotalTime"
    );
  }

  onInsetClick(anchor: string, event: MouseEvent): void {
    if (this.isUIEditorMode) return;
    const key = this.getInsetKey(anchor);
    if (
      key === "lapCount" ||
      key === "physicalLapCount" ||
      key === "totalTime" ||
      key === "overallTotalTime"
    ) {
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
      hd.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : 0);
    p.resetLane?.(lane, event);
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

  fitContent(): void {
    const cardEl = this.cardRef()?.nativeElement;
    if (!cardEl) return;

    if (this.isHeaderWidget) {
      this.fitHeaderText(cardEl);
      return;
    }

    if (this.isLastLaps()) {
      this.fitLastLaps();
    } else if (!this.isImageProperty() && !this.isPacingProperty()) {
      this.lastFittedText = this.formattedValue?.trim() || "";
      this.lastFittedWidth = cardEl.clientWidth;
      this.lastFittedHeight = cardEl.clientHeight;
      this.lastFittedInsets = JSON.stringify(this.settings.insets || {});
      this.fitTextValue(cardEl);
    }
  }

  private fitHeaderText(cardEl: HTMLElement): void {
    const headerEl = cardEl.querySelector(
      ".lane-col-header",
    ) as HTMLElement | null;
    if (!headerEl) return;

    const baseFontSize = Number(
      this.settings.headerFontSize ||
        (this.widget()?.fontSize ? this.widget()!.fontSize : 24),
    );
    const availWidth = Math.max(10, cardEl.clientWidth - 16);
    const availHeight = Math.max(10, cardEl.clientHeight - 8);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const family =
      this.settings.headerFontFamily ||
      (typeof window !== "undefined" && window.getComputedStyle
        ? window.getComputedStyle(headerEl).fontFamily
        : "") ||
      "sans-serif";
    ctx.font = `700 ${baseFontSize}px ${family}`;
    const textWidth = ctx.measureText(this.headerLabel || "").width || 1;

    let scale = 1.0;
    if (textWidth > availWidth) {
      scale = Math.min(scale, availWidth / textWidth);
    }
    if (baseFontSize > availHeight) {
      scale = Math.min(scale, availHeight / baseFontSize);
    }

    const fittedSize = Math.max(10, Math.floor(baseFontSize * scale));
    headerEl.style.fontSize = `${fittedSize}px`;
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

  isImageProperty(key: string = this.columnKey): boolean {
    return isLaneColumnImageProperty(key);
  }

  getImageUrl(key: string = this.columnKey, anchor?: string): string {
    return resolveLaneColumnImageUrl(
      key,
      this.targetDriver,
      this.parent(),
      anchor,
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
    const custom = this.settings.insetFontSize;
    if (this.widget()?.scaleMode === "auto") {
      const cardEl = this.cardRef()?.nativeElement;
      const cardH = cardEl?.clientHeight || 0;
      if (cardH > 0) {
        // In auto mode, scale proportionally with card height: ~28% of height, clamped between 14px and 24px
        const autoSize = Math.round(cardH * 0.28);
        return Math.max(14, Math.min(24, autoSize));
      }
    }
    return custom && custom > 0 ? custom : 18;
  }

  getInsetValue(anchor: string): string {
    const key = this.getInsetKey(anchor);
    if (!key) return "";
    const hd = this.targetDriver;
    const parent = this.parent();
    if (!hd) return "--";

    const anchorCfg = this.settings.insetsConfig?.[anchor];
    const insetTimeDec =
      anchorCfg?.timeDecimalPlaces !== undefined
        ? anchorCfg.timeDecimalPlaces
        : 3;
    const insetLapDec =
      anchorCfg?.lapDecimalPlaces !== undefined
        ? anchorCfg.lapDecimalPlaces
        : 2;
    const insetDec =
      anchorCfg?.decimalPlaces !== undefined
        ? anchorCfg.decimalPlaces
        : undefined;

    const insetSettings: any = {
      insetTimeDecimalPlaces: insetTimeDec,
      insetLapDecimalPlaces: insetLapDec,
      timeDecimalPlaces: insetTimeDec,
      lapDecimalPlaces: insetLapDec,
      columnDecimals: insetDec !== undefined ? { [key]: insetDec } : {},
      timeDisplayFormat: anchorCfg?.timeDisplayFormat || "dynamic",
      timeSubsecondMode: anchorCfg?.timeSubsecondMode || "never",
      timeSubsecondThreshold: anchorCfg?.timeSubsecondThreshold ?? 10,
      timeSubsecondDecimals: anchorCfg?.timeSubsecondDecimals ?? 2,
    };

    if (parent?.formatValue) {
      const colDef = parent.columns?.find((c: any) => c.propertyName === key);
      return parent.formatValue(
        key,
        RacedayFormatUtils.getPropertyValue(hd, key),
        hd,
        colDef,
        anchor,
        insetSettings,
      );
    }

    const raw = RacedayFormatUtils.getPropertyValue(hd, key);
    return formatAdjustedLapValue(raw, hd, key);
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
    const w = this.widget();
    if (!w) return;
    if (!w.customSettings) {
      w.customSettings = {} as LaneColumnWidgetSettings;
    }
    const s = w.customSettings as LaneColumnWidgetSettings;
    if (anchor === "center-center") {
      s.columnKey = key;
    } else {
      if (!s.insets) {
        s.insets = {};
      }
      s.insets[anchor] = key;
    }
    this.notifyChange();
  }

  deleteAnchor(anchor: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const w = this.widget();
    if (!w || !w.customSettings) return;
    const s = w.customSettings as LaneColumnWidgetSettings;
    if (anchor === "center-center") {
      return;
    }
    if (s.insets && s.insets[anchor]) {
      delete s.insets[anchor];
    }
    if (s.insetsConfig && s.insetsConfig[anchor]) {
      delete s.insetsConfig[anchor];
    }
    const p = this.parent();
    if (p?.selectedAnchor?.() === anchor || this.selectedAnchor() === anchor) {
      if (p?.selectAnchor) {
        p.selectAnchor(w.id, null);
      }
      this.anchorSelected.emit({ widgetId: w.id, anchor: null });
    }
    this.notifyChange();
  }

  private notifyChange(): void {
    const p = this.parent();
    if (p) {
      if (p.gridSession?.() && p.onMasterWidgetModified) {
        p.onMasterWidgetModified(this.widget());
      }
      if (p.layoutChanged?.emit && p.layout) {
        p.layoutChanged.emit(p.layout);
      }
      if (p.markLayoutDirty) {
        p.markLayoutDirty();
      }
      if (p.columnsChanged?.emit) {
        p.columnsChanged.emit();
      }
      if (p.onWidgetSettingsChanged) {
        p.onWidgetSettingsChanged(this.widget());
      }
      if (p.cdr?.markForCheck) {
        p.cdr.markForCheck();
      }
    }
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
