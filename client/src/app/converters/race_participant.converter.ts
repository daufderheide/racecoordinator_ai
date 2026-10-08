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
      this.updateCachedParticipant(cached, proto);
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
        proto.consistencyScore || 0,
        proto.physicalLapCount || 0,
        proto.standardDeviation || 0,
        proto.lapsLed || 0,
        proto.trackCalls || 0,
        proto.totalPoints || 0,
        proto.averageTop5 || 0,
        proto.averageTop10 || 0,
        proto.averageTop15 || 0,
        proto.top2Consecutive || 0,
        proto.top3Consecutive || 0,
        proto.hasSegments || false,
      );
    });
  }

  private static updateCachedParticipant(
    cached: RaceParticipant,
    proto: IRaceParticipant,
  ): void {
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
    if (proto.lapsDownPosition !== undefined && proto.lapsDownPosition !== null)
      cached.lapsDownPosition = proto.lapsDownPosition;
    if (proto.consistencyScore !== undefined && proto.consistencyScore !== null)
      cached.consistencyScore = proto.consistencyScore;
    if (proto.physicalLapCount !== undefined && proto.physicalLapCount !== null)
      cached.physicalLapCount = proto.physicalLapCount;
    if (
      proto.standardDeviation !== undefined &&
      proto.standardDeviation !== null
    )
      cached.standardDeviation = proto.standardDeviation;
    if (proto.lapsLed !== undefined && proto.lapsLed !== null)
      cached.lapsLed = proto.lapsLed;
    if (proto.trackCalls !== undefined && proto.trackCalls !== null)
      cached.trackCalls = proto.trackCalls;
    if (proto.totalPoints !== undefined && proto.totalPoints !== null)
      cached.totalPoints = proto.totalPoints;
    if (proto.averageTop5 !== undefined && proto.averageTop5 !== null)
      cached.averageTop5 = proto.averageTop5;
    if (proto.averageTop10 !== undefined && proto.averageTop10 !== null)
      cached.averageTop10 = proto.averageTop10;
    if (proto.averageTop15 !== undefined && proto.averageTop15 !== null)
      cached.averageTop15 = proto.averageTop15;
    if (proto.top2Consecutive !== undefined && proto.top2Consecutive !== null)
      cached.top2Consecutive = proto.top2Consecutive;
    if (proto.top3Consecutive !== undefined && proto.top3Consecutive !== null)
      cached.top3Consecutive = proto.top3Consecutive;
    if (proto.hasSegments !== undefined && proto.hasSegments !== null)
      cached.hasSegments = proto.hasSegments;

    if (proto.team) {
      cached.team = TeamConverter.fromProto(proto.team);
    }
  }
}
