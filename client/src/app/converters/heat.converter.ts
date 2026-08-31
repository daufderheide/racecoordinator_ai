import { Driver } from "@app/models/driver";
import { IHeat } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { RaceParticipant } from "@app/race/race_participant";

import { ConverterCache } from "./converter_cache";
import { DriverConverter } from "./driver.converter";
import { RaceParticipantConverter } from "./race_participant.converter";

export class HeatConverter {
  private static participantCache = new Map<string, RaceParticipant>();
  private static heatCache = new ConverterCache<Heat>();

  static clearCache() {
    this.participantCache.clear();
    this.heatCache.clear();
  }

  private static parseHeatDriver(
    dProto: any,
    index: number,
  ): DriverHeatData | null {
    if (!dProto.driver) return null;

    const participant = RaceParticipantConverter.fromProto(dProto.driver);
    if (!participant) {
      console.warn(
        `HeatConverter: Failed to resolve participant for heat driver ${dProto.objectId}`,
      );
      return null;
    }

    let actualDriver: Driver | undefined;
    if (dProto.actualDriver) {
      const parsed = DriverConverter.fromProto(dProto.actualDriver);
      if (parsed && !parsed.isEmpty()) {
        actualDriver = parsed;
      }
    }

    const hd = new DriverHeatData(
      dProto.objectId || (dProto as any).object_id || "",
      participant,
      index,
      actualDriver,
    );
    hd.gapLeader = dProto.gapLeader || 0;
    hd.gapPosition = dProto.gapPosition || 0;
    hd.gapLeaderF1 = dProto.gapLeaderF1 || 0;
    hd.gapPositionF1 = dProto.gapPositionF1 || 0;
    hd.lapsDownLeader = dProto.lapsDownLeader || 0;
    hd.lapsDownPosition = dProto.lapsDownPosition || 0;
    hd.penaltyLaps = dProto.penaltyLaps || 0;
    hd.userLaps = dProto.userLaps || 0;
    hd.autoCalculatedLaps = dProto.autoCalculatedLaps || 0;
    hd.adjustedLapCount = dProto.adjustedLapCount || 0;
    hd.reactionTime = dProto.reactionTime || 0;
    hd.isRefueling = !!dProto.isRefueling;
    hd.currentLocation = dProto.currentLocation ?? -1;
    hd.flag = dProto.flag || 0;
    hd.lapsLed = dProto.lapsLed || 0;
    hd.isFinished = !!(dProto.isFinished ?? (dProto as any).is_finished);
    if (dProto.laps) {
      dProto.laps.forEach((lap: any, i: number) => {
        const time =
          lap && typeof lap === "object"
            ? (lap.lapTime ?? lap.lap_time ?? 0)
            : lap;
        const driverId =
          lap && typeof lap === "object"
            ? (lap.driverId ?? lap.driver_id ?? "")
            : "";
        const isDrift =
          lap && typeof lap === "object"
            ? !!(lap.isDrift ?? lap.is_drift)
            : false;
        const segments =
          lap && typeof lap === "object" ? lap.segments || [] : [];

        hd.addLapTime(
          i + 1,
          time,
          dProto.averageLapTime || 0,
          dProto.medianLapTime || 0,
          dProto.bestLapTime || 0,
          dProto.adjustedLapCount || 0,
          driverId,
          isDrift,
          undefined,
          segments,
        );
      });
    }

    if (dProto.segments) {
      dProto.segments.forEach((seg: number, i: number) => {
        hd.addSegmentTime(i, seg);
      });
    }

    return hd;
  }

  static fromProto(proto: IHeat, heatNumber: number = -1): Heat {
    const objectId = proto.objectId;
    const isReference = !proto.heatDrivers || proto.heatDrivers.length === 0;

    return this.heatCache.process(objectId, isReference, () => {
      let heatDrivers: Array<DriverHeatData | null> = [];
      if (proto.heatDrivers) {
        heatDrivers = proto.heatDrivers.map((dProto, index) =>
          this.parseHeatDriver(dProto, index),
        );
      }
      const validHeatDrivers = heatDrivers.filter(
        (d): d is DriverHeatData => d !== null,
      );

      if (proto.standings && proto.standings.length > 0) {
        proto.standings.forEach((sid, idx) => {
          const d = validHeatDrivers.find(
            (hd) =>
              (hd.objectId && hd.objectId === sid) ||
              (hd.participant?.objectId && hd.participant.objectId === sid),
          );
          if (d) {
            d.rank = idx + 1;
          }
        });
      }

      const h = new Heat(
        objectId || "",
        heatNumber !== -1 ? heatNumber : proto.heatNumber || 0,
        validHeatDrivers,
        proto.standings || [],
        !!proto.started,
      );
      h.group = proto.group || 0;
      return h;
    });
  }
}
