import { Model } from "./model";

/**
 * A driver created by the user.  This model is 100% readonly and reflects the
 * driver as it exists in the database.
 */
export interface AudioConfig {
  type: "preset" | "tts" | "none" | "audio_set";
  url?: string;
  text?: string;
}

export const EMPTY_DRIVER_ID = "EMPTY_LANE";

export class Driver implements Model {
  entity_id: string;
  name: string;
  nickname: string;
  avatarUrl?: string;
  lapAudio: AudioConfig;
  bestLapAudio: AudioConfig;
  penaltyAudio: AudioConfig;

  constructor(
    entity_id: string,
    name: string,
    nickname: string,
    avatarUrl?: string,
    lapAudio?: AudioConfig,
    bestLapAudio?: AudioConfig,
    penaltyAudio?: AudioConfig,
  ) {
    this.entity_id = entity_id;
    this.name = name;
    this.nickname = nickname;
    this.avatarUrl = avatarUrl;

    this.lapAudio =
      lapAudio && lapAudio.type
        ? { ...lapAudio, url: lapAudio.url || "default_beep" }
        : { type: "preset", url: "default_beep" };
    this.bestLapAudio =
      bestLapAudio && bestLapAudio.type
        ? { ...bestLapAudio, url: bestLapAudio.url || "default_driveby" }
        : { type: "preset", url: "default_driveby" };
    this.penaltyAudio =
      penaltyAudio && penaltyAudio.type
        ? { ...penaltyAudio, url: penaltyAudio.url || "default_penalty" }
        : { type: "preset", url: "default_penalty" };
  }

  get objectId(): string {
    return this.entity_id;
  }

  isEmpty(): boolean {
    return Driver.isEmpty(this);
  }

  static isEmpty(driver: any): boolean {
    if (!driver) return true;
    const id =
      driver.entity_id ||
      driver.entityId ||
      driver.id ||
      driver.model?.entity_id ||
      driver.model?.entityId;
    if (id === EMPTY_DRIVER_ID) return true;
    if (id !== undefined && id !== "") return false;

    // TODO(aufderheide): Remove this.  Fix the f'ing mocks.
    // For mocks/incomplete objects without an ID, fallback to checking if it has any name
    return !driver.name && !driver.nickname && !driver.model?.name;
  }
}
