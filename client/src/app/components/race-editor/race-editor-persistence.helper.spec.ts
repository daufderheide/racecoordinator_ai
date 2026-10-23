import { of, throwError } from "rxjs";

import {
  RaceEditorPersistenceHelper,
  RacePersistenceHost,
} from "./race-editor-persistence.helper";

describe("RaceEditorPersistenceHelper", () => {
  let mockHost: RacePersistenceHost;

  beforeEach(() => {
    mockHost = {
      editingRace: {
        entity_id: "r1",
        name: "GP Race",
        theme_id: "t1",
        track_entity_id: "tr1",
      },
      selectedRace: null,
      selectedRaceId: "r1",
      originalRace: null,
      allRaces: [
        { entity_id: "r1", name: "GP Race" },
        { entity_id: "r2", name: "Indy 500" },
      ],
      races: [
        { entity_id: "r1", name: "GP Race" },
        { entity_id: "r2", name: "Indy 500" },
      ],
      tracks: [{ entity_id: "tr1", name: "Track 1" }] as any,
      themes: [{ entity_id: "t1", name: "Theme 1" }] as any,
      isEditMode: false,
      isPreservingEditModeOnNavigation: false,
      transitionToReadOnlyOnSave: false,
      isSaving: false,
      isAutoSaving: false,
      isLoading: false,
      driverCount: 4,
      defaultRaceName: "GP Race",
      navigateBackOnSave: false,
      subscriptions: [],
      undoManager: {
        resetTracking: jasmine.createSpy("resetTracking"),
        initialize: jasmine.createSpy("initialize"),
      } as any,
      lifecycle: {
        scheduleAutoSave: jasmine
          .createSpy("scheduleAutoSave")
          .and.callFake((fn: any) => fn()),
      } as any,
      dataService: {
        createRace: jasmine
          .createSpy("createRace")
          .and.returnValue(of({ entity_id: "r3", name: "Created Race" })),
        updateRace: jasmine
          .createSpy("updateRace")
          .and.returnValue(of({ entity_id: "r1", name: "Updated Race" })),
        deleteRace: jasmine
          .createSpy("deleteRace")
          .and.returnValue(of({ success: true })),
        getRaces: jasmine.createSpy("getRaces").and.returnValue(
          of([
            { entity_id: "r1", name: "GP Race" },
            { entity_id: "r2", name: "Indy 500" },
          ]),
        ),
      } as any,
      navigationService: {
        setLastEditedId: jasmine.createSpy("setLastEditedId"),
      } as any,
      translationService: {
        translate: jasmine
          .createSpy("translate")
          .and.callFake((k: string) => k),
      } as any,
      logger: {
        debug: jasmine.createSpy("debug"),
        error: jasmine.createSpy("error"),
      } as any,
      router: {
        navigate: jasmine.createSpy("navigate"),
        createUrlTree: jasmine.createSpy("createUrlTree"),
        serializeUrl: jasmine.createSpy("serializeUrl").and.returnValue("/url"),
      } as any,
      route: {
        snapshot: {
          queryParamMap: {
            get: jasmine.createSpy("get").and.returnValue(null),
          },
        },
      } as any,
      location: {
        replaceState: jasmine.createSpy("replaceState"),
      } as any,
      cdr: {
        detectChanges: jasmine.createSpy("detectChanges"),
      } as any,
      isNavigationApproved: false,
      showDeleteConfirm: false,
      isRotationInvalid: false,
      updateRaceSelectItems: jasmine.createSpy("updateRaceSelectItems"),
      loadHeats: jasmine.createSpy("loadHeats"),
      selectRace: jasmine.createSpy("selectRace"),
      syncSelectedCustomRotationAsset: jasmine.createSpy(
        "syncSelectedCustomRotationAsset",
      ),
      syncSequenceTextFromModel: jasmine.createSpy("syncSequenceTextFromModel"),
      focusNameInput: jasmine.createSpy("focusNameInput"),
      onBack: jasmine.createSpy("onBack"),
      showError: jasmine.createSpy("showError"),
      isDirtyState: jasmine.createSpy("isDirtyState").and.returnValue(true),
      getDefaultThemeId: jasmine
        .createSpy("getDefaultThemeId")
        .and.returnValue("t1"),
      enforceFuelRules: jasmine.createSpy("enforceFuelRules"),
      syncHeatPositionPoints: jasmine.createSpy("syncHeatPositionPoints"),
      isNameDuplicate: jasmine
        .createSpy("isNameDuplicate")
        .and.callFake(() =>
          RaceEditorPersistenceHelper.isNameDuplicate(
            mockHost.editingRace,
            mockHost.races,
          ),
        ),
    };
  });

  describe("Validation and Naming", () => {
    it("should detect duplicate names correctly", () => {
      expect(
        RaceEditorPersistenceHelper.isNameDuplicate(
          mockHost.editingRace,
          mockHost.races,
        ),
      ).toBeFalse();

      const dupRace = { entity_id: "new", name: "GP Race" };
      expect(
        RaceEditorPersistenceHelper.isNameDuplicate(dupRace, mockHost.races),
      ).toBeTrue();
    });

    it("should generate unique race names with and without forced suffix", () => {
      const name1 = RaceEditorPersistenceHelper.generateUniqueName(
        "GP Race",
        mockHost.allRaces,
        false,
      );
      expect(name1).toBe("GP Race_1");

      const name2 = RaceEditorPersistenceHelper.generateUniqueName(
        "Unique Race",
        mockHost.allRaces,
        false,
      );
      expect(name2).toBe("Unique Race");

      const name3 = RaceEditorPersistenceHelper.generateUniqueName(
        "Unique Race",
        mockHost.allRaces,
        true,
      );
      expect(name3).toBe("Unique Race_1");
    });

    it("should determine canSaveAsNew correctly", () => {
      expect(
        RaceEditorPersistenceHelper.canSaveAsNew(mockHost.editingRace),
      ).toBeTrue();
      expect(
        RaceEditorPersistenceHelper.canSaveAsNew({ name: "", theme_id: "t1" }),
      ).toBeFalse();
      expect(
        RaceEditorPersistenceHelper.canSaveAsNew({
          name: "Test",
          theme_id: "",
        }),
      ).toBeFalse();
    });

    it("should determine canUpdate and update tooltip", () => {
      expect(RaceEditorPersistenceHelper.canUpdate(mockHost)).toBeTrue();
      expect(RaceEditorPersistenceHelper.getUpdateTooltip(mockHost)).toBe("");

      (mockHost.isDirtyState as jasmine.Spy).and.returnValue(false);
      expect(RaceEditorPersistenceHelper.canUpdate(mockHost)).toBeFalse();
      expect(RaceEditorPersistenceHelper.getUpdateTooltip(mockHost)).toBe(
        "RE_TOOLTIP_NO_CHANGES",
      );

      (mockHost.isDirtyState as jasmine.Spy).and.returnValue(true);
      mockHost.editingRace.name = "Indy 500";
      expect(RaceEditorPersistenceHelper.getUpdateTooltip(mockHost)).toBe(
        "RE_TOOLTIP_NAME_EXISTS",
      );

      mockHost.editingRace.name = "Valid Race";
      mockHost.isRotationInvalid = true;
      expect(RaceEditorPersistenceHelper.getUpdateTooltip(mockHost)).toBe(
        "RE_TOOLTIP_INVALID_ROTATION",
      );
    });
  });

  describe("startNewRace", () => {
    it("should create default template and call createRace", () => {
      RaceEditorPersistenceHelper.startNewRace(mockHost);
      expect(mockHost.dataService.createRace).toHaveBeenCalled();
      expect(mockHost.navigationService.setLastEditedId).toHaveBeenCalledWith(
        "race",
        "r3",
      );
      expect(mockHost.isEditMode).toBeTrue();
      expect(mockHost.router.navigate).toHaveBeenCalled();
    });

    it("should handle createRace error gracefully", () => {
      (mockHost.dataService.createRace as jasmine.Spy).and.returnValue(
        throwError(() => new Error("Creation error")),
      );
      RaceEditorPersistenceHelper.startNewRace(mockHost);
      expect(mockHost.isSaving).toBeFalse();
      expect(mockHost.logger.error).toHaveBeenCalled();
    });
  });

  describe("deleteRace and onConfirmDelete", () => {
    it("should set showDeleteConfirm to true on deleteRace", () => {
      RaceEditorPersistenceHelper.deleteRace(mockHost);
      expect(mockHost.showDeleteConfirm).toBeTrue();
    });

    it("should delete race and select next on confirmation", () => {
      RaceEditorPersistenceHelper.onConfirmDelete(mockHost);
      expect(mockHost.dataService.deleteRace).toHaveBeenCalledWith("r1");
      expect(mockHost.selectRace).toHaveBeenCalledWith(
        jasmine.objectContaining({ entity_id: "r2" }),
      );
    });

    it("should start new race if no other races remain after delete", () => {
      mockHost.allRaces = [{ entity_id: "r1", name: "GP Race" }];
      RaceEditorPersistenceHelper.onConfirmDelete(mockHost);
      expect(mockHost.dataService.deleteRace).toHaveBeenCalledWith("r1");
      expect(mockHost.dataService.createRace).toHaveBeenCalled();
    });
  });

  describe("updateRace and autoSaveRace", () => {
    it("should save existing race updates", async () => {
      await RaceEditorPersistenceHelper.updateRace(mockHost, false);
      expect(mockHost.dataService.updateRace).toHaveBeenCalled();
      expect(mockHost.undoManager.resetTracking).toHaveBeenCalled();
    });

    it("should navigate back if navigateBackOnSave is true", async () => {
      mockHost.navigateBackOnSave = true;
      await RaceEditorPersistenceHelper.updateRace(mockHost, false);
      expect(mockHost.onBack).toHaveBeenCalled();
    });

    it("should trigger autoSaveRace via lifecycle scheduleAutoSave", async () => {
      await RaceEditorPersistenceHelper.autoSaveRace(mockHost);
      expect(mockHost.lifecycle.scheduleAutoSave).toHaveBeenCalled();
    });
  });

  describe("saveAsNew", () => {
    it("should create a copy of race with new unique name", () => {
      RaceEditorPersistenceHelper.saveAsNew(mockHost);
      expect(mockHost.dataService.createRace).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: "GP Race_1" }),
      );
    });
  });

  describe("loadRaces and loadRace", () => {
    it("should load races and update select items", () => {
      RaceEditorPersistenceHelper.loadRaces(mockHost);
      expect(mockHost.dataService.getRaces).toHaveBeenCalled();
      expect(mockHost.allRaces.length).toBe(2);
      expect(mockHost.updateRaceSelectItems).toHaveBeenCalled();
    });

    it("should load race by id and select it", () => {
      RaceEditorPersistenceHelper.loadRace(mockHost, "r2");
      expect(mockHost.selectRace).toHaveBeenCalledWith(
        jasmine.objectContaining({ entity_id: "r2" }),
      );
    });

    it("should select race and initialize undoManager and enforce fuel rules", () => {
      mockHost.driverCount = 4;
      mockHost.isPreservingEditModeOnNavigation = true;
      const race = { entity_id: "r10", name: "New Race" };
      RaceEditorPersistenceHelper.selectRace(mockHost, race);
      expect(mockHost.selectedRace).toBe(race);
      expect(mockHost.selectedRaceId).toBe("r10");
      expect(mockHost.undoManager.initialize).toHaveBeenCalled();
      expect(mockHost.enforceFuelRules).toHaveBeenCalled();
      expect(mockHost.syncHeatPositionPoints).toHaveBeenCalled();
      expect(mockHost.syncSelectedCustomRotationAsset).toHaveBeenCalled();
      expect(mockHost.loadHeats).toHaveBeenCalled();
      expect(mockHost.syncSequenceTextFromModel).toHaveBeenCalled();
      expect(mockHost.isEditMode).toBeTrue();
      expect(mockHost.focusNameInput).toHaveBeenCalled();
      expect(mockHost.cdr.detectChanges).toHaveBeenCalled();
    });
  });
});
