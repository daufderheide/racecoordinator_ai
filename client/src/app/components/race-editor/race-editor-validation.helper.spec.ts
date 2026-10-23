import { of, throwError } from "rxjs";
import { Track } from "@app/models/track";
import { ConnectionState } from "@app/services/connection-monitor.service";

import {
  RaceConnectionHost,
  RaceEditorValidationHelper,
  RaceValidationHost,
} from "./race-editor-validation.helper";

describe("RaceEditorValidationHelper", () => {
  let mockHost: RaceValidationHost;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockLogger: any;
  let mockCdr: any;

  beforeEach(() => {
    mockDataService = {
      resetRaceRecords: jasmine
        .createSpy("resetRaceRecords")
        .and.returnValue(of({})),
    };
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((k: string) => `translated_${k}`),
    };
    mockLogger = {
      error: jasmine.createSpy("error"),
    };
    mockCdr = {
      detectChanges: jasmine.createSpy("detectChanges"),
    };

    mockHost = {
      isLoading: false,
      editingRace: {
        entity_id: "race_1",
        name: "Grand Prix",
        track_entity_id: "track_1",
        heat_rotation_type: "RoundRobin",
      },
      originalRace: {
        entity_id: "race_1",
        name: "Grand Prix",
        track_entity_id: "track_1",
        heat_rotation_type: "RoundRobin",
      },
      tracks: [
        new Track({
          entity_id: "track_1",
          name: "Track 1",
          lanes: [{}, {}, {}, {}] as any,
          has_per_lane_relays: true,
        }),
      ],
      isSaving: false,
      showResetConfirmation: false,
      showResetSuccess: false,
      resetRaceName: "",
      undoManager: {
        hasChanges: jasmine.createSpy("hasChanges").and.returnValue(false),
      } as any,
      dataService: mockDataService,
      translationService: mockTranslationService,
      logger: mockLogger,
      cdr: mockCdr,
      isAdmin: jasmine.createSpy("isAdmin").and.returnValue(true),
      isNameDuplicate: jasmine
        .createSpy("isNameDuplicate")
        .and.returnValue(false),
      isRotationInvalid: false,
      isNameInvalid: false,
      isDirtyState: jasmine.createSpy("isDirtyState").and.returnValue(false),
    };
  });

  describe("isNameInvalid", () => {
    it("should return false if loading or no editingRace", () => {
      expect(
        RaceEditorValidationHelper.isNameInvalid(
          true,
          mockHost.editingRace,
          () => false,
        ),
      ).toBeFalse();
      expect(
        RaceEditorValidationHelper.isNameInvalid(false, null, () => false),
      ).toBeFalse();
    });

    it("should return true if name is empty or duplicate", () => {
      expect(
        RaceEditorValidationHelper.isNameInvalid(
          false,
          { name: "  " },
          () => false,
        ),
      ).toBeTrue();
      expect(
        RaceEditorValidationHelper.isNameInvalid(
          false,
          { name: "Valid" },
          () => true,
        ),
      ).toBeTrue();
      expect(
        RaceEditorValidationHelper.isNameInvalid(
          false,
          { name: "Valid" },
          () => false,
        ),
      ).toBeFalse();
    });
  });

  describe("isRotationInvalid", () => {
    it("should return false if no editingRace", () => {
      expect(
        RaceEditorValidationHelper.isRotationInvalid(null, mockHost.tracks),
      ).toBeFalse();
    });

    it("should validate CustomRoundRobin rotation sequences", () => {
      const race = {
        heat_rotation_type: "CustomRoundRobin",
        track_entity_id: "track_1",
        custom_rotation_sequence: [1, 2, 3],
      };
      expect(
        RaceEditorValidationHelper.isRotationInvalid(race, mockHost.tracks),
      ).toBeFalse();

      // Empty sequence
      expect(
        RaceEditorValidationHelper.isRotationInvalid(
          { ...race, custom_rotation_sequence: [] },
          mockHost.tracks,
        ),
      ).toBeTrue();

      // Sequence with NaN
      expect(
        RaceEditorValidationHelper.isRotationInvalid(
          { ...race, custom_rotation_sequence: [1, NaN] },
          mockHost.tracks,
        ),
      ).toBeTrue();

      // Sequence with lane exceeding track lanes
      expect(
        RaceEditorValidationHelper.isRotationInvalid(
          { ...race, custom_rotation_sequence: [1, 5] },
          mockHost.tracks,
        ),
      ).toBeTrue();

      // Sequence with duplicate active lanes
      expect(
        RaceEditorValidationHelper.isRotationInvalid(
          { ...race, custom_rotation_sequence: [1, 1] },
          mockHost.tracks,
        ),
      ).toBeTrue();
    });

    it("should validate Custom rotation type", () => {
      const race = { heat_rotation_type: "Custom", custom_rotations: [] };
      expect(
        RaceEditorValidationHelper.isRotationInvalid(race, mockHost.tracks),
      ).toBeTrue();
      expect(
        RaceEditorValidationHelper.isRotationInvalid(
          { ...race, custom_rotation_asset_id: "asset_1" },
          mockHost.tracks,
        ),
      ).toBeFalse();
      expect(
        RaceEditorValidationHelper.isRotationInvalid(
          { ...race, custom_rotations: [{}] },
          mockHost.tracks,
        ),
      ).toBeFalse();
    });
  });

  describe("currentTrackHasPerLaneRelays", () => {
    it("should return per lane relay flag from matched track", () => {
      expect(
        RaceEditorValidationHelper.currentTrackHasPerLaneRelays(
          mockHost.editingRace,
          mockHost.tracks,
        ),
      ).toBeTrue();
      expect(
        RaceEditorValidationHelper.currentTrackHasPerLaneRelays(
          null,
          mockHost.tracks,
        ),
      ).toBeFalse();
      expect(
        RaceEditorValidationHelper.currentTrackHasPerLaneRelays(
          { track_entity_id: "nonexistent" },
          mockHost.tracks,
        ),
      ).toBeFalse();
    });
  });

  describe("isConfigValid", () => {
    it("should return true when all fields are valid", () => {
      expect(RaceEditorValidationHelper.isConfigValid(mockHost)).toBeTrue();
      mockHost.isNameInvalid = true;
      expect(RaceEditorValidationHelper.isConfigValid(mockHost)).toBeFalse();
    });
  });

  describe("isDirtyState", () => {
    it("should return true if undoManager has changes or editing differs from original", () => {
      expect(
        RaceEditorValidationHelper.isDirtyState(
          mockHost.undoManager,
          mockHost.editingRace,
          mockHost.originalRace,
        ),
      ).toBeFalse();
      (mockHost.undoManager.hasChanges as jasmine.Spy).and.returnValue(true);
      expect(
        RaceEditorValidationHelper.isDirtyState(
          mockHost.undoManager,
          mockHost.editingRace,
          mockHost.originalRace,
        ),
      ).toBeTrue();

      (mockHost.undoManager.hasChanges as jasmine.Spy).and.returnValue(false);
      expect(
        RaceEditorValidationHelper.isDirtyState(
          mockHost.undoManager,
          { ...mockHost.editingRace, name: "New" },
          mockHost.originalRace,
        ),
      ).toBeTrue();
    });
  });

  describe("getUnsavedReasons", () => {
    it("should return reasons for empty name, duplicate name, missing track, or invalid rotation", () => {
      mockHost.editingRace.name = "";
      let reasons = RaceEditorValidationHelper.getUnsavedReasons(mockHost);
      expect(reasons).toContain("DISCARD_REASON_RACE_NAME_EMPTY");

      mockHost.editingRace.name = "Test";
      (mockHost.isNameDuplicate as jasmine.Spy).and.returnValue(true);
      reasons = RaceEditorValidationHelper.getUnsavedReasons(mockHost);
      expect(reasons).toContain("DISCARD_REASON_RACE_NAME_DUPLICATE");

      mockHost.editingRace.track_entity_id = "";
      reasons = RaceEditorValidationHelper.getUnsavedReasons(mockHost);
      expect(reasons).toContain("DISCARD_REASON_RACE_NO_TRACK");

      mockHost.editingRace.track_entity_id = "track_1";
      mockHost.editingRace.heat_rotation_type = "";
      reasons = RaceEditorValidationHelper.getUnsavedReasons(mockHost);
      expect(reasons).toContain("DISCARD_REASON_RACE_NO_ROTATION");
    });

    it("should return saving or exit too quickly reasons", () => {
      mockHost.isSaving = true;
      let reasons = RaceEditorValidationHelper.getUnsavedReasons(mockHost);
      expect(reasons).toContain("DISCARD_REASON_SAVING");

      mockHost.isSaving = false;
      (mockHost.isDirtyState as jasmine.Spy).and.returnValue(true);
      reasons = RaceEditorValidationHelper.getUnsavedReasons(mockHost);
      expect(reasons).toContain("DISCARD_REASON_EXIT_TOO_QUICKLY");
    });
  });

  describe("reset records methods", () => {
    it("should return proper tooltip based on admin status", () => {
      expect(
        RaceEditorValidationHelper.getResetTooltip(
          true,
          mockTranslationService,
        ),
      ).toBe("translated_RM_BTN_RESET_RECORDS");
      expect(
        RaceEditorValidationHelper.getResetTooltip(
          false,
          mockTranslationService,
        ),
      ).toBe("translated_RM_RESET_ADMIN_ONLY_TOOLTIP");
    });

    it("should open reset confirmation on onResetRecords if admin", () => {
      const event = { stopPropagation: jasmine.createSpy("stopPropagation") };
      RaceEditorValidationHelper.onResetRecords(mockHost, event as any);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockHost.showResetConfirmation).toBeTrue();

      (mockHost.isAdmin as jasmine.Spy).and.returnValue(false);
      mockHost.showResetConfirmation = false;
      RaceEditorValidationHelper.onResetRecords(mockHost);
      expect(mockHost.showResetConfirmation).toBeFalse();
    });

    it("should reset records and show success modal", () => {
      RaceEditorValidationHelper.onConfirmReset(mockHost);
      expect(mockDataService.resetRaceRecords).toHaveBeenCalledWith("race_1");
      expect(mockHost.showResetSuccess).toBeTrue();
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });

    it("should handle reset error", () => {
      mockDataService.resetRaceRecords.and.returnValue(
        throwError(() => new Error("Reset error")),
      );
      RaceEditorValidationHelper.onConfirmReset(mockHost);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("connection monitoring", () => {
    it("should handle connection state changes and loss", () => {
      const connectionHost: RaceConnectionHost = {
        isConnectionLost: false,
        isSaving: true,
        isAutoSaving: true,
        isLoading: true,
        cdr: mockCdr,
        connectionSubscription: null,
        connectionMonitor: {
          connectionState$: of(ConnectionState.DISCONNECTED),
        } as any,
        handleConnectionLoss: jasmine.createSpy("handleConnectionLoss"),
      };

      const sub = RaceEditorValidationHelper.monitorConnection(connectionHost);
      expect(connectionHost.isConnectionLost).toBeTrue();
      expect(connectionHost.handleConnectionLoss).toHaveBeenCalled();
      sub.unsubscribe();

      RaceEditorValidationHelper.handleConnectionLoss(connectionHost);
      expect(connectionHost.isSaving).toBeFalse();
      expect(connectionHost.isAutoSaving).toBeFalse();
      expect(connectionHost.isLoading).toBeFalse();
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });
  });
});
