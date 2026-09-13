import { Driver, EMPTY_DRIVER_ID } from "@app/models/driver";
import { IDriverModel } from "@app/proto/antigravity";

import { ConverterCache } from "./converter_cache";

export class DriverConverter {
  private static cache = new ConverterCache<Driver>();

  static clearCache() {
    this.cache.clear();
  }

  static get(id: string): Driver | undefined {
    return this.cache.get(id);
  }

  static getEmptyDriver(): Driver {
    return new Driver(
      EMPTY_DRIVER_ID,
      "Empty",
      "",
      undefined,
      { type: "preset" },
      { type: "preset" },
      { type: "preset", url: "/assets/default_penalty_Penalty" },
    );
  }

  private static mapAudio(protoAudio?: any): {
    type: "preset" | "tts" | "none" | "audio_set";
    url?: string;
    text?: string;
  } {
    return {
      type: (protoAudio?.type as any) || "preset",
      url: protoAudio?.url || undefined,
      text: protoAudio?.text || undefined,
    };
  }

  static fromProto(proto: IDriverModel): Driver {
    if (!proto) {
      return this.getEmptyDriver();
    }

    const entityId = proto.model?.entityId;

    // Is Reference if name is missing but entityId is present
    const isReference = !proto.name && !!entityId;

    if (isReference) {
      const cached = this.cache.get(entityId);
      if (cached) return cached;
      if (entityId === EMPTY_DRIVER_ID) return this.getEmptyDriver();
    }

    const finalId = entityId || (proto.name ? "" : EMPTY_DRIVER_ID);

    if (finalId) {
      const cached = this.cache.get(finalId);
      if (cached) {
        if (isReference) {
          return cached;
        }
        // Update in place to preserve references
        cached.name =
          proto.name || (finalId === EMPTY_DRIVER_ID ? "Empty" : "Unknown");
        cached.nickname = proto.nickname || "";
        cached.avatarUrl = proto.avatarUrl || undefined;
        cached.lapAudio = this.mapAudio(proto.lapAudio);
        cached.bestLapAudio = this.mapAudio(proto.bestLapAudio);
        cached.penaltyAudio = this.mapAudio(proto.penaltyAudio);
        cached.overallBestLapAudio = this.mapAudio(proto.overallBestLapAudio);
        cached.overallLaneBestLapAudio = this.mapAudio(
          proto.overallLaneBestLapAudio,
        );
        cached.raceBestLapAudio = this.mapAudio(proto.raceBestLapAudio);
        cached.raceLaneBestLapAudio = this.mapAudio(proto.raceLaneBestLapAudio);
        cached.heatBestLapAudio = this.mapAudio(proto.heatBestLapAudio);
        cached.newRaceLeaderAudio = this.mapAudio(proto.newRaceLeaderAudio);
        cached.newHeatLeaderAudio = this.mapAudio(proto.newHeatLeaderAudio);
        return cached;
      }
    }

    return this.cache.process(finalId, isReference, () => {
      return new Driver(
        finalId,
        proto.name || (finalId === EMPTY_DRIVER_ID ? "Empty" : "Unknown"),
        proto.nickname || "",
        proto.avatarUrl || undefined,
        this.mapAudio(proto.lapAudio),
        this.mapAudio(proto.bestLapAudio),
        this.mapAudio(proto.penaltyAudio),
        undefined,
        this.mapAudio(proto.overallBestLapAudio),
        this.mapAudio(proto.overallLaneBestLapAudio),
        this.mapAudio(proto.raceBestLapAudio),
        this.mapAudio(proto.raceLaneBestLapAudio),
        this.mapAudio(proto.heatBestLapAudio),
        this.mapAudio(proto.newRaceLeaderAudio),
        this.mapAudio(proto.newHeatLeaderAudio),
      );
    });
  }

  static fromJSON(json: any): Driver {
    const id = json.entity_id || json.id || "";
    const cached = this.cache.get(id);
    if (cached) {
      cached.name = json.name || "";
      cached.nickname = json.nickname || "";
      cached.avatarUrl = json.avatarUrl;
      cached.lapAudio = json.lapAudio;
      cached.bestLapAudio = json.bestLapAudio;
      cached.penaltyAudio = json.penaltyAudio;
      cached.overallBestLapAudio = json.overallBestLapAudio;
      cached.overallLaneBestLapAudio = json.overallLaneBestLapAudio;
      cached.raceBestLapAudio = json.raceBestLapAudio;
      cached.raceLaneBestLapAudio = json.raceLaneBestLapAudio;
      cached.heatBestLapAudio = json.heatBestLapAudio;
      cached.newRaceLeaderAudio = json.newRaceLeaderAudio;
      cached.newHeatLeaderAudio = json.newHeatLeaderAudio;
      return cached;
    }
    const d = new Driver(
      id,
      json.name || "",
      json.nickname || "",
      json.avatarUrl,
      json.lapAudio,
      json.bestLapAudio,
      json.penaltyAudio,
      undefined,
      json.overallBestLapAudio,
      json.overallLaneBestLapAudio,
      json.raceBestLapAudio,
      json.raceLaneBestLapAudio,
      json.heatBestLapAudio,
      json.newRaceLeaderAudio,
      json.newHeatLeaderAudio,
    );
    this.cache.process(id, false, () => d);
    return d;
  }

  static register(driver: Driver): void {
    if (!driver || !driver.entity_id) return;

    const existing = this.cache.get(driver.entity_id);
    if (existing) {
      // Update in place to preserve references
      existing.name = driver.name;
      existing.nickname = driver.nickname;
      existing.avatarUrl = driver.avatarUrl;
      existing.lapAudio = driver.lapAudio;
      existing.bestLapAudio = driver.bestLapAudio;
      existing.penaltyAudio = driver.penaltyAudio;
      existing.overallBestLapAudio = driver.overallBestLapAudio;
      existing.overallLaneBestLapAudio = driver.overallLaneBestLapAudio;
      existing.raceBestLapAudio = driver.raceBestLapAudio;
      existing.raceLaneBestLapAudio = driver.raceLaneBestLapAudio;
      existing.heatBestLapAudio = driver.heatBestLapAudio;
      existing.newRaceLeaderAudio = driver.newRaceLeaderAudio;
      existing.newHeatLeaderAudio = driver.newHeatLeaderAudio;
    } else {
      // Manually populate cache using process to ensure valid state
      // access private cache if possible, or use a workaround.
      // Since `process` is the main entry, we can use it with isRef=false
      this.cache.process(driver.entity_id, false, () => driver);
    }
  }
}
