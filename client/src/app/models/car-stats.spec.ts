import { CarField } from "./car-field";
import {
  CAR_STATS_FIXED_GROUPS,
  carStatsGroups,
  formatCarStatTime,
} from "./car-stats";

describe("car-stats (#1210)", () => {
  it("puts the user's own fields after the setup fields, before track and driver", () => {
    const groups = carStatsGroups([
      new CarField("f1", "Tyre width"),
      new CarField("", "No id"),
    ]);
    const values = groups.map((g) => g.value);
    expect(values.indexOf("custom:f1")).toBe(values.indexOf("tyres") + 1);
    expect(values.slice(-2)).toEqual(["track", "driver"]);
    expect(groups.find((g) => g.value === "custom:f1")).toEqual({
      value: "custom:f1",
      label: "Tyre width",
      custom: true,
    });
    expect(groups.length).toBe(CAR_STATS_FIXED_GROUPS.length + 1);
  });

  it("starts with Car and keeps the fixed groups without own fields", () => {
    expect(carStatsGroups([])).toEqual(CAR_STATS_FIXED_GROUPS);
    expect(CAR_STATS_FIXED_GROUPS[0].value).toBe("car");
  });

  it("formats lap times with three decimals, or a dash", () => {
    expect(formatCarStatTime(3.1)).toBe("3.100");
    expect(formatCarStatTime(0)).toBe("--.---");
  });
});
