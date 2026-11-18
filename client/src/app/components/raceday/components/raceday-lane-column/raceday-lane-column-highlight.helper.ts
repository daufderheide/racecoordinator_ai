import {
  HighlightLapStyle,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

export function resolveLaneColumnHighlightLapStyle(
  settings: LaneColumnWidgetSettings,
  parent: any,
): HighlightLapStyle {
  if (settings?.highlightLapStyle) {
    return settings.highlightLapStyle;
  }
  if (settings?.highlightRowOnLap === false) {
    return "none";
  }
  if (parent?.isDriverStation) {
    return parent?.highlightLapStyle || "full-glow";
  }
  return parent?.highlightLapStyle || "classic";
}

export function isLaneColumnHighlighted(
  settings: LaneColumnWidgetSettings,
  isHeaderWidget: boolean,
  highlightLapStyle: HighlightLapStyle,
  targetDriver: DriverHeatData | undefined,
  parent: any,
): boolean {
  if (isHeaderWidget) {
    return false;
  }
  if (highlightLapStyle === "none" || settings.highlightRowOnLap === false) {
    return false;
  }
  const driverId = targetDriver?.objectId;
  const participantId = targetDriver?.participant?.objectId;
  const entityDriverId =
    targetDriver?.actualDriver?.entity_id || targetDriver?.driver?.entity_id;
  const hd = parent?.highlightedDrivers;
  if (hd) {
    if (driverId && hd.has(driverId)) return true;
    if (participantId && hd.has(participantId)) return true;
    if (entityDriverId && hd.has(entityDriverId)) return true;
  }
  if (parent?.isDriverStation && parent?.activeLaneIndex !== undefined) {
    const drivers: DriverHeatData[] =
      parent?.sortedHeatDrivers ||
      parent?.heatDrivers ||
      parent?.heat?.heatDrivers ||
      [];
    const hostDriver = drivers.find(
      (d: DriverHeatData) => d.laneIndex === parent?.activeLaneIndex,
    );
    if (hostDriver) {
      if (hostDriver.objectId && hd?.has(hostDriver.objectId)) return true;
      if (
        hostDriver.participant?.objectId &&
        hd?.has(hostDriver.participant.objectId)
      ) {
        return true;
      }
      const hostEntityDriverId =
        hostDriver.actualDriver?.entity_id || hostDriver.driver?.entity_id;
      if (hostEntityDriverId && hd?.has(hostEntityDriverId)) {
        return true;
      }
    }
  }
  return false;
}
