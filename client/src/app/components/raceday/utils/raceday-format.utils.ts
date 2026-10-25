import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { Driver } from "@app/models/driver";
import { AllowFinish } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import {
  formatTimerDisplay,
  TimerFormatOptions,
} from "@app/utils/timer-format.utils";

import { RacedayFlagFormatUtils } from "./raceday-flag-format.utils";
import { RacedayGapFormatUtils } from "./raceday-gap-format.utils";
import { RacedayOverallFormatUtils } from "./raceday-overall-format.utils";
import { RacedayTelemetryFormatUtils } from "./raceday-telemetry-format.utils";
import { resolveRacedayTimerFormatOptions } from "./raceday-timer-format.utils";

export interface FormatContext {
  translate: (key: string) => string;
  getRace: () => Race | undefined;
  getTrack: () => Track | undefined;
  getDriverRanking: (objectId: string) => number | undefined;
  getFlagType: () => any;
  getFlagUrl: (flag: any) => string;
  getFullUrl: (url: string | undefined) => string;
  getImageSetUrl: (hd: DriverHeatData, propertyName: string) => string;
  laneViewWidgetSettings?: any;
  getDriverOverallRanking?: (hd: DriverHeatData) => number | undefined;
  getDriverGroupRanking?: (hd: DriverHeatData) => number | undefined;
  getLaneQrCodeUrl?: (laneIndex: number) => string;
  getDriverViewQrCodeUrl?: (hd: DriverHeatData) => string;
  isDriverFinished?: (hd: DriverHeatData, scoring?: any) => boolean;
  areAllDriversFinished?: () => boolean;
  isRaceOver?: () => boolean;
  getRaceState?: () => RaceState | number | undefined;
  raceState?: RaceState | number;
  isWarmup?: () => boolean;
  isCooldown?: () => boolean;
  getLaneRecordEntry?: (laneIndex: number) => any;
  getBestRaceLapEntry?: (laneIndex: number) => any;
  formatDate?: (date: any) => string;
}

export class RacedayFormatUtils {
  static isEmptyDriver(hd: DriverHeatData | any): boolean {
    if (!hd) return true;
    if (
      hd.isEmpty === true ||
      (typeof hd.isEmpty === "function" && hd.isEmpty())
    )
      return true;
    if (
      hd.isEmptyLane === true ||
      (typeof hd.isEmptyLane === "function" && hd.isEmptyLane())
    )
      return true;
    if (hd.actualDriver && !Driver.isEmpty(hd.actualDriver)) return false;
    if (hd.actualDriver && Driver.isEmpty(hd.actualDriver)) return true;

    const nestedDriver = hd.driver?.driver || hd.participant?.driver;
    if (nestedDriver && !Driver.isEmpty(nestedDriver)) return false;
    if (nestedDriver && Driver.isEmpty(nestedDriver)) return true;

    if (hd.driver && !hd.driver.driver) return Driver.isEmpty(hd.driver);
    return true;
  }

  static hasHeatData(hd: DriverHeatData | any): boolean {
    if (!hd || this.isEmptyDriver(hd)) return false;
    const hasReaction = (hd.reactionTime ?? hd.reaction_time ?? 0) > 0;
    const hasLaps =
      (hd.lapTimes && hd.lapTimes.length > 0) ||
      (hd.laps && hd.laps.length > 0) ||
      (hd.physicalLapCount ?? hd.physical_lap_count ?? 0) > 0 ||
      (hd.lapCount ?? hd.lap_count ?? 0) > 0;
    const hasTime =
      (hd.totalTime ?? hd.total_time ?? hd._totalTime ?? 0) > 0 ||
      (hd.bestLapTime ?? hd.best_lap_time ?? hd._bestLapTime ?? 0) > 0 ||
      (hd.lastLapTime ?? hd.last_lap_time ?? hd._lastLapTime ?? 0) > 0 ||
      (hd.averageLapTime ?? hd.average_lap_time ?? 0) > 0;
    const hasAdjustment =
      (hd.userLaps !== undefined && hd.userLaps !== 0) ||
      (hd.penaltyLaps !== undefined && hd.penaltyLaps !== 0) ||
      (hd.autoCalculatedLaps !== undefined && hd.autoCalculatedLaps !== 0) ||
      (hd.adjustedLapCount !== undefined && hd.adjustedLapCount !== 0);
    const isFinished = hd.isFinished === true || hd.finished === true;
    return hasReaction || hasLaps || hasTime || hasAdjustment || isFinished;
  }

