import { AudioAssociation, CalloutQueueItem } from "@app/models/audio";
import { AudioConfig } from "@app/models/driver";

import {
  describeAudioConfig,
  findQueuedCalloutIndex,
  getOrCreateCachedAudio,
  setupAudioWatchdog,
  sortCalloutQueue,
} from "./audio-callout-helper";

describe("audio-callout-helper", () => {
  describe("describeAudioConfig", () => {
    it("should return 'undefined' for missing config", () => {
      expect(describeAudioConfig(undefined)).toBe("undefined");
    });

    it("should describe TTS config with text", () => {
      const config: AudioConfig = { type: "tts", text: "Fastest lap" };
      expect(describeAudioConfig(config)).toBe('TTS("Fastest lap")');
    });

    it("should describe preset config with resolvedUrl", () => {
      const config: AudioConfig = { type: "preset", url: "beep.wav" };
      expect(describeAudioConfig(config, "/assets/beep.wav")).toBe(
        'Preset("/assets/beep.wav")',
      );
    });

    it("should describe preset config with url when resolvedUrl is omitted", () => {
      const config: AudioConfig = { type: "preset", url: "beep.wav" };
      expect(describeAudioConfig(config)).toBe('Preset("beep.wav")');
    });
  });

  describe("getOrCreateCachedAudio", () => {
    it("should create and store new audio when not cached", () => {
      const map = new Map<string, HTMLAudioElement>();
      const audio = getOrCreateCachedAudio(map, "test.mp3");
      expect(audio).toBeTruthy();
      expect(map.get("test.mp3")).toBe(audio);
    });

    it("should reuse cached audio when paused", () => {
      const map = new Map<string, HTMLAudioElement>();
      const audio = new Audio("test.mp3");
      map.set("test.mp3", audio);

      const retrieved = getOrCreateCachedAudio(map, "test.mp3");
      expect(retrieved).toBe(audio);
    });
  });

  describe("findQueuedCalloutIndex", () => {
    const queue: CalloutQueueItem[] = [
      {
        config: { type: "tts" },
        priority: "normal",
        enqueuedAt: 100,
        association: { laneIndex: 0, driverId: "d1" },
      },
      {
        config: { type: "tts" },
        priority: "high",
        enqueuedAt: 200,
        association: { laneIndex: 1, driverId: "d2" },
      },
      {
        config: { type: "tts" },
        priority: "low",
        enqueuedAt: 300,
        association: { widgetType: "timer" },
      },
      {
        config: { type: "tts" },
        priority: "urgent",
        enqueuedAt: 400,
        association: { widgetType: "countdown" },
      },
    ];

    it("should find item by laneIndex", () => {
      const assoc: AudioAssociation = { laneIndex: 1 };
      expect(findQueuedCalloutIndex(queue, assoc)).toBe(1);
    });

    it("should find item by driverId", () => {
      const assoc: AudioAssociation = { driverId: "d1" };
      expect(findQueuedCalloutIndex(queue, assoc)).toBe(0);
    });

    it("should find item by widgetType timer", () => {
      const assoc: AudioAssociation = { widgetType: "timer" };
      expect(findQueuedCalloutIndex(queue, assoc)).toBe(2);
    });

    it("should find item by widgetType countdown", () => {
      const assoc: AudioAssociation = { widgetType: "countdown" };
      expect(findQueuedCalloutIndex(queue, assoc)).toBe(3);
    });

    it("should return -1 when no association matches", () => {
      const assoc: AudioAssociation = { laneIndex: 5 };
      expect(findQueuedCalloutIndex(queue, assoc)).toBe(-1);
    });
  });

  describe("sortCalloutQueue", () => {
    it("should sort items by priority descending then enqueuedAt ascending", () => {
      const queue: CalloutQueueItem[] = [
        {
          config: { type: "tts" },
          priority: "low",
          enqueuedAt: 10,
        },
        {
          config: { type: "tts" },
          priority: "urgent",
          enqueuedAt: 30,
        },
        {
          config: { type: "tts" },
          priority: "high",
          enqueuedAt: 5,
        },
        {
          config: { type: "tts" },
          priority: "high",
          enqueuedAt: 20,
        },
      ];

      sortCalloutQueue(queue);

      expect(queue.map((q) => q.priority)).toEqual([
        "urgent",
        "high",
        "high",
        "low",
      ]);
      expect(queue[1].enqueuedAt).toBe(5);
      expect(queue[2].enqueuedAt).toBe(20);
    });
  });

  describe("setupAudioWatchdog", () => {
    it("should start initial watchdog timer and allow clearing", () => {
      jasmine.clock().install();
      const audio = new Audio();
      let timedOut = false;
      const watchdog = setupAudioWatchdog(
        audio,
        () => false,
        () => {
          timedOut = true;
        },
      );

      watchdog.clear();
      jasmine.clock().tick(15000);
      expect(timedOut).toBeFalse();
      jasmine.clock().uninstall();
    });

    it("should trigger onTimeout when not ended and timeout elapses", () => {
      jasmine.clock().install();
      const audio = new Audio();
      let timedOut = false;
      setupAudioWatchdog(
        audio,
        () => false,
        () => {
          timedOut = true;
        },
      );

      jasmine.clock().tick(10001);
      expect(timedOut).toBeTrue();
      jasmine.clock().uninstall();
    });
  });
});
