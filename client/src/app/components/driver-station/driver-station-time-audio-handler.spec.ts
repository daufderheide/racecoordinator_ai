import { FinishMethod } from "@app/models/heat_scoring";
import { THEME_SLOT_KEYS } from "@app/models/theme";

import {
  DriverStationTimeAudioDeps,
  DriverStationTimeAudioHandler,
} from "./driver-station-time-audio-handler";

describe("DriverStationTimeAudioHandler", () => {
  let handler: DriverStationTimeAudioHandler;
  let mockThemeService: any;
  let deps: DriverStationTimeAudioDeps;
  let raceObj: any;
  let assetsArr: any[];

  beforeEach(() => {
    mockThemeService = jasmine.createSpyObj("ThemeService", [
      "resolveAudioConfig",
    ]);

    raceObj = {
      heat_scoring: {
        finishMethod: FinishMethod.Timed,
        finishValue: 60,
      },
      auto_start_time: 15,
      auto_advance_time: 10,
    };

    assetsArr = [];

    deps = {
      themeService: mockThemeService,
      getRace: () => raceObj,
      getAssets: () => assetsArr,
      playThemedSound: jasmine.createSpy("playThemedSound"),
      playAudioFromSet: jasmine
        .createSpy("playAudioFromSet")
        .and.returnValue(true),
    };

    handler = new DriverStationTimeAudioHandler(deps);
  });

  it("should reset state cleanly", () => {
    handler.playedHalfway = true;
    handler.playedSecondsLeft.add(30);
    handler.playedSecondsElapsed.add(15);
    handler.playedAutoStart.add(10);
    handler.playedAutoStartElapsed.add(5);
    handler.playedAutoAdvance.add(5);
    handler.playedAutoAdvanceElapsed.add(2);

    handler.reset();

    expect(handler.playedHalfway).toBeFalse();
    expect(handler.playedSecondsLeft.size).toBe(0);
    expect(handler.playedSecondsElapsed.size).toBe(0);
    expect(handler.playedAutoStart.size).toBe(0);
    expect(handler.playedAutoStartElapsed.size).toBe(0);
    expect(handler.playedAutoAdvance.size).toBe(0);
    expect(handler.playedAutoAdvanceElapsed.size).toBe(0);
  });

  describe("getSecondsLeftThresholds", () => {
    it("should return defaults when no theme audio config is set", () => {
      mockThemeService.resolveAudioConfig.and.returnValue(null);
      const thresholds = handler.getSecondsLeftThresholds("remaining");
      expect(thresholds).toEqual([
        300, 240, 180, 120, 60, 30, 25, 20, 15, 10, 5,
      ]);

      const elapsed = handler.getSecondsLeftThresholds("elapsed");
      expect(elapsed).toEqual([]);
    });

    it("should return parsed thresholds from asset entries", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        url: "asset-1",
      });
      assetsArr = [
        {
          _id: "asset-1",
          audioEntries: [
            { timeSeconds: 30, triggerMode: "remaining" },
            { timeSeconds: 15, triggerMode: "remaining" },
            { timeSeconds: 10, triggerMode: "elapsed" },
          ],
        },
      ];

      const remaining = handler.getSecondsLeftThresholds("remaining");
      expect(remaining).toEqual([30, 15]);

      const elapsed = handler.getSecondsLeftThresholds("elapsed");
      expect(elapsed).toEqual([10]);
    });
  });

  describe("checkRaceTimeAnnouncements", () => {
    it("should play halfway callout when crossing halfway threshold", () => {
      handler.checkRaceTimeAnnouncements(30);

      expect(deps.playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        undefined,
        { widgetType: "timer" },
      );
      expect(handler.playedHalfway).toBeTrue();
    });

    it("should play remaining and elapsed audio set entries", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        url: "asset-1",
      });
      assetsArr = [
        {
          _id: "asset-1",
          audioEntries: [
            { timeSeconds: 30, triggerMode: "remaining" },
            { timeSeconds: 20, triggerMode: "elapsed" },
          ],
        },
      ];

      // Total duration is 60, currentTime = 30 -> remaining 30, elapsed 30 (>= 20)
      handler.checkRaceTimeAnnouncements(30);

      expect(deps.playAudioFromSet).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
        30,
        { widgetType: "timer" },
        "remaining",
      );
      expect(deps.playAudioFromSet).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
        20,
        { widgetType: "timer" },
        "elapsed",
      );
    });
  });

  describe("checkAutoStartAnnouncements", () => {
    it("should play auto start remaining thresholds", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        url: "asset-as",
      });
      assetsArr = [
        {
          _id: "asset-as",
          audioEntries: [{ timeSeconds: 10, triggerMode: "remaining" }],
        },
      ];

      handler.checkAutoStartAnnouncements(10, 11);

      expect(deps.playAudioFromSet).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_AUTO_START,
        10,
        { widgetType: "timer" },
        "remaining",
      );
      expect(handler.playedAutoStart.has(10)).toBeTrue();
    });
  });

  describe("checkAutoAdvanceAnnouncements", () => {
    it("should play auto advance remaining thresholds", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        url: "asset-aa",
      });
      assetsArr = [
        {
          _id: "asset-aa",
          audioEntries: [{ timeSeconds: 5, triggerMode: "remaining" }],
        },
      ];

      handler.checkAutoAdvanceAnnouncements(5, 6);

      expect(deps.playAudioFromSet).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
        5,
        { widgetType: "timer" },
        "remaining",
      );
      expect(handler.playedAutoAdvance.has(5)).toBeTrue();
    });
  });
});