  static isAllowFinish(race?: Race): boolean {
    if (!race) return false;
    const scoring: any = race.heat_scoring ?? (race as any).heatScoring;
    if (!scoring) return false;
    const af = scoring.allowFinish ?? scoring.allow_finish;
    return (
      af === AllowFinish.AF_ALLOW ||
      af === "Allow" ||
      af === "AF_ALLOW" ||
      af === AllowFinish.AF_SINGLE_LAP ||
      af === "SingleLap" ||
      af === "AF_SINGLE_LAP" ||
      af === AllowFinish.AF_SINGLE_LAP_AUTO_SEGMENTS ||
      af === "SingleLapAutoSegments" ||
      af === "AF_SINGLE_LAP_AUTO_SEGMENTS" ||
      af === 1 ||
      af === 2 ||
      af === 4
    );
  }

  static isHeatOrRaceOver(ctx?: FormatContext, hd?: DriverHeatData): boolean {
    if (!ctx) return false;
    if (ctx.isRaceOver && ctx.isRaceOver()) return true;
    const raceState =
      ctx.raceState !== undefined
        ? ctx.raceState
        : ctx.getRaceState
          ? ctx.getRaceState()
          : undefined;
    if (
      raceState === RaceState.HEAT_OVER ||
      raceState === RaceState.RACE_OVER ||
      raceState === (RaceState as any).HEAT_OVER ||
      raceState === (RaceState as any).RACE_OVER
    ) {
      return true;
    }
    if (hd && (hd.isFinished || (hd as any).finished)) {
      return true;
    }
    if (
      hd &&
      ctx.isDriverFinished &&
      ctx.isDriverFinished(
        hd,
        ctx.getRace()?.heat_scoring ?? (ctx.getRace() as any)?.heatScoring,
      )
    ) {
      return true;
    }
    if (ctx.areAllDriversFinished && ctx.areAllDriversFinished()) {
      return true;
    }
    return false;
  }

  static getPropertyValue(
    heatDriver: DriverHeatData,
    propertyPath: string,
    settings?: any,
    anchor?: string,
  ): any {
    if (!heatDriver || !propertyPath) return undefined;
    const baseKey = propertyPath.split(".")[0].split("_")[0];
    const participant =
      heatDriver.participant ?? (heatDriver as any).actualDriver?.participant;
    const overallVal = RacedayOverallFormatUtils.extractOverallPropertyValue(
      participant,
      heatDriver,
      baseKey,
      settings,
      anchor,
    );
    if (overallVal !== undefined) {
      return overallVal;
    }
    if (baseKey === "gap") {
      const config =
        anchor && anchor !== "center-center" && settings?.insetsConfig?.[anchor]
          ? settings.insetsConfig[anchor]
          : settings;
      const target = config?.gapTarget || "leader";
      const mode = config?.gapMode || "always_time";
      if (target === "position") {
        if (mode === "always_laps") return heatDriver.gapPositionLaps;
        if (mode === "laps_and_time") return heatDriver.gapPositionF1;
        return heatDriver.gapPosition;
      } else {
        if (mode === "always_laps") return heatDriver.gapLeaderLaps;
        if (mode === "laps_and_time") return heatDriver.gapLeaderF1;
        return heatDriver.gapLeader;
      }
    }
    const parts = propertyPath.split(".").map((part) => part.split("_")[0]);
    let value: any = heatDriver;
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    return value;
  }

