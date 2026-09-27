import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { DriverStationComponent } from "@app/components/driver-station/driver-station.component";
import { RacedayHeatDriversComponent } from "@app/components/raceday/components/raceday-heat-drivers/raceday-heat-drivers.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { DataService } from "@app/data.service";
import { AuthService } from "@app/services/auth.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";

import { DriverViewComponent } from "./driver-view.component";
import { DriverViewHarness } from "./testing/driver-view.harness";

@Component({
  selector: "app-driver-station",
  standalone: true,
  template: '<div class="mock-driver-station">Driver Station Mock</div>',
})
class MockDriverStationComponent {
  inputLaneIndex = input<number>(0);
}

@Component({
  selector: "app-raceday-heat-drivers",
  standalone: true,
  template: '<div class="mock-heat-drivers">Heat Drivers Mock</div>',
})
class MockRacedayHeatDriversComponent {
  type = input<string>("");
  track = input<any>(undefined);
  currentHeat = input<any>(undefined);
  heats = input<any>(undefined);
}

@Component({
  selector: "app-browser-navigation",
  standalone: true,
  template: '<div class="mock-nav">Nav Mock</div>',
})
class MockBrowserNavigationComponent {}

@Component({
  selector: "app-acknowledgement-modal",
  standalone: true,
  template: '<div class="mock-ack">Ack Mock</div>',
})
class MockAcknowledgementModalComponent {
  visible = input<boolean>(false);
  title = input<string>("");
  message = input<string>("");
  buttonText = input<string>("");
}

describe("DriverViewComponent", () => {
  let component: DriverViewComponent;
  let fixture: ComponentFixture<DriverViewComponent>;
  let harness: DriverViewHarness;

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

    const mockRaceConnectionService = jasmine.createSpyObj(
      "RaceConnectionService",
      ["connect", "disconnect"],
    );

    await TestBed.configureTestingModule({
      imports: [DriverViewComponent],
      providers: [
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
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
          imports: [
            DriverStationComponent,
            RacedayHeatDriversComponent,
            BrowserNavigationComponent,
            AcknowledgementModalComponent,
          ],
        },
        add: {
          imports: [
            MockDriverStationComponent,
            MockRacedayHeatDriversComponent,
            MockBrowserNavigationComponent,
            MockAcknowledgementModalComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DriverViewComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      DriverViewHarness,
    );
  });

  it("should create", async () => {
    // We expect it to create. To avoid `loadData` error from missing mocks:
    mockRaceService.getRace.and.returnValue(null as any);
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(await harness.exists()).toBeTrue();
  });

  it("should set isRacingInCurrentHeat to true if driver is in current heat", async () => {
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

    (component as any).loadData();
    fixture.detectChanges();

    expect((component as any).isRacingInCurrentHeat).toBeTrue();
    expect((component as any).laneIndex).toBe(1);
    expect(await harness.isRacingMode()).toBeTrue();
    expect(await harness.isOnDeckMode()).toBeFalse();
  });

  it("should set isRacingInCurrentHeat to false if driver is NOT in current heat", async () => {
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

    (component as any).loadData();
    fixture.detectChanges();

    expect((component as any).isRacingInCurrentHeat).toBeFalse();
    expect(await harness.isRacingMode()).toBeFalse();
    expect(await harness.isOnDeckMode()).toBeTrue();
  });

  it("should match driver by driver name or encoded driver name when entity_id is empty", () => {
    const mockRace = { track: {} };
    const mockHeat = {
      heatDrivers: [
        { driver: { entity_id: "", name: "Bank Farter" } },
        { driver: { entity_id: "", name: "Sports mode" } },
      ],
    };
    mockRaceService.getRace.and.returnValue(mockRace as any);
    mockRaceService.getHeats.and.returnValue([]);
    mockRaceService.getCurrentHeat.and.returnValue(mockHeat as any);

    (component as any).driverId = "Sports%20mode";
    (component as any).loadData();

    expect((component as any).isRacingInCurrentHeat).toBeTrue();
    expect((component as any).laneIndex).toBe(1);
  });

  it("should connect on init and disconnect on destroy", () => {
    const mockRaceConnection = TestBed.inject(RaceConnectionService) as any;
    fixture.detectChanges();
    expect(mockRaceConnection.connect).toHaveBeenCalled();
    fixture.destroy();
    expect(mockRaceConnection.disconnect).toHaveBeenCalledWith();
  });

  it("should disconnect on pagehide", () => {
    const mockRaceConnection = TestBed.inject(RaceConnectionService) as any;
    mockRaceConnection.connect.calls.reset();
    mockRaceConnection.disconnect.calls.reset();

    component.onPageHide();

    expect(mockRaceConnection.disconnect).toHaveBeenCalledWith();
  });
});
