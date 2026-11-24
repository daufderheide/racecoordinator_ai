import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";

import { RacedaySetupCarPick } from "./raceday-setup-car-pick";

describe("RacedaySetupCarPick (#1251)", () => {
  const ann = new Driver("d1", "Ann", "A");
  const bob = new Driver("d2", "Bob", "B");
  const team = new Team("t1", "Ferrari", undefined, ["d1", "d2"]);
  let host: any;
  let pick: RacedaySetupCarPick;

  beforeEach(() => {
    host = {
      allDrivers: [ann, bob],
      selectedParticipants: [ann, bob, team],
      carPickTarget: null,
      carChoices: {
        d_d1: { carId: "c1", carPerDriver: false, driverCars: {} },
        d_d2: { carId: "c1", carPerDriver: false, driverCars: {} },
      },
    };
    pick = new RacedaySetupCarPick(host);
  });

  it("has nothing to show while the dialog is closed", () => {
    expect(pick.choice().carId).toBe("");
    expect(pick.teamDrivers()).toEqual([]);
    expect(pick.taken()).toEqual({});
  });

  it("gives the dialog the entry's pick and the other entries' cars", () => {
    host.carPickTarget = ann;
    expect(pick.choice().carId).toBe("c1");
    expect(pick.taken()).toEqual({ c1: "Bob" });
    host.carPickTarget = team;
    expect(pick.teamDrivers().map((d) => d.name)).toEqual(["Ann", "Bob"]);
  });

  it("names the other entry with the same car", () => {
    expect(pick.conflict(ann)).toBe("Bob");
    expect(pick.conflict(team)).toBe("");
  });
});
