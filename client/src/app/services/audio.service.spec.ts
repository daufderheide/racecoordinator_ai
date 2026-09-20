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
  let originalSpeechSynthesisUtterance: any;
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
    const mockVoice = {
      name: "Alex",
      voiceURI: "Alex",
      lang: "en-US",
      default: true,
      localService: true,
    };
    mockSpeechSynthesis = {
      speak: jasmine.createSpy("speak"),
      cancel: jasmine.createSpy("cancel"),
      getVoices: jasmine.createSpy("getVoices").and.returnValue([mockVoice]),
    };
    originalSpeechSynthesis = window.speechSynthesis;
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSpeechSynthesis,
      configurable: true,
      writable: true,
    });

    originalSpeechSynthesisUtterance = (window as any).SpeechSynthesisUtterance;
    (window as any).SpeechSynthesisUtterance =
      class MockSpeechSynthesisUtterance {
        text: string;
        voice: any = null;
        rate = 1;
        pitch = 1;
        volume = 1;
        onend: any = null;
        onerror: any = null;
        constructor(text?: string) {
          this.text = text || "";
        }
      };

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
    (window as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
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
        service.isVoiceCallout("audio.min_lap_time", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("audio.drift_lap", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.penaltyAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.falseStartAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.overallBestLapAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.overallLaneBestLapAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.raceBestLapAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.raceLaneBestLapAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.heatBestLapAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.newRaceLeaderAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.newHeatLeaderAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.pitInAudio", presetConfig),
      ).toBeTrue();
      expect(
        service.isVoiceCallout("driver.fuelAudio", presetConfig),
      ).toBeTrue();
    });

    it("should return false for preset action and effect slots", () => {
      const presetLap: AudioConfig = { type: "preset", url: "default_beep" };
      expect(service.isVoiceCallout("driver.lapAudio", presetLap)).toBeFalse();
      expect(
        service.isVoiceCallout("driver.bestLapAudio", presetLap),
      ).toBeFalse();
      expect(service.isVoiceCallout("audio.countdown", presetLap)).toBeFalse();
    });
  });

  describe("playSfx", () => {
    it("should do nothing if url is empty or undefined", () => {
      service.playSfx("");
      service.playSfx(undefined);
      expect((window as any).Audio).not.toHaveBeenCalled();
    });

    it("should play audio immediately and polyphonically without setting activeVoice", () => {
      mockSettings.masterVolume = 75;
      service.playSfx("default_beep");
      expect((window as any).Audio).toHaveBeenCalledWith(
        "http://localhost:7070/assets/default_beep_Lap_Beep",
      );
      expect(mockAudioInstance.volume).toBe(0.75);
      expect(mockAudioInstance.play).toHaveBeenCalled();
      expect(service.getActiveVoice()).toBeNull();
    });
  });

  describe("playCallout - Play, Preempt, or Drop", () => {
    it("should play immediately when channel is idle", () => {
      const config: AudioConfig = { type: "preset", url: "w_heat_half.wav" };
      const played = service.playCallout(config, "high");

      expect(played).toBeTrue();
      expect(service.getActiveVoice()).not.toBeNull();
      expect(service.getActiveVoice()?.priority).toBe("high");
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should return false for none or undefined config", () => {
      expect(service.playCallout({ type: "none" }, "high")).toBeFalse();
      expect(service.playCallout(undefined, "high")).toBeFalse();
      expect(
        service.playCallout({ type: "preset", url: "" }, "high"),
      ).toBeFalse();
      expect(
        service.playCallout({ type: "tts", text: "" }, "high"),
      ).toBeFalse();
    });

    it("should drop incoming callout if channel is busy with equal or higher priority", () => {
      const highConfig: AudioConfig = { type: "preset", url: "halfway.wav" };
      expect(service.playCallout(highConfig, "high")).toBeTrue();
      expect(service.getActiveVoice()?.priority).toBe("high");

      // Attempt lower priority
      const normalConfig: AudioConfig = { type: "preset", url: "30sec.wav" };
      expect(service.playCallout(normalConfig, "normal")).toBeFalse();
      expect(service.getActiveVoice()?.priority).toBe("high");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Dropping callout due to equal or higher active priority",
      );

      // Attempt equal priority
      const anotherHigh: AudioConfig = { type: "preset", url: "penalty.wav" };
      expect(service.playCallout(anotherHigh, "high")).toBeFalse();
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

    it("should apply configured TTS settings to utterance", () => {
      mockSettings.ttsVoice = "Alex";
      mockSettings.ttsRate = 1.5;
      mockSettings.ttsPitch = 0.8;
      mockSettings.ttsVolume = 80;

      const config: AudioConfig = {
        type: "tts",
        text: "Green flag",
      };

      service.playCallout(config, "normal");

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const calledUtterance =
        mockSpeechSynthesis.speak.calls.mostRecent().args[0];
      expect(calledUtterance.text).toBe("Green flag");
      expect(calledUtterance.rate).toBe(1.5);
      expect(calledUtterance.pitch).toBe(0.8);
      expect(calledUtterance.volume).toBe(0.8);
      expect(calledUtterance.voice).toBeDefined();
      expect(calledUtterance.voice?.name).toBe("Alex");
    });

    it("should preview TTS with specified parameters", () => {
      service.previewTTS("Test message", "Alex", 1.25, 1.2, 50);

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const calledUtterance =
        mockSpeechSynthesis.speak.calls.mostRecent().args[0];
      expect(calledUtterance.text).toBe("Test message");
      expect(calledUtterance.rate).toBe(1.25);
      expect(calledUtterance.pitch).toBe(1.2);
      expect(calledUtterance.volume).toBe(0.5);
      expect(calledUtterance.voice).toBeDefined();
      expect(calledUtterance.voice?.name).toBe("Alex");
    });

    it("should scale TTS utterance volume by masterVolume and ttsVolume", () => {
      service.previewTTS("Test message", "Alex", 1.0, 1.0, 50, 80);

      const calledUtterance =
        mockSpeechSynthesis.speak.calls.mostRecent().args[0];
      expect(calledUtterance.volume).toBeCloseTo(0.4, 2);
    });

    it("should return masterVolume setting and respect override", () => {
      mockSettings.masterVolume = 75;
      expect(service.getMasterVolume()).toBe(75);
      expect(service.getMasterVolume(40)).toBe(40);
    });

    it("should match voices by voiceURI or case-insensitively", () => {
      const mockVoice1 = {
        name: "Google US English",
        voiceURI: "google-us",
      } as any;
      mockSpeechSynthesis.getVoices.and.returnValue([mockVoice1]);
      (service as any).cachedVoices = [mockVoice1];

      const utterance = new SpeechSynthesisUtterance("Hello");
      service.applyTtsSettingsToUtterance(utterance, "google-us");
      expect(utterance.voice).toBe(mockVoice1);

      const utterance2 = new SpeechSynthesisUtterance("Hello");
      service.applyTtsSettingsToUtterance(utterance2, "google us english");
      expect(utterance2.voice).toBe(mockVoice1);
    });

    it("should resume speech synthesis if paused before speaking", () => {
      mockSpeechSynthesis.paused = true;
      mockSpeechSynthesis.resume = jasmine.createSpy("resume");

      service.previewTTS("Test message");
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it("should return cached voices from getVoices when speechSynthesis has no voices", () => {
      mockSpeechSynthesis.getVoices.and.returnValue([]);
      const voices = [{ name: "Samantha", voiceURI: "samantha" }] as any[];
      (service as any).cachedVoices = voices;

      const result = service.getVoices();
      expect(result).toEqual(voices);
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

    it("should pause and clear activeAudioElement on stopVoice()", () => {
      const urgent: AudioConfig = { type: "preset", url: "yellow.wav" };
      service.playCallout(urgent, "urgent");
      expect((service as any).activeAudioElement).toBe(mockAudioInstance);

      service.stopVoice();
      expect(mockAudioInstance.pause).toHaveBeenCalled();
      expect((service as any).activeAudioElement).toBeNull();
      expect(service.getActiveVoice()).toBeNull();
    });

    it("should cancel activeUtterance and speech synthesis on stopVoice()", () => {
      const tts: AudioConfig = { type: "tts", text: "Caution on track" };
      service.playCallout(tts, "urgent");
      expect((service as any).activeUtterance).not.toBeNull();

      service.stopVoice();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect((service as any).activeUtterance).toBeNull();
      expect(service.getActiveVoice()).toBeNull();
    });

    it("should release activeVoice when dynamic watchdog trips on stalled audio", fakeAsync(() => {
      const urgent: AudioConfig = { type: "preset", url: "yellow.wav" };
      service.playCallout(urgent, "urgent");
      expect(service.getActiveVoice()).not.toBeNull();

      mockAudioInstance.duration = 2.0;
      if (mockAudioInstance.onloadedmetadata) {
        mockAudioInstance.onloadedmetadata();
      }

      // Fast forward past dynamic watchdog (2.0 * 1000 + 1500 = 3500ms)
      tick(4000);

      expect(service.getActiveVoice()).toBeNull();
      expect((service as any).activeAudioElement).toBeNull();
    }));
  });

  describe("Relevance Filtering and Page Scoping", () => {
    it("should allow all sounds when relevanceFilter is null", () => {
      service.setRelevanceFilter(null);
      expect(service.isSoundRelevant({ widgetType: "countdown" })).toBeTrue();
      expect(service.isSoundRelevant({ widgetType: "timer" })).toBeTrue();
      expect(service.isSoundRelevant({ widgetType: "flag" })).toBeTrue();
      expect(service.isSoundRelevant({ widgetType: "race-state" })).toBeTrue();
      expect(
        service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 1,
          driverId: "d1",
        }),
      ).toBeTrue();
      expect(service.isSoundRelevant()).toBeTrue();
    });

    it("should correctly filter countdown audio", () => {
      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowCountdown: false,
      });
      expect(service.isSoundRelevant({ widgetType: "countdown" })).toBeFalse();

      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowCountdown: true,
      });
      expect(service.isSoundRelevant({ widgetType: "countdown" })).toBeTrue();
    });

    it("should correctly filter timer audio", () => {
      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowTimer: false,
      });
      expect(service.isSoundRelevant({ widgetType: "timer" })).toBeFalse();

      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowTimer: true,
      });
      expect(service.isSoundRelevant({ widgetType: "timer" })).toBeTrue();
    });

    it("should correctly filter race state audio", () => {
      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowRaceState: false,
      });
      expect(service.isSoundRelevant({ widgetType: "flag" })).toBeFalse();
      expect(service.isSoundRelevant({ widgetType: "race-state" })).toBeFalse();

      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowRaceState: true,
      });
      expect(service.isSoundRelevant({ widgetType: "flag" })).toBeTrue();
      expect(service.isSoundRelevant({ widgetType: "race-state" })).toBeTrue();
    });

    it("should correctly filter driver audio in mode 'none'", () => {
      service.setRelevanceFilter({
        driverAudioMode: "none",
        allowCountdown: true,
        allowTimer: true,
        allowRaceState: true,
      });
      expect(
        service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 0,
          driverId: "d1",
        }),
      ).toBeFalse();
      expect(service.isSoundRelevant({ laneIndex: 0 })).toBeFalse();
      expect(service.isSoundRelevant({ driverId: "d1" })).toBeFalse();
    });

    it("should correctly filter driver audio in mode 'scoped'", () => {
      service.setRelevanceFilter({
        driverAudioMode: "scoped",
        allowedLanes: new Set([1]),
        allowedDriverIds: new Set(["driver-123"]),
      });

      // Allowed lane
      expect(
        service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 1,
          driverId: "other",
        }),
      ).toBeTrue();

      // Allowed driver
      expect(
        service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 2,
          driverId: "driver-123",
        }),
      ).toBeTrue();

      // Disallowed lane and driver
      expect(
        service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 0,
          driverId: "driver-999",
        }),
      ).toBeFalse();
    });

    it("should drop playSfx early when sound is not relevant", () => {
      service.setRelevanceFilter({
        driverAudioMode: "all",
        allowCountdown: false,
      });

      const result = service.playSfx("beep.wav", { widgetType: "countdown" });
      expect(result).toBeUndefined();
      expect((window as any).Audio).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Dropping SFX: not relevant to current UI page",
        { widgetType: "countdown" },
      );
    });

    it("should drop playCallout early when sound is not relevant", () => {
      service.setRelevanceFilter({
        driverAudioMode: "scoped",
        allowedLanes: new Set([0]),
      });

      const config: AudioConfig = { type: "preset", url: "lap.wav" };
      const result = service.playCallout(config, "high", undefined, undefined, {
        widgetType: "lane-view",
        laneIndex: 1,
      });

      expect(result).toBeFalse();
      expect(service.getActiveVoice()).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Dropping callout: not relevant to current UI page",
        { widgetType: "lane-view", laneIndex: 1 },
      );
    });

    it("should support independent isolated instances for per-page audio engines", () => {
      const page1Service = new AudioService(
        mockDataService,
        mockSettingsService,
        mockLogger,
      );
      const page2Service = new AudioService(
        mockDataService,
        mockSettingsService,
        mockLogger,
      );

      page1Service.setRelevanceFilter({
        driverAudioMode: "scoped",
        allowedLanes: new Set([0]),
      });
      page2Service.setRelevanceFilter({
        driverAudioMode: "scoped",
        allowedLanes: new Set([1]),
      });

      // Page 1 plays lane 0, drops lane 1
      expect(
        page1Service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 0,
        }),
      ).toBeTrue();
      expect(
        page1Service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 1,
        }),
      ).toBeFalse();

      // Page 2 plays lane 1, drops lane 0
      expect(
        page2Service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 1,
        }),
      ).toBeTrue();
      expect(
        page2Service.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 0,
        }),
      ).toBeFalse();

      page1Service.ngOnDestroy();
      page2Service.ngOnDestroy();
    });
  });

  describe("Sequential Callout Queueing", () => {
    it("should play immediately if channel is idle and not cooling down", () => {
      const config: AudioConfig = { type: "preset", url: "callout1.wav" };
      const res = service.queueCallout(config, "normal");
      expect(res).toBeTrue();
      expect(service.getActiveVoice()).not.toBeNull();
      expect(service.getCalloutQueue().length).toBe(0);
    });

    it("should enqueue callout when channel is actively speaking", () => {
      const callout1: AudioConfig = { type: "preset", url: "callout1.wav" };
      const callout2: AudioConfig = { type: "preset", url: "callout2.wav" };

      service.playCallout(callout1, "normal");
      const res = service.queueCallout(callout2, "normal");

      expect(res).toBeTrue();
      expect(service.getCalloutQueue().length).toBe(1);
      expect(service.getCalloutQueue()[0].config.url).toBe("callout2.wav");
    });

    it("should play queued callout after active callout ends and cadence spacing cooldown completes", fakeAsync(() => {
      const callout1: AudioConfig = { type: "preset", url: "callout1.wav" };
      const callout2: AudioConfig = { type: "preset", url: "callout2.wav" };

      service.playCallout(callout1, "normal");
      service.queueCallout(callout2, "normal");
      expect(service.getCalloutQueue().length).toBe(1);

      // Finish callout1
      mockAudioInstance.onended();
      expect(service.isCoolingDown()).toBeTrue();
      expect(service.getActiveVoice()).toBeNull();

      // Cadence pause completes (default 500ms)
      tick(500);
      expect(service.isCoolingDown()).toBeFalse();
      expect(service.getActiveVoice()).not.toBeNull();
      expect(service.getCalloutQueue().length).toBe(0);

      // Finish callout2
      mockAudioInstance.onended();
      tick(500);
      expect(service.getActiveVoice()).toBeNull();
    }));

    it("should clear calloutQueue on stopVoice and reset", () => {
      const callout1: AudioConfig = { type: "preset", url: "callout1.wav" };
      const callout2: AudioConfig = { type: "preset", url: "callout2.wav" };

      service.playCallout(callout1, "normal");
      service.queueCallout(callout2, "normal");
      expect(service.getCalloutQueue().length).toBe(1);

      service.stopVoice();
      expect(service.getCalloutQueue().length).toBe(0);

      service.playCallout(callout1, "normal");
      service.queueCallout(callout2, "normal");
      expect(service.getCalloutQueue().length).toBe(1);

      service.reset();
      expect(service.getCalloutQueue().length).toBe(0);
    });
  });
});
