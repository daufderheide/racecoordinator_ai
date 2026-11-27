import { fakeAsync, tick } from "@angular/core/testing";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { RaceFlag, RaceState } from "@app/proto/antigravity";

import { RacedayRaceLifecycleHelper } from "./raceday-race-lifecycle.helper";
import { RacedaySubscriptionsHelper } from "./raceday-subscriptions.helper";

describe("Hot Yellow restart presentation", () => {
  function createHost() {
    return {
      raceState: RaceState.RACING,
      hotYellowRestartActive: false,
      showCountdownOverlay: false,
      countdownLamps: [] as { state: string; url: string }[],
      audioService: { stopVoice: jasmine.createSpy("stopVoice") },
      playAudioFromSet: jasmine.createSpy("playAudioFromSet").and.returnValue(true),
      resolveAssetUrlBySlot: (slot: string) => slot,
      getAssetUrl: (name: string) => name,
      logger: { debug: jasmine.createSpy("debug"), warn: jasmine.createSpy("warn") },
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };
  }

  it("shows the red lamps and themed sounds without replacing the race clock", fakeAsync(() => {
    const host = createHost();
    RacedayRaceLifecycleHelper.updateHotYellowRestart(host, { duration: 3, remaining: 2 });
    expect(host.countdownLamps.map(({ state }) => state)).toEqual(["on", "on", "dim"]);
    expect(host.playAudioFromSet).toHaveBeenCalledOnceWith(
      THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 2, { widgetType: "countdown" },
    );
    expect(RacedaySubscriptionsHelper.computeDisplayRaceTime(host, { time: 30 })).toBe(30);
    expect(RacedaySubscriptionsHelper.computeDisplayRaceTime(host, { time: 0 })).toBe(0);

    RacedayRaceLifecycleHelper.updateHotYellowRestart(host, { duration: 3, remaining: 0 });
    expect(host.countdownLamps.map(({ state }) => state)).toEqual(["on", "on", "on"]);
    RacedayRaceLifecycleHelper.endHotYellowRestart(host, RaceFlag.GREEN);
    expect(host.countdownLamps.map(({ state }) => state)).toEqual(["go", "go", "go"]);
    expect(host.playAudioFromSet).toHaveBeenCalledWith(
      THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 0, { widgetType: "countdown" },
    );
    tick(1000);
    expect(host.showCountdownOverlay).toBeFalse();
  }));

  it("hides an interrupted restart without the green sound", () => {
    const host = createHost();
    RacedayRaceLifecycleHelper.updateHotYellowRestart(host, { duration: 3, remaining: 3 });
    host.playAudioFromSet.calls.reset();
    RacedayRaceLifecycleHelper.endHotYellowRestart(host, RaceFlag.YELLOW);

    expect(host.hotYellowRestartActive).toBeFalse();
    expect(host.showCountdownOverlay).toBeFalse();
    expect(host.playAudioFromSet).not.toHaveBeenCalled();
  });
});
