import { of, throwError } from "rxjs";
import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";

import { RacedaySetupCarsHelper } from "./raceday-setup-cars.helper";

describe("RacedaySetupCarsHelper (#1210)", () => {
  const ann = new Driver("d1", "Ann", "A");
  const bob = new Driver("d2", "Bob", "B");
  const team = new Team("t1", "Ferrari", undefined, ["d1", "d2"]);
  let settings: any;
  let host: any;

  beforeEach(() => {
    settings = {
      selectedCarChoices: {
        d_d1: { carId: "c1", carPerDriver: false, driverCars: {} },
        d_d2: { carId: "gone", carPerDriver: false, driverCars: {} },
      },
    };
    host = {
      allDrivers: [ann, bob],
      selectedParticipants: [ann, team],
      carChoices: {},
      carPickTarget: null,
      dataService: {
        getCars: jasmine.createSpy("getCars").and.returnValue(
          of([
            { entity_id: "c1", name: "Audi R8" },
            { entity_id: "c2", name: "Ford GT40" },
          ]),
        ),
      },
      settingsService: {
        getSettings: () => settings,
        saveSettings: jasmine.createSpy("saveSettings"),
      },
      cdr: { detectChanges: jasmine.createSpy("detectChanges") },
    };
  });

  it("loads the cars and the remembered picks that still exist", () => {
    RacedaySetupCarsHelper.loadCars(host);
    expect(host.allCars.map((c: any) => c.name)).toEqual([
      "Audi R8",
      "Ford GT40",
    ]);
    expect(Object.keys(host.carChoices)).toEqual(["d_d1"]);
    expect(RacedaySetupCarsHelper.summary(host, ann)).toBe("Audi R8");
    expect(RacedaySetupCarsHelper.summary(host, bob)).toBe("");
  });

  it("keeps working without cars when loading fails", () => {
    host.dataService.getCars.and.returnValue(throwError(() => new Error("x")));
    RacedaySetupCarsHelper.loadCars(host);
    expect(host.allCars).toEqual([]);
  });

  it("lists a team's drivers for a car per driver", () => {
    expect(RacedaySetupCarsHelper.teamDrivers(host, team)).toEqual([
      { id: "d1", name: "Ann" },
      { id: "d2", name: "Bob" },
    ]);
    expect(RacedaySetupCarsHelper.teamDrivers(host, ann)).toEqual([]);
  });

  it("saves a pick and remembers it", () => {
    RacedaySetupCarsHelper.loadCars(host);
    RacedaySetupCarsHelper.open(host, team);
    RacedaySetupCarsHelper.save(host, {
      carId: "",
      carPerDriver: true,
      driverCars: { d1: "c1", d2: "c2" },
    });
    expect(host.carPickTarget).toBeNull();
    expect(RacedaySetupCarsHelper.summary(host, team)).toBe(
      "Audi R8 / Ford GT40",
    );
    expect(settings.selectedCarChoices["t_t1"].driverCars).toEqual({
      d1: "c1",
      d2: "c2",
    });
    expect(host.settingsService.saveSettings).toHaveBeenCalledWith(settings);
  });

  it("forgets an entry's pick when set to no car", () => {
    RacedaySetupCarsHelper.loadCars(host);
    RacedaySetupCarsHelper.open(host, ann);
    RacedaySetupCarsHelper.save(host, {
      carId: "",
      carPerDriver: false,
      driverCars: {},
    });
    expect(host.carChoices["d_d1"]).toBeUndefined();
  });

  it("sends the picks of the entries in the race", () => {
    RacedaySetupCarsHelper.loadCars(host);
    host.carChoices["t_t1"] = {
      carId: "c2",
      carPerDriver: false,
      driverCars: {},
    };
    host.carChoices["d_d9"] = {
      carId: "c1",
      carPerDriver: false,
      driverCars: {},
    };
    expect(RacedaySetupCarsHelper.launchChoices(host)).toEqual([
      {
        participantId: "d_d1",
        carId: "c1",
        carPerDriver: false,
        driverCars: [],
      },
      {
        participantId: "t_t1",
        carId: "c2",
        carPerDriver: false,
        driverCars: [],
      },
    ]);
  });

  it("does nothing without a car service", () => {
    host.dataService = {};
    RacedaySetupCarsHelper.loadCars(host);
    expect(host.allCars).toBeUndefined();
    expect(RacedaySetupCarsHelper.launchChoices(host)).toEqual([]);
  });

  describe("cars stay in their lanes (IROC)", () => {
    const track = {
      entity_id: "tr1",
      lanes: [
        { background_color: "#ef4444" },
        { background_color: "" },
        { background_color: "#3b82f6" },
      ],
    };

    beforeEach(() => {
      settings.selectedLaneCars = { tr1: ["c2", "gone", "c1"] };
      RacedaySetupCarsHelper.loadCars(host);
      host.selectedRace = { cars_stay_in_lanes: true, track };
    });

    it("is on only for an IROC race with cars in the database", () => {
      expect(RacedaySetupCarsHelper.carsInLanes(host)).toBeTrue();
      host.selectedRace = { cars_stay_in_lanes: false, track };
      expect(RacedaySetupCarsHelper.carsInLanes(host)).toBeFalse();
      host.selectedRace = { cars_stay_in_lanes: true, track };
      host.allCars = [];
      expect(RacedaySetupCarsHelper.carsInLanes(host)).toBeFalse();
      host.selectedRace = undefined;
      expect(RacedaySetupCarsHelper.carsInLanes(host)).toBeFalse();
    });

    it("finds the track in the track list, as a race only names its id", () => {
      host.tracks = [{ ...track, entity_id: "tr2", lanes: [{}] }];
      host.selectedRace = { cars_stay_in_lanes: true, track_entity_id: "tr2" };
      expect(RacedaySetupCarsHelper.lanes(host)).toEqual([
        { lane: 0, color: "" },
      ]);
      RacedaySetupCarsHelper.saveLaneCars(host, ["c1"]);
      expect(host.laneCars.tr2).toEqual(["c1"]);
    });

    it("lists the track's lanes with their colours", () => {
      expect(RacedaySetupCarsHelper.lanes(host)).toEqual([
        { lane: 0, color: "#ef4444" },
        { lane: 1, color: "" },
        { lane: 2, color: "#3b82f6" },
      ]);
      host.selectedRace = { cars_stay_in_lanes: true };
      expect(RacedaySetupCarsHelper.lanes(host)).toEqual([]);
    });

    it("remembers the lane cars per track, known cars only", () => {
      expect(RacedaySetupCarsHelper.laneCarIds(host)).toEqual(["c2", "", "c1"]);
      host.selectedRace = {
        cars_stay_in_lanes: true,
        track: { ...track, entity_id: "other" },
      };
      expect(RacedaySetupCarsHelper.laneCarIds(host)).toEqual(["", "", ""]);
    });

    it("saves the lane cars for the race's track", () => {
      RacedaySetupCarsHelper.saveLaneCars(host, ["c1", "", ""]);
      expect(host.laneCars.tr1).toEqual(["c1", "", ""]);
      expect(settings.selectedLaneCars.tr1).toEqual(["c1", "", ""]);
      expect(host.settingsService.saveSettings).toHaveBeenCalledWith(settings);
    });

    it("forgets a track's lane cars when all are cleared", () => {
      RacedaySetupCarsHelper.saveLaneCars(host, ["", "", ""]);
      expect(host.laneCars.tr1).toBeUndefined();
    });

    it("saves nothing without a track", () => {
      host.selectedRace = { cars_stay_in_lanes: true };
      RacedaySetupCarsHelper.saveLaneCars(host, ["c1"]);
      expect(host.settingsService.saveSettings).not.toHaveBeenCalled();
    });

    it("sends the lane cars at race start instead of the racers' picks", () => {
      host.carChoices = {
        d_d1: { carId: "c1", carPerDriver: false, driverCars: {} },
      };
      expect(RacedaySetupCarsHelper.launchLaneCarIds(host)).toEqual([
        "c2",
        "",
        "c1",
      ]);
      expect(RacedaySetupCarsHelper.launchChoices(host)).toEqual([]);
    });

    it("sends no lane cars when none are picked or the race isn't IROC", () => {
      host.laneCars = {};
      expect(RacedaySetupCarsHelper.launchLaneCarIds(host)).toEqual([]);
      host.laneCars = { tr1: ["c1"] };
      host.selectedRace = { cars_stay_in_lanes: false, track };
      expect(RacedaySetupCarsHelper.launchLaneCarIds(host)).toEqual([]);
    });
  });
});
