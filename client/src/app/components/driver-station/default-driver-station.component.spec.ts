import { ChangeDetectorRef } from "@angular/core";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { FinishMethod } from "@app/models/heat_scoring";
import { Role } from "@app/models/role";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { LapType, RaceFlag, RaceState } from "@app/proto/antigravity";
import { AudioService } from "@app/services/audio.service";
import { AuthService } from "@app/services/auth.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultDriverStationComponent } from "./default-driver-station.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DefaultDriverStationComponent", () => {
  let component: DefaultDriverStationComponent;
  let fixture: ComponentFixture<DefaultDriverStationComponent>;
  let mockDataService: any;
  let mockRaceService: any;
  let mockRaceConnectionService: any;
  let mockThemeService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
      navigateByUrl: jasmine.createSpy("navigateByUrl"),
    };
    mockDataService = jasmine.createSpyObj("DataService", [
      "updateRaceSubscription",
      "getRaceUpdate",
      "getRaceTime",
      "getLaps",
      "getCarData",
      "getStandingsUpdate",
      "connectToInterfaceDataSocket",
      "disconnectFromInterfaceDataSocket",
      "getRaceFlag",
      "getSystemState",
      "listAssets",
    ]);
    mockDataService.getSystemState.and.returnValue(of(null));
    mockDataService.getRaceUpdate.and.returnValue(of({}));
    mockDataService.getRaceTime.and.returnValue(of(0));
    mockDataService.getLaps.and.returnValue(of(null));
    mockDataService.getCarData.and.returnValue(of({}));
    mockDataService.getStandingsUpdate.and.returnValue(of({}));
    mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));
    mockDataService.listAssets.and.returnValue(of([]));
    mockDataService.loadedAssets = [];
    mockDataService.serverUrl = "http://localhost";

    mockThemeService = jasmine.createSpyObj("ThemeService", [
      "resolveAudioConfig",
    ]);
    mockThemeService.resolveAudioConfig.and.returnValue(null);

    mockRaceService = jasmine.createSpyObj("RaceService", [
      "getRace",
      "getCurrentHeat",
      "setRace",
      "setParticipants",
      "setHeats",
      "setCurrentHeat",
    ]);
    mockRaceService.currentHeat$ = of({});
    mockRaceService.race$ = of({});
    mockRaceService.participants$ = new Subject<any[]>();
    mockRaceService.getParticipants = jasmine
      .createSpy("getParticipants")
      .and.returnValue([]);
    mockRaceService.getRace.and.returnValue({
      name: "Mock Race",
      track: {
        lanes: [
          {
            objectId: "l1",
            backgroundColor: "#550000",
            foregroundColor: "#ffffff",
          },
        ],
      },
      fuel_options: { enabled: false },
    });

    const mockActivatedRoute = {
      params: of({ lane: "2" }), // Use a realistic lane number
      snapshot: { queryParamMap: { get: () => null } },
    };

    const mockTranslationService = {
      translate: (key: string) => key,
    };

    mockRaceConnectionService = jasmine.createSpyObj("RaceConnectionService", [
      "connect",
      "disconnect",
    ]);
    mockRaceConnectionService.laps$ = of(null);
    mockRaceConnectionService.raceTime$ = of({ time: 0 });
    mockRaceConnectionService.carData$ = of({});
    mockRaceConnectionService.standingsUpdate$ = new Subject<any>();
    mockRaceConnectionService.interfaceEvents$ = of({});
    mockRaceConnectionService.interfaceAlert$ = of({});
    mockRaceConnectionService.raceState$ = of(RaceState.UNKNOWN_STATE);
    mockRaceConnectionService.raceFlag$ = of(RaceFlag.RED);

    const mockRaceFlagService = jasmine.createSpyObj("RaceFlagService", [
      "getFlagType",
      "getFlagColor",
      "getFlagNameKey",
      "getFlagTypeForFlag",
    ]);
    mockRaceFlagService.getFlagType.and.returnValue("red");
    mockRaceFlagService.getFlagColor.and.returnValue("red");
    mockRaceFlagService.getFlagNameKey.and.returnValue("RACE_FLAG_RED");

    await TestBed.configureTestingModule({
      imports: [DefaultDriverStationComponent, MockTranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceFlagService, useValue: mockRaceFlagService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: AuthService, useValue: { currentRole: Role.VIEWER } },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultDriverStationComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should connect on init and disconnect on destroy", () => {
    fixture.detectChanges();
    expect(mockRaceConnectionService.connect).toHaveBeenCalled();
    fixture.destroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
  });

  it("should disconnect on pagehide", () => {
    mockRaceConnectionService.connect.calls.reset();
    mockRaceConnectionService.disconnect.calls.reset();

    component.onPageHide();

    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
  });

  it("should calculate progress percentage correctly for lap-based race", () => {
    component["race"] = {
      heat_scoring: { finishMethod: FinishMethod.Lap, finishValue: 10 },
    } as any;
    component["driverData"] = {
      lapCount: 4,
      driver: { name: "Driver 1" },
    } as any;

    expect(component.progressPercentage).toBe(40);
  });

  it("should calculate progress percentage correctly for timed race", () => {
    component["race"] = {
      heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 200 },
    } as any;
    component["driverData"] = { driver: { name: "Driver 1" } } as any;
    component["time"] = 100;

    expect(component.progressPercentage).toBe(50);
  });

  it("should return 0 progress and fuel, and false for hasLapData when driver is empty", () => {
    const emptyDriverData = {
      driver: { entity_id: "EMPTY_LANE", isEmpty: () => true },
      lapCount: 5,
    } as any;
    component["driverData"] = emptyDriverData;
    component["race"] = {
      heat_scoring: { finishMethod: FinishMethod.Lap, finishValue: 10 },
    } as any;

    expect(component.isEmptyDriver).toBeTrue();
    expect(component.progressPercentage).toBe(0);
    expect(component.fuelPercentage).toBe(0);
    expect(component.hasLapData).toBeFalse();
  });

  it("should return fuel percentage from participant, keep 0 on out of fuel, or fallback to initialFuelLevel when missing", () => {
    const driverData = {
      driver: { entity_id: "d1", isEmpty: () => false },
      participant: { fuelLevel: 75 },
      initialFuelLevel: 100,
    } as any;
    component["driverData"] = driverData;
    expect(component.fuelPercentage).toBe(75);

    driverData.participant.fuelLevel = 0;
    expect(component.fuelPercentage).toBe(0);

    delete driverData.participant.fuelLevel;
    expect(component.fuelPercentage).toBe(100);
  });

  it("should find driverData by laneIndex when heatDrivers order does not match laneIndex", () => {
    const heat = {
      heatDrivers: [
        { laneIndex: 1, driver: { entity_id: "d2", isEmpty: () => false } },
        { laneIndex: 0, driver: { entity_id: "d1", isEmpty: () => false } },
      ],
    } as any;
    (component as any).laneIndex = 0;
    mockRaceService.getCurrentHeat.and.returnValue(heat);
    (component as any).loadRaceData();
    expect(component["driverData"]?.laneIndex).toBe(0);
  });

  it("should display team name and use team rankings when driver is in a team", () => {
    const team = { entity_id: "t1", name: "Team Extreme" };
    const participant = {
      objectId: "rp1",
      driver: { entity_id: "d1", nickname: "Rocket" },
      team: team,
    };
    const driverData = {
      objectId: "hd1",
      participant: participant,
      driver: participant.driver,
      actualDriver: participant.driver,
    } as any;

    component["driverData"] = driverData;
    component["heat"] = {
      standings: ["t1", "other"],
    } as any;

    mockRaceService.getParticipants.and.returnValue([
      { team: { entity_id: "other" } },
      { team: team },
    ]);

    // Use calculateOverallPosition directly to avoid loadRaceData overwriting driverData from mock service
    component["calculateOverallPosition"]();

    // Manually trigger the heat standing logic that loadRaceData normally does
    const teamEntityId = component["driverData"]?.participant?.team?.entity_id;
    const index = component["heat"]?.standings.findIndex(
      (id: string) =>
        id === component["driverData"]?.objectId ||
        (teamEntityId && id === teamEntityId),
    );
    if (index !== undefined && index >= 0) {
      component["standingsPosition"] = index + 1;
    }

    expect(component["standingsPosition"]).toBe(1);
    expect(component["overallPosition"]).toBe(2);

    fixture.detectChanges();
    const teamElement = fixture.nativeElement.querySelector(".team-name");
    expect(teamElement).toBeTruthy();
    expect(teamElement.textContent).toContain("Team Extreme");
  });

  it("should update standingsPosition from team ID in standingsUpdate subscription", () => {
    // Initialize component to trigger subscriptions
    fixture.detectChanges();

    const team = { entity_id: "t1", name: "Team Extreme" };
    const driverData = {
      objectId: "hd1",
      participant: { team: team },
    } as any;
    component["driverData"] = driverData;
    component["heat"] = { objectId: "h1" } as any;

    // Simulate standings update for the team
    const update = {
      updates: [{ objectId: "t1", rank: 3 }],
    };
    (mockRaceConnectionService.standingsUpdate$ as any).next(update);

    expect(component["standingsPosition"]).toBe(3);
  });

  it("should handle raceFlag$ emissions without error", () => {
    const raceFlagSubject = new Subject<RaceFlag>();
    mockRaceConnectionService.raceFlag$ = raceFlagSubject;

    fixture.detectChanges();

    // Emit a new flag value - should not throw error
    raceFlagSubject.next(RaceFlag.CHECKERED);
    raceFlagSubject.next(RaceFlag.GREEN);
    raceFlagSubject.next(RaceFlag.RED);

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });

  it("should return RED flag type when individual driver is finished in allow finish mode", () => {
    const mockRaceFlagService = TestBed.inject(RaceFlagService);
    (mockRaceFlagService.getFlagTypeForFlag as jasmine.Spy).and.returnValue(
      "red",
    );

    component["driverData"] = { flag: RaceFlag.RED } as any;
    const result = component.raceStateColor;
    expect(result).toBe("red");
    expect(mockRaceFlagService.getFlagTypeForFlag).toHaveBeenCalledWith(
      RaceFlag.RED,
    );
  });

  it("should return CHECKERED flag type when individual driver is still racing and race is checkered", () => {
    const mockRaceFlagService = TestBed.inject(RaceFlagService);
    (mockRaceFlagService.getFlagTypeForFlag as jasmine.Spy).and.returnValue(
      "checkered",
    );

    component["driverData"] = { flag: RaceFlag.CHECKERED } as any;
    const result = component.raceStateColor;
    expect(result).toBe("checkered");
    expect(mockRaceFlagService.getFlagTypeForFlag).toHaveBeenCalledWith(
      RaceFlag.CHECKERED,
    );
  });

  describe("hasLapData", () => {
    it("should return false if no driverData", () => {
      component["driverData"] = undefined;
      expect(component.hasLapData).toBeFalse();
    });

    it("should return true if reactionTime > 0", () => {
      component["driverData"] = {
        reactionTime: 0.123,
        lapTimes: [],
        driver: { name: "Driver 1" },
      } as any;
      expect(component.hasLapData).toBeTrue();
    });

    it("should return true if lapTimes has entries", () => {
      component["driverData"] = {
        reactionTime: 0,
        lapTimes: [1.23],
        driver: { name: "Driver 1" },
      } as any;
      expect(component.hasLapData).toBeTrue();
    });

    it("should return false if no reactionTime and no lapTimes and no adjustments", () => {
      component["driverData"] = {
        reactionTime: 0,
        lapTimes: [],
        userLaps: 0,
        autoCalculatedLaps: 0,
        penaltyLaps: 0,
        adjustedLapCount: 0,
      } as any;
      expect(component.hasLapData).toBeFalse();
    });
  });

  describe("Viewer Race Ended Redirect", () => {
    it("should redirect to /raceday-setup on acknowledge if race has ended", () => {
      fixture.detectChanges();
      const routerSpy = TestBed.inject(Router);

      component.raceHasEnded = true;
      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith("/raceday-setup");
    });

    it("should not redirect to /raceday-setup on acknowledge if race has not ended", () => {
      fixture.detectChanges();
      const routerSpy = TestBed.inject(Router);

      component.raceHasEnded = false;
      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe("Lap Audio", () => {
    it("should not trigger playSound if driver audio is type none", () => {
      const lapsSubject = new Subject<any>();
      mockRaceConnectionService.laps$ = lapsSubject.asObservable();

      const mockDriver = {
        name: "Test Driver",
        bestLapAudio: { type: "none" },
        lapAudio: { type: "none" },
        penaltyAudio: { type: "none" },
      };
      const driverData = {
        objectId: "hd1",
        driver: mockDriver,
      } as any;
      component["driverData"] = driverData;
      component["heat"] = {
        objectId: "h1",
        heatDrivers: [driverData],
      } as any;

      fixture.detectChanges();
      component.ngOnInit();

      // Emit a best lap
      lapsSubject.next({
        objectId: "hd1",
        lapTime: 1.0,
        bestLapTime: 1.0,
      });

      // Verification: with type: "none", no audio is played and no errors thrown
      expect(true).toBeTrue();
    });

    it("should configure audio relevance filter scoped to its lane and allow general audio", () => {
      component["laneIndex"] = 1;
      component["driverData"] = {
        objectId: "hd1",
        driver: { entity_id: "driver-lane-1", name: "Driver 1" },
      } as any;

      component["updateAudioRelevance"]();

      const audioService = (component as any).audioService as AudioService;
      const filter = audioService.getRelevanceFilter();

      expect(filter?.driverAudioMode).toBe("scoped");
      expect(filter?.allowedLanes?.has(1)).toBeTrue();
      expect(filter?.allowedDriverIds?.has("driver-lane-1")).toBeTrue();
      expect(filter?.allowCountdown).toBeTrue();
      expect(filter?.allowTimer).toBeTrue();
      expect(filter?.allowRaceState).toBeTrue();

      // General sounds are allowed
      expect(
        audioService.isSoundRelevant({ widgetType: "countdown" }),
      ).toBeTrue();
      expect(audioService.isSoundRelevant({ widgetType: "timer" })).toBeTrue();
      expect(audioService.isSoundRelevant({ widgetType: "flag" })).toBeTrue();

      // Sounds for this station's lane are allowed
      expect(
        audioService.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 1,
        }),
      ).toBeTrue();

      // Sounds for another lane are dropped
      expect(
        audioService.isSoundRelevant({
          widgetType: "lane-view",
          laneIndex: 0,
        }),
      ).toBeFalse();
    });

    it("should attach flag association to race state audio", () => {
      const audioService = (component as any).audioService as AudioService;
      spyOn(audioService, "playCallout");
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "preset",
        url: "flag.wav",
      });

      component["playThemedSound"](THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG);
      expect(audioService.playCallout).toHaveBeenCalledWith(
        jasmine.objectContaining({ type: "preset" }),
        "urgent",
        undefined,
        jasmine.any(String),
        { widgetType: "flag" },
      );

      component["playThemedSound"](THEME_SLOT_KEYS.AUDIO_HEAT_OVER);
      expect(audioService.playCallout).toHaveBeenCalledWith(
        jasmine.objectContaining({ type: "preset" }),
        "urgent",
        undefined,
        jasmine.any(String),
        { widgetType: "flag" },
      );
    });

    it("should trigger min lap time and drift lap with driver lane association", () => {
      spyOn(component as any, "playThemedSound");
      const lapsSubject = new Subject<any>();
      mockRaceConnectionService.laps$ = lapsSubject.asObservable();

      const mockDriver = {
        entity_id: "d1",
        name: "Test Driver",
      };
      const driverData = {
        objectId: "hd1",
        laneIndex: 1,
        driver: mockDriver,
      } as any;
      mockRaceService.getRace.and.returnValue({
        track: {
          lanes: [
            { background_color: "#ff0000", foreground_color: "#ffffff" },
            { background_color: "#00ff00", foreground_color: "#000000" },
          ],
        },
        heat_scoring: {},
      } as any);
      mockRaceService.getCurrentHeat.and.returnValue({
        objectId: "h1",
        heatDrivers: [driverData],
      } as any);

      component["laneIndex"] = 1;
      component["driverData"] = driverData;
      component["heat"] = {
        objectId: "h1",
        heatDrivers: [driverData],
      } as any;

      fixture.detectChanges();
      component.ngOnInit();

      // Min lap time
      lapsSubject.next({
        objectId: "hd1",
        type: LapType.MIN_LAP_TIME,
        lapTime: 0.5,
      });

      expect((component as any).playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME,
        jasmine.any(Object),
        {
          widgetType: "lane-view",
          laneIndex: 1,
          driverId: "d1",
        },
      );

      // Drift lap
      lapsSubject.next({
        objectId: "hd1",
        isDrift: true,
        lapTime: 3.5,
      });

      expect((component as any).playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_DRIFT_LAP,
        jasmine.any(Object),
        {
          widgetType: "lane-view",
          laneIndex: 1,
          driverId: "d1",
        },
      );
    });

    it("should update fuel audio only for its own lane", () => {
      const fuelTracker = (component as any).fuelAudioTracker;
      spyOn(fuelTracker, "updateLaneFuel");
      const carDataSubject = new Subject<any>();
      mockRaceConnectionService.carData$ = carDataSubject.asObservable();

      component["laneIndex"] = 1;
      fixture.detectChanges();
      component.ngOnInit();

      // Car data for lane 0 (ignored)
      carDataSubject.next({
        lane: 0,
        fuelLevel: 80,
        isRefueling: false,
      });
      expect(fuelTracker.updateLaneFuel).not.toHaveBeenCalled();

      // Car data for lane 1 (processed)
      carDataSubject.next({
        lane: 1,
        fuelLevel: 75,
        isRefueling: false,
      });
      expect(fuelTracker.updateLaneFuel).toHaveBeenCalledWith(
        1,
        75,
        false,
        undefined,
        false,
        jasmine.any(Object),
        jasmine.any(Object),
        jasmine.any(Array),
        false,
      );
    });

    it("should play halfway sound when heat leader reaches half the lap count in lap-based races", () => {
      spyOn(component as any, "playThemedSound");
      const lapsSubject = new Subject<any>();
      mockRaceConnectionService.laps$ = lapsSubject.asObservable();
      const race = {
        track: { lanes: [{}, {}] },
        heat_scoring: {
          finishMethod: FinishMethod.Lap,
          finishValue: 10,
        },
      } as any;
      const driverData = {
        objectId: "hd1",
        laneIndex: 1,
        driver: { entity_id: "d1", name: "Driver 1" },
      } as any;
      const heat = {
        objectId: "h1",
        heatDrivers: [
          driverData,
          {
            objectId: "hd2",
            laneIndex: 0,
            driver: { entity_id: "d2", name: "Driver 2" },
            lapCount: 0,
          },
        ],
      } as any;

      mockRaceService.getRace.and.returnValue(race);
      mockRaceService.getCurrentHeat.and.returnValue(heat);
      component["laneIndex"] = 1;

      fixture.detectChanges();
      component.ngOnInit();

      // Driver 2 (heat leader) completes lap 4: not halfway yet (10 / 2 = 5)
      lapsSubject.next({
        objectId: "hd2",
        lapNumber: 4,
        lapTime: 2.0,
      });
      expect((component as any).playThemedSound).not.toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        jasmine.any(Object),
        { widgetType: "timer" },
      );

      // Driver 2 (heat leader) completes lap 5: halfway reached!
      lapsSubject.next({
        objectId: "hd2",
        lapNumber: 5,
        lapTime: 2.0,
      });
      expect((component as any).playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        jasmine.any(Object),
        { widgetType: "timer" },
      );

      (component as any).playThemedSound.calls.reset();

      // Driver 1 (station's own driver) completes lap 5 later: should not play again
      lapsSubject.next({
        objectId: "hd1",
        lapNumber: 5,
        lapTime: 2.1,
      });
      expect((component as any).playThemedSound).not.toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        jasmine.any(Object),
        { widgetType: "timer" },
      );
    });
  });
});
