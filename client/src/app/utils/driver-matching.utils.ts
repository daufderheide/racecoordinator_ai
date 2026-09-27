import { ILap } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

export class DriverMatchingUtils {
  /**
   * Finds the unique DriverHeatData within a list of heat drivers that corresponds to an incoming lap event.
   *
   * Resolution hierarchy:
   * 1. Exact match by DriverHeatData objectId (uniquely identifies a specific lane in the heat).
   * 2. Hardware lane match by interfaceId / laneIndex (uniquely identifies the physical lane sensor).
   * 3. Fallback: match by participant.objectId ONLY IF exactly 1 driver in the heat matches.
   *    (If multiple lanes share the same participant, such as in SingleHeatSoloAllLanes, participant is ambiguous).
   * 4. Fallback: match by driverId ONLY IF exactly 1 driver in the heat matches.
   *    (If multiple lanes share the same driver, such as in solo all-lanes practice, driverId is ambiguous).
   */
  public static findDriverForLap(
    drivers: Array<DriverHeatData | null | undefined> | null | undefined,
    lap: ILap | null | undefined,
  ): DriverHeatData | undefined {
    if (!drivers || drivers.length === 0 || !lap) {
      return undefined;
    }

    const validDrivers = drivers.filter(
      (d): d is DriverHeatData => d !== null && d !== undefined,
    );
    if (validDrivers.length === 0) {
      return undefined;
    }

    // 1. Exact match by DriverHeatData objectId
    if (lap.objectId) {
      const exactMatch = validDrivers.find((d) => d.objectId === lap.objectId);
      if (exactMatch) {
        return exactMatch;
      }
    }

    // 2. Match by hardware lane interface / laneIndex
    if (lap.interfaceId !== undefined && lap.interfaceId !== null) {
      const laneMatch = validDrivers.find(
        (d) => d.laneIndex === lap.interfaceId,
      );
      if (laneMatch) {
        return laneMatch;
      }
    }

    // 3. Fallback: match by participant objectId (only if uniquely identifying a single lane)
    if (lap.objectId) {
      const participantMatches = validDrivers.filter(
        (d) => d.participant?.objectId === lap.objectId,
      );
      if (participantMatches.length === 1) {
        return participantMatches[0];
      }
    }

    // 4. Fallback: match by driverId (only if uniquely identifying a single lane)
    if (lap.driverId) {
      const driverMatches = validDrivers.filter(
        (d) =>
          d.actualDriver?.entity_id === lap.driverId ||
          d.participant?.driver?.entity_id === lap.driverId,
      );
      if (driverMatches.length === 1) {
        return driverMatches[0];
      }
    }

    return undefined;
  }
}
