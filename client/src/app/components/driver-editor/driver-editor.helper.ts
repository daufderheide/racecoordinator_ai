import { Driver } from "@app/models/driver";

export type DriverAudioSlot =
  | "lap"
  | "bestLap"
  | "penalty"
  | "falseStart"
  | "overallBestLap"
  | "overallLaneBestLap"
  | "raceBestLap"
  | "raceLaneBestLap"
  | "heatBestLap"
  | "newRaceLeader"
  | "newHeatLeader"
  | "pitIn"
  | "fuel";

export function getAudioSlotInfo(slot: DriverAudioSlot): {
  key: keyof Driver;
  defaultUrl: string;
} {
  switch (slot) {
    case "lap":
      return { key: "lapAudio", defaultUrl: "default_beep" };
    case "bestLap":
      return { key: "bestLapAudio", defaultUrl: "default_driveby" };
    case "penalty":
    case "falseStart":
      return { key: "penaltyAudio", defaultUrl: "default_penalty" };
    case "overallBestLap":
      return { key: "overallBestLapAudio", defaultUrl: "default_record_lap" };
    case "overallLaneBestLap":
      return {
        key: "overallLaneBestLapAudio",
        defaultUrl: "default_record_lane_lap",
      };
    case "raceBestLap":
      return { key: "raceBestLapAudio", defaultUrl: "default_best_race_lap" };
    case "raceLaneBestLap":
      return {
        key: "raceLaneBestLapAudio",
        defaultUrl: "default_best_race_lane_lap",
      };
    case "heatBestLap":
      return { key: "heatBestLapAudio", defaultUrl: "default_best_heat_lap" };
    case "newRaceLeader":
      return {
        key: "newRaceLeaderAudio",
        defaultUrl: "default_new_race_leader",
      };
    case "newHeatLeader":
      return {
        key: "newHeatLeaderAudio",
        defaultUrl: "default_new_heat_leader",
      };
    case "pitIn":
      return {
        key: "pitInAudio",
        defaultUrl: "default_pit_in",
      };
    case "fuel":
      return {
        key: "fuelAudio",
        defaultUrl: "default_fuel_level",
      };
  }
}

export function mapSoundType(
  type: string | undefined,
  defaultType: "preset" | "tts" | "none" | "audio_set" = "preset",
): "preset" | "tts" | "none" | "audio_set" {
  if (defaultType === "audio_set" && (type === "preset" || !type)) {
    return "audio_set";
  }
  if (type === "audio_set") return "audio_set";
  if (type === "tts") return "tts";
  if (type === "none") return "none";
  return defaultType;
}

export function toDriver(d: any): Driver {
  return new Driver(d.entity_id, d.name, d.nickname || "", d.avatarUrl, {
    lapAudio: {
      type: mapSoundType(d.lapAudio?.type || d.lapSoundType),
      url: d.lapAudio?.url || d.lapSoundUrl,
      text: d.lapAudio?.text || d.lapSoundText,
    },
    bestLapAudio: {
      type: mapSoundType(d.bestLapAudio?.type || d.bestLapSoundType),
      url: d.bestLapAudio?.url || d.bestLapSoundUrl,
      text: d.bestLapAudio?.text || d.bestLapSoundText,
    },
    penaltyAudio: {
      type: mapSoundType(d.penaltyAudio?.type || d.penaltySoundType),
      url: d.penaltyAudio?.url || d.penaltySoundUrl,
      text: d.penaltyAudio?.text || d.penaltySoundText,
    },
    overallBestLapAudio: {
      type: mapSoundType(d.overallBestLapAudio?.type),
      url: d.overallBestLapAudio?.url,
      text: d.overallBestLapAudio?.text,
    },
    overallLaneBestLapAudio: {
      type: mapSoundType(d.overallLaneBestLapAudio?.type),
      url: d.overallLaneBestLapAudio?.url,
      text: d.overallLaneBestLapAudio?.text,
    },
    raceBestLapAudio: {
      type: mapSoundType(d.raceBestLapAudio?.type),
      url: d.raceBestLapAudio?.url,
      text: d.raceBestLapAudio?.text,
    },
    raceLaneBestLapAudio: {
      type: mapSoundType(d.raceLaneBestLapAudio?.type),
      url: d.raceLaneBestLapAudio?.url,
      text: d.raceLaneBestLapAudio?.text,
    },
    heatBestLapAudio: {
      type: mapSoundType(d.heatBestLapAudio?.type),
      url: d.heatBestLapAudio?.url,
      text: d.heatBestLapAudio?.text,
    },
    newRaceLeaderAudio: {
      type: mapSoundType(d.newRaceLeaderAudio?.type),
      url: d.newRaceLeaderAudio?.url,
      text: d.newRaceLeaderAudio?.text,
    },
    newHeatLeaderAudio: {
      type: mapSoundType(d.newHeatLeaderAudio?.type),
      url: d.newHeatLeaderAudio?.url,
      text: d.newHeatLeaderAudio?.text,
    },
    pitInAudio: {
      type: mapSoundType(d.pitInAudio?.type),
      url: d.pitInAudio?.url,
      text: d.pitInAudio?.text,
    },
    fuelAudio: {
      type: mapSoundType(d.fuelAudio?.type, "audio_set"),
      url: d.fuelAudio?.url || "default_fuel_level",
      text: d.fuelAudio?.text,
    },
  });
}

