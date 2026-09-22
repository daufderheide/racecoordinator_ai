import { Driver, EMPTY_DRIVER_ID, sanitizeDriverAudio } from "./driver";

describe("Driver Model", () => {
  it("should identify EMPTY_DRIVER_ID correctly", () => {
    const emptyDriver = new Driver(EMPTY_DRIVER_ID, "Empty", "Empty");
    expect(emptyDriver.isEmpty()).toBeTrue();
    expect(Driver.isEmpty(EMPTY_DRIVER_ID)).toBeTrue();
  });

  it("should return true for null or undefined drivers", () => {
    expect(Driver.isEmpty(null)).toBeTrue();
    expect(Driver.isEmpty(undefined)).toBeTrue();
    expect(Driver.isEmpty("")).toBeTrue();
  });

  it("should return false for valid drivers with entity_id", () => {
    const driver = new Driver("d_alice_123", "Alice", "The Rocket");
    expect(driver.isEmpty()).toBeFalse();
    expect(Driver.isEmpty(driver)).toBeFalse();
    expect(driver.entity_id).toBe("d_alice_123");
  });

  it("should return false for transient driver objects with a name but no id", () => {
    const mockDriver = { name: "Mock Driver" };
    expect(Driver.isEmpty(mockDriver)).toBeFalse();
  });

  it("should initialize default preset audio when audio configs are omitted", () => {
    const driver = new Driver("d1", "Dave", "Dave");
    expect(driver.lapAudio).toEqual({ type: "preset", url: "default_beep" });
    expect(driver.bestLapAudio).toEqual({
      type: "preset",
      url: "default_driveby",
    });
    expect(driver.penaltyAudio).toEqual({
      type: "preset",
      url: "default_penalty",
    });
    expect(driver.overallBestLapAudio).toEqual({
      type: "preset",
      url: "default_record_lap",
    });
    expect(driver.overallLaneBestLapAudio).toEqual({
      type: "preset",
      url: "default_record_lane_lap",
    });
    expect(driver.raceBestLapAudio).toEqual({
      type: "preset",
      url: "default_best_race_lap",
    });
    expect(driver.raceLaneBestLapAudio).toEqual({
      type: "preset",
      url: "default_best_race_lane_lap",
    });
    expect(driver.heatBestLapAudio).toEqual({
      type: "preset",
      url: "default_best_heat_lap",
    });
    expect(driver.newRaceLeaderAudio).toEqual({
      type: "preset",
      url: "default_new_race_leader",
    });
    expect(driver.newHeatLeaderAudio).toEqual({
      type: "preset",
      url: "default_new_heat_leader",
    });
  });

  it("should not set default preset sound urls when type is none", () => {
    const driver = new Driver(
      "d1",
      "Dave",
      "Dave",
      undefined,
      { type: "none" },
      { type: "none" },
      { type: "none" },
      undefined,
      { type: "none" },
      { type: "none" },
      { type: "none" },
      { type: "none" },
      { type: "none" },
      { type: "none" },
      { type: "none" },
    );
    expect(driver.lapAudio.type).toBe("none");
    expect(driver.lapAudio.url).toBeUndefined();
    expect(driver.bestLapAudio.type).toBe("none");
    expect(driver.bestLapAudio.url).toBeUndefined();
    expect(driver.penaltyAudio.type).toBe("none");
    expect(driver.penaltyAudio.url).toBeUndefined();
    expect(driver.falseStartAudio.type).toBe("none");
    expect(driver.falseStartAudio.url).toBeUndefined();
    expect(driver.overallBestLapAudio.type).toBe("none");
    expect(driver.overallBestLapAudio.url).toBeUndefined();
    expect(driver.overallLaneBestLapAudio.type).toBe("none");
    expect(driver.overallLaneBestLapAudio.url).toBeUndefined();
    expect(driver.raceBestLapAudio.type).toBe("none");
    expect(driver.raceBestLapAudio.url).toBeUndefined();
    expect(driver.raceLaneBestLapAudio.type).toBe("none");
    expect(driver.raceLaneBestLapAudio.url).toBeUndefined();
    expect(driver.heatBestLapAudio.type).toBe("none");
    expect(driver.heatBestLapAudio.url).toBeUndefined();
    expect(driver.newRaceLeaderAudio.type).toBe("none");
    expect(driver.newRaceLeaderAudio.url).toBeUndefined();
    expect(driver.newHeatLeaderAudio.type).toBe("none");
    expect(driver.newHeatLeaderAudio.url).toBeUndefined();
  });

  it("should support falseStartAudio getter, setter, and constructor parameter", () => {
    const driverWithParam = new Driver(
      "d2",
      "Bob",
      "Bob",
      undefined,
      undefined,
      undefined,
      undefined,
      { type: "preset", url: "my_false_start.wav" },
    );
    expect(driverWithParam.falseStartAudio).toEqual({
      type: "preset",
      url: "my_false_start.wav",
      text: undefined,
    });
    expect(driverWithParam.penaltyAudio).toEqual({
      type: "preset",
      url: "my_false_start.wav",
      text: undefined,
    });

    driverWithParam.falseStartAudio = {
      type: "tts",
      text: "False start on {driver.name}",
    };
    expect(driverWithParam.penaltyAudio).toEqual({
      type: "tts",
      text: "False start on {driver.name}",
    });
    expect(driverWithParam.falseStartAudio).toEqual({
      type: "tts",
      text: "False start on {driver.name}",
    });
  });

  it("should initialize using DriverAudioConfig options object", () => {
    const driver = new Driver("d_opts", "Options Driver", "OD", undefined, {
      lapAudio: { type: "none" },
      bestLapAudio: { type: "tts", text: "New best lap!" },
      heatBestLapAudio: { type: "none" },
    });

    expect(driver.entity_id).toBe("d_opts");
    expect(driver.name).toBe("Options Driver");
    expect(driver.lapAudio).toEqual({
      type: "none",
      url: undefined,
      text: undefined,
    });
    expect(driver.bestLapAudio).toEqual({
      type: "tts",
      url: undefined,
      text: "New best lap!",
    });
    expect(driver.heatBestLapAudio).toEqual({
      type: "none",
      url: undefined,
      text: undefined,
    });
    // Omitted properties should still default to preset defaults
    expect(driver.overallBestLapAudio).toEqual({
      type: "preset",
      url: "default_record_lap",
    });
  });

  it("should initialize using DriverInit object", () => {
    const driver = new Driver({
      entity_id: "d_init",
      name: "Init Driver",
      nickname: "ID",
      lapAudio: { type: "none" },
      bestLapAudio: { type: "none" },
      raceBestLapAudio: { type: "none" },
    });

    expect(driver.entity_id).toBe("d_init");
    expect(driver.name).toBe("Init Driver");
    expect(driver.nickname).toBe("ID");
    expect(driver.lapAudio.type).toBe("none");
    expect(driver.bestLapAudio.type).toBe("none");
    expect(driver.raceBestLapAudio.type).toBe("none");
    expect(driver.penaltyAudio.type).toBe("preset");
  });

  it("should create default driver via Driver.createDefault factory", () => {
    const driver = Driver.createDefault("d_def", "Default Driver", "Def");
    expect(driver.entity_id).toBe("d_def");
    expect(driver.name).toBe("Default Driver");
    expect(driver.nickname).toBe("Def");
    expect(driver.lapAudio).toEqual({ type: "preset", url: "default_beep" });
    expect(driver.overallBestLapAudio).toEqual({
      type: "preset",
      url: "default_record_lap",
    });
  });

  it("should fall back to default URLs when preset has empty string or whitespace url", () => {
    const driver = new Driver({
      entity_id: "d_blank_urls",
      name: "Blank URLs",
      lapAudio: { type: "preset", url: "" },
      bestLapAudio: { type: "preset", url: "   " },
      overallBestLapAudio: { type: "preset", url: "" },
      pitInAudio: { type: "preset", url: "  " },
      fuelAudio: { type: "audio_set", url: "" },
    });

    expect(driver.lapAudio.type).toBe("preset");
    expect(driver.lapAudio.url).toBe("default_beep");
    expect(driver.bestLapAudio.type).toBe("preset");
    expect(driver.bestLapAudio.url).toBe("default_driveby");
    expect(driver.overallBestLapAudio.type).toBe("preset");
    expect(driver.overallBestLapAudio.url).toBe("default_record_lap");
    expect(driver.pitInAudio.type).toBe("preset");
    expect(driver.pitInAudio.url).toBe("default_pit_in");
    expect(driver.fuelAudio.type).toBe("audio_set");
    expect(driver.fuelAudio.url).toBe("default_fuel_level");
  });

  describe("sanitizeDriverAudio", () => {
    it("should return preset with default URL if config is undefined or type is missing", () => {
      expect(sanitizeDriverAudio(undefined, "default_beep")).toEqual({
        type: "preset",
        url: "default_beep",
      });
      expect(sanitizeDriverAudio({} as any, "default_beep")).toEqual({
        type: "preset",
        url: "default_beep",
      });
    });

    it("should preserve none type without url", () => {
      expect(sanitizeDriverAudio({ type: "none" })).toEqual({
        type: "none",
        url: undefined,
        text: undefined,
      });
    });

    it("should preserve tts type with text", () => {
      expect(sanitizeDriverAudio({ type: "tts", text: "Hello" })).toEqual({
        type: "tts",
        url: undefined,
        text: "Hello",
      });
    });

    it("should replace empty or whitespace preset url with defaultUrl", () => {
      expect(
        sanitizeDriverAudio({ type: "preset", url: "" }, "default_beep"),
      ).toEqual({
        type: "preset",
        url: "default_beep",
        text: undefined,
      });
      expect(
        sanitizeDriverAudio({ type: "preset", url: "   " }, "default_beep"),
      ).toEqual({
        type: "preset",
        url: "default_beep",
        text: undefined,
      });
    });
  });
});
