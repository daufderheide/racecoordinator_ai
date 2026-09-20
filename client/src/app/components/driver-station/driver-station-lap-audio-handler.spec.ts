import { FinishMethod } from "@app/models/heat_scoring";
import { LapType } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  DriverStationLapAudioDeps,
  DriverStationLapAudioHandler,
} from "./driver-station-lap-audio-handler";

describe("DriverStationLapAudioHandler", () => {
  let handler: DriverStationLapAudioHandler;
  let mockAudioService: any;
  let mockThemeService: any;
  let deps: DriverStationLapAudioDeps;
  let mockDriverData: DriverHeatData;

  beforeEach(() => {
    mockAudioService = jasmine.createSpyObj("AudioService", [
      "playCallout",
      "playSfx",
      "queueCallout",
    ]);
    mockThemeService = jasmine.createSpyObj("ThemeService", [
      "resolveAudioConfig",
    ]);

    mockDriverData = {
      objectId: "hd-1",
      laneIndex: 0,
      driver: {
        entity_id: "d1",
        name: "Driver 1",
        lapAudio: { type: "preset", url: "lap.mp3" },
        bestLapAudio: { type: "preset", url: "best.mp3" },
      },
      lapCount: 0,
    } as any;

    deps = {
      audioService: mockAudioService,
      themeService: mockThemeService,
      resolvePlayableUrl: (url) => url,
      playThemedSound: jasmine.createSpy("playThemedSound"),
      getRace: () =>
        ({
          heat_scoring: {
            finishMethod: FinishMethod.Lap,
            finishValue: 20,
          },
        }) as any,
      getHeat: () => ({}) as any,
      getAssets: () => [],
      getDriverData: () => mockDriverData,
      getLaneIndex: () => 0,
    };

    handler = new DriverStationLapAudioHandler(deps);
  });

  it("should reset state cleanly", () => {
    handler.leaderLaps = 5;
    handler.playedHalfway = true;
    handler.playedLapsLeft.add(10);
    handler.playedLapsElapsed.add(5);

    handler.reset();

    expect(handler.leaderLaps).toBe(0);
    expect(handler.playedHalfway).toBeFalse();
    expect(handler.playedLapsLeft.size).toBe(0);
    expect(handler.playedLapsElapsed.size).toBe(0);
  });

  it("should play false start callout for current station driver", () => {
    mockDriverData.driver.falseStartAudio = {
      type: "tts",
      text: "False Start",
    };

    handler.handleLapEvent(
      { objectId: "hd-1", type: LapType.FALSE_START },
      mockDriverData,
    );

    expect(mockAudioService.playCallout).toHaveBeenCalledWith(
      jasmine.objectContaining({ text: "False Start" }),
      "urgent",
      jasmine.any(Object),
      undefined,
      jasmine.objectContaining({ widgetType: "lane-view" }),
    );
  });

  it("should play lap fallback SFX when no milestone or timer callout is triggered", () => {
    handler.handleLapEvent(
      { objectId: "hd-1", lapNumber: 2, lapTime: 3.5, bestLapTime: 3.0 },
      mockDriverData,
    );

    expect(mockAudioService.playSfx).toHaveBeenCalledWith(
      "lap.mp3",
      jasmine.objectContaining({ widgetType: "lane-view" }),
    );
  });

  it("should play personal best lap fallback SFX when lap is personal best", () => {
    handler.handleLapEvent(
      { objectId: "hd-1", lapNumber: 2, lapTime: 3.0, bestLapTime: 3.0 },
      mockDriverData,
    );

    expect(mockAudioService.playSfx).toHaveBeenCalledWith(
      "best.mp3",
      jasmine.objectContaining({ widgetType: "lane-view" }),
    );
  });
});
