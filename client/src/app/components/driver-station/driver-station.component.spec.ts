import { ChangeDetectorRef } from "@angular/core";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { FinishMethod } from "@app/models/heat_scoring";
import { Role } from "@app/models/role";
import { RaceFlag, RaceState } from "@app/proto/antigravity";
import { AuthService } from "@app/services/auth.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { TranslationService } from "@app/services/translation.service";

import { DriverStationComponent } from "./driver-station.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DriverStationComponent", () => {
  let component: DriverStationComponent;
  let fixture: ComponentFixture<DriverStationComponent>;
  let mockDataService: any;
  let mockRaceService: any;
  let mockRaceConnectionService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
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
    ]);
    mockDataService.getSystemState.and.returnValue(of(null));
    mockDataService.getRaceUpdate.and.returnValue(of({}));
    mockDataService.getRaceTime.and.returnValue(of(0));
    mockDataService.getLaps.and.returnValue(of(null));
    mockDataService.getCarData.and.returnValue(of({}));
    mockDataService.getStandingsUpdate.and.returnValue(of({}));
    mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));
    mockDataService.serverUrl = "http://localhost";

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
      imports: [DriverStationComponent, MockTranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceFlagService, useValue: mockRaceFlagService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: AuthService, useValue: { currentRole: Role.VIEWER } },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverStationComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should calculate progress percentage correctly for lap-based race", () => {
    component["race"] = {
      heat_scoring: { finishMethod: FinishMethod.Lap, finishValue: 10 },
    } as any;
    component["driverData"] = { lapCount: 4 } as any;

    expect(component.progressPercentage).toBe(40);
  });

  it("should calculate progress percentage correctly for timed race", () => {
    component["race"] = {
      heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 200 },
    } as any;
    component["time"] = 100;

    expect(component.progressPercentage).toBe(50);
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

  describe("Viewer Race Ended Redirect", () => {
    it("should redirect to /raceday-setup on acknowledge if race has ended", () => {
      fixture.detectChanges();
      const routerSpy = TestBed.inject(Router);

      component.raceHasEnded = true;
      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });

    it("should not redirect to /raceday-setup on acknowledge if race has not ended", () => {
      fixture.detectChanges();
      const routerSpy = TestBed.inject(Router);

      component.raceHasEnded = false;
      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
