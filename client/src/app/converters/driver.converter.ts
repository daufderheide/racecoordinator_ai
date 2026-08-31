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
        cached.lapAudio = {
          type: (proto.lapAudio?.type as any) || "preset",
          url: proto.lapAudio?.url || undefined,
          text: proto.lapAudio?.text || undefined,
        };
        cached.bestLapAudio = {
          type: (proto.bestLapAudio?.type as any) || "preset",
          url: proto.bestLapAudio?.url || undefined,
          text: proto.bestLapAudio?.text || undefined,
        };
        cached.penaltyAudio = {
          type: (proto.penaltyAudio?.type as any) || "preset",
          url: proto.penaltyAudio?.url || undefined,
          text: proto.penaltyAudio?.text || undefined,
        };
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
          type: (proto.lapAudio?.type as any) || "preset",
          url: proto.lapAudio?.url || undefined,
          text: proto.lapAudio?.text || undefined,
        },
        {
          type: (proto.bestLapAudio?.type as any) || "preset",
          url: proto.bestLapAudio?.url || undefined,
          text: proto.bestLapAudio?.text || undefined,
        },
        {
          type: (proto.penaltyAudio?.type as any) || "preset",
          url: proto.penaltyAudio?.url || undefined,
          text: proto.penaltyAudio?.text || undefined,
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
      cached.lapAudio = json.lapAudio;
      cached.bestLapAudio = json.bestLapAudio;
      cached.penaltyAudio = json.penaltyAudio;
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
    } else {
      // Manually populate cache using process to ensure valid state
      // access private cache if possible, or use a workaround.
      // Since `process` is the main entry, we can use it with isRef=false
      this.cache.process(driver.entity_id, false, () => driver);
    }
  }
}
