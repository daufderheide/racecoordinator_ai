import { fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { DataService } from "src/app/data.service";
import { com } from "src/app/proto/message";

import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";

describe("RaceConnectionService", () => {
  let service: RaceConnectionService;
  let mockDataService: any;
  let mockRaceService: any;

  let interfaceEventsSubject: Subject<com.antigravity.IInterfaceEvent>;
  let raceUpdateSubject: Subject<any>;
  let lapsSubject: Subject<com.antigravity.ILap>;

  beforeEach(() => {
    interfaceEventsSubject = new Subject<com.antigravity.IInterfaceEvent>();
    raceUpdateSubject = new Subject<any>();
    lapsSubject = new Subject<com.antigravity.ILap>();

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
    ]);

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
    mockDataService.getRaceState.and.returnValue(
      of(com.antigravity.RaceState.NOT_STARTED),
    );
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getRaceFlag.and.returnValue(
      of(com.antigravity.RaceFlag.RED),
    );

    mockRaceService = jasmine.createSpyObj("RaceService", [
      "getRace",
      "getCurrentHeat",
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

    it("should call stopConnection when reference count reaches 0", () => {
      spyOn<any>(service, "stopConnection").and.callThrough();

      service.connect();
      service.connect(); // Count = 2

      service.disconnect();
      expect((service as any).stopConnection).not.toHaveBeenCalled();

      service.disconnect();
      expect((service as any).stopConnection).toHaveBeenCalledTimes(1);
    });
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

      interfaceEventsSubject.next({
        status: { status: com.antigravity.InterfaceStatus.CONNECTED },
      });
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_CONNECTED");

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
        status: { status: com.antigravity.InterfaceStatus.CONNECTED },
      });
      emittedAlert = null;

      interfaceEventsSubject.next({
        status: { status: com.antigravity.InterfaceStatus.DISCONNECTED },
      });

      tick(2000);
      expect(emittedAlert).toBeNull();

      tick(3000);
      expect(emittedAlert.titleKey).toBe("ACK_MODAL_TITLE_DISCONNECTED");

      sub.unsubscribe();
      flush();
    }));
  });

  describe("Data Stream Forwarding", () => {
    it("should pipe laps to laps$", (done) => {
      const lapData: com.antigravity.ILap = { objectId: "d1", lapTime: 1.234 };
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
      const mockFlagSubject = new Subject<com.antigravity.RaceFlag>();
      mockDataService.getRaceFlag.and.returnValue(
        mockFlagSubject.asObservable(),
      );

      service.connect();

      service.raceFlag$.subscribe((flag) => {
        if (flag === com.antigravity.RaceFlag.GREEN) {
          expect(flag).toBe(com.antigravity.RaceFlag.GREEN);
          done();
        }
      });

      mockFlagSubject.next(com.antigravity.RaceFlag.GREEN);
    });
  });
});
