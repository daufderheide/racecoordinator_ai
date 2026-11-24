import { Driver } from "@app/models/driver";
import { GroupOptions } from "@app/models/group_options";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { IHeat } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import { createParticipantFromDriver } from "./modify-heats-modal.utils";
import {
  addHeatToState,
  buildSavePayload,
  canEnterDriverDropListPredicate,
  canEnterHeatsGridPredicate,
  cloneInitialHeats,
  filterHeatsByGroupAndStep,
  getAvailableGroups,
  getAvailableSteps,
  getCustomGroupName,
  getDriverHeatDataInLaneHelper,
  getHeatValidationWarning,
  getParticipantGroupBadge,
  getParticipantStepBadge,
  HeatDragDropController,
  isHeatIncompatibleWithDraggedParticipant,
  isStepUpEnabledHelper,
  loadAndRegisterDrivers,
  loadAndRegisterTeams,
  mapRegeneratedHeatsFromProto,
  removeDriverFromHeatState,
  removeHeatFromState,
  resolveDraggedParticipant,
} from "./modify-heats-ui.helper";

describe("modify-heats-ui.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: Record<string, any>) => {
        if (key === "RD_FILTER_GROUP_N" && params) {
          return `Group ${params["n"]}`;
        }
        if (key === "RD_FILTER_STEP_N" && params) {
          return `Step ${params["n"]}`;
        }
        if (key === "RD_ERR_STEP_UP_IN_STEP_ONE") {
          return "Step-up in step 1 error";
        }
        if (key === "RD_ERR_STEP_UP_COUNT_MISMATCH") {
          return `Count mismatch: expected ${params?.["expected"]}, found ${params?.["found"]}`;
        }
        if (key === "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS") {
          return `Participant ${params?.["participant"]} across groups ${params?.["group1"]} and ${params?.["group2"]}`;
        }
        return key;
      },
    );
  });

  const createDriver = (id: string, name: string): Driver =>
    new Driver(name, name, id);

  const createParticipant = (
    id: string,
    name: string,
    isStepUp = false,
    stepUpIndex = 0,
  ): RaceParticipant => {
    const p = createParticipantFromDriver(createDriver(id, name));
    p.objectId = id;
    p.isStepUp = isStepUp;
    p.stepUpIndex = stepUpIndex;
    return p;
  };

  const setGroupOptions = (race: Race, opts: GroupOptions) => {
    Object.defineProperty(race, "group_options", {
      value: opts,
      writable: true,
      configurable: true,
    });
  };

  const setStepUp = (race: Race, stepUp: number) => {
    Object.defineProperty(race, "step_up", {
      value: stepUp,
      writable: true,
      configurable: true,
    });
  };

  const createHeat = (
    heatNum: number,
    group: number,
    step: number,
    drivers: { lane: number; participant: RaceParticipant }[] = [],
  ): Heat => {
    const heat = new Heat(`heat-${heatNum}`, heatNum, [], []);
    heat.group = group;
    heat.step = step;
    heat.heatDrivers = drivers.map(
      (d) =>
        new DriverHeatData(
          `dhd-${heatNum}-${d.lane}`,
          d.participant,
          d.lane,
          d.participant.driver,
        ),
    );
    return heat;
  };

  describe("getAvailableGroups", () => {
    it("should return an empty array if group_options is disabled or undefined", () => {
      const race = new Race("r1", "Test Race", {} as any);
      expect(getAvailableGroups(race, [], mockTranslationService)).toEqual([]);
      expect(getAvailableGroups(undefined, [], mockTranslationService)).toEqual(
        [],
      );
    });

    it("should return groups with custom names when configured", () => {
      const race = new Race("r1", "Group Race", {} as any);
      setGroupOptions(
        race,
        new GroupOptions(true, 2, false, true, false, true, 0, [
          "Amateurs",
          "Pros",
        ]),
      );
      const heats = [
        createHeat(1, 0, 1),
        createHeat(2, 0, 1),
        createHeat(3, 1, 1),
      ];

      const groups = getAvailableGroups(race, heats, mockTranslationService);
      expect(groups.length).toBe(2);
      expect(groups[0]).toEqual({ index: 0, name: "Amateurs", count: 2 });
      expect(groups[1]).toEqual({ index: 1, name: "Pros", count: 1 });
    });

    it("should fallback to RD_FILTER_GROUP_N when custom name is missing", () => {
      const race = new Race("r1", "Group Race", {} as any);
      setGroupOptions(race, new GroupOptions(true, 2));
      const heats = [createHeat(1, 0, 1), createHeat(2, 1, 1)];

      const groups = getAvailableGroups(race, heats, mockTranslationService);
      expect(groups[0].name).toBe("Group 1");
      expect(groups[1].name).toBe("Group 2");
    });
  });

  describe("getAvailableSteps", () => {
    it("should return empty array when heats array is empty", () => {
      expect(getAvailableSteps([], mockTranslationService)).toEqual([]);
    });

    it("should return unique sorted steps with counts", () => {
      const heats = [
        createHeat(1, 0, 1),
        createHeat(2, 0, 1),
        createHeat(3, 0, 2),
        createHeat(4, 0, 3),
        createHeat(5, 0, 2),
      ];

      const steps = getAvailableSteps(heats, mockTranslationService);
      expect(steps.length).toBe(3);
      expect(steps[0]).toEqual({ step: 1, name: "Step 1", count: 2 });
      expect(steps[1]).toEqual({ step: 2, name: "Step 2", count: 2 });
      expect(steps[2]).toEqual({ step: 3, name: "Step 3", count: 1 });
    });
  });

  describe("filterHeatsByGroupAndStep", () => {
    const heats = [
      createHeat(1, 0, 1),
      createHeat(2, 1, 1),
      createHeat(3, 0, 2),
      createHeat(4, 1, 2),
    ];

    it("should return all heats when both filters are null", () => {
      expect(filterHeatsByGroupAndStep(heats, null, null).length).toBe(4);
    });

    it("should filter by group only", () => {
      const res = filterHeatsByGroupAndStep(heats, 0, null);
      expect(res.length).toBe(2);
      expect(res.every((h) => h.group === 0)).toBeTrue();
    });

    it("should filter by step only", () => {
      const res = filterHeatsByGroupAndStep(heats, null, 2);
      expect(res.length).toBe(2);
      expect(res.every((h) => h.step === 2)).toBeTrue();
    });

    it("should filter by both group and step concurrently", () => {
      const res = filterHeatsByGroupAndStep(heats, 1, 2);
      expect(res.length).toBe(1);
      expect(res[0].heatNumber).toBe(4);
    });

    it("should return empty array if no heats match", () => {
      expect(filterHeatsByGroupAndStep(heats, 5, 5).length).toBe(0);
    });
  });

  describe("isHeatIncompatibleWithDraggedParticipant", () => {
    it("should return false when participant is null or undefined", () => {
      const heat = createHeat(1, 0, 1);
      expect(
        isHeatIncompatibleWithDraggedParticipant(heat, null, [], false, false),
      ).toBeFalse();
    });

    it("should flag Step 1 heat as incompatible for a step-up participant", () => {
      const heat = createHeat(1, 0, 1);
      const stepUp = createParticipant("su1", "Step-Up 1", true, 1);
      expect(
        isHeatIncompatibleWithDraggedParticipant(
          heat,
          stepUp,
          [heat],
          true,
          false,
        ),
      ).toBeTrue();
    });

    it("should flag Step 2 heat as compatible for a step-up participant", () => {
      const heat = createHeat(2, 0, 2);
      const stepUp = createParticipant("su1", "Step-Up 1", true, 1);
      expect(
        isHeatIncompatibleWithDraggedParticipant(
          heat,
          stepUp,
          [heat],
          true,
          false,
        ),
      ).toBeFalse();
    });

    it("should flag heat of different group as incompatible for driver assigned to another group", () => {
      const driver = createParticipant("p1", "Alice");
      const heatGroup0 = createHeat(1, 0, 1, [
        { lane: 0, participant: driver },
      ]);
      const heatGroup1 = createHeat(2, 1, 1);

      expect(
        isHeatIncompatibleWithDraggedParticipant(
          heatGroup1,
          driver,
          [heatGroup0, heatGroup1],
          false,
          true,
        ),
      ).toBeTrue();

      expect(
        isHeatIncompatibleWithDraggedParticipant(
          heatGroup0,
          driver,
          [heatGroup0, heatGroup1],
          false,
          true,
        ),
      ).toBeFalse();
    });

    it("should allow unassigned driver in any group heat", () => {
      const newDriver = createParticipant("p-new", "Bob");
      const heatGroup1 = createHeat(2, 1, 1);
      expect(
        isHeatIncompatibleWithDraggedParticipant(
          heatGroup1,
          newDriver,
          [heatGroup1],
          false,
          true,
        ),
      ).toBeFalse();
    });
  });

  describe("getHeatValidationWarning", () => {
    it("should return warning when step-up driver is placed in step 1", () => {
      const stepUp = createParticipant("su1", "Step-Up 1", true, 1);
      const heat = createHeat(1, 0, 1, [{ lane: 0, participant: stepUp }]);
      const warn = getHeatValidationWarning(
        heat,
        [heat],
        undefined,
        true,
        mockTranslationService,
      );
      expect(warn).toBe("Step-up in step 1 error");
    });

    it("should return warning when step 2 heat does not have expected step-up driver count", () => {
      const race = new Race("r1", "Step-Up Race", {} as any);
      setStepUp(race, 2);
      const heat = createHeat(2, 0, 2, [
        {
          lane: 0,
          participant: createParticipant("su1", "Step-Up 1", true, 1),
        },
      ]);
      const warn = getHeatValidationWarning(
        heat,
        [heat],
        race,
        true,
        mockTranslationService,
      );
      expect(warn).toContain("Count mismatch: expected 2, found 1");
    });

    it("should return warning when driver is in heats across different groups", () => {
      const race = new Race("r1", "Group Race", {} as any);
      setGroupOptions(race, new GroupOptions(true, 2));
      const driver = createParticipant("p1", "Charlie");
      const heat1 = createHeat(1, 0, 1, [{ lane: 0, participant: driver }]);
      const heat2 = createHeat(2, 1, 1, [{ lane: 0, participant: driver }]);

      const warn = getHeatValidationWarning(
        heat1,
        [heat1, heat2],
        race,
        false,
        mockTranslationService,
      );
      expect(warn).toContain("Charlie");
    });

    it("should return null for valid heat", () => {
      const race = new Race("r1", "Group Race", {} as any);
      setGroupOptions(race, new GroupOptions(true, 2));
      const driver = createParticipant("p1", "Charlie");
      const heat = createHeat(1, 0, 1, [{ lane: 0, participant: driver }]);

      const warn = getHeatValidationWarning(
        heat,
        [heat],
        race,
        false,
        mockTranslationService,
      );
      expect(warn).toBeNull();
    });
  });

  describe("getParticipantGroupBadge and getParticipantStepBadge", () => {
    it("should return group badge and step badge when driver is in heat", () => {
      const race = new Race("r1", "Race", {} as any);
      setGroupOptions(
        race,
        new GroupOptions(true, 2, false, true, false, true, 0, ["Amateurs"]),
      );
      const driver = createParticipant("p1", "David");
      const heat = createHeat(1, 0, 2, [{ lane: 0, participant: driver }]);

      expect(getParticipantGroupBadge(driver, [heat], race)).toBe("Amateurs");
      expect(getParticipantStepBadge(driver, [heat], true)).toBe("S2");
    });

    it("should return null if driver is not in any heat", () => {
      const race = new Race("r1", "Race", {} as any);
      setGroupOptions(race, new GroupOptions(true, 2));
      const driver = createParticipant("p1", "David");
      expect(getParticipantGroupBadge(driver, [], race)).toBeNull();
      expect(getParticipantStepBadge(driver, [], true)).toBeNull();
    });
  });

  describe("Drag predicates", () => {
    it("canEnterHeatsGridPredicate should accept only heat objects", () => {
      expect(
        canEnterHeatsGridPredicate({ data: { heatDrivers: [] } } as any),
      ).toBeTrue();
      expect(
        canEnterHeatsGridPredicate({ data: { name: "Driver" } } as any),
      ).toBeFalse();
    });

    it("canEnterDriverDropListPredicate should accept drivers and reject heat objects", () => {
      expect(
        canEnterDriverDropListPredicate({ data: { name: "Driver" } } as any),
      ).toBeTrue();
      expect(
        canEnterDriverDropListPredicate({ data: { heatDrivers: [] } } as any),
      ).toBeFalse();
    });
  });

  describe("getCustomGroupName", () => {
    it("should return custom group name if configured", () => {
      const race = new Race("r1", "Race", {} as any);
      setGroupOptions(
        race,
        new GroupOptions(true, 2, false, true, false, true, 0, [
          "Group Alpha",
          "Group Beta",
        ]),
      );
      expect(getCustomGroupName(race, 0)).toBe("Group Alpha");
      expect(getCustomGroupName(race, 1)).toBe("Group Beta");
      expect(getCustomGroupName(race, 2)).toBe("");
    });

    it("should return empty string if race or group options are missing", () => {
      expect(getCustomGroupName(undefined, 0)).toBe("");
      const raceNoGroups = new Race("r2", "No Groups", {} as any);
      expect(getCustomGroupName(raceNoGroups, 0)).toBe("");
    });
  });

  describe("isStepUpEnabledHelper", () => {
    it("should return true if race has step_up configured", () => {
      const race = new Race("r1", "Race", {} as any);
      setStepUp(race, 2);
      expect(isStepUpEnabledHelper(race, [])).toBeTrue();
    });

    it("should return true if any heat has step > 1 or isStepUpBoundary", () => {
      const race = new Race("r1", "Race", {} as any);
      const heat1 = createHeat(1, 0, 1);
      const heat2 = createHeat(2, 0, 2);
      expect(isStepUpEnabledHelper(race, [heat1, heat2])).toBeTrue();

      const heat3 = createHeat(3, 0, 1);
      heat3.isStepUpBoundary = true;
      expect(isStepUpEnabledHelper(race, [heat1, heat3])).toBeTrue();
    });

    it("should return false if step_up is 0 and no heats have step > 1 or boundary", () => {
      const race = new Race("r1", "Race", {} as any);
      const heat1 = createHeat(1, 0, 1);
      expect(isStepUpEnabledHelper(race, [heat1])).toBeFalse();
      expect(isStepUpEnabledHelper(undefined, [heat1])).toBeFalse();
    });
  });

  describe("resolveDraggedParticipant", () => {
    it("should return null for null or undefined", () => {
      expect(resolveDraggedParticipant(null)).toBeNull();
      expect(resolveDraggedParticipant(undefined)).toBeNull();
    });

    it("should return the participant if already a RaceParticipant", () => {
      const p = createParticipant("p1", "Driver One");
      expect(resolveDraggedParticipant(p)).toBe(p);
    });

    it("should convert a Driver to a RaceParticipant", () => {
      const driver = new Driver("d1", "Test Driver");
      const resolved = resolveDraggedParticipant(driver);
      expect(resolved).toBeTruthy();
      expect(resolved?.driver?.name).toBe("Test Driver");
      expect(resolved?.driver?.entity_id).toBe("d1");
    });

    it("should convert a Team to a RaceParticipant", () => {
      const team = new Team("ta", "Team A", undefined, []);
      const resolved = resolveDraggedParticipant(team);
      expect(resolved).toBeTruthy();
      expect(resolved?.team?.name).toBe("Team A");
      expect(resolved?.team?.entity_id).toBe("ta");
    });

    it("should return null for unknown object types", () => {
      expect(resolveDraggedParticipant({ foo: "bar" } as any)).toBeNull();
    });
  });

  describe("Heat state operations", () => {
    it("addHeatToState should append a heat with group and step", () => {
      const heats: Heat[] = [];
      const newHeat = addHeatToState(heats, 2, 3);
      expect(heats.length).toBe(1);
      expect(newHeat.heatNumber).toBe(1);
      expect(newHeat.group).toBe(2);
      expect(newHeat.step).toBe(3);
    });

    it("removeHeatFromState should remove heat and renumber heats", () => {
      const heat1 = createHeat(1, 0, 1);
      const heat2 = createHeat(2, 0, 1);
      const heats = [heat1, heat2];

      const removed = removeHeatFromState(heats, 0, () => false);
      expect(removed).toBeTrue();
      expect(heats.length).toBe(1);
      expect(heats[0].objectId).toBe("heat-2");
      expect(heats[0].heatNumber).toBe(1);
    });

    it("removeHeatFromState should reject invalid index or started heat", () => {
      const heat1 = createHeat(1, 0, 1);
      const heats = [heat1];

      expect(removeHeatFromState(heats, -1, () => false)).toBeFalse();
      expect(removeHeatFromState(heats, 5, () => false)).toBeFalse();
      expect(removeHeatFromState(heats, 0, () => true)).toBeFalse();
      expect(heats.length).toBe(1);
    });

    it("removeDriverFromHeatState should remove driver from specific lane", () => {
      const p1 = createParticipant("p1", "Driver One");
      const heat1 = createHeat(1, 0, 1, [{ lane: 0, participant: p1 }]);
      const heats = [heat1];

      const removed = removeDriverFromHeatState(heats, 0, 0, () => false);
      expect(removed).toBeTrue();
      expect(heat1.heatDrivers.length).toBe(0);
    });

    it("removeDriverFromHeatState should reject if heat started or not found", () => {
      const p1 = createParticipant("p1", "Driver One");
      const heat1 = createHeat(1, 0, 1, [{ lane: 0, participant: p1 }]);
      const heats = [heat1];

      expect(removeDriverFromHeatState(heats, 9, 0, () => false)).toBeFalse();
      expect(removeDriverFromHeatState(heats, 0, 0, () => true)).toBeFalse();
      expect(removeDriverFromHeatState(heats, 0, 3, () => false)).toBeFalse();
    });
  });

  describe("Heat helpers", () => {
    it("cloneInitialHeats should clone heats and preserve originalHeatNumber", () => {
      const heat1 = createHeat(1, 0, 1);
      const cloned = cloneInitialHeats([heat1]);
      expect(cloned.length).toBe(1);
      expect(cloned[0].originalHeatNumber).toBe(1);
    });

    it("getDriverHeatDataInLaneHelper should find heat driver data", () => {
      const p1 = createParticipant("p1", "Driver One");
      const heat1 = createHeat(1, 0, 1, [{ lane: 1, participant: p1 }]);
      const heats = [heat1];

      const dhd = getDriverHeatDataInLaneHelper(heats, 0, 1);
      expect(dhd).toBeTruthy();
      expect(dhd?.participant?.driver?.name).toBe("Driver One");

      expect(getDriverHeatDataInLaneHelper(heats, 0, 2)).toBeNull();
      expect(getDriverHeatDataInLaneHelper(heats, 5, 1)).toBeNull();
    });

    it("mapRegeneratedHeatsFromProto should map proto heats", () => {
      const protoHeat: IHeat = {
        heatNumber: 1,
        heatDrivers: [],
      };
      const result = mapRegeneratedHeatsFromProto([protoHeat]);
      expect(result.length).toBe(1);
      expect(result[0].heatNumber).toBe(1);
      expect(result[0].originalHeatNumber).toBe(1);
    });

    it("loadAndRegisterDrivers and loadAndRegisterTeams should parse and register", () => {
      const drivers = loadAndRegisterDrivers([
        { entity_id: "d1", name: "Driver 1" },
      ]);
      expect(drivers.length).toBe(1);
      expect(drivers[0].name).toBe("Driver 1");

      const teams = loadAndRegisterTeams([
        { entity_id: "t1", name: "Team 1", driverIds: ["d1"] },
      ]);
      expect(teams.length).toBe(1);
      expect(teams[0].name).toBe("Team 1");
    });

    it("buildSavePayload should convert heats and participants to proto", () => {
      const heat1 = createHeat(1, 0, 1);
      const p1 = createParticipant("p1", "Driver 1");
      const payload = buildSavePayload([heat1], undefined, () => false, [p1]);
      expect(payload.protoHeats.length).toBe(1);
      expect(payload.protoParticipants.length).toBe(1);
    });
  });

  describe("HeatDragDropController", () => {
    let controller: HeatDragDropController;

    beforeEach(() => {
      controller = new HeatDragDropController();
    });

    it("should initialize with default states", () => {
      expect(controller.isDraggingHeat).toBeFalse();
      expect(controller.hoveredHeatIdx).toBe(-1);
      expect(controller.heatDropAction).toBeNull();
      expect(controller.activeInsertSlot).toBe(-1);
    });

    it("should handle onDragStarted and onDragEnded", () => {
      controller.onDragStarted();
      expect(controller.isDraggingHeat).toBeTrue();

      controller.onDragEnded();
      expect(controller.isDraggingHeat).toBeFalse();
      expect(controller.hoveredHeatIdx).toBe(-1);
      expect(controller.heatDropAction).toBeNull();
    });

    it("should handle onHover", () => {
      controller.onDragStarted();
      const heats = [createHeat(1, 0, 1), createHeat(2, 0, 1)];
      controller.onHover(1, heats, -1, () => false);
      expect(controller.hoveredHeatIdx).toBe(1);
      expect(controller.heatDropAction).toEqual(
        jasmine.objectContaining({ type: "swap", targetIndex: 1 }),
      );
    });

    it("should handle drop when action is null", () => {
      const heats = [createHeat(1, 0, 1)];
      const result = controller.handleDrop(
        { item: { data: heats[0] } } as any,
        heats,
        -1,
        () => false,
      );
      expect(result.reordered).toBeFalse();
      expect(result.newHeats).toBe(heats);
    });

    it("should handle drop with swap action", () => {
      controller.onDragStarted();
      const heat1 = createHeat(1, 0, 1);
      const heat2 = createHeat(2, 0, 1);
      const heats = [heat1, heat2];
      controller.heatDropAction = { type: "swap", targetIndex: 1 };

      const result = controller.handleDrop(
        { item: { data: heat1 } } as any,
        heats,
        -1,
        () => false,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats[0].objectId).toBe(heat2.objectId);
      expect(result.newHeats[1].objectId).toBe(heat1.objectId);
    });

    it("should correctly report isHeatSwapHighlight", () => {
      const heat1 = createHeat(1, 0, 1);
      const heat2 = createHeat(2, 0, 1);
      expect(controller.isHeatSwapHighlight(0, heat1, () => false)).toBeFalse();

      controller.onDragStarted();
      controller.heatDropAction = { type: "swap", targetIndex: 0 };
      expect(controller.isHeatSwapHighlight(0, heat1, () => false)).toBeTrue();
      expect(controller.isHeatSwapHighlight(1, heat2, () => false)).toBeFalse();
      expect(controller.isHeatSwapHighlight(0, heat1, () => true)).toBeFalse();
    });
  });
});
