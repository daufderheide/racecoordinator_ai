import { Driver } from "./driver";

describe("Driver Model Defaults", () => {
  it("should initialize default sounds when lapAudio, bestLapAudio, and penaltyAudio are not provided", () => {
    const driver = new Driver("d1", "Test Driver", "TD");
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

  it("should preserve explicitly provided sound configurations", () => {
    const customLap = { type: "tts" as const, text: "custom lap" };
    const customBest = { type: "preset" as const, url: "/custom/best.wav" };
    const customPenalty = { type: "none" as const };

    const driver = new Driver(
      "d1",
      "Test Driver",
      "TD",
      "avatar.png",
      customLap,
      customBest,
      customPenalty,
    );

    expect(driver.lapAudio).toEqual({
      type: "tts",
      text: "custom lap",
      url: "default_beep",
    });
    expect(driver.bestLapAudio).toEqual({
      type: "preset",
      url: "/custom/best.wav",
    });
    expect(driver.penaltyAudio).toEqual({
      type: "none",
      url: "default_penalty",
    });
  });
});
