import { DriverHeatData } from "@app/race/driver_heat_data";

import { FormatContext, RacedayFormatUtils } from "./raceday-format.utils";

export interface ResolvedGapConfig {
  target: "leader" | "position";
  mode: "always_time" | "laps_and_time" | "always_laps";
}

export class RacedayGapFormatUtils {
  static resolveGapConfig(
    baseKey: string,
    ctx: FormatContext,
    anchor?: string,
  ): ResolvedGapConfig {
    const s = ctx.laneViewWidgetSettings;
    const config =
      anchor && anchor !== "center-center" && s?.insetsConfig?.[anchor]
        ? s.insetsConfig[anchor]
        : s;

    let target: "leader" | "position";
    if (
      baseKey === "gapPosition" ||
      baseKey === "gapPositionF1" ||
      baseKey === "overallGapPosition" ||
      baseKey === "overallGapPositionF1"
    ) {
      target = "position";
    } else if (
      baseKey === "gapLeader" ||
      baseKey === "gapLeaderF1" ||
      baseKey === "overallGapLeader" ||
      baseKey === "overallGapLeaderF1"
    ) {
      target = "leader";
    } else {
      target = config?.gapTarget || "leader";
    }

    let mode: "always_time" | "laps_and_time" | "always_laps";
    if (
      baseKey === "gapLeaderF1" ||
      baseKey === "gapPositionF1" ||
      baseKey === "overallGapLeaderF1" ||
      baseKey === "overallGapPositionF1"
    ) {
      mode = "laps_and_time";
    } else if (
      baseKey === "gapLeader" ||
      baseKey === "gapPosition" ||
      baseKey === "overallGapLeader" ||
      baseKey === "overallGapPosition"
    ) {
      mode = "always_time";
    } else {
      mode = config?.gapMode || "always_time";
    }

    return { target, mode };
  }

