import { Season } from "@app/models/season";

import { calculateSeasonStandings } from "./season.utils";

describe("season.utils", () => {
  it("should return empty array for null, undefined, or empty races season", () => {
    expect(calculateSeasonStandings(null)).toEqual([]);
    expect(calculateSeasonStandings(undefined)).toEqual([]);
    expect(
      calculateSeasonStandings({ name: "Empty", drops: 0, races: [] }),
    ).toEqual([]);
  });

  it("should calculate season standings with drops and sorting correctly", () => {
    const season: Season = {
      entity_id: "s1",
      name: "Championship 2026",
      drops: 1,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Lewis Hamilton",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
            },
            {
              driver_id: "d2",
              driver_name: "Max Verstappen",
              overall_rank: 2,
              overall_points: 18,
              heat_points: 0,
              total_points: 18,
            },
          ],
        },
        {
          race_id: "r2",
          race_name: "Race 2",
          timestamp: 2000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Lewis Hamilton",
              overall_rank: 5,
              overall_points: 10,
              heat_points: 0,
              total_points: 10,
            },
            {
              driver_id: "d2",
              driver_name: "Max Verstappen",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
            },
          ],
        },
      ],
    };

    const standings = calculateSeasonStandings(season);
    expect(standings.length).toBe(2);

    // Max: 18 + 25 = 43 gross. 1 drop (18) -> 25 net.
    // Lewis: 25 + 10 = 35 gross. 1 drop (10) -> 25 net.
    // Tied on net (25), Max has higher gross (43 vs 35) -> Max is 1st.
    expect(standings[0].driver_name).toBe("Max Verstappen");
    expect(standings[0].net_points).toBe(25);
    expect(standings[0].gross_points).toBe(43);
    expect(standings[0].dropped_points).toBe(18);
    expect(standings[0].races_run).toBe(2);

    expect(standings[1].driver_name).toBe("Lewis Hamilton");
    expect(standings[1].net_points).toBe(25);
    expect(standings[1].gross_points).toBe(35);
    expect(standings[1].dropped_points).toBe(10);
    expect(standings[1].races_run).toBe(2);
  });
});
