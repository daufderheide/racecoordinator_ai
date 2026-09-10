import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { DataService } from "@app/data.service";
import { AudioConfig } from "@app/models/driver";
import { Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

import { AudioService } from "./audio.service";

describe("AudioService", () => {
  let service: AudioService;
  let mockDataService: any;
  let mockSettingsService: any;
  let mockLogger: any;
  let mockSettings: Settings;

  let mockAudioInstance: any;
  let originalAudio: any;
  let originalSpeechSynthesis: any;
  let mockSpeechSynthesis: any;

  beforeEach(() => {
    mockSettings = Object.assign(new Settings(), {
      urgentQueueTtl: 5000,
      calloutSpacing: 500,
    });

    mockDataService = {
      serverUrl: "http://localhost:7070",
    };

    mockSettingsService = {
      getSettings: jasmine
        .createSpy("getSettings")
        .and.returnValue(mockSettings),
    };

    mockLogger = {
      debug: jasmine.createSpy("debug"),
      info: jasmine.createSpy("info"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
    };

    // Mock HTML5 Audio
    mockAudioInstance = {
      play: jasmine.createSpy("play").and.returnValue(Promise.resolve()),
      pause: jasmine.createSpy("pause"),
      currentTime: 0,
      onended: null as any,
      onerror: null as any,
    };
    originalAudio = window.Audio;
    (window as any).Audio = jasmine
      .createSpy("Audio")
      .and.returnValue(mockAudioInstance);

    // Mock SpeechSynthesis
    mockSpeechSynthesis = {
      speak: jasmine.createSpy("speak"),
      cancel: jasmine.createSpy("cancel"),
    };
    originalSpeechSynthesis = window.speechSynthesis;
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSpeechSynthesis,
      configurable: true,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        AudioService,
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    service = TestBed.inject(AudioService);
  });

  afterEach(() => {
    service.reset();
    (window as any).Audio = originalAudio;
    Object.defineProperty(window, "speechSynthesis", {
      value: originalSpeechSynthesis,
      configurable: true,
      writable: true,
    });
  });

  describe("isVoiceCallout", () => {
    it("should return false if config is undefined or type is none", () => {
      expect(service.isVoiceCallout("audio.yellowflag", undefined)).toBeFalse();
      expect(
        service.isVoiceCallout("audio.yellowflag", { type: "none" }),
      ).toBeFalse();
    });

    it("should return true for any config of type tts", () => {
      const ttsLap: AudioConfig = { type: "tts", text: "{driver.nickname}" };
      expect(service.isVoiceCallout("driver.lapAudio", ttsLap)).toBeTrue();
      expect(service.isVoiceCallout("random_slot", ttsLap)).toBeTrue();
    });

    it("should return true for verbal announcement slots regardless of preset/tts", () => {
      const presetConfig: AudioConfig = { type: "preset", url: "yellow.wav" };
      expect(
        service.isVoiceCallout("audio.yellowflag", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("audio.seconds_left", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("audio.seconds_left.halfway", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("audio.heat_over", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("audio.race_over", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.penaltyAudio", presetConfig),
      ).toBeTrue();
    });

    it("should return false for preset action and effect slots", () => {
      const presetLap: AudioConfig = { type: "preset", url: "default_beep" };
      expect(service.isVoiceCallout("driver.lapAudio", presetLap)).toBeFalse();
      expect(service.isVoiceCallout("audio.countdown", presetLap)).toBeFalse();
      expect(
        service.isVoiceCallout("audio.min_lap_time", presetLap),
      ).toBeFalse();
      expect(service.isVoiceCallout("audio.drift_lap", presetLap)).toBeFalse();
    });
  });

  describe("playSfx", () => {
    it("should do nothing if url is empty or undefined", () => {
      service.playSfx("");
      service.playSfx(undefined);
      expect((window as any).Audio).not.toHaveBeenCalled();
    });

    it("should play audio immediately and polyphonically without setting activeVoice", () => {
      service.playSfx("default_beep");
      expect((window as any).Audio).toHaveBeenCalledWith(
        "http://localhost:7070/assets/default_beep_Lap_Beep",
      );
      expect(mockAudioInstance.play).toHaveBeenCalled();
      expect(service.getActiveVoice()).toBeNull();
    });
  });

  describe("playCallout - Play, Preempt, or Drop", () => {
    it("should play immediately when channel is idle", () => {
      const config: AudioConfig = { type: "preset", url: "w_heat_half.wav" };
      service.playCallout(config, "high");

      expect(service.getActiveVoice()).not.toBeNull();
      expect(service.getActiveVoice()?.priority).toBe("high");
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should drop incoming callout if channel is busy with equal or higher priority", () => {
      const highConfig: AudioConfig = { type: "preset", url: "halfway.wav" };
      service.playCallout(highConfig, "high");
      expect(service.getActiveVoice()?.priority).toBe("high");

      // Attempt lower priority
      const normalConfig: AudioConfig = { type: "preset", url: "30sec.wav" };
      service.playCallout(normalConfig, "normal");
      expect(service.getActiveVoice()?.priority).toBe("high");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Dropping callout due to equal or higher active priority",
      );

      // Attempt equal priority
      const anotherHigh: AudioConfig = { type: "preset", url: "penalty.wav" };
      service.playCallout(anotherHigh, "high");
      expect(service.getActiveVoice()?.priority).toBe("high");
      expect(service.getUrgentQueue().length).toBe(0);
    });

    it("should preempt active callout if incoming callout has higher priority", () => {
      const lowConfig: AudioConfig = { type: "tts", text: "Lap time 5.0" };
      service.playCallout(lowConfig, "low");
      expect(service.getActiveVoice()?.priority).toBe("low");

      const highConfig: AudioConfig = { type: "preset", url: "halfway.wav" };
      service.playCallout(highConfig, "high");

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(service.getActiveVoice()?.priority).toBe("high");
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should preempt non-urgent sound immediately when URGENT callout arrives", () => {
      const highConfig: AudioConfig = { type: "preset", url: "halfway.wav" };
      service.playCallout(highConfig, "high");
      expect(service.getActiveVoice()?.priority).toBe("high");

      const urgentConfig: AudioConfig = {
        type: "preset",
        url: "yellowflag.wav",
      };
      service.playCallout(urgentConfig, "urgent");

      expect(mockAudioInstance.pause).toHaveBeenCalled();
      expect(service.getActiveVoice()?.priority).toBe("urgent");
      expect(service.getUrgentQueue().length).toBe(0);
    });

    it("should queue URGENT callout when another URGENT callout is actively playing", () => {
      const urgent1: AudioConfig = { type: "preset", url: "yellowflag.wav" };
      service.playCallout(urgent1, "urgent");
      expect(service.getActiveVoice()?.priority).toBe("urgent");

      const urgent2: AudioConfig = { type: "preset", url: "heatover.wav" };
      service.playCallout(urgent2, "urgent");

      expect(service.getUrgentQueue().length).toBe(1);
      expect(service.getUrgentQueue()[0].config.url).toBe("heatover.wav");
    });

    it("should play queued URGENT callout as soon as active URGENT callout finishes", fakeAsync(() => {
      const urgent1: AudioConfig = { type: "preset", url: "yellowflag.wav" };
      const urgent2: AudioConfig = { type: "preset", url: "heatover.wav" };

      service.playCallout(urgent1, "urgent");
      service.playCallout(urgent2, "urgent");
      expect(service.getUrgentQueue().length).toBe(1);

      // Simulate urgent1 ending
      mockAudioInstance.onended();
      expect(service.getActiveVoice()?.priority).toBe("urgent");
      expect(service.getUrgentQueue().length).toBe(0);
    }));

    it("should prune expired items from urgentQueue based on urgentQueueTtl", fakeAsync(() => {
      const urgent1: AudioConfig = { type: "preset", url: "yellowflag.wav" };
      const urgent2: AudioConfig = { type: "preset", url: "heatover.wav" };

      service.playCallout(urgent1, "urgent");
      service.playCallout(urgent2, "urgent");
      expect(service.getUrgentQueue().length).toBe(1);

      // Advance time beyond urgentQueueTtl (5000ms)
      tick(6000);

      // Finish urgent1
      mockAudioInstance.onended();
      // urgent2 was expired, so it should have been pruned
      expect(service.getUrgentQueue().length).toBe(0);
      expect(service.getActiveVoice()).toBeNull();
    }));
  });

  describe("Cadence Spacing (Option B)", () => {
    it("should enter cadence cooldown after a voice callout finishes", fakeAsync(() => {
      const config: AudioConfig = { type: "preset", url: "halfway.wav" };
      service.playCallout(config, "high");

      mockAudioInstance.onended();
      expect(service.getActiveVoice()).toBeNull();
      expect(service.isCoolingDown()).toBeTrue();

      // Advance past calloutSpacing (500ms)
      tick(500);
      expect(service.isCoolingDown()).toBeFalse();
    }));

    it("should drop non-urgent callout during cadence cooldown", fakeAsync(() => {
      const config: AudioConfig = { type: "preset", url: "halfway.wav" };
      service.playCallout(config, "high");
      mockAudioInstance.onended();

      expect(service.isCoolingDown()).toBeTrue();

      const incoming: AudioConfig = { type: "preset", url: "30sec.wav" };
      service.playCallout(incoming, "normal");

      expect(service.getActiveVoice()).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Dropping non-urgent callout during cadence pause",
      );

      tick(500);
      expect(service.isCoolingDown()).toBeFalse();
    }));

    it("should allow URGENT callout to break through cadence cooldown immediately", fakeAsync(() => {
      const config: AudioConfig = { type: "preset", url: "halfway.wav" };
      service.playCallout(config, "high");
      mockAudioInstance.onended();

      expect(service.isCoolingDown()).toBeTrue();

      const urgent: AudioConfig = { type: "preset", url: "yellowflag.wav" };
      service.playCallout(urgent, "urgent");

      expect(service.isCoolingDown()).toBeFalse();
      expect(service.getActiveVoice()?.priority).toBe("urgent");
    }));
  });

  describe("TTS Speech Callouts", () => {
    it("should interpolate context and speak utterance", () => {
      const config: AudioConfig = {
        type: "tts",
        text: "Driver {driver.nickname} lap {driver.lapCount}",
      };
      const context = {
        driver: { nickname: "Speedy", lapCount: 12 },
      };

      service.playCallout(config, "low", context);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const calledUtterance =
        mockSpeechSynthesis.speak.calls.mostRecent().args[0];
      expect(calledUtterance.text).toBe("Driver Speedy lap 12");
      expect(service.getActiveVoice()?.priority).toBe("low");
    });
  });

  describe("stopVoice and reset", () => {
    it("should stop active voice and clear queue on reset", () => {
      const urgent1: AudioConfig = { type: "preset", url: "yellow.wav" };
      const urgent2: AudioConfig = { type: "preset", url: "heatover.wav" };
      service.playCallout(urgent1, "urgent");
      service.playCallout(urgent2, "urgent");

      expect(service.getActiveVoice()).not.toBeNull();
      expect(service.getUrgentQueue().length).toBe(1);

      service.reset();
      expect(mockAudioInstance.pause).toHaveBeenCalled();
      expect(service.getActiveVoice()).toBeNull();
      expect(service.getUrgentQueue().length).toBe(0);
      expect(service.isCoolingDown()).toBeFalse();
    });
  });
});
