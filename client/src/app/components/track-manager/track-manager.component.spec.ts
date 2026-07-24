import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import {} from "@app/models/settings";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS as _MOCK_TRACKS,
} from "@app/testing/data/tracks_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";
import { deepCopy } from "@app/utils/clone.utils";

import { NavigationService } from "../../services/navigation.service";
import { createTrackManagerDataServiceMock } from "./testing/track-manager_helper";
import { TrackManagerComponent } from "./track-manager.component";

describe("TrackManagerComponent", () => {
  let component: TrackManagerComponent;
  let fixture: ComponentFixture<TrackManagerComponent>;
  let dataService: any;
  let router: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));

    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: (_key: string): string | null => null,
        },
      },
      queryParamMap: of({ get: (_key: string) => null }),
      queryParams: of({ help: "false" }),
    };

    const mockConnectionMonitor = jasmine.createSpyObj(
      "ConnectionMonitorService",
      ["startMonitoring", "stopMonitoring"],
      { connectionState$: of() },
    );

    const mockRaceConnectionService = jasmine.createSpyObj(
      "RaceConnectionService",
      ["connect", "disconnect"],
    );

    await TestBed.configureTestingModule({
      imports: [TrackManagerComponent, TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DataService, useValue: createTrackManagerDataServiceMock() },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SettingsService, useValue: mockSettingsService },
        {
          provide: HelpService,
          useValue: jasmine.createSpyObj("HelpService", ["startGuide"], {
            isVisible$: of(false),
            currentStep$: of(null),
            hasNext$: of(false),
            hasPrevious$: of(false),
          }),
        },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackManagerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    router = TestBed.inject(Router);
    // Deep copy mock data AND set prototypes to ensure Track methods work
    component.tracks = deepCopy(MOCK_TRACK_INSTANCES).map((t: any) => {
      Object.setPrototypeOf(t, Track.prototype);
      return t;
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load tracks on init", () => {
    expect(component.tracks.length).toBe(3);
    expect(component.selectedTrack?.name).toBe("Classic Circuit");
  });

  it("should select a track", () => {
    component.selectTrack(component.tracks[1]);
    expect(component.selectedTrack?.name).toBe("Speedway");
  });

  it("should select track from query parameter on init", () => {
    // Setup route with selectedId=t2
    const route = TestBed.inject(ActivatedRoute) as any;
    spyOn(route.snapshot.queryParamMap, "get").and.callFake((key: string) => {
      if (key === "selectedId") return "t2";
      return null;
    });

    component.ngOnInit();
    expect(component.selectedTrack?.entity_id).toBe("t2");
  });

  it("should select track from NavigationService lastEditedId on loadTracks", () => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "getLastEditedId").and.returnValue("t3");
    spyOn(navService, "clearLastEditedId");

    component.loadTracks();

    expect(navService.getLastEditedId).toHaveBeenCalledWith("track");
    expect(navService.clearLastEditedId).toHaveBeenCalledWith("track");
    expect(component.selectedTrack?.entity_id).toBe("t3");
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.any(Object),
      queryParams: { id: "t3" },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  });

  it("should navigate to editor for editing", () => {
    component.editTrack();
    expect(router.navigate).toHaveBeenCalledWith(["/track-editor"], {
      queryParams: {
        id: "t1",
        from: null,
        returnUrl: null,
      },
    });
  });

  it("should propagate 'from' and 'returnUrl' when navigating to editor", () => {
    const route = TestBed.inject(ActivatedRoute) as any;
    spyOn(route.snapshot.queryParamMap, "get").and.callFake((key: string) => {
      if (key === "from") return "modify-heats";
      if (key === "returnUrl") return "/default-raceday";
      return null;
    });

    component.editTrack();
    expect(router.navigate).toHaveBeenCalledWith(["/track-editor"], {
      queryParams: {
        id: "t1",
        from: "modify-heats",
        returnUrl: "/default-raceday",
      },
    });
  });

  it("should create a new track with unique name and navigate", () => {
    (component.translationService.translate as jasmine.Spy).and.returnValue(
      "New Track",
    );

    component.createNewTrack();

    expect(dataService.getTrackFactorySettings).toHaveBeenCalled();
    expect(dataService.createTrack).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: "New Track",
        entity_id: "new",
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(["/track-editor"], {
      queryParams: {
        id: "t-new-id",
        from: null,
        returnUrl: null,
      },
    });
  });

  it("should propagate 'from' and 'returnUrl' during creation", () => {
    const route = TestBed.inject(ActivatedRoute) as any;
    spyOn(route.snapshot.queryParamMap, "get").and.callFake((key: string) => {
      if (key === "from") return "modify-heats";
      if (key === "returnUrl") return "/default-raceday";
      return null;
    });

    (component.translationService.translate as jasmine.Spy).and.returnValue(
      "New Track",
    );

    component.createNewTrack();

    expect(router.navigate).toHaveBeenCalledWith(["/track-editor"], {
      queryParams: {
        id: "t-new-id",
        from: "modify-heats",
        returnUrl: "/default-raceday",
      },
    });
  });

  it("should generate a unique name if default name exists", () => {
    (component.translationService.translate as jasmine.Spy).and.returnValue(
      "Classic Circuit",
    ); // Exists in MOCK_TRACKS

    component.createNewTrack();

    expect(dataService.createTrack).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: "Classic Circuit_1",
      }),
    );
  });

  it("should show delete confirmation modal on deleteTrack", () => {
    component.deleteTrack();
    expect(component.showDeleteConfirm).toBeTrue();
  });

  it("should delete track when onConfirmDelete is called", () => {
    spyOn(component, "loadTracks").and.callThrough();

    component.onConfirmDelete();

    expect(component.showDeleteConfirm).toBeFalse();
    expect(dataService.deleteTrack).toHaveBeenCalledWith("t1");
    expect(component.loadTracks).toHaveBeenCalled();
  });

  it("should hide delete confirmation modal when onCancelDelete is called", () => {
    component.showDeleteConfirm = true;
    component.onCancelDelete();

    expect(component.showDeleteConfirm).toBeFalse();
    expect(dataService.deleteTrack).not.toHaveBeenCalled();
  });

  it("should handle extremely long track names without logic errors", () => {
    const longName = "A".repeat(500);
    const mockTrack = new Track({
      entity_id: "t-long",
      name: longName,
      num_track_sections: 100,
      lanes: [],
      has_digital_fuel: false,
      arduino_configs: [],
    });

    component.tracks = [mockTrack];
    component.selectTrack(mockTrack);

    expect(component.selectedTrack?.name).toBe(longName);
    // Logic should remain sound even if CSS truncates it visually
  });

  it("should render phidget summary component when track has phidget_configs", () => {
    const mockTrack = new Track({
      entity_id: "t-phidget",
      name: "Phidget Track",
      num_track_sections: 100,
      lanes: [],
      has_digital_fuel: false,
      arduino_configs: [],
      phidget_configs: [
        {
          name: "Phidget 1",
          serialNumber: 12345,
          isHubPort: false,
          hubPort: 0,
          normallyClosedLaneSensors: false,
          normallyClosedRelays: false,
          useLapsForSegments: false,
          lapPinPitBehavior: 0,
          digitalInIds: [1000],
          digitalOutIds: [],
          analogIds: [],
        },
      ],
    });

    component.tracks = [mockTrack];
    component.selectTrack(mockTrack);
    fixture.detectChanges();

    const phidgetSummary = fixture.nativeElement.querySelector(
      "app-phidget-summary",
    );
    expect(phidgetSummary).toBeTruthy();
  });
});
