import {
  createTTSContext,
  dispatchLapAudio,
  getLapAudioConfig,
  interpolate,
  mockTTSContext,
  playSound,
  resolveAudioUrl,
  resolveLapAudio,
} from "./audio";

describe("playSound Utility", () => {
  let _originalAudio: any;
  let mockAudioInstance: any;
  let mockSpeechSynthesis: any;
  let _originalSpeechSynthesis: any;

  const SERVER_URL = "http://localhost:8080";
  let mockLogger: any;
  let originalSpeechSynthesisUtterance: any;

  beforeAll(() => {
    originalSpeechSynthesisUtterance = (window as any).SpeechSynthesisUtterance;
    (window as any).SpeechSynthesisUtterance = class {
      text: string;
      voice: any = null;
      rate = 1;
      pitch = 1;
      volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    };
  });

  afterAll(() => {
    (window as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  beforeEach(() => {
    // Mock Audio
    mockAudioInstance = jasmine.createSpyObj("AudioInstance", ["play"]);
    mockAudioInstance.play.and.returnValue(Promise.resolve());
    spyOn(window, "Audio").and.callFake(function (this: any) {
      return mockAudioInstance;
    });

    // Mock SpeechSynthesis
    mockSpeechSynthesis = jasmine.createSpyObj("SpeechSynthesis", [
      "cancel",
      "speak",
      "getVoices",
    ]);
    mockSpeechSynthesis.getVoices.and.returnValue([
      { name: "Alex", voiceURI: "alex-uri" },
    ]);
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true,
    });

    mockLogger = {
      debug: jasmine.createSpy("debug"),
      info: jasmine.createSpy("info"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
    };
  });

  describe("Preset Audio", () => {
    it("should play absolute URL as-is", () => {
      const url = "http://example.com/sound.mp3";
      playSound("preset", url, undefined, SERVER_URL);

      expect(window.Audio).toHaveBeenCalledWith(url);
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should play relative URL with server prefix", () => {
      const path = "/sounds/beep.mp3";
      playSound("preset", path, undefined, SERVER_URL);

      expect(window.Audio).toHaveBeenCalledWith(`${SERVER_URL}${path}`);
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should play asset ID via download endpoint", () => {
      const assetId = "0892e8cf-8be4-49a5-823e-d13722094268";
      playSound("preset", assetId, undefined, SERVER_URL);

      expect(window.Audio).toHaveBeenCalledWith(
        `${SERVER_URL}/api/assets/download/${assetId}`,
      );
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should catch play errors", async () => {
      const path = "/error.mp3";
      mockAudioInstance.play.and.returnValue(Promise.reject("Play error"));

      playSound("preset", path, undefined, SERVER_URL, undefined, mockLogger);

      // Wait for promise resolution
      await Promise.resolve();

      expect(mockAudioInstance.play).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error playing sound",
        "Play error",
      );
    });

    it("should do nothing if URL is missing", () => {
      playSound("preset", undefined, undefined, SERVER_URL);
      expect(window.Audio).not.toHaveBeenCalled();
    });
  });

  describe("Text-to-Speech", () => {
    it("should speak provided text", () => {
      const text = "Lap 5";
      playSound("tts", undefined, text, SERVER_URL);

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled(); // Should cancel previous
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe(text);
    });

    it("should warn if TTS not supported", () => {
      // Remove synthesis support
      Object.defineProperty(window, "speechSynthesis", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      playSound("tts", undefined, "Hello", SERVER_URL, undefined, mockLogger);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Text-to-speech not supported in this browser.",
      );
    });

    it("should do nothing if text is missing", () => {
      playSound("tts", undefined, undefined, SERVER_URL);
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it("should interpolate driver fields", () => {
      const text = "{driver.nickname}'s last lap was {driver.lastLapTime}";
      const data = {
        driver: {
          nickname: "Dave",
          lastLapTime: 1.234,
        },
      };
      playSound("tts", undefined, text, SERVER_URL, data);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Dave's last lap was 1.234");
    });

    it("should format decimals to 3 places", () => {
      const text = "Time: {time}";
      const data = { time: 1.2345678 };
      playSound("tts", undefined, text, SERVER_URL, data);

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Time: 1.235");
    });

    it("should leave unknown placeholders alone", () => {
      const text = "Hello {unknown}";
      playSound("tts", undefined, text, SERVER_URL, {});

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Hello {unknown}");
    });

    it("should apply PlaySoundOptions when playing TTS", () => {
      playSound(
        "tts",
        undefined,
        "Test sound",
        SERVER_URL,
        undefined,
        undefined,
        {
          masterVolume: 80,
          ttsVolume: 50,
          ttsRate: 1.5,
          ttsPitch: 0.8,
          ttsVoice: "Alex",
        },
      );

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Test sound");
      expect(callArgs[0].rate).toBe(1.5);
      expect(callArgs[0].pitch).toBeCloseTo(0.8, 2);
      expect(callArgs[0].volume).toBeCloseTo(0.4, 2);
      expect(callArgs[0].voice).toEqual(
        jasmine.objectContaining({ name: "Alex" }),
      );
    });

    it("should set audio.volume with masterVolume for preset sounds", () => {
      playSound(
        "preset",
        "sound.mp3",
        undefined,
        SERVER_URL,
        undefined,
        undefined,
        {
          masterVolume: 35,
        },
      );

      expect(mockAudioInstance.volume).toBeCloseTo(0.35, 2);
    });

    it("should fall back to saved localStorage settings when options are omitted", () => {
      spyOn(localStorage, "getItem").and.callFake((key: string) => {
        if (key === "racecoordinator_settings") {
          return JSON.stringify({
            masterVolume: 50,
            ttsVolume: 50,
            ttsRate: 1.2,
            ttsPitch: 1.1,
            ttsVoice: "Alex",
          });
        }
        return null;
      });

      playSound("tts", undefined, "Saved settings test", SERVER_URL);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Saved settings test");
      expect(callArgs[0].rate).toBeCloseTo(1.2, 2);
      expect(callArgs[0].pitch).toBeCloseTo(1.1, 2);
      expect(callArgs[0].volume).toBeCloseTo(0.25, 2); // 0.5 * 0.5
      expect(callArgs[0].voice).toEqual(
        jasmine.objectContaining({ name: "Alex" }),
      );
    });

    it("should match voice case-insensitively and trimmed", () => {
      playSound(
        "tts",
        undefined,
        "Voice match test",
        SERVER_URL,
        undefined,
        undefined,
        {
          ttsVoice: "  alex  ",
        },
      );

      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].voice).toEqual(
        jasmine.objectContaining({ name: "Alex" }),
      );
    });
  });

  describe("TTS Helpers", () => {
    it("should create a valid TTS context with telemetry and race info", () => {
      const driver = { name: "Alice", nickname: "Ali" };
      const data = {
        lastLapTime: 1.1,
        bestLapTime: 1.0,
        averageLapTime: 1.2,
        medianLapTime: 1.15,
        lapCount: 5,
        totalLaps: 5,
        totalTime: 6.0,
        gapLeader: 0.5,
        gapPosition: 0.2,
      };
      const race = { name: "Friday GP" };
      const track = { name: "Monaco" };
      const heat = { number: 2 };
      const context = createTTSContext(driver, data, race, track, heat);

      expect(context.driver.name).toBe("Alice");
      expect(context.driver.nickname).toBe("Ali");
      expect(context.driver.driver.name).toBe("Alice");
      expect(context.driver.lastLapTime).toBe(1.1);
      expect(context.driver.bestLapTime).toBe(1.0);
      expect(context.driver.averageLapTime).toBe(1.2);
      expect(context.driver.medianLapTime).toBe(1.15);
      expect(context.driver.totalLaps).toBe(5);
      expect(context.driver.totalTime).toBe(6.0);
      expect(context.driver.gapLeader).toBe(0.5);
      expect(context.driver.gapPosition).toBe(0.2);
      expect(context.race?.name).toBe("Friday GP");
      expect(context.track?.name).toBe("Monaco");
      expect(context.heat?.number).toBe(2);
    });

    it("should use name if nickname is missing", () => {
      const driver = { name: "Bob", nickname: "" };
      const data = {
        lastLapTime: 0,
        bestLapTime: 0,
        averageLapTime: 0,
        lapCount: 0,
      };
      const context = createTTSContext(driver, data);

      expect(context.driver.nickname).toBe("Bob");
    });

    it("should handle null or undefined gracefully", () => {
      const context = createTTSContext(null, null);
      expect(context.driver.name).toBe("");
      expect(context.driver.nickname).toBe("");
      expect(context.driver.lastLapTime).toBe(0);
      expect(context.driver.lapCount).toBe(0);
    });

    it("should create a mock context with rich unified properties", () => {
      const context = mockTTSContext();
      expect(context.driver.name).toBeDefined();
      expect(context.driver.lastLapTime).toBeGreaterThan(0);
      expect(context.driver.bestLapTime).toBeGreaterThan(0);
      expect(context.driver.averageLapTime).toBeGreaterThan(0);
      expect(context.driver.medianLapTime).toBeGreaterThan(0);
      expect(context.driver.totalLaps).toBeGreaterThan(0);
      expect(context.driver.driver.name).toBe(context.driver.name);
      expect(context.race?.name).toBeDefined();
      expect(context.track?.name).toBeDefined();
    });
  });

  describe("interpolate Utility", () => {
    it("should interpolate simple paths with {...} and ${...}", () => {
      const text = "Hello {name} and ${name}";
      const data = { name: "World" };
      expect(interpolate(text, data)).toBe("Hello World and World");
    });

    it("should handle whitespace inside braces", () => {
      const text = "Driver { driver.nickname } on lap ${ driver.lapCount }";
      const data = { driver: { nickname: "Speedy", lapCount: 5 } };
      expect(interpolate(text, data)).toBe("Driver Speedy on lap 5");
    });

    it("should interpolate nested paths with both {...} and ${...}", () => {
      const text = "{driver.name} has ${stats.laps} laps on {track.name}";
      const data = {
        driver: { name: "Alice" },
        stats: { laps: 10 },
        track: { name: "Monaco" },
      };
      expect(interpolate(text, data)).toBe("Alice has 10 laps on Monaco");
    });

    it("should handle case-insensitivity with both {...} and ${...}", () => {
      const text = "{DRIVER.NAME} - ${DRIVER.NICKNAME}";
      const data = { driver: { name: "Bob", nickname: "Bobby" } };
      expect(interpolate(text, data)).toBe("Bob - Bobby");
    });

    it("should format numbers to 3 decimal places", () => {
      const text = "Value: {val} and ${val}";
      const data = { val: 1.2345678 };
      expect(interpolate(text, data)).toBe("Value: 1.235 and 1.235");
    });

    it("should leave placeholders if value not found", () => {
      const text = "Keep {missing} and ${other_missing}";
      const data = {};
      expect(interpolate(text, data)).toBe(
        "Keep {missing} and ${other_missing}",
      );
    });

    it("should leave placeholders if object resolved rather than primitive", () => {
      const text = "Driver: {driver} and ${driver}";
      const data = { driver: { name: "Alice" } };
      expect(interpolate(text, data)).toBe("Driver: {driver} and ${driver}");
    });

    it("should handle empty or null text and data safely", () => {
      expect(interpolate("", {})).toBe("");
      expect(interpolate("Hello", null)).toBe("Hello");
      expect(interpolate("Hello", undefined)).toBe("Hello");
    });
  });

  describe("getLapAudioConfig Utility", () => {
    const driver = {
      name: "Fast Driver",
      lapAudio: { type: "preset", url: "lap.wav" },
      bestLapAudio: { type: "preset", url: "best.wav" },
      overallBestLapAudio: { type: "preset", url: "overall_best.wav" },
      overallLaneBestLapAudio: { type: "preset", url: "overall_lane_best.wav" },
      raceBestLapAudio: { type: "preset", url: "race_best.wav" },
      raceLaneBestLapAudio: { type: "preset", url: "race_lane_best.wav" },
      heatBestLapAudio: { type: "preset", url: "heat_best.wav" },
    };

    it("should return undefined if driver is null or undefined", () => {
      expect(getLapAudioConfig(null, 6)).toBeUndefined();
      expect(getLapAudioConfig(undefined, 6)).toBeUndefined();
    });

    it("should return overallBestLapAudio for tier 6 or RECORD_TIER_OVERALL_BEST", () => {
      expect(getLapAudioConfig(driver, 6)?.url).toBe("overall_best.wav");
      expect(getLapAudioConfig(driver, "RECORD_TIER_OVERALL_BEST")?.url).toBe(
        "overall_best.wav",
      );
    });

    it("should return overallLaneBestLapAudio for tier 5 or RECORD_TIER_OVERALL_LANE_BEST", () => {
      expect(getLapAudioConfig(driver, 5)?.url).toBe("overall_lane_best.wav");
      expect(
        getLapAudioConfig(driver, "RECORD_TIER_OVERALL_LANE_BEST")?.url,
      ).toBe("overall_lane_best.wav");
    });

    it("should return raceBestLapAudio for tier 4 or RECORD_TIER_RACE_BEST", () => {
      expect(getLapAudioConfig(driver, 4)?.url).toBe("race_best.wav");
      expect(getLapAudioConfig(driver, "RECORD_TIER_RACE_BEST")?.url).toBe(
        "race_best.wav",
      );
    });

    it("should return raceLaneBestLapAudio for tier 3 or RECORD_TIER_RACE_LANE_BEST", () => {
      expect(getLapAudioConfig(driver, 3)?.url).toBe("race_lane_best.wav");
      expect(getLapAudioConfig(driver, "RECORD_TIER_RACE_LANE_BEST")?.url).toBe(
        "race_lane_best.wav",
      );
    });

    it("should return heatBestLapAudio for tier 2 or RECORD_TIER_HEAT_BEST", () => {
      expect(getLapAudioConfig(driver, 2)?.url).toBe("heat_best.wav");
      expect(getLapAudioConfig(driver, "RECORD_TIER_HEAT_BEST")?.url).toBe(
        "heat_best.wav",
      );
    });

    it("should return bestLapAudio for tier 1 or isBestLap", () => {
      expect(getLapAudioConfig(driver, 1)?.url).toBe("best.wav");
      expect(getLapAudioConfig(driver, "RECORD_TIER_PERSONAL_BEST")?.url).toBe(
        "best.wav",
      );
      expect(getLapAudioConfig(driver, 0, true)?.url).toBe("best.wav");
    });

    it("should fallback to bestLapAudio if specific tier audio is not configured", () => {
      const partialDriver = {
        name: "Partial Driver",
        bestLapAudio: { type: "preset", url: "fallback_best.wav" },
      };
      expect(getLapAudioConfig(partialDriver, 6)?.url).toBe(
        "fallback_best.wav",
      );
      expect(getLapAudioConfig(partialDriver, 5)?.url).toBe(
        "fallback_best.wav",
      );
      expect(getLapAudioConfig(partialDriver, 4)?.url).toBe(
        "fallback_best.wav",
      );
      expect(getLapAudioConfig(partialDriver, 3)?.url).toBe(
        "fallback_best.wav",
      );
      expect(getLapAudioConfig(partialDriver, 2)?.url).toBe(
        "fallback_best.wav",
      );
    });

    it("should cascade to next highest priority sound when tier audio is configured as none", () => {
      const silentTierDriver = {
        name: "Silent Tier Driver",
        bestLapAudio: { type: "preset", url: "fallback_best.wav" },
        overallBestLapAudio: { type: "none" },
      };
      const config = getLapAudioConfig(silentTierDriver, 6);
      expect(config?.type).toBe("preset");
      expect(config?.url).toBe("fallback_best.wav");
    });

    it("should return undefined if all candidate sounds are configured as none", () => {
      const allNoneDriver = {
        name: "All None Driver",
        overallBestLapAudio: { type: "none" },
        overallLaneBestLapAudio: { type: "none" },
        newRaceLeaderAudio: { type: "none" },
        newHeatLeaderAudio: { type: "none" },
        raceBestLapAudio: { type: "none" },
        raceLaneBestLapAudio: { type: "none" },
        heatBestLapAudio: { type: "none" },
        bestLapAudio: { type: "none" },
      };
      expect(
        getLapAudioConfig(allNoneDriver, 6, true, true, true),
      ).toBeUndefined();
    });

    it("should cascade from race leader to heat leader when race leader is configured as none", () => {
      const leaderDriver = {
        ...driver,
        newRaceLeaderAudio: { type: "none" },
        newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
      };
      // Lap causes both race leader and heat leader
      expect(getLapAudioConfig(leaderDriver, 0, false, true, true)?.url).toBe(
        "heat_leader.wav",
      );
    });

    it("should cascade through multiple levels when highest and 2nd highest are configured as none", () => {
      const multiCascadeDriver = {
        overallBestLapAudio: { type: "none" },
        overallLaneBestLapAudio: { type: "none" },
        newRaceLeaderAudio: { type: "none" },
        newHeatLeaderAudio: { type: "none" },
        raceBestLapAudio: { type: "preset", url: "race_best.wav" },
        bestLapAudio: { type: "preset", url: "personal_best.wav" },
      };
      // Lap has tier 6 and isNewRaceLeader and isNewHeatLeader
      // Overall best (none) -> Overall lane best (none) -> Race leader (none) -> Heat leader (none) -> Race best (set)
      expect(
        getLapAudioConfig(multiCascadeDriver, 6, true, true, true)?.url,
      ).toBe("race_best.wav");
    });

    it("should cascade from heat leader to race best when heat leader is configured as none", () => {
      const cascadeDriver = {
        ...driver,
        newHeatLeaderAudio: { type: "none" },
        raceBestLapAudio: { type: "preset", url: "race_best.wav" },
      };
      // Lap is tier 4 (race best) and isNewHeatLeader
      expect(getLapAudioConfig(cascadeDriver, 4, false, false, true)?.url).toBe(
        "race_best.wav",
      );
    });

    it("should return newRaceLeaderAudio when isNewRaceLeader is true", () => {
      const leaderDriver = {
        ...driver,
        newRaceLeaderAudio: { type: "preset", url: "race_leader.wav" },
        newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
      };
      expect(getLapAudioConfig(leaderDriver, 0, false, true, false)?.url).toBe(
        "race_leader.wav",
      );
    });

    it("should return newHeatLeaderAudio when isNewHeatLeader is true and not race leader", () => {
      const leaderDriver = {
        ...driver,
        newRaceLeaderAudio: { type: "preset", url: "race_leader.wav" },
        newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
      };
      expect(getLapAudioConfig(leaderDriver, 0, false, false, true)?.url).toBe(
        "heat_leader.wav",
      );
    });

    it("should prioritize overall records over leader sounds, and leader sounds over race best sounds", () => {
      const fullDriver = {
        ...driver,
        newRaceLeaderAudio: { type: "preset", url: "race_leader.wav" },
        newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
      };
      // Overall best (tier 6) wins over isNewRaceLeader
      expect(getLapAudioConfig(fullDriver, 6, false, true, false)?.url).toBe(
        "overall_best.wav",
      );
      // Overall lane best (tier 5) wins over isNewRaceLeader
      expect(getLapAudioConfig(fullDriver, 5, false, true, false)?.url).toBe(
        "overall_lane_best.wav",
      );
      // isNewRaceLeader wins over isNewHeatLeader and race best (tier 4)
      expect(getLapAudioConfig(fullDriver, 4, false, true, true)?.url).toBe(
        "race_leader.wav",
      );
      // isNewHeatLeader wins over race best (tier 4)
      expect(getLapAudioConfig(fullDriver, 4, false, false, true)?.url).toBe(
        "heat_leader.wav",
      );
    });

    it("should resolve default_new_race_leader and default_new_heat_leader urls", () => {
      expect(resolveAudioUrl("default_new_race_leader", "http://server")).toBe(
        "http://server/assets/default_new_race_leader_New_Race_Leader",
      );
      expect(resolveAudioUrl("default_new_heat_leader", "http://server")).toBe(
        "http://server/assets/default_new_heat_leader_New_Heat_Leader",
      );
      expect(resolveAudioUrl("default_pit_in", "http://server")).toBe(
        "http://server/assets/default_pit_in_Pit_In",
      );
      expect(resolveAudioUrl("default_fuel_empty", "http://server")).toBe(
        "http://server/assets/default_fuel_empty_Fuel_Empty",
      );
      expect(resolveAudioUrl("default_fuel_low", "http://server")).toBe(
        "http://server/assets/default_fuel_low_Fuel_Low",
      );
      expect(resolveAudioUrl("default_fuel_full", "http://server")).toBe(
        "http://server/assets/default_fuel_full_Fuel_Full",
      );
    });

    it("should return undefined if no special record or best lap is achieved", () => {
      expect(getLapAudioConfig(driver, 0, false)).toBeUndefined();
    });
  });

  describe("resolveLapAudio Utility", () => {
    const driver = {
      overallBestLapAudio: { type: "preset", url: "overall_best.wav" },
      overallLaneBestLapAudio: { type: "preset", url: "overall_lane_best.wav" },
      raceBestLapAudio: { type: "preset", url: "race_best.wav" },
      raceLaneBestLapAudio: { type: "preset", url: "race_lane_best.wav" },
      heatBestLapAudio: { type: "preset", url: "heat_best.wav" },
      bestLapAudio: { type: "preset", url: "personal_best.wav" },
      newRaceLeaderAudio: { type: "preset", url: "race_leader.wav" },
      newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
    };

    it("should return undefined for null or undefined driver", () => {
      expect(resolveLapAudio(null, 6)).toBeUndefined();
      expect(resolveLapAudio(undefined, 6)).toBeUndefined();
    });

    it("should return undefined if no record tier or best lap achieved", () => {
      expect(resolveLapAudio(driver, 0, false)).toBeUndefined();
    });

    it("should resolve Tier 6 (Overall Best) as verbal callout with high priority", () => {
      const result = resolveLapAudio(driver, 6);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("overall_best.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("high");
    });

    it("should resolve Tier 5 (Overall Lane Best) as verbal callout with high priority", () => {
      const result = resolveLapAudio(driver, 5);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("overall_lane_best.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("high");
    });

    it("should resolve New Race Leader as verbal callout with high priority", () => {
      const result = resolveLapAudio(driver, 0, false, true, false);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("race_leader.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("high");
    });

    it("should resolve Tier 4 (Race Best) as verbal callout with high priority", () => {
      const result = resolveLapAudio(driver, 4);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("race_best.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("high");
    });

    it("should resolve New Heat Leader as verbal callout with normal priority", () => {
      const result = resolveLapAudio(driver, 0, false, false, true);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("heat_leader.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("normal");
    });

    it("should resolve Tier 3 (Race Lane Best) as verbal callout with normal priority", () => {
      const result = resolveLapAudio(driver, 3);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("race_lane_best.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("normal");
    });

    it("should resolve Tier 2 (Heat Best) as verbal callout with normal priority", () => {
      const result = resolveLapAudio(driver, 2);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("heat_best.wav");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("normal");
    });

    it("should resolve Tier 1 (Personal Best) preset as non-verbal SFX (isVoice = false)", () => {
      const resultTier1 = resolveLapAudio(driver, 1);
      expect(resultTier1).toBeDefined();
      expect(resultTier1!.config.url).toBe("personal_best.wav");
      expect(resultTier1!.isVoice).toBeFalse();
      expect(resultTier1!.priority).toBe("normal");

      const resultIsBestLap = resolveLapAudio(driver, 0, true);
      expect(resultIsBestLap).toBeDefined();
      expect(resultIsBestLap!.config.url).toBe("personal_best.wav");
      expect(resultIsBestLap!.isVoice).toBeFalse();
    });

    it("should resolve Tier 1 (Personal Best) TTS as verbal callout with normal priority", () => {
      const ttsDriver = {
        ...driver,
        bestLapAudio: { type: "tts", text: "{driver.name} best lap" },
      };
      const result = resolveLapAudio(ttsDriver, 1);
      expect(result).toBeDefined();
      expect(result!.config.text).toBe("{driver.name} best lap");
      expect(result!.isVoice).toBeTrue();
      expect(result!.priority).toBe("normal");
    });

    it("should handle fallback when higher tier audio is missing", () => {
      const partialDriver = {
        bestLapAudio: { type: "preset", url: "personal_best.wav" },
      };
      // When Tier 6 falls back to preset bestLapAudio, isVoice should be false (SFX)
      const result = resolveLapAudio(partialDriver, 6);
      expect(result).toBeDefined();
      expect(result!.config.url).toBe("personal_best.wav");
      expect(result!.isVoice).toBeFalse();
      expect(result!.priority).toBe("high");

      // When Tier 6 falls back to TTS bestLapAudio, isVoice should be true
      const partialTtsDriver = {
        bestLapAudio: { type: "tts", text: "Nice lap" },
      };
      const resultTts = resolveLapAudio(partialTtsDriver, 6);
      expect(resultTts).toBeDefined();
      expect(resultTts!.isVoice).toBeTrue();
      expect(resultTts!.priority).toBe("high");
    });
  });

  describe("dispatchLapAudio Utility", () => {
    let mockPlayer: {
      playCallout: jasmine.Spy;
      playSfx: jasmine.Spy;
    };

    beforeEach(() => {
      mockPlayer = {
        playCallout: jasmine.createSpy("playCallout").and.returnValue(true),
        playSfx: jasmine.createSpy("playSfx"),
      };
    });

    const driver = {
      name: "Racer",
      lapAudio: { type: "preset", url: "beep.wav" },
      bestLapAudio: { type: "preset", url: "personal_best.wav" },
      overallBestLapAudio: { type: "preset", url: "overall_best.wav" },
      newRaceLeaderAudio: { type: "preset", url: "leader.wav" },
    };

    it("should play milestone audio when callout succeeds without fallback", () => {
      mockPlayer.playCallout.and.returnValue(true);
      dispatchLapAudio(mockPlayer, driver, 6, true, false, false);

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        driver.overallBestLapAudio,
        "high",
        undefined,
      );
      expect(mockPlayer.playSfx).not.toHaveBeenCalled();
    });

    it("should fallback to personal best lap SFX if milestone callout is dropped by priority", () => {
      mockPlayer.playCallout.and.returnValue(false);
      dispatchLapAudio(mockPlayer, driver, 6, true, false, false);

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        driver.overallBestLapAudio,
        "high",
        undefined,
      );
      expect(mockPlayer.playSfx).toHaveBeenCalledWith("personal_best.wav");
    });

    it("should fallback to normal lap SFX if leader callout is dropped and isBestLap is false", () => {
      mockPlayer.playCallout.and.returnValue(false);
      dispatchLapAudio(mockPlayer, driver, 0, false, true, false);

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        driver.newRaceLeaderAudio,
        "high",
        undefined,
      );
      expect(mockPlayer.playSfx).toHaveBeenCalledWith("beep.wav");
    });

    it("should fallback to personal best lap SFX when milestone audio is configured as none", () => {
      const driverWithNone = {
        ...driver,
        overallBestLapAudio: { type: "none" },
      };
      dispatchLapAudio(mockPlayer, driverWithNone, 6, true, false, false);

      expect(mockPlayer.playCallout).not.toHaveBeenCalled();
      expect(mockPlayer.playSfx).toHaveBeenCalledWith("personal_best.wav");
    });

    it("should play heat leader audio when race leader is configured as none on a lap that triggered both", () => {
      const driverLeaderCascade = {
        ...driver,
        newRaceLeaderAudio: { type: "none" },
        newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
      };
      dispatchLapAudio(mockPlayer, driverLeaderCascade, 0, false, true, true);

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        driverLeaderCascade.newHeatLeaderAudio,
        "normal",
        undefined,
      );
      expect(mockPlayer.playSfx).not.toHaveBeenCalled();
    });

    it("should not play heat leader if race leader callout is dropped by priority and fallback to lap SFX", () => {
      mockPlayer.playCallout.and.returnValue(false);
      const driverBothLeaders = {
        ...driver,
        newRaceLeaderAudio: { type: "preset", url: "race_leader.wav" },
        newHeatLeaderAudio: { type: "preset", url: "heat_leader.wav" },
      };
      // Both leaders triggered, raceLeader is set (not none)
      dispatchLapAudio(mockPlayer, driverBothLeaders, 0, false, true, true);

      // playCallout called for race leader and returned false (dropped by priority/busy channel)
      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        driverBothLeaders.newRaceLeaderAudio,
        "high",
        undefined,
      );
      // It should NOT call playCallout for heat leader
      expect(mockPlayer.playCallout).not.toHaveBeenCalledWith(
        driverBothLeaders.newHeatLeaderAudio,
        jasmine.anything(),
        jasmine.anything(),
      );
      // It should fall back directly to routine lap SFX
      expect(mockPlayer.playSfx).toHaveBeenCalledWith("beep.wav");
    });

    it("should cascade from tier 6 to tier 4 when tier 6 and tier 5 are none", () => {
      const tieredDriver = {
        ...driver,
        overallBestLapAudio: { type: "none" },
        overallLaneBestLapAudio: { type: "none" },
        raceBestLapAudio: { type: "preset", url: "race_best.wav" },
      };
      dispatchLapAudio(mockPlayer, tieredDriver, 6, true, false, false);

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        tieredDriver.raceBestLapAudio,
        "high",
        undefined,
      );
      expect(mockPlayer.playSfx).not.toHaveBeenCalled();
    });

    it("should cascade down to race best when race leader and heat leader are configured as none", () => {
      const cascadeLeaderToBestDriver = {
        ...driver,
        newRaceLeaderAudio: { type: "none" },
        newHeatLeaderAudio: { type: "none" },
        raceBestLapAudio: { type: "preset", url: "race_best.wav" },
      };
      // Lap is tier 4 and triggered both leaders
      dispatchLapAudio(
        mockPlayer,
        cascadeLeaderToBestDriver,
        4,
        true,
        true,
        true,
      );

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        cascadeLeaderToBestDriver.raceBestLapAudio,
        "high",
        undefined,
      );
      expect(mockPlayer.playSfx).not.toHaveBeenCalled();
    });

    it("should not play any sound if fallback audio is configured as none", () => {
      const driverWithNoneFallback = {
        ...driver,
        overallBestLapAudio: { type: "none" },
        bestLapAudio: { type: "none" },
      };
      dispatchLapAudio(
        mockPlayer,
        driverWithNoneFallback,
        6,
        true,
        false,
        false,
      );

      expect(mockPlayer.playCallout).not.toHaveBeenCalled();
      expect(mockPlayer.playSfx).not.toHaveBeenCalled();
    });

    it("should play personal best lap preset directly as SFX for Tier 1 lap", () => {
      dispatchLapAudio(mockPlayer, driver, 1, true, false, false);

      expect(mockPlayer.playCallout).not.toHaveBeenCalled();
      expect(mockPlayer.playSfx).toHaveBeenCalledWith("personal_best.wav");
    });

    it("should play normal lap SFX for standard lap when not best lap", () => {
      dispatchLapAudio(mockPlayer, driver, 0, false, false, false);

      expect(mockPlayer.playCallout).not.toHaveBeenCalled();
      expect(mockPlayer.playSfx).toHaveBeenCalledWith("beep.wav");
    });

    it("should call playCallout with low priority if normal lapAudio is configured as TTS", () => {
      const ttsDriver = {
        ...driver,
        lapAudio: { type: "tts", text: "Lap recorded" },
      };
      dispatchLapAudio(mockPlayer, ttsDriver, 0, false, false, false);

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        ttsDriver.lapAudio,
        "low",
        undefined,
      );
      expect(mockPlayer.playSfx).not.toHaveBeenCalled();
    });

    it("should forward AudioAssociation to playCallout on milestone audio", () => {
      const association = {
        widgetType: "lane-view" as const,
        laneIndex: 2,
        driverId: "d2",
      };
      dispatchLapAudio(
        mockPlayer,
        driver,
        6,
        true,
        false,
        false,
        undefined,
        association,
      );

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        driver.overallBestLapAudio,
        "high",
        undefined,
        undefined,
        association,
      );
    });

    it("should forward AudioAssociation to playSfx on preset fallback", () => {
      const association = {
        widgetType: "lane-view" as const,
        laneIndex: 1,
        driverId: "d1",
      };
      dispatchLapAudio(
        mockPlayer,
        driver,
        0,
        false,
        false,
        false,
        undefined,
        association,
      );

      expect(mockPlayer.playSfx).toHaveBeenCalledWith("beep.wav", association);
    });

    it("should forward AudioAssociation to playCallout on TTS fallback", () => {
      const ttsDriver = {
        ...driver,
        lapAudio: { type: "tts", text: "Lap recorded" },
      };
      const association = {
        widgetType: "lane-view" as const,
        laneIndex: 3,
        driverId: "d3",
      };
      dispatchLapAudio(
        mockPlayer,
        ttsDriver,
        0,
        false,
        false,
        false,
        undefined,
        association,
      );

      expect(mockPlayer.playCallout).toHaveBeenCalledWith(
        ttsDriver.lapAudio,
        "low",
        undefined,
        undefined,
        association,
      );
    });
  });
});
