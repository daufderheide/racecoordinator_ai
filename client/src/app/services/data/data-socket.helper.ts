import { NgZone } from "@angular/core";
import { Reader } from "protobufjs/minimal";
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";
import {
  ICarData,
  IGroupStandingsUpdate,
  IHeat,
  IInterfaceEvent,
  ILap,
  InterfaceEvent,
  IOverallStandingsUpdate,
  IRace,
  IRaceTime,
  IRecordData,
  ISegment,
  IStandingsUpdate,
  RaceData,
  RaceFlag,
  RaceState,
  RaceSubscriptionRequest,
  SystemState,
} from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";

export class DataSocketHelper {
  public raceDataSocket?: WebSocket;
  public interfaceDataSocket?: WebSocket;

  public raceTimeSubject = new BehaviorSubject<IRaceTime>({
    time: 0,
  });
  public lapSubject = new Subject<ILap>();
  public standingsSubject = new ReplaySubject<IStandingsUpdate>(1);
  public overallStandingsSubject = new ReplaySubject<IOverallStandingsUpdate>(
    1,
  );
  public groupStandingsSubject = new ReplaySubject<IGroupStandingsUpdate>(1);
  public raceUpdateSubject = new ReplaySubject<IRace>(1);
  public interfaceEventSubject = new Subject<IInterfaceEvent>();
  public carDataSubject = new Subject<ICarData>();
  public segmentSubject = new Subject<ISegment>();
  public raceStateSubject = new BehaviorSubject<RaceState>(
    RaceState.UNKNOWN_STATE,
  );
  public flagSubject = new BehaviorSubject<RaceFlag>(RaceFlag.UNKNOWN_FLAG);
  public recordDataSubject = new ReplaySubject<IRecordData>(1);
  public heatSubject = new Subject<IHeat>();
  public systemStateSubject = new BehaviorSubject<SystemState | null>(null);
  public socketConnectedSubject = new BehaviorSubject<boolean>(false);
  public socketConnected$ = this.socketConnectedSubject.asObservable();

  public shouldSubscribeToRaceData = false;
  public isInterfaceSocketExplicitlyDisconnected = false;
  public isRaceDataSocketExplicitlyDisconnected = false;
  public lastRaceTimeReceivedAt = 0;
  public raceSubscriptionStartedAt = 0;

  constructor(
    private ngZone: NgZone,
    private logger: LoggerService,
    private getServerInfo: () => {
      serverIp: string;
      serverPort: number;
      wsProtocol: string;
    },
    private delegate?: any,
  ) {}

  public clearRaceData() {
    this.raceStateSubject.next(RaceState.UNKNOWN_STATE);
    this.flagSubject.next(RaceFlag.UNKNOWN_FLAG);
    this.raceTimeSubject.next({ time: 0 });
    this.lastRaceTimeReceivedAt = 0;
    this.raceSubscriptionStartedAt = 0;

    const clearReplay = (subject: any) => {
      if (subject && Array.isArray(subject._buffer)) {
        subject._buffer.length = 0;
      }
    };
    clearReplay(this.standingsSubject);
    clearReplay(this.overallStandingsSubject);
    clearReplay(this.groupStandingsSubject);
    clearReplay(this.raceUpdateSubject);
    clearReplay(this.recordDataSubject);
  }

  public resetSocketState(): void {
    this.shouldSubscribeToRaceData = false;
    this.isInterfaceSocketExplicitlyDisconnected = false;
    this.isRaceDataSocketExplicitlyDisconnected = false;
  }

  public updateRaceSubscription(subscribe: boolean) {
    this.shouldSubscribeToRaceData = subscribe;
    if (subscribe) {
      this.raceSubscriptionStartedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    } else {
      (this.delegate || this).clearRaceData();
    }
    if (
      this.raceDataSocket &&
      this.raceDataSocket.readyState === WebSocket.OPEN
    ) {
      (this.delegate || this).sendRaceSubscriptionRequest(subscribe);
    } else {
      this.logger.warn(
        "Race Data WebSocket not open. Triggering connection check and queuing subscription.",
      );
      this.connectToRaceDataSocket();
    }
  }

