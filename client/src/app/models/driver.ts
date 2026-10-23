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

export interface DriverAudioConfig {
  lapAudio?: AudioConfig;
  bestLapAudio?: AudioConfig;
  penaltyAudio?: AudioConfig;
  falseStartAudio?: AudioConfig;
  overallBestLapAudio?: AudioConfig;
  overallLaneBestLapAudio?: AudioConfig;
  raceBestLapAudio?: AudioConfig;
  raceLaneBestLapAudio?: AudioConfig;
  heatBestLapAudio?: AudioConfig;
  newRaceLeaderAudio?: AudioConfig;
  newHeatLeaderAudio?: AudioConfig;
  pitInAudio?: AudioConfig;
  fuelAudio?: AudioConfig;
  driftLapAudio?: AudioConfig;
}

export interface DriverInit extends DriverAudioConfig {
  entity_id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  labelIds?: string[];
}

export const EMPTY_DRIVER_ID = "EMPTY_LANE";

export function sanitizeDriverAudio(
  audio?: AudioConfig,
  defaultUrl: string = "default_beep",
  defaultType: "preset" | "tts" | "none" | "audio_set" = "preset",
  defaultText?: string,
): AudioConfig {
  if (!audio || !audio.type) {
    if (defaultType === "tts") {
      return { type: defaultType, text: defaultText };
    }
    return { type: defaultType, url: defaultUrl };
  }
  let type = audio.type;
  if (defaultType === "audio_set" && type === "preset") {
    type = "audio_set";
  }
  const cleanUrl =
    audio.url && audio.url.trim() !== ""
      ? audio.url.trim()
      : type === "preset" || type === "audio_set"
        ? defaultUrl
        : audio.url;
  return {
    type,
    url: cleanUrl,
    text:
      audio.text !== undefined
        ? audio.text
        : type === "tts"
          ? defaultText
          : undefined,
  };
}

function resolveAudioConfig(
  audioOrLap?: DriverAudioConfig | AudioConfig,
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
  pitInAudio?: AudioConfig,
  fuelAudio?: AudioConfig,
  driftLapAudio?: AudioConfig,
): DriverAudioConfig {
  if (audioOrLap && typeof audioOrLap === "object" && !("type" in audioOrLap)) {
    return audioOrLap as DriverAudioConfig;
  }
  return {
    lapAudio: audioOrLap as AudioConfig | undefined,
    bestLapAudio,
    penaltyAudio,
    falseStartAudio,
    overallBestLapAudio,
    overallLaneBestLapAudio,
    raceBestLapAudio,
    raceLaneBestLapAudio,
    heatBestLapAudio,
    newRaceLeaderAudio,
    newHeatLeaderAudio,
    pitInAudio,
    fuelAudio,
    driftLapAudio,
  };
}

function initDriverAudioConfigs(
  driver: Driver,
  audioConfig?: DriverAudioConfig,
): void {
  driver.lapAudio = sanitizeDriverAudio(audioConfig?.lapAudio, "default_beep");
  driver.bestLapAudio = sanitizeDriverAudio(
    audioConfig?.bestLapAudio,
    "default_driveby",
  );
  driver.penaltyAudio = sanitizeDriverAudio(
    audioConfig?.falseStartAudio || audioConfig?.penaltyAudio,
    "default_penalty",
  );
  driver.overallBestLapAudio = sanitizeDriverAudio(
    audioConfig?.overallBestLapAudio,
    "default_record_lap",
  );
  driver.overallLaneBestLapAudio = sanitizeDriverAudio(
    audioConfig?.overallLaneBestLapAudio,
    "default_record_lane_lap",
  );
  driver.raceBestLapAudio = sanitizeDriverAudio(
    audioConfig?.raceBestLapAudio,
    "default_best_race_lap",
  );
  driver.raceLaneBestLapAudio = sanitizeDriverAudio(
    audioConfig?.raceLaneBestLapAudio,
    "default_best_race_lane_lap",
  );
  driver.heatBestLapAudio = sanitizeDriverAudio(
    audioConfig?.heatBestLapAudio,
    "default_best_heat_lap",
  );
  driver.newRaceLeaderAudio = sanitizeDriverAudio(
    audioConfig?.newRaceLeaderAudio,
    "default_new_race_leader",
  );
  driver.newHeatLeaderAudio = sanitizeDriverAudio(
    audioConfig?.newHeatLeaderAudio,
    "default_new_heat_leader",
  );
  driver.pitInAudio = sanitizeDriverAudio(
    audioConfig?.pitInAudio,
    "default_pit_in",
  );
  driver.fuelAudio = sanitizeDriverAudio(
    audioConfig?.fuelAudio,
    "default_fuel_level",
    "audio_set",
  );
  driver.driftLapAudio = sanitizeDriverAudio(
    audioConfig?.driftLapAudio,
    "default_beep",
    "tts",
    "Drift lap for {driver.nickname}",
  );
}

