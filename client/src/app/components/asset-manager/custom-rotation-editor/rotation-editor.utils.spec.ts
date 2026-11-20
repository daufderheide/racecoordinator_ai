import { CdkDragDrop } from "@angular/cdk/drag-drop";

import {
  adjustHeatLanes,
  buildHeatDropListIds,
  calculateMaxDriverAndStepUp,
  calculateWindowScale,
  generateStepUpDrivers,
  generateUniqueRotationAssetName,
  generateVirtualDrivers,
  getOriginalHeatDisplay,
  getRotationUnsavedReasons,
  handleRotationDrop,
  initializeRotationOriginalHeatNumbers,
  insertRotationSorted,
  isRotationNameUnique,
  restoreRotationsWithExpandedState,
  syncRotationDriverCounts,
} from "./rotation-editor.utils";
import { LocalRotation } from "./rotation-export.utils";

describe("rotation-editor.utils", () => {
  it("should generate virtual drivers and step-up drivers", () => {
    const vDrivers = generateVirtualDrivers(3);
    expect(vDrivers.length).toBe(3);
    expect(vDrivers[0]).toEqual({ id: 1, name: "Driver 1" });
    expect(vDrivers[2]).toEqual({ id: 3, name: "Driver 3" });

    const sDrivers = generateStepUpDrivers(2);
    expect(sDrivers.length).toBe(2);
    expect(sDrivers[0]).toEqual({ id: -1, stepUpIndex: 1, name: "Step-Up 1" });
    expect(sDrivers[1]).toEqual({ id: -2, stepUpIndex: 2, name: "Step-Up 2" });
  });

  it("should build heat drop list IDs including expanded rotations", () => {
    const rotations: LocalRotation[] = [
      {
        isExpanded: true,
        heats: [{ driverIndices: [0, 0] }],
      },
      {
        isExpanded: false,
        heats: [{ driverIndices: [0, 0] }],
      },
    ];

    const ids = buildHeatDropListIds(rotations, 2);
    expect(ids).toContain("driver-pool");
    expect(ids).toContain("step-up-pool");
    expect(ids).toContain("rot-0-heat-0-lane-0");
    expect(ids).toContain("rot-0-heat-0-lane-1");
    expect(ids).not.toContain("rot-1-heat-0-lane-0");
  });

  it("should adjust heat lanes when number of lanes changes", () => {
    const rotations: LocalRotation[] = [
      {
        heats: [{ driverIndices: [1, 2] }],
      },
    ];

    // Expand to 4 lanes
    adjustHeatLanes(rotations, 4);
    expect(rotations[0].heats?.[0]?.driverIndices).toEqual([1, 2, 0, 0]);

    // Shrink to 3 lanes
    adjustHeatLanes(rotations, 3);
    expect(rotations[0].heats?.[0]?.driverIndices).toEqual([1, 2, 0]);
  });

  it("should generate unique rotation asset names", () => {
    const assets = [
      { type: "custom_rotation", name: "New Custom Rotation 1" },
      { type: "custom_rotation", name: "New Custom Rotation 2" },
    ] as any[];

    const unique = generateUniqueRotationAssetName(
      "New Custom Rotation",
      assets,
    );
    expect(unique).toBe("New Custom Rotation 3");
  });

  describe("handleRotationDrop", () => {
    it("should handle drop from driver-pool or step-up-pool to lane", () => {
      const rotations: LocalRotation[] = [
        {
          heats: [{ driverIndices: [0, 0, 0, 0] }],
        },
      ];

      const event = {
        previousContainer: { id: "step-up-pool" },
        container: { id: "rot-0-heat-0-lane-2" },
        item: { data: { id: -1 } },
      } as unknown as CdkDragDrop<any>;

      const changed = handleRotationDrop(event, rotations);
      expect(changed).toBeTrue();
      expect(rotations[0].heats?.[0]?.driverIndices?.[2]).toBe(-1);
    });

    it("should handle swap between two lanes in same rotation", () => {
      const rotations: LocalRotation[] = [
        {
          heats: [
            { driverIndices: [1, 2, 3, 4] },
            { driverIndices: [5, 6, 7, 8] },
          ],
        },
      ];

      const event = {
        previousContainer: { id: "rot-0-heat-0-lane-1" },
        container: { id: "rot-0-heat-1-lane-3" },
      } as unknown as CdkDragDrop<any>;

      const changed = handleRotationDrop(event, rotations);
      expect(changed).toBeTrue();
      expect(rotations[0].heats?.[0]?.driverIndices?.[1]).toBe(8);
      expect(rotations[0].heats?.[1]?.driverIndices?.[3]).toBe(2);
    });

    it("should clear lane when dropped back to driver-pool or step-up-pool", () => {
      const rotations: LocalRotation[] = [
        {
          heats: [{ driverIndices: [1, 2, 3, 4] }],
        },
      ];

      const event = {
        previousContainer: { id: "rot-0-heat-0-lane-0" },
        container: { id: "driver-pool" },
      } as unknown as CdkDragDrop<any>;

      const changed = handleRotationDrop(event, rotations);
      expect(changed).toBeTrue();
      expect(rotations[0].heats?.[0]?.driverIndices?.[0]).toBe(0);
    });

    it("should calculate maximum virtual driver and step-up IDs across rotations and heats", () => {
      const rotations: LocalRotation[] = [
        {
          numDrivers: 6,
          heats: [
            { driverIndices: [1, 2, 3, 4] },
            { driverIndices: [-1, -3, 7, 0] },
          ],
        },
        {
          numDrivers: 8,
          heats: [{ driverIndices: [5, 6, 9, 8] }],
        },
      ];

      const result = calculateMaxDriverAndStepUp(rotations);
      expect(result.maxDriverId).toBe(9);
      expect(result.maxStepUpId).toBe(3);
    });

    it("should initialize original heat numbers sequentially when undefined", () => {
      const rotations: LocalRotation[] = [
        {
          heats: [
            { driverIndices: [1, 2] },
            { driverIndices: [3, 4], originalHeatNumber: 5 },
            { driverIndices: [0, 0] },
          ] as any[],
        },
      ];

      initializeRotationOriginalHeatNumbers(rotations);
      expect((rotations[0].heats?.[0] as any).originalHeatNumber).toBe(1);
      expect((rotations[0].heats?.[1] as any).originalHeatNumber).toBe(5);
      expect((rotations[0].heats?.[2] as any).originalHeatNumber).toBe(3);
    });

    it("should display original heat number or double dash", () => {
      expect(getOriginalHeatDisplay(null)).toBe("--");
      expect(getOriginalHeatDisplay({ driverIndices: [] })).toBe("--");
      expect(
        getOriginalHeatDisplay({
          driverIndices: [],
          originalHeatNumber: 3,
        } as any),
      ).toBe("3");
    });

    it("should sync rotation driver counts based on highest driver ID in heats", () => {
      const rotations: LocalRotation[] = [
        {
          numDrivers: 4,
          heats: [{ driverIndices: [1, 2, 7, 0] }],
        },
      ];

      syncRotationDriverCounts(rotations);
      expect(rotations[0].numDrivers).toBe(7);
    });

    it("should restore rotations preserving expanded state", () => {
      const stateRotations = [
        { numDrivers: 4, heats: [] },
        { numDrivers: 6, heats: [] },
      ];
      const currentRotations: LocalRotation[] = [
        { numDrivers: 4, isExpanded: false },
        { numDrivers: 6, isExpanded: true },
      ];

      const restored = restoreRotationsWithExpandedState(
        stateRotations,
        currentRotations,
      );
      expect(restored[0].isExpanded).toBeFalse();
      expect(restored[1].isExpanded).toBeTrue();
    });

    it("should validate rotation name uniqueness", () => {
      const assets = [
        {
          type: "custom_rotation",
          name: "Club Rotation",
          model: { entityId: "a1" },
        },
      ] as any[];

      expect(isRotationNameUnique("", assets)).toBeFalse();
      expect(isRotationNameUnique("Club Rotation", assets)).toBeFalse();
      expect(isRotationNameUnique("Club Rotation", assets, "a1")).toBeTrue();
      expect(isRotationNameUnique("Unique Name", assets)).toBeTrue();
    });

    it("should generate unsaved reasons", () => {
      expect(
        getRotationUnsavedReasons("", true, [], false, false, false),
      ).toContain("DISCARD_REASON_ROTATION_NAME_EMPTY");

      expect(
        getRotationUnsavedReasons("Name", false, [], false, false, false),
      ).toContain("DISCARD_REASON_ROTATION_NAME_DUPLICATE");

      expect(
        getRotationUnsavedReasons("Name", true, [], false, false, false),
      ).toContain("DISCARD_REASON_ROTATION_EMPTY");

      expect(
        getRotationUnsavedReasons(
          "Name",
          true,
          [{ heats: [] }],
          true,
          false,
          false,
        ),
      ).toContain("DISCARD_REASON_ROTATION_ERRORS");

      expect(
        getRotationUnsavedReasons(
          "Name",
          true,
          [{ heats: [] }],
          false,
          true,
          false,
        ),
      ).toContain("DISCARD_REASON_SAVING");

      expect(
        getRotationUnsavedReasons(
          "Name",
          true,
          [{ heats: [] }],
          false,
          false,
          true,
        ),
      ).toContain("DISCARD_REASON_EXIT_TOO_QUICKLY");
    });

    it("should calculate window scale and insert rotation sorted", () => {
      expect(calculateWindowScale(1600, 900)).toBe(1);
      expect(calculateWindowScale(800, 450)).toBe(0.5);

      const rotations: LocalRotation[] = [{ numDrivers: 4 }, { numDrivers: 8 }];
      insertRotationSorted(rotations, { numDrivers: 6 });
      expect(rotations.map((r) => r.numDrivers)).toEqual([4, 6, 8]);
    });
  });
});
