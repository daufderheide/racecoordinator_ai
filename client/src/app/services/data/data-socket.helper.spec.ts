import { NgZone } from "@angular/core";
import {
  RaceData,
  RaceFlag,
  RaceState,
  SystemState,
} from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";

import { DataSocketHelper } from "./data-socket.helper";

describe("DataSocketHelper", () => {
  let helper: DataSocketHelper;
  let mockNgZone: jasmine.SpyObj<NgZone>;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let serverInfo: { serverIp: string; serverPort: number; wsProtocol: string };

  beforeEach(() => {
    mockNgZone = jasmine.createSpyObj<NgZone>("NgZone", ["run"]);
    mockNgZone.run.and.callFake((fn: () => any) => fn());

    mockLogger = jasmine.createSpyObj<LoggerService>("LoggerService", [
      "info",
      "debug",
      "warn",
      "error",
    ]);

    serverInfo = {
      serverIp: "127.0.0.1",
      serverPort: 7070,
      wsProtocol: "ws",
    };

    helper = new DataSocketHelper(mockNgZone, mockLogger, () => serverInfo);
  });

  describe("state management", () => {
    it("should clear race data and reset state", () => {
      helper.raceStateSubject.next(RaceState.RACING);
      helper.flagSubject.next(RaceFlag.GREEN);
      helper.raceTimeSubject.next({ time: 1000 });
      helper.lastRaceTimeReceivedAt = 500;
      helper.raceSubscriptionStartedAt = 200;

      helper.clearRaceData();

      expect(helper.raceStateSubject.value).toBe(RaceState.UNKNOWN_STATE);
      expect(helper.flagSubject.value).toBe(RaceFlag.UNKNOWN_FLAG);
      expect(helper.raceTimeSubject.value).toEqual({ time: 0 });
      expect(helper.lastRaceTimeReceivedAt).toBe(0);
      expect(helper.raceSubscriptionStartedAt).toBe(0);
    });

    it("should reset socket explicit disconnect flags", () => {
      helper.shouldSubscribeToRaceData = true;
      helper.isInterfaceSocketExplicitlyDisconnected = true;
      helper.isRaceDataSocketExplicitlyDisconnected = true;

      helper.resetSocketState();

      expect(helper.shouldSubscribeToRaceData).toBeFalse();
      expect(helper.isInterfaceSocketExplicitlyDisconnected).toBeFalse();
      expect(helper.isRaceDataSocketExplicitlyDisconnected).toBeFalse();
    });
  });

  describe("subscription handling", () => {
    it("should send subscription request when race socket is open", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: jasmine.createSpy("send"),
      } as any;
      helper.raceDataSocket = mockWs;

      helper.updateRaceSubscription(true);

      expect(helper.shouldSubscribeToRaceData).toBeTrue();
      expect(helper.raceSubscriptionStartedAt).toBeGreaterThan(0);
      expect(mockWs.send).toHaveBeenCalled();
    });

    it("should clear race data and connect when socket is not open on subscription", () => {
      const connectSpy = spyOn(helper, "connectToRaceDataSocket");

      helper.updateRaceSubscription(false);

      expect(helper.shouldSubscribeToRaceData).toBeFalse();
      expect(connectSpy).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/not open/),
      );
    });
  });

  describe("handleRaceTimeMessage", () => {
    it("should record lag when interval exceeds threshold outside grace period", () => {
      helper.lastRaceTimeReceivedAt = 100;
      helper.raceSubscriptionStartedAt = 0;

      helper.handleRaceTimeMessage(
        { time: 10 },
        RaceState.RACING,
        1000, // gap = 900ms > 450ms
        10,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/WebSocket interval lag: 900ms/),
      );
      expect(helper.lastRaceTimeReceivedAt).toBe(1000);
    });

    it("should suppress lag warning during hydration grace period", () => {
      helper.lastRaceTimeReceivedAt = 1000;
      helper.raceSubscriptionStartedAt = 1500; // now(1600) - startedAt(1500) = 100ms < 3000ms

      helper.handleRaceTimeMessage(
        { time: 10 },
        RaceState.RACING,
        1600, // gap = 600ms
        0,
      );

      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(helper.lastRaceTimeReceivedAt).toBe(1600);
    });

    it("should set lastRaceTimeReceivedAt to 0 when race is not ticking", () => {
      helper.lastRaceTimeReceivedAt = 500;

      helper.handleRaceTimeMessage({ time: 10 }, RaceState.NOT_STARTED, 600, 0);

      expect(helper.lastRaceTimeReceivedAt).toBe(0);
    });
  });

  describe("dispatchTelemetryUpdates", () => {
    it("should push updates to corresponding subjects", () => {
      const standingsSpy = jasmine.createSpy("standings");
      const overallSpy = jasmine.createSpy("overall");
      const groupSpy = jasmine.createSpy("group");
      const lapSpy = jasmine.createSpy("lap");
      const carDataSpy = jasmine.createSpy("carData");
      const segmentSpy = jasmine.createSpy("segment");
      const flagSpy = jasmine.createSpy("flag");
      const recordSpy = jasmine.createSpy("record");
      const heatSpy = jasmine.createSpy("heat");
      const systemStateSpy = jasmine.createSpy("systemState");

      helper.standingsSubject.subscribe(standingsSpy);
      helper.overallStandingsSubject.subscribe(overallSpy);
      helper.groupStandingsSubject.subscribe(groupSpy);
      helper.lapSubject.subscribe(lapSpy);
      helper.carDataSubject.subscribe(carDataSpy);
      helper.segmentSubject.subscribe(segmentSpy);
      helper.flagSubject.subscribe(flagSpy);
      helper.recordDataSubject.subscribe(recordSpy);
      helper.heatSubject.subscribe(heatSpy);
      helper.systemStateSubject.subscribe(systemStateSpy);

      const fakeData = RaceData.create({
        standingsUpdate: { updates: [] },
        overallStandingsUpdate: { participants: [] },
        groupStandingsUpdate: { group: 1 },
        lap: { lapNumber: 5 },
        carData: { lane: 1 },
        segment: { segmentNumber: 2 },
        flag: RaceFlag.GREEN,
        recordData: { overall: {} },
        heat: { heatNumber: 3 },
        systemState: SystemState.create({ resourceLockState: "READY" }),
      });

      helper.dispatchTelemetryUpdates(fakeData);

      expect(standingsSpy).toHaveBeenCalled();
      expect(overallSpy).toHaveBeenCalled();
      expect(groupSpy).toHaveBeenCalled();
      expect(lapSpy).toHaveBeenCalled();
      expect(carDataSpy).toHaveBeenCalled();
      expect(segmentSpy).toHaveBeenCalled();
      expect(flagSpy).toHaveBeenCalledWith(RaceFlag.GREEN);
      expect(recordSpy).toHaveBeenCalled();
      expect(heatSpy).toHaveBeenCalled();
      expect(systemStateSpy).toHaveBeenCalledWith(
        fakeData.systemState as SystemState,
      );
      expect(helper.getSystemStateValue()).toBe(
        fakeData.systemState as SystemState,
      );
    });
  });

  describe("socket lifecycle and disconnection", () => {
    it("should close sockets and mark explicit disconnection flags", () => {
      const mockRaceWs = jasmine.createSpyObj("WebSocket", ["close"]);
      const mockInterfaceWs = jasmine.createSpyObj("WebSocket", ["close"]);

      helper.raceDataSocket = mockRaceWs;
      helper.interfaceDataSocket = mockInterfaceWs;

      helper.disconnectAllSockets();

      expect(mockRaceWs.close).toHaveBeenCalled();
      expect(mockInterfaceWs.close).toHaveBeenCalled();
      expect(helper.raceDataSocket).toBeUndefined();
      expect(helper.interfaceDataSocket).toBeUndefined();
      expect(helper.isRaceDataSocketExplicitlyDisconnected).toBeTrue();
      expect(helper.isInterfaceSocketExplicitlyDisconnected).toBeTrue();
    });
  });

  describe("observable getters", () => {
    it("should expose all subjects as observables", () => {
      const cases: [() => any, any, any][] = [
        [() => helper.getRaceTime(), helper.raceTimeSubject, { time: 100 }],
        [() => helper.getLaps(), helper.lapSubject, { lap: 1 }],
        [
          () => helper.getStandingsUpdate(),
          helper.standingsSubject,
          { standings: [] },
        ],
        [
          () => helper.getOverallStandingsUpdate(),
          helper.overallStandingsSubject,
          { overall: [] },
        ],
        [
          () => helper.getGroupStandingsUpdate(),
          helper.groupStandingsSubject,
          { group: [] },
        ],
        [() => helper.getRaceUpdate(), helper.raceUpdateSubject, { id: "r1" }],
        [
          () => helper.getInterfaceEvents(),
          helper.interfaceEventSubject,
          { event: "ping" },
        ],
        [() => helper.getRaceState(), helper.raceStateSubject, 1],
        [() => helper.getRaceFlag(), helper.flagSubject, 2],
        [() => helper.getCarData(), helper.carDataSubject, { car: 1 }],
        [() => helper.getSegments(), helper.segmentSubject, { seg: 1 }],
        [() => helper.getRecordData(), helper.recordDataSubject, { record: 1 }],
        [() => helper.getHeats(), helper.heatSubject, { heat: 1 }],
        [
          () => helper.getSystemState(),
          helper.systemStateSubject,
          { state: 1 },
        ],
      ];

      for (const [getter, subject, mockVal] of cases) {
        let received: any;
        const sub = getter().subscribe((val: any) => (received = val));
        subject.next(mockVal);
        expect(received).toEqual(mockVal);
        sub.unsubscribe();
      }

      expect(helper.getSystemStateValue()).toBe(
        helper.systemStateSubject.value,
      );
    });
  });
});