  static extractOverallPropertyValue(
    p: any,
    heatDriver: any,
    baseKey: string,
    settings?: any,
    anchor?: string,
  ): any {
    return RacedayOverallFormatUtils.extractOverallPropertyValue(
      p,
      heatDriver,
      baseKey,
      settings,
      anchor,
    );
  }

  static resolveTimerFormatOptions(
    colKey: string,
    settings: any,
    isInset?: boolean,
    insetDecimals?: number,
    propertyKey?: string,
  ): TimerFormatOptions | undefined {
    return resolveRacedayTimerFormatOptions(
      colKey,
      settings,
      isInset,
      insetDecimals,
      propertyKey,
    );
  }

  static formatValue(
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
    anchor?: string,
  ): string {
    if (!propertyName) return "";
    const baseKey = propertyName.split("_")[0];
    const isInset = Boolean(anchor && anchor !== "center-center");
    const colKey = column?.propertyName || baseKey;

    const { timeDecimals, lapDecimals, timePlaceholder, lapPlaceholder } =
      this.resolveDecimalsAndPlaceholders(
        colKey,
        baseKey,
        column,
        ctx,
        isInset,
      );

    if (
      baseKey.startsWith("overall") ||
      baseKey === "totalLaps" ||
      baseKey === "raceTotalLaps" ||
      baseKey === "heatsRaced" ||
      baseKey === "heatsRemaining"
    ) {
      const overallStr = RacedayOverallFormatUtils.formatOverallValue(
        baseKey,
        value,
        hd,
        ctx,
        timePlaceholder,
        lapPlaceholder,
        timeDecimals,
        lapDecimals,
        colKey,
        isInset,
        column,
        anchor,
      );
      if (overallStr !== null) return overallStr;
    }

    if (this.isEmptyDriver(hd)) {
      const emptyStr = this.formatEmptyDriverValue(
        baseKey,
        propertyName,
        isInset,
        timePlaceholder,
        lapPlaceholder,
        ctx,
        anchor,
      );
      if (emptyStr !== null) return emptyStr;
    }

    return this.formatNonOverallValue(
      baseKey,
      propertyName,
      value,
      hd,
      column,
      ctx,
      timeDecimals,
      lapDecimals,
      timePlaceholder,
      lapPlaceholder,
      colKey,
      isInset,
      anchor,
    );
  }

  private static resolveDecimalsAndPlaceholders(
    colKey: string,
    baseKey: string,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
    isInset: boolean,
  ): {
    timeDecimals: number;
    lapDecimals: number;
    timePlaceholder: string;
    lapPlaceholder: string;
  } {
    const customColDecimals =
      ctx.laneViewWidgetSettings?.columnDecimals ||
      ctx.laneViewWidgetSettings?.columnDecimalPlaces;
    const colDecimalOverride = customColDecimals
      ? (customColDecimals[column?.propertyName ?? ""] ??
        customColDecimals[colKey] ??
        customColDecimals[baseKey] ??
        (baseKey.startsWith("ghostPacing")
          ? Object.entries(customColDecimals).find(([k]) =>
              k.startsWith("ghostPacing"),
            )?.[1]
          : undefined))
      : undefined;
    const colSubsecondDec =
      ctx.laneViewWidgetSettings?.columnTimeSubsecondDecimals?.[
        column?.propertyName ?? ""
      ] ??
      ctx.laneViewWidgetSettings?.columnTimeSubsecondDecimals?.[colKey] ??
      ctx.laneViewWidgetSettings?.columnTimeSubsecondDecimals?.[baseKey];
    const effColDecimal = colDecimalOverride ?? colSubsecondDec;

    const timeDecimals = isInset
      ? ctx.laneViewWidgetSettings?.insetTimeDecimalPlaces !== undefined
        ? Number(ctx.laneViewWidgetSettings.insetTimeDecimalPlaces)
        : 3
      : effColDecimal !== undefined &&
          effColDecimal !== null &&
          effColDecimal !== ""
        ? Number(effColDecimal)
        : ctx.laneViewWidgetSettings?.timeDecimalPlaces !== undefined
          ? Number(ctx.laneViewWidgetSettings.timeDecimalPlaces)
          : 3;

    const lapDecimals = isInset
      ? ctx.laneViewWidgetSettings?.insetLapDecimalPlaces !== undefined
        ? Number(ctx.laneViewWidgetSettings.insetLapDecimalPlaces)
        : 2
      : colDecimalOverride !== undefined &&
          colDecimalOverride !== null &&
          colDecimalOverride !== ""
        ? Number(colDecimalOverride)
        : ctx.laneViewWidgetSettings?.lapDecimalPlaces !== undefined
          ? Number(ctx.laneViewWidgetSettings.lapDecimalPlaces)
          : 2;

    const timePlaceholder =
      timeDecimals > 0 ? "--." + "-".repeat(timeDecimals) : "--";
    const lapPlaceholder =
      lapDecimals > 0 ? "--." + "-".repeat(lapDecimals) : "--";

    return { timeDecimals, lapDecimals, timePlaceholder, lapPlaceholder };
  }

