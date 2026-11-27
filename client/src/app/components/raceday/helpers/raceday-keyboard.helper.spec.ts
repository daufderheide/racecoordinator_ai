import { RaceState } from "@app/proto/antigravity";

import { RacedayKeyboardHelper } from "./raceday-keyboard.helper";

describe("RacedayKeyboardHelper Hot Yellow Track Call", () => {
  const createHost = (enabled: boolean) => ({
    raceState: RaceState.RACING,
    race: { hot_yellow_enabled: enabled },
    isPauseDisabled: false,
    onMenuSelect: jasmine.createSpy("onMenuSelect"),
  });

  it("routes the existing widget and Spacebar to Track Call when enabled", () => {
    const host = createHost(true);
    RacedayKeyboardHelper.executeWidgetAction(host, "action-pause");
    RacedayKeyboardHelper.handleSpacebarAction(host);
    expect(host.onMenuSelect.calls.allArgs()).toEqual([
      ["TRACK_CALL"],
      ["TRACK_CALL"],
    ]);
  });

  it("continues to use conventional pause when Hot Yellow is off", () => {
    const host = createHost(false);
    RacedayKeyboardHelper.executeWidgetAction(host, "action-pause");
    RacedayKeyboardHelper.handleSpacebarAction(host);
    expect(host.onMenuSelect.calls.allArgs()).toEqual([["PAUSE"], ["PAUSE"]]);
  });
});
