import { TimerFormatOptions } from "@app/utils/timer-format.utils";

export function resolveRacedayTimerFormatOptions(
  colKey: string,
  settings: any,
  isInset?: boolean,
  insetDecimals?: number,
  propertyKey?: string,
): TimerFormatOptions | undefined {
  if (!settings) return undefined;
  const baseKey = colKey ? colKey.split("_")[0] : "";
  const propBase = propertyKey ? propertyKey.split("_")[0] : "";
  const isTotalTime =
    colKey === "totalTime" ||
    colKey === "overallTotalTime" ||
    baseKey === "totalTime" ||
    baseKey === "overallTotalTime" ||
    propertyKey === "totalTime" ||
    propertyKey === "overallTotalTime" ||
    propBase === "totalTime" ||
    propBase === "overallTotalTime";
  if (!isTotalTime) return undefined;

  const colFormat =
    settings.columnTimeDisplayFormat?.[colKey] ??
    settings.columnTimeDisplayFormat?.[baseKey] ??
    (propertyKey
      ? settings.columnTimeDisplayFormat?.[propertyKey]
      : undefined) ??
    (propBase ? settings.columnTimeDisplayFormat?.[propBase] : undefined);
  const colSubMode =
    settings.columnTimeSubsecondMode?.[colKey] ??
    settings.columnTimeSubsecondMode?.[baseKey] ??
    (propertyKey
      ? settings.columnTimeSubsecondMode?.[propertyKey]
      : undefined) ??
    (propBase ? settings.columnTimeSubsecondMode?.[propBase] : undefined);
  const colThresh =
    settings.columnTimeSubsecondThreshold?.[colKey] ??
    settings.columnTimeSubsecondThreshold?.[baseKey] ??
    (propertyKey
      ? settings.columnTimeSubsecondThreshold?.[propertyKey]
      : undefined) ??
    (propBase ? settings.columnTimeSubsecondThreshold?.[propBase] : undefined);
  const colDec =
    settings.columnTimeSubsecondDecimals?.[colKey] ??
    settings.columnTimeSubsecondDecimals?.[baseKey] ??
    (propertyKey
      ? settings.columnTimeSubsecondDecimals?.[propertyKey]
      : undefined) ??
    (propBase ? settings.columnTimeSubsecondDecimals?.[propBase] : undefined) ??
    settings.columnDecimals?.[colKey] ??
    settings.columnDecimals?.[baseKey];

  if (isInset) {
    return buildInsetTimerOptions(
      settings,
      colFormat,
      colSubMode,
      colThresh,
      insetDecimals,
    );
  }

  return buildColumnTimerOptions(
    settings,
    colFormat,
    colSubMode,
    colThresh,
    colDec,
  );
}

function buildInsetTimerOptions(
  settings: any,
  colFormat: any,
  colSubMode: any,
  colThresh: any,
  insetDecimals?: number,
): TimerFormatOptions {
  const effDec =
    settings.timeSubsecondDecimals !== undefined
      ? Number(settings.timeSubsecondDecimals)
      : insetDecimals !== undefined
        ? insetDecimals
        : settings.insetTimeDecimalPlaces !== undefined
          ? Number(settings.insetTimeDecimalPlaces)
          : settings.timeDecimalPlaces !== undefined
            ? Number(settings.timeDecimalPlaces)
            : 3;
  return {
    format: settings.timeDisplayFormat || colFormat || "dynamic",
    subsecondMode:
      settings.timeSubsecondMode ||
      colSubMode ||
      (effDec > 0 ? "always" : "never"),
    subsecondThreshold:
      settings.timeSubsecondThreshold !== undefined
        ? Number(settings.timeSubsecondThreshold)
        : colThresh !== undefined
          ? Number(colThresh)
          : 10,
    subsecondDecimals: effDec,
  };
}

function buildColumnTimerOptions(
  settings: any,
  colFormat: any,
  colSubMode: any,
  colThresh: any,
  colDec: any,
): TimerFormatOptions | undefined {
  const hasTimerConfig =
    colFormat !== undefined ||
    colSubMode !== undefined ||
    colThresh !== undefined ||
    colDec !== undefined ||
    settings.timeDisplayFormat !== undefined ||
    settings.timeSubsecondMode !== undefined ||
    settings.timeSubsecondThreshold !== undefined ||
    settings.timeSubsecondDecimals !== undefined;

  if (!hasTimerConfig) {
    return undefined;
  }

  if (
    colFormat !== undefined ||
    colSubMode !== undefined ||
    colThresh !== undefined ||
    colDec !== undefined
  ) {
    return {
      format: colFormat || "dynamic",
      subsecondMode: colSubMode || "never",
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
      subsecondMode: settings.timeSubsecondMode || "never",
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