  private static formatEmptyDriverValue(
    baseKey: string,
    propertyName: string,
    isInset: boolean,
    timePlaceholder: string,
    lapPlaceholder?: string,
    ctx?: FormatContext,
    anchor?: string,
  ): string | null {
    if (baseKey === "seed") return "";
    if (
      baseKey === "rankHeat" ||
      baseKey === "rankOverall" ||
      baseKey === "rankGroup" ||
      baseKey === "lapsLed" ||
      baseKey === "trackCalls" ||
      baseKey === "physicalLapCount" ||
      baseKey === "recordLapTime" ||
      baseKey === "bestRaceLapTime" ||
      baseKey === "heatsRaced" ||
      baseKey === "heatsRemaining" ||
      baseKey.startsWith("ghostPacing")
    ) {
      return "--";
    }
    if (baseKey === "gap" || baseKey === "overallGap") {
      const s = ctx?.laneViewWidgetSettings;
      const config =
        anchor && anchor !== "center-center" && s?.insetsConfig?.[anchor]
          ? s.insetsConfig[anchor]
          : s;
      if (config?.gapMode === "always_laps") {
        return lapPlaceholder ?? "--";
      }
      return timePlaceholder;
    }
    if (
      baseKey === "gapLeader" ||
      baseKey === "gapPosition" ||
      baseKey === "gapLeaderF1" ||
      baseKey === "gapPositionF1" ||
      baseKey === "standardDeviation" ||
      baseKey === "averageTop5" ||
      baseKey === "averageTop10" ||
      baseKey === "averageTop15" ||
      baseKey === "top2Consecutive" ||
      baseKey === "top3Consecutive"
    ) {
      return timePlaceholder;
    }
    if (baseKey === "consistencyScore") return "--.-%";
    if (
      isInset &&
      (baseKey === "flag" ||
        (baseKey.startsWith("imageset") &&
          propertyName.toLowerCase().includes("driverstate")))
    ) {
      return "";
    }
    return null;
  }

