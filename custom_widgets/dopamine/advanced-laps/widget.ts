import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./widget.html",
  styleUrls: ["./widget.css"],
})
export class AdvancedLapsComponent extends CustomWidgetBaseComponent {
  get mode(): "heat" | "overall" {
    return this.getSetting("mode", "heat");
  }

  get customLabel(): string {
    return this.getSetting("customLabel", "");
  }

  get decimalPlaces(): number {
    const val =
      this.getSetting("decimalPlaces") ??
      this.getSetting("lapDecimalPlaces") ??
      this.getSetting("lapDecimals") ??
      this.getSetting("decimals") ??
      this.getSetting("insetLapDecimalPlaces");
    if (val !== undefined && val !== null && val !== "") {
      return Math.max(0, Math.min(3, Number(val)));
    }
    return 2;
  }

  get hideSegmentsForFinishingDrivers(): boolean {
    return this.getSetting("hideSegmentsForFinishingDrivers", false);
  }

  get bindingMode(): "lane" | "position" | "overallPosition" | "seed" | "all" {
    return this.getSetting("bindingMode", "lane");
  }

  get targetIndex(): number {
    return Math.max(1, Number(this.getSetting("targetIndex", 1)));
  }

  get showHeader(): boolean {
    return this.getSetting("showHeader", true);
  }

  get isHeaderWidget(): boolean {
    return Boolean(this.getSetting("isHeaderWidget", false));
  }

  get headerBackgroundColor(): string {
    return this.getSetting("headerBackgroundColor", "rgba(68, 68, 68, 0.7)");
  }

  get headerTextColor(): string {
    return this.getSetting("headerTextColor", "#ffffff");
  }

  get headerFontSize(): number {
    return this.getSetting("headerFontSize", 14);
  }

  get headerFontFamily(): string {
    return this.getSetting("headerFontFamily", "");
  }

  get headerAlignment(): string {
    return this.getSetting("headerAlignment", "center");
  }

  get headerJustifyContent(): string {
    const align = this.headerAlignment;
    if (align === "start") return "flex-start";
    if (align === "end") return "flex-end";
    return "center";
  }

  get backgroundColor(): string {
    return this.getSetting("backgroundColor", "#000000");
  }

  get textColor(): string {
    return this.getSetting("textColor", "#ffffff");
  }

  get valueFontSize(): number {
    return this.getSetting("valueFontSize", 36);
  }

  get valueFontFamily(): string {
    return this.getSetting("valueFontFamily", "");
  }

  get valueAlignment(): string {
    return this.getSetting("valueAlignment", "center");
  }

  get showBorder(): boolean {
    return this.getSetting("showBorder", true);
  }

  get borderColor(): string {
    return this.getSetting("borderColor", "");
  }

  get borderWidth(): number {
    return this.getSetting("borderWidth", 1);
  }

  get borderRadius(): number {
    return this.getSetting("borderRadius", 8);
  }

  get useLaneColors(): boolean {
    return Boolean(this.getSetting("useLaneColors", true));
  }

  get cardBackgroundColor(): string {
    if (this.isHeaderWidget) {
      return this.headerBackgroundColor || "rgba(68, 68, 68, 0.7)";
    }
    if (this.useLaneColors) {
      const driver = this.targetDriver;
      const gridLane = this.getSetting("gridLane");
      const fallbackIdx =
        gridLane !== undefined && gridLane !== null
          ? Number(gridLane)
          : this.targetIndex - 1;
      const laneBg = this.getLaneColor(
        driver || fallbackIdx,
        "background_color",
      );
      if (laneBg) return laneBg;
    }
    return this.backgroundColor || "#000000";
  }

  get cardTextColor(): string {
    if (this.isHeaderWidget) {
      return this.headerTextColor || "#ffffff";
    }
    if (this.useLaneColors) {
      const driver = this.targetDriver;
      const gridLane = this.getSetting("gridLane");
      const fallbackIdx =
        gridLane !== undefined && gridLane !== null
          ? Number(gridLane)
          : this.targetIndex - 1;
      const laneFg = this.getLaneColor(
        driver || fallbackIdx,
        "foreground_color",
      );
      if (laneFg) return laneFg;
    }
    return this.textColor || "#ffffff";
  }

  get cardBorderColor(): string {
    return this.borderColor || this.cardTextColor || "#334155";
  }