  public sendRaceSubscriptionRequest(subscribe: boolean) {
    if (
      !this.raceDataSocket ||
      this.raceDataSocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const request = RaceSubscriptionRequest.create({
      subscribe,
    });
    const buffer = RaceSubscriptionRequest.encode(request).finish();
    this.raceDataSocket.send(buffer);
    this.logger.info(`Sent RaceSubscriptionRequest: subscribe=${subscribe}`);
  }

  public handleRaceDataMessage(event: MessageEvent) {
    this.ngZone.run(() => {
      try {
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        const dispatchDelay =
          event &&
          typeof event.timeStamp === "number" &&
          event.timeStamp > 0 &&
          event.timeStamp <= now
            ? Math.round(now - event.timeStamp)
            : -1;

        if (dispatchDelay > 100) {
          this.logger.warn(
            `[PERF] Browser main-thread freeze: message dispatch delayed by ${dispatchDelay}ms (UI rendering or long task blocked event loop)`,
          );
        }

        const arrayBuffer = event.data as ArrayBuffer;
        const raceData = RaceData.decode(
          Reader.create(new Uint8Array(arrayBuffer)),
        );

        const previousState = this.raceStateSubject.value;
        let newState = previousState;
        if (raceData.raceState) {
          this.logger.debug("WS: Received RaceState", raceData.raceState);
          newState = raceData.raceState;
          this.raceStateSubject.next(raceData.raceState);
        }
        if (raceData.race) {
          this.logger.debug("WS: Received Race", raceData.race);
          this.raceUpdateSubject.next(raceData.race);
          if (raceData.race.state) {
            newState = raceData.race.state;
            this.raceStateSubject.next(raceData.race.state);
          }
          if (raceData.race.flag) {
            this.flagSubject.next(raceData.race.flag);
          }
          if (raceData.race.currentHeat) {
            this.heatSubject.next(raceData.race.currentHeat);
          }
        }
        if (newState !== previousState) {
          this.lastRaceTimeReceivedAt = 0;
        }
        if (raceData.raceTime) {
          this.handleRaceTimeMessage(
            raceData.raceTime,
            newState,
            now,
            dispatchDelay,
          );
        }
        this.dispatchTelemetryUpdates(raceData);
      } catch (e) {
        this.logger.error("Error parsing race data message", e);
      }
    });
  }

  public handleRaceTimeMessage(
    raceTime: IRaceTime,
    raceState: RaceState,
    now: number,
    dispatchDelay: number,
  ): void {
    const isTicking =
      raceState === RaceState.STARTING ||
      raceState === RaceState.RACING ||
      (raceTime.autoStartRemaining ?? 0) > 0 ||
      (raceTime.autoAdvanceRemaining ?? 0) > 0;

    if (isTicking && this.lastRaceTimeReceivedAt > 0) {
      const isHydrationGracePeriod =
        this.raceSubscriptionStartedAt > 0 &&
        now - this.raceSubscriptionStartedAt < 3000;
      const gap = Math.round(now - this.lastRaceTimeReceivedAt);
      if (gap > 450 && !isHydrationGracePeriod) {
        const delayInfo =
          dispatchDelay >= 0
            ? `, browser dispatch delay: ${dispatchDelay}ms`
            : "";
        this.logger.warn(
          `[PERF] RaceTime WebSocket interval lag: ${gap}ms (expected ~100ms${delayInfo})`,
        );
      }
    }
    this.lastRaceTimeReceivedAt = isTicking ? now : 0;
    this.raceTimeSubject.next(raceTime);
  }

  public dispatchTelemetryUpdates(raceData: RaceData): void {
    if (raceData.standingsUpdate) {
      this.standingsSubject.next(raceData.standingsUpdate);
    }
    if (raceData.overallStandingsUpdate) {
      this.overallStandingsSubject.next(raceData.overallStandingsUpdate);
    }
    if (raceData.groupStandingsUpdate) {
      this.groupStandingsSubject.next(raceData.groupStandingsUpdate);
    }
    if (raceData.lap) {
      this.lapSubject.next(raceData.lap);
    }
    if (raceData.carData) {
      this.carDataSubject.next(raceData.carData);
    }
    if (raceData.segment) {
      this.segmentSubject.next(raceData.segment);
    }
    if (raceData.flag) {
      this.logger.debug("WS: Received RaceFlag", raceData.flag);
      this.flagSubject.next(raceData.flag);
    }
    if (raceData.recordData) {
      this.recordDataSubject.next(raceData.recordData);
    }
    if (raceData.heat) {
      this.logger.debug("WS: Received Heat", raceData.heat);
      this.heatSubject.next(raceData.heat);
    }
    if (raceData.systemState) {
      this.systemStateSubject.next(raceData.systemState as SystemState);
    }
  }

  public connectToRaceDataSocket() {
    if (
      this.raceDataSocket &&
      (this.raceDataSocket.readyState === WebSocket.OPEN ||
        this.raceDataSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isRaceDataSocketExplicitlyDisconnected = false;

    if (this.raceDataSocket) {
      try {
        this.raceDataSocket.close();
      } catch (e) {}
    }

    const { serverIp, serverPort, wsProtocol } = this.getServerInfo();
    const wsUrl = `${wsProtocol}://${serverIp}:${serverPort}/api/race-data`;
    this.logger.debug(`Connecting to Race WebSocket: ${wsUrl}`);
    this.raceDataSocket = new WebSocket(wsUrl);
    this.raceDataSocket.binaryType = "arraybuffer";

    this.raceDataSocket.onopen = () => {
      this.logger.info("Connected to Race WebSocket");
      this.socketConnectedSubject.next(true);
      if (this.shouldSubscribeToRaceData) {
        (this.delegate || this).sendRaceSubscriptionRequest(true);
      }
    };

    this.raceDataSocket.onmessage = (event) => {
      this.handleRaceDataMessage(event);
    };

    this.raceDataSocket.onerror = (error) => {
      this.logger.error("Race WebSocket error", error);
    };

    this.raceDataSocket.onclose = () => {
      this.logger.info("Race WebSocket closed");
      this.raceDataSocket = undefined;
      this.socketConnectedSubject.next(false);
      if (!this.isRaceDataSocketExplicitlyDisconnected) {
        setTimeout(() => {
          if (!this.isRaceDataSocketExplicitlyDisconnected) {
            this.connectToRaceDataSocket();
          }
        }, 2000);
      }
    };
  }

  public connectToInterfaceDataSocket() {
    if (
      this.interfaceDataSocket &&
      (this.interfaceDataSocket.readyState === WebSocket.OPEN ||
        this.interfaceDataSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isInterfaceSocketExplicitlyDisconnected = false;

    if (this.interfaceDataSocket) {
      try {
        this.interfaceDataSocket.close();
      } catch (e) {}
    }

    const { serverIp, serverPort, wsProtocol } = this.getServerInfo();
    const wsUrl = `${wsProtocol}://${serverIp}:${serverPort}/api/interface-data`;
    this.logger.debug(`Connecting to Interface WebSocket: ${wsUrl}`);
    this.interfaceDataSocket = new WebSocket(wsUrl);
    this.interfaceDataSocket.binaryType = "arraybuffer";

    this.interfaceDataSocket.onopen = () => {
      this.logger.info("Connected to Interface WebSocket");
    };

    this.interfaceDataSocket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const data = event.data;
          let uint8Array: Uint8Array;

          if (data instanceof ArrayBuffer) {
            uint8Array = new Uint8Array(data);
          } else if (typeof data === "string") {
            try {
              const trimmed = data.trim().replace(/^"|"$/g, "");
              const binaryString = atob(trimmed);
              uint8Array = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
              }
            } catch (e) {
              this.logger.error(
                "Failed to decode Base64 WebSocket message. Data was:",
                data,
                e,
              );
              return;
            }
          } else {
            this.logger.warn(
              "Received unknown data type from Interface WebSocket",
              typeof data,
            );
            return;
          }

          const msg = InterfaceEvent.decode(Reader.create(uint8Array));
          this.interfaceEventSubject.next(msg);
        } catch (e) {
          this.logger.error("Error decoding Interface WebSocket message", e);
        }
      });
    };

    this.interfaceDataSocket.onerror = (error) => {
      this.logger.error("Interface WebSocket error", error);
    };

    this.interfaceDataSocket.onclose = () => {
      this.logger.info("Interface WebSocket closed");
      this.interfaceDataSocket = undefined;
      if (!this.isInterfaceSocketExplicitlyDisconnected) {
        this.logger.info("Reconnecting Interface WebSocket in 2 seconds...");
        setTimeout(() => {
          if (!this.isInterfaceSocketExplicitlyDisconnected) {
            this.connectToInterfaceDataSocket();
          }
        }, 2000);
      }
    };
  }

