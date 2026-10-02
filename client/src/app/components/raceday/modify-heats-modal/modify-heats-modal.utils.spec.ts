import { Driver } from "@app/models/driver";
import { Heat } from "@app/race/heat";

import {
  areModifyHeatsStatesEqual,
  buildDropListConnections,
  calculateHeatDropAction,
  cloneHeat,
  createParticipantFromDriver,
  executeHeatReorder,
  filterDatabaseParticipants,
  filterDriverPool,
  HeatCardBounds,
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
        "heat-0-lane-0",
        "heat-0-lane-1",
        "heat-1-lane-0",
        "heat-1-lane-1",
      ]);
    });
  });
});
