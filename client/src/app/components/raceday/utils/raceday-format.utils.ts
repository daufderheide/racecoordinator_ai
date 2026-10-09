/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { Driver } from "@app/models/driver";
import { AllowFinish, FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { RaceFlag, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import {
  formatTimerDisplay,
  TimerFormatOptions,
} from "@app/utils/timer-format.utils";

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

  static getPropertyValue(
    heatDriver: DriverHeatData,
    propertyPath: string,
  ): any {
    if (!heatDriver) return undefined;
    const baseKey = propertyPath.split(".")[0].split("_")[0];
    if (baseKey === "heatTotalLaps") {
      return heatDriver.lapCount;
    }
    const p =
      heatDriver.participant ?? (heatDriver as any).actualDriver?.participant;
    const overallVal = RacedayFormatUtils.extractOverallPropertyValue(
      p,
      heatDriver as any,
      baseKey,
    );
    if (overallVal !== undefined) {
      return overallVal;
    }
    const parts = propertyPath.split(".").map((part) => part.split("_")[0]);
    let value: any = heatDriver;
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    return value;
  }

  private static extractOverallPropertyValue(
    p: any,
    heatDriver: any,
    baseKey: string,
  ): any {
    switch (baseKey) {
      case "overallLapCount":
      case "totalLaps":
      case "raceTotalLaps":
      case "overallTotalLaps":
        return (
          p?.totalLaps ??
          heatDriver?.totalLaps ??
          heatDriver?.overallLapCount ??
          heatDriver?.lapCount
        );
      case "overallPhysicalLapCount":
        return (
          p?.physicalLapCount ??
          heatDriver?.physicalLapCount ??
          heatDriver?.overallPhysicalLapCount
        );
      case "overallTotalTime":
        return (
          p?.totalTime ?? heatDriver?.totalTime ?? heatDriver?.overallTotalTime
        );
      case "overallBestLapTime":
        return (
          p?.bestLapTime ??
          heatDriver?.bestLapTime ??
          heatDriver?.overallBestLapTime
        );
      case "overallAverageLapTime":
        return (
          p?.averageLapTime ??
          heatDriver?.averageLapTime ??
          heatDriver?.overallAverageLapTime
        );
      case "overallMedianLapTime":
        return (
          p?.medianLapTime ??
          heatDriver?.medianLapTime ??
          heatDriver?.overallMedianLapTime
        );
      case "overallConsistencyScore":
        return (
          p?.consistencyScore ??
          heatDriver?.consistencyScore ??
          heatDriver?.overallConsistencyScore
        );
      case "overallStandardDeviation":
        return (
          p?.standardDeviation ??
          heatDriver?.standardDeviation ??
          heatDriver?.overallStandardDeviation
        );
      case "overallAverageTop5":
        return (
          p?.averageTop5 ??
          heatDriver?.averageTop5 ??
          heatDriver?.overallAverageTop5
        );
      case "overallAverageTop10":
        return (
          p?.averageTop10 ??
          heatDriver?.averageTop10 ??
          heatDriver?.overallAverageTop10
        );
      case "overallAverageTop15":
        return (
          p?.averageTop15 ??
          heatDriver?.averageTop15 ??
          heatDriver?.overallAverageTop15
        );
      case "overallTop2Consecutive":
        return (
          p?.top2Consecutive ??
          heatDriver?.top2Consecutive ??
          heatDriver?.overallTop2Consecutive
        );
      case "overallTop3Consecutive":
        return (
          p?.top3Consecutive ??
          heatDriver?.top3Consecutive ??
          heatDriver?.overallTop3Consecutive
        );
      case "overallGapLeader":
        return (
          p?.gapLeader ?? heatDriver?.gapLeader ?? heatDriver?.overallGapLeader
        );
      case "overallGapPosition":
        return (
          p?.gapPosition ??
          heatDriver?.gapPosition ??
          heatDriver?.overallGapPosition
        );
      case "overallGapLeaderF1":
        return (
          p?.gapLeaderF1 ??
          heatDriver?.gapLeaderF1 ??
          heatDriver?.overallGapLeaderF1
        );
      case "overallGapPositionF1":
        return (
          p?.gapPositionF1 ??
          heatDriver?.gapPositionF1 ??
          heatDriver?.overallGapPositionF1
        );
      case "overallLapsLed":
        return p?.lapsLed ?? heatDriver?.lapsLed ?? heatDriver?.overallLapsLed;
      case "overallTrackCalls":
        return (
          p?.trackCalls ??
          heatDriver?.trackCalls ??
          heatDriver?.overallTrackCalls
        );
      case "overallPoints":
        return (
          p?.totalPoints ?? heatDriver?.totalPoints ?? heatDriver?.overallPoints
        );
      default:
        return undefined;
    }
  }

  static resolveTimerFormatOptions(
    colKey: string,
    settings: any,
  ): TimerFormatOptions | undefined {
    if (!settings) return undefined;
    const baseKey = colKey ? colKey.split("_")[0] : "";
    const isTotalTime =
      colKey === "totalTime" ||
      colKey === "overallTotalTime" ||
      baseKey === "totalTime" ||
      baseKey === "overallTotalTime";
    if (!isTotalTime) return undefined;

    const colFormat =
      settings.columnTimeDisplayFormat?.[colKey] ??
      settings.columnTimeDisplayFormat?.[baseKey];
    const colSubMode =
      settings.columnTimeSubsecondMode?.[colKey] ??
      settings.columnTimeSubsecondMode?.[baseKey];
    const colThresh =
      settings.columnTimeSubsecondThreshold?.[colKey] ??
      settings.columnTimeSubsecondThreshold?.[baseKey];
    const colDec =
      settings.columnTimeSubsecondDecimals?.[colKey] ??
      settings.columnTimeSubsecondDecimals?.[baseKey];

    if (
      colFormat !== undefined ||
      colSubMode !== undefined ||
      colThresh !== undefined ||
      colDec !== undefined
    ) {
      return {
        format: colFormat || "dynamic",
        subsecondMode: colSubMode || "threshold",
        subsecondThreshold: colThresh !== undefined ? Number(colThresh) : 10,
        subsecondDecimals: colDec !== undefined ? Number(colDec) : 2,
      };
    }

    if (
      settings.timeDisplayFormat !== undefined ||
      settings.timeSubsecondMode !== undefined ||
      settings.timeSubsecondThreshold !== undefined ||
      settings.timeSubsecondDecimals !== undefined
    ) {
      return {
        format: settings.timeDisplayFormat || "dynamic",
        subsecondMode: settings.timeSubsecondMode || "threshold",
        subsecondThreshold:
          settings.timeSubsecondThreshold !== undefined
            ? Number(settings.timeSubsecondThreshold)
            : 10,
        subsecondDecimals:
          settings.timeSubsecondDecimals !== undefined
            ? Number(settings.timeSubsecondDecimals)
            : 2,
      };
    }

    return undefined;
  }

  private static formatOverallValue(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
    timePlaceholder: string,
    lapPlaceholder: string,
    timeDecimals: number,
    lapDecimals: number,
    colKey?: string,
  ): string | null {
    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      if (
        baseKey === "overallPhysicalLapCount" ||
        baseKey === "overallLapsLed" ||
        baseKey === "overallTrackCalls" ||
        baseKey === "overallPoints"
      ) {
        return "--";
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
    }

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
        );
        if (timerOpts) {
          return formatTimerDisplay(value, timerOpts);
        }
      }
      return isValid ? value.toFixed(timeDecimals) : timePlaceholder;
    }

    if (baseKey === "overallConsistencyScore") {
      if (value === null || value === undefined) return "--.-%";
      return value.toFixed(1) + "%";
    }

    if (baseKey === "overallGapLeader" || baseKey === "overallGapPosition") {
      if (value === 0 || value === null || value === undefined) {
        return timePlaceholder;
      }
      const sign = value > 0 ? "+" : "";
      return sign + value.toFixed(timeDecimals);
    }

    if (
      baseKey === "overallGapLeaderF1" ||
      baseKey === "overallGapPositionF1"
    ) {
      const isLeader = baseKey === "overallGapLeaderF1";
      const p = hd?.participant;
      const lapsDown =
        (isLeader ? p?.lapsDownLeader : p?.lapsDownPosition) ??
        (isLeader ? hd?.lapsDownLeader : hd?.lapsDownPosition) ??
        0;

      if (lapsDown === 1) {
        return ctx
          .translate("RD_LAP_DOWN")
          .replace("{{count}}", lapsDown.toString());
      } else if (lapsDown > 1) {
        return ctx
          .translate("RD_LAPS_DOWN")
          .replace("{{count}}", lapsDown.toString());
      } else {
        if (value === 0 || value === null || value === undefined) {
          return timePlaceholder;
        }
        const sign = value > 0 ? "+" : "";
        return sign + value.toFixed(timeDecimals);
      }
    }

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
      return Number(value).toFixed(lapDecimals);
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

    const isInset = anchor ? !anchor.startsWith("center-") : false;

    const colKey = column?.propertyName || baseKey;
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

    const timeDecimals = isInset
      ? ctx.laneViewWidgetSettings?.insetTimeDecimalPlaces !== undefined
        ? Number(ctx.laneViewWidgetSettings.insetTimeDecimalPlaces)
        : 3
      : colDecimalOverride !== undefined &&
          colDecimalOverride !== null &&
          colDecimalOverride !== ""
        ? Number(colDecimalOverride)
        : ctx.laneViewWidgetSettings?.timeDecimalPlaces !== undefined
          ? Number(ctx.laneViewWidgetSettings.timeDecimalPlaces)
          : 3;
    let lapDecimals = isInset
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

    const onlyShowDecimalsWhenNotRacing =
      ctx.laneViewWidgetSettings?.onlyShowDecimalsWhenNotRacing ??
      ctx.laneViewWidgetSettings?.onlyShowSegmentsWhenNotRacing ??
      ctx.laneViewWidgetSettings?.onlyShowDecimalsIfSegments ??
      ctx.laneViewWidgetSettings?.columnOnlyShowDecimalsWhenNotRacing?.[
        column?.propertyName ?? ""
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowSegmentsWhenNotRacing?.[
        column?.propertyName ?? ""
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowDecimalsIfSegments?.[
        column?.propertyName ?? ""
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowDecimalsWhenNotRacing?.[
        colKey
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowSegmentsWhenNotRacing?.[
        colKey
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowDecimalsIfSegments?.[colKey] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowDecimalsWhenNotRacing?.[
        baseKey
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowSegmentsWhenNotRacing?.[
        baseKey
      ] ??
      ctx.laneViewWidgetSettings?.columnOnlyShowDecimalsIfSegments?.[baseKey] ??
      false;

    if (onlyShowDecimalsWhenNotRacing) {
      const isLapMetric =
        baseKey === "lapCount" ||
        baseKey === "heatTotalLaps" ||
        baseKey === "overallLapCount" ||
        baseKey === "totalLaps" ||
        baseKey === "raceTotalLaps" ||
        baseKey === "overallTotalLaps";

      if (isLapMetric) {
        const state = ctx.getRaceState ? ctx.getRaceState() : ctx.raceState;
        const isRacingOrStarting =
          state === RaceState.RACING || state === RaceState.STARTING;
        if (isRacingOrStarting) {
          lapDecimals = 0;
        }
      }
    }

    const timePlaceholder =
      timeDecimals > 0 ? "--." + "-".repeat(timeDecimals) : "--";
    const lapPlaceholder =
      lapDecimals > 0 ? "--." + "-".repeat(lapDecimals) : "--";

    if (
      baseKey.startsWith("overall") ||
      baseKey === "totalLaps" ||
      baseKey === "raceTotalLaps"
    ) {
      const overallStr = RacedayFormatUtils.formatOverallValue(
        baseKey,
        value,
        hd,
        ctx,
        timePlaceholder,
        lapPlaceholder,
        timeDecimals,
        lapDecimals,
        colKey,
      );
      if (overallStr !== null) {
        return overallStr;
      }
    }

    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      if (baseKey === "seed") {
        return "";
      }
      if (
        baseKey === "rankHeat" ||
        baseKey === "rankOverall" ||
        baseKey === "rankGroup" ||
        baseKey === "lapsLed" ||
        baseKey === "trackCalls" ||
        baseKey === "physicalLapCount" ||
        baseKey === "recordLapTime" ||
        baseKey === "bestRaceLapTime" ||
        baseKey.startsWith("ghostPacing")
      ) {
        return "--";
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
      if (baseKey === "consistencyScore") {
        return "--.-%";
      }
      if (
        isInset &&
        (baseKey === "flag" ||
          (baseKey.startsWith("imageset") &&
            propertyName.toLowerCase().includes("driverstate")))
      ) {
        return "";
      }
    }

    if (baseKey === "recordLapTime") {
      const entry = ctx.getLaneRecordEntry
        ? ctx.getLaneRecordEntry(hd?.laneIndex ?? 0)
        : undefined;
      if (entry && entry.value > 0) {
        const timeStr = entry.value.toFixed(timeDecimals);
        const nickname = entry.holderNickname || entry.holderName || "---";
        let dateStr = "---";
        if (entry.date) {
          let ms = 0;
          if (typeof entry.date === "number") {
            ms = entry.date;
          } else if (entry.date.toNumber) {
            ms = entry.date.toNumber();
          } else if (typeof entry.date === "string") {
            ms = parseInt(entry.date, 10);
          } else {
            ms = Number(entry.date);
          }
          if (ms > 0 && !isNaN(ms)) {
            if (ctx.formatDate) {
              dateStr = ctx.formatDate(ms);
            } else {
              const d = new Date(ms);
              dateStr = new Intl.DateTimeFormat("en-US", {
                dateStyle: "short",
              }).format(d);
            }
          }
        }
        return `${timeStr} (${nickname}, ${dateStr})`;
      }
      return `${timePlaceholder} (---, ---)`;
    } else if (baseKey === "bestRaceLapTime") {
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
    } else if (
      baseKey.includes("LapTime") ||
      baseKey === "reactionTime" ||
      baseKey === "totalTime" ||
      baseKey === "standardDeviation" ||
      baseKey === "averageTop5" ||
      baseKey === "averageTop10" ||
      baseKey === "averageTop15" ||
      baseKey === "top2Consecutive" ||
      baseKey === "top3Consecutive"
    ) {
      const isStdDev = baseKey === "standardDeviation";
      const isValid =
        value !== null &&
        value !== undefined &&
        (isStdDev ? value >= 0 : value > 0);
      if (isValid && baseKey === "totalTime") {
        const timerOpts = RacedayFormatUtils.resolveTimerFormatOptions(
          colKey,
          ctx.laneViewWidgetSettings,
        );
        if (timerOpts) {
          return formatTimerDisplay(value, timerOpts);
        }
      }
      return isValid ? value.toFixed(timeDecimals) : timePlaceholder;
    } else if (baseKey === "consistencyScore") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--.-%";
      if (value === null || value === undefined) return "--.-%";
      return value.toFixed(1) + "%";
    } else if (baseKey === "gapLeader" || baseKey === "gapPosition") {
      if (value === 0) return timePlaceholder;
      const sign = value > 0 ? "+" : "";
      return sign + value.toFixed(timeDecimals);
    } else if (baseKey === "gapLeaderF1" || baseKey === "gapPositionF1") {
      const isLeader = baseKey === "gapLeaderF1";
      const lapsDown = isLeader ? hd.lapsDownLeader : hd.lapsDownPosition;

      if (lapsDown === 1) {
        return ctx
          .translate("RD_LAP_DOWN")
          .replace("{{count}}", lapsDown.toString());
      } else if (lapsDown > 1) {
        return ctx
          .translate("RD_LAPS_DOWN")
          .replace("{{count}}", lapsDown.toString());
      } else {
        if (value === 0) return timePlaceholder;
        const sign = value > 0 ? "+" : "";
        return sign + value.toFixed(timeDecimals);
      }
    } else if (baseKey === "lapCount" || baseKey === "heatTotalLaps") {
      const hasReactionTime = hd.reactionTime > 0;
      const hasRealLap = hd.lapTimes && hd.lapTimes.length > 0;
      const hasAdjustment =
        (hd.userLaps !== undefined && hd.userLaps !== 0) ||
        (hd.autoCalculatedLaps !== undefined && hd.autoCalculatedLaps !== 0) ||
        (hd.penaltyLaps !== undefined && hd.penaltyLaps !== 0) ||
        (hd.adjustedLapCount !== undefined && hd.adjustedLapCount !== 0);

      if (
        value === null ||
        value === undefined ||
        (!hasReactionTime && !hasRealLap && !hasAdjustment)
      ) {
        return lapPlaceholder;
      }
      return Number(value).toFixed(lapDecimals);
    } else if (baseKey === "physicalLapCount") {
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
    } else if (baseKey === "lapsLed") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      const led =
        value !== undefined && value !== null
          ? value
          : (hd?.lapsLed ?? (hd as any)?.laps_led ?? 0);
      return String(led);
    } else if (baseKey === "trackCalls") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      const calls =
        value !== undefined && value !== null
          ? value
          : (hd?.trackCalls ?? (hd as any)?.track_calls ?? 0);
      return String(calls);
    } else if (baseKey === "laneNumber") {
      return String((hd?.laneIndex ?? 0) + 1);
    } else if (baseKey.startsWith("ghostPacing")) {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      const ghostLap = (hd as any).ghostLapTime ?? 0;
      const currentLapTime = (hd as any).currentLapTime ?? hd.lastLapTime ?? 0;
      if (ghostLap > 0 && currentLapTime > 0) {
        const delta = ghostLap - currentLapTime;
        const fixedVal = delta.toFixed(timeDecimals);
        if (Math.abs(Number(fixedVal)) === 0) {
          return (0).toFixed(timeDecimals) + "s";
        }
        const sign = delta > 0 ? "+" : "";
        return sign + fixedVal + "s";
      }
      return "--";
    } else if (baseKey === "driver.name") {
      if (RacedayFormatUtils.isEmptyDriver(hd))
        return ctx.translate("RD_EMPTY_LANE");
      const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
      return d?.name || "";
    } else if (baseKey === "driver.nickname") {
      if (RacedayFormatUtils.isEmptyDriver(hd))
        return ctx.translate("RD_EMPTY_LANE");
      const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
      return d?.nickname || d?.name || "";
    } else if (baseKey === "participant.team.name") {
      if (ctx.getRace()?.practice) {
        return "";
      }
      if (RacedayFormatUtils.isEmptyDriver(hd)) {
        if (
          column &&
          column.layout[AnchorPoint.CenterCenter] === propertyName
        ) {
          return ctx.translate("RD_EMPTY_LANE");
        }
        return "";
      }
      return hd.participant?.team?.name || (hd.driver as any)?.team?.name || "";
    } else if (baseKey === "participant.fuelLevel") {
      return value !== undefined ? value.toFixed(1) : "--.-";
    } else if (baseKey === "fuelCapacity") {
      const race = ctx.getRace();
      const track = ctx.getTrack();
      const capacity =
        typeof track?.hasDigitalFuel === "function" && track.hasDigitalFuel()
          ? race?.digital_fuel_options?.capacity
          : race?.fuel_options?.capacity;
      return capacity !== undefined ? capacity.toFixed(1) : "--.-";
    } else if (baseKey === "fuelPercentage") {
      const level = hd.participant?.fuelLevel ?? (hd.driver as any)?.fuelLevel;
      const race = ctx.getRace();
      const track = ctx.getTrack();
      const capacity =
        typeof track?.hasDigitalFuel === "function" && track.hasDigitalFuel()
          ? race?.digital_fuel_options?.capacity
          : race?.fuel_options?.capacity;
      if (level !== undefined && capacity !== undefined && capacity > 0) {
        const percentage = Math.round((level / capacity) * 100);
        return percentage + "%";
      }
      return "--%";
    } else if (baseKey === "driver.avatarUrl") {
      return ctx.getFullUrl(value);
    } else if (baseKey === "seed") {
      const seed = hd.participant?.seed ?? (hd.driver as any)?.seed;
      return seed ? `(${seed})` : "--";
    } else if (baseKey === "rankHeat") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      const rank = ctx.getDriverRanking(hd.objectId);
      return rank ? `${rank}` : "--";
    } else if (baseKey === "rankOverall") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      const rank = ctx.getDriverOverallRanking
        ? ctx.getDriverOverallRanking(hd)
        : (hd.participant?.rank ?? (hd.driver as any)?.rank);
      return rank ? `${rank}` : "--";
    } else if (baseKey === "rankGroup") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      let rank: number | undefined;
      if (ctx.getDriverGroupRanking) {
        rank = ctx.getDriverGroupRanking(hd);
      }
      return rank !== undefined ? `${rank}` : "--";
    } else if (baseKey === "winProbability") {
      const prob =
        (hd as any).winProbability ?? (hd.participant as any)?.winProbability;
      if (prob !== undefined && prob >= 0) return `${Math.round(prob * 100)}%`;
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      return "--%";
    } else if (baseKey === "projectedRank") {
      const rank =
        (hd as any).projectedRank ?? (hd.participant as any)?.projectedRank;
      if (rank && rank > 0) return `#${rank}`;
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      return "--";
    } else if (baseKey === "projectedLaps") {
      const laps =
        (hd as any).projectedLaps ?? (hd.participant as any)?.projectedLaps;
      if (laps !== undefined && laps >= 0) return `${laps}`;
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "--";
      return "--";
    } else if (baseKey === "flag") {
      return RacedayFormatUtils.formatFlagValue(value, hd, column, ctx);
    } else if (baseKey === "segmentTime") {
      const parts = propertyName.split("_");
      const index = parts.length > 1 ? parseInt(parts[1], 10) : 0;

      let useIndex = true;
      let segmentCount = 0;
      if (column) {
        segmentCount = Object.values(column.layout).filter((v) =>
          v?.startsWith("segmentTime"),
        ).length;
        if (segmentCount <= 1) {
          useIndex = false;
        }
      } else if (index === 0) {
        useIndex = false;
      }

      if (useIndex) {
        let actualIndex = index;
        if (propertyName === "segmentTime" && column) {
          const anchorOrder = [
            AnchorPoint.TopLeft,
            AnchorPoint.TopCenter,
            AnchorPoint.TopRight,
            AnchorPoint.CenterLeft,
            AnchorPoint.CenterCenter,
            AnchorPoint.CenterRight,
            AnchorPoint.BottomLeft,
            AnchorPoint.BottomCenter,
            AnchorPoint.BottomRight,
          ];
          let counter = 0;
          for (const anchor of anchorOrder) {
            const p = column.layout[anchor];
            if (p && p.split("_")[0] === "segmentTime") {
              if (p === "segmentTime") {
                actualIndex = counter;
                break;
              }
              counter++;
            }
          }
        }

        const segmentVal = hd.currentLapSegments[actualIndex];
        return segmentVal !== undefined && segmentVal > 0
          ? segmentVal.toFixed(timeDecimals)
          : timePlaceholder;
      } else {
        return hd.lastSegmentTime > 0
          ? hd.lastSegmentTime.toFixed(timeDecimals)
          : timePlaceholder;
      }
    } else if (baseKey === "mph" || baseKey === "kph" || baseKey === "fph") {
      const lastLapTime = hd.lastLapTime;
      const track = ctx.getTrack();
      const lane = track?.lanes?.[hd.laneIndex];
      const length = lane?.length;
      const scale =
        track?.track_scale && track.track_scale > 0 && track.track_scale <= 1
          ? track.track_scale
          : 1.0;

      if (lastLapTime > 0 && length !== undefined && length > 0) {
        const scaledLength = length / scale;
        const fph = (scaledLength / lastLapTime) * 3600;
        if (baseKey === "fph") return fph.toFixed(0);

        const mph = fph / 5280;
        if (baseKey === "mph") return mph.toFixed(2);

        const kph = mph * 1.609344;
        if (baseKey === "kph") return kph.toFixed(2);
      }
      return "--.--";
    } else if (
      baseKey.startsWith("imageset") ||
      baseKey === "fuel-gauge-builtin"
    ) {
      return ctx.getImageSetUrl(hd, propertyName);
    } else if (baseKey === "qrCode") {
      return ctx.getLaneQrCodeUrl ? ctx.getLaneQrCodeUrl(hd.laneIndex) : "";
    } else if (baseKey === "driverViewQrCode") {
      if (this.isEmptyDriver(hd)) return "";
      return ctx.getDriverViewQrCodeUrl ? ctx.getDriverViewQrCodeUrl(hd) : "";
    }

    return value?.toString() ?? "";
  }

  private static formatFlagValue(
    value: any,
    hd: DriverHeatData | undefined,
    _column: ColumnDefinition | undefined,
    ctx: FormatContext,
  ): string {
    const race = ctx.getRace?.();
    const isFuelEnabled =
      (race?.fuel_options && race.fuel_options.enabled) ||
      (race?.digital_fuel_options && race.digital_fuel_options.enabled) ||
      (race as any)?.fuelOptions?.enabled ||
      (race as any)?.digitalFuelOptions?.enabled;

    const isOutOfFuel =
      Boolean(isFuelEnabled) &&
      ((hd?.participant &&
        hd.participant.fuelLevel !== undefined &&
        hd.participant.fuelLevel <= 0) ||
        (hd?.driver &&
          (hd.driver as any).fuelLevel !== undefined &&
          (hd.driver as any).fuelLevel <= 0));

    const isPenalized = Boolean(
      hd && ((hd as any).remainingFalseStartTimePenalty > 0 || isOutOfFuel),
    );

    if (isPenalized) {
      return ctx.getFlagUrl("flag.penalty");
    }

    const isWarmupOrCooldown =
      Boolean(ctx.isWarmup?.()) ||
      Boolean(ctx.isCooldown?.()) ||
      ctx.getFlagType?.() === "flag.warmup" ||
      value === RaceFlag.GREEN_YELLOW ||
      hd?.flag === RaceFlag.GREEN_YELLOW;

    const allFinished =
      ctx.areAllDriversFinished !== undefined
        ? ctx.areAllDriversFinished()
        : false;

    if (allFinished) {
      if (isWarmupOrCooldown) {
        return ctx.getFlagUrl("flag.warmup");
      }
      const isRaceOver = ctx.isRaceOver ? ctx.isRaceOver() : false;
      return ctx.getFlagUrl(isRaceOver ? "flag.race_over" : "flag.heat_over");
    }

    const isFinished =
      Boolean(hd?.isFinished) ||
      Boolean(
        hd &&
        ctx.isDriverFinished &&
        ctx.isDriverFinished(
          hd,
          ctx.getRace()?.heat_scoring ?? (ctx.getRace() as any)?.heatScoring,
        ),
      );

    if (isFinished && RacedayFormatUtils.isAllowFinish(ctx.getRace())) {
      if (isWarmupOrCooldown) {
        return ctx.getFlagUrl("flag.warmup");
      }
      return ctx.getFlagUrl("flag.driver_finished");
    }

    // Check for one lap to go
    const scoring: any = race?.heat_scoring ?? (race as any)?.heatScoring;
    const finishMethod = scoring?.finishMethod ?? scoring?.finish_method;
    const finishValue = scoring?.finishValue ?? scoring?.finish_value;
    const isOneLapToGo =
      value === RaceFlag.WHITE ||
      hd?.flag === RaceFlag.WHITE ||
      Boolean(
        (finishMethod === "Lap" ||
          finishMethod === 1 ||
          finishMethod === FinishMethod.Lap) &&
        finishValue !== undefined &&
        finishValue > 0 &&
        hd?.lapCount === finishValue - 1,
      );

    if (isOneLapToGo) {
      return ctx.getFlagUrl("flag.one_lap_to_go");
    }

    // If actively racing in allow-finish heat_finishing period,
    // an unfinished driver who is still racing displays flag.racing.
    const flagType = ctx.getFlagType?.();
    if (flagType === "flag.heat_finishing") {
      return ctx.getFlagUrl("flag.racing");
    }

    if (
      value === RaceFlag.GREEN_YELLOW ||
      hd?.flag === RaceFlag.GREEN_YELLOW ||
      isWarmupOrCooldown
    ) {
      return ctx.getFlagUrl("flag.warmup");
    }

    if (value === RaceFlag.BLACK || hd?.flag === RaceFlag.BLACK) {
      return ctx.getFlagUrl("flag.penalty");
    }

    const flag =
      value === RaceFlag.UNKNOWN_FLAG || value === 0
        ? ctx.getFlagType()
        : value;
    return ctx.getFlagUrl(flag);
  }

  static formatColumnValue(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    propertyName: string | undefined,
    ctx: FormatContext,
    anchor?: string,
  ): string {
    const prop = propertyName || column.propertyName;
    if (prop === column.propertyName && column.formatter) {
      return column.formatter(
        RacedayFormatUtils.getPropertyValue(heatDriver, prop),
        heatDriver,
        column,
        anchor,
      );
    }
    const value = RacedayFormatUtils.getPropertyValue(heatDriver, prop);
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
