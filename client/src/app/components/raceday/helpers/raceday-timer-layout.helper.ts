import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { FinishMethod } from "@app/models/heat_scoring";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { RaceState } from "@app/proto/antigravity";
import {
  formatTimerDisplay,
  TimerFormatOptions,
} from "@app/utils/timer-format.utils";

export class RacedayTimerLayoutHelper {
  static getAutoStatusLabel(host: any): string {
    if (
      host.raceHasEnded ||
      host.raceState === RaceState.RACE_OVER ||
      host.raceState === RaceState.PAUSED ||
      host.raceState === RaceState.RACING ||
      host.raceState === RaceState.STARTING
    ) {
      return "";
    }
    if (
      (host.raceState === RaceState.NOT_STARTED ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoStartRemaining > 0
    ) {
      return "RD_AUTO_STARTING";
    }
    if (
      (host.raceState === RaceState.HEAT_OVER ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoAdvanceRemaining > 0
    ) {
      return "RD_AUTO_ADVANCING";
    }
    return "";
  }

  static isAutoSegments(host: any): boolean {
    const af = host.race?.heat_scoring?.allowFinish as string;
    return af === "NoneAutoSegments" || af === "SingleLapAutoSegments";
  }

  static getTimerFormatOptions(host: any): TimerFormatOptions {
    const timerWidget =
      host.cachedLayoutRef === host.layout
        ? host.cachedTimerWidget
        : host.layout?.widgets?.find(
            (w: AbsoluteWidgetNode) => w.widgetType === "timer",
          );

    if (host.cachedLayoutRef !== host.layout) {
      host.cachedLayoutRef = host.layout;
      host.cachedTimerWidget = timerWidget;
    }

    const currentSettings = timerWidget?.customSettings;
    const format = currentSettings?.["timeDisplayFormat"] ?? "dynamic";
    const subsecondMode = currentSettings?.["timeSubsecondMode"] ?? "threshold";
    const subsecondThreshold =
      currentSettings?.["timeSubsecondThreshold"] ?? 10;
    const subsecondDecimals = currentSettings?.["timeSubsecondDecimals"] ?? 2;

    if (
      host.cachedTimerFormatOptions &&
      host.cachedTimerSettings === currentSettings &&
      host.cachedTimerFormatOptions.format === format &&
      host.cachedTimerFormatOptions.subsecondMode === subsecondMode &&
      host.cachedTimerFormatOptions.subsecondThreshold === subsecondThreshold &&
      host.cachedTimerFormatOptions.subsecondDecimals === subsecondDecimals
    ) {
      return host.cachedTimerFormatOptions;
    }

    host.cachedTimerSettings = currentSettings;
    host.cachedTimerFormatOptions = {
      format,
      subsecondMode,
      subsecondThreshold,
      subsecondDecimals,
    };
    return host.cachedTimerFormatOptions;
  }

  static getFormattedTime(host: any): string {
    const s = host.raceState;
    const timerOpts = RacedayTimerLayoutHelper.getTimerFormatOptions(host);

    const showDurationOnly =
      host.race?.heat_scoring?.finishMethod === FinishMethod.Timed &&
      ((s === RaceState.NOT_STARTED &&
        host.autoStartRemaining <= 0 &&
        host.autoAdvanceRemaining <= 0) ||
        (s === RaceState.STARTING && !host.isRestarting));

    if (showDurationOnly) {
      const duration = host.race?.heat_scoring?.finishValue || 0;
      return formatTimerDisplay(duration, {
        ...timerOpts,
        subsecondMode: "never",
      });
    }

    if (
      (s === RaceState.NOT_STARTED || s === RaceState.UNKNOWN_STATE) &&
      host.autoStartRemaining <= 0 &&
      host.autoAdvanceRemaining <= 0
    ) {
      return "--";
    }

    const time = host.time || 0;

    if (
      (s === RaceState.HEAT_OVER ||
        s === RaceState.RACE_OVER ||
        host.raceHasEnded) &&
      time <= 0
    ) {
      return formatTimerDisplay(0, {
        ...timerOpts,
        subsecondMode:
          timerOpts.subsecondMode === "always" ? "always" : "never",
      });
    }

    const parts = host.timeFormat.split(".");
    const fractionDigits =
      parts.length > 1 ? Number(parts[1].split("-")[1]) : 0;

    const effOptions: TimerFormatOptions = { ...timerOpts };
    if (fractionDigits > 0 && effOptions.subsecondMode !== "never") {
      effOptions.subsecondDecimals = fractionDigits;
      if (
        effOptions.subsecondMode === "threshold" &&
        time > (effOptions.subsecondThreshold ?? 10)
      ) {
        effOptions.subsecondMode = "always";
      }
    } else if (
      fractionDigits === 0 &&
      effOptions.subsecondMode === "threshold"
    ) {
      effOptions.subsecondDecimals = 0;
    }

    return formatTimerDisplay(time, effOptions);
  }

  static getGridTemplateColumns(host: any): string {
    if (!host.columns || host.columns.length === 0) return "1fr";
    return host.columns.map((c: any) => `minmax(0, ${c.width}fr)`).join(" ");
  }

  static getGridTemplateRowsVertical(host: any): string {
    if (!host.columns || host.columns.length === 0) return "1fr";

    const lapTimeCol = host.columns.find((c: any) =>
      RacedayLayoutUtils.isLapTimeColumn(c),
    );
    const nicknameCol = host.columns.find(
      (c: any) =>
        c.propertyName.startsWith("driver.nickname") ||
        c.propertyName.startsWith("driver.name"),
    );

    const lapTimeWidth = lapTimeCol ? lapTimeCol.width : 150;
    const nicknameWidth = nicknameCol ? nicknameCol.width : 300;

    const largeHeight = Math.max(lapTimeWidth, nicknameWidth);
    const smallHeight = Math.min(lapTimeWidth, nicknameWidth);

    return host.columns
      .map((c: ColumnDefinition) => {
        if (c.propertyName === "lastLaps") {
          return `minmax(0, ${largeHeight * 5}fr)`;
        }
        if (
          c.propertyName === "lapCount" ||
          c.propertyName === "physicalLapCount" ||
          RacedayLayoutUtils.isLapTimeColumn(c)
        ) {
          return `minmax(0, ${largeHeight}fr)`;
        }
        return `minmax(0, ${smallHeight}fr)`;
      })
      .join(" ");
  }

  static isWarmup(host: any): boolean {
    if (
      host.raceHasEnded ||
      host.raceState === RaceState.RACE_OVER ||
      host.raceState === RaceState.PAUSED ||
      host.raceState === RaceState.RACING ||
      host.raceState === RaceState.STARTING
    ) {
      return false;
    }
    if (
      (host.raceState === RaceState.NOT_STARTED ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoStartRemaining > 0 &&
      host.race
    ) {
      const warmupTime = host.race.auto_start_warmup_time || 0;
      const totalTime = host.race.auto_start_time || 0;
      if (warmupTime > 0 && totalTime > 0) {
        return totalTime - host.autoStartRemaining < warmupTime;
      }
    }
    return false;
  }

  static isCooldown(host: any): boolean {
    if (
      host.raceHasEnded ||
      host.raceState === RaceState.RACE_OVER ||
      host.raceState === RaceState.PAUSED ||
      host.raceState === RaceState.RACING ||
      host.raceState === RaceState.STARTING
    ) {
      return false;
    }
    if (
      (host.raceState === RaceState.HEAT_OVER ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoAdvanceRemaining > 0 &&
      host.race
    ) {
      const warmupTime = host.race.auto_advance_warmup_time || 0;
      const totalTime = host.race.auto_advance_time || 0;
      if (warmupTime > 0 && totalTime > 0) {
        return host.autoAdvanceRemaining <= warmupTime;
      }
    }
    return false;
  }
}