  private static formatNonOverallValue(
    baseKey: string,
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
    timeDecimals: number,
    lapDecimals: number,
    timePlaceholder: string,
    lapPlaceholder: string,
    colKey: string,
    isInset: boolean,
    anchor?: string,
  ): string {
    if (baseKey === "recordLapTime") {
      return this.formatRecordLapTime(hd, ctx, timeDecimals, timePlaceholder);
    }
    if (baseKey === "bestRaceLapTime") {
      return this.formatBestRaceLapTime(hd, ctx, timeDecimals, timePlaceholder);
    }
    if (this.isTimingBaseKey(baseKey)) {
      return this.formatTimingValue(
        baseKey,
        value,
        colKey,
        ctx,
        isInset,
        timeDecimals,
        timePlaceholder,
      );
    }
    if (baseKey === "consistencyScore") {
      if (this.isEmptyDriver(hd) || value === null || value === undefined)
        return "--.-%";
      return value.toFixed(1) + "%";
    }
    if (baseKey.startsWith("gap")) {
      return this.formatGapValue(
        baseKey,
        value,
        hd,
        ctx,
        timeDecimals,
        lapDecimals,
        timePlaceholder,
        lapPlaceholder,
        anchor,
      );
    }
    if (baseKey === "lapCount" || baseKey === "heatTotalLaps") {
      return this.formatLapCountValue(
        value,
        hd,
        ctx,
        lapDecimals,
        lapPlaceholder,
      );
    }
    if (baseKey === "physicalLapCount") {
      return this.formatPhysicalLapCount(value, hd);
    }

    return this.formatEntityOrStatusValue(
      baseKey,
      propertyName,
      value,
      hd,
      column,
      ctx,
      timeDecimals,
      timePlaceholder,
    );
  }

  private static isTimingBaseKey(baseKey: string): boolean {
    return (
      baseKey.includes("LapTime") ||
      baseKey === "reactionTime" ||
      baseKey === "totalTime" ||
      baseKey === "standardDeviation" ||
      baseKey === "averageTop5" ||
      baseKey === "averageTop10" ||
      baseKey === "averageTop15" ||
      baseKey === "top2Consecutive" ||
      baseKey === "top3Consecutive"
    );
  }

  private static formatRecordLapTime(
    hd: DriverHeatData,
    ctx: FormatContext,
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    const entry = ctx.getLaneRecordEntry
      ? ctx.getLaneRecordEntry(hd?.laneIndex ?? 0)
      : undefined;
    if (entry && entry.value > 0) {
      const timeStr = entry.value.toFixed(timeDecimals);
      const nickname = entry.holderNickname || entry.holderName || "---";
      let dateStr = "---";
      if (entry.date) {
        let ms = 0;
        if (typeof entry.date === "number") ms = entry.date;
        else if (entry.date.toNumber) ms = entry.date.toNumber();
        else if (typeof entry.date === "string") ms = parseInt(entry.date, 10);
        else ms = Number(entry.date);

        if (ms > 0 && !isNaN(ms)) {
          dateStr = ctx.formatDate
            ? ctx.formatDate(ms)
            : new Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(
                new Date(ms),
              );
        }
      }
      return `${timeStr} (${nickname}, ${dateStr})`;
    }
    return `${timePlaceholder} (---, ---)`;
  }

  private static formatBestRaceLapTime(
    hd: DriverHeatData,
    ctx: FormatContext,
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    const entry = ctx.getBestRaceLapEntry
      ? ctx.getBestRaceLapEntry(hd?.laneIndex ?? 0)
      : undefined;
    if (entry && entry.value > 0) {
      const timeStr = entry.value.toFixed(timeDecimals);
      const nickname = entry.holderNickname || entry.holderName || "---";
      let heatStr = "---";
      if (entry.heatNumber && entry.heatNumber > 0) {
        const heatPrefix = ctx.translate ? ctx.translate("RD_HEAT") : "Heat";
        heatStr = `${heatPrefix} ${entry.heatNumber}`;
      }
      return `${timeStr} (${nickname}, ${heatStr})`;
    }
    return `${timePlaceholder} (---, ---)`;
  }

  private static formatTimingValue(
    baseKey: string,
    value: any,
    colKey: string,
    ctx: FormatContext,
    isInset: boolean,
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    const isStdDev = baseKey === "standardDeviation";
    const isValid =
      value !== null &&
      value !== undefined &&
      (isStdDev ? value >= 0 : value > 0);
    if (isValid && baseKey === "totalTime") {
      const timerOpts = this.resolveTimerFormatOptions(
        colKey,
        ctx.laneViewWidgetSettings,
        isInset,
        timeDecimals,
        baseKey,
      );
      if (timerOpts) return formatTimerDisplay(value, timerOpts);
    }
    return isValid ? value.toFixed(timeDecimals) : timePlaceholder;
  }

