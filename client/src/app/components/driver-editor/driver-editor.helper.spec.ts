import {
  areDriversEqual,
  cloneDriver,
  createNewDriverTemplate,
  getAudioSlotInfo,
  mapSoundType,
  toDriver,
} from "./driver-editor.helper";

describe("DriverEditorHelper", () => {
  it("should return slot info for all audio slots", () => {
    expect(getAudioSlotInfo("lap").key).toBe("lapAudio");
    expect(getAudioSlotInfo("bestLap").key).toBe("bestLapAudio");
    expect(getAudioSlotInfo("penalty").key).toBe("penaltyAudio");
    expect(getAudioSlotInfo("falseStart").key).toBe("penaltyAudio");
    expect(getAudioSlotInfo("overallBestLap").key).toBe("overallBestLapAudio");
    expect(getAudioSlotInfo("overallLaneBestLap").key).toBe(
      "overallLaneBestLapAudio",
    );
    expect(getAudioSlotInfo("raceBestLap").key).toBe("raceBestLapAudio");
    expect(getAudioSlotInfo("raceLaneBestLap").key).toBe(
      "raceLaneBestLapAudio",
    );
    expect(getAudioSlotInfo("heatBestLap").key).toBe("heatBestLapAudio");
    expect(getAudioSlotInfo("newRaceLeader").key).toBe("newRaceLeaderAudio");
    expect(getAudioSlotInfo("newHeatLeader").key).toBe("newHeatLeaderAudio");
    expect(getAudioSlotInfo("pitIn").key).toBe("pitInAudio");
    expect(getAudioSlotInfo("fuel").key).toBe("fuelAudio");
  });

  it("should map sound types appropriately", () => {
    expect(mapSoundType("tts")).toBe("tts");
    expect(mapSoundType("none")).toBe("none");
    expect(mapSoundType("audio_set")).toBe("audio_set");
    expect(mapSoundType(undefined, "audio_set")).toBe("audio_set");
    expect(mapSoundType("preset", "audio_set")).toBe("audio_set");
    expect(mapSoundType(undefined, "preset")).toBe("preset");
  });

  it("should create new driver template with defaults", () => {
    const d = createNewDriverTemplate();
    expect(d.entity_id).toBe("new");
    expect(d.lapAudio?.url).toBe("default_beep");
  });

  it("should clone driver correctly", () => {
    const d = createNewDriverTemplate();
    d.name = "Original";
    const cloned = cloneDriver(d);
    expect(cloned.name).toBe("Original");
    expect(cloned).not.toBe(d);
  });

  it("should convert raw driver to Driver model via toDriver", () => {
    const raw = {
      entity_id: "d1",
      name: "Driver 1",
      nickname: "D1",
      lapAudio: { type: "preset", url: "beep" },
    };
    const driver = toDriver(raw);
    expect(driver.entity_id).toBe("d1");
    expect(driver.name).toBe("Driver 1");
    expect(driver.nickname).toBe("D1");
    expect(driver.lapAudio?.url).toBe("beep");
  });

  it("should compare drivers equality properly", () => {
    const d1 = createNewDriverTemplate();
    d1.name = "Driver A";
    d1.nickname = "A";
    const d2 = cloneDriver(d1);

    expect(areDriversEqual(d1, d2)).toBeTrue();

    d2.name = "Driver B";
    expect(areDriversEqual(d1, d2)).toBeFalse();

    d2.name = "Driver A";
    d2.lapAudio = { type: "tts", text: "Hello" };
    expect(areDriversEqual(d1, d2)).toBeFalse();
  });
});