  static formatHeatGapValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    timeDecimals: number,
    lapDecimals: number,
    timePlaceholder: string,
    lapPlaceholder: string,
    anchor?: string,
  ): string {
    const { target, mode } = this.resolveGapConfig(baseKey, ctx, anchor);

    if (this.isFirstPlaceHeat(hd, ctx)) {
      return mode === "always_laps" ? lapPlaceholder : timePlaceholder;
    }

    if (mode === "always_laps") {
      return this.formatHeatLapsGap(
        baseKey,
        value,
        hd,
        target,
        lapDecimals,
        lapPlaceholder,
      );
    }

    if (mode === "laps_and_time") {
      const lapsDown =
        target === "leader" ? hd.lapsDownLeader : hd.lapsDownPosition;
      if (lapsDown === 1) {
        return ctx
          .translate("RD_LAP_DOWN")
          .replace("{{count}}", lapsDown.toString());
      } else if (lapsDown > 1) {
        return ctx
          .translate("RD_LAPS_DOWN")
          .replace("{{count}}", lapsDown.toString());
      }
    }

    return this.formatHeatTimeGap(
      baseKey,
      value,
      hd,
      target,
      mode,
      timeDecimals,
      timePlaceholder,
    );
  }

  static isFirstPlaceHeat(hd: DriverHeatData, ctx: FormatContext): boolean {
    if (!hd) return false;
    const rank = ctx.getDriverRanking
      ? ctx.getDriverRanking(hd.objectId)
      : undefined;
    if (rank === 1) return true;
    if (hd.rank === 1) return true;
    if (
      (ctx as any).heat?.standings &&
      (ctx as any).heat.standings.length > 0
    ) {
      if ((ctx as any).heat.standings[0] === hd.objectId) return true;
    }
    return false;
  }

  private static formatHeatLapsGap(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    target: "leader" | "position",
    lapDecimals: number,
    lapPlaceholder: string,
  ): string {
    const lapValue =
      baseKey === "gap" ||
      baseKey === "gapLeader" ||
      baseKey === "gapPosition" ||
      value === null ||
      value === undefined
        ? target === "position"
          ? hd.gapPositionLaps
          : hd.gapLeaderLaps
        : value;

    if (
      lapValue === null ||
      lapValue === undefined ||
      isNaN(Number(lapValue))
    ) {
      return lapPlaceholder;
    }
    const num = Number(lapValue);
    const fixed = Math.abs(num).toFixed(lapDecimals);
    const isZero = Number(fixed) === 0;
    if (isZero && !RacedayFormatUtils.hasHeatData(hd)) {
      return lapPlaceholder;
    }
    const sign = !isZero && num < 0 ? "-" : "+";
    return sign + fixed;
  }

  private static formatHeatTimeGap(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    target: "leader" | "position",
    mode: "always_time" | "laps_and_time",
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    const timeValue =
      baseKey === "gap" || value === null || value === undefined
        ? target === "position"
          ? mode === "laps_and_time"
            ? hd.gapPositionF1
            : hd.gapPosition
          : mode === "laps_and_time"
            ? hd.gapLeaderF1
            : hd.gapLeader
        : value;

    if (
      timeValue === null ||
      timeValue === undefined ||
      isNaN(Number(timeValue))
    ) {
      return timePlaceholder;
    }
    const num = Number(timeValue);
    const fixed = Math.abs(num).toFixed(timeDecimals);
    const isZero = Number(fixed) === 0;
    if (isZero && !RacedayFormatUtils.hasHeatData(hd)) {
      return timePlaceholder;
    }
    const sign = !isZero && num < 0 ? "-" : "+";
    return sign + fixed;
  }

  static formatOverallGapValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    timePlaceholder: string,
    lapPlaceholder: string,
    timeDecimals: number,
    lapDecimals: number,
    hasOverallData: boolean,
    anchor?: string,
  ): string | null {
    if (
      baseKey !== "overallGap" &&
      baseKey !== "overallGapLeader" &&
      baseKey !== "overallGapPosition" &&
      baseKey !== "overallGapLeaderF1" &&
      baseKey !== "overallGapPositionF1"
    ) {
      return null;
    }

    const { target, mode } = this.resolveGapConfig(baseKey, ctx, anchor);

    if (this.isFirstPlaceOverall(hd, ctx)) {
      return mode === "always_laps" ? lapPlaceholder : timePlaceholder;
    }

    const p = hd?.participant;

    if (mode === "always_laps") {
      return this.formatOverallLapsGap(
        baseKey,
        value,
        p,
        hd,
        target,
        lapDecimals,
        lapPlaceholder,
        hasOverallData,
      );
    }

    if (mode === "laps_and_time") {
      const lapsDown =
        (target === "leader" ? p?.lapsDownLeader : p?.lapsDownPosition) ??
        (target === "leader" ? hd?.lapsDownLeader : hd?.lapsDownPosition) ??
        0;

      if (lapsDown === 1) {
        return ctx
          .translate("RD_LAP_DOWN")
          .replace("{{count}}", lapsDown.toString());
      } else if (lapsDown > 1) {
        return ctx
          .translate("RD_LAPS_DOWN")
          .replace("{{count}}", lapsDown.toString());
      }
    }

    return this.formatOverallTimeGap(
      baseKey,
      value,
      p,
      hd,
      target,
      mode,
      timeDecimals,
      timePlaceholder,
      hasOverallData,
    );
  }

  static isFirstPlaceOverall(hd: DriverHeatData, ctx: FormatContext): boolean {
    if (!hd) return false;
    const rank = ctx.getDriverOverallRanking
      ? ctx.getDriverOverallRanking(hd)
      : undefined;
    if (rank === 1) return true;
    const p = hd.participant;
    if (p?.rank === 1) return true;
    if ((hd.driver as any)?.rank === 1) return true;
    if ((hd as any).overallRank === 1) return true;
    return false;
  }

  private static formatOverallLapsGap(
    baseKey: string,
    value: any,
    p: any,
    hd: DriverHeatData,
    target: "leader" | "position",
    lapDecimals: number,
    lapPlaceholder: string,
    hasOverallData: boolean,
  ): string {
    const lapValue =
      baseKey === "overallGap" || value === null || value === undefined
        ? target === "position"
          ? (p?.gapPositionLaps ?? hd?.gapPositionLaps)
          : (p?.gapLeaderLaps ?? hd?.gapLeaderLaps)
        : value;
    if (
      lapValue === null ||
      lapValue === undefined ||
      isNaN(Number(lapValue))
    ) {
      return lapPlaceholder;
    }
    const num = Number(lapValue);
    const fixed = Math.abs(num).toFixed(lapDecimals);
    const isZero = Number(fixed) === 0;
    if (isZero && !hasOverallData) {
      return lapPlaceholder;
    }
    const sign = !isZero && num < 0 ? "-" : "+";
    return sign + fixed;
  }

  private static formatOverallTimeGap(
    baseKey: string,
    value: any,
    p: any,
    hd: DriverHeatData,
    target: "leader" | "position",
    mode: "always_time" | "laps_and_time",
    timeDecimals: number,
    timePlaceholder: string,
    hasOverallData: boolean,
  ): string {
    const timeValue =
      baseKey === "overallGap" || value === null || value === undefined
        ? target === "position"
          ? mode === "laps_and_time"
            ? (p?.gapPositionF1 ?? hd?.gapPositionF1)
            : (p?.gapPosition ?? hd?.gapPosition)
          : mode === "laps_and_time"
            ? (p?.gapLeaderF1 ?? hd?.gapLeaderF1)
            : (p?.gapLeader ?? hd?.gapLeader)
        : value;

    if (
      timeValue === null ||
      timeValue === undefined ||
      isNaN(Number(timeValue))
    ) {
      return timePlaceholder;
    }
    const num = Number(timeValue);
    const fixed = Math.abs(num).toFixed(timeDecimals);
    const isZero = Number(fixed) === 0;

    if (isZero && !hasOverallData) {
      return timePlaceholder;
    }
    const sign = !isZero && num < 0 ? "-" : "+";
    return sign + fixed;
  }
}
