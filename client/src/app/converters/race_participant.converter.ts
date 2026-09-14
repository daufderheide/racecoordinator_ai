import { RaceParticipant } from "@app/models/race_participant";
import { IRaceParticipant } from "@app/proto/antigravity";

import { ConverterCache } from "./converter_cache";
import { DriverConverter } from "./driver.converter";
import { TeamConverter } from "./team.converter";

export class RaceParticipantConverter {
  private static cache = new ConverterCache<RaceParticipant>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: IRaceParticipant): RaceParticipant {
    const id = proto.objectId || "";

    const cached = this.cache.get(id);
    if (cached) {
      // If driver is missing, this is just a reference (e.g. inside a Heat).
      // We must NOT apply proto's primitive fields because protobuf.js populates
      // missing fields with proto3 defaults (0), which would wipe out our cached stats (e.g. fuelLevel).
      const isReference = !proto.driver;
      if (isReference) {
        return cached;
      }

      // If we receive the driver, update it to preserve references
      if (proto.driver) {
        cached.driver = DriverConverter.fromProto(proto.driver);
      }
      if (proto.rank !== undefined && proto.rank !== null)
        cached.rank = proto.rank;
      if (proto.totalLaps !== undefined && proto.totalLaps !== null)
        cached.totalLaps = proto.totalLaps;
      if (proto.totalTime !== undefined && proto.totalTime !== null)
        cached.totalTime = proto.totalTime;
      if (proto.bestLapTime !== undefined && proto.bestLapTime !== null)
        cached.bestLapTime = proto.bestLapTime;
      if (proto.averageLapTime !== undefined && proto.averageLapTime !== null)
        cached.averageLapTime = proto.averageLapTime;
      if (proto.medianLapTime !== undefined && proto.medianLapTime !== null)
        cached.medianLapTime = proto.medianLapTime;
      if (proto.rankValue !== undefined && proto.rankValue !== null)
        cached.rankValue = proto.rankValue;
      if (proto.seed !== undefined && proto.seed !== null)
        cached.seed = proto.seed;
      if (proto.fuelLevel !== undefined && proto.fuelLevel !== null)
        cached.fuelLevel = proto.fuelLevel;
      if (proto.gapLeader !== undefined && proto.gapLeader !== null)
        cached.gapLeader = proto.gapLeader;
      if (proto.gapPosition !== undefined && proto.gapPosition !== null)
        cached.gapPosition = proto.gapPosition;
      if (proto.gapLeaderF1 !== undefined && proto.gapLeaderF1 !== null)
        cached.gapLeaderF1 = proto.gapLeaderF1;
      if (proto.gapPositionF1 !== undefined && proto.gapPositionF1 !== null)
        cached.gapPositionF1 = proto.gapPositionF1;
      if (proto.lapsDownLeader !== undefined && proto.lapsDownLeader !== null)
        cached.lapsDownLeader = proto.lapsDownLeader;
      if (
        proto.lapsDownPosition !== undefined &&
        proto.lapsDownPosition !== null
      )
        cached.lapsDownPosition = proto.lapsDownPosition;

      if (proto.team) {
        cached.team = TeamConverter.fromProto(proto.team);
      }
      return cached;
    }

    return this.cache.process(id, false, () => {
      // If driver is missing and not in cache, we have a problem, but let's try to handle it gracefully
      const driver = proto.driver
        ? DriverConverter.fromProto(proto.driver)
        : DriverConverter.getEmptyDriver();
      const team = proto.team ? TeamConverter.fromProto(proto.team) : undefined;
      return new RaceParticipant(
        id,
        driver,
        proto.rank || 0,
        proto.totalLaps || 0,
        proto.totalTime || 0,
        proto.bestLapTime || 0,
        proto.averageLapTime || 0,
        proto.medianLapTime || 0,
        proto.rankValue || 0,
        proto.seed || 0,
        proto.fuelLevel ?? (undefined as any),
        proto.gapLeader || 0,
        proto.gapPosition || 0,
        team,
        proto.gapLeaderF1 || 0,
        proto.gapPositionF1 || 0,
        proto.lapsDownLeader || 0,
        proto.lapsDownPosition || 0,
      );
    });
  }
}
