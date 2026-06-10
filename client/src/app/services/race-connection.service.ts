import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { DriverConverter } from "@app/converters/driver.converter";
import { HeatConverter } from "@app/converters/heat.converter";
import { LaneConverter } from "@app/converters/lane.converter";
import { RaceConverter } from "@app/converters/race.converter";
import { RaceParticipantConverter } from "@app/converters/race_participant.converter";
import { TeamConverter } from "@app/converters/team.converter";
import { TrackConverter } from "@app/converters/track.converter";
import { DataService } from "@app/data.service";
import {
  ICarData,
  IGroupStandingsUpdate,
  IInterfaceEvent,
  ILap,
  InterfaceStatus,
  IOverallStandingsUpdate,
  IRace,
  IRaceTime,
  IRecordData,
  ISegment,
  IStandingsUpdate,
  LapType,
  RaceFlag,
  RaceState,
} from "@app/proto/antigravity";

export interface IReactionTime {
  objectId?: string | null;
  reactionTime?: number | null;
  interfaceId?: number | null;
}

import { LoggerService } from "./logger.service";
import { RaceService } from "./race.service";

@Injectable({
  providedIn: "root",
})
export class RaceConnectionService implements OnDestroy {
  private connectionCount = 0;
  private subscriptions: Subscription[] = [];
  private isDestroyed = false;
  private isConnected = false;

  // Subjects for side effects
  private lapSubject = new Subject<ILap>();
  laps$ = this.lapSubject.asObservable();

  private reactionTimeSubject = new Subject<IReactionTime>();
  reactionTimes$ = this.reactionTimeSubject.asObservable();

  private standingsSubject = new Subject<IStandingsUpdate>();
  standingsUpdate$ = this.standingsSubject.asObservable();

  private overallStandingsSubject = new Subject<IOverallStandingsUpdate>();
  overallStandingsUpdate$ = this.overallStandingsSubject.asObservable();

  private groupStandingsSubject = new Subject<IGroupStandingsUpdate>();
  groupStandingsUpdate$ = this.groupStandingsSubject.asObservable();

  private interfaceEventSubject = new Subject<IInterfaceEvent>();
  interfaceEvents$ = this.interfaceEventSubject.asObservable();

  private carDataSubject = new Subject<ICarData>();
  carData$ = this.carDataSubject.asObservable();

  private segmentSubject = new Subject<ISegment>();
  segments$ = this.segmentSubject.asObservable();

  private raceTimeSubject = new BehaviorSubject<IRaceTime>({
    time: 0,
  });
  raceTime$ = this.raceTimeSubject.asObservable();

  private raceStateSubject = new BehaviorSubject<RaceState>(
    RaceState.UNKNOWN_STATE,
  );
  raceState$ = this.raceStateSubject.asObservable();

  private raceFlagSubject = new BehaviorSubject<RaceFlag>(
    RaceFlag.UNKNOWN_FLAG,
  );
  raceFlag$ = this.raceFlagSubject.asObservable();

  private recordDataSubject = new BehaviorSubject<IRecordData | null>(null);
  recordData$ = this.recordDataSubject.asObservable();

  // Watchdog variables
  private noStatusWatchdog: any;
  private disconnectedTimeout: any;
  private lastInterfaceStatus: InterfaceStatus | number = -1;
  private hasInitiallyConnected = false;

  // State
  private isRaceEnded = false;
  public isInterfaceConnected = false;
  public driverRankings = new Map<string, number>();

  private driversLoaded = false;
  private pendingUpdate: IRace | null = null;
  private driverSubscription?: Subscription;

  // Test hook or configuration
  private get WATCHDOG_TIMEOUT(): number {
    return (window as any).WATCHDOG_TIMEOUT || 5000;
  }

  constructor(
    private dataService: DataService,
    private raceService: RaceService,
    private logger: LoggerService,
  ) {}

  connect() {
    if (this.disconnectedTimeout) {
      this.logger.debug(
        "RaceConnectionService: Cancelling pending disconnection",
      );
      clearTimeout(this.disconnectedTimeout);
      this.disconnectedTimeout = null;
    }
    this.connectionCount++;
    this.logger.debug(
      `RaceConnectionService: Connection count incremented to ${this.connectionCount}`,
    );
    if (!this.isConnected) {
      this.startConnection();
    } else {
      // Even if already connected, ensure the new component gets a fresh race update
      this.dataService.updateRaceSubscription(true);
    }
  }

