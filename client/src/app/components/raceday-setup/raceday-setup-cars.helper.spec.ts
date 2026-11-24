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

  describe("one car per entry (#1251)", () => {
    const cleo = new Driver("d3", "Cleo", "C");

    beforeEach(() => {
      host.selectedParticipants = [ann, team, cleo];
      host.getLocalizedName = (p: any) => `${p.name}!`;
      host.carChoices = {
        d_d1: { carId: "c1", carPerDriver: false, driverCars: {} },
        t_t1: {
          carId: "",
          carPerDriver: true,
          driverCars: { d1: "c2", d2: "c3" },
        },
      };
    });

    it("lists the cars the other entries in the race have", () => {
      expect(RacedaySetupCarsHelper.takenBy(host, cleo)).toEqual({
        c1: "Ann!",
        c2: "Ferrari!",
        c3: "Ferrari!",
      });
      expect(RacedaySetupCarsHelper.takenBy(host, ann)).toEqual({
        c2: "Ferrari!",
        c3: "Ferrari!",
      });
    });

    it("works out the taken cars when the dialog opens", () => {
      RacedaySetupCarsHelper.open(host, cleo);
      expect(host.carPickTarget).toBe(cleo);
      expect(Object.keys(host.carPickTaken)).toEqual(["c1", "c2", "c3"]);
    });

    it("ignores entries that are not in the race", () => {
      host.selectedParticipants = [ann, cleo];
      expect(RacedaySetupCarsHelper.takenBy(host, cleo)).toEqual({
        c1: "Ann!",
      });
    });

    it("falls back to the entry's name", () => {
      delete host.getLocalizedName;
      expect(RacedaySetupCarsHelper.takenBy(host, cleo)["c1"]).toBe("Ann");
    });

    it("finds a remembered pick that clashes with another entry", () => {
      expect(RacedaySetupCarsHelper.conflict(host, cleo)).toBe("");
      host.carChoices.d_d3 = {
        carId: "c3",
        carPerDriver: false,
        driverCars: {},
      };
      expect(RacedaySetupCarsHelper.conflict(host, cleo)).toBe("Ferrari!");
      expect(RacedaySetupCarsHelper.conflict(host, ann)).toBe("");
    });
  });
});
