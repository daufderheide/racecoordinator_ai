import { AudioAssociation, AudioRelevanceFilter } from "@app/models/audio";
import { AudioConfig } from "@app/models/driver";
import {
  isAudioRelevant,
  isVoiceCalloutSlot,
} from "@app/utils/audio-relevance";

describe("audio-relevance utils", () => {
  describe("isVoiceCalloutSlot", () => {
    it("should return false if config is undefined or type is none", () => {
      expect(isVoiceCalloutSlot("audio.yellowflag", undefined)).toBeFalse();
      expect(
        isVoiceCalloutSlot("audio.yellowflag", { type: "none" }),
      ).toBeFalse();
    });

    it("should return true for TTS configs regardless of slot name", () => {
      const tts: AudioConfig = { type: "tts", text: "Hello" };
      expect(isVoiceCalloutSlot("driver.lapAudio", tts)).toBeTrue();
      expect(isVoiceCalloutSlot("random_slot", tts)).toBeTrue();
    });

    it("should return true for preset configs matching announcement slots", () => {
      const preset: AudioConfig = { type: "preset", url: "beep.wav" };
      expect(isVoiceCalloutSlot("audio.yellowflag", preset)).toBeTrue();
      expect(isVoiceCalloutSlot("audio.seconds_left", preset)).toBeTrue();
      expect(isVoiceCalloutSlot("drift_lap", preset)).toBeTrue();
      expect(isVoiceCalloutSlot("driver.penaltyAudio", preset)).toBeTrue();
      expect(isVoiceCalloutSlot("driver.falseStartAudio", preset)).toBeTrue();
      expect(
        isVoiceCalloutSlot("driver.overallBestLapAudio", preset),
      ).toBeTrue();
    });

    it("should return false for preset configs on ordinary slots", () => {
      const preset: AudioConfig = { type: "preset", url: "beep.wav" };
      expect(isVoiceCalloutSlot("driver.lapAudio", preset)).toBeFalse();
      expect(isVoiceCalloutSlot("audio.countdown", preset)).toBeFalse();
    });
  });

  describe("isAudioRelevant", () => {
    it("should return true when filter is null", () => {
      expect(isAudioRelevant(null, { widgetType: "countdown" })).toBeTrue();
      expect(isAudioRelevant(null, { widgetType: "timer" })).toBeTrue();
      expect(isAudioRelevant(null, { widgetType: "flag" })).toBeTrue();
      expect(isAudioRelevant(null, { laneIndex: 0 })).toBeTrue();
      expect(isAudioRelevant(null)).toBeTrue();
    });

    it("should filter countdown widgets based on allowCountdown", () => {
      const filter: AudioRelevanceFilter = {
        driverAudioMode: "all",
        allowCountdown: false,
      };
      expect(isAudioRelevant(filter, { widgetType: "countdown" })).toBeFalse();

      filter.allowCountdown = true;
      expect(isAudioRelevant(filter, { widgetType: "countdown" })).toBeTrue();
    });

    it("should filter timer widgets based on allowTimer", () => {
      const filter: AudioRelevanceFilter = {
        driverAudioMode: "all",
        allowTimer: false,
      };
      expect(isAudioRelevant(filter, { widgetType: "timer" })).toBeFalse();

      filter.allowTimer = true;
      expect(isAudioRelevant(filter, { widgetType: "timer" })).toBeTrue();
    });

    it("should filter flag and race-state widgets based on allowRaceState", () => {
      const filter: AudioRelevanceFilter = {
        driverAudioMode: "all",
        allowRaceState: false,
      };
      expect(isAudioRelevant(filter, { widgetType: "flag" })).toBeFalse();
      expect(isAudioRelevant(filter, { widgetType: "race-state" })).toBeFalse();

      filter.allowRaceState = true;
      expect(isAudioRelevant(filter, { widgetType: "flag" })).toBeTrue();
      expect(isAudioRelevant(filter, { widgetType: "race-state" })).toBeTrue();
    });

    it("should respect driverAudioMode 'all' and 'none'", () => {
      const allFilter: AudioRelevanceFilter = {
        driverAudioMode: "all",
      };
      expect(
        isAudioRelevant(allFilter, { widgetType: "lane-view", laneIndex: 2 }),
      ).toBeTrue();

      const noneFilter: AudioRelevanceFilter = {
        driverAudioMode: "none",
      };
      expect(
        isAudioRelevant(noneFilter, { widgetType: "lane-view", laneIndex: 2 }),
      ).toBeFalse();
      expect(isAudioRelevant(noneFilter, { driverId: "drv-1" })).toBeFalse();
    });

    it("should respect driverAudioMode 'scoped' with allowedLanes and allowedDriverIds", () => {
      const scopedFilter: AudioRelevanceFilter = {
        driverAudioMode: "scoped",
        allowedLanes: new Set([0, 2]),
        allowedDriverIds: new Set(["driver-10"]),
      };

      expect(isAudioRelevant(scopedFilter, { laneIndex: 0 })).toBeTrue();
      expect(isAudioRelevant(scopedFilter, { laneIndex: 1 })).toBeFalse();
      expect(isAudioRelevant(scopedFilter, { laneIndex: 2 })).toBeTrue();
      expect(
        isAudioRelevant(scopedFilter, { driverId: "driver-10" }),
      ).toBeTrue();
      expect(
        isAudioRelevant(scopedFilter, { driverId: "driver-99" }),
      ).toBeFalse();
      expect(
        isAudioRelevant(scopedFilter, { widgetType: "driver", laneIndex: 1 }),
      ).toBeFalse();
    });

    it("should return true for unassociated sound events", () => {
      const filter: AudioRelevanceFilter = {
        driverAudioMode: "none",
        allowCountdown: false,
        allowTimer: false,
        allowRaceState: false,
      };
      const unassociated: AudioAssociation = { widgetType: "custom-sfx" };
      expect(isAudioRelevant(filter, unassociated)).toBeTrue();
      expect(isAudioRelevant(filter, undefined)).toBeTrue();
    });
  });
});