  disconnect() {
    this.connectionCount--;
    this.logger.debug(
      `RaceConnectionService: Connection count decremented to ${this.connectionCount}`,
    );
    if (this.connectionCount <= 0) {
      this.connectionCount = 0;
      // Delay actual disconnection to handle fast component transitions (e.g. Raceday to Manager)
      if (this.disconnectedTimeout) clearTimeout(this.disconnectedTimeout);
      this.disconnectedTimeout = setTimeout(() => {
        if (this.connectionCount === 0) {
          this.logger.debug(
            "RaceConnectionService: Disconnecting after grace period",
          );
          this.stopConnection();
        }
        this.disconnectedTimeout = null;
      }, 2000);
    }
  }

  /* eslint-disable max-lines-per-function */
  private startConnection() {
    this.isConnected = true;
    // Clear caches to ensure fresh data for new race (mirrors DefaultRacedayComponent)
    RaceConverter.clearCache();
    DriverConverter.clearCache();
    HeatConverter.clearCache();
    TrackConverter.clearCache();
    LaneConverter.clearCache();
    RaceParticipantConverter.clearCache();
    TeamConverter.clearCache();

    this.raceService.clear();

    this.driversLoaded = false;
    this.pendingUpdate = null;
    this.hasInitiallyConnected = false;
    this.lastInterfaceStatus = -1;
    this.isRaceEnded = false;
    this.dataService.updateRaceSubscription(true);

    this.subscriptions.push(
      this.dataService.getSystemState().subscribe((state) => {
        if (state) {
          if (state.resourceLockState === "IDLE") {
            this.isRaceEnded = true;
            if (this.noStatusWatchdog) {
              clearTimeout(this.noStatusWatchdog);
              this.noStatusWatchdog = null;
            }
            this.clearDisconnectedError();
          } else if (state.resourceLockState === "RACE_RUNNING") {
            if (this.isRaceEnded) {
              this.isRaceEnded = false;
              this.resetWatchdog();
            }
          }
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.socketConnected$.subscribe((connected) => {
        if (connected) {
          this.logger.info(
            "RaceConnectionService: Socket connected, hydrating drivers...",
          );
          this.hydrateDrivers();
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.getRaceUpdate().subscribe((update) => {
        if (this.driversLoaded) {
          this.processRaceUpdate(update);
        } else {
          this.pendingUpdate = update;
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.getRaceTime().subscribe((raceTime) => {
        this.raceTimeSubject.next(raceTime);
      }),
    );

    this.subscriptions.push(
      this.dataService.getLaps().subscribe((lap) => {
        const heat = this.raceService.getCurrentHeat();
        if (heat && heat.heatDrivers && lap && lap.objectId) {
          const driverData = heat.heatDrivers.find(
            (d) => d.objectId === lap.objectId,
          );
          if (driverData) {
            if (lap.type === LapType.REACTION_TIME) {
              driverData.reactionTime = lap.lapTime!;
              this.reactionTimeSubject.next({
                objectId: lap.objectId,
                reactionTime: lap.lapTime,
                interfaceId: lap.interfaceId,
              });
            } else if (lap.type === LapType.MIN_LAP_TIME) {
              this.logger.debug(
                `Lap on lane ${driverData.laneIndex} was below min lap time: ${lap.lapTime}`,
              );
              this.lapSubject.next(lap);
            } else {
              const segmentsCopy = [...(driverData.currentLapSegments || [])];
              driverData.addLapTime(
                lap.lapNumber!,
                lap.lapTime!,
                lap.averageLapTime!,
                lap.medianLapTime!,
                lap.bestLapTime!,
                lap.adjustedLapCount!,
                lap.driverId!,
                lap.isDrift!,
                lap.type!,
                segmentsCopy,
              );
              if (lap.flag !== undefined && lap.flag !== null) {
                driverData.flag = lap.flag;
              }
              this.lapSubject.next(lap);
            }
          }
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.getCarData().subscribe((carData) => {
        const heat = this.raceService.getCurrentHeat();
        if (heat && heat.heatDrivers && carData && carData.lane != null) {
          const driverData = heat.heatDrivers[carData.lane];
          if (driverData) {
            if (carData.fuelLevel != null) {
              driverData.participant.fuelLevel = carData.fuelLevel as number;
            }
            if (carData.flag !== undefined && carData.flag !== null) {
              driverData.flag = carData.flag;
            }
            this.carDataSubject.next(carData);
          }
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.getSegments().subscribe((segment) => {
        const heat = this.raceService.getCurrentHeat();
        if (heat && heat.heatDrivers && segment && segment.objectId) {
          const driverData = heat.heatDrivers.find(
            (d) => d.objectId === segment.objectId,
          );
          if (driverData) {
            const segmentIndex = (segment.segmentNumber || 1) - 1;
            driverData.addSegmentTime(segmentIndex, segment.segmentTime!);
            this.segmentSubject.next(segment);
          }
        }
      }),
    );

    this.subscriptions.push(
      this.dataService.getStandingsUpdate().subscribe((update) => {
        const heat = this.raceService.getCurrentHeat();
        this.applyStandingsUpdate(update, heat);
        this.standingsSubject.next(update);
      }),
    );

    this.subscriptions.push(
      this.dataService.getOverallStandingsUpdate().subscribe((update) => {
        if (update && update.participants) {
          const participants = update.participants.map((p: any) =>
            RaceParticipantConverter.fromProto(p),
          );
          this.raceService.setParticipants(participants);
          this.overallStandingsSubject.next(update);
        }
      }),
    );

    if (this.dataService.getGroupStandingsUpdate) {
      this.subscriptions.push(
        this.dataService.getGroupStandingsUpdate().subscribe((update) => {
          if (update && update.participants) {
            const participants = update.participants.map((p: any) =>
              RaceParticipantConverter.fromProto(p),
            );
            this.raceService.setGroupParticipants(
              participants,
              update.group || 0,
            );
            this.groupStandingsSubject.next(update);
          }
        }),
      );
    }

    this.subscriptions.push(
      this.dataService.getInterfaceEvents().subscribe((event) => {
        this.handleInterfaceEvent(event);
        this.interfaceEventSubject.next(event);
      }),
    );

    this.subscriptions.push(
      this.dataService.getRaceState().subscribe((state) => {
        this.raceStateSubject.next(state);
      }),
    );

    this.subscriptions.push(
      this.dataService.getRaceFlag().subscribe((flag) => {
        this.raceFlagSubject.next(flag);
      }),
    );

    this.subscriptions.push(
      this.dataService.getRecordData().subscribe((records) => {
        this.recordDataSubject.next(records);
      }),
    );
    this.subscriptions.push(
      this.dataService.getHeats().subscribe((heatProto) => {
        const heat = HeatConverter.fromProto(heatProto);
        this.raceService.setCurrentHeat(heat);
      }),
    );

    this.dataService.connectToInterfaceDataSocket();
    this.resetWatchdog();
  }

  private stopConnection() {
    this.isConnected = false;
    this.dataService.updateRaceSubscription(false);
    this.dataService.disconnectFromInterfaceDataSocket();

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.driversLoaded = false;
    this.pendingUpdate = null;

    this.raceService.clear();

    if (this.noStatusWatchdog) clearTimeout(this.noStatusWatchdog);
    this.clearDisconnectedError();
  }

  private hydrateDrivers() {
    if (this.driverSubscription) {
      this.driverSubscription.unsubscribe();
      this.subscriptions = this.subscriptions.filter(
        (s) => s !== this.driverSubscription,
      );
    }
    this.driverSubscription = this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        drivers.forEach((d) => {
          const driver = DriverConverter.fromJSON(d);
          DriverConverter.register(driver);
        });
        this.driversLoaded = true;
        if (this.pendingUpdate) {
          this.processRaceUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      },
      error: (_err) => {
        this.driversLoaded = true;
        if (this.pendingUpdate) {
          this.processRaceUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      },
    });
    this.subscriptions.push(this.driverSubscription);
  }

  private processRaceUpdate(update: IRace) {
    this.logger.debug(
      "RaceConnectionService: processRaceUpdate called with:",
      update,
    );
    if (update.race) {
      const race = RaceConverter.fromProto(update.race);
      this.raceService.setRace(race);
    }

    if (update.drivers && update.drivers.length > 0) {
      const participants = update.drivers.map((d: any) =>
        RaceParticipantConverter.fromProto(d),
      );
      this.raceService.setParticipants(participants);
    }

    if (update.heats && update.heats.length > 0) {
      const heats = update.heats.map((h: any, index: number) =>
        HeatConverter.fromProto(h, index + 1),
      );
      this.raceService.setHeats(heats);
    }

    if (update.currentHeat) {
      const currentHeat = HeatConverter.fromProto(update.currentHeat);
      this.raceService.setCurrentHeat(currentHeat);
    }

    if (update.recordData) {
      this.recordDataSubject.next(update.recordData);
    }

    // Gaps updating after race update might be needed, or it's handled by StandingsUpdate
  }

  private applyStandingsUpdate(update: IStandingsUpdate, heat: any) {
    if (heat && update && update.updates) {
      update.updates.forEach((u: any) => {
        if (u.objectId) {
          this.driverRankings.set(u.objectId, u.rank || 0);
          const driverData = heat.heatDrivers.find(
            (d: any) => d.objectId === u.objectId,
          );
          if (driverData) {
            driverData.gapLeader = u.gapLeader || 0;
            driverData.gapPosition = u.gapPosition || 0;
          }
        }
      });
    }
  }

  private interfaceAlertSubject = new Subject<{
    titleKey: string;
    messageKey: string;
  }>();
  interfaceAlert$ = this.interfaceAlertSubject.asObservable();

  // ... inside starting connection ...

  private handleInterfaceEvent(event: IInterfaceEvent) {
    if (this.isRaceEnded) {
      return;
    }
    if (event.status) {
      const status = event.status.status;
      if (status === this.lastInterfaceStatus) {
        if (
          status !== InterfaceStatus.DISCONNECTED &&
          status !== InterfaceStatus.NO_DATA
        ) {
          this.resetWatchdog();
        }
        return;
      }

      this.resetWatchdog();
      this.lastInterfaceStatus = status ?? -1;
      this.isInterfaceConnected = status === InterfaceStatus.CONNECTED;

      if (status === InterfaceStatus.NO_DATA) {
        if (!this.hasInitiallyConnected) {
          this.scheduleDisconnectedError(
            "ACK_MODAL_TITLE_NO_DATA",
            "ACK_MODAL_MSG_NO_DATA",
          );
        } else {
          this.emitAlert("ACK_MODAL_TITLE_NO_DATA", "ACK_MODAL_MSG_NO_DATA");
        }
      } else if (status === InterfaceStatus.DISCONNECTED) {
        this.scheduleDisconnectedError(
          "ACK_MODAL_TITLE_DISCONNECTED",
          "ACK_MODAL_MSG_DISCONNECTED",
        );
      } else if (status === InterfaceStatus.CONNECTED) {
        this.clearDisconnectedError();
        if (this.hasInitiallyConnected) {
          this.emitAlert(
            "ACK_MODAL_TITLE_CONNECTED",
            "ACK_MODAL_MSG_CONNECTED",
          );
        }
        this.hasInitiallyConnected = true;
      }
    }
  }

  private resetWatchdog() {
    if (this.noStatusWatchdog) clearTimeout(this.noStatusWatchdog);
    if (this.isRaceEnded) {
      this.noStatusWatchdog = null;
      return;
    }
    this.noStatusWatchdog = setTimeout(() => {
      this.lastInterfaceStatus = -1;
      if (!this.hasInitiallyConnected) {
        this.emitAlert(
          "ACK_MODAL_TITLE_DISCONNECTED",
          "ACK_MODAL_MSG_DISCONNECTED",
        );
      } else {
        this.emitAlert("ACK_MODAL_TITLE_NO_STATUS", "ACK_MODAL_MSG_NO_STATUS");
      }
    }, this.WATCHDOG_TIMEOUT);
  }

  private emitAlert(titleKey: string, messageKey: string) {
    this.interfaceAlertSubject.next({ titleKey, messageKey });
  }

  private scheduleDisconnectedError(titleKey: string, messageKey: string) {
    if (this.isRaceEnded) {
      return;
    }
    if (this.noStatusWatchdog) {
      clearTimeout(this.noStatusWatchdog);
      this.noStatusWatchdog = null;
    }
    if (this.disconnectedTimeout) return;

    this.disconnectedTimeout = setTimeout(() => {
      this.emitAlert(titleKey, messageKey);
    }, this.WATCHDOG_TIMEOUT);
  }

  private clearDisconnectedError() {
    if (this.disconnectedTimeout) {
      clearTimeout(this.disconnectedTimeout);
      this.disconnectedTimeout = null;
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.stopConnection();
  }
}
