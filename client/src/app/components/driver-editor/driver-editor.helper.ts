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
  return new Driver(
    d.entity_id,
    d.name,
    d.nickname || "",
    d.avatarUrl,
    {
      type: mapSoundType(d.lapAudio?.type || d.lapSoundType),
      url: d.lapAudio?.url || d.lapSoundUrl,
      text: d.lapAudio?.text || d.lapSoundText,
    },
    {
      type: mapSoundType(d.bestLapAudio?.type || d.bestLapSoundType),
      url: d.bestLapAudio?.url || d.bestLapSoundUrl,
      text: d.bestLapAudio?.text || d.bestLapSoundText,
    },
    {
      type: mapSoundType(d.penaltyAudio?.type || d.penaltySoundType),
      url: d.penaltyAudio?.url || d.penaltySoundUrl,
      text: d.penaltyAudio?.text || d.penaltySoundText,
    },
    undefined,
    {
      type: mapSoundType(d.overallBestLapAudio?.type),
      url: d.overallBestLapAudio?.url,
      text: d.overallBestLapAudio?.text,
    },
    {
      type: mapSoundType(d.overallLaneBestLapAudio?.type),
      url: d.overallLaneBestLapAudio?.url,
      text: d.overallLaneBestLapAudio?.text,
    },
    {
      type: mapSoundType(d.raceBestLapAudio?.type),
      url: d.raceBestLapAudio?.url,
      text: d.raceBestLapAudio?.text,
    },
    {
      type: mapSoundType(d.raceLaneBestLapAudio?.type),
      url: d.raceLaneBestLapAudio?.url,
      text: d.raceLaneBestLapAudio?.text,
    },
    {
      type: mapSoundType(d.heatBestLapAudio?.type),
      url: d.heatBestLapAudio?.url,
      text: d.heatBestLapAudio?.text,
    },
    {
      type: mapSoundType(d.newRaceLeaderAudio?.type),
      url: d.newRaceLeaderAudio?.url,
      text: d.newRaceLeaderAudio?.text,
    },
    {
      type: mapSoundType(d.newHeatLeaderAudio?.type),
      url: d.newHeatLeaderAudio?.url,
      text: d.newHeatLeaderAudio?.text,
    },
    {
      type: mapSoundType(d.pitInAudio?.type),
      url: d.pitInAudio?.url,
      text: d.pitInAudio?.text,
    },
    {
      type: mapSoundType(d.fuelAudio?.type, "audio_set"),
      url: d.fuelAudio?.url || "default_fuel_level",
      text: d.fuelAudio?.text,
    },
  );
}

export function createNewDriverTemplate(): Driver {
  return new Driver(
    "new",
    "",
    "",
    "",
    { type: "preset", url: "default_beep" },
    { type: "preset", url: "default_driveby" },
    { type: "preset", url: "default_penalty" },
    undefined,
    { type: "preset", url: "default_record_lap" },
    { type: "preset", url: "default_record_lane_lap" },
    { type: "preset", url: "default_best_race_lap" },
    { type: "preset", url: "default_best_race_lane_lap" },
    { type: "preset", url: "default_best_heat_lap" },
    { type: "preset", url: "default_new_race_leader" },
    { type: "preset", url: "default_new_heat_leader" },
    { type: "preset", url: "default_pit_in" },
    { type: "audio_set", url: "default_fuel_level" },
  );
}

export function cloneDriver(driver: Driver): Driver {
  return new Driver(
    driver.entity_id,
    driver.name,
    driver.nickname,
    driver.avatarUrl,
    driver.lapAudio ? { ...driver.lapAudio } : undefined,
    driver.bestLapAudio ? { ...driver.bestLapAudio } : undefined,
    driver.penaltyAudio ? { ...driver.penaltyAudio } : undefined,
    undefined,
    driver.overallBestLapAudio ? { ...driver.overallBestLapAudio } : undefined,
    driver.overallLaneBestLapAudio
      ? { ...driver.overallLaneBestLapAudio }
      : undefined,
    driver.raceBestLapAudio ? { ...driver.raceBestLapAudio } : undefined,
    driver.raceLaneBestLapAudio
      ? { ...driver.raceLaneBestLapAudio }
      : undefined,
    driver.heatBestLapAudio ? { ...driver.heatBestLapAudio } : undefined,
    driver.newRaceLeaderAudio ? { ...driver.newRaceLeaderAudio } : undefined,
    driver.newHeatLeaderAudio ? { ...driver.newHeatLeaderAudio } : undefined,
    driver.pitInAudio ? { ...driver.pitInAudio } : undefined,
    driver.fuelAudio ? { ...driver.fuelAudio } : undefined,
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
