import { RaceParticipant } from "../models/race_participant";
import { com } from "../proto/message";
import { DriverConverter } from "./driver.converter";
import { TeamConverter } from "./team.converter";
import { ConverterCache } from "./converter_cache";

export class RaceParticipantConverter {
  private static cache = new ConverterCache<RaceParticipant>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: com.antigravity.IRaceParticipant): RaceParticipant {
    const id = proto.objectId || '';

    const cached = this.cache.get(id);
    if (cached && proto.driver) {
      // Update existing object in place to preserve references
      cached.driver = DriverConverter.fromProto(proto.driver);
      cached.rank = proto.rank || 0;
      cached.totalLaps = proto.totalLaps || 0;
      cached.totalTime = proto.totalTime || 0;
      cached.bestLapTime = proto.bestLapTime || 0;
      cached.averageLapTime = proto.averageLapTime || 0;
      cached.medianLapTime = proto.medianLapTime || 0;
      cached.rankValue = proto.rankValue || 0;
      cached.seed = proto.seed || 0;
      cached.fuelLevel = proto.fuelLevel || 0;
      if (proto.team) {
        cached.team = TeamConverter.fromProto(proto.team);
      }
      return cached;
    }

    return this.cache.process(id, false, () => {
      // If driver is missing and not in cache, we have a problem, but let's try to handle it gracefully
      const driver = proto.driver ? DriverConverter.fromProto(proto.driver) : DriverConverter.get('')!;
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
        proto.fuelLevel || 0,
        team
      );
    });
  }
}