  get headerLabel(): string {
    const custom = this.customLabel?.trim();
    if (custom) {
      return custom;
    }
    const defaultKey =
      this.mode === "overall" ? "RD_COL_OVERALL_LAP" : "RD_COL_LAP";
    return (
      this.translationService?.translate(defaultKey) ||
      (this.mode === "overall" ? "OVERALL LAPS" : "LAP")
    );
  }


  getEffectiveLaps(driver: any): number {
    if (!driver || this.isEmptyDriver(driver)) return 0;

    const isHeat = this.mode === "heat";
    const hd = driver.heatData || driver;
    const p = driver.participant || (isHeat ? undefined : driver);
    const autoSegments =
      hd.autoCalculatedLaps ?? driver.autoCalculatedLaps ?? 0;

    let baseLaps = 0;
    let fullLaps = 0;

    if (isHeat) {
      const penalty = hd.penaltyLaps ?? driver.penaltyLaps ?? 0;
      const user = hd.userLaps ?? driver.userLaps ?? 0;

      if (hd.adjustedLapCount !== undefined && hd.adjustedLapCount !== null) {
        const rawAdjusted = Number(hd.adjustedLapCount);
        fullLaps = Math.max(0, rawAdjusted);
        baseLaps = Math.max(0, rawAdjusted - autoSegments);
      } else {
        let physical: number | undefined;
        if (typeof hd.physicalLapCount === "number") {
          physical = hd.physicalLapCount;
        } else if (Array.isArray(hd.laps)) {
          physical = hd.laps.length;
        } else if (typeof driver.physicalLapCount === "number") {
          physical = driver.physicalLapCount;
        } else if (Array.isArray(driver.laps)) {
          physical = driver.laps.length;
        }

        const rawLaps =
          physical !== undefined
            ? physical
            : Number(hd.lapCount ?? driver.lapCount ?? 0);
        baseLaps = Math.max(0, rawLaps - penalty + user);
        fullLaps = Math.max(0, baseLaps + autoSegments);
      }
    } else {
      const rawOverall = Number(
        p?.totalLaps ??
          hd.overallLapCount ??
          hd.totalLaps ??
          hd.lapCount ??
          driver.totalLaps ??
          driver.lapCount ??
          0,
      );
      const hasFraction =
        Math.abs(rawOverall - Math.round(rawOverall)) > 1e-5;
      if (hasFraction && autoSegments > 0) {
        fullLaps = Math.max(0, rawOverall);
        baseLaps = Math.max(0, rawOverall - autoSegments);
      } else {
        baseLaps = Math.max(0, rawOverall);
        fullLaps = Math.max(0, baseLaps + autoSegments);
      }
    }

    const isRacing = this.isHeatRacing();
    const isPaused = this.isHeatPaused();
    const hideSegmentsWhileFinishing = this.hideSegmentsForFinishingDrivers;

    let includeAutoSegments = false;
    if (!isRacing) {
      includeAutoSegments = true;
      if (isPaused && hideSegmentsWhileFinishing && this.isAllowFinishLap()) {
        const finished = this.isDriverFinished(driver);
        if (!finished) {
          includeAutoSegments = false;
        }
      }
    }

    const targetLaps = includeAutoSegments ? fullLaps : baseLaps;
    return Math.max(0, targetLaps);
  }

  formatLaps(laps: number, driver?: any): string {
    if (!driver || this.isEmptyDriver(driver)) {
      return "--";
    }

    const hd = driver.heatData || driver;
    const p = driver.participant || driver;
    const hasReaction = (hd?.reactionTime ?? driver?.reactionTime ?? 0) > 0;
    const hasLaps =
      (hd?.lapTimes && hd.lapTimes.length > 0) ||
      (p?.totalTime && p.totalTime > 0) ||
      (hd?.lapCount && hd.lapCount > 0) ||
      (driver?.totalLaps && driver.totalLaps > 0) ||
      (driver?.lapCount && driver.lapCount > 0) ||
      laps > 0;
    const hasAdjustment =
      (hd?.userLaps && hd.userLaps !== 0) ||
      (hd?.penaltyLaps && hd.penaltyLaps !== 0) ||
      (hd?.autoCalculatedLaps && hd.autoCalculatedLaps !== 0) ||
      (driver?.autoCalculatedLaps && driver.autoCalculatedLaps !== 0);

    const dec = this.decimalPlaces;

    if (!hasReaction && !hasLaps && !hasAdjustment && laps === 0) {
      return dec > 0 ? (0).toFixed(dec) : "0";
    }

    if (this.isHeatRacing() && dec === 0) {
      return Math.floor(laps).toString();
    }

    const factor = Math.pow(10, dec);
    const rounded = Math.round((laps + Number.EPSILON) * factor) / factor;
    return rounded.toFixed(dec);
  }

