import { of, Subject, throwError } from "rxjs";
import { Theme } from "@app/models/theme";
import { Track } from "@app/models/track";

import {
  RaceCatalogHost,
  RaceEditorCatalogHelper,
} from "./race-editor-catalog.helper";

describe("RaceEditorCatalogHelper", () => {
  let mockHost: RaceCatalogHost;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockNavigationService: any;
  let mockLogger: any;
  let mockCdr: any;
  let mockRouter: any;
  let mockRoute: any;
  let queryParamMapSubject: Subject<any>;

  beforeEach(() => {
    queryParamMapSubject = new Subject<any>();
    mockDataService = {
      getThemes: jasmine
        .createSpy("getThemes")
        .and.returnValue(
          of([
            {
              entity_id: "default_classic_rc_ai",
              is_default: true,
              name: "Classic",
            } as Theme,
            {
              entity_id: "dark_theme",
              is_default: false,
              name: "Dark",
            } as Theme,
          ]),
        ),
      getTracks: jasmine
        .createSpy("getTracks")
        .and.returnValue(
          of([
            {
              entity_id: "track_1",
              name: "Main Track",
              lanes: [{}, {}],
              num_track_sections: 100,
            },
          ]),
        ),
    };
    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((k: string) => k),
    };
    mockNavigationService = {
      getLastEditedId: jasmine
        .createSpy("getLastEditedId")
        .and.returnValue("race_123"),
      setLastEditedId: jasmine.createSpy("setLastEditedId"),
    };
    mockLogger = {
      error: jasmine.createSpy("error"),
      debug: jasmine.createSpy("debug"),
    };
    mockCdr = {
      detectChanges: jasmine.createSpy("detectChanges"),
    };
    mockRouter = {
      url: "/race-editor",
      navigate: jasmine.createSpy("navigate"),
    };
    mockRoute = {
      queryParamMap: queryParamMapSubject.asObservable(),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("snapshot.get").and.returnValue(null),
        },
      },
    };

    mockHost = {
      tracks: [],
      themes: [],
      editingRace: { entity_id: "race_old" },
      originalRace: null,
      defaultRaceName: "",
      isNavigationApproved: false,
      isLoading: false,
      driverCount: 4,
      isReverting: false,
      isSwitchingSelection: false,
      undoManager: {
        initialize: jasmine.createSpy("initialize"),
      } as any,
      subscriptions: [],
      route: mockRoute,
      router: mockRouter,
      dataService: mockDataService,
      translationService: mockTranslationService,
      navigationService: mockNavigationService,
      logger: mockLogger,
      cdr: mockCdr,
      focusNameInput: jasmine.createSpy("focusNameInput"),
      syncHeatPositionPoints: jasmine.createSpy("syncHeatPositionPoints"),
      enforceFuelRules: jasmine.createSpy("enforceFuelRules"),
      syncSelectedCustomRotationAsset: jasmine.createSpy(
        "syncSelectedCustomRotationAsset",
      ),
      syncSequenceTextFromModel: jasmine.createSpy("syncSequenceTextFromModel"),
      hasChanges: jasmine.createSpy("hasChanges").and.returnValue(false),
      confirmDiscard: jasmine
        .createSpy("confirmDiscard")
        .and.returnValue(Promise.resolve(true)),
      startNewRace: jasmine.createSpy("startNewRace"),
      loadRace: jasmine.createSpy("loadRace"),
      saveDriverCount: jasmine.createSpy("saveDriverCount"),
      loadDriverCount: jasmine.createSpy("loadDriverCount"),
    };
  });

  describe("getDefaultThemeId", () => {
    it("should return default_classic_rc_ai if themes is empty", () => {
      expect(RaceEditorCatalogHelper.getDefaultThemeId([])).toBe(
        "default_classic_rc_ai",
      );
      expect(RaceEditorCatalogHelper.getDefaultThemeId(null as any)).toBe(
        "default_classic_rc_ai",
      );
    });

    it("should return is_default theme or classic theme if present", () => {
      const themes = [
        { entity_id: "other", is_default: false, name: "Other" } as Theme,
        {
          entity_id: "default_classic_rc_ai",
          is_default: false,
          name: "Classic",
        } as Theme,
      ];
      expect(RaceEditorCatalogHelper.getDefaultThemeId(themes)).toBe(
        "default_classic_rc_ai",
      );
    });
  });

  describe("loadThemes", () => {
    it("should load themes and assign default theme if editingRace has none", () => {
      mockHost.editingRace = { entity_id: "r1" };
      RaceEditorCatalogHelper.loadThemes(mockHost);
      expect(mockDataService.getThemes).toHaveBeenCalled();
      expect(mockHost.themes.length).toBe(2);
      expect(mockHost.editingRace.theme_id).toBe("default_classic_rc_ai");
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });

    it("should handle getThemes error", () => {
      mockDataService.getThemes.and.returnValue(
        throwError(() => new Error("Network error")),
      );
      RaceEditorCatalogHelper.loadThemes(mockHost);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("loadTracks", () => {
    it("should load tracks and initialize track for new race", (done) => {
      mockHost.editingRace = { entity_id: "new" };
      RaceEditorCatalogHelper.loadTracks(mockHost);
      expect(mockDataService.getTracks).toHaveBeenCalled();
      expect(mockHost.tracks.length).toBe(1);
      expect(mockHost.editingRace.track_entity_id).toBe("track_1");
      expect(mockHost.undoManager.initialize).toHaveBeenCalled();
      expect(mockHost.enforceFuelRules).toHaveBeenCalled();

      setTimeout(() => {
        expect(mockCdr.detectChanges).toHaveBeenCalled();
        done();
      }, 10);
    });

    it("should handle error gracefully", () => {
      mockDataService.getTracks.and.returnValue(
        throwError(() => new Error("Track err")),
      );
      RaceEditorCatalogHelper.loadTracks(mockHost);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("createNewRace", () => {
    it("should initialize default template and set properties", (done) => {
      mockHost.tracks = [
        new Track({ entity_id: "t_1", name: "T1", lanes: [] }),
      ];
      mockHost.themes = [
        { entity_id: "th_1", is_default: true, name: "Th1" } as Theme,
      ];
      RaceEditorCatalogHelper.createNewRace(mockHost);

      expect(mockHost.isNavigationApproved).toBeFalse();
      expect(mockHost.focusNameInput).toHaveBeenCalled();
      expect(mockHost.editingRace.track_entity_id).toBe("t_1");
      expect(mockHost.editingRace.theme_id).toBe("th_1");
      expect(mockHost.undoManager.initialize).toHaveBeenCalled();

      setTimeout(() => {
        expect(mockCdr.detectChanges).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe("initDriverCount", () => {
    it("should read driverCount from query params if valid", () => {
      (mockRoute.snapshot.queryParamMap.get as jasmine.Spy).and.returnValue(
        "6",
      );
      RaceEditorCatalogHelper.initDriverCount(mockHost);
      expect(mockHost.driverCount).toBe(6);
      expect(mockHost.saveDriverCount).toHaveBeenCalled();
    });

    it("should fallback to loadDriverCount if param is missing or invalid", () => {
      (mockRoute.snapshot.queryParamMap.get as jasmine.Spy).and.returnValue(
        "invalid",
      );
      RaceEditorCatalogHelper.initDriverCount(mockHost);
      expect(mockHost.loadDriverCount).toHaveBeenCalled();
    });
  });

  describe("loadDefaultRace", () => {
    it("should load last edited race if present", () => {
      RaceEditorCatalogHelper.loadDefaultRace(mockHost);
      expect(mockHost.loadRace).toHaveBeenCalledWith("race_123");
    });

    it("should load empty id if no last edited race", () => {
      mockNavigationService.getLastEditedId.and.returnValue(null);
      RaceEditorCatalogHelper.loadDefaultRace(mockHost);
      expect(mockHost.loadRace).toHaveBeenCalledWith("");
    });
  });

  describe("initRouteHandling", () => {
    it("should subscribe to route.queryParamMap and load race", () => {
      RaceEditorCatalogHelper.initRouteHandling(mockHost);
      expect(mockHost.subscriptions.length).toBe(1);

      const paramMap = {
        get: (key: string) => (key === "id" ? "race_99" : null),
      };
      queryParamMapSubject.next(paramMap);
      expect(mockNavigationService.setLastEditedId).toHaveBeenCalledWith(
        "race",
        "race_99",
      );
      expect(mockHost.loadRace).toHaveBeenCalledWith("race_99");
    });

    it("should prompt discard when changes are unsaved", async () => {
      mockHost.hasChanges = jasmine
        .createSpy("hasChanges")
        .and.returnValue(true);
      (mockHost.confirmDiscard as jasmine.Spy).and.returnValue(
        Promise.resolve(false),
      );

      RaceEditorCatalogHelper.initRouteHandling(mockHost);
      const paramMap = {
        get: (key: string) => (key === "id" ? "race_diff" : null),
      };
      queryParamMapSubject.next(paramMap);

      await Promise.resolve();
      expect(mockHost.isReverting).toBeTrue();
      expect(mockRouter.navigate).toHaveBeenCalled();
    });
  });
});
