import {
  createTTSContext,
  interpolate,
  mockTTSContext,
  playSound,
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
});
