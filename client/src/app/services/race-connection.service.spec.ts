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

import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";

describe("RaceConnectionService", () => {
  let service: RaceConnectionService;
  let mockDataService: any;
  let mockRaceService: any;

  let interfaceEventsSubject: Subject<IInterfaceEvent>;
  let raceUpdateSubject: Subject<any>;
  let lapsSubject: Subject<ILap>;

  beforeEach(() => {
    interfaceEventsSubject = new Subject<IInterfaceEvent>();
    raceUpdateSubject = new Subject<any>();
    lapsSubject = new Subject<ILap>();

    mockDataService = jasmine.createSpyObj("DataService", [
      "getInterfaceEvents",
      "getRaceUpdate",
      "getLaps",
      "getRaceTime",
      "getCarData",
      "getStandingsUpdate",
      "getOverallStandingsUpdate",
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
    mockDataService.getStandingsUpdate.and.returnValue(of({}));
    mockDataService.getOverallStandingsUpdate.and.returnValue(of({}));
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
  });

  describe("Watchdog and Alerts", () => {
    it("should emit timeout alert after 5s of NO_STATUS on startup", fakeAsync(() => {
      let emittedAlert: any = null;
      const sub = service.interfaceAlert$.subscribe(
        (alert) => (emittedAlert = alert),
      );

      service.connect();
      expect(emittedAlert).toBeNull();

      tick(5000);
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
      tick(5000); // Trigger timeout
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

      // Disconnect
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });
      tick(5000);
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      // Reconnect - should show alert now because hasInitiallyConnected is true
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_CONNECTED");

      sub.unsubscribe();
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

    it("should set 5s alarm when DISCONNECTED is received", fakeAsync(() => {
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

      tick(2000);
      expect(emittedAlert).toBeNull();

      tick(3000);
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

      // After 5 seconds, normally a timeout would fire, but should be suppressed
      tick(5000);
      expect(emittedAlert).toBeNull();

      // When DISCONNECTED event occurs, it should also be suppressed
      interfaceEventsSubject.next({
        status: { status: InterfaceStatus.DISCONNECTED },
      });
      tick(5000);
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
      tick(5000);
      expect(emittedAlert).toBeNull();

      // Transition to RACE_RUNNING
      systemStateSubject.next({ resourceLockState: "RACE_RUNNING" });

      // After transition, no status watchdog should be reset and eventually fire if no status
      tick(5000);
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
});
