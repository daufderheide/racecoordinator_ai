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

  beforeAll(() => {
    // Mock SpeechSynthesisUtterance if it doesn't exist (e.g. in some text environments)
    if (!window.SpeechSynthesisUtterance) {
      (window as any).SpeechSynthesisUtterance = class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      };
    }
  });

  afterAll(() => {
    // Cleanup if needed
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
    ]);
    // Use Object.defineProperty to overwrite read-only property if necessary,
    // or just direct assignment if allowed in the test env.
    // Usually safer to use defineProperty for window properties.
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
  });

  describe("TTS Helpers", () => {
    it("should create a valid TTS context", () => {
      const driver = { name: "Alice", nickname: "Ali" };
      const data = {
        lastLapTime: 1.1,
        bestLapTime: 1.0,
        averageLapTime: 1.2,
        lapCount: 5,
      };
      const context = createTTSContext(driver, data);

      expect(context.driver.name).toBe("Alice");
      expect(context.driver.nickname).toBe("Ali");
      expect(context.driver.lastLapTime).toBe(1.1);
      expect(context.driver.lapCount).toBe(5);
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

    it("should create a mock context", () => {
      const context = mockTTSContext();
      expect(context.driver.name).toBeDefined();
      expect(context.driver.lastLapTime).toBeGreaterThan(0);
    });
  });

  describe("interpolate Utility", () => {
    it("should interpolate simple paths", () => {
      const text = "Hello {name}";
      const data = { name: "World" };
      expect(interpolate(text, data)).toBe("Hello World");
    });

    it("should interpolate double curly braces paths", () => {
      const text = "Min lap time for {{driver.nickname}}";
      const data = { driver: { nickname: "Speedy" } };
      expect(interpolate(text, data)).toBe("Min lap time for Speedy");
    });

    it("should handle whitespace inside braces", () => {
      const text = "Driver {{ driver.nickname }} on lap { driver.lapCount }";
      const data = { driver: { nickname: "Speedy", lapCount: 5 } };
      expect(interpolate(text, data)).toBe("Driver Speedy on lap 5");
    });

    it("should interpolate nested paths", () => {
      const text = "{driver.name} has {stats.laps} laps";
      const data = {
        driver: { name: "Alice" },
        stats: { laps: 10 },
      };
      expect(interpolate(text, data)).toBe("Alice has 10 laps");
    });

    it("should handle case-insensitivity with double braces", () => {
      const text = "{{DRIVER.NICKNAME}}";
      const data = { driver: { nickname: "Bob" } };
      expect(interpolate(text, data)).toBe("Bob");
    });

    it("should handle case-insensitivity", () => {
      const text = "{DRIVER.NAME}";
      const data = { driver: { name: "Bob" } };
      expect(interpolate(text, data)).toBe("Bob");
    });

    it("should format numbers to 3 decimal places", () => {
      const text = "Value: {val}";
      const data = { val: 1.2345678 };
      expect(interpolate(text, data)).toBe("Value: 1.235");
    });

    it("should leave placeholders if value not found", () => {
      const text = "Keep {missing} and {{other_missing}}";
      const data = {};
      expect(interpolate(text, data)).toBe(
        "Keep {missing} and {{other_missing}}",
      );
    });

    it("should leave placeholders if object resolved rather than primitive", () => {
      const text = "Driver: {driver}";
      const data = { driver: { name: "Alice" } };
      expect(interpolate(text, data)).toBe("Driver: {driver}");
    });

    it("should handle empty or null text and data safely", () => {
      expect(interpolate("", {})).toBe("");
      expect(interpolate("Hello", null)).toBe("Hello");
      expect(interpolate("Hello", undefined)).toBe("Hello");
    });
  });
});
