import { of, throwError } from "rxjs";
import { Lane } from "@app/models/lane";
import { Track } from "@app/models/track";

import { TrackEditorPersistenceHelper } from "./track-editor-persistence.helper";

describe("TrackEditorPersistenceHelper", () => {
  let mockHost: any;

  beforeEach(() => {
    mockHost = {
      editingTrack: new Track({
        entity_id: "t1",
        name: "Circuit",
        lanes: [new Lane("l1", "w", "b", 50)],
      }),
      selectedTrack: undefined,
      selectedTrackId: "t1",
      originalTrack: null,
      allTracks: [
        new Track({ entity_id: "t1", name: "Circuit", lanes: [] }),
        new Track({ entity_id: "t2", name: "Circuit 2", lanes: [] }),
      ],
      trackName: "Circuit",
      defaultTrackName: "Circuit",
      numTrackSections: 100,
      trackScale: 1.0,
      lanes: [new Lane("l1", "w", "b", 50)],
      arduinoConfigs: [],
      trackmateConfigs: [],
      phidgetConfigs: [],
      bartConfigs: [],
      isEditMode: true,
      isPreservingEditModeOnNavigation: false,
      transitionToReadOnlyOnSave: false,
      isSaving: false,
      isAutoSaving: false,
      isDirty: false,
      isLoading: false,
      navigateBackOnSave: false,
      isDestroyed: false,
      subscriptions: [],
      undoManager: {
        updateHistory: jasmine.createSpy("updateHistory"),
        resetTracking: jasmine.createSpy("resetTracking"),
      },
      dataService: {
        createTrack: jasmine
          .createSpy("createTrack")
          .and.returnValue(of({ entity_id: "new_id", name: "New" })),
        updateTrack: jasmine
          .createSpy("updateTrack")
          .and.returnValue(of({ entity_id: "t1", name: "Updated" })),
        deleteTrack: jasmine.createSpy("deleteTrack").and.returnValue(of({})),
        getTracks: jasmine.createSpy("getTracks").and.returnValue(of([])),
      },
      navigationService: {
        setLastEditedId: jasmine.createSpy("setLastEditedId"),
        getLastEditedId: jasmine
          .createSpy("getLastEditedId")
          .and.returnValue(null),
      },
      translationService: {
        translate: jasmine
          .createSpy("translate")
          .and.callFake((k: string) => k),
      },
      logger: {
        error: jasmine.createSpy("error"),
        debug: jasmine.createSpy("debug"),
      },
      router: {
        navigate: jasmine.createSpy("navigate"),
        serializeUrl: jasmine
          .createSpy("serializeUrl")
          .and.returnValue("/mock-url"),
        createUrlTree: jasmine.createSpy("createUrlTree"),
      },
      route: {
        snapshot: {
          queryParamMap: {
            get: jasmine.createSpy("get").and.returnValue(null),
          },
        },
      },
      location: {
        replaceState: jasmine.createSpy("replaceState"),
      },
      cdr: {
        detectChanges: jasmine.createSpy("detectChanges"),
      },
      updateTrackSelectItems: jasmine.createSpy("updateTrackSelectItems"),
      createSnapshot: jasmine
        .createSpy("createSnapshot")
        .and.callFake(() => mockHost.editingTrack),
      cloneTrack: jasmine
        .createSpy("cloneTrack")
        .and.callFake((t: Track) => new Track(t)),
      focusNameInput: jasmine.createSpy("focusNameInput"),
      onBack: jasmine.createSpy("onBack"),
      isDirtyState: jasmine.createSpy("isDirtyState").and.returnValue(false),
      autoSaveTrack: jasmine.createSpy("autoSaveTrack"),
      applyTrackToState: jasmine.createSpy("applyTrackToState"),
      selectTrack: jasmine.createSpy("selectTrack"),
      startNewTrack: jasmine.createSpy("startNewTrack"),
      updateHelpSteps: jasmine.createSpy("updateHelpSteps"),
    };
  });

  describe("saveTrackData", () => {
    it("should update track when editingTrack is existing", async () => {
      await TrackEditorPersistenceHelper.saveTrackData(mockHost, false, false);
      expect(mockHost.dataService.updateTrack).toHaveBeenCalled();
      expect(mockHost.navigationService.setLastEditedId).toHaveBeenCalledWith(
        "track",
        "t1",
      );
    });

    it("should create track when isSaveAsNew is true", async () => {
      await TrackEditorPersistenceHelper.saveTrackData(mockHost, true, false);
      expect(mockHost.dataService.createTrack).toHaveBeenCalled();
    });

    it("should handle error when update fails", async () => {
      mockHost.dataService.updateTrack.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      spyOn(window, "alert");

      await expectAsync(
        TrackEditorPersistenceHelper.saveTrackData(mockHost, false, false),
      ).toBeRejected();

      expect(mockHost.isSaving).toBeFalse();
      expect(window.alert).toHaveBeenCalledWith("TE_ERROR_SAVE_FAILED");
    });
  });

  describe("handleSaveSuccess", () => {
    it("should exit edit mode on normal save", () => {
      TrackEditorPersistenceHelper.handleSaveSuccess(
        mockHost,
        { entity_id: "t1", name: "Circuit" },
        false,
        false,
      );
      expect(mockHost.isEditMode).toBeFalse();
      expect(mockHost.undoManager.resetTracking).toHaveBeenCalled();
    });

    it("should remain in edit mode for newly created track", () => {
      TrackEditorPersistenceHelper.handleSaveSuccess(
        mockHost,
        { entity_id: "new_1", name: "New Track" },
        true,
        false,
      );
      expect(mockHost.isEditMode).toBeTrue();
      expect(mockHost.focusNameInput).toHaveBeenCalled();
      expect(mockHost.undoManager.updateHistory).toHaveBeenCalled();
    });

    it("should trigger onBack when navigateBackOnSave is true", () => {
      mockHost.navigateBackOnSave = true;
      TrackEditorPersistenceHelper.handleSaveSuccess(
        mockHost,
        { entity_id: "t1", name: "Circuit" },
        false,
        false,
      );
      expect(mockHost.onBack).toHaveBeenCalled();
    });
  });

  describe("deleteTrack", () => {
    it("should delete existing track and select next available track", () => {
      TrackEditorPersistenceHelper.deleteTrack(mockHost);
      expect(mockHost.dataService.deleteTrack).toHaveBeenCalledWith("t1");
      expect(mockHost.selectTrack).toHaveBeenCalledWith(mockHost.allTracks[0]);
    });

    it("should do nothing if track is new", () => {
      mockHost.editingTrack.entity_id = "new";
      TrackEditorPersistenceHelper.deleteTrack(mockHost);
      expect(mockHost.dataService.deleteTrack).not.toHaveBeenCalled();
    });
  });

  describe("persistNewTrack", () => {
    it("should persist track and update state on success", () => {
      const track = new Track({ entity_id: "new", name: "Fresh", lanes: [] });
      TrackEditorPersistenceHelper.persistNewTrack(mockHost, track);
      expect(mockHost.dataService.createTrack).toHaveBeenCalled();
      expect(mockHost.isEditMode).toBeTrue();
    });

    it("should handle error during persistNewTrack", () => {
      mockHost.dataService.createTrack.and.returnValue(
        throwError(() => new Error("Fail")),
      );
      const track = new Track({ entity_id: "new", name: "Fresh", lanes: [] });
      TrackEditorPersistenceHelper.persistNewTrack(mockHost, track);
      expect(mockHost.applyTrackToState).toHaveBeenCalledWith(track);
      expect(mockHost.focusNameInput).toHaveBeenCalled();
    });
  });

  describe("loadTracksData", () => {
    it("should load tracks and start new track if id query param is 'new'", () => {
      mockHost.route.snapshot.queryParamMap.get.and.callFake((key: string) => {
        return key === "id" ? "new" : null;
      });
      mockHost.dataService.getTracks.and.returnValue(of([]));

      TrackEditorPersistenceHelper.loadTracksData(mockHost);
      expect(mockHost.startNewTrack).toHaveBeenCalled();
    });

    it("should select matching track when id query param matches", () => {
      const track = new Track({ entity_id: "t2", name: "T2", lanes: [] });
      mockHost.route.snapshot.queryParamMap.get.and.callFake((key: string) => {
        return key === "id" ? "t2" : null;
      });
      mockHost.dataService.getTracks.and.returnValue(of([track]));

      TrackEditorPersistenceHelper.loadTracksData(mockHost);
      expect(mockHost.selectTrack).toHaveBeenCalledWith(track);
      expect(mockHost.isEditMode).toBeFalse();
    });
  });
});
