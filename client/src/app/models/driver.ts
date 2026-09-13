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
  overallBestLapAudio: AudioConfig;
  overallLaneBestLapAudio: AudioConfig;
  raceBestLapAudio: AudioConfig;
  raceLaneBestLapAudio: AudioConfig;
  heatBestLapAudio: AudioConfig;
  newRaceLeaderAudio: AudioConfig;
  newHeatLeaderAudio: AudioConfig;

  constructor(
    entity_id: string,
    name: string,
    nickname: string,
    avatarUrl?: string,
    lapAudio?: AudioConfig,
    bestLapAudio?: AudioConfig,
    penaltyAudio?: AudioConfig,
    falseStartAudio?: AudioConfig,
    overallBestLapAudio?: AudioConfig,
    overallLaneBestLapAudio?: AudioConfig,
    raceBestLapAudio?: AudioConfig,
    raceLaneBestLapAudio?: AudioConfig,
    heatBestLapAudio?: AudioConfig,
    newRaceLeaderAudio?: AudioConfig,
    newHeatLeaderAudio?: AudioConfig,
  ) {
    this.entity_id = entity_id;
    this.name = name;
    this.nickname = nickname;
    this.avatarUrl = avatarUrl;

    const sanitizeAudio = (
      audio?: AudioConfig,
      defaultUrl: string = "default_beep",
    ): AudioConfig => {
      if (!audio || !audio.type) {
        return { type: "preset", url: defaultUrl };
      }
      if (audio.type === "none") {
        return { type: "none", url: undefined, text: undefined };
      }
      if (audio.type === "tts") {
        return { type: "tts", url: undefined, text: audio.text || "" };
      }
      return {
        type: audio.type,
        url: audio.url || defaultUrl,
        text: undefined,
      };
    };

    this.lapAudio = sanitizeAudio(lapAudio, "default_beep");
    this.bestLapAudio = sanitizeAudio(bestLapAudio, "default_driveby");
    this.penaltyAudio = sanitizeAudio(
      falseStartAudio || penaltyAudio,
      "default_penalty",
    );
    this.overallBestLapAudio = sanitizeAudio(
      overallBestLapAudio,
      "default_record_lap",
    );
    this.overallLaneBestLapAudio = sanitizeAudio(
      overallLaneBestLapAudio,
      "default_record_lane_lap",
    );
    this.raceBestLapAudio = sanitizeAudio(
      raceBestLapAudio,
      "default_best_race_lap",
    );
    this.raceLaneBestLapAudio = sanitizeAudio(
      raceLaneBestLapAudio,
      "default_best_race_lane_lap",
    );
    this.heatBestLapAudio = sanitizeAudio(
      heatBestLapAudio,
      "default_best_heat_lap",
    );
    this.newRaceLeaderAudio = sanitizeAudio(
      newRaceLeaderAudio,
      "default_new_race_leader",
    );
    this.newHeatLeaderAudio = sanitizeAudio(
      newHeatLeaderAudio,
      "default_new_heat_leader",
    );
  }

  get falseStartAudio(): AudioConfig {
    return this.penaltyAudio;
  }

  set falseStartAudio(val: AudioConfig) {
    this.penaltyAudio = val;
  }

  isEmpty(): boolean {
    return Driver.isEmpty(this);
  }

  static isEmpty(driver: any): boolean {
    if (!driver) return true;
    const id =
      typeof driver === "string"
        ? driver
        : driver.entity_id ||
          driver.entityId ||
          driver.id ||
          driver.model?.entity_id ||
          driver.model?.entityId;
    if (
      id &&
      (id === EMPTY_DRIVER_ID ||
        id.toUpperCase() === "EMPTY_LANE" ||
        id.startsWith("EMPTY_") ||
        id.startsWith("empty_") ||
        id === "empty")
    ) {
      return true;
    }
    if (id) return false;
    const name = (driver.name || driver.model?.name || "").trim().toLowerCase();
    const nickname = (driver.nickname || "").trim().toLowerCase();
    if (name === "" && nickname === "") return true;
    if (
      name === "empty" ||
      name === "empty lane" ||
      name === "rd_empty_lane" ||
      name === "(empty)"
    ) {
      return true;
    }
    return false;
  }
}
