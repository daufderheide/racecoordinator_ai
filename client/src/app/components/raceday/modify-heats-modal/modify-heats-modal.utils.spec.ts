import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

import {
  allocateHighlightColor,
  areModifyHeatsStatesEqual,
  assignStepNumbers,
  buildDropListConnections,
  calculateHeatDropAction,
  cloneHeat,
  convertHeatsToProto,
  convertParticipantsToProto,
  createParticipantFromDriver,
  DRIVER_HIGHLIGHT_PALETTE,
  executeHeatReorder,
  filterDatabaseParticipants,
  filterDriverPool,
  getModifyHeatsValidationError,
  getParticipantKey,
  getParticipantName,
  HeatCardBounds,
  inferBoundariesFromDrivers,
  isPlaceholderParticipant,
  isStepUpParticipant,
} from "./modify-heats-modal.utils";

describe("modify-heats-modal.utils", () => {
  describe("calculateHeatDropAction", () => {
    const createBounds = (
      index: number,
      left: number,
      width: number,
      started = false,
      top = 100,
    ): HeatCardBounds => ({
      index,
      rect: {
        left,
        right: left + width,
        top,
        bottom: top + 380,
        width,
        height: 380,
      },
      started,
    });

    it("should return null for empty cards list", () => {
      expect(calculateHeatDropAction(100, 100, [])).toBeNull();
    });

    it("should return insert at slot 0 when pointer is to the left of the first card", () => {
      const cards = [createBounds(0, 100, 240), createBounds(1, 356, 240)];
      const action = calculateHeatDropAction(50, 200, cards, -1);
      expect(action).toEqual({ type: "insert", slotIndex: 0 });
    });

    it("should return null for slot 0 if heat 0 is started", () => {
      const cards = [
        createBounds(0, 100, 240, true),
        createBounds(1, 356, 240, false),
      ];
      const action = calculateHeatDropAction(50, 200, cards, 0);
      expect(action).toBeNull();
    });

    it("should return insert before card when pointer is in left 20% of card", () => {
      // Card 1: left: 356, width: 240. 20% is 48px (356 to 404).
      const cards = [createBounds(0, 100, 240), createBounds(1, 356, 240)];
      const action = calculateHeatDropAction(370, 200, cards, -1);
      expect(action).toEqual({ type: "insert", slotIndex: 1 });
    });

    it("should return swap when pointer is in middle 60% of card", () => {
      // Card 1: left: 356, width: 240. Middle 60% is 404 to 548.
      const cards = [createBounds(0, 100, 240), createBounds(1, 356, 240)];
      const action = calculateHeatDropAction(450, 200, cards, -1);
      expect(action).toEqual({ type: "swap", targetIndex: 1 });
    });

    it("should return null for swap if card is started", () => {
      const cards = [
        createBounds(0, 100, 240, true),
        createBounds(1, 356, 240, false),
      ];
      // Pointer in middle of started card 0
      const action = calculateHeatDropAction(200, 200, cards, 0);
      expect(action).toBeNull();
    });

    it("should return insert after card when pointer is in right 20% of card", () => {
      // Card 0: left: 100, width: 240. Right 20% is > 292.
      const cards = [createBounds(0, 100, 240), createBounds(1, 356, 240)];
      const action = calculateHeatDropAction(310, 200, cards, -1);
      expect(action).toEqual({ type: "insert", slotIndex: 1 });
    });

    it("should return insert between cards when pointer is in the gap", () => {
      // Gap between card 0 (right: 340) and card 1 (left: 356)
      const cards = [createBounds(0, 100, 240), createBounds(1, 356, 240)];
      const action = calculateHeatDropAction(348, 200, cards, -1);
      expect(action).toEqual({ type: "insert", slotIndex: 1 });
    });

    it("should return insert after last card when pointer is to the right of the row", () => {
      // Card 1 right is 596
      const cards = [createBounds(0, 100, 240), createBounds(1, 356, 240)];
      const action = calculateHeatDropAction(650, 200, cards, -1);
      expect(action).toEqual({ type: "insert", slotIndex: 2 });
    });

    it("should correctly handle multi-row layout and pick matching row", () => {
      // Row 1: cards 0, 1 at top: 100
      // Row 2: cards 2, 3 at top: 500
      const cards = [
        createBounds(0, 100, 240, false, 100),
        createBounds(1, 356, 240, false, 100),
        createBounds(2, 100, 240, false, 500),
        createBounds(3, 356, 240, false, 500),
      ];

      // Pointer on Row 2 over center of card 3 (left: 356 + 100 = 456, top: 600)
      const action = calculateHeatDropAction(456, 600, cards, -1);
      expect(action).toEqual({ type: "swap", targetIndex: 3 });

      // Pointer on Row 2 between card 2 and card 3
      const actionGap = calculateHeatDropAction(348, 600, cards, -1);
      expect(actionGap).toEqual({ type: "insert", slotIndex: 3 });
    });
  });

  describe("executeHeatReorder", () => {
    let heats: Heat[];

    beforeEach(() => {
      heats = [
        new Heat("h1", 1, [], [], false),
        new Heat("h2", 2, [], [], false),
        new Heat("h3", 3, [], [], false),
        new Heat("h4", 4, [], [], false),
      ];
    });

    it("should swap two heats and update heat numbers", () => {
      const result = executeHeatReorder(
        heats,
        0,
        { type: "swap", targetIndex: 2 },
        -1,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats.map((h) => h.objectId)).toEqual([
        "h3",
        "h2",
        "h1",
        "h4",
      ]);
      expect(result.newHeats.map((h) => h.heatNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should return reordered false if swapping with itself", () => {
      const result = executeHeatReorder(
        heats,
        1,
        { type: "swap", targetIndex: 1 },
        -1,
      );
      expect(result.reordered).toBeFalse();
    });

    it("should return reordered false if swapping with a started heat", () => {
      heats[0].started = true;
      const result = executeHeatReorder(
        heats,
        2,
        { type: "swap", targetIndex: 0 },
        0,
      );
      expect(result.reordered).toBeFalse();
    });

    it("should return reordered false if the dragged heat itself is started", () => {
      heats[0].started = true;
      const result = executeHeatReorder(
        heats,
        0,
        { type: "swap", targetIndex: 2 },
        0,
      );
      expect(result.reordered).toBeFalse();
    });

    it("should move heat backward (drag h3 to slot 1 between h1 and h2)", () => {
      // fromIdx = 2 (h3). slotIndex = 1 (between h1 and h2)
      const result = executeHeatReorder(
        heats,
        2,
        { type: "insert", slotIndex: 1 },
        -1,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats.map((h) => h.objectId)).toEqual([
        "h1",
        "h3",
        "h2",
        "h4",
      ]);
      expect(result.newHeats.map((h) => h.heatNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should move heat forward (drag h1 to slot 3 between h3 and h4)", () => {
      // fromIdx = 0 (h1). slotIndex = 3 (between h3 and h4)
      const result = executeHeatReorder(
        heats,
        0,
        { type: "insert", slotIndex: 3 },
        -1,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats.map((h) => h.objectId)).toEqual([
        "h2",
        "h3",
        "h1",
        "h4",
      ]);
      expect(result.newHeats.map((h) => h.heatNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should move heat to the very beginning (slot 0)", () => {
      // fromIdx = 3 (h4). slotIndex = 0
      const result = executeHeatReorder(
        heats,
        3,
        { type: "insert", slotIndex: 0 },
        -1,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats.map((h) => h.objectId)).toEqual([
        "h4",
        "h1",
        "h2",
        "h3",
      ]);
      expect(result.newHeats.map((h) => h.heatNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should move heat to the very end (slot 4)", () => {
      // fromIdx = 0 (h1). slotIndex = 4
      const result = executeHeatReorder(
        heats,
        0,
        { type: "insert", slotIndex: 4 },
        -1,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats.map((h) => h.objectId)).toEqual([
        "h2",
        "h3",
        "h4",
        "h1",
      ]);
      expect(result.newHeats.map((h) => h.heatNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should return reordered false if dropped where it already was", () => {
      // fromIdx = 1 (h2). slotIndex = 1 (before h2) -> targetIdx = 1 -> no change
      const result1 = executeHeatReorder(
        heats,
        1,
        { type: "insert", slotIndex: 1 },
        -1,
      );
      expect(result1.reordered).toBeFalse();

      // fromIdx = 1 (h2). slotIndex = 2 (after h2) -> targetIdx = 1 -> no change
      const result2 = executeHeatReorder(
        heats,
        1,
        { type: "insert", slotIndex: 2 },
        -1,
      );
      expect(result2.reordered).toBeFalse();
    });

    it("should reject insert at slot 0 when heat 0 is started", () => {
      heats[0].started = true;
      const result = executeHeatReorder(
        heats,
        2,
        { type: "insert", slotIndex: 0 },
        0,
      );
      expect(result.reordered).toBeFalse();
    });

    it("should allow insert at slot 1 when heat 0 is started", () => {
      heats[0].started = true;
      const result = executeHeatReorder(
        heats,
        2,
        { type: "insert", slotIndex: 1 },
        0,
      );
      expect(result.reordered).toBeTrue();
      expect(result.newHeats.map((h) => h.objectId)).toEqual([
        "h1",
        "h3",
        "h2",
        "h4",
      ]);
      expect(result.newHeats[0].started).toBeTrue();
    });
  });

  describe("cloneHeat", () => {
    it("should preserve originalHeatNumber when cloned", () => {
      const h1 = new Heat("h1", 2, [], [], false);
      h1.originalHeatNumber = 1;
      const cloned = cloneHeat(h1);
      expect(cloned.originalHeatNumber).toBe(1);
      expect(cloned.heatNumber).toBe(2);
      expect(cloned.objectId).toBe("h1");
    });

    it("should preserve undefined originalHeatNumber for new heats", () => {
      const hNew = new Heat("new-heat-123", 5, [], [], false);
      const cloned = cloneHeat(hNew);
      expect(cloned.originalHeatNumber).toBeUndefined();
    });

    it("should filter out empty placeholder drivers when cloning heat", () => {
      const pReal = createParticipantFromDriver(
        new Driver("d1", "Real", "Real"),
      );
      const pEmpty = createParticipantFromDriver(
        new Driver("EMPTY_LANE", "Empty", "Empty"),
      );
      const dhdReal = new DriverHeatData("dhd1", pReal, 0);
      const dhdEmpty = new DriverHeatData("dhd2", pEmpty, 1);
      const heat = new Heat("h1", 1, [dhdReal, dhdEmpty], [], false);

      const cloned = cloneHeat(heat);
      expect(cloned.heatDrivers.length).toBe(1);
      expect(cloned.heatDrivers[0].laneIndex).toBe(0);
      expect(cloned.heatDrivers[0].participant.driver.name).toBe("Real");
    });

    it("should preserve step and isStepUpBoundary when cloned", () => {
      const h = new Heat("h1", 1, [], [], false);
      h.step = 3;
      h.isStepUpBoundary = true;
      const cloned = cloneHeat(h);
      expect(cloned.step).toBe(3);
      expect(cloned.isStepUpBoundary).toBeTrue();
    });
  });

  describe("isPlaceholderParticipant", () => {
    it("should return true for null or undefined", () => {
      expect(isPlaceholderParticipant(null)).toBeTrue();
      expect(isPlaceholderParticipant(undefined)).toBeTrue();
    });

    it("should return true for participant with empty driver and no team", () => {
      const pEmpty = createParticipantFromDriver(
        new Driver("EMPTY_LANE", "Empty", "Empty"),
      );
      expect(isPlaceholderParticipant(pEmpty)).toBeTrue();
    });

    it("should return false for participant with real driver", () => {
      const pReal = createParticipantFromDriver(
        new Driver("d1", "Dave", "Dave"),
      );
      expect(isPlaceholderParticipant(pReal)).toBeFalse();
    });

    it("should return false for team participant even if driver is empty", () => {
      const team = new Team("t1", "Team 1");
      const pTeam = new RaceParticipant(
        "rp-team",
        new Driver("EMPTY_LANE", "Empty", "Empty"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        100,
        0,
        0,
        team,
      );
      expect(isPlaceholderParticipant(pTeam)).toBeFalse();
    });
  });

  describe("areModifyHeatsStatesEqual", () => {
    it("should return true for identical state", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      const p1 = createParticipantFromDriver(new Driver("d1", "D1", "D1"));
      const stateA = { heats: [h1], participants: [p1] };
      const stateB = { heats: [cloneHeat(h1)], participants: [p1] };
      expect(areModifyHeatsStatesEqual(stateA, stateB)).toBeTrue();
    });

    it("should return false if heat order differs", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      const h2 = new Heat("h2", 2, [], [], false);
      const p1 = createParticipantFromDriver(new Driver("d1", "D1", "D1"));
      const stateA = { heats: [h1, h2], participants: [p1] };
      const stateB = { heats: [h2, h1], participants: [p1] };
      expect(areModifyHeatsStatesEqual(stateA, stateB)).toBeFalse();
    });
  });

  describe("filterDriverPool", () => {
    it("should filter out placeholder drivers", () => {
      const pReal = createParticipantFromDriver(new Driver("d1", "D1", "D1"));
      const pEmpty = createParticipantFromDriver(
        new Driver("EMPTY_LANE", "Empty", "Empty"),
      );
      const result = filterDriverPool([pReal, pEmpty]);
      expect(result.length).toBe(1);
      expect(result[0].driver.name).toBe("D1");
    });
  });

  describe("filterDatabaseParticipants", () => {
    it("should filter out drivers and teams already in participants", () => {
      const d1 = new Driver("d1", "Driver 1", "D1");
      const d2 = new Driver("d2", "Driver 2", "D2");
      const p1 = createParticipantFromDriver(d1);

      const result = filterDatabaseParticipants([p1], [d1, d2], []);
      expect(result.databaseDrivers.length).toBe(1);
      expect(result.databaseDrivers[0].entity_id).toBe("d2");
    });
  });

  describe("buildDropListConnections", () => {
    it("should generate correct drop list ids", () => {
      const ids = buildDropListConnections(2, 2);
      expect(ids).toEqual([
        "driver-pool",
        "database-drivers",
        "step-up-pool",
        "heat-0-lane-0",
        "heat-0-lane-1",
        "heat-1-lane-0",
        "heat-1-lane-1",
      ]);
    });
  });

  describe("getParticipantKey", () => {
    it("should return empty string for null or undefined", () => {
      expect(getParticipantKey(null)).toBe("");
      expect(getParticipantKey(undefined)).toBe("");
    });

    it("should return objectId when present", () => {
      const p = createParticipantFromDriver(new Driver("d1", "Driver 1", "D1"));
      p.objectId = "obj-123";
      expect(getParticipantKey(p)).toBe("obj-123");
    });

    it("should fall back to driver entity_id when objectId is empty", () => {
      const p = createParticipantFromDriver(new Driver("d1", "Driver 1", "D1"));
      p.objectId = "";
      expect(getParticipantKey(p)).toBe("d1");
    });
  });

  describe("allocateHighlightColor", () => {
    it("should have at least 10 unique colors in DRIVER_HIGHLIGHT_PALETTE", () => {
      expect(DRIVER_HIGHLIGHT_PALETTE.length).toBeGreaterThanOrEqual(10);
      const unique = new Set(
        DRIVER_HIGHLIGHT_PALETTE.map((c) => c.toLowerCase()),
      );
      expect(unique.size).toBe(DRIVER_HIGHLIGHT_PALETTE.length);
    });

    it("should allocate the first color in the palette when no colors are used", () => {
      const color = allocateHighlightColor(new Set());
      expect(color).toBe(DRIVER_HIGHLIGHT_PALETTE[0]);
    });

    it("should allocate the next unused color in the palette", () => {
      const used = new Set([DRIVER_HIGHLIGHT_PALETTE[0].toLowerCase()]);
      const color = allocateHighlightColor(used);
      expect(color).toBe(DRIVER_HIGHLIGHT_PALETTE[1]);
    });

    it("should be case-insensitive when checking used colors", () => {
      const used = new Set([DRIVER_HIGHLIGHT_PALETTE[0].toUpperCase()]);
      const color = allocateHighlightColor(used);
      expect(color).toBe(DRIVER_HIGHLIGHT_PALETTE[1]);
    });

    it("should dynamically generate distinct HSL colors when all palette colors are used", () => {
      const used = new Set(
        DRIVER_HIGHLIGHT_PALETTE.map((c) => c.toLowerCase()),
      );
      const genColor1 = allocateHighlightColor(used);
      expect(genColor1).toMatch(/^hsl\(\d+,\s*90%,\s*55%\)$/);
      expect(used.has(genColor1)).toBeFalse();

      used.add(genColor1.toLowerCase());
      const genColor2 = allocateHighlightColor(used);
      expect(genColor2).toMatch(/^hsl\(\d+,\s*90%,\s*55%\)$/);
      expect(genColor2).not.toBe(genColor1);
    });
  });

  describe("isStepUpParticipant", () => {
    it("should return false for null or undefined", () => {
      expect(isStepUpParticipant(null)).toBeFalse();
      expect(isStepUpParticipant(undefined)).toBeFalse();
    });

    it("should return true when isStepUp property is true", () => {
      const p = createParticipantFromDriver(new Driver("d1", "Driver 1", "D1"));
      p.isStepUp = true;
      expect(isStepUpParticipant(p)).toBeTrue();
    });

    it("should return true when driver entity_id starts with STEP_UP_", () => {
      const p = createParticipantFromDriver(
        new Driver("STEP_UP_0", "Step-Up 1", "SU1"),
      );
      expect(isStepUpParticipant(p)).toBeTrue();
    });

    it("should return false for regular driver", () => {
      const p = createParticipantFromDriver(new Driver("d1", "Driver 1", "D1"));
      expect(isStepUpParticipant(p)).toBeFalse();
    });
  });

  describe("convertHeatsToProto and convertParticipantsToProto", () => {
    it("should preserve step and isStepUpBoundary in convertHeatsToProto", () => {
      const h = new Heat("h1", 1, [], [], false);
      h.step = 2;
      h.isStepUpBoundary = true;
      const track = new Track({
        entity_id: "trk1",
        name: "Track",
        lanes: [{}, {}] as any,
      });

      const protos = convertHeatsToProto([h], track, () => false);
      expect(protos.length).toBe(1);
      expect(protos[0].step).toBe(2);
      expect(protos[0].isStepUpBoundary).toBeTrue();
    });

    it("should preserve isStepUp and stepUpIndex in convertParticipantsToProto", () => {
      const p = createParticipantFromDriver(
        new Driver("STEP_UP_0", "Step-Up 1", "SU1"),
      );
      p.isStepUp = true;
      p.stepUpIndex = 1;

      const protos = convertParticipantsToProto([p]);
      expect(protos.length).toBe(1);
      expect(protos[0].isStepUp).toBeTrue();
      expect(protos[0].stepUpIndex).toBe(1);
    });

    it("should return correct step-up participant name without off-by-one", () => {
      const p1 = createParticipantFromDriver(
        new Driver("STEP_UP_0", "Step-Up 1", "SU1"),
      );
      p1.isStepUp = true;
      p1.stepUpIndex = 1;

      const p2 = createParticipantFromDriver(
        new Driver("STEP_UP_1", "Step-Up 2", "SU2"),
      );
      p2.isStepUp = true;
      p2.stepUpIndex = 2;

      expect(getParticipantName(p1)).toBe("Step-Up 1");
      expect(getParticipantName(p2)).toBe("Step-Up 2");

      const mockTranslation: any = {
        translate: jasmine
          .createSpy("translate")
          .and.callFake(
            (key: string, params?: any) => `Translated Step-Up ${params?.n}`,
          ),
      };
      expect(getParticipantName(p1, mockTranslation)).toBe(
        "Translated Step-Up 1",
      );
      expect(getParticipantName(p2, mockTranslation)).toBe(
        "Translated Step-Up 2",
      );
    });
  });

  describe("getModifyHeatsValidationError step-up rules", () => {
    const mockTranslationService: any = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };

    it("should return null when step_up is 0", () => {
      const race = { step_up: 0 } as any;
      const h1 = new Heat("h1", 1, [], [], false);
      h1.step = 1;
      const error = getModifyHeatsValidationError(
        [h1],
        [h1],
        [],
        race,
        () => false,
        mockTranslationService,
      );
      expect(error).toBeNull();
    });

    it("should return error if Step 1 contains a step-up driver", () => {
      const race = { step_up: 1 } as any;
      const pStep = createParticipantFromDriver(
        new Driver("STEP_UP_0", "Step Up", "SU"),
      );
      pStep.isStepUp = true;
      const dhdStep = new DriverHeatData("dhd1", pStep, 0);

      const h1 = new Heat("h1", 1, [dhdStep], [], false);
      h1.step = 1;
      const h2 = new Heat("h2", 2, [], [], false);
      h2.step = 2;

      const error = getModifyHeatsValidationError(
        [h1, h2],
        [h1, h2],
        [pStep],
        race,
        () => false,
        mockTranslationService,
      );
      expect(error).toBe("RD_ERR_STEP_UP_IN_STEP_ONE");
    });

    it("should return error if Step 1 has fewer than 2 distinct drivers", () => {
      const race = { step_up: 1 } as any;
      const p1 = createParticipantFromDriver(
        new Driver("d1", "Driver 1", "D1"),
      );
      const dhd1 = new DriverHeatData("dhd1", p1, 0);

      const h1 = new Heat("h1", 1, [dhd1], [], false);
      h1.step = 1;
      const h2 = new Heat("h2", 2, [], [], false);
      h2.step = 2;

      const error = getModifyHeatsValidationError(
        [h1, h2],
        [h1, h2],
        [p1],
        race,
        () => false,
        mockTranslationService,
      );
      expect(error).toBe("RD_ERR_STEP_UP_BOTTOM_STEP_MIN_DRIVERS");
    });

    it("should return error if higher step heat does not match step_up count", () => {
      const race = { step_up: 1 } as any;
      const p1 = createParticipantFromDriver(
        new Driver("d1", "Driver 1", "D1"),
      );
      const p2 = createParticipantFromDriver(
        new Driver("d2", "Driver 2", "D2"),
      );
      const p3 = createParticipantFromDriver(
        new Driver("d3", "Driver 3", "D3"),
      );

      const h1 = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd1", p1, 0), new DriverHeatData("dhd2", p2, 1)],
        [],
        false,
      );
      h1.step = 1;

      // Higher step heat has no step-up driver (expected 1)
      const h2 = new Heat(
        "h2",
        2,
        [new DriverHeatData("dhd3", p3, 0)],
        [],
        false,
      );
      h2.step = 2;

      const error = getModifyHeatsValidationError(
        [h1, h2],
        [h1, h2],
        [p1, p2, p3],
        race,
        () => false,
        mockTranslationService,
      );
      expect(error).toBe("RD_ERR_STEP_UP_COUNT_MISMATCH");
    });

    it("should return null for valid multi-step configuration", () => {
      const race = { step_up: 1 } as any;
      const p1 = createParticipantFromDriver(
        new Driver("d1", "Driver 1", "D1"),
      );
      const p2 = createParticipantFromDriver(
        new Driver("d2", "Driver 2", "D2"),
      );
      const p3 = createParticipantFromDriver(
        new Driver("d3", "Driver 3", "D3"),
      );
      const pStep = createParticipantFromDriver(
        new Driver("STEP_UP_0", "Step Up", "SU"),
      );
      pStep.isStepUp = true;

      const h1 = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd1", p1, 0), new DriverHeatData("dhd2", p2, 1)],
        [],
        false,
      );
      h1.step = 1;

      const h2 = new Heat(
        "h2",
        2,
        [
          new DriverHeatData("dhd3", p3, 0),
          new DriverHeatData("dhd4", pStep, 1),
        ],
        [],
        false,
      );
      h2.step = 2;

      const error = getModifyHeatsValidationError(
        [h1, h2],
        [h1, h2],
        [p1, p2, p3, pStep],
        race,
        () => false,
        mockTranslationService,
      );
      expect(error).toBeNull();
    });
  });

  describe("inferBoundariesFromDrivers", () => {
    it("should not modify boundaries if any boundary is already set", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      h1.isStepUpBoundary = true;
      const h2 = new Heat("h2", 2, [], [], false);
      inferBoundariesFromDrivers([h1, h2]);
      expect(h1.isStepUpBoundary).toBeTrue();
      expect(h2.isStepUpBoundary).toBeFalsy();
    });

    it("should infer boundary when non-step-up heat is followed by step-up participant heat", () => {
      const pReg = createParticipantFromDriver(
        new Driver("d1", "Regular", "R1"),
      );
      const pStep = createParticipantFromDriver(
        new Driver("STEP_UP_0", "Step-Up", "SU"),
      );
      pStep.isStepUp = true;

      const h1 = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd1", pReg, 0)],
        [],
        false,
      );
      const h2 = new Heat(
        "h2",
        2,
        [new DriverHeatData("dhd2", pStep, 0)],
        [],
        false,
      );

      inferBoundariesFromDrivers([h1, h2]);
      expect(h1.isStepUpBoundary).toBeTrue();
      expect(h2.isStepUpBoundary).toBeFalsy();
    });

    it("should infer boundary when heat.step < nextHeat.step", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      h1.step = 1;
      const h2 = new Heat("h2", 2, [], [], false);
      h2.step = 2;

      inferBoundariesFromDrivers([h1, h2]);
      expect(h1.isStepUpBoundary).toBeTrue();
      expect(h2.isStepUpBoundary).toBeFalsy();
    });
  });

  describe("assignStepNumbers", () => {
    it("should not modify heats if stepUp <= 0", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      h1.step = 0;
      assignStepNumbers([h1], 0);
      expect(h1.step).toBe(0);
    });

    it("should assign step 1 to all heats when no boundary is set", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      const h2 = new Heat("h2", 2, [], [], false);
      const h3 = new Heat("h3", 3, [], [], false);

      assignStepNumbers([h1, h2, h3], 2);
      expect(h1.step).toBe(1);
      expect(h2.step).toBe(1);
      expect(h3.step).toBe(1);
    });

    it("should increment step after each boundary heat", () => {
      const h1 = new Heat("h1", 1, [], [], false);
      const h2 = new Heat("h2", 2, [], [], false);
      h2.isStepUpBoundary = true;
      const h3 = new Heat("h3", 3, [], [], false);
      const h4 = new Heat("h4", 4, [], [], false);
      h4.isStepUpBoundary = true;
      const h5 = new Heat("h5", 5, [], [], false);

      assignStepNumbers([h1, h2, h3, h4, h5], 2);
      expect(h1.step).toBe(1);
      expect(h2.step).toBe(1);
      expect(h3.step).toBe(2);
      expect(h4.step).toBe(2);
      expect(h5.step).toBe(3);
    });
  });
});
