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

  private static mapAudio(
    protoAudio?: any,
    defaultType: "preset" | "tts" | "none" | "audio_set" = "preset",
  ): {
    type: "preset" | "tts" | "none" | "audio_set";
    url?: string;
    text?: string;
  } {
    let type = protoAudio?.type as any;

    // Fix incorrectly backfilled drivers that saved fuel audio as 'preset'
    if (defaultType === "audio_set" && (type === "preset" || !type)) {
      type = "audio_set";
    }
    if (type === "preset" && protoAudio?.url === "default_fuel_level") {
      type = "audio_set";
    }

    return {
      type: type || defaultType,
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
        cached.pitInAudio = this.mapAudio(proto.pitInAudio);
        cached.fuelAudio = this.mapAudio(proto.fuelAudio, "audio_set");
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
        this.mapAudio(proto.pitInAudio),
        this.mapAudio(proto.fuelAudio, "audio_set"),
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
      cached.lapAudio = this.mapAudio(json.lapAudio);
      cached.bestLapAudio = this.mapAudio(json.bestLapAudio);
      cached.penaltyAudio = this.mapAudio(json.penaltyAudio);
      cached.overallBestLapAudio = this.mapAudio(json.overallBestLapAudio);
      cached.overallLaneBestLapAudio = this.mapAudio(
        json.overallLaneBestLapAudio,
      );
      cached.raceBestLapAudio = this.mapAudio(json.raceBestLapAudio);
      cached.raceLaneBestLapAudio = this.mapAudio(json.raceLaneBestLapAudio);
      cached.heatBestLapAudio = this.mapAudio(json.heatBestLapAudio);
      cached.newRaceLeaderAudio = this.mapAudio(json.newRaceLeaderAudio);
      cached.newHeatLeaderAudio = this.mapAudio(json.newHeatLeaderAudio);
      cached.pitInAudio = this.mapAudio(json.pitInAudio);
      cached.fuelAudio = this.mapAudio(json.fuelAudio, "audio_set");
      return cached;
    }
    const d = new Driver(
      id,
      json.name || "",
      json.nickname || "",
      json.avatarUrl,
      this.mapAudio(json.lapAudio),
      this.mapAudio(json.bestLapAudio),
      this.mapAudio(json.penaltyAudio),
      undefined,
      this.mapAudio(json.overallBestLapAudio),
      this.mapAudio(json.overallLaneBestLapAudio),
      this.mapAudio(json.raceBestLapAudio),
      this.mapAudio(json.raceLaneBestLapAudio),
      this.mapAudio(json.heatBestLapAudio),
      this.mapAudio(json.newRaceLeaderAudio),
      this.mapAudio(json.newHeatLeaderAudio),
      this.mapAudio(json.pitInAudio),
      this.mapAudio(json.fuelAudio, "audio_set"),
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
