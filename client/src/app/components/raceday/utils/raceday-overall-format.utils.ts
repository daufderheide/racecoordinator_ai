import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

import { FormatContext, RacedayFormatUtils } from "./raceday-format.utils";
import { RacedayGapFormatUtils } from "./raceday-gap-format.utils";
import { RacedayLayoutUtils } from "./raceday-layout.utils";

export class RacedayOverallFormatUtils {
  static isOverallFormatContext(
    ctx: FormatContext,
    propertyName: string,
  ): boolean {
    const s = ctx.laneViewWidgetSettings;
    return Boolean(
      s?.gridType === "overall" ||
      s?.bindingMode === "overallPosition" ||
      RacedayLayoutUtils.isOverallColumnKey(propertyName),
    );
  }

  static isOverallOrSeedFormatContext(
    ctx: FormatContext,
    propertyName: string,
  ): boolean {
    const s = ctx.laneViewWidgetSettings;
    return Boolean(
      this.isOverallFormatContext(ctx, propertyName) ||
      s?.bindingMode === "seed",
    );
  }

  static extractOverallPropertyValue(
    p: any,
    heatDriver: any,
    baseKey: string,
    settings?: any,
    anchor?: string,
  ): any {
    const timingVal = this.extractTimingProperty(p, heatDriver, baseKey);
    if (timingVal !== undefined) return timingVal;

    const lapVal = this.extractLapProperty(p, heatDriver, baseKey);
    if (lapVal !== undefined) return lapVal;

    const gapVal = this.extractGapProperty(
      p,
      heatDriver,
      baseKey,
      settings,
      anchor,
    );
    if (gapVal !== undefined) return gapVal;

    return this.extractOtherProperty(p, heatDriver, baseKey);
  }

  private static extractTimingProperty(p: any, hd: any, baseKey: string): any {
    switch (baseKey) {
      case "overallTotalTime":
        return p?.totalTime ?? hd?.totalTime ?? hd?.overallTotalTime;
      case "overallBestLapTime":
        return p?.bestLapTime ?? hd?.bestLapTime ?? hd?.overallBestLapTime;
      case "overallAverageLapTime":
        return (
          p?.averageLapTime ?? hd?.averageLapTime ?? hd?.overallAverageLapTime
        );
      case "overallMedianLapTime":
        return (
          p?.medianLapTime ?? hd?.medianLapTime ?? hd?.overallMedianLapTime
        );
      case "overallConsistencyScore":
        return (
          p?.consistencyScore ??
          hd?.consistencyScore ??
          hd?.overallConsistencyScore
        );
      case "overallStandardDeviation":
        return (
          p?.standardDeviation ??
          hd?.standardDeviation ??
          hd?.overallStandardDeviation
        );
      case "overallAverageTop5":
        return p?.averageTop5 ?? hd?.averageTop5 ?? hd?.overallAverageTop5;
      case "overallAverageTop10":
        return p?.averageTop10 ?? hd?.averageTop10 ?? hd?.overallAverageTop10;
      case "overallAverageTop15":
        return p?.averageTop15 ?? hd?.averageTop15 ?? hd?.overallAverageTop15;
      case "overallTop2Consecutive":
        return (
          p?.top2Consecutive ??
          hd?.top2Consecutive ??
          hd?.overallTop2Consecutive
        );
      case "overallTop3Consecutive":
        return (
          p?.top3Consecutive ??
          hd?.top3Consecutive ??
          hd?.overallTop3Consecutive
        );
      default:
        return undefined;
    }
  }

  private static extractLapProperty(p: any, hd: any, baseKey: string): any {
    switch (baseKey) {
      case "overallLapCount":
      case "totalLaps":
      case "raceTotalLaps":
      case "overallTotalLaps":
        return (
          p?.totalLaps ?? hd?.totalLaps ?? hd?.overallLapCount ?? hd?.lapCount
        );
      case "overallPhysicalLapCount":
        return (
          p?.physicalLapCount ??
          hd?.physicalLapCount ??
          hd?.overallPhysicalLapCount
        );
      case "overallLapsLed":
        return p?.lapsLed ?? hd?.lapsLed ?? hd?.overallLapsLed;
      default:
        return undefined;
    }
  }

