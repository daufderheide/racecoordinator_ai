import { fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { DataService } from "@app/data.service";
import {
  IInterfaceEvent,
  ILap,
  InterfaceStatus,
  RaceFlag,
  RaceState,
} from "@app/proto/antigravity";

import { ChildWindowManagerService } from "./child-window-manager.service";
import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";

describe("RaceConnectionService", () => {
  let service: RaceConnectionService;
  let mockDataService: any;
  let mockRaceService: any;

  let interfaceEventsSubject: Subject<IInterfaceEvent>;
  let raceUpdateSubject: Subject<any>;
  let lapsSubject: Subject<ILap>;
  let standingsUpdateSubject: Subject<any>;

  beforeEach(() => {
    interfaceEventsSubject = new Subject<IInterfaceEvent>();
    raceUpdateSubject = new Subject<any>();
    lapsSubject = new Subject<ILap>();
    standingsUpdateSubject = new Subject<any>();

    mockDataService = jasmine.createSpyObj("DataService", [
      "getInterfaceEvents",
      "getRaceUpdate",
      "getLaps",
      "getRaceTime",
      "getCarData",
      "getStandingsUpdate",
      "getOverallStandingsUpdate",
      "getGroupStandingsUpdate",
      "getReactionTimes",
      "getSegments",
      "getRaceState",
      "getDrivers",
      "getRaceFlag",
      "connectToInterfaceDataSocket",
      "disconnectFromInterfaceDataSocket",
      "updateRaceSubscription",
      "getRecordData",
      "getHeats",
      "getSystemState",
    ]);
    mockDataService.socketConnected$ = of(true);

    mockDataService.getInterfaceEvents.and.returnValue(
      interfaceEventsSubject.asObservable(),
    );
    mockDataService.getRaceUpdate.and.returnValue(
      raceUpdateSubject.asObservable(),
    );
    mockDataService.getLaps.and.returnValue(lapsSubject.asObservable());
    mockDataService.getRaceTime.and.returnValue(of(0));
    mockDataService.getCarData.and.returnValue(of({}));
    mockDataService.getStandingsUpdate.and.returnValue(
      standingsUpdateSubject.asObservable(),
    );
    mockDataService.getOverallStandingsUpdate.and.returnValue(of({}));
    mockDataService.getGroupStandingsUpdate.and.returnValue(of({}));
    mockDataService.getReactionTimes.and.returnValue(of({}));
    mockDataService.getSegments.and.returnValue(of(null));
    mockDataService.getRaceState.and.returnValue(of(RaceState.NOT_STARTED));
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));
    mockDataService.getRecordData.and.returnValue(of(null));
    mockDataService.getHeats.and.returnValue(of({}));
    mockDataService.getSystemState.and.returnValue(of(null));

    mockRaceService = jasmine.createSpyObj("RaceService", [
      "getRace",
      "getCurrentHeat",
      "setCurrentHeat",
      "clear",
    ]);
    mockRaceService.getCurrentHeat.and.returnValue({
      heatDrivers: [
        { objectId: "d1", addLapTime: jasmine.createSpy("addLapTime") },
      ],
    });

    TestBed.configureTestingModule({
      providers: [
        RaceConnectionService,
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
      ],
    });
    service = TestBed.inject(RaceConnectionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("connect / disconnect (Reference Counting)", () => {
    it("should call startConnection only on first connect", () => {
      spyOn<any>(service, "startConnection").and.callThrough();

      service.connect();
      expect((service as any).startConnection).toHaveBeenCalledTimes(1);

      service.connect();
      expect((service as any).startConnection).toHaveBeenCalledTimes(1); // Should still be 1
    });

    it("should call stopConnection when reference count reaches 0", fakeAsync(() => {
      spyOn<any>(service, "stopConnection").and.callThrough();

      service.connect();
      service.connect(); // Count = 2

      service.disconnect();
      expect((service as any).stopConnection).not.toHaveBeenCalled();

      service.disconnect();
      tick(2000); // Wait for delayed disconnection
      expect((service as any).stopConnection).toHaveBeenCalledTimes(1);
    }));

    it("should bypass timeout and call stopConnection immediately if force=true", fakeAsync(() => {
      spyOn<any>(service, "stopConnection").and.callThrough();

      service.connect(); // Count = 1

      service.disconnect(true);

      // Should be called immediately without ticking
      expect((service as any).stopConnection).toHaveBeenCalledTimes(1);
    }));

    it("should call closeAllWindows on childWindowManagerService when stopConnection runs", () => {
      const childWindowManager = TestBed.inject(ChildWindowManagerService);
      spyOn(childWindowManager, "closeAllWindows");

      (service as any).stopConnection();

      expect(childWindowManager.closeAllWindows).toHaveBeenCalled();
    });
  });

  describe("Watchdog and Alerts", () => {
    it("should emit timeout alert after 30s of NO_STATUS on startup", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();
      expect(emittedAlert).toBeNull();

      tick(30000);
      expect(emittedAlert).toEqual({
        titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
        messageKey: "ACK_MODAL_MSG_DISCONNECTED",
      });
      sub.unsubscribe();
      flush();
    }));

    it("should clear timeout alerts when CONNECTED is received", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();
      tick(30000); // Trigger timeout
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      // First connection should be silent (suppress CONNECTED alert)
      // but it clears the previous error
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });

      // The previous alert remains in emittedAlert because we didn't emit a new one
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      sub.unsubscribe();
      flush();
    }));

    it("should show CONNECTED alert only if it was previously connected during the session", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();

      // First connection - silent
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert).toBeNull();

      // Disconnect - should emit immediately without waiting 5000ms watchdog
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      // Reconnect - should show alert now because hasInitiallyConnected is true
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_CONNECTED");

      sub.unsubscribe();
      flush();
    }));

    it("should emit DISCONNECTED alert immediately without 5-second delay", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert).toBeNull();

      // Send DISCONNECTED status
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });

      // Emitted immediately at 0ms delay
      expect(emittedAlert).toEqual({
        titleKey: "ACK_MODAL_TITLE_DISCONNECTED",
        messageKey: "ACK_MODAL_MSG_DISCONNECTED",
      });

      sub.unsubscribe();
      flush();
    }));

    it("should log status transitions and watchdog timeouts", fakeAsync(() => {
      const logger = (service as any).logger;
      spyOn(logger, "info");
      spyOn(logger, "debug");
      spyOn(logger, "warn");

      service.connect();

      // First status change
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(logger.info).toHaveBeenCalledWith(
        `RaceConnectionService: Interface status changed from -1 to ${InterfaceStatus.CONNECTED}`,
      );

      // Same status should log debug/trace without info spam
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(logger.debug).toHaveBeenCalledWith(
        "RaceConnectionService: Interface status unchanged:",
        InterfaceStatus.CONNECTED,
      );

      // Watchdog timeout warning
      tick(6000); // 5s watchdog after initial connection
      expect(logger.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/Interface watchdog timeout reached/),
      );
      flush();
    }));

    it("should reset connection state on each NEW connection session (startConnection)", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      // --- SESSION 1 ---
      service.connect();
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert).toBeNull(); // Silent first connect
      service.disconnect();
      flush();

      // --- SESSION 2 ---
      emittedAlert = null;
      service.connect(); // Should call startConnection and reset hasInitiallyConnected

      // First connection of second session should also be silent
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert).toBeNull();

      sub.unsubscribe();
      flush();
    }));

    it("should emit alert immediately when initial status is DISCONNECTED", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      sub.unsubscribe();
      flush();
    }));

    it("should set 5s alarm when DISCONNECTED is received after initial connection", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      emittedAlert = null;

      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });
      tick(5000);
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      sub.unsubscribe();
      flush();
    }));

    it("should suppress watchdog alerts when systemState is IDLE", fakeAsync(() => {
      const systemStateSubject = new Subject<any>();
      mockDataService.getSystemState.and.returnValue(
        systemStateSubject.asObservable(),
      );

      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();

      // Emit IDLE system state
      systemStateSubject.next({ resourceLockState: "IDLE" });

      // After 30 seconds, normally a timeout would fire, but should be suppressed
      tick(30000);
      expect(emittedAlert).toBeNull();

      // When DISCONNECTED event occurs, it should also be suppressed
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });
      tick(30000);
      expect(emittedAlert).toBeNull();

      sub.unsubscribe();
      flush();
    }));

    it("should resume watchdog alerts when systemState transitions back to RACE_RUNNING", fakeAsync(() => {
      const systemStateSubject = new Subject<any>();
      mockDataService.getSystemState.and.returnValue(
        systemStateSubject.asObservable(),
      );

      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();

      // Start with IDLE
      systemStateSubject.next({ resourceLockState: "IDLE" });
      tick(30000);
      expect(emittedAlert).toBeNull();

      // Transition to RACE_RUNNING
      systemStateSubject.next({ resourceLockState: "RACE_RUNNING" });

      // After transition, no status watchdog should be reset and eventually fire if no status
      tick(30000);
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      sub.unsubscribe();
      flush();
    }));
  });

  describe("Data Stream Forwarding", () => {
    it("should pipe laps to laps$", (done) => {
      const lapData: ILap = { objectId: "d1", lapTime: 1.234 };
      service.connect();

      service.laps$.subscribe((lap) => {
        if (lap) {
          expect(lap).toEqual(lapData);
          done();
        }
      });

      lapsSubject.next(lapData);
    });

    it("should pipe flags to raceFlag$", (done) => {
      const mockFlagSubject = new Subject<RaceFlag>();
      mockDataService.getRaceFlag.and.returnValue(
        mockFlagSubject.asObservable(),
      );

      service.connect();

      service.raceFlag$.subscribe((flag) => {
        if (flag === RaceFlag.GREEN) {
          expect(flag).toBe(RaceFlag.GREEN);
          done();
        }
      });

      mockFlagSubject.next(RaceFlag.GREEN);
    });

    it("should drop transient raceTime 0 during STARTING transition", fakeAsync(() => {
      const raceStateSubject = new Subject<RaceState>();
      mockDataService.getRaceState.and.returnValue(
        raceStateSubject.asObservable(),
      );

      const raceTimeSubject = new Subject<any>();
      mockDataService.getRaceTime.and.returnValue(
        raceTimeSubject.asObservable(),
      );

      const emittedTimes: any[] = [];
      service.connect();
      service.raceTime$.subscribe((t) => emittedTimes.push(t));

      raceStateSubject.next(RaceState.STARTING);
      tick();

      raceTimeSubject.next({ time: 5.0, autoStartRemaining: 5.0 });
      tick();

      raceTimeSubject.next({ time: 0, autoStartRemaining: 0 });
      tick();

      expect(emittedTimes.length).toBe(2);
      expect(emittedTimes[0].time).toBe(0);
      expect(emittedTimes[1].time).toBe(5.0);
    }));
  });

  describe("Connection recovery", () => {
    it("should hydrate drivers when socketConnected$ emits true", () => {
      const socketSubject = new Subject<boolean>();
      mockDataService.socketConnected$ = socketSubject.asObservable();

      spyOn<any>(service, "hydrateDrivers").and.callThrough();

      service.connect();

      expect((service as any).hydrateDrivers).not.toHaveBeenCalled();

      socketSubject.next(true);

      expect((service as any).hydrateDrivers).toHaveBeenCalled();
    });
  });

  describe("Standings Updates", () => {
    it("should update heat standings correctly when receiving a standings update", fakeAsync(() => {
      service.connect();

      const heatMock = {
        heatDrivers: [
          { objectId: "d1", rank: 0, gapLeader: 0, gapPosition: 0 },
          { objectId: "d2", rank: 0, gapLeader: 0, gapPosition: 0 },
        ],
        standings: [] as string[],
      };

      mockRaceService.getCurrentHeat.and.returnValue(heatMock);

      const updateData = {
        updates: [
          { objectId: "d2", rank: 1, gapLeader: 0, gapPosition: 0 },
          { objectId: "d1", rank: 2, gapLeader: 5, gapPosition: 5 },
        ],
      };

      standingsUpdateSubject.next(updateData);
      tick();

      expect(heatMock.standings).toEqual(["d2", "d1"]);
      expect(heatMock.heatDrivers[0].rank).toBe(2);
      expect(heatMock.heatDrivers[1].rank).toBe(1);
    }));
  });

  describe("Reaction Times, Segments and Stream Events", () => {
    it("should process reaction times and emit via reactionTimes$", fakeAsync(() => {
      service.connect();

      const reactionTimeSubject = new Subject<any>();
      mockDataService.getReactionTimes.and.returnValue(
        reactionTimeSubject.asObservable(),
      );

      let emittedReaction: any;
      service.reactionTimes$.subscribe((rt) => (emittedReaction = rt));

      (service as any).reactionTimeSubject.next({
        objectId: "d1",
        reactionTime: 0.125,
      });
      tick();

      expect(emittedReaction).toEqual({
        objectId: "d1",
        reactionTime: 0.125,
      });
    }));

    it("should process record data updates and emit on recordData$", fakeAsync(() => {
      let recordEmitted: any;
      service.recordData$.subscribe((rec) => (recordEmitted = rec));

      const mockRecord: any = {
        trackRecords: [],
        overallRecords: [],
      };

      (service as any).recordDataSubject.next(mockRecord);
      tick();

      expect(recordEmitted).toBe(mockRecord);
    }));

    it("should handle force disconnect immediately", fakeAsync(() => {
      service.connect();
      expect((service as any).isConnected).toBeTrue();

      service.disconnect(true);
      tick();

      expect((service as any).isConnected).toBeFalse();
      expect((service as any).connectionCount).toBe(0);
    }));

    it("should process race updates with event, season, driver, and heat payloads", fakeAsync(() => {
      service.connect();

      const mockExistingRace: any = {
        entity_id: "old_race_id",
        practice: false,
      };
      mockRaceService.getRace = jasmine
        .createSpy("getRace")
        .and.returnValue(mockExistingRace);
      mockRaceService.setRace = jasmine.createSpy("setRace");
      mockRaceService.setParticipants = jasmine.createSpy("setParticipants");
      mockRaceService.setHeats = jasmine.createSpy("setHeats");
      mockRaceService.setCurrentHeat = jasmine.createSpy("setCurrentHeat");

      const updatePayload: any = {
        race: {
          model: { entityId: "new_race_id" },
          name: "Championship Race",
          heatScoring: { finishMethod: 1 },
          overallScoring: { rankingMethod: 1 },
          lanes: [],
        },
        isEvent: true,
        eventId: "event_123",
        eventName: "Grand Prix Cup",
        currentEventRaceIndex: 2,
        totalEventRaces: 5,
        autoAdvanceRemainingSeconds: 15,
        isSeason: true,
        seasonId: "season_456",
        seasonName: "2026 Pro Season",
        seasonStandings: [{ driverId: "d1", points: 25 }],
        drivers: [
          {
            driver: { model: { entityId: "d1" }, name: "Driver 1" },
            car: { name: "Car 1" },
          },
        ],
        heats: [
          {
            heatNumber: 1,
            heatDrivers: [],
          },
        ],
        currentHeat: {
          heatNumber: 1,
          heatDrivers: [],
        },
        recordData: { trackRecords: [] },
      };

      (service as any).driversLoaded = true;
      (service as any).processRaceUpdate(updatePayload);
      tick();

      expect(mockRaceService.setRace).toHaveBeenCalled();
      expect(mockRaceService.setParticipants).toHaveBeenCalled();
      expect(mockRaceService.setHeats).toHaveBeenCalled();
      expect(mockRaceService.setCurrentHeat).toHaveBeenCalled();
    }));

    it("should handle error in driver loading gracefully and flush pendingUpdate", fakeAsync(() => {
      const errorDriversSubject = new Subject<any>();
      mockDataService.getDrivers.and.returnValue(
        errorDriversSubject.asObservable(),
      );

      service.connect();
      (service as any).driversLoaded = false;
      (service as any).pendingUpdate = { isEvent: true };
      spyOn(service as any, "processRaceUpdate");

      errorDriversSubject.error(new Error("Network failure"));
      tick();

      expect((service as any).driversLoaded).toBeTrue();
      expect((service as any).processRaceUpdate).toHaveBeenCalledWith({
        isEvent: true,
      });
      expect((service as any).pendingUpdate).toBeNull();
    }));
  });
});
