import { of, throwError } from "rxjs";
import { Track } from "@app/models/track";

import { RaceEditorHeatHelper, RaceHeatHost } from "./race-editor-heat.helper";

describe("RaceEditorHeatHelper", () => {
  let mockHost: RaceHeatHost;
  let mockDataService: any;
  let mockLogger: any;
  let mockCdr: any;

  beforeEach(() => {
    mockDataService = {
      previewHeats: jasmine
        .createSpy("previewHeats")
        .and.returnValue(of({ heats: [{ heat_number: 1 }] })),
      listAssets: jasmine.createSpy("listAssets").and.returnValue(
        of([
          {
            type: "custom_rotation",
            numLanes: 4,
            model: { entityId: "asset_1" },
          },
          { type: "other", numLanes: 4 },
        ]),
      ),
    };
    mockLogger = {
      debug: jasmine.createSpy("debug"),
      error: jasmine.createSpy("error"),
    };
    mockCdr = {
      markForCheck: jasmine.createSpy("markForCheck"),
      detectChanges: jasmine.createSpy("detectChanges"),
    };

    mockHost = {
      editingRace: {
        entity_id: "race_1",
        track_entity_id: "track_1",
        heat_rotation_type: "RoundRobin",
        solo_lane_index: 0,
        custom_rotation_sequence: [1, 2, 3],
        group_options: { max_groups: 3, names: ["A", "B"] },
      },
      tracks: [
        new Track({
          entity_id: "track_1",
          name: "Track 1",
          lanes: [{}, {}, {}, {}] as any,
        }),
      ],
      driverCount: 4,
      generatedHeats: [],
      customRotationAssets: [],
      selectedCustomRotationAssetId: "",
      customSequenceText: "",
      dataService: mockDataService,
      logger: mockLogger,
      cdr: mockCdr,
      onInputChange: jasmine.createSpy("onInputChange"),
      captureState: jasmine.createSpy("captureState"),
      saveDriverCount: jasmine.createSpy("saveDriverCount"),
      loadHeats: jasmine.createSpy("loadHeats"),
      filteredCustomRotationAssets: [],
      syncSelectedCustomRotationAsset: jasmine.createSpy(
        "syncSelectedCustomRotationAsset",
      ),
    };
  });

  describe("getCustomRotationSequenceString & syncSequenceTextFromModel", () => {
    it("should return joined string or empty if none", () => {
      expect(
        RaceEditorHeatHelper.getCustomRotationSequenceString(
          mockHost.editingRace,
        ),
      ).toBe("1, 2, 3");
      expect(RaceEditorHeatHelper.getCustomRotationSequenceString({})).toBe("");
    });

    it("should sync sequence text to host and detect changes", () => {
      RaceEditorHeatHelper.syncSequenceTextFromModel(mockHost);
      expect(mockHost.customSequenceText).toBe("1, 2, 3");
      expect(mockCdr.markForCheck).toHaveBeenCalled();
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe("onCustomSequenceChange", () => {
    it("should return early if no editingRace", () => {
      mockHost.editingRace = null;
      RaceEditorHeatHelper.onCustomSequenceChange(mockHost);
      expect(mockHost.loadHeats).not.toHaveBeenCalled();
    });

    it("should parse valid comma separated integers and trigger loadHeats", () => {
      mockHost.customSequenceText = "1, 2,  4";
      RaceEditorHeatHelper.onCustomSequenceChange(mockHost);
      expect(mockHost.editingRace.custom_rotation_sequence).toEqual([1, 2, 4]);
      expect(mockHost.onInputChange).toHaveBeenCalled();
      expect(mockHost.loadHeats).toHaveBeenCalled();
    });

    it("should parse invalid non-numeric inputs as NaN", () => {
      mockHost.customSequenceText = "1, foo, 3";
      RaceEditorHeatHelper.onCustomSequenceChange(mockHost);
      expect(mockHost.editingRace.custom_rotation_sequence[0]).toBe(1);
      expect(
        Number.isNaN(mockHost.editingRace.custom_rotation_sequence[1]),
      ).toBeTrue();
      expect(mockHost.editingRace.custom_rotation_sequence[2]).toBe(3);
    });
  });

  describe("group options helpers", () => {
    it("should return correct group indices", () => {
      expect(
        RaceEditorHeatHelper.getGroupIndices(mockHost.editingRace),
      ).toEqual([0, 1, 2]);
      expect(RaceEditorHeatHelper.getGroupIndices({})).toEqual([0]);
    });

    it("should get and set group name input", () => {
      expect(
        RaceEditorHeatHelper.getGroupNameInput(mockHost.editingRace, 0),
      ).toBe("A");
      expect(
        RaceEditorHeatHelper.getGroupNameInput(mockHost.editingRace, 5),
      ).toBe("");
      expect(RaceEditorHeatHelper.getGroupNameInput({}, 0)).toBe("");

      const captureSpy = jasmine.createSpy("captureState");
      RaceEditorHeatHelper.setGroupNameInput(
        mockHost.editingRace,
        2,
        "Group C",
        captureSpy,
      );
      expect(mockHost.editingRace.group_options.names[2]).toBe("Group C");
      expect(captureSpy).toHaveBeenCalled();

      // Test with missing group_options
      RaceEditorHeatHelper.setGroupNameInput({}, 0, "test", captureSpy);
      const editingWithNoNames = { group_options: {} };
      RaceEditorHeatHelper.setGroupNameInput(
        editingWithNoNames,
        0,
        "test2",
        captureSpy,
      );
      expect((editingWithNoNames.group_options as any).names[0]).toBe("test2");
    });
  });

  describe("rotation, lane, and driver count changes", () => {
    it("should handle onRotationTypeChange", () => {
      RaceEditorHeatHelper.onRotationTypeChange(mockHost);
      expect(mockHost.captureState).toHaveBeenCalled();
      expect(mockHost.loadHeats).toHaveBeenCalled();
    });

    it("should handle onLaneSelected", () => {
      RaceEditorHeatHelper.onLaneSelected(mockHost, 2);
      expect(mockHost.editingRace.solo_lane_index).toBe(2);
      expect(mockHost.captureState).toHaveBeenCalled();
      expect(mockHost.loadHeats).toHaveBeenCalled();

      // If lane index is unchanged, do nothing
      (mockHost.captureState as jasmine.Spy).calls.reset();
      RaceEditorHeatHelper.onLaneSelected(mockHost, 2);
      expect(mockHost.captureState).not.toHaveBeenCalled();
    });

    it("should handle onDriverCountChange", () => {
      RaceEditorHeatHelper.onDriverCountChange(mockHost);
      expect(mockHost.saveDriverCount).toHaveBeenCalled();
      expect(mockHost.loadHeats).toHaveBeenCalled();
    });
  });

  describe("custom rotation assets", () => {
    it("should filter custom rotation assets by lane count", () => {
      const assets = [
        { numLanes: 4, id: 1 },
        { numLanes: 6, id: 2 },
      ];
      const filtered = RaceEditorHeatHelper.getFilteredCustomRotationAssets(
        mockHost.tracks,
        assets,
        mockHost.editingRace,
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(1);
    });

    it("should load custom rotation assets and filter custom_rotation types", (done) => {
      RaceEditorHeatHelper.loadCustomRotationAssets(mockHost);
      expect(mockDataService.listAssets).toHaveBeenCalled();
      expect(mockHost.customRotationAssets.length).toBe(1);
      setTimeout(() => {
        expect(mockHost.syncSelectedCustomRotationAsset).toHaveBeenCalled();
        done();
      }, 10);
    });

    it("should log error if loadCustomRotationAssets fails", () => {
      mockDataService.listAssets.and.returnValue(
        throwError(() => new Error("Network error")),
      );
      RaceEditorHeatHelper.loadCustomRotationAssets(mockHost);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should sync selected custom rotation asset for Custom type", () => {
      mockHost.editingRace.heat_rotation_type = "Custom";
      mockHost.customRotationAssets = [
        { model: { entityId: "asset_1" }, numLanes: 4 },
      ];
      mockHost.filteredCustomRotationAssets = mockHost.customRotationAssets;

      RaceEditorHeatHelper.syncSelectedCustomRotationAsset(mockHost);
      expect(mockHost.selectedCustomRotationAssetId).toBe("asset_1");
      expect(mockHost.editingRace.custom_rotation_asset_id).toBe("asset_1");

      // Non custom rotation type resets selection
      mockHost.editingRace.heat_rotation_type = "RoundRobin";
      RaceEditorHeatHelper.syncSelectedCustomRotationAsset(mockHost);
      expect(mockHost.selectedCustomRotationAssetId).toBe("");
    });

    it("should resolve custom rotation asset when referenced by name", () => {
      mockHost.editingRace.heat_rotation_type = "Custom";
      mockHost.editingRace.custom_rotation_asset_id = "Llany Rotations";
      mockHost.customRotationAssets = [
        {
          model: { entityId: "uuid-llany-123" },
          name: "Llany Rotations",
          numLanes: 4,
        },
      ];
      mockHost.filteredCustomRotationAssets = mockHost.customRotationAssets;

      RaceEditorHeatHelper.syncSelectedCustomRotationAsset(mockHost);
      expect(mockHost.selectedCustomRotationAssetId).toBe("uuid-llany-123");
      expect(mockHost.editingRace.custom_rotation_asset_id).toBe(
        "uuid-llany-123",
      );
      expect((mockHost.editingRace as any).custom_rotation_asset_name).toBe(
        "Llany Rotations",
      );
    });

    it("should handle onCustomRotationAssetChange", () => {
      mockHost.filteredCustomRotationAssets = [
        {
          model: { entityId: "asset_2" },
          name: "Sprint Rotations",
          numLanes: 4,
        },
      ];
      mockHost.selectedCustomRotationAssetId = "asset_2";
      mockHost.editingRace.custom_rotations = [{}];
      RaceEditorHeatHelper.onCustomRotationAssetChange(mockHost);
      expect(mockHost.editingRace.custom_rotation_asset_id).toBe("asset_2");
      expect((mockHost.editingRace as any).custom_rotation_asset_name).toBe(
        "Sprint Rotations",
      );
      expect(mockHost.editingRace.custom_rotations).toBeUndefined();
      expect(mockHost.captureState).toHaveBeenCalled();
    });
  });

  describe("loadHeats", () => {
    it("should clear heats if required parameters are missing", () => {
      mockHost.editingRace.track_entity_id = "";
      RaceEditorHeatHelper.loadHeats(mockHost);
      expect(mockHost.generatedHeats).toEqual([]);
      expect(mockDataService.previewHeats).not.toHaveBeenCalled();
    });

    it("should call dataService.previewHeats and populate generatedHeats", () => {
      RaceEditorHeatHelper.loadHeats(mockHost);
      expect(mockDataService.previewHeats).toHaveBeenCalled();
      expect(mockHost.generatedHeats.length).toBe(1);
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });

    it("should clear generatedHeats and log error on failure", () => {
      mockDataService.previewHeats.and.returnValue(
        throwError(() => new Error("fail")),
      );
      RaceEditorHeatHelper.loadHeats(mockHost);
      expect(mockHost.generatedHeats).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });
  });
});
