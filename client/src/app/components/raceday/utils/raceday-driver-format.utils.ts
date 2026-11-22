import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { FormatContext, RacedayFormatUtils } from "./raceday-format.utils";
import { RacedayOverallFormatUtils } from "./raceday-overall-format.utils";

export class RacedayDriverFormatUtils {
  static formatDriverOrTeamValue(
    baseKey: string,
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
    timeDecimals: number,
  ): string | undefined {
    if (baseKey.startsWith("ghostPacing")) {
      return this.formatGhostPacing(hd, timeDecimals);
    }
    if (baseKey === "driver.name" || baseKey === "driver.nickname") {
      return this.formatDriverNameOrNickname(baseKey, propertyName, hd, ctx);
    }
    if (baseKey === "participant.team.name") {
      return this.formatTeamName(propertyName, hd, column, ctx);
    }
    if (baseKey === "driver.avatarUrl") {
      return this.formatAvatarUrl(value, hd, ctx);
    }
    if (baseKey === "seed") {
      const seed = hd.participant?.seed ?? (hd.driver as any)?.seed;
      if (!seed) return "--";
      // Brackets are the original look; a widget can switch them off (#1214).
      return ctx.laneViewWidgetSettings?.seedBrackets === false
        ? String(seed)
        : `(${seed})`;
    }
    if (baseKey.startsWith("rank")) {
      return this.formatRanks(baseKey, hd, ctx);
    }
    if (baseKey.startsWith("projected") || baseKey === "winProbability") {
      return this.formatPredictions(baseKey, hd);
    }
    return undefined;
  }

  static formatGhostPacing(hd: DriverHeatData, timeDecimals: number): string {
    if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
    const ghostLap = (hd as any).ghostLapTime ?? 0;
    const currentLapTime = (hd as any).currentLapTime ?? hd.lastLapTime ?? 0;
    if (ghostLap > 0 && currentLapTime > 0) {
      const delta = ghostLap - currentLapTime;
      const fixedVal = delta.toFixed(timeDecimals);
      if (Math.abs(Number(fixedVal)) === 0)
        return (0).toFixed(timeDecimals) + "s";
      const sign = delta > 0 ? "+" : "";
      return sign + fixedVal + "s";
    }
    return "--";
  }

  static formatDriverNameOrNickname(
    baseKey: string,
    propertyName: string,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      if (
        RacedayOverallFormatUtils.isOverallOrSeedFormatContext(
          ctx,
          propertyName,
        )
      ) {
        if (ctx.laneViewWidgetSettings?.emptyRowsMode === "empty") {
          return "--";
        }
        return "";
      }
      if (ctx.laneViewWidgetSettings?.emptyRowsMode === "blank") {
        return "";
      }
      return ctx.translate("RD_EMPTY_LANE");
    }
    if (
      RacedayOverallFormatUtils.isOverallOrSeedFormatContext(ctx, propertyName)
    ) {
      const teamObj =
        hd.participant?.team ||
        (hd.driver as any)?.team ||
        (hd as any)?.team ||
        (hd.actualDriver as any)?.team;
      const teamName = typeof teamObj === "string" ? teamObj : teamObj?.name;
      if (teamName) return teamName;
    }
    const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
    const driverName =
      (baseKey === "driver.nickname" ? d?.nickname : undefined) || d?.name;
    if (driverName) return driverName;
    const teamObj =
      hd.participant?.team ||
      (hd.driver as any)?.team ||
      (hd as any)?.team ||
      (hd.actualDriver as any)?.team;
    const teamName = typeof teamObj === "string" ? teamObj : teamObj?.name;
    if (teamName) return teamName;
    return "";
  }

  static formatTeamName(
    propertyName: string,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
  ): string {
    if (ctx.getRace()?.practice) return "";
    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      if (
        RacedayOverallFormatUtils.isOverallOrSeedFormatContext(
          ctx,
          propertyName,
        )
      ) {
        if (ctx.laneViewWidgetSettings?.emptyRowsMode === "empty") {
          return "--";
        }
        return "";
      }
      if (ctx.laneViewWidgetSettings?.emptyRowsMode === "blank") {
        return "";
      }
      if (column && column.layout[AnchorPoint.CenterCenter] === propertyName) {
        return ctx.translate("RD_EMPTY_LANE");
      }
      return "";
    }
    return hd.participant?.team?.name || (hd.driver as any)?.team?.name || "";
  }

  static formatAvatarUrl(
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (value && typeof value === "string" && value.trim()) {
      return ctx.getFullUrl ? ctx.getFullUrl(value.trim()) : value.trim();
    }
    if (!RacedayFormatUtils.isEmptyDriver(hd)) {
      const defaultAvatar = "assets/images/default_avatar.svg";
      return ctx.getFullUrl ? ctx.getFullUrl(defaultAvatar) : defaultAvatar;
    }
    return "";
  }

  static formatRanks(
    baseKey: string,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
    if (baseKey === "rankHeat") {
      const rank = ctx.getDriverRanking(hd.objectId);
      return rank ? `${rank}` : "--";
    }
    if (baseKey === "rankOverall") {
      const rank = ctx.getDriverOverallRanking
        ? ctx.getDriverOverallRanking(hd)
        : (hd.participant?.rank ?? (hd.driver as any)?.rank);
      return rank ? `${rank}` : "--";
    }
    if (baseKey === "rankGroup") {
      const rank = ctx.getDriverGroupRanking
        ? ctx.getDriverGroupRanking(hd)
        : undefined;
      return rank !== undefined ? `${rank}` : "--";
    }
    return "--";
  }

  static formatPredictions(baseKey: string, hd: DriverHeatData): string {
    if (baseKey === "winProbability") {
      const prob =
        (hd as any).winProbability ?? (hd.participant as any)?.winProbability;
      if (prob !== undefined && prob >= 0) return `${Math.round(prob * 100)}%`;
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      return "--%";
    }
    if (baseKey === "projectedRank") {
      const rank =
        (hd as any).projectedRank ?? (hd.participant as any)?.projectedRank;
      if (rank && rank > 0) return `#${rank}`;
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      return "--";
    }
    if (baseKey === "projectedLaps") {
      const laps =
        (hd as any).projectedLaps ?? (hd.participant as any)?.projectedLaps;
      if (laps !== undefined && laps >= 0) return `${laps}`;
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      return "--";
    }
    return "--";
  }
}