  private static extractGapProperty(
    p: any,
    hd: any,
    baseKey: string,
    settings?: any,
    anchor?: string,
  ): any {
    switch (baseKey) {
      case "overallGap": {
        const config =
          anchor &&
          anchor !== "center-center" &&
          settings?.insetsConfig?.[anchor]
            ? settings.insetsConfig[anchor]
            : settings;
        const target = config?.gapTarget || "leader";
        const mode = config?.gapMode || "always_time";
        if (target === "position") {
          if (mode === "always_laps") {
            return (
              p?.gapPositionLaps ??
              hd?.gapPositionLaps ??
              hd?.overallGapPositionLaps
            );
          }
          if (mode === "laps_and_time") {
            return (
              p?.gapPositionF1 ?? hd?.gapPositionF1 ?? hd?.overallGapPositionF1
            );
          }
          return p?.gapPosition ?? hd?.gapPosition ?? hd?.overallGapPosition;
        } else {
          if (mode === "always_laps") {
            return (
              p?.gapLeaderLaps ?? hd?.gapLeaderLaps ?? hd?.overallGapLeaderLaps
            );
          }
          if (mode === "laps_and_time") {
            return p?.gapLeaderF1 ?? hd?.gapLeaderF1 ?? hd?.overallGapLeaderF1;
          }
          return p?.gapLeader ?? hd?.gapLeader ?? hd?.overallGapLeader;
        }
      }
      case "overallGapLeader":
        return p?.gapLeader ?? hd?.gapLeader ?? hd?.overallGapLeader;
      case "overallGapPosition":
        return p?.gapPosition ?? hd?.gapPosition ?? hd?.overallGapPosition;
      case "overallGapLeaderF1":
        return p?.gapLeaderF1 ?? hd?.gapLeaderF1 ?? hd?.overallGapLeaderF1;
      case "overallGapPositionF1":
        return (
          p?.gapPositionF1 ?? hd?.gapPositionF1 ?? hd?.overallGapPositionF1
        );
      default:
        return undefined;
    }
  }

  private static extractOtherProperty(p: any, hd: any, baseKey: string): any {
    switch (baseKey) {
      case "overallTrackCalls":
        return p?.trackCalls ?? hd?.trackCalls ?? hd?.overallTrackCalls;
      case "overallPoints":
        return p?.totalPoints ?? hd?.totalPoints ?? hd?.overallPoints;
      case "heatsRaced":
      case "overallHeatsRaced":
        return p?.heatsRaced ?? hd?.heatsRaced ?? hd?.overallHeatsRaced;
      case "heatsRemaining":
      case "overallHeatsRemaining":
        return (
          p?.heatsRemaining ?? hd?.heatsRemaining ?? hd?.overallHeatsRemaining
        );
      case "totalHeats":
      case "overallTotalHeats":
        return p?.totalHeats ?? hd?.totalHeats ?? hd?.overallTotalHeats;
      default:
        return undefined;
    }
  }