export function createNewDriverTemplate(): Driver {
  return Driver.createDefault("new", "", "");
}

export function cloneDriver(driver: Driver): Driver {
  return new Driver(
    driver.entity_id,
    driver.name,
    driver.nickname,
    driver.avatarUrl,
    {
      lapAudio: driver.lapAudio ? { ...driver.lapAudio } : undefined,
      bestLapAudio: driver.bestLapAudio
        ? { ...driver.bestLapAudio }
        : undefined,
      penaltyAudio: driver.penaltyAudio
        ? { ...driver.penaltyAudio }
        : undefined,
      overallBestLapAudio: driver.overallBestLapAudio
        ? { ...driver.overallBestLapAudio }
        : undefined,
      overallLaneBestLapAudio: driver.overallLaneBestLapAudio
        ? { ...driver.overallLaneBestLapAudio }
        : undefined,
      raceBestLapAudio: driver.raceBestLapAudio
        ? { ...driver.raceBestLapAudio }
        : undefined,
      raceLaneBestLapAudio: driver.raceLaneBestLapAudio
        ? { ...driver.raceLaneBestLapAudio }
        : undefined,
      heatBestLapAudio: driver.heatBestLapAudio
        ? { ...driver.heatBestLapAudio }
        : undefined,
      newRaceLeaderAudio: driver.newRaceLeaderAudio
        ? { ...driver.newRaceLeaderAudio }
        : undefined,
      newHeatLeaderAudio: driver.newHeatLeaderAudio
        ? { ...driver.newHeatLeaderAudio }
        : undefined,
      pitInAudio: driver.pitInAudio ? { ...driver.pitInAudio } : undefined,
      fuelAudio: driver.fuelAudio ? { ...driver.fuelAudio } : undefined,
    },
  );
}

export function areDriversEqual(d1: Driver, d2: Driver): boolean {
  const normalizeString = (val: any) =>
    val === null || val === undefined ? "" : String(val).trim();

  const nameMatch = normalizeString(d1.name) === normalizeString(d2.name);
  const nicknameMatch =
    normalizeString(d1.nickname) === normalizeString(d2.nickname);
  const avatarMatch =
    normalizeString(d1.avatarUrl) === normalizeString(d2.avatarUrl);

  const checkAudio = (a1: any, a2: any) => {
    if (!a1 || !a2) return a1 === a2;
    const type1 = normalizeString(a1.type || "preset");
    const type2 = normalizeString(a2.type || "preset");
    if (type1 !== type2) return false;
    if (type1 === "none") return true;
    if (type1 === "tts") {
      return normalizeString(a1.text) === normalizeString(a2.text);
    }
    return normalizeString(a1.url) === normalizeString(a2.url);
  };

  return (
    nameMatch &&
    nicknameMatch &&
    avatarMatch &&
    checkAudio(d1.lapAudio, d2.lapAudio) &&
    checkAudio(d1.bestLapAudio, d2.bestLapAudio) &&
    checkAudio(d1.penaltyAudio, d2.penaltyAudio) &&
    checkAudio(d1.overallBestLapAudio, d2.overallBestLapAudio) &&
    checkAudio(d1.overallLaneBestLapAudio, d2.overallLaneBestLapAudio) &&
    checkAudio(d1.raceBestLapAudio, d2.raceBestLapAudio) &&
    checkAudio(d1.raceLaneBestLapAudio, d2.raceLaneBestLapAudio) &&
    checkAudio(d1.heatBestLapAudio, d2.heatBestLapAudio) &&
    checkAudio(d1.newRaceLeaderAudio, d2.newRaceLeaderAudio) &&
    checkAudio(d1.newHeatLeaderAudio, d2.newHeatLeaderAudio) &&
    checkAudio(d1.pitInAudio, d2.pitInAudio) &&
    checkAudio(d1.fuelAudio, d2.fuelAudio)
  );
}

export function generateUniqueDriverName(
  allDrivers: Driver[],
  baseName: string,
  forceSuffix: boolean = false,
): string {
  const pattern = /(_\d+)$/;
  const base = (baseName || "").replace(pattern, "").trim();

  let counter = forceSuffix ? 1 : 0;
  while (true) {
    const candidate = counter === 0 ? base : `${base}_${counter}`;
    const exists = (allDrivers || []).some(
      (d) =>
        (d.name || "").trim().toLowerCase() === candidate.trim().toLowerCase(),
    );
    if (!exists && candidate.trim() !== "") {
      return candidate;
    }
    counter++;
  }
}

