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
import { RacedayGhostPacingComponent } from "@app/components/raceday/components/raceday-ghost-pacing/raceday-ghost-pacing.component";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

export interface HeatDataLapItem {
  lapNumber: number;
  lapTime: string;
  isBest: boolean;
  segments: string[];
}

@Component({
  standalone: true,
  selector: "app-raceday-lane-column",
  templateUrl: "./raceday-lane-column.component.html",
  styleUrls: ["./raceday-lane-column.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe, RacedayGhostPacingComponent],
})
export class RacedayLaneColumnComponent
  implements AfterViewInit, AfterViewChecked, OnDestroy
{
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  protected translationService = inject(TranslationService);

  cardRef = viewChild<ElementRef<HTMLElement>>("cardElement");
  lastLapsRef = viewChild<ElementRef<HTMLElement>>("lastLapsContainer");
  maxVisibleLaps = signal<number | undefined>(undefined);
  private resizeObserver?: ResizeObserver;
  private lastFittedText = "";
  private lastFittedWidth = 0;
  private lastFittedHeight = 0;

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
    if (
      w > 0 &&
      h > 0 &&
      (text !== this.lastFittedText ||
        w !== this.lastFittedWidth ||
        h !== this.lastFittedHeight)
    ) {
      this.lastFittedText = text;
      this.lastFittedWidth = w;
      this.lastFittedHeight = h;
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

  get bindingMode(): "lane" | "position" {
    return this.settings.bindingMode || "lane";
  }

  get targetIndex(): number {
    return this.settings.targetIndex ?? 0;
  }

  get layoutOrientation(): "vertical" | "horizontal" {
    return this.settings.layoutOrientation || "vertical";
  }

  get targetDriver(): DriverHeatData | undefined {
    const parent = this.parent();
    if (!parent) return undefined;

    const drivers: DriverHeatData[] =
      parent.sortedHeatDrivers ||
      parent.heatDrivers ||
      parent.heat?.heatDrivers ||
      [];

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
    const trackLaneBg = track?.lanes?.[laneIdx]?.background_color;
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
    const trackLaneFg = track?.lanes?.[laneIdx]?.foreground_color;
    return trackLaneFg || this.settings.textColor || "#ffffff";
  }

  get effectiveHeaderTextColor(): string {
    if (this.settings.useLaneColors !== false) {
      return this.foregroundColor;
    }
    return (
      this.settings.headerTextColor ||
      this.settings.textColor ||
      this.foregroundColor
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
      );
    }

    const raw = RacedayFormatUtils.getPropertyValue(hd, key);
    return raw != null ? String(raw) : "--";
  }

  isLastLaps(): boolean {
    return this.columnKey === "lastLaps";
  }

  getLastLaps(): HeatDataLapItem[] {
    const hd = this.targetDriver;
    if (!hd) return [];

    const laps = hd.lapTimes || [];
    const lapsDetails = hd.lapsWithDetails || [];
    const n = laps.length;

    if (n > 0) {
      const decimals =
        this.settings.timeDecimalPlaces !== undefined
          ? Number(this.settings.timeDecimalPlaces)
          : 3;
      const bestTime = hd.bestLapTime || 0;

      const result: HeatDataLapItem[] = [];
      for (let i = n - 1; i >= 0; i--) {
        const val = laps[i] || 0;
        if (val <= 0) continue;

        const formattedLapTime = val.toFixed(decimals);
        const isBest = bestTime > 0 && Math.abs(val - bestTime) < 0.0001;

        const segments: string[] = [];
        const detail = lapsDetails[i];
        if (detail?.segments && detail.segments.length > 0) {
          for (const seg of detail.segments) {
            if (seg > 0) {
              segments.push(seg.toFixed(decimals));
            }
          }
        }

        result.push({
          lapNumber: i + 1,
          lapTime: formattedLapTime,
          isBest,
          segments,
        });
      }
      return result;
    }

    const parent = this.parent();
    if (parent?.getLastLaps) {
      const colDef = parent.columns?.find(
        (c: any) => c.propertyName === "lastLaps",
      );
      const parentLaps = parent.getLastLaps(hd, colDef, "center-center") || [];
      return parentLaps.map((l: any, idx: number) => ({
        lapNumber: l.lapNumber ?? idx + 1,
        lapTime: l.lapTime ?? "--",
        isBest: Boolean(l.isBest),
        segments: l.segments ?? [],
      }));
    }

    return [];
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
    let availHeight = Math.max(10, cardEl.clientHeight - 16);

    if (this.settings.showHeader !== false) {
      if (isHorizontal) {
        const headerEl = cardEl.querySelector(
          ".lane-col-header",
        ) as HTMLElement | null;
        const headerW = headerEl ? headerEl.offsetWidth + 12 : 60;
        availWidth = Math.max(10, availWidth - headerW);
      } else {
        const headerEl = cardEl.querySelector(
          ".lane-col-header",
        ) as HTMLElement | null;
        const headerH = headerEl
          ? headerEl.offsetHeight
          : (this.settings.headerFontSize || 14) * 1.5;
        availHeight = Math.max(10, availHeight - headerH);
      }
    }

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

  isImageProperty(): boolean {
    const key = this.columnKey;
    return (
      key === "driver.avatarUrl" ||
      key === "flag" ||
      key === "qrCode" ||
      key === "driverViewQrCode" ||
      key.startsWith("imageset_")
    );
  }

  getImageUrl(): string {
    const parent = this.parent();
    const hd = this.targetDriver;
    const key = this.columnKey;
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

  isPacingProperty(): boolean {
    return RacedayLayoutUtils.isPacingProperty(this.columnKey);
  }

  getPacingBenchmarkType(): GhostBenchmarkType {
    switch (this.columnKey) {
      case "ghostPacingPB":
        return "PERSONAL_BEST";
      case "ghostPacingPersonalAvg":
        return "PERSONAL_AVG";
      case "ghostPacingPersonalMedian":
        return "PERSONAL_MEDIAN";
      case "ghostPacingLeaderAvg":
        return "HEAT_LEADER_AVG";
      case "ghostPacingLeaderMedian":
        return "HEAT_LEADER_MEDIAN";
      case "ghostPacingLeaderBest":
        return "HEAT_LEADER";
      case "ghostPacing":
      default:
        return "LANE_RECORD";
    }
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