  static formatOverallValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    timePlaceholder: string,
    lapPlaceholder: string,
    timeDecimals: number,
    lapDecimals: number,
    colKey?: string,
    isInset?: boolean,
    column?: ColumnDefinition | any,
    anchor?: string,
  ): string | null {
    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      return this.formatOverallEmptyDriver(
        baseKey,
        timePlaceholder,
        lapPlaceholder,
        ctx,
        anchor,
      );
    }

    const timingResult = this.formatOverallTimingValue(
      baseKey,
      value,
      ctx,
      timePlaceholder,
      timeDecimals,
      colKey,
      isInset,
    );
    if (timingResult !== null) return timingResult;

    if (baseKey === "overallConsistencyScore") {
      if (value === null || value === undefined) return "--.-%";
      return value.toFixed(1) + "%";
    }

    const gapResult = this.formatOverallGapValue(
      baseKey,
      value,
      hd,
      ctx,
      timePlaceholder,
      lapPlaceholder,
      timeDecimals,
      lapDecimals,
      anchor,
    );
    if (gapResult !== null) return gapResult;

    const lapResult = this.formatOverallLapValue(
      baseKey,
      value,
      hd,
      ctx,
      lapPlaceholder,
      lapDecimals,
    );
    if (lapResult !== null) return lapResult;

    const statsResult = this.formatOverallStatsValue(baseKey, value, hd);
    if (statsResult !== null) return statsResult;

    if (baseKey === "heatsRaced" || baseKey === "heatsRemaining") {
      return this.formatOverallHeatsValue(baseKey, hd, ctx, column);
    }

    return null;
  }

  private static formatOverallEmptyDriver(
    baseKey: string,
    timePlaceholder: string,
    lapPlaceholder: string,
    ctx?: FormatContext,
    anchor?: string,
  ): string | null {
    if (
      baseKey === "overallPhysicalLapCount" ||
      baseKey === "overallLapsLed" ||
      baseKey === "overallTrackCalls" ||
      baseKey === "overallPoints" ||
      baseKey === "heatsRaced" ||
      baseKey === "heatsRemaining"
    ) {
      return "--";
    }
    if (baseKey === "overallGap") {
      const s = ctx?.laneViewWidgetSettings;
      const config =
        anchor && anchor !== "center-center" && s?.insetsConfig?.[anchor]
          ? s.insetsConfig[anchor]
          : s;
      if (config?.gapMode === "always_laps") {
        return lapPlaceholder;
      }
      return timePlaceholder;
    }
    if (
      baseKey === "overallTotalTime" ||
      baseKey === "overallBestLapTime" ||
      baseKey === "overallAverageLapTime" ||
      baseKey === "overallMedianLapTime" ||
      baseKey === "overallStandardDeviation" ||
      baseKey === "overallAverageTop5" ||
      baseKey === "overallAverageTop10" ||
      baseKey === "overallAverageTop15" ||
      baseKey === "overallTop2Consecutive" ||
      baseKey === "overallTop3Consecutive" ||
      baseKey === "overallGapLeader" ||
      baseKey === "overallGapPosition" ||
      baseKey === "overallGapLeaderF1" ||
      baseKey === "overallGapPositionF1"
    ) {
      return timePlaceholder;
    }
    if (baseKey === "overallConsistencyScore") {
      return "--.-%";
    }
    if (
      baseKey === "overallLapCount" ||
      baseKey === "totalLaps" ||
      baseKey === "raceTotalLaps" ||
      baseKey === "overallTotalLaps"
    ) {
      return lapPlaceholder;
    }
    return null;
  }

  private static formatOverallTimingValue(
    baseKey: string,
    value: any,
    ctx: FormatContext,
    timePlaceholder: string,
    timeDecimals: number,
    colKey?: string,
    isInset?: boolean,
  ): string | null {
    if (
      baseKey === "overallBestLapTime" ||
      baseKey === "overallAverageLapTime" ||
      baseKey === "overallMedianLapTime" ||
      baseKey === "overallTotalTime" ||
      baseKey === "overallStandardDeviation" ||
      baseKey === "overallAverageTop5" ||
      baseKey === "overallAverageTop10" ||
      baseKey === "overallAverageTop15" ||
      baseKey === "overallTop2Consecutive" ||
      baseKey === "overallTop3Consecutive"
    ) {
      const isStdDev = baseKey === "overallStandardDeviation";
      const isValid =
        value !== null &&
        value !== undefined &&
        (isStdDev ? value >= 0 : value > 0);
      if (isValid && baseKey === "overallTotalTime") {
        const timerOpts = RacedayFormatUtils.resolveTimerFormatOptions(
          colKey || baseKey,
          ctx.laneViewWidgetSettings,
          isInset,
          timeDecimals,
          baseKey,
        );
        if (timerOpts) {
          return formatTimerDisplay(value, timerOpts);
        }
      }
      return isValid ? value.toFixed(timeDecimals) : timePlaceholder;
    }
    return null;
  }

  static hasOverallData(hd: DriverHeatData | any): boolean {
    if (!hd || RacedayFormatUtils.isEmptyDriver(hd)) return false;
    const p = hd.participant ?? hd;
    const hasLaps =
      (p.totalLaps ?? p.total_laps ?? 0) > 0 ||
      (p.physicalLapCount ?? p.physical_lap_count ?? 0) > 0;
    const hasTime =
      (p.totalTime ?? p.total_time ?? 0) > 0 ||
      (p.bestLapTime ?? p.best_lap_time ?? 0) > 0 ||
      (p.averageLapTime ?? p.average_lap_time ?? 0) > 0;
    const hasHeats =
      (p.heatsRaced ?? p.heats_raced ?? 0) > 0 ||
      (p.lapsLed ?? p.laps_led ?? 0) > 0;
    return hasLaps || hasTime || hasHeats || RacedayFormatUtils.hasHeatData(hd);
  }

  private static formatOverallGapValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    timePlaceholder: string,
    lapPlaceholder: string,
    timeDecimals: number,
    lapDecimals: number,
    anchor?: string,
  ): string | null {
    return RacedayGapFormatUtils.formatOverallGapValue(
      baseKey,
      value,
      hd,
      ctx,
      timePlaceholder,
      lapPlaceholder,
      timeDecimals,
      lapDecimals,
      this.hasOverallData(hd),
      anchor,
    );
  }

  private static formatOverallLapValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    lapPlaceholder: string,
    lapDecimals: number,
  ): string | null {
    if (
      baseKey === "overallLapCount" ||
      baseKey === "totalLaps" ||
      baseKey === "raceTotalLaps" ||
      baseKey === "overallTotalLaps"
    ) {
      const p = hd?.participant;
      const hasCompleted = p?.totalTime && p.totalTime > 0;
      if (
        value === null ||
        value === undefined ||
        (value === 0 && !hasCompleted)
      ) {
        return lapPlaceholder;
      }
      let lapVal = Number(value);
      const isOver = RacedayFormatUtils.isHeatOrRaceOver(ctx, hd);
      if (!isOver && (hd?.autoCalculatedLaps || 0) > 0) {
        lapVal =
          Math.round((lapVal - hd.autoCalculatedLaps + Number.EPSILON) * 1e6) /
          1e6;
      }
      return Number(lapVal).toFixed(lapDecimals);
    }

    if (baseKey === "overallPhysicalLapCount") {
      const p = hd?.participant;
      const hasCompleted = p?.totalTime && p.totalTime > 0;
      if (
        value === null ||
        value === undefined ||
        (value === 0 && !hasCompleted)
      ) {
        return "--";
      }
      return String(value);
    }
    return null;
  }

  private static formatOverallStatsValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
  ): string | null {
    if (baseKey === "overallLapsLed") {
      const led =
        value !== undefined && value !== null
          ? value
          : (hd?.participant?.lapsLed ?? 0);
      return String(led);
    }

    if (baseKey === "overallTrackCalls") {
      const calls =
        value !== undefined && value !== null
          ? value
          : (hd?.participant?.trackCalls ?? 0);
      return String(calls);
    }

    if (baseKey === "overallPoints") {
      const points =
        value !== undefined && value !== null
          ? value
          : (hd?.participant?.totalPoints ?? 0);
      return String(points);
    }
    return null;
  }

  private static formatOverallHeatsValue(
    baseKey: string,
    hd: DriverHeatData,
    ctx: FormatContext,
    column?: ColumnDefinition | any,
  ): string {
    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      return "--";
    }
    const mode =
      (column as any)?.heatsDisplayMode ||
      (column as any)?.customSettings?.heatsDisplayMode ||
      ctx.laneViewWidgetSettings?.heatsDisplayMode ||
      (baseKey === "heatsRemaining" ? "remaining" : "raced");
    const p = (hd?.participant ??
      (hd as any)?.actualDriver?.participant) as any;
    let count: number | undefined =
      mode === "remaining" ? p?.heatsRemaining : p?.heatsRaced;

    if (
      mode === "remaining" &&
      (!count || count === 0) &&
      p?.totalHeats &&
      p.totalHeats > (p.heatsRaced || 0)
    ) {
      count = Math.max(0, p.totalHeats - (p.heatsRaced || 0));
    }

    if (count === undefined || count === null) {
      count = this.calculateHeatsFallback(hd, ctx, mode);
    }
    return String(count);
  }

  private static calculateHeatsFallback(
    hd: DriverHeatData,
    ctx: FormatContext,
    mode: string,
  ): number {
    const race = ctx.getRace?.() as any;
    const p = (hd?.participant ??
      (hd as any)?.actualDriver?.participant) as any;
    const driverId =
      (hd?.driver as any)?.driverId ||
      (p?.driver as any)?.entity_id ||
      (p?.driver as any)?.id ||
      (hd as any)?.driverId;
    if (race?.heats && driverId) {
      let driverTotalHeats = 0;
      let driverHeatsRaced = 0;
      for (const heat of race.heats) {
        const inHeat = heat.heatDrivers?.some(
          (d: any) =>
            d.driver?.driverId === driverId ||
            d.actualDriver?.id === driverId ||
            d.actualDriver?.entity_id === driverId ||
            d.participant?.driver?.entity_id === driverId ||
            d.participant?.driver?.id === driverId,
        );
        if (inHeat) {
          driverTotalHeats++;
          if (
            heat.started ||
            heat.heatDrivers?.some(
              (d: any) =>
                (d.driver?.driverId === driverId ||
                  d.actualDriver?.id === driverId ||
                  d.actualDriver?.entity_id === driverId ||
                  d.participant?.driver?.entity_id === driverId ||
                  d.participant?.driver?.id === driverId) &&
                (d.lapCount > 0 || d.totalTime > 0),
            )
          ) {
            driverHeatsRaced++;
          }
        }
      }
      return mode === "remaining"
        ? Math.max(0, driverTotalHeats - driverHeatsRaced)
        : driverHeatsRaced;
    }
    return 0;
  }
}
