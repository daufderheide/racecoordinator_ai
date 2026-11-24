import { Driver } from "@app/models/driver";
import { Lane } from "@app/models/lane";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import { performLaneCheck } from "./modify-heats-lane-check.helper";

describe("modify-heats-lane-check.helper", () => {
  let mockTranslationService: TranslationService;
  let track4: Track;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string, params?: any) => {
        if (key === "RD_STEP_LADDER_STEP") return `Step ${params?.step}`;
        if (key === "DR_LABEL_GROUP") return `Group ${params?.group}`;
        if (key === "RD_STEP_UP_N") return `Step-Up ${params?.n}`;
        if (key === "AM_LABEL_HEAT_SINGULAR") return "heat";
        if (key === "AM_LABEL_HEAT_PLURAL") return "heats";
        return key;
      },
    } as unknown as TranslationService;

    const lanes: Lane[] = [
      new Lane("l1", "#ff0000", "#ffffff", 10),
      new Lane("l2", "#ffffff", "#000000", 10),
      new Lane("l3", "#0000ff", "#ffffff", 10),
      new Lane("l4", "#ffff00", "#000000", 10),
    ];
    track4 = new Track({ entity_id: "track_1", name: "4-Lane Track", lanes });
  });

  function createDriver(id: string, name: string): RaceParticipant {
    return new RaceParticipant(
      id,
      new Driver(id, name),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  }

  function createTeam(id: string, name: string): RaceParticipant {
    return new RaceParticipant(
      id,
      new Driver("", ""),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      new Team(name, id),
    );
  }

  function createStepUp(stepUpIndex: number, id?: string): RaceParticipant {
    const p = new RaceParticipant(
      id || `su_${stepUpIndex}_uuid`,
      new Driver(id || `su_${stepUpIndex}`, `Step-Up ${stepUpIndex}`),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
    p.isStepUp = true;
    p.stepUpIndex = stepUpIndex;
    return p;
  }

  function createHeat(
    heatNumber: number,
    lanes: (RaceParticipant | null)[],
    step = 1,
    group = 0,
    isStepUpBoundary = false,
  ): Heat {
    const drivers: DriverHeatData[] = lanes.map((p, idx) => {
      return new DriverHeatData(
        `hd_${heatNumber}_${idx}`,
        p ||
          new RaceParticipant(
            "",
            new Driver("", ""),
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ),
        idx,
      );
    });
    const heat = new Heat(`h_${heatNumber}`, heatNumber, drivers, [], false);
    heat.step = step;
    heat.group = group;
    heat.isStepUpBoundary = isStepUpBoundary;
    return heat;
  }

  describe("standard race (no step-up, no groups)", () => {
    it("should return AM_REPORT_ALL_EQUAL when all drivers have equal lane assignments", () => {
      const d1 = createDriver("d1", "Driver 1");
      const d2 = createDriver("d2", "Driver 2");
      const heats = [
        createHeat(1, [d1, d2, null, null]),
        createHeat(2, [d2, d1, null, null]),
      ];

      const result = performLaneCheck(
        [d1, d2],
        heats,
        track4,
        mockTranslationService,
        false,
      );

      expect(result.allEqual).toBeTrue();
      expect(result.reports).toEqual([{ key: "AM_REPORT_ALL_EQUAL" }]);
    });

    it("should report unequal lanes with no prefix in standard race", () => {
      const d1 = createDriver("d1", "Driver 1");
      const d2 = createDriver("d2", "Driver 2");
      const heats = [
        createHeat(1, [d1, d2, null, null]),
        createHeat(2, [d1, d2, null, null]),
      ];

      const result = performLaneCheck(
        [d1, d2],
        heats,
        track4,
        mockTranslationService,
        false,
      );

      expect(result.allEqual).toBeFalse();
      expect(result.reports[0].key).toBe("AM_REPORT_LANE_DIFF");
      expect(result.reports[0].prefix).toBeUndefined();
    });

    it("should recognize team participants in standard races", () => {
      const t1 = createTeam("t1", "The Boys");
      const t2 = createTeam("t2", "The Girls");
      const heats = [
        createHeat(1, [t1, t2, null, null]),
        createHeat(2, [t2, t1, null, null]),
      ];

      const result = performLaneCheck(
        [t1, t2],
        heats,
        track4,
        mockTranslationService,
        false,
      );

      expect(result.allEqual).toBeTrue();
      expect(result.reports).toEqual([{ key: "AM_REPORT_ALL_EQUAL" }]);
    });
  });

  describe("step-up race (ladder rotation with 1 heat per step)", () => {
    it("should return AM_REPORT_ALL_EQUAL for valid 4-step ladder rotation without invalid driver errors", () => {
      // Setup identical to user screenshot:
      // 22 registered participants (8 regular drivers + 2 teams + others)
      const d1 = createDriver("d1", "Driver 1");
      const d2 = createDriver("d2", "Driver 2");
      const d3 = createDriver("d3", "Driver 3");
      const d4 = createDriver("d4", "Driver 4");
      const d5 = createDriver("d5", "Driver 5");
      const d6 = createDriver("d6", "Driver 6");
      const d7 = createDriver("d7", "Driver 7");
      const d8 = createDriver("d8", "Driver 8");
      const teamBoys = createTeam("t_boys", "The Boys");
      const teamGirls = createTeam("t_girls", "The Girls");

      const allRegistered = [
        d1,
        d2,
        d3,
        d4,
        d5,
        d6,
        d7,
        d8,
        teamBoys,
        teamGirls,
      ];

      // Step-up slots in heats 2, 3, 4 with random/server UUIDs
      const su1_h2 = createStepUp(1, "416116e0-59e5-4feb-83e8-a81a5783306a");
      const su2_h2 = createStepUp(2, "0e4ed358-baf7-4e9c-998d-c295827fb8d6");
      const su1_h3 = createStepUp(1, "129e5795-edf8-445d-9149-dc357f3b0b84");
      const su1_h4 = createStepUp(1, "42b80f1c-cc58-4147-9ad3-2a39f0c67279");
      const su2_h4 = createStepUp(2, "327171d6-7b2a-4163-a467-4297e9d45c0d");

      // Heat 1: Step 1 (Driver 7, Driver 8, Driver 6, Empty Lane)
      const heat1 = createHeat(1, [d7, d8, d6, null], 1, 0, true);
      // Heat 2: Step 2 (Driver 5, Driver 4, Step-Up 1, Step-Up 2)
      const heat2 = createHeat(2, [d5, d4, su1_h2, su2_h2], 2, 0, true);
      // Heat 3: Step 3 (Driver 3, Driver 2, Driver 1, Step-Up 1)
      const heat3 = createHeat(3, [d3, d2, d1, su1_h3], 3, 0, true);
      // Heat 4: Step 4 (The Boys, The Girls, Step-Up 1, Step-Up 2)
      const heat4 = createHeat(
        4,
        [teamBoys, teamGirls, su1_h4, su2_h4],
        4,
        0,
        false,
      );

      const race = { step_up: 2 } as unknown as Race;

      const result = performLaneCheck(
        allRegistered,
        [heat1, heat2, heat3, heat4],
        track4,
        mockTranslationService,
        true,
        race,
      );

      expect(result.allEqual).toBeTrue();
      expect(result.reports).toEqual([{ key: "AM_REPORT_ALL_EQUAL" }]);
    });

    it("should report AM_REPORT_EMPTY_HEAT with actual heat number when a step has an empty heat", () => {
      const d1 = createDriver("d1", "Driver 1");
      const heat1 = createHeat(1, [d1, null, null, null], 1, 0, true);
      const heat2 = createHeat(2, [null, null, null, null], 2, 0, false);

      const result = performLaneCheck(
        [d1],
        [heat1, heat2],
        track4,
        mockTranslationService,
        true,
      );

      expect(result.allEqual).toBeFalse();
      const emptyReport = result.reports.find(
        (r) => r.key === "AM_REPORT_EMPTY_HEAT",
      );
      expect(emptyReport).toBeDefined();
      expect(emptyReport?.params?.heat).toBe(2);
      expect(emptyReport?.prefix).toBe("Step 2");
    });

    it("should report AM_REPORT_INVALID_DRIVER when an unregistered driver is placed in a heat", () => {
      const d1 = createDriver("d1", "Driver 1");
      const unregistered = createDriver("d_rogue", "Rogue Driver");
      const heat1 = createHeat(1, [d1, unregistered, null, null], 1, 0, false);

      const result = performLaneCheck(
        [d1],
        [heat1],
        track4,
        mockTranslationService,
        true,
      );

      expect(result.allEqual).toBeFalse();
      const invalidReport = result.reports.find(
        (r) => r.key === "AM_REPORT_INVALID_DRIVER",
      );
      expect(invalidReport).toBeDefined();
      expect(invalidReport?.params?.driver).toBe("Rogue Driver");
      expect(invalidReport?.params?.heat).toBe(1);
    });
  });

  describe("step-up race (multi-heat steps)", () => {
    it("should return AM_REPORT_ALL_EQUAL when multi-heat steps have equal lane rotations", () => {
      const d1 = createDriver("d1", "Driver 1");
      const d2 = createDriver("d2", "Driver 2");
      const d3 = createDriver("d3", "Driver 3");
      const d4 = createDriver("d4", "Driver 4");

      // Step 1 has 2 heats with equal rotation for d1 and d2
      const heat1 = createHeat(1, [d1, d2, null, null], 1, 0, false);
      const heat2 = createHeat(2, [d2, d1, null, null], 1, 0, true);

      // Step 2 has 2 heats with equal rotation for d3 and d4
      const heat3 = createHeat(3, [d3, d4, null, null], 2, 0, false);
      const heat4 = createHeat(4, [d4, d3, null, null], 2, 0, false);

      const result = performLaneCheck(
        [d1, d2, d3, d4],
        [heat1, heat2, heat3, heat4],
        track4,
        mockTranslationService,
        true,
      );

      expect(result.allEqual).toBeTrue();
      expect(result.reports).toEqual([{ key: "AM_REPORT_ALL_EQUAL" }]);
    });

    it("should report unequal lanes with step prefix when a multi-heat step is unequal", () => {
      const d1 = createDriver("d1", "Driver 1");
      const d2 = createDriver("d2", "Driver 2");
      const d3 = createDriver("d3", "Driver 3");
      const d4 = createDriver("d4", "Driver 4");

      // Step 1 is equal
      const heat1 = createHeat(1, [d1, d2, null, null], 1, 0, false);
      const heat2 = createHeat(2, [d2, d1, null, null], 1, 0, true);

      // Step 2 is unequal (d3 on Lane 1 twice, d4 on Lane 2 twice)
      const heat3 = createHeat(3, [d3, d4, null, null], 2, 0, false);
      const heat4 = createHeat(4, [d3, d4, null, null], 2, 0, false);

      const result = performLaneCheck(
        [d1, d2, d3, d4],
        [heat1, heat2, heat3, heat4],
        track4,
        mockTranslationService,
        true,
      );

      expect(result.allEqual).toBeFalse();
      const laneDiff = result.reports.find(
        (r) => r.key === "AM_REPORT_LANE_DIFF",
      );
      expect(laneDiff).toBeDefined();
      expect(laneDiff?.prefix).toBe("Step 2");
    });
  });

  describe("multi-group race", () => {
    it("should evaluate each group independently without cross-group driver comparisons", () => {
      const g1_d1 = createDriver("g1_d1", "Group 1 Driver 1");
      const g1_d2 = createDriver("g1_d2", "Group 1 Driver 2");
      const g2_d1 = createDriver("g2_d1", "Group 2 Driver 1");
      const g2_d2 = createDriver("g2_d2", "Group 2 Driver 2");

      const race = {
        group_options: { enabled: true },
      } as unknown as Race;

      // Group 1 heats (group = 0)
      const heat1 = createHeat(1, [g1_d1, g1_d2, null, null], 0, 0, false);
      const heat2 = createHeat(2, [g1_d2, g1_d1, null, null], 0, 0, false);

      // Group 2 heats (group = 1)
      const heat3 = createHeat(3, [g2_d1, g2_d2, null, null], 0, 1, false);
      const heat4 = createHeat(4, [g2_d2, g2_d1, null, null], 0, 1, false);

      const result = performLaneCheck(
        [g1_d1, g1_d2, g2_d1, g2_d2],
        [heat1, heat2, heat3, heat4],
        track4,
        mockTranslationService,
        false,
        race,
      );

      expect(result.allEqual).toBeTrue();
      expect(result.reports).toEqual([{ key: "AM_REPORT_ALL_EQUAL" }]);
    });

    it("should include group and step prefix when both groups and step-up are enabled", () => {
      const d1 = createDriver("d1", "Driver 1");
      const d2 = createDriver("d2", "Driver 2");

      const race = {
        group_options: { enabled: true },
        step_up: 1,
      } as unknown as Race;

      // Group 1 Step 1 boundary heat, followed by Step 2 heats with unequal assignments
      const heat0 = createHeat(1, [d1, d2, null, null], 1, 0, true);
      const heat1 = createHeat(2, [d1, d2, null, null], 2, 0, false);
      const heat2 = createHeat(3, [d1, d2, null, null], 2, 0, false);

      const result = performLaneCheck(
        [d1, d2],
        [heat0, heat1, heat2],
        track4,
        mockTranslationService,
        true,
        race,
      );

      expect(result.allEqual).toBeFalse();
      const laneDiff = result.reports.find(
        (r) => r.key === "AM_REPORT_LANE_DIFF",
      );
      expect(laneDiff).toBeDefined();
      expect(laneDiff?.prefix).toBe("Group 1, Step 2");
    });
  });
});
