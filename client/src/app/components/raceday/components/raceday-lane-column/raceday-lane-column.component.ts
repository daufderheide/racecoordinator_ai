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
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

import {
  applyColumnInsetsAndPaddings,
  computeHeatDataLastLaps,
  HeatDataLapItem,
  resolvePacingBenchmarkType,
  resolvePacingDecimalPlaces,
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

  protected translationService = inject(TranslationService);

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

  get columnKey(): string {
    return this.settings.columnKey || "lastLapTime";
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
    if (!parent) return undefined;

    const drivers: DriverHeatData[] =
      parent.sortedHeatDrivers ||
      parent.heatDrivers ||
      parent.heat?.heatDrivers ||
      [];

    if (this.bindingMode === "overallPosition") {
      const targetRank = this.targetIndex + 1;
      const participants: any[] = parent.participants || [];
      const match =
        participants.find((p: any) => p.rank === targetRank) ||
        participants[this.targetIndex];
      if (!match) return undefined;
      const activeHeatDriver = drivers.find(
        (d) =>
          d.objectId === match.objectId ||
          d.participant?.objectId === match.objectId,
      );
      return activeHeatDriver || this.getOrCreateSyntheticDriver(match);
    }

    if (this.bindingMode === "seed") {
      const targetSeed = this.targetIndex + 1;
      const participants: any[] = parent.participants || [];
      const match =
        participants.find((p: any) => p.seed === targetSeed) ||
        participants[this.targetIndex];
      if (!match) return undefined;
      const activeHeatDriver = drivers.find(
        (d) =>
          d.objectId === match.objectId ||
          d.participant?.objectId === match.objectId,
      );
      return activeHeatDriver || this.getOrCreateSyntheticDriver(match);
    }

    if (this.bindingMode === "position") {
      const targetRank = this.targetIndex + 1;
      if (parent.driverRankings && parent.driverRankings.size > 0) {
        for (const d of drivers) {
          if (parent.driverRankings.get(d.objectId) === targetRank) {
            return d;
          }
        }
      }
      if (parent.heat?.standings && parent.heat.standings.length > 0) {
        const targetId = parent.heat.standings[this.targetIndex];
        if (targetId) {
          const found = drivers.find((d) => d.objectId === targetId);
          if (found) return found;
        }
      }
      const sortedByRank = [...drivers].sort((a, b) => {
        const rankA = parent.driverRankings?.get(a.objectId) ?? 999;
        const rankB = parent.driverRankings?.get(b.objectId) ?? 999;
        if (rankA !== rankB) return rankA - rankB;

        const lapsA = (a as any).lapCount ?? a.lapTimes?.length ?? 0;
        const lapsB = (b as any).lapCount ?? b.lapTimes?.length ?? 0;
        if (lapsA !== lapsB) return (lapsB as number) - (lapsA as number);

        const timeA = (a as any).totalTime ?? 0;
        const timeB = (b as any).totalTime ?? 0;
        return (timeA as number) - (timeB as number);
      });
      return sortedByRank[this.targetIndex];
    } else {
      return (
        drivers.find((d) => d.laneIndex === this.targetIndex) ||
        drivers[this.targetIndex]
      );
    }
  }

  get backgroundColor(): string {
    if (
      this.settings.useLaneColors === false &&
      this.settings.backgroundColor
    ) {
      return this.settings.backgroundColor;
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
    return trackLaneBg || this.settings.backgroundColor || "transparent";
  }

  get foregroundColor(): string {
    if (this.settings.useLaneColors === false && this.settings.textColor) {
      return this.settings.textColor;
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
    return trackLaneFg || this.settings.textColor || "#ffffff";
  }

  get effectiveHeaderTextColor(): string {
    if (this.settings.headerTextColor) {
      return this.settings.headerTextColor;
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
    if (this.settings.customLabel && this.settings.customLabel.trim()) {
      return this.settings.customLabel;
    }
    const key = this.columnKey;
    const parent = this.parent();
    const labelKey = RacedayLayoutUtils.getLabelKeyForColumn(key);
    const resolvedLabelKey =
      labelKey && labelKey !== "UNKNOWN"
        ? labelKey
        : `RD_COL_${key.toUpperCase()}`;

    if (parent?.getColumnLabel) {
      const colDef = parent.columns?.find(
        (c: any) => c.propertyName === key,
      ) || {
        propertyName: key,
        labelKey: resolvedLabelKey,
      };
      return parent.getColumnLabel(colDef);
    }
    if (labelKey && labelKey !== "UNKNOWN") {
      return this.translationService.translate(labelKey);
    }
    return key;
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
    return raw != null ? String(raw) : "--";
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

    if (this.isLastLaps()) {
      this.fitLastLaps();
    } else if (!this.isImageProperty() && !this.isPacingProperty()) {
      this.fitTextValue(cardEl);
    }
  }

  private fitTextValue(cardEl: HTMLElement): void {
    const text = this.formattedValue?.trim() || "";
    if (!text) return;

    const baseFontSize = this.settings.valueFontSize || 36;
    if (cardEl.clientWidth <= 0 || cardEl.clientHeight <= 0) {
      cardEl.style.setProperty(
        "--lane-col-value-font-size",
        `${baseFontSize}px`,
      );
      cardEl.style.setProperty("--lane-col-pad-left", "0px");
      cardEl.style.setProperty("--lane-col-pad-right", "0px");
      cardEl.style.setProperty("--lane-col-pad-top", "0px");
      cardEl.style.setProperty("--lane-col-pad-bottom", "0px");
      return;
    }

    const isHorizontal = this.layoutOrientation === "horizontal";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontFamily = this.settings.valueFontFamily || "sans-serif";
    ctx.font = `700 ${baseFontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width || 1;

    let availWidth = Math.max(10, cardEl.clientWidth - 24);
    let availHeight = Math.max(10, cardEl.clientHeight);

    if (this.settings.showHeader !== false) {
      if (isHorizontal) {
        const headerEl = cardEl.querySelector(
          ".lane-col-header",
        ) as HTMLElement | null;
        const headerW = headerEl ? headerEl.offsetWidth + 8 : 60;
        availWidth = Math.max(10, availWidth - headerW);
        availHeight = Math.max(10, availHeight - 12);
      } else {
        const headerEl = cardEl.querySelector(
          ".lane-col-header",
        ) as HTMLElement | null;
        const headerH = headerEl
          ? headerEl.offsetHeight
          : (this.settings.headerFontSize || 14) * 1.2;
        availHeight = Math.max(10, availHeight - headerH - 8);
      }
    } else {
      availHeight = Math.max(10, availHeight - 16);
    }

    const dims = this.applyInsetsAndPaddings(cardEl, availWidth, availHeight);
    availWidth = dims.availWidth;
    availHeight = dims.availHeight;

    let scale = 1;
    if (availWidth > 0 && textWidth > availWidth) {
      scale = Math.min(scale, availWidth / textWidth);
    }
    if (availHeight > 0 && baseFontSize > availHeight) {
      scale = Math.min(scale, availHeight / baseFontSize);
    }

    const minSize = 10;
    const targetSize = Math.max(minSize, Math.floor(baseFontSize * scale));
    cardEl.style.setProperty("--lane-col-value-font-size", `${targetSize}px`);
  }

  private applyInsetsAndPaddings(
    cardEl: HTMLElement,
    availWidth: number,
    availHeight: number,
  ): { availWidth: number; availHeight: number } {
    return applyColumnInsetsAndPaddings(
      cardEl,
      availWidth,
      availHeight,
      this.hasLeftInsets(),
      this.hasRightInsets(),
      (anchor) => this.hasInset(anchor),
      this.effectiveInsetFontSize,
    );
  }

  private fitLastLaps(): void {
    const lapsEl = this.lastLapsRef()?.nativeElement;
    if (!lapsEl) return;

    const isHorizontal = this.layoutOrientation === "horizontal";
    if (isHorizontal) {
      const containerW = lapsEl.clientWidth;
      const firstItem = lapsEl.querySelector(
        ".last-lap-item",
      ) as HTMLElement | null;
      const itemW = firstItem ? firstItem.offsetWidth + 8 : 80;
      if (containerW > 0 && itemW > 0) {
        this.maxVisibleLaps.set(Math.max(1, Math.floor(containerW / itemW)));
      }
    } else {
      const containerH = lapsEl.clientHeight;
      const firstItem = lapsEl.querySelector(
        ".last-lap-item",
      ) as HTMLElement | null;
      const itemH = firstItem ? firstItem.offsetHeight + 4 : 26;
      if (containerH > 0 && itemH > 0) {
        this.maxVisibleLaps.set(Math.max(1, Math.floor(containerH / itemH)));
      }
    }
  }

  isImageProperty(key: string = this.columnKey): boolean {
    return (
      key === "driver.avatarUrl" ||
      key === "flag" ||
      key === "qrCode" ||
      key === "driverViewQrCode" ||
      key.startsWith("imageset_")
    );
  }

  getImageUrl(key: string = this.columnKey, anchor?: string): string {
    const parent = this.parent();
    const hd = this.targetDriver;
    if (!parent || !hd) return "";

    if (key === "driver.avatarUrl") {
      const avatarUrl =
        hd.driver?.avatarUrl ||
        (hd.driver as any)?.avatar_url ||
        hd.participant?.driver?.avatarUrl ||
        (hd.participant?.driver as any)?.avatar_url;
      return avatarUrl ? parent.getFullUrl(avatarUrl) : "";
    }
    if (key === "flag") {
      if (parent.formatColumnValue) {
        const colDef = parent.columns?.find((c: any) => c.propertyName === key);
        return parent.formatColumnValue(hd, colDef, key, anchor);
      }
      return parent.getCurrentFlagUrl ? parent.getCurrentFlagUrl() : "";
    }
    if (key === "qrCode") {
      return parent.getLaneQrCodeUrl
        ? parent.getLaneQrCodeUrl(hd.laneIndex)
        : "";
    }
    if (key === "driverViewQrCode") {
      return parent.getDriverViewQrCodeUrl
        ? parent.getDriverViewQrCodeUrl(hd.laneIndex)
        : "";
    }
    if (key.startsWith("imageset_")) {
      const assetId = key.replace("imageset_", "");
      const asset = parent.findAssetById
        ? parent.findAssetById(assetId)
        : undefined;
      return parent.getSelectedImageFromSet
        ? parent.getSelectedImageFromSet(asset, null, hd)
        : "";
    }
    return "";
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

    const insetSettings = {
      ...this.settings,
      timeDecimalPlaces:
        this.settings.insetTimeDecimalPlaces !== undefined
          ? this.settings.insetTimeDecimalPlaces
          : this.settings.timeDecimalPlaces,
      lapDecimalPlaces:
        this.settings.insetLapDecimalPlaces !== undefined
          ? this.settings.insetLapDecimalPlaces
          : this.settings.lapDecimalPlaces,
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
    return raw != null ? String(raw) : "--";
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

    let droppedKey: string | undefined;

    if (event.dataTransfer) {
      try {
        const dataStr = event.dataTransfer.getData("application/json");
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data.type === "new-column" && data.key) {
            droppedKey = data.key;
          } else if (data.key) {
            droppedKey = data.key;
          }
        }
      } catch (_) {}

      if (!droppedKey) {
        const text = event.dataTransfer.getData("text/plain");
        if (text) {
          if (text.startsWith("lane-col:")) {
            droppedKey = text.substring("lane-col:".length);
          } else {
            droppedKey = text;
          }
        }
      }
    }

    const parent = this.parent();
    if (!droppedKey && parent?.draggedWidgetType?.startsWith("lane-col:")) {
      droppedKey = parent.draggedWidgetType.substring("lane-col:".length);
    }

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
}
