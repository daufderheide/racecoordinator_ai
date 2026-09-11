import { Driver, EMPTY_DRIVER_ID } from "./driver";

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
    );
    expect(driver.lapAudio.type).toBe("none");
    expect(driver.lapAudio.url).toBeUndefined();
    expect(driver.bestLapAudio.type).toBe("none");
    expect(driver.bestLapAudio.url).toBeUndefined();
    expect(driver.penaltyAudio.type).toBe("none");
    expect(driver.penaltyAudio.url).toBeUndefined();
    expect(driver.falseStartAudio.type).toBe("none");
    expect(driver.falseStartAudio.url).toBeUndefined();
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
});