  private static formatGapValue(
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
    return RacedayGapFormatUtils.formatHeatGapValue(
      baseKey,
      value,
      hd,
      ctx,
      timeDecimals,
      lapDecimals,
      timePlaceholder,
      lapPlaceholder,
      anchor,
    );
  }

  private static formatLapCountValue(
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    lapDecimals: number,
    lapPlaceholder: string,
  ): string {
    const hasReactionTime = hd.reactionTime > 0;
    const hasRealLap = hd.lapTimes && hd.lapTimes.length > 0;
    const isOver = this.isHeatOrRaceOver(ctx, hd);
    const hasAdjustment =
      (hd.userLaps !== undefined && hd.userLaps !== 0) ||
      (isOver &&
        hd.autoCalculatedLaps !== undefined &&
        hd.autoCalculatedLaps !== 0) ||
      (hd.penaltyLaps !== undefined && hd.penaltyLaps !== 0) ||
      (hd.adjustedLapCount !== undefined && hd.adjustedLapCount !== 0);

    if (
      value === null ||
      value === undefined ||
      (!hasReactionTime && !hasRealLap && !hasAdjustment)
    ) {
      return lapPlaceholder;
    }
    let lapVal = Number(value);
    if (!isOver && (hd.autoCalculatedLaps || 0) > 0) {
      lapVal =
        Math.round((lapVal - hd.autoCalculatedLaps + Number.EPSILON) * 1e6) /
        1e6;
    }
    return Number(lapVal).toFixed(lapDecimals);
  }

  private static formatPhysicalLapCount(
    value: any,
    hd: DriverHeatData,
  ): string {
    const hasReactionTime = hd.reactionTime > 0;
    const hasRealLap = hd.lapTimes && hd.lapTimes.length > 0;
    if (
      value === null ||
      value === undefined ||
      (!hasReactionTime && !hasRealLap)
    ) {
      return "--";
    }
    return value.toString();
  }

  private static formatEntityOrStatusValue(
    baseKey: string,
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    if (baseKey === "lapsLed") {
      if (this.isEmptyDriver(hd)) return "--";
      return String(value ?? hd?.lapsLed ?? (hd as any)?.laps_led ?? 0);
    }
    if (baseKey === "trackCalls") {
      if (this.isEmptyDriver(hd)) return "--";
      return String(value ?? hd?.trackCalls ?? (hd as any)?.track_calls ?? 0);
    }
    if (baseKey === "laneNumber") return String((hd?.laneIndex ?? 0) + 1);
    if (baseKey.startsWith("ghostPacing"))
      return this.formatGhostPacing(hd, timeDecimals);
    if (baseKey === "driver.name" || baseKey === "driver.nickname") {
      return this.formatDriverNameOrNickname(baseKey, propertyName, hd, ctx);
    }
    if (baseKey === "participant.team.name") {
      return this.formatTeamName(propertyName, hd, column, ctx);
    }
    if (baseKey.startsWith("fuel") || baseKey === "participant.fuelLevel") {
      return RacedayTelemetryFormatUtils.formatFuelLevels(
        baseKey,
        value,
        hd,
        ctx,
      );
    }
    if (baseKey === "driver.avatarUrl")
      return this.formatAvatarUrl(value, hd, ctx);
    if (baseKey === "seed") {
      const seed = hd.participant?.seed ?? (hd.driver as any)?.seed;
      return seed ? `(${seed})` : "--";
    }
    if (baseKey.startsWith("rank")) return this.formatRanks(baseKey, hd, ctx);
    if (baseKey.startsWith("projected") || baseKey === "winProbability") {
      return this.formatPredictions(baseKey, hd);
    }
    if (baseKey === "flag") {
      return RacedayFlagFormatUtils.formatFlagValue(value, hd, column, ctx);
    }
    if (baseKey === "segmentTime") {
      return RacedayTelemetryFormatUtils.formatSegmentTime(
        propertyName,
        hd,
        column,
        timeDecimals,
        timePlaceholder,
      );
    }
    if (baseKey === "mph" || baseKey === "kph" || baseKey === "fph") {
      return RacedayTelemetryFormatUtils.formatSpeed(baseKey, hd, ctx);
    }
    if (baseKey.startsWith("imageset") || baseKey === "fuel-gauge-builtin") {
      return ctx.getImageSetUrl(hd, propertyName);
    }
    if (baseKey === "qrCode") {
      return ctx.getLaneQrCodeUrl ? ctx.getLaneQrCodeUrl(hd.laneIndex) : "";
    }
    if (baseKey === "driverViewQrCode") {
      if (this.isEmptyDriver(hd)) return "";
      return ctx.getDriverViewQrCodeUrl ? ctx.getDriverViewQrCodeUrl(hd) : "";
    }
    return value?.toString() ?? "";
  }