export function generateUniqueDriverNickname(
  allDrivers: Driver[],
  baseNickname: string,
  forceSuffix: boolean = false,
): string {
  const pattern = /(_\d+)$/;
  const base = (baseNickname || "").replace(pattern, "").trim();

  let counter = forceSuffix ? 1 : 0;
  while (true) {
    const candidate = counter === 0 ? base : `${base}_${counter}`;
    const exists = (allDrivers || []).some(
      (d) =>
        (d.nickname || "").trim().toLowerCase() ===
        candidate.trim().toLowerCase(),
    );
    if (!exists && candidate.trim() !== "") {
      return candidate;
    }
    counter++;
  }
}

export function mergeDriverAsset(assets: any[], asset: any): any[] {
  if (!asset) return assets;
  const id = asset.model?.entityId || asset.entity_id || asset.id;
  const exists = (assets || []).some(
    (a) =>
      (id && (a.model?.entityId || a.entity_id || a.id) === id) ||
      (asset.url && a.url === asset.url),
  );
  return exists ? assets : [...assets, asset];
}

export function loadDriverStorageJson<T>(
  key: string,
  fallback: T,
  logger?: { error: (msg: string, err: any) => void },
  errorMsg?: string,
): T {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : fallback;
  } catch (e) {
    if (logger && errorMsg) {
      logger.error(errorMsg, e);
    }
    return fallback;
  }
}

export function saveDriverStorageJson(
  key: string,
  value: any,
  logger?: { error: (msg: string, err: any) => void },
  errorMsg?: string,
): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (logger && errorMsg) {
      logger.error(errorMsg, e);
    }
  }
}

export function updateDriverAudioType(
  driver: Driver | undefined,
  slot: DriverAudioSlot,
  type: "preset" | "tts" | "none" | "audio_set",
): void {
  if (!driver) return;
  const { key, defaultUrl } = getAudioSlotInfo(slot);
  const audio = driver[key] as any;
  if (audio) {
    audio.type = type;
    if (type === "none") {
      audio.url = undefined;
      audio.text = undefined;
    } else if (type === "tts") {
      audio.url = undefined;
    } else if (!audio.url) {
      audio.url = defaultUrl;
    }
  }
}

export function updateDriverAudioUrl(
  driver: Driver | undefined,
  slot: DriverAudioSlot,
  url: string | undefined,
): void {
  if (!driver) return;
  const { key } = getAudioSlotInfo(slot);
  const audio = driver[key] as any;
  if (audio) {
    audio.url = url;
  }
}

export function updateDriverAudioText(
  driver: Driver | undefined,
  slot: DriverAudioSlot,
  text: string | undefined,
): void {
  if (!driver) return;
  const { key } = getAudioSlotInfo(slot);
  const audio = driver[key] as any;
  if (audio) {
    audio.text = text;
  }
}

export function getDriverUnsavedReasons(
  driver: Driver | undefined,
  isNameUnique: boolean,
  isNicknameUnique: boolean,
  isSaving: boolean,
  isDirty: boolean,
): string[] {
  const reasons: string[] = [];
  if (!driver) return reasons;

  const nameTrimmed = driver.name?.trim() || "";
  if (!nameTrimmed) {
    reasons.push("DISCARD_REASON_DRIVER_NAME_EMPTY");
  } else if (!isNameUnique) {
    reasons.push("DISCARD_REASON_DRIVER_NAME_DUPLICATE");
  }

  const nickTrimmed = driver.nickname?.trim() || "";
  if (!nickTrimmed) {
    reasons.push("DISCARD_REASON_DRIVER_NICKNAME_EMPTY");
  } else if (!isNicknameUnique) {
    reasons.push("DISCARD_REASON_DRIVER_NICKNAME_DUPLICATE");
  }

  if (isSaving) {
    reasons.push("DISCARD_REASON_SAVING");
  } else if (reasons.length === 0 && isDirty) {
    reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
  }

  return reasons;
}

export function isDriverNameUnique(
  allDrivers: Driver[],
  name: string | undefined,
  currentDriverId?: string,
): boolean {
  const trimmed = name?.trim().toLowerCase();
  if (!trimmed) return false;
  return !(allDrivers || []).some(
    (d) =>
      (currentDriverId ? d.entity_id !== currentDriverId : true) &&
      (d.name || "").trim().toLowerCase() === trimmed,
  );
}

export function isDriverNicknameUnique(
  allDrivers: Driver[],
  nickname: string | undefined,
  currentDriverId?: string,
): boolean {
  const trimmed = nickname?.trim().toLowerCase();
  if (!trimmed) return false;
  return !(allDrivers || []).some(
    (d) =>
      (currentDriverId ? d.entity_id !== currentDriverId : true) &&
      (d.nickname || "").trim().toLowerCase() === trimmed,
  );
}