  public disconnectFromInterfaceDataSocket() {
    this.isInterfaceSocketExplicitlyDisconnected = true;
    if (this.interfaceDataSocket) {
      this.interfaceDataSocket.close();
      this.interfaceDataSocket = undefined;
    }
  }

  public disconnectFromRaceDataSocket() {
    this.isRaceDataSocketExplicitlyDisconnected = true;
    if (this.raceDataSocket) {
      this.raceDataSocket.close();
      this.raceDataSocket = undefined;
      this.socketConnectedSubject.next(false);
    }
  }

  public disconnectAllSockets() {
    this.disconnectFromInterfaceDataSocket();
    this.disconnectFromRaceDataSocket();
  }

  public getRaceTime(): Observable<IRaceTime> {
    return this.raceTimeSubject.asObservable();
  }
  public getLaps(): Observable<ILap> {
    return this.lapSubject.asObservable();
  }
  public getStandingsUpdate(): Observable<IStandingsUpdate> {
    return this.standingsSubject.asObservable();
  }
  public getOverallStandingsUpdate(): Observable<IOverallStandingsUpdate> {
    return this.overallStandingsSubject.asObservable();
  }
  public getGroupStandingsUpdate(): Observable<IGroupStandingsUpdate> {
    return this.groupStandingsSubject.asObservable();
  }
  public getRaceUpdate(): Observable<IRace> {
    return this.raceUpdateSubject.asObservable();
  }
  public getInterfaceEvents(): Observable<IInterfaceEvent> {
    return this.interfaceEventSubject.asObservable();
  }
  public getRaceState(): Observable<RaceState> {
    return this.raceStateSubject.asObservable();
  }
  public getRaceFlag(): Observable<RaceFlag> {
    return this.flagSubject.asObservable();
  }
  public getCarData(): Observable<ICarData> {
    return this.carDataSubject.asObservable();
  }
  public getSegments(): Observable<ISegment> {
    return this.segmentSubject.asObservable();
  }
  public getRecordData(): Observable<IRecordData> {
    return this.recordDataSubject.asObservable();
  }
  public getHeats(): Observable<IHeat> {
    return this.heatSubject.asObservable();
  }
  public getSystemState(): Observable<SystemState | null> {
    return this.systemStateSubject.asObservable();
  }
  public getSystemStateValue(): SystemState | null {
    return this.systemStateSubject.value;
  }
}
