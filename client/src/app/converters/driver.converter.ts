import {
  Driver,
  EMPTY_DRIVER_ID,
  sanitizeDriverAudio,
} from "@app/models/driver";
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
    return new Driver(EMPTY_DRIVER_ID, "Empty", "", undefined, {
      lapAudio: { type: "preset" },
      bestLapAudio: { type: "preset" },
      penaltyAudio: { type: "preset", url: "/assets/default_penalty_Penalty" },
    });
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

  private static updateDriverAudio(target: Driver, source: any): void {
    target.lapAudio = sanitizeDriverAudio(
      this.mapAudio(source.lapAudio),
      "default_beep",
    );
    target.bestLapAudio = sanitizeDriverAudio(
      this.mapAudio(source.bestLapAudio),
      "default_driveby",
    );
    target.penaltyAudio = sanitizeDriverAudio(
      this.mapAudio(source.falseStartAudio || source.penaltyAudio),
      "default_penalty",
    );
    target.overallBestLapAudio = sanitizeDriverAudio(
      this.mapAudio(source.overallBestLapAudio),
      "default_record_lap",
    );
    target.overallLaneBestLapAudio = sanitizeDriverAudio(
      this.mapAudio(source.overallLaneBestLapAudio),
      "default_record_lane_lap",
    );
    target.raceBestLapAudio = sanitizeDriverAudio(
      this.mapAudio(source.raceBestLapAudio),
      "default_best_race_lap",
    );
    target.raceLaneBestLapAudio = sanitizeDriverAudio(
      this.mapAudio(source.raceLaneBestLapAudio),
      "default_best_race_lane_lap",
    );
    target.heatBestLapAudio = sanitizeDriverAudio(
      this.mapAudio(source.heatBestLapAudio),
      "default_best_heat_lap",
    );
    target.newRaceLeaderAudio = sanitizeDriverAudio(
      this.mapAudio(source.newRaceLeaderAudio),
      "default_new_race_leader",
    );
    target.newHeatLeaderAudio = sanitizeDriverAudio(
      this.mapAudio(source.newHeatLeaderAudio),
      "default_new_heat_leader",
    );
    target.pitInAudio = sanitizeDriverAudio(
      this.mapAudio(source.pitInAudio),
      "default_pit_in",
    );
    target.fuelAudio = sanitizeDriverAudio(
      this.mapAudio(source.fuelAudio, "audio_set"),
      "default_fuel_level",
      "audio_set",
    );
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
        this.updateDriverAudio(cached, proto as any);
        return cached;
      }
    }

    return this.cache.process(finalId, isReference, () => {
      return new Driver(
        finalId,
        proto.name || (finalId === EMPTY_DRIVER_ID ? "Empty" : "Unknown"),
        proto.nickname || "",
        proto.avatarUrl || undefined,
        {
          lapAudio: this.mapAudio(proto.lapAudio),
          bestLapAudio: this.mapAudio(proto.bestLapAudio),
          penaltyAudio: this.mapAudio(proto.penaltyAudio),
          overallBestLapAudio: this.mapAudio(proto.overallBestLapAudio),
          overallLaneBestLapAudio: this.mapAudio(proto.overallLaneBestLapAudio),
          raceBestLapAudio: this.mapAudio(proto.raceBestLapAudio),
          raceLaneBestLapAudio: this.mapAudio(proto.raceLaneBestLapAudio),
          heatBestLapAudio: this.mapAudio(proto.heatBestLapAudio),
          newRaceLeaderAudio: this.mapAudio(proto.newRaceLeaderAudio),
          newHeatLeaderAudio: this.mapAudio(proto.newHeatLeaderAudio),
          pitInAudio: this.mapAudio(proto.pitInAudio),
          fuelAudio: this.mapAudio(proto.fuelAudio, "audio_set"),
        },
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
      this.updateDriverAudio(cached, json);
      return cached;
    }
    const d = new Driver(
      id,
      json.name || "",
      json.nickname || "",
      json.avatarUrl,
      {
        lapAudio: this.mapAudio(json.lapAudio),
        bestLapAudio: this.mapAudio(json.bestLapAudio),
        penaltyAudio: this.mapAudio(json.penaltyAudio),
        overallBestLapAudio: this.mapAudio(json.overallBestLapAudio),
        overallLaneBestLapAudio: this.mapAudio(json.overallLaneBestLapAudio),
        raceBestLapAudio: this.mapAudio(json.raceBestLapAudio),
        raceLaneBestLapAudio: this.mapAudio(json.raceLaneBestLapAudio),
        heatBestLapAudio: this.mapAudio(json.heatBestLapAudio),
        newRaceLeaderAudio: this.mapAudio(json.newRaceLeaderAudio),
        newHeatLeaderAudio: this.mapAudio(json.newHeatLeaderAudio),
        pitInAudio: this.mapAudio(json.pitInAudio),
        fuelAudio: this.mapAudio(json.fuelAudio, "audio_set"),
      },
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
      existing.pitInAudio = driver.pitInAudio;
      existing.fuelAudio = driver.fuelAudio;
    } else {
      // Manually populate cache using process to ensure valid state
      // access private cache if possible, or use a workaround.
      // Since `process` is the main entry, we can use it with isRef=false
      this.cache.process(driver.entity_id, false, () => driver);
    }
  }
}
