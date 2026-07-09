import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { DriverStationComponent } from "@app/components/driver-station/driver-station.component";
import { RacedayHeatDriversComponent } from "@app/components/raceday/components/raceday-heat-drivers/raceday-heat-drivers.component";
import { DataService } from "@app/data.service";
import { AuthService } from "@app/services/auth.service";
import { RaceService } from "@app/services/race.service";

import { DriverViewComponent } from "./driver-view.component";

describe("DriverViewComponent", () => {
  let component: DriverViewComponent;
  let fixture: ComponentFixture<DriverViewComponent>;

  let mockRaceService: jasmine.SpyObj<RaceService>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockRaceService = jasmine.createSpyObj(
      "RaceService",
      ["getRace", "getCurrentHeat", "getHeats", "clear"],
      {
        currentHeat$: of({}),
        selectedRace$: of({}),
      },
    );

    mockDataService = {
      serverUrl: "http://localhost",
      getSystemState: jasmine
        .createSpy("getSystemState")
        .and.returnValue(of({})),
      updateRaceSubscription: jasmine
        .createSpy("updateRaceSubscription")
        .and.returnValue(of({})),
      getRaceUpdate: jasmine.createSpy("getRaceUpdate").and.returnValue(of({})),
      getRaceTime: jasmine.createSpy("getRaceTime").and.returnValue(of({})),
      getLaps: jasmine.createSpy("getLaps").and.returnValue(of({})),
      getCarData: jasmine.createSpy("getCarData").and.returnValue(of({})),
      getSegments: jasmine.createSpy("getSegments").and.returnValue(of({})),
      getStandingsUpdate: jasmine
        .createSpy("getStandingsUpdate")
        .and.returnValue(of({})),
      getOverallStandingsUpdate: jasmine
        .createSpy("getOverallStandingsUpdate")
        .and.returnValue(of({})),
      getGroupStandingsUpdate: jasmine
        .createSpy("getGroupStandingsUpdate")
        .and.returnValue(of({})),
      getInterfaceEvents: jasmine
        .createSpy("getInterfaceEvents")
        .and.returnValue(of({})),
      getRaceState: jasmine.createSpy("getRaceState").and.returnValue(of({})),
      getRaceFlag: jasmine.createSpy("getRaceFlag").and.returnValue(of({})),
      getRecordData: jasmine.createSpy("getRecordData").and.returnValue(of({})),
      getHeats: jasmine.createSpy("getHeats").and.returnValue(of({})),
      getDrivers: jasmine.createSpy("getDrivers").and.returnValue(of([])),
      connectToInterfaceDataSocket: jasmine.createSpy(
        "connectToInterfaceDataSocket",
      ),
      disconnectFromInterfaceDataSocket: jasmine.createSpy(
        "disconnectFromInterfaceDataSocket",
      ),
      getLeaderboardUpdate: jasmine
        .createSpy("getLeaderboardUpdate")
        .and.returnValue(of({})),
      getHeatDriverUpdate: jasmine
        .createSpy("getHeatDriverUpdate")
        .and.returnValue(of({})),
      getDisconnectedError: jasmine
        .createSpy("getDisconnectedError")
        .and.returnValue(of({})),
      socketConnected$: of(true),
    } as any;
    mockAuthService = jasmine.createSpyObj("AuthService", [], {
      currentRole: "ADMIN",
    });

    await TestBed.configureTestingModule({
      imports: [DriverViewComponent],
      providers: [
        { provide: RaceService, useValue: mockRaceService },
        { provide: DataService, useValue: mockDataService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ driverId: "driver123" }) },
        },
      ],
    })
      .overrideComponent(DriverViewComponent, {
        remove: {
          imports: [DriverStationComponent, RacedayHeatDriversComponent],
        },
        add: { imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DriverViewComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    // We expect it to create. To avoid `loadData` error from missing mocks:
    mockRaceService.getRace.and.returnValue(null as any);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should set isRacingInCurrentHeat to true if driver is in current heat", () => {
    const mockRace = { track: {} };
    const mockHeat = {
      heatDrivers: [
        { driver: { entity_id: "otherDriver" } },
        { driver: { entity_id: "driver123" } },
      ],
    };
    mockRaceService.getRace.and.returnValue(mockRace as any);
    mockRaceService.getHeats.and.returnValue([]);
    mockRaceService.getCurrentHeat.and.returnValue(mockHeat as any);

    fixture.detectChanges();

    expect((component as any).isRacingInCurrentHeat).toBeTrue();
    expect((component as any).laneIndex).toBe(1);
  });

  it("should set isRacingInCurrentHeat to false if driver is NOT in current heat", () => {
    const mockRace = { track: {} };
    const mockHeat = {
      heatDrivers: [
        { driver: { entity_id: "otherDriver1" } },
        { driver: { entity_id: "otherDriver2" } },
      ],
    };
    mockRaceService.getRace.and.returnValue(mockRace as any);
    mockRaceService.getHeats.and.returnValue([]);
    mockRaceService.getCurrentHeat.and.returnValue(mockHeat as any);

    fixture.detectChanges();

    expect((component as any).isRacingInCurrentHeat).toBeFalse();
  });
});