export class Driver implements Model {
  entity_id: string;
  name: string;
  nickname: string;
  avatarUrl?: string;
  lapAudio!: AudioConfig;
  bestLapAudio!: AudioConfig;
  penaltyAudio!: AudioConfig;
  overallBestLapAudio!: AudioConfig;
  overallLaneBestLapAudio!: AudioConfig;
  raceBestLapAudio!: AudioConfig;
  raceLaneBestLapAudio!: AudioConfig;
  heatBestLapAudio!: AudioConfig;
  newRaceLeaderAudio!: AudioConfig;
  newHeatLeaderAudio!: AudioConfig;
  pitInAudio!: AudioConfig;
  fuelAudio!: AudioConfig;
  driftLapAudio!: AudioConfig;
  labelIds: string[] = [];

  constructor(init: DriverInit);
  constructor(
    entity_id: string,
    name: string,
    nickname?: string,
    avatarUrl?: string,
    audio?: DriverAudioConfig,
  );
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
    pitInAudio?: AudioConfig,
    fuelAudio?: AudioConfig,
    driftLapAudio?: AudioConfig,
  );
  constructor(
    entity_idOrInit: string | DriverInit,
    name?: string,
    nickname?: string,
    avatarUrl?: string,
    audioOrLap?: DriverAudioConfig | AudioConfig,
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
    pitInAudio?: AudioConfig,
    fuelAudio?: AudioConfig,
    driftLapAudio?: AudioConfig,
  ) {
    let audioConfig: DriverAudioConfig | undefined;

    if (typeof entity_idOrInit === "object" && entity_idOrInit !== null) {
      this.entity_id = entity_idOrInit.entity_id;
      this.name = entity_idOrInit.name;
      this.nickname = entity_idOrInit.nickname || "";
      this.avatarUrl = entity_idOrInit.avatarUrl;
      this.labelIds = Array.isArray(entity_idOrInit.labelIds)
        ? [...entity_idOrInit.labelIds]
        : [];
      audioConfig = entity_idOrInit;
    } else {
      this.entity_id = entity_idOrInit;
      this.name = name || "";
      this.nickname = nickname || "";
      this.avatarUrl = avatarUrl;
      this.labelIds = [];
      audioConfig = resolveAudioConfig(
        audioOrLap,
        bestLapAudio,
        penaltyAudio,
        falseStartAudio,
        overallBestLapAudio,
        overallLaneBestLapAudio,
        raceBestLapAudio,
        raceLaneBestLapAudio,
        heatBestLapAudio,
        newRaceLeaderAudio,
        newHeatLeaderAudio,
        pitInAudio,
        fuelAudio,
        driftLapAudio,
      );
    }

    initDriverAudioConfigs(this, audioConfig);
  }

  static createDefault(
    entity_id: string,
    name: string,
    nickname: string = "",
    avatarUrl?: string,
    labelIds: string[] = [],
  ): Driver {
    const driver = new Driver(entity_id, name, nickname, avatarUrl);
    driver.labelIds = Array.isArray(labelIds) ? [...labelIds] : [];
    return driver;
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