  get activeHeatDrivers(): any[] {
    const list = this.heatDrivers;
    if (list && list.length > 0) {
      return list.filter((d: any) => !this.isEmptyDriver(d));
    }
    const raw =
      this.parent()?.sortedHeatDrivers ||
      this.parent()?.heat?.heatDrivers ||
      this.parent()?.heatDrivers ||
      [];
    return raw.filter((d: any) => !this.isEmptyDriver(d));
  }

  get allDisplayDrivers(): any[] {
    if (this.mode === "overall") {
      const standings = this.driverStandings;
      if (standings && standings.length > 0) {
        return standings.filter((d: any) => !this.isEmptyDriver(d));
      }
      const rawStandings = this.parent()?.driverStandings || [];
      return rawStandings.filter((d: any) => !this.isEmptyDriver(d));
    }
    return this.activeHeatDrivers;
  }

  get targetDriver(): any | undefined {
    const mode = this.bindingMode;
    const gridLane = this.getSetting("gridLane");
    const hasGrid = gridLane !== undefined && gridLane !== null;

    if (mode === "lane") {
      if (hasGrid) {
        const laneIdx = Number(gridLane);
        return this.activeHeatDrivers.find(
          (d: any) => d.laneIndex === laneIdx || d.lane === laneIdx + 1,
        );
      }
      const index = this.targetIndex;
      const targetLaneIndex = index - 1;
      return this.activeHeatDrivers.find(
        (d: any) => d.laneIndex === targetLaneIndex || d.lane === index,
      );
    }

    if (mode === "position") {
      const targetRank = hasGrid ? Number(gridLane) + 1 : this.targetIndex;
      return this.activeHeatDrivers.find((d: any) => d.rank === targetRank);
    }

    if (mode === "overallPosition") {
      const targetRank = hasGrid ? Number(gridLane) + 1 : this.targetIndex;
      return this.allDisplayDrivers.find((d: any) => d.rank === targetRank);
    }

    if (mode === "seed") {
      const targetSeed = hasGrid ? Number(gridLane) + 1 : this.targetIndex;
      const participants = this.participants;
      const match = participants.find((p: any) => p.seed === targetSeed);
      if (match) {
        return (
          this.activeHeatDrivers.find(
            (d: any) =>
              d.driver?.entity_id === match.driver?.entity_id ||
              d.participant?.objectId === match.objectId,
          ) || {
            participant: match,
            driver: match.driver,
            name: match.driver?.name || "Driver",
          }
        );
      }
    }

    return this.activeHeatDrivers[0];
  }

  get formattedTargetValue(): string {
    const driver = this.targetDriver;
    if (!driver || this.isEmptyDriver(driver)) {
      return "--";
    }
    return this.formatLaps(this.getEffectiveLaps(driver), driver);
  }

  get isClickable(): boolean {
    return !this.isCustomizing() && Boolean(this.parent()?.onCellClick);
  }

  onLapClick(event: MouseEvent, driver: any): void {
    if (this.isCustomizing() || !driver) return;
    const parent = this.parent();
    if (parent?.onCellClick) {
      event.stopPropagation();
      const hd = driver.heatData || driver;
      const key = this.mode === "overall" ? "overallLapCount" : "lapCount";
      parent.onCellClick(hd, { propertyName: key }, event);
    }
  }

  override getLaneColor(
    driver: any,
    property: "background_color" | "foreground_color" = "background_color",
  ): string {
    return super.getLaneColor(driver, property);
  }

  getDriverLaneLabel(driver: any): string {
    const lane =
      driver?.lane ?? (driver?.laneIndex !== undefined ? driver.laneIndex + 1 : 1);
    return `L${lane}`;
  }

  trackByDriver(index: number, driver: any): any {
    return driver?.driver?.entity_id || driver?.participant?.objectId || index;
  }
}
