import { Settings } from "@app/models/settings";
import { AudioVoiceManager } from "@app/utils/audio-voice-manager";

describe("AudioVoiceManager", () => {
  let manager: AudioVoiceManager;

  beforeEach(() => {
    manager = new AudioVoiceManager();
  });

  describe("getVoices and initVoices", () => {
    it("should return empty array if no speechSynthesis voices available", () => {
      const voices = manager.getVoices();
      expect(Array.isArray(voices)).toBeTrue();
    });

    it("should safely initialize without throwing even if speechSynthesis is mocked or missing", () => {
      expect(() => manager.initVoices()).not.toThrow();
    });
  });

  describe("applyTtsSettingsToUtterance", () => {
    it("should set rate, pitch, and combined volume on utterance from settings", () => {
      const utterance = new SpeechSynthesisUtterance("Test speech");
      const settings: Settings = {
        ttsRate: 1.5,
        ttsPitch: 1.2,
        ttsVolume: 80,
        masterVolume: 50,
      } as Settings;

      manager.applyTtsSettingsToUtterance(utterance, settings);

      expect(utterance.rate).toBeCloseTo(1.5, 2);
      expect(utterance.pitch).toBeCloseTo(1.2, 2);
      // masterVol (0.5) * ttsVol (0.8) = 0.4
      expect(utterance.volume).toBeCloseTo(0.4, 2);
      expect(utterance.lang).toBe("en-US");
    });

    it("should apply overrides when provided", () => {
      const utterance = new SpeechSynthesisUtterance("Test speech");
      const settings: Settings = {
        ttsRate: 1.0,
        ttsPitch: 1.0,
        ttsVolume: 100,
        masterVolume: 100,
      } as Settings;

      manager.applyTtsSettingsToUtterance(
        utterance,
        settings,
        undefined, // voice override
        2.0, // rate override
        0.5, // pitch override
        50, // volume override
        50, // masterVolume override
      );

      expect(utterance.rate).toBeCloseTo(2.0, 2);
      expect(utterance.pitch).toBeCloseTo(0.5, 2);
      // masterVol (0.5) * ttsVol (0.5) = 0.25
      expect(utterance.volume).toBeCloseTo(0.25, 2);
    });

    it("should clamp rate and pitch to allowed bounds", () => {
      const utterance = new SpeechSynthesisUtterance("Clamping test");
      const settings: Settings = {} as Settings;

      manager.applyTtsSettingsToUtterance(
        utterance,
        settings,
        undefined,
        15.0, // rate > 10
        -1.0, // pitch < 0
      );

      expect(utterance.rate).toBe(10);
      expect(utterance.pitch).toBe(0);
    });

    it("should match voice if matching voice name exists", () => {
      const mockVoice = {
        name: "Samantha",
        lang: "en-US",
        default: false,
        localService: true,
        voiceURI: "samantha",
      } as SpeechSynthesisVoice;

      spyOn(manager, "getVoices").and.returnValue([mockVoice]);

      const utterance = {
        voice: null,
        lang: "",
        rate: 1,
        pitch: 1,
        volume: 1,
      } as unknown as SpeechSynthesisUtterance;
      const settings: Settings = {
        ttsVoice: "Samantha",
      } as Settings;

      manager.applyTtsSettingsToUtterance(utterance, settings);

      expect(utterance.voice).toBe(mockVoice);
      expect(utterance.lang).toBe("en-US");
    });

    it("should match voice by language code when ttsVoice is not set", () => {
      const mockVoiceEs = {
        name: "Monica",
        lang: "es-ES",
        default: false,
        localService: true,
        voiceURI: "monica",
      } as SpeechSynthesisVoice;

      spyOn(manager, "getVoices").and.returnValue([mockVoiceEs]);

      const utterance = {
        voice: null,
        lang: "",
        rate: 1,
        pitch: 1,
        volume: 1,
      } as unknown as SpeechSynthesisUtterance;
      const settings: Settings = {
        language: "es",
      } as Settings;

      manager.applyTtsSettingsToUtterance(utterance, settings);

      expect(utterance.voice).toBe(mockVoiceEs);
      expect(utterance.lang).toBe("es-ES");
    });
  });
});
