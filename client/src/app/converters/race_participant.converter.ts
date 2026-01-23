import { RaceParticipant } from "../models/race_participant";
import { com } from "../proto/message";
import { DriverConverter } from "./driver.converter";
import { ConverterCache } from "./converter_cache";

export class RaceParticipantConverter {
  private static cache = new ConverterCache<RaceParticipant>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: com.antigravity.IRaceParticipant): RaceParticipant {
    // We use objectId or driver.entityId as key? 
    // RaceParticipant objectId should be unique for the race entry.
    const id = proto.objectId || '';

    return this.cache.process(id, false, () => {
      const driver = DriverConverter.fromProto(proto.driver!);
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
        proto.seed || 0
      );
    });
  }
}
