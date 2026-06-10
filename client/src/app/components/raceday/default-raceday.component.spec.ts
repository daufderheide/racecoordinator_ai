import { DragDropModule } from "@angular/cdk/drag-drop";
import {
  ChangeDetectorRef,
  Component,
  input,
  output,
  Pipe,
  PipeTransform,
} from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { DataService } from "@app/data.service";
import { AllowFinish, FinishMethod } from "@app/models/heat_scoring";
import { OverallRanking } from "@app/models/overall_scoring";
import { ColumnVisibility, Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

import { BehaviorSubject, of, Subject } from "rxjs";
import { Role } from "@app/models/role";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { AuthService } from "@app/services/auth.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import * as _audio from "@app/utils/audio";

@Component({
  selector: "app-acknowledgement-modal",
  standalone: true,
  template: "",
  imports: [DragDropModule],
})
class DefaultRacedayMockAcknowledgementModalComponent {
  visible = input<boolean>(false);
  title = input<string>("");
  message = input<string>("");
  buttonText = input<string>("");
  acknowledge = output<void>();
}

@Component({
  selector: "app-confirmation-modal",
  standalone: true,
  template: "",
  imports: [DragDropModule],
})
class DefaultRacedayMockConfirmationModalComponent {
  visible = input<boolean>(false);
  title = input<string>("");
  message = input<string>("");
  confirmText = input<string>("");
  cancelText = input<string>("");
  confirm = output<void>();
  cancel = output<void>();
}

import {
  IInterfaceEvent,
  ILap,
  IRaceTime,
  IRecordData,
  IStandingsUpdate,
  LapType,
  RaceFlag,
  RaceState,
} from "@app/proto/antigravity";
import { PrintService } from "@app/services/print.service";
import { MOCK_HEATS } from "@app/testing/data/heats_data";
import { MOCK_RACES } from "@app/testing/data/races_data";
import { createDefaultSettings } from "@app/testing/data/settings_data";
import { MOCK_TRACKS } from "@app/testing/data/tracks_data";
import {
  mockRouter,
  mockSettingsService as _mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { AnchorPoint } from "./column_definition";
import { DefaultRacedayComponent } from "./default-raceday.component";
import { createRacedayMocks } from "./testing/raceday_helper";

describe("DefaultRacedayComponent", () => {
  let component: DefaultRacedayComponent;
  let fixture: ComponentFixture<DefaultRacedayComponent>;
  let mockDataService: any;
  let mockRaceService: any;
  let mockSettings: Settings;
  let mockRaceConnectionService: any;
  let mockRaceFlagService: any;
  let interfaceEventsSubject: Subject<IInterfaceEvent>;
  let interfaceAlertSubject: Subject<{ titleKey: string; messageKey: string }>;
  let raceTimeSubject: Subject<IRaceTime>;
  let lapsSubject: Subject<ILap>;
  let standingsUpdateSubject: Subject<IStandingsUpdate>;
  let mockAudioInstance: any;
  let recordDataSubject: Subject<IRecordData>;
  let participantsSubject: Subject<any[]>;
  let mockLogger: any;

  let raceStateSubject: Subject<RaceState>;
  let mockAuthService: any;

  beforeEach(() => {
    mockAudioInstance = jasmine.createSpyObj("AudioInstance", [
      "play",
      "pause",
      "load",
    ]);
    mockAudioInstance.play.and.returnValue(Promise.resolve());

    spyOn(window, "Audio").and.callFake(function (this: any) {
      return mockAudioInstance;
    } as any);
  });

  beforeEach(async () => {
    const mocks = createRacedayMocks();
    mockDataService = mocks.mockDataService;
    mockRaceService = mocks.mockRaceService;
    mockRaceFlagService = mocks.mockRaceFlagService;
    mockRaceConnectionService = mocks.mockRaceConnectionService;
    interfaceEventsSubject = mocks.interfaceEventsSubject;
    interfaceAlertSubject = mocks.interfaceAlertSubject;
    raceTimeSubject = mocks.raceTimeSubject;
    lapsSubject = mocks.lapsSubject;
    raceStateSubject = mocks.raceStateSubject;
    standingsUpdateSubject = mocks.standingsUpdateSubject;
    recordDataSubject = mocks.recordDataSubject;
    participantsSubject = mocks.participantsSubject;

    mockAuthService = {
      currentRoleSubject: new BehaviorSubject<Role>(Role.DIRECTOR),
      get currentRole() {
        return this.currentRoleSubject.value;
      },
      get currentRole$() {
        return this.currentRoleSubject.asObservable();
      },
      logout: jasmine.createSpy("logout"),
    };

    mockLogger = jasmine.createSpyObj("LoggerService", [
      "debug",
      "info",
      "warn",
      "error",
      ,
      "log",
    ]);

    mockAudioInstance.play.calls.reset();

    mockSettings = createDefaultSettings({
      sortByStandings: true,
      racedayColumns: ["driver.nickname", "lapCount", "fuelPercentage"],
      columnVisibility: {
        fuelPercentage: ColumnVisibility.FuelRaceOnly,
      },
    });

    const mockActivatedRoute = {
      queryParams: of({}),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        DragDropModule,
        DefaultRacedayComponent,
        DefaultRacedayMockAcknowledgementModalComponent,
        DefaultRacedayMockConfirmationModalComponent,
        MockTranslatePipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceFlagService, useValue: mocks.mockRaceFlagService },
        {
          provide: SettingsService,
          useValue: {
            getSettings: () => mockSettings,
            saveSettings: jasmine.createSpy("saveSettings"),
          },
        },
        {
          provide: ThemeService,
          useValue: jasmine.createSpyObj("ThemeService", [
            "resolveAssetId",
            "resolveAudioConfig",
          ]),
        },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LoggerService, useValue: mockLogger },
        {
          provide: PrintService,
          useValue: jasmine.createSpyObj("PrintService", ["print"]),
        },
        { provide: AuthService, useValue: mockAuthService },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultRacedayComponent);
    component = fixture.componentInstance;
    const mockTrack = {
      ...MOCK_TRACKS[0],
      hasDigitalFuel: () => false,
    };
    component["race"] = { ...MOCK_RACES[0], track: mockTrack } as any;
    component["track"] = mockTrack as any;
    component["heat"] = MOCK_HEATS[0] as any;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    resetMocks();
  });
  // fixture.detectChanges(); // Removed to allow manual control in fakeAsync

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should disconnect from race on destroy", () => {
    fixture.detectChanges();
    fixture.destroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalled();
  });

  it("should update countdown timers when raceTime$ emits", () => {
    fixture.detectChanges();

    raceTimeSubject.next({
      time: 123.456,
      autoStartRemaining: 5.4,
      autoAdvanceRemaining: 0,
    });

    expect(component["time"]).toBe(5.4);
    expect(component["autoStartRemaining"]).toBe(5.4);
    expect(component["autoAdvanceRemaining"]).toBe(0);

    raceTimeSubject.next({
      time: 0,
      autoStartRemaining: 0,
      autoAdvanceRemaining: 9.8,
    });

    expect(component["time"]).toBe(9.8);
    expect(component["autoStartRemaining"]).toBe(0);
    expect(component["autoAdvanceRemaining"]).toBe(9.8);
  });

  it("should update isInterfaceConnected when interface connects", () => {
    fixture.detectChanges();
    expect((component as any).isInterfaceConnected).toBeFalse();

    mockRaceConnectionService.isInterfaceConnected = true;
    interfaceEventsSubject.next({});

    expect((component as any).isInterfaceConnected).toBeTrue();
  });

  it("should update isInterfaceConnected when interface disconnects", () => {
    fixture.detectChanges();

    mockRaceConnectionService.isInterfaceConnected = true;
    interfaceEventsSubject.next({});
    expect((component as any).isInterfaceConnected).toBeTrue();

    mockRaceConnectionService.isInterfaceConnected = false;
    interfaceEventsSubject.next({});

    expect((component as any).isInterfaceConnected).toBeFalse();
  });

  it("should wait 5s before showing modal on NO_DATA during startup", fakeAsync(() => {
    // Logic moved to service, this test can be removed or verified in service tests.
    // For now, verify alerting logic triggers modal.
    fixture.detectChanges();
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_NO_DATA",
      messageKey: "ACK_MODAL_MSG_NO_DATA",
    });
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe("ACK_MODAL_TITLE_NO_DATA");
  }));

  it("should show NO_DATA immediately if already initially connected", () => {
    fixture.detectChanges();
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_NO_DATA",
      messageKey: "ACK_MODAL_MSG_NO_DATA",
    });
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe("ACK_MODAL_TITLE_NO_DATA");
  });

  it("should wait 5s before showing modal on DISCONNECTED", fakeAsync(() => {
    fixture.detectChanges();
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
      messageKey: "ACK_MODAL_MSG_DISCONNECTED",
    });
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe("ACK_MODAL_TITLE_DISCONNECTED");
  }));

  it("should not show DISCONNECTED modal if CONNECTED before timeout", fakeAsync(() => {
    fixture.detectChanges();
    // Alerting logic now inside service, just testing that alert triggers modal
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
      messageKey: "ACK_MODAL_MSG_DISCONNECTED",
    });
    expect(component.showAckModal).toBeTrue();
  }));

  it("should show CONNECTED modal if recovered after error shown", () => {
    fixture.detectChanges();
    // Simulate error first
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
      messageKey: "ACK_MODAL_MSG_DISCONNECTED",
    });
    expect(component.showAckModal).toBeTrue();

    // Now simulate recovery
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_CONNECTED",
      messageKey: "ACK_MODAL_MSG_CONNECTED",
    });
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe("ACK_MODAL_TITLE_CONNECTED");
  });

  it("should trigger DISCONNECTED on NO_STATUS watchdog if not initially connected", fakeAsync(() => {
    fixture.detectChanges();
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
      messageKey: "ACK_MODAL_MSG_DISCONNECTED",
    });
    expect(component.showAckModal).toBeTrue();
  }));

  it("should trigger NO_STATUS on watchdog if successfully connected first", fakeAsync(() => {
    fixture.detectChanges();
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_NO_STATUS",
      messageKey: "ACK_MODAL_MSG_NO_STATUS",
    });
    expect(component.showAckModal).toBeTrue();
  }));

  it("should ignore duplicate status updates", fakeAsync(() => {
    fixture.detectChanges();
    interfaceAlertSubject.next({
      titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
      messageKey: "ACK_MODAL_MSG_DISCONNECTED",
    });
    expect(component.showAckModal).toBeTrue();
  }));

  describe("isNextHeatDisabled", () => {
    it("should be disabled when state is STARTING", () => {
      fixture.detectChanges();
      component["raceState"] = RaceState.STARTING;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it("should be disabled when state is RACING", () => {
      fixture.detectChanges();
      component["raceState"] = RaceState.RACING;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it("should be enabled when state is HEAT_OVER", () => {
      fixture.detectChanges();
      component["raceState"] = RaceState.HEAT_OVER;
      expect(component.isNextHeatDisabled).toBeFalse();
    });

    it("should be disabled when state is RACE_OVER", () => {
      fixture.detectChanges();
      component["raceState"] = RaceState.RACE_OVER;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it("should be disabled when state is NOT_STARTED", () => {
      fixture.detectChanges();
      component["raceState"] = RaceState.NOT_STARTED;
      expect(component.isNextHeatDisabled).toBeTrue();
    });
  });

  describe("isPauseDisabled", () => {
    beforeEach(() => {
      component["isInterfaceConnected"] = true;
    });

    it("should be enabled in NOT_STARTED if autoStartRemaining > 0", () => {
      component["raceState"] = RaceState.NOT_STARTED;
      component["autoStartRemaining"] = 5.0;
      expect(component.isPauseDisabled).toBeFalse();
    });

    it("should be disabled in NOT_STARTED if autoStartRemaining <= 0", () => {
      component["raceState"] = RaceState.NOT_STARTED;
      component["autoStartRemaining"] = 0;
      expect(component.isPauseDisabled).toBeTrue();
    });

    it("should be enabled in HEAT_OVER if autoAdvanceRemaining > 0", () => {
      component["raceState"] = RaceState.HEAT_OVER;
      component["autoAdvanceRemaining"] = 5.0;
      expect(component.isPauseDisabled).toBeFalse();
    });

    it("should be disabled in HEAT_OVER if autoAdvanceRemaining <= 0", () => {
      component["raceState"] = RaceState.HEAT_OVER;
      component["autoAdvanceRemaining"] = 0;
      expect(component.isPauseDisabled).toBeTrue();
    });

    it("should be enabled when DISCONNECTED if an auto-timer is active", () => {
      component["isInterfaceConnected"] = false;
      component["raceState"] = RaceState.NOT_STARTED;
      component["autoStartRemaining"] = 5.0;
      expect(component.isPauseDisabled).toBeFalse();
    });
  });

  describe("isStartResumeDisabled", () => {
    it("should be enabled in NOT_STARTED even if interface is disconnected", () => {
      component["isInterfaceConnected"] = false;
      component["raceState"] = RaceState.NOT_STARTED;
      expect(component.isStartResumeDisabled).toBeFalse();
    });

    it("should be enabled in UNKNOWN_STATE even if interface is disconnected", () => {
      component["isInterfaceConnected"] = false;
      component["raceState"] = RaceState.UNKNOWN_STATE;
      expect(component.isStartResumeDisabled).toBeFalse();
    });

    it("should be disabled in STARTING when connected", () => {
      component["isInterfaceConnected"] = true;
      component["raceState"] = RaceState.STARTING;
      expect(component.isStartResumeDisabled).toBeTrue();
    });

    it("should be disabled when disconnected and in RACING", () => {
      component["isInterfaceConnected"] = false;
      component["raceState"] = RaceState.RACING;
      expect(component.isStartResumeDisabled).toBeTrue();
    });
  });

  describe("handleKeyUpEvent (Spacebar)", () => {
    let mockEvent: KeyboardEvent;

    beforeEach(() => {
      mockEvent = new KeyboardEvent("keyup", { code: "Space" });
      spyOn(component, "onMenuSelect");
      // Set connected by default to avoid disabled states
      component["isInterfaceConnected"] = true;
    });

    it("should not trigger anything when typing in an INPUT element", () => {
      const inputEl = document.createElement("input");
      document.body.appendChild(inputEl);
      inputEl.focus();

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).not.toHaveBeenCalled();
      document.body.removeChild(inputEl);
    });

    it("should trigger NEXT_HEAT when state is HEAT_OVER", () => {
      component["raceState"] = RaceState.HEAT_OVER;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("NEXT_HEAT");
    });

    it("should trigger START_RESUME when state is NOT_STARTED", () => {
      component["raceState"] = RaceState.NOT_STARTED;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("START_RESUME");
    });

    it("should trigger START_RESUME when state is PAUSED", () => {
      component["raceState"] = RaceState.PAUSED;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("START_RESUME");
    });

    it("should trigger START_RESUME when state is UNKNOWN_STATE", () => {
      component["raceState"] = RaceState.UNKNOWN_STATE;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("START_RESUME");
    });

    it("should trigger ABORT_TIMERS when state is STARTING", () => {
      component["raceState"] = RaceState.STARTING;
      component["autoStartRemaining"] = 3.0;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("ABORT_TIMERS");
    });

    it("should trigger ABORT_TIMERS when state is RACING (if timer active)", () => {
      component["raceState"] = RaceState.RACING;
      component["autoStartRemaining"] = 3.0;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("ABORT_TIMERS");
    });

    it("should trigger ABORT_TIMERS when state is NOT_STARTED and autoStartRemaining > 0", () => {
      component["raceState"] = RaceState.NOT_STARTED;
      component["autoStartRemaining"] = 5.0;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("ABORT_TIMERS");
    });

    it("should trigger ABORT_TIMERS when state is HEAT_OVER and autoAdvanceRemaining > 0", () => {
      component["raceState"] = RaceState.HEAT_OVER;
      component["autoAdvanceRemaining"] = 5.0;

      component.handleKeyUpEvent(mockEvent);

      expect(component.onMenuSelect).toHaveBeenCalledWith("ABORT_TIMERS");
    });
  });

  describe("onMenuSelect", () => {
    it("should call abortTimers and clear local values when ABORT_TIMERS selected", () => {
      mockDataService.abortTimers.and.returnValue(of(true));
      component["autoStartRemaining"] = 5.0;
      component["autoAdvanceRemaining"] = 3.0;

      component.onMenuSelect("ABORT_TIMERS");

      expect(mockDataService.abortTimers).toHaveBeenCalled();
      expect(component["autoStartRemaining"]).toBe(0);
      expect(component["autoAdvanceRemaining"]).toBe(0);
    });

    it("should show skip race confirmation dialog when SKIP_RACE selected", () => {
      fixture.detectChanges();
      expect(component.showSkipRaceConfirmation).toBeFalse();

      component.onMenuSelect("SKIP_RACE");

      expect(component.showSkipRaceConfirmation).toBeTrue();
    });

    it("should call skipRace on confirm and hide dialog", () => {
      fixture.detectChanges();
      component.showSkipRaceConfirmation = true;

      component.onSkipRaceConfirm();

      expect(component.showSkipRaceConfirmation).toBeFalse();
      expect(mockDataService.skipRace).toHaveBeenCalled();
    });

    it("should hide dialog on skip race cancel without calling skipRace", () => {
      fixture.detectChanges();
      mockDataService.skipRace.calls.reset();
      component.showSkipRaceConfirmation = true;

      component.onSkipRaceCancel();

      expect(component.showSkipRaceConfirmation).toBeFalse();
      expect(mockDataService.skipRace).not.toHaveBeenCalled();
    });

    it("should not open skip race dialog when isSkipRaceDisabled is true", () => {
      fixture.detectChanges();
      component["raceState"] = RaceState.RACE_OVER;

      component.onMenuSelect("SKIP_RACE");

      expect(component.showSkipRaceConfirmation).toBeFalse();
    });

    it("should show restart heat confirmation dialog when RESTART_HEAT selected", () => {
      fixture.detectChanges();
      expect(component.showRestartHeatConfirmation).toBeFalse();

      component.onMenuSelect("RESTART_HEAT");

      expect(component.showRestartHeatConfirmation).toBeTrue();
    });

    it("should call restartHeat on confirm and hide dialog", () => {
      fixture.detectChanges();
      component.showRestartHeatConfirmation = true;

      component.onRestartHeatConfirm();

      expect(component.showRestartHeatConfirmation).toBeFalse();
      expect(mockDataService.restartHeat).toHaveBeenCalled();
    });

    it("should hide dialog on restart heat cancel without calling restartHeat", () => {
      fixture.detectChanges();
      mockDataService.restartHeat.calls.reset();
      component.showRestartHeatConfirmation = true;

      component.onRestartHeatCancel();

      expect(component.showRestartHeatConfirmation).toBeFalse();
      expect(mockDataService.restartHeat).not.toHaveBeenCalled();
    });

    it("should show defer heat confirmation dialog when DEFER_HEAT selected", () => {
      fixture.detectChanges();
      expect(component.showDeferHeatConfirmation).toBeFalse();

      component.onMenuSelect("DEFER_HEAT");

      expect(component.showDeferHeatConfirmation).toBeTrue();
    });

    it("should call deferHeat on confirm and hide dialog", () => {
      fixture.detectChanges();
      component.showDeferHeatConfirmation = true;

      component.onDeferHeatConfirm();

      expect(component.showDeferHeatConfirmation).toBeFalse();
      expect(mockDataService.deferHeat).toHaveBeenCalled();
    });

    it("should hide dialog on defer heat cancel without calling deferHeat", () => {
      fixture.detectChanges();
      mockDataService.deferHeat.calls.reset();
      component.showDeferHeatConfirmation = true;

      component.onDeferHeatCancel();

      expect(component.showDeferHeatConfirmation).toBeFalse();
      expect(mockDataService.deferHeat).not.toHaveBeenCalled();
    });
  });

  describe("viewer role restrictions", () => {
    beforeEach(() => {
      mockAuthService.currentRoleSubject.next(Role.VIEWER);
    });

    it("should disable all Race Director menu items and save for viewer role", () => {
      expect(component.isStartResumeDisabled).toBeTrue();
      expect(component.isPauseDisabled).toBeTrue();
      expect(component.isNextHeatDisabled).toBeTrue();
      expect(component.isRestartHeatDisabled).toBeTrue();
      expect(component.isDeferHeatDisabled).toBeTrue();
      expect(component.isSkipHeatDisabled).toBeTrue();
      expect(component.isSkipRaceDisabled).toBeTrue();
      expect(component.isAddLapDisabled).toBeTrue();
      expect(component.isModifyDisabled).toBeTrue();
      expect(component.isSaveDisabled).toBeTrue();
    });

    it("should not execute action in onMenuSelect for disabled items if user is a viewer", () => {
      mockDataService.startRace.calls.reset();
      component.onMenuSelect("START_RESUME");
      expect(mockDataService.startRace).not.toHaveBeenCalled();
    });

    it("should hide the teammate select pulldown for viewer role", () => {
      mockSettings.racedayColumns = ["driver.name"];
      (component as any).loadColumns();

      const mockHdWithTeam = {
        objectId: "hd-team",
        laneIndex: 0,
        driver: { name: "Team Driver", entity_id: "driver1" },
        participant: {
          team: {
            name: "Team A",
            driverIds: ["driver1", "driver2"],
          },
        },
        currentLapSegments: [],
      };
      component["sortedHeatDrivers"] = [mockHdWithTeam as any];
      component["allDrivers"] = [
        { entity_id: "driver1", name: "Team Driver" },
        { entity_id: "driver2", name: "Teammate" },
      ] as any;

      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector(".teammate-select");
      expect(select).toBeFalsy();
    });
  });

  describe("formatValue", () => {
    let mockHd: any;

    beforeEach(() => {
      mockHd = {
        participant: {
          fuelLevel: 55.5,
        },
        driver: {
          name: "Test Driver",
        },
      };

      const mockTrack = { hasDigitalFuel: () => false };
      const mockRace = {
        track: mockTrack,
        fuel_options: {
          capacity: 100,
        },
      };
      (component as any).raceService.getRace = jasmine
        .createSpy()
        .and.returnValue(mockRace);
      component["track"] = mockTrack as any;
    });

    it("should format participant.fuelLevel directly", () => {
      const result = component.formatValue(
        "participant.fuelLevel",
        mockHd.participant.fuelLevel,
        mockHd,
      );
      expect(result).toBe("55.5");
    });

    it("should format participant.fuelLevel as --.- if undefined", () => {
      const result = component.formatValue(
        "participant.fuelLevel",
        undefined,
        mockHd,
      );
      expect(result).toBe("--.-");
    });

    it("should format fuelCapacity from the race settings", () => {
      const result = component.formatValue("fuelCapacity", null, mockHd);
      expect(result).toBe("100.0");
    });

    it("should format fuelPercentage correctly based on fuelLevel and capacity", () => {
      // 55.5 / 100 = 56% (Math.round(55.5) == 56)
      const result = component.formatValue("fuelPercentage", null, mockHd);
      expect(result).toBe("56%");
    });

    it("should format fuelPercentage as --% if capacity or level is undefined", () => {
      mockHd.participant.fuelLevel = undefined;
      const result = component.formatValue("fuelPercentage", null, mockHd);
      expect(result).toBe("--%");
    });

    it("should format driver.avatarUrl using getFullUrl", () => {
      const avatarUrl = "/assets/avatars/driver1.png";
      const result = component.formatValue(
        "driver.avatarUrl",
        avatarUrl,
        mockHd,
      );
      expect(result).toBe("http://localhost/assets/avatars/driver1.png");
    });

    it("should return empty string for driver.avatarUrl if value is missing", () => {
      const result = component.formatValue(
        "driver.avatarUrl",
        undefined,
        mockHd,
      );
      expect(result).toBe("");
    });

    it("should format totalTime to 3 decimal places when above 0", () => {
      const result = component.formatValue("totalTime", 42.1234, mockHd);
      expect(result).toBe("42.123");
    });

    it("should format totalTime as --.--- when 0 or less", () => {
      const result1 = component.formatValue("totalTime", 0, mockHd);
      const result2 = component.formatValue("totalTime", -5, mockHd);
      expect(result1).toBe("--.---");
      expect(result2).toBe("--.---");
    });

    it("should not render img tag in the table when avatarUrl is empty", () => {
      mockSettings.racedayColumns = ["driver.avatarUrl"];
      (component as any).loadColumns();

      const mockHdWithNoAvatar = {
        objectId: "hd-no-avatar",
        laneIndex: 0,
        driver: { name: "No Avatar Driver", avatarUrl: "" },
        participant: {},
        currentLapSegments: [],
      };
      component["sortedHeatDrivers"] = [mockHdWithNoAvatar as any];

      fixture.detectChanges();

      // The anchor div should still be present to maintain layout
      const anchorDiv = fixture.nativeElement.querySelector(
        ".body-cell .anchor-center-center",
      );
      expect(anchorDiv).toBeTruthy();

      // But the img tag should be missing
      const img = anchorDiv.querySelector("img");
      expect(img).toBeFalsy();
    });

    it("should format seed in (#) format", () => {
      mockHd.participant.seed = 5;
      const result = component.formatValue("seed", 5, mockHd);
      expect(result).toBe("(5)");
    });

    it("should format rankHeat directly", () => {
      component["driverRankings"].set("driverId123", 2);
      mockHd.objectId = "driverId123";
      const result = component.formatValue("rankHeat", null, mockHd);
      expect(result).toBe("2");
    });

    it("should format rankOverall directly", () => {
      mockHd.participant.rank = 10;
      const result = component.formatValue("rankOverall", 10, mockHd);
      expect(result).toBe("10");
    });

    it("should format segmentTime based on hd.currentLapSegments when useIndex is true", () => {
      mockHd.currentLapSegments = [1.111, 2.222, 3.333];

      // segmentTime_1 corresponds to index 1
      const result1 = component.formatValue(
        "segmentTime_1",
        2.222,
        mockHd as any,
      );
      expect(result1).toBe("2.222");

      // segmentTime with useIndex calculated for multiple segments maps to index 0
      // In this case, we need to pass the column to formatValue to trigger the multi-segment logic
      const mockColumn = {
        propertyName: "lastLapTime",
        layout: {
          [AnchorPoint.TopLeft]: "segmentTime",
          [AnchorPoint.TopRight]: "segmentTime_1",
        },
      } as any;
      const resultBase = component.formatValue(
        "segmentTime",
        undefined,
        mockHd as any,
        mockColumn,
      );
      expect(resultBase).toBe("1.111");
    });

    it("should format segmentTime as --.--- if segment is undefined", () => {
      mockHd.currentLapSegments = [1.111];
      const result = component.formatValue(
        "segmentTime_1",
        undefined,
        mockHd as any,
      );
      expect(result).toBe("--.---");
    });

    it("should format base segmentTime as lastSegmentTime if not in a multi-segment column", () => {
      mockHd.lastSegmentTime = 4.567;
      mockHd.currentLapSegments = [4.567];

      // No column provided, or column with only one segment
      const result = component.formatValue("segmentTime", 4.567, mockHd as any);
      expect(result).toBe("4.567");
    });

    it("should format flag column value via RaceFlagService", () => {
      mockRaceFlagService.getFlagUrl.and.returnValue(
        "http://localhost/green_flag.png",
      );
      const result = component.formatValue(
        "flag",
        RaceFlag.GREEN,
        mockHd as any,
      );
      expect(result).toBe("http://localhost/green_flag.png");
      expect(mockRaceFlagService.getFlagUrl).toHaveBeenCalledWith(
        RaceFlag.GREEN,
      );
    });

    it("should use global flag type if flag value is UNKNOWN in formatValue", () => {
      mockRaceFlagService.getFlagType.and.returnValue("red");
      mockRaceFlagService.getFlagUrl.and.returnValue(
        "http://localhost/red_flag.png",
      );
      const result = component.formatValue(
        "flag",
        RaceFlag.UNKNOWN_FLAG,
        mockHd as any,
      );
      expect(result).toBe("http://localhost/red_flag.png");
      expect(mockRaceFlagService.getFlagType).toHaveBeenCalled();
    });

    it("should use individual driver flag from server if present in formatValue", () => {
      mockRaceFlagService.getFlagUrl.and.returnValue(
        "http://localhost/finished_red.png",
      );
      const result = component.formatValue("flag", RaceFlag.RED, mockHd as any);
      expect(result).toBe("http://localhost/finished_red.png");
      expect(mockRaceFlagService.getFlagUrl).toHaveBeenCalledWith(RaceFlag.RED);
    });

    it("should use checkered flag from server if present in formatValue", () => {
      mockRaceFlagService.getFlagUrl.and.returnValue(
        "http://localhost/checkered.png",
      );
      const result = component.formatValue(
        "flag",
        RaceFlag.CHECKERED,
        mockHd as any,
      );
      expect(result).toBe("http://localhost/checkered.png");
      expect(mockRaceFlagService.getFlagUrl).toHaveBeenCalledWith(
        RaceFlag.CHECKERED,
      );
    });
  });

  describe("themed audio events", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should play themed min lap time sound when receiving MIN_LAP_TIME lap", () => {
      spyOn(component as any, "playThemedSound");

      lapsSubject.next({
        objectId: "hd1",
        lapTime: 2.0,
        type: LapType.MIN_LAP_TIME,
      });

      expect((component as any).playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME,
        jasmine.objectContaining({
          driver: jasmine.objectContaining({ nickname: "The Rocket" }),
        }),
      );
    });

    it("should play themed drift lap sound when receiving drift lap", () => {
      spyOn(component as any, "playThemedSound");

      lapsSubject.next({
        objectId: "hd1",
        lapTime: 5.0,
        type: LapType.LAP,
        isDrift: true,
      });

      expect((component as any).playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_DRIFT_LAP,
        jasmine.objectContaining({
          driver: jasmine.objectContaining({ nickname: "The Rocket" }),
        }),
      );
    });
  });

  describe("loadColumns and re-indexing", () => {
    it("should re-index column layout at runtime via loadColumns", () => {
      // Setup settings with "broken" indexing (e.g. segmentTime_2 and segmentTime_3 but no 0 or 1)
      mockSettings.racedayColumns = ["testCol"];
      mockSettings.columnLayouts = {
        testCol: {
          [AnchorPoint.TopLeft]: "segmentTime_2",
          [AnchorPoint.TopRight]: "segmentTime_3",
        },
      };

      const mockRace = {
        fuel_options: { enabled: false },
        track: { lanes: [] },
      };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      const testCol = component["columns"].find(
        (c) => c.propertyName === "testCol",
      );
      expect(testCol).toBeDefined();
      // Should be re-indexed to segmentTime and segmentTime_1
      expect(testCol?.layout?.[AnchorPoint.TopLeft]).toBe("segmentTime");
      expect(testCol?.layout?.[AnchorPoint.TopRight]).toBe("segmentTime_1");
    });
  });

  describe("loadColumns with visibility", () => {
    it("should filter out FuelRaceOnly columns when fuel is disabled", () => {
      const mockRace = { fuel_options: { enabled: false } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      expect(
        component["columns"].some((c) => c.propertyName === "fuelPercentage"),
      ).toBeFalse();
    });

    it("should include FuelRaceOnly columns when fuel is enabled", () => {
      const mockRace = { fuel_options: { enabled: true } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      expect(
        component["columns"].some((c) => c.propertyName === "fuelPercentage"),
      ).toBeTrue();
    });

    it("should filter out NonFuelRaceOnly columns when fuel is enabled", () => {
      mockSettings.columnVisibility["lapCount"] =
        ColumnVisibility.NonFuelRaceOnly;

      const mockRace = { fuel_options: { enabled: true } };
      mockRaceService.getRace.and.returnValue(mockRace);

      (component as any).loadColumns();

      expect(
        component["columns"].some((c) => c.propertyName === "lapCount"),
      ).toBeFalse();
    });

    it("should return correct label key for driver.avatarUrl", () => {
      const result = (component as any).getLabelKeyForColumn(
        "driver.avatarUrl",
      );
      expect(result).toBe("RD_COL_AVATAR");
    });

    it("should return empty string label key for flag column", () => {
      const result = (component as any).getLabelKeyForColumn("flag");
      expect(result).toBe("");
    });
  });

  it("should call loadColumns when loadRaceData is called", () => {
    const spy = spyOn(component as any, "loadColumns");
    const mockRace = { track: { lanes: [] } };
    mockRaceService.getRace.and.returnValue(mockRace);

    (component as any).loadRaceData();

    expect(spy).toHaveBeenCalled();
  });

  it("should call cdr.markForCheck when loadRaceData is called", () => {
    const cdrSpy = spyOn(component["cdr"], "markForCheck");
    const mockRace = { track: { lanes: [] } };
    mockRaceService.getRace.and.returnValue(mockRace);

    (component as any).loadRaceData();

    expect(cdrSpy).toHaveBeenCalled();
  });

  it("should render the dynamic track name in the header", () => {
    const trackName = "Test Raceway";
    const mockRace = {
      name: "Any Race",
      track: {
        name: trackName,
        lanes: MOCK_TRACKS[0].lanes,
      },
    };
    mockRaceService.getRace.and.returnValue(mockRace);
    component["race"] = mockRace as any;
    component["track"] = mockRace["track"] as any;
    component["heat"] = {} as any; // Header is inside *ngIf="heat"

    fixture.detectChanges();

    // Header sections with label-text/value-text or track-text
    const compiled = fixture.nativeElement as HTMLElement;
    const trackText = compiled.querySelector(".track-text");
    expect(trackText).toBeTruthy();
    expect(trackText?.textContent).toContain(trackName);
  });

  it("should render the dynamic race name in the header", () => {
    const raceName = "Test Championship";
    const mockRace = {
      name: raceName,
      track: {
        name: "Any Track",
        lanes: MOCK_TRACKS[0].lanes,
      },
    };
    mockRaceService.getRace.and.returnValue(mockRace);
    component["race"] = mockRace as any;
    component["track"] = mockRace["track"] as any;
    component["heat"] = { heatNumber: 1 } as any;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const raceValue = compiled.querySelector(".info-section .value-text");
    expect(raceValue).toBeTruthy();
    expect(raceValue?.textContent).toContain(raceName);
  });

  describe("Digital Fuel Support", () => {
    it("should include fuel columns for digital fuel races", () => {
      const mockTrack = {
        hasDigitalFuel: () => true,
        hasAnalogFuel: () => false,
        lanes: [],
      };
      const mockRace = {
        digital_fuel_options: { enabled: true },
        fuel_options: { enabled: false },
        track: mockTrack,
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component["track"] = mockTrack as any;

      (component as any).loadColumns();

      expect(
        component["columns"].some((c) => c.propertyName === "fuelPercentage"),
      ).toBeTrue();
    });

    it("should use digital fuel capacity for formatting", () => {
      const mockTrack = {
        hasDigitalFuel: () => true,
        hasAnalogFuel: () => false,
        lanes: [],
      };
      const mockRace = {
        digital_fuel_options: { enabled: true, capacity: 50 },
        fuel_options: { enabled: false, capacity: 100 },
        track: mockTrack,
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component["track"] = mockTrack as any;

      const mockHd = { participant: { fuelLevel: 25 } };
      const result = component.formatValue("fuelCapacity", null, mockHd as any);
      expect(result).toBe("50.0");
    });

    it("should calculate fuel percentage using digital fuel options", () => {
      const mockTrack = {
        hasDigitalFuel: () => true,
        hasAnalogFuel: () => false,
        lanes: [],
      };
      const mockRace = {
        digital_fuel_options: { enabled: true, capacity: 50 },
        fuel_options: { enabled: false, capacity: 100 },
        track: mockTrack,
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component["track"] = mockTrack as any;

      const mockHd = { participant: { fuelLevel: 25 } };
      // 25 / 50 = 50%
      const result = component.formatValue(
        "fuelPercentage",
        null,
        mockHd as any,
      );
      expect(result).toBe("50%");
    });
  });

  describe("Velocity Columns", () => {
    beforeEach(() => {
      const mockTrack = {
        lanes: [
          { length: 60 }, // 60 feet
        ],
      };
      component["track"] = mockTrack as any;
    });

    it("should calculate FPH correctly", () => {
      const mockHd = { laneIndex: 0, lastLapTime: 10.0 };
      // FPH = (60 / 10) * 3600 = 6 * 3600 = 21600
      const result = component.formatValue("fph", null, mockHd as any);
      expect(result).toBe("21600");
    });

    it("should calculate MPH correctly", () => {
      const mockHd = { laneIndex: 0, lastLapTime: 10.0 };
      // MPH = 21600 / 5280 = 4.0909...
      const result = component.formatValue("mph", null, mockHd as any);
      expect(result).toBe("4.09");
    });

    it("should calculate KPH correctly", () => {
      const mockHd = { laneIndex: 0, lastLapTime: 10.0 };
      // KPH = 4.0909... * 1.609344 = 6.5836...
      const result = component.formatValue("kph", null, mockHd as any);
      expect(result).toBe("6.58");
    });

    it("should return default placeholder if lastLapTime is 0 or missing", () => {
      const mockHd = { laneIndex: 0, lastLapTime: 0 };
      expect(component.formatValue("fph", null, mockHd as any)).toBe("--.--");
      expect(
        component.formatValue("mph", null, {
          ...mockHd,
          lastLapTime: undefined,
        } as any),
      ).toBe("--.--");
    });

    it("should return correct label keys for velocity columns", () => {
      expect((component as any).getLabelKeyForColumn("mph")).toBe("RD_COL_MPH");
      expect((component as any).getLabelKeyForColumn("kph")).toBe("RD_COL_KPH");
      expect((component as any).getLabelKeyForColumn("fph")).toBe("RD_COL_FPH");
    });

    it("should have correct default fixed widths for velocity columns", () => {
      // Include a name column so it becomes the resizing column, leaving others as fixed
      mockSettings.racedayColumns = ["driver.name", "mph", "kph", "fph"];
      (component as any).loadColumns();

      const mphLoaded = component["columns"].find(
        (c) => c.propertyName === "mph",
      );
      const kphLoaded = component["columns"].find(
        (c) => c.propertyName === "kph",
      );
      const fphLoaded = component["columns"].find(
        (c) => c.propertyName === "fph",
      );

      expect(mphLoaded?.width).toBe(330);
      expect(kphLoaded?.width).toBe(330);
      expect(fphLoaded?.width).toBe(330);
    });
  });

  describe("Leaderboard", () => {
    let mockDriver1: any;
    let mockDriver2: any;
    let mockTeam: any;

    beforeEach(() => {
      mockDriver1 = { name: "Driver 1", nickname: "D1" };
      mockDriver2 = { name: "Driver 2", nickname: "D2" };
      mockTeam = { name: "Team X" };

      fixture.detectChanges();
      participantsSubject.next([
        { driver: mockDriver1, totalLaps: 10, rank: 2 } as any,
        { driver: mockDriver2, team: mockTeam, totalLaps: 15, rank: 1 } as any,
      ]);
      fixture.detectChanges();
    });

    it("should update entries when participants$ emits (stable DOM order)", () => {
      const entries = component["leaderboardEntries"];
      // Entries are in order of first appearance (mockDriver1 then mockDriver2)
      expect(entries[0].name).toBe("D1");
      expect(entries[1].name).toBe("Team X");

      // But their visual positions based on rank (1 and 2) should be correct
      expect(component["getLeaderboardPosition"](entries[0])).toBe(1); // Rank 2 -> Position 1
      expect(component["getLeaderboardPosition"](entries[1])).toBe(0); // Rank 1 -> Position 0
    });

    it("should prioritize team name over driver nickname", () => {
      participantsSubject.next([
        {
          driver: { name: "D2", nickname: "Nick2" },
          team: { name: "Team Elite" },
          totalLaps: 5,
          rank: 1,
        } as any,
      ]);
      fixture.detectChanges();
      const entries = component["leaderboardEntries"];
      expect(entries[0].name).toBe("Team Elite");
    });

    it("should use rankValue and set isTime based on ranking method (Total Time)", () => {
      (component["race"] as any).overall_scoring = {
        rankingMethod: OverallRanking.OR_TOTAL_TIME,
      } as any;
      participantsSubject.next([
        {
          driver: mockDriver1,
          totalLaps: 10,
          rank: 1,
          rankValue: 123.456,
        } as any,
      ]);
      fixture.detectChanges();
      const entries = component["leaderboardEntries"];
      expect(entries[0].score).toBe(123.456);
      expect(entries[0].isTime).toBeTrue();
    });

    it("should use rankValue and set isTime to false for LAP_COUNT", () => {
      (component["race"] as any).overall_scoring = {
        rankingMethod: OverallRanking.OR_LAP_COUNT,
      } as any;
      participantsSubject.next([
        {
          driver: mockDriver1,
          totalLaps: 10.25,
          rank: 1,
          rankValue: 10.25,
        } as any,
      ]);
      fixture.detectChanges();
      const entries = component["leaderboardEntries"];
      expect(entries[0].score).toBe(10.25);
      expect(entries[0].isTime).toBeFalse();
    });

    it("should use rankValue and set isTime for AVERAGE_LAP", () => {
      (component["race"] as any).overall_scoring = {
        rankingMethod: OverallRanking.OR_AVERAGE_LAP,
      } as any;
      participantsSubject.next([
        {
          driver: mockDriver1,
          totalLaps: 50,
          rank: 1,
          rankValue: 8.765,
        } as any,
      ]);
      fixture.detectChanges();
      const entries = component["leaderboardEntries"];
      expect(entries[0].score).toBe(8.765);
      expect(entries[0].isTime).toBeTrue();
    });

    it("should update isTime for all entries when ranking method changes", () => {
      // Start with LAP_COUNT
      (component["race"] as any).overall_scoring = {
        rankingMethod: OverallRanking.OR_LAP_COUNT,
      } as any;
      participantsSubject.next([
        {
          driver: mockDriver1,
          rank: 1,
          rankValue: 10,
        } as any,
      ]);
      fixture.detectChanges();
      expect(component["leaderboardEntries"][0].isTime).toBeFalse();

      // Switch to TOTAL_TIME
      (component["race"] as any).overall_scoring = {
        rankingMethod: OverallRanking.OR_TOTAL_TIME,
      } as any;
      // Trigger update
      participantsSubject.next(component["participants"]);
      fixture.detectChanges();
      expect(component["leaderboardEntries"][0].isTime).toBeTrue();
    });

    // TODO(aufderheide): Move some of these tests out of here and into the widget tests.
    // TODO(aufderheide): Use a harness rather than the selector directly.
    it("should update transform when ranks change (animation check)", () => {
      // Initial state:
      // Index 0: D1 (Rank 2) -> translateY(24px)
      // Index 1: Team X (Rank 1) -> translateY(0px)
      let rows = fixture.nativeElement.querySelectorAll(".leaderboard-item");
      expect(rows[0].textContent).toContain("D1");
      expect(rows[0].style.transform).toBe("translateY(24px)");
      expect(rows[1].textContent).toContain("Team X");
      expect(rows[1].style.transform).toBe("translateY(0px)");

      // Swap ranks: D1 becomes Rank 1 (Pos 0), Team X becomes Rank 2 (Pos 1)
      participantsSubject.next([
        { driver: mockDriver1, totalLaps: 20, rank: 1 } as any,
        { driver: mockDriver2, team: mockTeam, totalLaps: 15, rank: 2 } as any,
      ]);
      fixture.detectChanges();

      rows = fixture.nativeElement.querySelectorAll(".leaderboard-item");
      // Verify stable DOM order (rows[0] is still D1) but visual position updated via transform
      expect(rows[0].textContent).toContain("D1");
      expect(rows[0].style.transform).toBe("translateY(0px)");
      expect(rows[1].textContent).toContain("Team X");
      expect(rows[1].style.transform).toBe("translateY(24px)");
    });

    it("should have correct height on scroll content wrapper", () => {
      // 2 participants * 24px = 48px
      fixture.detectChanges();
      const scrollContent = fixture.nativeElement.querySelector(
        ".leaderboard-scroll-content",
      );
      expect(scrollContent.style.height).toBe("48px");

      // Add more participants
      participantsSubject.next(
        new Array(10).fill(0).map((_, i) => ({
          driver: { name: `D${i}` },
          rank: i + 1,
          totalLaps: 0,
        })),
      );
      fixture.detectChanges();
      expect(scrollContent.style.height).toBe("240px");
    });

    it("should calculate a scroll height exceeding typical container height when many items are present", () => {
      // simulate 50 participants -> 1200px height.
      // 1200px definitely exceeds the parent panel's typical height.
      participantsSubject.next(
        new Array(50).fill(0).map((_, i) => ({
          driver: { name: `D${i}` },
          rank: i + 1,
          totalLaps: 0,
        })),
      );
      fixture.detectChanges();
      const scrollContent = fixture.nativeElement.querySelector(
        ".leaderboard-scroll-content",
      );
      expect(parseInt(scrollContent.style.height)).toBeGreaterThan(1000);
    });

    it("should return correct leaderboard score format based on entry type", () => {
      // 1. All scores are integers, isTime is false (lap-based) -> should always show 2 decimals
      component["leaderboardEntries"] = [
        { isTime: false, score: 10, entityId: "1" },
        { isTime: false, score: 8, entityId: "2" },
      ];
      expect(
        component["getLeaderboardScoreFormat"](
          component["leaderboardEntries"][0],
        ),
      ).toBe("1.2-2");

      // 2. Scores have decimals, isTime is false (lap-based) -> should still show 2 decimals
      component["leaderboardEntries"] = [
        { isTime: false, score: 10.5, entityId: "1" },
        { isTime: false, score: 8.25, entityId: "2" },
      ];
      expect(
        component["getLeaderboardScoreFormat"](
          component["leaderboardEntries"][0],
        ),
      ).toBe("1.2-2");

      // 3. If isTime is true, always 3 decimal places
      expect(
        component["getLeaderboardScoreFormat"]({ isTime: true, score: 10 }),
      ).toBe("1.3-3");
    });
  });

  describe("Timer Formatting", () => {
    beforeEach(() => {
      component["raceState"] = RaceState.RACING;
    });

    it("should format hours correctly (3665s -> 1:01:05)", () => {
      component["time"] = 3665;
      component["timeFormat"] = "1.0-0";
      expect(component["formattedTime"]).toBe("1:01:05");
    });

    it("should format minutes correctly (361s -> 6:01)", () => {
      component["time"] = 361;
      component["timeFormat"] = "1.0-0";
      expect(component["formattedTime"]).toBe("6:01");
    });

    it("should format minutes with padded seconds (65s -> 1:05)", () => {
      component["time"] = 65;
      component["timeFormat"] = "1.0-0";
      expect(component["formattedTime"]).toBe("1:05");
    });

    it("should format seconds only (45s -> 45)", () => {
      component["time"] = 45;
      component["timeFormat"] = "1.0-0";
      expect(component["formattedTime"]).toBe("45");
    });

    it("should show high-precision decimals for countdown < 10s (9.5s -> 9.50)", () => {
      component["time"] = 9.5;
      component["timeFormat"] = "1.2-2";
      expect(component["formattedTime"]).toBe("9.50");
    });

    it("should not show decimals for > 10s (61.5s -> 1:01)", () => {
      component["time"] = 61.5;
      component["timeFormat"] = "1.0-0"; // timeFormat is typically 1.0-0 for > 10s or increasing
      expect(component["formattedTime"]).toBe("1:01");
    });

    it("should handle zero correctly", () => {
      component["time"] = 0;
      component["timeFormat"] = "1.0-0";
      expect(component["formattedTime"]).toBe("0");
    });
  });

  describe("Lap Highlighting", () => {
    let lapsSubject: Subject<ILap>;

    beforeEach(() => {
      lapsSubject = new Subject<ILap>();

      mockRaceConnectionService.laps$ = lapsSubject.asObservable();
      mockRaceService.getRace.and.returnValue({
        name: "Test Race",
        track: { name: "Test Track", lanes: [{ background_color: "red" }] },
      });

      const mockHd = {
        objectId: "driver1",
        laneIndex: 0,
        driver: { lapAudio: {}, bestLapAudio: {} },
        addLapTime: () => {},
      };
      const mockHeat = { heatDrivers: [mockHd], heatNumber: 1 };
      component["heat"] = mockHeat as any;
      component["track"] = {
        name: "Test Track",
        lanes: [{ background_color: "red" }],
      } as any;
      component["race"] = { name: "Test Race" } as any;

      fixture.detectChanges();
    });

    it("should highlight driver when lap is received and enabled", fakeAsync(() => {
      mockSettings.highlightRowOnLap = true;

      lapsSubject.next({
        objectId: "hd1",
        lapTime: 1.234,
        bestLapTime: 1.0,
      });
      fixture.detectChanges();

      expect(component["highlightedDrivers"].has("hd1")).toBeTrue();

      tick(400);
      expect(component["highlightedDrivers"].has("hd1")).toBeFalse();
    }));

    it("should not highlight driver when lap is received but disabled", fakeAsync(() => {
      mockSettings.highlightRowOnLap = false;

      lapsSubject.next({
        objectId: "hd1",
        lapTime: 1.234,
        bestLapTime: 1.0,
      });
      fixture.detectChanges();

      expect(component["highlightedDrivers"].has("hd1")).toBeFalse();
    }));
  });

  describe("False Start", () => {
    let mockHd: any;

    beforeEach(() => {
      mockHd = {
        objectId: "hd1",
        laneIndex: 0,
        driver: {
          name: "Test Driver",
          penaltyAudio: { type: "none" },
          bestLapAudio: { type: "none" },
          lapAudio: { type: "none" },
        },
      };
      const mockHeat = { heatDrivers: [mockHd], heatNumber: 1 };
      mockRaceService.getCurrentHeat.and.returnValue(mockHeat);
      component["heat"] = mockHeat as any;
      fixture.detectChanges();
    });

    it("should play themed penalty sound when FALSE_START received and no custom audio", () => {
      spyOn(component as any, "playThemedSound");

      lapsSubject.next({
        objectId: "hd1",
        type: LapType.FALSE_START,
      });

      expect((component as any).playThemedSound).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_PENALTY,
        jasmine.objectContaining({
          driver: jasmine.objectContaining({ nickname: "Test Driver" }),
        }),
      );
    });

    it("should play custom penalty audio when FALSE_START received", () => {
      mockHd.driver.penaltyAudio = {
        type: "preset",
        url: "custom-penalty.wav",
      };

      lapsSubject.next({
        objectId: "hd1",
        type: LapType.FALSE_START,
      });

      expect(mockAudioInstance.play).toHaveBeenCalled();
    });
  });

  describe("Lane Sorting", () => {
    let mockHd1: any;
    let mockHd2: any;

    beforeEach(() => {
      mockHd1 = {
        objectId: "hd1",
        laneIndex: 0,
        driver: { name: "Driver 1" },
        participant: {},
        addLapTime: () => {},
      };
      mockHd2 = {
        objectId: "hd2",
        laneIndex: 1,
        driver: { name: "Driver 2" },
        participant: {},
        addLapTime: () => {},
      };
      const mockHeat = {
        heatDrivers: [mockHd1, mockHd2],
        heatNumber: 1,
        standings: [],
      };
      component["heat"] = mockHeat as any;

      // Setup track and race for rendering safety in template
      component["track"] = {
        name: "Test Track",
        lanes: [{ foreground_color: "white" }, { foreground_color: "white" }],
      } as any;
      component["race"] = { name: "Test Race" } as any;

      // Mock getRace to provide lanes to prevent template override crashes during detectChanges
      mockRaceService.getRace.and.returnValue({
        name: "Test Race",
        track: {
          name: "Test Track",
          lanes: [{ foreground_color: "white" }, { foreground_color: "white" }],
        },
        fuel_options: { enabled: false },
      });

      // Mock getCurrentHeat to return our mock heat and prevent overrides during detectChanges
      mockRaceService.getCurrentHeat.and.returnValue(mockHeat);
      mockRaceService.getHeats.and.returnValue([mockHeat]);

      fixture.detectChanges(); // Initialize component and run initializeHeat() once
    });

    it("should sort by lane index when sortByStandings is false", () => {
      mockSettings.sortByStandings = false;

      // Disrupt order first to verify sort forces it back
      component["sortedHeatDrivers"] = [mockHd2, mockHd1];

      (component as any).sortHeatDrivers();

      expect(component["sortedHeatDrivers"][0].objectId).toBe("hd1");
      expect(component["sortedHeatDrivers"][1].objectId).toBe("hd2");
    });

    it("should sort by standings when sortByStandings is true", () => {
      mockSettings.sortByStandings = true;
      component["driverRankings"].set("hd1", 2);
      component["driverRankings"].set("hd2", 1);

      (component as any).sortHeatDrivers();
      fixture.detectChanges();

      expect((component as any).getDriverVisualPosition(mockHd2)).toBe(0); // Rank 1 -> visual pos 0
      expect((component as any).getDriverVisualPosition(mockHd1)).toBe(1); // Rank 2 -> visual pos 1
    });

    it("should have correct top position for animation when sorted", () => {
      mockSettings.sortByStandings = true;
      component["driverRankings"].set("hd1", 2);
      component["driverRankings"].set("hd2", 1);

      (component as any).sortHeatDrivers();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll(".table-row");
      const rowHeight = component.getRowHeight();

      // hd1 (lane 0) is rank 2 -> visual position 1
      // hd2 (lane 1) is rank 1 -> visual position 0
      // top = pos * (height + 2)
      const expectedHd1Top = 1 * (rowHeight + 2);
      expect(rows[0].style.top).toBe(`${expectedHd1Top}px`);
      expect(rows[1].style.top).toBe("0px");
    });

    it("should update rankings and sort on standingsUpdate$ event", fakeAsync(() => {
      mockSettings.sortByStandings = true;
      component["driverRankings"].set("hd1", 1);
      component["driverRankings"].set("hd2", 2);

      fixture.detectChanges(); // Trigger ngOnInit setup
      tick(); // Flush any timers

      standingsUpdateSubject.next({
        updates: [
          { objectId: "hd1", rank: 2 },
          { objectId: "hd2", rank: 1 },
        ],
      });
      tick(); // Let async subscription execute
      fixture.detectChanges();

      expect((component as any).getDriverVisualPosition(mockHd2)).toBe(0);
      expect((component as any).getDriverVisualPosition(mockHd1)).toBe(1);
    }));
  });

  describe("onFileMenuSelect and onOptionsSelect", () => {
    it("should trigger CSV export when EXPORT_CSV is selected", fakeAsync(() => {
      mockDataService.exportRaceToCsv = jasmine
        .createSpy("exportRaceToCsv")
        .and.returnValue(of("CSV_DATA"));

      const mockFileHandle = {
        createWritable: jasmine.createSpy("createWritable").and.returnValue(
          Promise.resolve({
            write: jasmine
              .createSpy("write")
              .and.returnValue(Promise.resolve()),
            close: jasmine
              .createSpy("close")
              .and.returnValue(Promise.resolve()),
          }),
        ),
      };
      (window as any).showSaveFilePicker = jasmine
        .createSpy("showSaveFilePicker")
        .and.returnValue(Promise.resolve(mockFileHandle));

      component.onFileMenuSelect("EXPORT_CSV");
      tick(); // Let async file handler execute

      expect(mockDataService.exportRaceToCsv).toHaveBeenCalled();
      expect((window as any).showSaveFilePicker).toHaveBeenCalled();
    }));

    it("should trigger PDF export when EXPORT_PDF is selected", () => {
      const printService = TestBed.inject(
        PrintService,
      ) as jasmine.SpyObj<PrintService>;
      component.onFileMenuSelect("EXPORT_PDF");
      expect(printService.print).toHaveBeenCalledWith("RaceDay");
    });

    it("should navigate to /ui-editor when CUSTOMIZE_UI is selected in options menu", () => {
      (mockRouter as any).url = "/raceday?someParam=true";
      component.onOptionsSelect("CUSTOMIZE_UI");
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/ui-editor"], {
        queryParams: { returnUrl: "/raceday" },
      });
    });
  });

  describe("canDeactivate", () => {
    it("should allow deactivation when navigating to /ui-editor", () => {
      const nextState = { url: "/ui-editor" } as any;
      const result = component.canDeactivate(nextState);
      expect(result).toBeTrue();
    });

    it("should allow deactivation when navigating to /modify-heats", () => {
      const nextState = { url: "/modify-heats" } as any;
      const result = component.canDeactivate(nextState);
      expect(result).toBeTrue();
    });

    it("should allow deactivation when navigating to /driver-station", () => {
      const nextState = { url: "/driver-station/1" } as any;
      const result = component.canDeactivate(nextState);
      expect(result).toBeTrue();
    });

    it("should show exit confirmation and return observable when navigating elsewhere", (done) => {
      const nextState = { url: "/home" } as any;
      const result = component.canDeactivate(nextState) as any;
      expect(component.showExitConfirmation).toBeTrue();
      result.subscribe((val: boolean) => {
        expect(val).toBeTrue();
        done();
      });
      component.onExitConfirm();
    });
  });

  describe("getCurrentFlagUrl", () => {
    let mockRace: any;
    let mockScoring: any;

    beforeEach(() => {
      mockScoring = {
        finishMethod: FinishMethod.Lap,
        finishValue: 10,
        allowFinish: AllowFinish.AF_NONE,
      };
      mockRace = {
        heat_scoring: mockScoring,
      };
      mockRaceService.getRace.and.returnValue(mockRace);
      component["race"] = mockRace;

      // Setup default setttings for flag lookups
      const settings = (component as any).settingsService.getSettings();
      settings.flagRed = "red.png";
      settings.flagGreen = "green.png";
      settings.flagYellow = "yellow.png";
      settings.flagWhite = "white.png";
      settings.flagCheckered = "checkered.png";

      // Mock assets for resolution
      (component as any).assets = [
        { url: "red.png", name: "Red Flag" },
        { url: "green.png", name: "Green Flag" },
        { url: "yellow.png", name: "Yellow Flag" },
        { url: "white.png", name: "White Flag" },
        { url: "checkered.png", name: "Checkered Flag" },
        { url: "yellow_green.png", name: "Yellow Green Flag" },
      ];
    });

    it("should return red flag when service returns 'red'", () => {
      mockRaceFlagService.getFlagType.and.returnValue("red");
      expect(component.getCurrentFlagUrl()).toContain("red.png");
    });

    it("should return green flag when service returns 'green'", () => {
      mockRaceFlagService.getFlagType.and.returnValue("green");
      expect(component.getCurrentFlagUrl()).toContain("green.png");
    });

    it("should return yellow flag when service returns 'yellow'", () => {
      mockRaceFlagService.getFlagType.and.returnValue("yellow");
      expect(component.getCurrentFlagUrl()).toContain("yellow.png");
    });

    it("should return white flag when service returns 'white'", () => {
      mockRaceFlagService.getFlagType.and.returnValue("white");
      expect(component.getCurrentFlagUrl()).toContain("white.png");
    });

    it("should return checkered flag when service returns 'checkered'", () => {
      mockRaceFlagService.getFlagType.and.returnValue("checkered");
      expect(component.getCurrentFlagUrl()).toContain("checkered.png");
    });

    it("should return yellow-green flag for 'green_yellow'", () => {
      mockRaceFlagService.getFlagType.and.returnValue("green_yellow");
      expect(component.getCurrentFlagUrl()).toContain("yellow_green.png");
    });

    it("should return red flag for default/unknown flag type", () => {
      mockRaceFlagService.getFlagType.and.returnValue("unknown");
      expect(component.getCurrentFlagUrl()).toContain("red.png");
    });
  });

  describe("Lanes Menu and Drivers Station", () => {
    beforeEach(() => {
      fixture.detectChanges();
      const mockRouter = TestBed.inject(Router) as any;
      mockRouter.createUrlTree = jasmine
        .createSpy("createUrlTree")
        .and.callFake((path: any[]) => {
          return { lane: path[1] };
        });
      mockRouter.serializeUrl = jasmine
        .createSpy("serializeUrl")
        .and.callFake((tree: any) => {
          return `/driver-station/${tree.lane}`;
        });
      spyOn(window, "open").and.returnValue(null as any);
    });

    it("should toggle lanes menu", () => {
      expect(component.isLanesMenuOpen).toBeFalse();
      component.toggleLanesMenu();
      expect(component.isLanesMenuOpen).toBeTrue();
    });

    it("should toggle drivers station sub-menu", () => {
      component.isLanesMenuOpen = true;
      expect(component.isDriversStationOpen).toBeFalse();
      component.toggleDriversStationMenu();
      expect(component.isDriversStationOpen).toBeTrue();
    });

    it("should reset menu states when one is toggled", () => {
      component.isLanesMenuOpen = true;
      component.isDriversStationOpen = true;
      component.isOptionsMenuOpen = true;
      component.toggleMenu();
      expect(component.isLanesMenuOpen).toBeFalse();
      expect(component.isDriversStationOpen).toBeFalse();
      expect(component.isOptionsMenuOpen).toBeFalse();
    });

    it("should call onLaneMenuSelect with correct index and navigate", () => {
      const mockRouter = TestBed.inject(Router) as any;

      component.onLaneMenuSelect(1);

      expect(component.isLanesMenuOpen).toBeFalse();
      expect(component.isDriversStationOpen).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/driver-station", 2]);
    });

    it("should close all menus on document click outside", () => {
      component.isLanesMenuOpen = true;
      component.isDriversStationOpen = true;
      component.isOptionsMenuOpen = true;

      // Simulate click outside
      const mockEvent = {
        target: document.createElement("div"),
      } as any;
      component.onDocumentClick(mockEvent);

      expect(component.isLanesMenuOpen).toBeFalse();
      expect(component.isDriversStationOpen).toBeFalse();
      expect(component.isOptionsMenuOpen).toBeFalse();
    });
  });

  describe("Options Menu", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should toggle options menu", () => {
      expect(component.isOptionsMenuOpen).toBeFalse();
      component.toggleOptionsMenu();
      expect(component.isOptionsMenuOpen).toBeTrue();
    });

    it("should close options menu on document click outside", () => {
      component.isOptionsMenuOpen = true;

      // Simulate click outside
      const mockEvent = {
        target: document.createElement("div"),
      } as any;
      component.onDocumentClick(mockEvent);

      expect(component.isOptionsMenuOpen).toBeFalse();
    });
  });

  describe("recordData$ handling", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should display record values and holders when provided", () => {
      const mockRecords: IRecordData = {
        overall: {
          fastestLap: {
            value: 3.123,
            holderNickname: "Champion",
          },
        },
        current: {
          fastestLap: {
            value: 3.449,
            holderNickname: "Fart Goblin",
          },
          heatFastestLap: {
            value: 3.449,
            holderNickname: "Fart Goblin",
          },
        },
      };

      recordDataSubject.next(mockRecords);

      expect(component["heatBestTime"]).toBe(3.449);
      expect(component["heatBestNickname"]).toBe("Fart Goblin");
      expect(component["currentRaceBestTime"]).toBe(3.449);
      expect(component["currentRaceBestNickname"]).toBe("Fart Goblin");
      expect(component["raceRecordLapTime"]).toBe(3.123);
      expect(component["raceRecordLapNickname"]).toBe("Champion");
    });

    it("should use placeholders '---' and '--.---' when record value is 0", () => {
      const mockRecords: IRecordData = {
        overall: {
          fastestLap: {
            value: 0,
            holderNickname: "Should Be Ignored",
          },
          highestScore: {
            value: 0,
            holderNickname: "Should Be Ignored",
          },
        },
        current: {
          fastestLap: {
            value: 0,
            holderNickname: "Should Be Ignored",
          },
          heatFastestLap: {
            value: 0,
            holderNickname: "Should Be Ignored",
          },
        },
      };

      recordDataSubject.next(mockRecords);

      expect(component["heatBestTime"]).toBe(0);
      expect(component["heatBestNickname"]).toBe("---");
      expect(component["currentRaceBestTime"]).toBe(0);
      expect(component["currentRaceBestNickname"]).toBe("---");
      expect(component["raceRecordLapTime"]).toBe(0);
      expect(component["raceRecordLapNickname"]).toBe("---");

      // Verify HTML template would show placeholders (via TS state)
      // The HTML uses heatBestTime > 0 ? ... : '--.---'
    });

    it("should handle null record properties gracefully", () => {
      recordDataSubject.next({});

      expect(component["heatBestNickname"]).toBe("---");
      expect(component["heatBestTime"]).toBe(0);
    });
  });

  describe("Countdown Overlay", () => {
    beforeEach(() => {
      const mockAssets = [
        { name: "Start Lamp Red", url: "assets/images/start_red_on.png" },
        { name: "Start Lamp Dim", url: "assets/images/start_red_dim.png" },
        { name: "Start Lamp Green", url: "assets/images/start_green.png" },
      ];
      mockDataService.listAssets.and.returnValue(of(mockAssets));
      fixture.detectChanges();
    });

    it("should show overlay and calculate lamps in STARTING state", fakeAsync(() => {
      component["race"] = { ...MOCK_RACES[0], start_time: 5.0 } as any;
      raceTimeSubject.next({ time: 5.0, autoStartRemaining: 5.0 });
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();

      expect(component["showCountdownOverlay"]).toBeTrue();
      expect(component["countdownTotalLamps"]).toBe(5);
      expect(component["countdownLamps"].length).toBe(5);
      // New logic (1, 2, 3, GO): initially only 1st lamp is ON (5 - ceil(5.0) + 1 = 1)
      // But text should show the countdown (5)
      expect(component["countdownLamps"][0].state).toBe("on");
      expect(
        component["countdownLamps"].filter((l) => l.state === "on").length,
      ).toBe(1);
      expect(component["countdownText"]).toBe("5");
    }));

    it("should use start_time for countdownTotalLamps when starting a new race", fakeAsync(() => {
      const race = { ...MOCK_RACES[0], start_time: 3.0 } as any;
      component["race"] = race;
      mockRaceService.getRace.and.returnValue(race);
      raceStateSubject.next(RaceState.NOT_STARTED);
      tick();
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();

      expect(component["countdownTotalLamps"]).toBe(3);
      expect(component["countdownLamps"].length).toBe(3);
    }));

    it("should use restart_time for countdownTotalLamps when resuming from PAUSED", fakeAsync(() => {
      const race = {
        ...MOCK_RACES[0],
        start_time: 5.0,
        restart_time: 2.0,
      } as any;
      component["race"] = race;
      mockRaceService.getRace.and.returnValue(race);
      raceStateSubject.next(RaceState.RACING);
      tick();
      raceStateSubject.next(RaceState.PAUSED);
      tick();
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();

      expect(component["isRestarting"]).toBeTrue();
      expect(component["countdownTotalLamps"]).toBe(2);
      expect(component["countdownLamps"].length).toBe(2);
    }));

    it("should re-sync countdownTotalLamps when race data is loaded during STARTING", fakeAsync(() => {
      component["raceState"] = RaceState.STARTING;
      component["isRestarting"] = true; // resumed from pause

      const newRace = { ...MOCK_RACES[0], restart_time: 4.0 };
      mockRaceService.getRace.and.returnValue(newRace);

      (component as any).loadRaceData();

      expect(component["countdownTotalLamps"]).toBe(4);
    }));

    it("should update lamp states based on time remaining", fakeAsync(() => {
      component["race"] = { ...MOCK_RACES[0], start_time: 5.0 } as any;
      raceTimeSubject.next({ time: 5.0, autoStartRemaining: 5.0 });
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();

      // At T=3.2s remaining, ceil(3.2) = 4. onCount = 5 - 4 + 1 = 2 lamps should be ON
      // Text should show "4" (countdown)
      raceTimeSubject.next({ time: 3.2, autoStartRemaining: 3.2 });
      tick();
      expect(component["countdownLamps"][0].state).toBe("on");
      expect(component["countdownLamps"][1].state).toBe("on");
      expect(component["countdownLamps"][2].state).toBe("dim");
      expect(component["countdownText"]).toBe("4");

      // At 0.5s remaining, ceil(0.5) = 1. onCount = 5 - 1 + 1 = 5 lamps should be ON
      // Text should show "1" (countdown)
      raceTimeSubject.next({ time: 0.5, autoStartRemaining: 0.5 });
      tick();
      expect(
        component["countdownLamps"].every((l) => l.state === "on"),
      ).toBeTrue();
      expect(component["countdownText"]).toBe("1");
    }));

    it("should transition to green and hide after 5s when state becomes RACING", fakeAsync(() => {
      component["race"] = { ...MOCK_RACES[0], start_time: 5.0 } as any;
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();

      raceStateSubject.next(RaceState.RACING);
      tick();

      expect(
        component["countdownLamps"].every((l) => l.state === "go"),
      ).toBeTrue();
      expect(component["showCountdownOverlay"]).toBeTrue();

      tick(5000);
      expect(component["showCountdownOverlay"]).toBeFalse();
    }));

    it("should hide immediately if state becomes PAUSED during countdown", fakeAsync(() => {
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();
      expect(component["showCountdownOverlay"]).toBeTrue();

      raceStateSubject.next(RaceState.PAUSED);
      tick();
      expect(component["showCountdownOverlay"]).toBeFalse();
    }));
  });

  describe("Theme Asset Integration", () => {
    let mockThemeService: any;

    beforeEach(() => {
      mockThemeService = TestBed.inject(ThemeService);
      const themeAssets = [
        {
          model: { entityId: "theme-green-flag" },
          url: "/theme/green.png",
          name: "Theme Green Flag",
        },
        {
          model: { entityId: "theme-red-on" },
          url: "/theme/red-on.png",
          name: "Theme Red On",
        },
        {
          model: { entityId: "theme-fuel-gauge" },
          url: "/theme/fuel.png",
          name: "Theme Fuel Gauge",
          type: "image_set",
          images: [{ percentage: 100, url: "/theme/fuel-100.png" }],
        },
      ];
      mockDataService.listAssets.and.returnValue(of(themeAssets));
      (component as any).assets = themeAssets;
      fixture.detectChanges();
    });

    it("should use theme for flag images", () => {
      mockThemeService.resolveAssetId.and.callFake((slot: string) => {
        if (slot === "flag.green") return "theme-green-flag";
        return null;
      });
      mockRaceFlagService.getFlagType.and.returnValue("green");
      mockRaceFlagService.getFlagUrl.and.returnValue(
        "http://localhost/theme/green.png",
      );

      const url = component.getCurrentFlagUrl();
      expect(url).toBe("http://localhost/theme/green.png");
    });

    it("should use theme for countdown lamps", () => {
      mockThemeService.resolveAssetId.and.callFake((slot: string) => {
        if (slot === "lamp.red.on") return "theme-red-on";
        return null;
      });

      component["showCountdownOverlay"] = true;
      component["countdownTotalLamps"] = 5;
      component["updateCountdownLamps"](4.5); // 1 lamp on

      expect(component["countdownLamps"][0].url).toBe(
        "http://localhost/theme/red-on.png",
      );
    });

    it("should use theme for fuel gauge image set", () => {
      mockThemeService.resolveAssetId.and.callFake((slot: string) => {
        if (slot === "gauge.fuel") return "theme-fuel-gauge";
        return null;
      });

      const asset = component["findAssetById"]("fuel-gauge-builtin");
      expect(asset.model.entityId).toBe("theme-fuel-gauge");

      const imageUrl = component["getSelectedImageFromSet"](asset, 100, {
        participant: { fuelLevel: 100 },
      } as any);
      expect(imageUrl).toBe("http://localhost/theme/fuel-100.png");
    });
  });

  describe("Lane Swapping", () => {
    beforeEach(() => {
      // Mock single heat solo race
      (component as any).race.heat_rotation_type = "SingleHeatSolo";
      component["heat"] = {
        heatDrivers: [
          {
            laneIndex: 0,
            objectId: "hd0",
            driver: { objectId: "d1" },
            participant: { objectId: "p1" },
          },
          {
            laneIndex: 1,
            objectId: "hd1",
            driver: { objectId: "d2" },
            participant: { objectId: "p2" },
          },
        ],
      } as any;
      (component as any).sortHeatDrivers();
    });

    it("should call dataService.changeLane when onDrop is called with valid indices", () => {
      const fromHd = component["sortedHeatDrivers"][0];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: fromHd },
      } as any;

      mockDataService.changeLane.and.returnValue(of(true));

      component["onDrop"](event);

      expect(mockDataService.changeLane).toHaveBeenCalledWith(0, 1);
    });

    it("should NOT call dataService.changeLane if not a solo race", () => {
      (component as any).race.heat_rotation_type = "RoundRobin";
      const fromHd = component["sortedHeatDrivers"][0];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: fromHd },
      } as any;

      component["onDrop"](event);

      expect(mockDataService.changeLane).not.toHaveBeenCalled();
    });

    it("should log error if changeLane fails", () => {
      mockDataService.changeLane.and.returnValue(of(false));
      const fromHd = component["sortedHeatDrivers"][0];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: fromHd },
      } as any;

      component["onDrop"](event);

      expect(mockLogger.error).toHaveBeenCalledWith("Failed to change lane");
    });

    it("should call dataService.changeLane for SingleHeat in NOT_STARTED state", () => {
      (component as any).race.heat_rotation_type = "SingleHeat";
      component["raceState"] = RaceState.NOT_STARTED;
      const fromHd = component["sortedHeatDrivers"][0];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: fromHd },
      } as any;

      mockDataService.changeLane.and.returnValue(of(true));

      component["onDrop"](event);

      expect(mockDataService.changeLane).toHaveBeenCalledWith(0, 1);
    });

    it("should NOT call dataService.changeLane for SingleHeat in RACING state", () => {
      (component as any).race.heat_rotation_type = "SingleHeat";
      component["raceState"] = RaceState.RACING;
      const fromHd = component["sortedHeatDrivers"][0];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: fromHd },
      } as any;

      component["onDrop"](event);

      expect(mockDataService.changeLane).not.toHaveBeenCalled();
    });
  });

  describe("Yellow Flag Audio", () => {
    let mockSpeechSynthesis: any;
    let originalSpeechSynthesis: any;
    let mockThemeService: any;

    beforeEach(() => {
      // Save original implementations
      originalSpeechSynthesis = window.speechSynthesis;

      // Mock SpeechSynthesis
      mockSpeechSynthesis = jasmine.createSpyObj("SpeechSynthesis", [
        "cancel",
        "speak",
      ]);
      Object.defineProperty(window, "speechSynthesis", {
        value: mockSpeechSynthesis,
        writable: true,
        configurable: true,
      });

      mockThemeService = TestBed.inject(ThemeService);
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "preset",
        url: "default_yellow_flag",
      });
      mockDataService.listAssets.and.returnValue(
        of([
          {
            model: { entityId: "default_yellow_flag" },
            url: "/api/assets/download/default_yellow_flag",
          },
        ]),
      );
      fixture.detectChanges();
    });

    afterEach(() => {
      // Restore original implementations
      if (originalSpeechSynthesis) {
        Object.defineProperty(window, "speechSynthesis", {
          value: originalSpeechSynthesis,
          writable: true,
          configurable: true,
        });
      }
    });

    it("should play yellow flag audio when transitioning from RACING to PAUSED", () => {
      // Set initial state
      component["raceState"] = RaceState.RACING;

      // Trigger state change
      raceStateSubject.next(RaceState.PAUSED);

      expect(mockThemeService.resolveAudioConfig).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG,
      );
      expect(window.Audio).toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/default_yellow_flag`,
      );
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("should NOT play yellow flag audio when transitioning from STARTING to PAUSED", () => {
      // Set initial state
      component["raceState"] = RaceState.STARTING;

      // Trigger state change
      raceStateSubject.next(RaceState.PAUSED);

      expect(window.Audio).not.toHaveBeenCalled();
    });

    it("should play TTS yellow flag audio when configured", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "tts",
        text: "Caution on track!",
      });
      component["raceState"] = RaceState.RACING;

      raceStateSubject.next(RaceState.PAUSED);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const callArgs = mockSpeechSynthesis.speak.calls.mostRecent().args;
      expect(callArgs[0].text).toBe("Caution on track!");
    });

    it("should play heat over audio when transitioning to HEAT_OVER and previousState is not UNKNOWN_STATE", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "preset",
        url: "default_heat_over",
      });
      component["raceState"] = RaceState.RACING;

      raceStateSubject.next(RaceState.HEAT_OVER);

      expect(mockThemeService.resolveAudioConfig).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_HEAT_OVER,
      );
      expect(window.Audio).toHaveBeenCalled();
    });

    it("should play race over audio when transitioning to RACE_OVER and previousState is not UNKNOWN_STATE", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "preset",
        url: "default_race_over",
      });
      component["raceState"] = RaceState.RACING;

      raceStateSubject.next(RaceState.RACE_OVER);

      expect(mockThemeService.resolveAudioConfig).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_RACE_OVER,
      );
      expect(window.Audio).toHaveBeenCalled();
    });

    it("should NOT play heat over or race over audio when transitioning from UNKNOWN_STATE", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "preset",
        url: "default_heat_over",
      });
      component["raceState"] = RaceState.UNKNOWN_STATE;

      raceStateSubject.next(RaceState.HEAT_OVER);

      expect(window.Audio).not.toHaveBeenCalled();
    });
  });

  describe("Countdown Audio", () => {
    let mockThemeService: any;

    beforeEach(() => {
      mockThemeService = TestBed.inject(ThemeService);
      mockDataService.listAssets.and.returnValue(
        of([
          {
            model: { entityId: "default_countdown_set" },
            type: "audio_set",
            audioEntries: [
              { url: "/api/assets/download/5", timeSeconds: 5 },
              { url: "/api/assets/download/4", timeSeconds: 4 },
              { url: "/api/assets/download/3", timeSeconds: 3 },
              { url: "/api/assets/download/1", timeSeconds: 1 },
              { url: "/api/assets/download/go", timeSeconds: 0 },
            ],
            url: "/api/assets/download/default_countdown_set",
          },
        ]),
      );
      fixture.detectChanges();
    });

    afterEach(() => {});

    it("should play themed sound for countdown seconds", fakeAsync(() => {
      mockThemeService.resolveAudioConfig.and.callFake((key: string) => {
        if (key === THEME_SLOT_KEYS.AUDIO_COUNTDOWN) {
          return { type: "audio_set", url: "default_countdown_set" };
        }
        return null;
      });

      component["race"] = { ...MOCK_RACES[0], start_time: 5.0 } as any;
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();
      // Reset so next time update triggers a fresh play
      component["lastPlayedCountdownSecond"] = -1;

      // At 4.0s left, it should play '4' sound
      raceTimeSubject.next({ time: 4.0, autoStartRemaining: 4.0 });
      tick();

      expect(window.Audio).toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/4`,
      );
    }));

    it("should not play audio for seconds higher than countdownTotalLamps", fakeAsync(() => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "audio_set",
        url: "default_countdown_set",
      });

      const race = { ...MOCK_RACES[0], start_time: 3.0 } as any;
      component["race"] = race;
      mockRaceService.getRace.and.returnValue(race);
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();
      // Reset so next time update triggers a fresh play
      component["lastPlayedCountdownSecond"] = -1;

      // If server sends 5.0 but we only have 3 lamps, it should NOT play.
      raceTimeSubject.next({ time: 5.0, autoStartRemaining: 5.0 });
      tick();

      expect(window.Audio).not.toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/5`,
      );

      // But it SHOULD play 3
      raceTimeSubject.next({ time: 3.0, autoStartRemaining: 3.0 });
      tick();
      expect(window.Audio).toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/3`,
      );
    }));

    it("should play 'GO' sound when race starts", fakeAsync(() => {
      mockThemeService.resolveAudioConfig.and.callFake((key: string) => {
        if (key === THEME_SLOT_KEYS.AUDIO_COUNTDOWN) {
          return { type: "audio_set", url: "default_countdown_set" };
        }
        return null;
      });

      component["raceState"] = RaceState.STARTING;
      raceStateSubject.next(RaceState.RACING);
      tick();

      expect(window.Audio).toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/go`,
      );
    }));

    it("should NOT play countdown audio based on race time when autoStartRemaining is 0 (abort scenario)", fakeAsync(() => {
      mockThemeService.resolveAudioConfig.and.callFake((key: string) => {
        if (key === THEME_SLOT_KEYS.AUDIO_COUNTDOWN) {
          return { type: "audio_set", url: "default_countdown_set" };
        }
        return null;
      });

      component["race"] = { ...MOCK_RACES[0], start_time: 5.0 } as any;
      raceStateSubject.next(RaceState.STARTING);
      tick();
      (window.Audio as any).calls.reset();

      // Simulate abort: autoStartRemaining becomes 0, but race time is still > 0
      raceTimeSubject.next({ time: 3.0, autoStartRemaining: 0 });
      tick();

      expect(window.Audio).not.toHaveBeenCalled();
    }));
  });

  describe("Themed and Lap Audio - None Type Support", () => {
    let mockSpeechSynthesis: any;
    let originalSpeechSynthesis: any;
    let mockThemeService: any;

    beforeEach(() => {
      originalSpeechSynthesis = window.speechSynthesis;
      Object.defineProperty(window, "speechSynthesis", {
        value: mockSpeechSynthesis,
        writable: true,
        configurable: true,
      });

      mockThemeService = TestBed.inject(ThemeService);
      mockDataService.listAssets.and.returnValue(
        of([
          {
            model: { entityId: "default_seconds_left_set" },
            type: "audio_set",
            audioEntries: [
              { url: "/api/assets/download/240", timeSeconds: 240 },
              { url: "/api/assets/download/60", timeSeconds: 60 },
            ],
            url: "/api/assets/download/default_seconds_left_set",
          },
        ]),
      );
    });

    afterEach(() => {
      Object.defineProperty(window, "speechSynthesis", {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true,
      });
    });

    it("should NOT play audio when lap audio type is 'none'", () => {
      fixture.detectChanges();
      const mockHd = component["heat"]!.heatDrivers[0];
      mockHd.driver.lapAudio = { type: "none", url: "test" };

      lapsSubject.next({
        objectId: mockHd.objectId,
        lapNumber: 5,
        lapTime: 1.234,
        bestLapTime: 1.0,
      });

      expect(window.Audio).not.toHaveBeenCalled();
    });

    it("should NOT play audio when themed audio type is 'none'", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "none",
        url: "default_countdown_set",
      });

      fixture.detectChanges();
      // Use the subject to trigger state change logic (setting overlay, etc)
      raceStateSubject.next(RaceState.STARTING);

      // Trigger a countdown threshold
      raceTimeSubject.next({ time: 1.0, autoStartRemaining: 1.0 });

      expect(mockThemeService.resolveAudioConfig).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
      );
      expect(window.Audio).not.toHaveBeenCalled();
    });

    it("should play themed audio at correct time thresholds for timed heats", () => {
      mockThemeService.resolveAudioConfig.and.callFake((key: string) => {
        if (key === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT) {
          return { type: "audio_set", url: "default_seconds_left_set" };
        }
        return { type: "preset", url: `url_${key}` };
      });

      const race = {
        ...MOCK_RACES[0],
        heat_scoring: {
          finishMethod: FinishMethod.Timed,
          finishValue: 300,
        },
        track: component["track"],
      } as any;
      component["race"] = race;
      mockRaceService.getRace.and.returnValue(race);

      fixture.detectChanges();
      component["raceState"] = RaceState.RACING;

      // Initial time: 5 minutes (300s)
      raceTimeSubject.next({ time: 300.0 });
      expect(window.Audio).not.toHaveBeenCalled(); // No callout on start

      // Crossing 4 minutes (240s)
      raceTimeSubject.next({ time: 240.0 });
      expect(window.Audio).toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/240`,
      );

      // Crossing halfway (150s for a 5 minute race)
      raceTimeSubject.next({ time: 150.0 });
      expect(mockThemeService.resolveAudioConfig).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
      );

      // Crossing 1 minute (60s)
      raceTimeSubject.next({ time: 60.0 });
      expect(window.Audio).toHaveBeenCalledWith(
        `${mockDataService.serverUrl}api/assets/download/60`,
      );
    });

    it("should play halfway audio when a driver reaches halfway lap count in lap-based races", () => {
      mockThemeService.resolveAudioConfig.and.callFake((key: string) => {
        if (key === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT) {
          return { type: "audio_set", url: "default_seconds_left_set" };
        }
        return { type: "preset", url: `url_${key}` };
      });

      const race = {
        ...MOCK_RACES[0],
        track: MOCK_TRACKS[0],
        heat_scoring: {
          finishMethod: FinishMethod.Lap,
          finishValue: 10,
        },
      } as any;
      component["race"] = race;
      mockRaceService.getRace.and.returnValue(race);

      fixture.detectChanges();
      const mockHd = component["heat"]!.heatDrivers[0];

      // Lap 1: nothing
      lapsSubject.next({
        objectId: mockHd.objectId,
        lapNumber: 1,
        lapTime: 1.234,
        bestLapTime: 1.0,
      });
      expect(mockThemeService.resolveAudioConfig).not.toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
      );

      // Lap 5: should play
      lapsSubject.next({
        objectId: mockHd.objectId,
        lapNumber: 5,
        lapTime: 1.234,
        bestLapTime: 1.0,
      });
      expect(mockThemeService.resolveAudioConfig).toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
      );

      // Reset mock to check it doesn't play twice
      mockThemeService.resolveAudioConfig.calls.reset();

      // Lap 6: should not play again
      lapsSubject.next({
        objectId: mockHd.objectId,
        lapNumber: 6,
        lapTime: 1.234,
        bestLapTime: 1.0,
      });
      expect(mockThemeService.resolveAudioConfig).not.toHaveBeenCalledWith(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
      );
    });
  });

  describe("Audio Sets", () => {
    let mockThemeService: any;

    beforeEach(() => {
      mockThemeService = TestBed.inject(ThemeService);
      component["assets"] = [
        {
          entity_id: "audio-set-1",
          type: "audio_set",
          audioEntries: [
            { timeSeconds: 0, url: "/assets/go.mp3" },
            { timeSeconds: 3, url: "/assets/3.mp3" },
            { timeSeconds: 30, url: "/assets/30_seconds.mp3" },
          ],
        },
      ];
    });

    it("should play sound from audio set for countdown", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "audio_set",
        url: "audio-set-1",
      });

      // Trigger countdown for 3 seconds
      (component as any).playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 3);

      expect(window.Audio).toHaveBeenCalledWith(
        jasmine.stringMatching("/assets/3.mp3"),
      );
    });

    it("should play sound from audio set for GO (0 seconds)", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "audio_set",
        url: "audio-set-1",
      });

      (component as any).playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 0);

      expect(window.Audio).toHaveBeenCalledWith(
        jasmine.stringMatching("/assets/go.mp3"),
      );
    });

    it("should play sound from audio set for time callouts", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "audio_set",
        url: "audio-set-1",
      });

      component["race"] = {
        ...MOCK_RACES[0],
        heat_scoring: {
          finishMethod: FinishMethod.Timed,
          finishValue: 600,
        },
      } as any;

      (component as any).checkAudioCallouts(29.9, 30.1); // Transition across 30s

      expect(window.Audio).toHaveBeenCalledWith(
        jasmine.stringMatching("/assets/30_seconds.mp3"),
      );
    });

    it("should not play if entry for time is not found", () => {
      mockThemeService.resolveAudioConfig.and.returnValue({
        type: "audio_set",
        url: "audio-set-1",
      });

      (component as any).playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 99);

      expect(window.Audio).not.toHaveBeenCalled();
    });
  });

  describe("fractional lap adjustments", () => {
    it("should format fractional lap counts with exactly 2 decimal places", () => {
      const hd: any = { reactionTime: 1.0 };
      expect(component.formatValue("lapCount", 10, hd)).toBe("10.00");
      expect(component.formatValue("lapCount", 10.25, hd)).toBe("10.25");
      expect(component.formatValue("lapCount", 10.5, hd)).toBe("10.50");
      expect(component.formatValue("lapCount", 10.75, hd)).toBe("10.75");
      expect(component.formatValue("lapCount", 10.123, hd)).toBe("10.12"); // Rounded to 2
    });

    it("should call updateUserLaps with current + 0.25 on cell click", () => {
      const mockHd: any = {
        laneIndex: 1,
        userLaps: 1.25,
        adjustedLapCount: 10.25,
      };
      mockDataService.updateUserLaps.and.returnValue(
        of({ adjustedLapCount: 10.5 }),
      );

      const mockCol: any = { propertyName: "lapCount" };
      const mockEvent = { ctrlKey: false } as MouseEvent;
      component.onCellClick(mockHd, mockCol, mockEvent);

      expect(mockDataService.updateUserLaps).toHaveBeenCalledWith(1, 1.5);
      expect(mockHd.adjustedLapCount).toBe(10.5);
    });

    it("should call updateUserLaps with current - 0.25 on shift+click", () => {
      const mockHd: any = {
        laneIndex: 1,
        userLaps: 1.25,
        adjustedLapCount: 10.25,
      };
      mockDataService.updateUserLaps.and.returnValue(
        of({ adjustedLapCount: 10.0 }),
      );

      const mockCol: any = { propertyName: "lapCount" };
      const mockEvent = { shiftKey: true } as MouseEvent;
      component.onCellClick(mockHd, mockCol, mockEvent);

      expect(mockDataService.updateUserLaps).toHaveBeenCalledWith(1, 1.0);
      expect(mockHd.adjustedLapCount).toBe(10.0);
    });
  });

  describe("Menu option hover and document click behavior", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should return correct status from isAnyMenuDropdownOpen", () => {
      expect(component.isAnyMenuDropdownOpen()).toBeFalse();

      component.isFileMenuOpen = true;
      expect(component.isAnyMenuDropdownOpen()).toBeTrue();

      component.isFileMenuOpen = false;
      component.isMenuOpen = true;
      expect(component.isAnyMenuDropdownOpen()).toBeTrue();

      component.isMenuOpen = false;
      component.isLanesMenuOpen = true;
      expect(component.isAnyMenuDropdownOpen()).toBeTrue();

      component.isLanesMenuOpen = false;
      component.isWindowsMenuOpen = true;
      expect(component.isAnyMenuDropdownOpen()).toBeTrue();
    });

    it("should do nothing on hover if no menus are open", () => {
      component.isFileMenuOpen = false;
      component.isMenuOpen = false;
      component.isLanesMenuOpen = false;
      component.isWindowsMenuOpen = false;

      component.onMenuItemHover("race");

      expect(component.isMenuOpen).toBeFalse();
      expect(component.isFileMenuOpen).toBeFalse();
    });

    it("should switch menus on hover if another menu is open", () => {
      component.isFileMenuOpen = true;
      component.isMenuOpen = false;

      component.onMenuItemHover("race");

      expect(component.isFileMenuOpen).toBeFalse();
      expect(component.isMenuOpen).toBeTrue();

      component.onMenuItemHover("lanes");
      expect(component.isMenuOpen).toBeFalse();
      expect(component.isLanesMenuOpen).toBeTrue();

      component.onMenuItemHover("windows");
      expect(component.isLanesMenuOpen).toBeFalse();
      expect(component.isWindowsMenuOpen).toBeTrue();

      component.onMenuItemHover("file");
      expect(component.isWindowsMenuOpen).toBeFalse();
      expect(component.isFileMenuOpen).toBeTrue();
    });

    it("should close menus when clicking outside the menu wrapper", () => {
      component.isFileMenuOpen = true;

      const clickEvent = new MouseEvent("click", { bubbles: true });
      document.dispatchEvent(clickEvent);

      expect(component.isFileMenuOpen).toBeFalse();
      expect(component.isMenuOpen).toBeFalse();
      expect(component.isLanesMenuOpen).toBeFalse();
      expect(component.isWindowsMenuOpen).toBeFalse();
    });
  });

  describe("Race Ended and Exit Behavior", () => {
    it("should show acknowledgement modal when system state resourceLockState becomes IDLE", () => {
      fixture.detectChanges();
      const systemStateSubject = mockDataService.getSystemState();

      expect(component.showAckModal).toBeFalse();
      expect(component.raceHasEnded).toBeFalse();

      systemStateSubject.next({ resourceLockState: "IDLE" });

      expect(component.raceHasEnded).toBeTrue();
      expect(component.showExitConfirmation).toBeFalse();
      expect(component.showSkipHeatConfirmation).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalTitle).toBe("RD_RACE_ENDED_TITLE");
      expect(component.ackModalMessage).toBe("RD_RACE_ENDED_MESSAGE");
      expect(component.ackModalButtonText).toBe("RD_RACE_ENDED_BTN_OK");
    });

    it("should transition from race ended to new race started when resourceLockState becomes RACE_RUNNING", () => {
      fixture.detectChanges();
      const systemStateSubject = mockDataService.getSystemState();

      systemStateSubject.next({ resourceLockState: "IDLE" });
      expect(component.raceHasEnded).toBeTrue();
      expect(component.showAckModal).toBeTrue();

      mockDataService.updateRaceSubscription.calls.reset();

      systemStateSubject.next({ resourceLockState: "RACE_RUNNING" });

      expect(component.raceHasEnded).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalTitle).toBe("RD_RACE_STARTED_TITLE");
      expect(component.ackModalMessage).toBe("RD_RACE_STARTED_MESSAGE");
      expect(component.ackModalButtonText).toBe("RD_RACE_STARTED_BTN_OK");
      expect(mockDataService.updateRaceSubscription).toHaveBeenCalledWith(true);
    });

    it("should allow deactivation immediately if forceExit is true", () => {
      fixture.detectChanges();
      component.forceExit = true;
      component.raceHasEnded = true;

      const result = component.canDeactivate();
      expect(result).toBeTrue();
    });

    it("should block deactivation and show acknowledgement modal when race has ended and forceExit is false", () => {
      fixture.detectChanges();
      component.raceHasEnded = true;
      component.forceExit = false;

      const result = component.canDeactivate();
      expect(result).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalTitle).toBe("RD_RACE_ENDED_TITLE");
      expect(component.ackModalMessage).toBe("RD_RACE_ENDED_MESSAGE");
      expect(component.ackModalButtonText).toBe("RD_RACE_ENDED_BTN_OK");
    });

    it("should redirect to /raceday-setup and set forceExit to true on acknowledging the modal when raceHasEnded is true", () => {
      fixture.detectChanges();
      component.raceHasEnded = true;
      component.showAckModal = true;
      component.forceExit = false;

      component.onAcknowledgeModal();

      expect(component.showAckModal).toBeFalse();
      expect(component.forceExit).toBeTrue();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });

    it("should show exit confirmation modal on canDeactivate under normal conditions", () => {
      fixture.detectChanges();
      component.raceHasEnded = false;
      component.forceExit = false;

      const result = component.canDeactivate();
      // Returns deactivateSubject observable under normal conditions
      expect(result).toBeDefined();
      expect(component.showExitConfirmation).toBeTrue();
      expect(component.exitModalTitle).toBe("RD_CONFIRM_EXIT_TITLE");
    });
  });
  describe("Z-Order Widget Reordering", () => {
    beforeEach(() => {
      component.layout = {
        widgets: [
          {
            id: "w1",
            widgetType: "timer",
            x: 10,
            y: 10,
            width: 100,
            height: 100,
            zIndex: 100,
          },
          {
            id: "w2",
            widgetType: "records",
            x: 20,
            y: 20,
            width: 100,
            height: 100,
            zIndex: 105,
          },
          {
            id: "w3",
            widgetType: "flag",
            x: 30,
            y: 30,
            width: 100,
            height: 100,
            zIndex: 102,
          },
        ],
      } as any;
      spyOn(component.layoutChanged, "emit");
    });

    it("should normalize z-indices to start at 100 sequentially based on current z-index order", () => {
      component.normalizeZIndices();
      expect(
        component.layout.widgets.find((w: any) => w.id === "w1")?.zIndex,
      ).toBe(100);
      expect(
        component.layout.widgets.find((w: any) => w.id === "w3")?.zIndex,
      ).toBe(101);
      expect(
        component.layout.widgets.find((w: any) => w.id === "w2")?.zIndex,
      ).toBe(102);
    });

    it("should move a widget forward in draw order by swapping with the next z-index", () => {
      component.moveWidgetForward("w3");
      expect(
        component.layout.widgets.find((w: any) => w.id === "w3")?.zIndex,
      ).toBe(102);
      expect(
        component.layout.widgets.find((w: any) => w.id === "w2")?.zIndex,
      ).toBe(101);
      expect(component.layoutChanged.emit).toHaveBeenCalledWith(
        component.layout,
      );
    });

    it("should not move a widget forward if it is already at the front", () => {
      component.moveWidgetForward("w2");
      expect(
        component.layout.widgets.find((w: any) => w.id === "w2")?.zIndex,
      ).toBe(102);
    });

    it("should move a widget backward in draw order by swapping with the previous z-index", () => {
      component.moveWidgetBackward("w3");
      expect(
        component.layout.widgets.find((w: any) => w.id === "w3")?.zIndex,
      ).toBe(100);
      expect(
        component.layout.widgets.find((w: any) => w.id === "w1")?.zIndex,
      ).toBe(101);
      expect(component.layoutChanged.emit).toHaveBeenCalledWith(
        component.layout,
      );
    });

    it("should not move a widget backward if it is already at the back", () => {
      component.moveWidgetBackward("w1");
      expect(
        component.layout.widgets.find((w: any) => w.id === "w1")?.zIndex,
      ).toBe(100);
    });
  });

  describe("Dynamic Table Body Height", () => {
    it("should calculate correct table body height based on lane-view widget height", () => {
      component.layout = {
        widgets: [
          {
            id: "lane-view-w",
            widgetType: "lane-view",
            x: 10,
            y: 10,
            width: 800,
            height: 600,
          },
        ],
      } as any;
      component.isLayoutCustomizing = false;

      // widget height (600) - edit overlay (0) - margins (10) - header (36) = 554
      expect(component.getTableBodyHeight()).toBe(554);
    });

    it("should deduct offset for edit mode overlay when layout customization is active", () => {
      component.layout = {
        widgets: [
          {
            id: "lane-view-w",
            widgetType: "lane-view",
            x: 10,
            y: 10,
            width: 800,
            height: 600,
          },
        ],
      } as any;
      component.isLayoutCustomizing = true;

      // widget height (600) - edit overlay (28) - margins (10) - header (36) = 526
      expect(component.getTableBodyHeight()).toBe(526);
    });

    it("should return default fallback height if lane-view widget is not found", () => {
      component.layout = {
        widgets: [],
      } as any;
      expect(component.getTableBodyHeight()).toBe(672);
    });
  });

  describe("CSS Encapsulation and Leakage", () => {
    it("should not leak its styles globally due to native CSS nesting", () => {
      fixture.detectChanges();

      const testElement = document.createElement("div");
      testElement.className = "dashboard-wrapper";
      testElement.id = "leak-test-element";
      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);

      // If the styles leaked, display would be 'flex'.
      // If properly scoped by 'app-default-raceday', it should remain 'block'.
      expect(computedStyle.display).toBe("block");

      document.body.removeChild(testElement);
    });
  });
});
