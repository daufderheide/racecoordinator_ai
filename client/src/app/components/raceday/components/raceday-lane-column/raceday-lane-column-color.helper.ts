import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { LaneColumnWidgetSettings } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  isOverallOrSeedDataSource,
  isParentRaceOver,
} from "./raceday-lane-column.utils";

export function resolveHeatEmptyLaneIndex(
  parent: any,
  targetIndex: number,
  track?: any,
): number {
  const lanesCount = track?.lanes?.length ?? 0;
  if (lanesCount <= 0 || targetIndex < 0 || targetIndex >= lanesCount) {
    return -1;
  }
  const drivers: DriverHeatData[] =
    parent?.sortedHeatDrivers ||
    parent?.heatDrivers ||
    parent?.heat?.heatDrivers ||
    [];
  const activeLanes = new Set<number>();
  let activeCount = 0;
  for (const d of drivers) {
    if (!RacedayFormatUtils.isEmptyDriver(d)) {
      activeCount++;
      if (d.laneIndex != null && d.laneIndex >= 0) {
        activeLanes.add(d.laneIndex);
      }
    }
  }
  const unoccupiedLanes: number[] = [];
  for (let i = 0; i < lanesCount; i++) {
    if (!activeLanes.has(i)) {
      unoccupiedLanes.push(i);
    }
  }
  if (targetIndex >= activeCount) {
    const offset = targetIndex - activeCount;
    if (offset < unoccupiedLanes.length) {
      return unoccupiedLanes[offset];
    }
  }
  return -1;
}

export function resolveLaneColumnBackgroundColor(
  settings: LaneColumnWidgetSettings,
  hd: DriverHeatData | undefined,
  parent: any,
  bindingMode: string,
  targetIndex: number,
): string {
  if (settings.useLaneColors === false) {
    return settings.backgroundColor || "#000000";
  }
  if (
    isOverallOrSeedDataSource(settings, parent, bindingMode) &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd) || isParentRaceOver(parent))
  ) {
    return settings.backgroundColor || "transparent";
  }
  const track =
    parent?.track ||
    parent?.race?.track ||
    parent?.raceService?.getRace()?.track;
  const trackLanesCount = track?.lanes?.length;
  if (
    trackLanesCount != null &&
    targetIndex >= trackLanesCount &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd))
  ) {
    return settings.backgroundColor || "transparent";
  }
  if (bindingMode === "hostLane" && parent?.activeLaneBackgroundColor) {
    return parent.activeLaneBackgroundColor;
  }
  if (hd && parent?.getLaneColor) {
    const bg = parent.getLaneColor(hd, "background_color");
    if (bg) return bg;
  }
  let laneIdx = hd?.laneIndex ?? -1;
  if (laneIdx < 0) {
    if (bindingMode === "hostLane") {
      laneIdx = parent?.activeLaneIndex ?? parent?.laneIndex ?? -1;
    } else if (bindingMode === "lane") {
      laneIdx = targetIndex;
    } else if (
      !isOverallOrSeedDataSource(settings, parent, bindingMode) &&
      (!hd || RacedayFormatUtils.isEmptyDriver(hd))
    ) {
      laneIdx = resolveHeatEmptyLaneIndex(parent, targetIndex, track);
    }
  }
  const trackLaneBg =
    laneIdx >= 0 ? track?.lanes?.[laneIdx]?.background_color : undefined;
  return trackLaneBg || settings.backgroundColor || "transparent";
}

export function resolveLaneColumnForegroundColor(
  settings: LaneColumnWidgetSettings,
  hd: DriverHeatData | undefined,
  parent: any,
  bindingMode: string,
  targetIndex: number,
): string {
  if (settings.useLaneColors === false) {
    return settings.textColor || "#ffffff";
  }
  if (
    isOverallOrSeedDataSource(settings, parent, bindingMode) &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd) || isParentRaceOver(parent))
  ) {
    return settings.textColor || "#ffffff";
  }
  const track =
    parent?.track ||
    parent?.race?.track ||
    parent?.raceService?.getRace()?.track;
  const trackLanesCount = track?.lanes?.length;
  if (
    trackLanesCount != null &&
    targetIndex >= trackLanesCount &&
    (!hd || RacedayFormatUtils.isEmptyDriver(hd))
  ) {
    return settings.textColor || "#ffffff";
  }
  if (bindingMode === "hostLane" && parent?.activeLaneForegroundColor) {
    return parent.activeLaneForegroundColor;
  }
  if (hd && parent?.getLaneColor) {
    const fg = parent.getLaneColor(hd, "foreground_color");
    if (fg) return fg;
  }
  let laneIdx = hd?.laneIndex ?? -1;
  if (laneIdx < 0) {
    if (bindingMode === "hostLane") {
      laneIdx = parent?.activeLaneIndex ?? parent?.laneIndex ?? -1;
    } else if (bindingMode === "lane") {
      laneIdx = targetIndex;
    } else if (
      !isOverallOrSeedDataSource(settings, parent, bindingMode) &&
      (!hd || RacedayFormatUtils.isEmptyDriver(hd))
    ) {
      laneIdx = resolveHeatEmptyLaneIndex(parent, targetIndex, track);
    }
  }
  const trackLaneFg =
    laneIdx >= 0 ? track?.lanes?.[laneIdx]?.foreground_color : undefined;
  return (
    trackLaneFg ||
    settings.textColor ||
    (bindingMode === "hostLane"
      ? parent?.activeLaneForegroundColor
      : undefined) ||
    "#ffffff"
  );
}

export function resolveLaneColumnEffectiveHeaderTextColor(
  settings: LaneColumnWidgetSettings,
  isHeaderWidget: boolean,
  getForegroundColor: () => string,
): string {
  if (settings.headerTextColor) {
    return settings.headerTextColor;
  }
  if (isHeaderWidget) {
    return "#ffffff";
  }
  const fg = getForegroundColor();
  if (settings.useLaneColors !== false) {
    return fg;
  }
  return settings.textColor || fg || "#ffffff";
}

export function resolveLaneColumnEffectiveValueTextColor(
  settings: LaneColumnWidgetSettings,
  foregroundColor: string,
): string {
  if (settings.useLaneColors !== false) {
    return foregroundColor;
  }
  return settings.valueTextColor || settings.textColor || foregroundColor;
}

export function resolveLaneColumnEffectiveInsetTextColor(
  settings: LaneColumnWidgetSettings,
  foregroundColor: string,
): string {
  if (settings.useLaneColors !== false) {
    return foregroundColor;
  }
  return settings.insetTextColor || settings.textColor || foregroundColor;
}
