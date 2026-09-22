import { Driver } from "@app/models/driver";

import {
  getAudioSlotFallbackName,
  getAudioSlotInfo,
  mapSoundType,
  toDriver,
} from "./driver-editor.helper";

describe("driver-editor.helper", () => {
  describe("getAudioSlotInfo", () => {
    it("should return correct key and defaultUrl for each driver audio slot", () => {
      expect(getAudioSlotInfo("lap")).toEqual({
        key: "lapAudio",
        defaultUrl: "default_beep",
      });
      expect(getAudioSlotInfo("bestLap")).toEqual({
        key: "bestLapAudio",
        defaultUrl: "default_driveby",
      });
      expect(getAudioSlotInfo("penalty")).toEqual({
        key: "penaltyAudio",
        defaultUrl: "default_penalty",
      });
      expect(getAudioSlotInfo("falseStart")).toEqual({
        key: "penaltyAudio",
        defaultUrl: "default_penalty",
      });
      expect(getAudioSlotInfo("overallBestLap")).toEqual({
        key: "overallBestLapAudio",
        defaultUrl: "default_record_lap",
      });
      expect(getAudioSlotInfo("overallLaneBestLap")).toEqual({
        key: "overallLaneBestLapAudio",
        defaultUrl: "default_record_lane_lap",
      });
      expect(getAudioSlotInfo("raceBestLap")).toEqual({
        key: "raceBestLapAudio",
        defaultUrl: "default_best_race_lap",
      });
      expect(getAudioSlotInfo("raceLaneBestLap")).toEqual({
        key: "raceLaneBestLapAudio",
        defaultUrl: "default_best_race_lane_lap",
      });
      expect(getAudioSlotInfo("heatBestLap")).toEqual({
        key: "heatBestLapAudio",
        defaultUrl: "default_best_heat_lap",
      });
      expect(getAudioSlotInfo("newRaceLeader")).toEqual({
        key: "newRaceLeaderAudio",
        defaultUrl: "default_new_race_leader",
      });
      expect(getAudioSlotInfo("newHeatLeader")).toEqual({
        key: "newHeatLeaderAudio",
        defaultUrl: "default_new_heat_leader",
      });
      expect(getAudioSlotInfo("pitIn")).toEqual({
        key: "pitInAudio",
        defaultUrl: "default_pit_in",
      });
      expect(getAudioSlotInfo("fuel")).toEqual({
        key: "fuelAudio",
        defaultUrl: "default_fuel_level",
      });
    });
  });

  describe("getAudioSlotFallbackName", () => {
    it("should return human-readable fallback names for all audio slots", () => {
      expect(getAudioSlotFallbackName("lap")).toBe("Lap Beep");
      expect(getAudioSlotFallbackName("bestLap")).toBe("Lap Driveby");
      expect(getAudioSlotFallbackName("penalty")).toBe("Penalty");
      expect(getAudioSlotFallbackName("falseStart")).toBe("Penalty");
      expect(getAudioSlotFallbackName("overallBestLap")).toBe(
        "Overall Record Lap",
      );
      expect(getAudioSlotFallbackName("overallLaneBestLap")).toBe(
        "Overall Lane Record Lap",
      );
      expect(getAudioSlotFallbackName("raceBestLap")).toBe("Race Best Lap");
      expect(getAudioSlotFallbackName("raceLaneBestLap")).toBe(
        "Race Lane Best Lap",
      );
      expect(getAudioSlotFallbackName("heatBestLap")).toBe("Heat Best Lap");
      expect(getAudioSlotFallbackName("newRaceLeader")).toBe("New Race Leader");
      expect(getAudioSlotFallbackName("newHeatLeader")).toBe("New Heat Leader");
      expect(getAudioSlotFallbackName("pitIn")).toBe("Pit In");
      expect(getAudioSlotFallbackName("fuel")).toBe("Default Fuel Level");
    });
  });

  describe("mapSoundType", () => {
    it("should map types correctly", () => {
      expect(mapSoundType("tts")).toBe("tts");
      expect(mapSoundType("none")).toBe("none");
      expect(mapSoundType("audio_set")).toBe("audio_set");
      expect(mapSoundType("preset")).toBe("preset");
      expect(mapSoundType(undefined, "audio_set")).toBe("audio_set");
      expect(mapSoundType(undefined)).toBe("preset");
    });
  });

  describe("toDriver", () => {
    it("should convert plain driver object to Driver instance", () => {
      const plain = {
        entity_id: "d1",
        name: "Speedy",
        nickname: "Speeds",
        lapSoundUrl: "default_beep",
      };
      const driver = toDriver(plain);
      expect(driver instanceof Driver).toBeTrue();
      expect(driver.entity_id).toBe("d1");
      expect(driver.name).toBe("Speedy");
      expect(driver.nickname).toBe("Speeds");
      expect(driver.lapAudio.url).toBe("default_beep");
      expect(driver.overallBestLapAudio.url).toBe("default_record_lap");
    });
  });
});
