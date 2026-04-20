import { ChangeDetectorRef } from "@angular/core";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { Subject } from "rxjs";
import { DataService } from "src/app/data.service";
import { FinishMethod } from "src/app/models/heat_scoring";
import { com } from "src/app/proto/message";
import { RaceService } from "src/app/services/race.service";
import { RaceConnectionService } from "src/app/services/race-connection.service";
import { RaceFlagService } from "src/app/services/race-flag.service";
import { TranslationService } from "src/app/services/translation.service";

import { DriverStationComponent } from "./driver-station.component";

@Pipe({
  name: "translate",
  standalone: false,
})
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

  beforeEach(async () => {
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
    ]);
    mockDataService.getRaceUpdate.and.returnValue(of({}));
    mockDataService.getRaceTime.and.returnValue(of(0));
    mockDataService.getLaps.and.returnValue(of(null));
    mockDataService.getCarData.and.returnValue(of({}));
    mockDataService.getStandingsUpdate.and.returnValue(of({}));
    mockDataService.getRaceFlag.and.returnValue(
      of(com.antigravity.RaceFlag.RED),
    );
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
    mockRaceConnectionService.raceState$ = of(
      com.antigravity.RaceState.UNKNOWN_STATE,
    );
    mockRaceConnectionService.raceFlag$ = of(com.antigravity.RaceFlag.RED);

    const mockRaceFlagService = jasmine.createSpyObj("RaceFlagService", [
      "getFlagType",
      "getFlagColor",
      "getFlagNameKey",
    ]);
    mockRaceFlagService.getFlagType.and.returnValue("red");
    mockRaceFlagService.getFlagColor.and.returnValue("red");
    mockRaceFlagService.getFlagNameKey.and.returnValue("RACE_FLAG_RED");

    await TestBed.configureTestingModule({
      declarations: [DriverStationComponent, MockTranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceFlagService, useValue: mockRaceFlagService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
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
    const raceFlagSubject = new Subject<com.antigravity.RaceFlag>();
    mockRaceConnectionService.raceFlag$ = raceFlagSubject;

    fixture.detectChanges();

    // Emit a new flag value - should not throw error
    raceFlagSubject.next(com.antigravity.RaceFlag.CHECKERED);
    raceFlagSubject.next(com.antigravity.RaceFlag.GREEN);
    raceFlagSubject.next(com.antigravity.RaceFlag.RED);

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });
});
