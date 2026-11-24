import { Car } from "@app/models/car";

import { RacedaySetupLaneCars } from "./raceday-setup-lane-cars";

describe("RacedaySetupLaneCars (IROC, #1210)", () => {
  let settings: any;
  let host: any;
  let ui: RacedaySetupLaneCars;

  beforeEach(() => {
    settings = {};
    host = {
      allCars: [new Car("c1", "Audi R8")],
      laneCars: { t1: ["c1"] },
      selectedRace: {
        cars_stay_in_lanes: true,
        track: { entity_id: "t1", lanes: [{ background_color: "#f00" }, {}] },
      },
      settingsService: {
        getSettings: () => settings,
        saveSettings: jasmine.createSpy("saveSettings"),
      },
    };
    ui = new RacedaySetupLaneCars(host);
  });

  it("is active for an IROC race with cars", () => {
    expect(ui.active()).toBeTrue();
    host.selectedRace.cars_stay_in_lanes = false;
    expect(ui.active()).toBeFalse();
  });

  it("gives the lanes and the car per lane", () => {
    expect(ui.lanes()).toEqual([
      { lane: 0, color: "#f00" },
      { lane: 1, color: "" },
    ]);
    expect(ui.ids()).toEqual(["c1", ""]);
  });

  it("saves the picks for the race's track", () => {
    ui.save(["", "c1"]);
    expect(host.laneCars.t1).toEqual(["", "c1"]);
    expect(settings.selectedLaneCars.t1).toEqual(["", "c1"]);
  });
});