  private static formatGhostPacing(
    hd: DriverHeatData,
    timeDecimals: number,
  ): string {
    if (this.isEmptyDriver(hd)) return "--";
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

  private static formatDriverNameOrNickname(
    baseKey: string,
    propertyName: string,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (this.isEmptyDriver(hd)) {
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
    if (baseKey === "driver.nickname") return d?.nickname || d?.name || "";
    return d?.name || "";
  }

  private static formatTeamName(
    propertyName: string,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
  ): string {
    if (ctx.getRace()?.practice) return "";
    if (this.isEmptyDriver(hd)) {
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

  private static formatAvatarUrl(
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (value && typeof value === "string" && value.trim()) {
      return ctx.getFullUrl ? ctx.getFullUrl(value.trim()) : value.trim();
    }
    if (!this.isEmptyDriver(hd)) {
      const defaultAvatar = "assets/images/default_avatar.svg";
      return ctx.getFullUrl ? ctx.getFullUrl(defaultAvatar) : defaultAvatar;
    }
    return "";
  }

  private static formatRanks(
    baseKey: string,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (this.isEmptyDriver(hd)) return "--";
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

  private static formatPredictions(
    baseKey: string,
    hd: DriverHeatData,
  ): string {
    if (baseKey === "winProbability") {
      const prob =
        (hd as any).winProbability ?? (hd.participant as any)?.winProbability;
      if (prob !== undefined && prob >= 0) return `${Math.round(prob * 100)}%`;
      if (this.isEmptyDriver(hd)) return "--";
      return "--%";
    }
    if (baseKey === "projectedRank") {
      const rank =
        (hd as any).projectedRank ?? (hd.participant as any)?.projectedRank;
      if (rank && rank > 0) return `#${rank}`;
      if (this.isEmptyDriver(hd)) return "--";
      return "--";
    }
    if (baseKey === "projectedLaps") {
      const laps =
        (hd as any).projectedLaps ?? (hd.participant as any)?.projectedLaps;
      if (laps !== undefined && laps >= 0) return `${laps}`;
      if (this.isEmptyDriver(hd)) return "--";
      return "--";
    }
    return "--";
  }

  static formatColumnValue(
    heatDriver: DriverHeatData,
    column: ColumnDefinition | undefined,
    propertyName: string | undefined,
    ctx: FormatContext,
    anchor?: string,
  ): string {
    const prop = propertyName || column?.propertyName || "";
    if (column && prop === column.propertyName && column.formatter) {
      return column.formatter(
        RacedayFormatUtils.getPropertyValue(
          heatDriver,
          prop,
          ctx.laneViewWidgetSettings,
          anchor,
        ),
        heatDriver,
        column,
        anchor,
      );
    }
    const value = RacedayFormatUtils.getPropertyValue(
      heatDriver,
      prop,
      ctx.laneViewWidgetSettings,
      anchor,
    );
    return RacedayFormatUtils.formatValue(
      prop,
      value,
      heatDriver,
      column,
      ctx,
      anchor,
    );
  }
}
