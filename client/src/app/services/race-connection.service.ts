import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, Subject, BehaviorSubject, Observable } from 'rxjs';
import { DataService } from '../data.service';
import { RaceService } from './race.service';
import { com } from '../proto/message';
import { RaceConverter } from '../converters/race.converter';
import { DriverConverter } from '../converters/driver.converter';
import { HeatConverter } from '../converters/heat.converter';
import { RaceParticipantConverter } from '../converters/race_participant.converter';
import { TrackConverter } from '../converters/track.converter';
import { LaneConverter } from '../converters/lane.converter';


import InterfaceStatus = com.antigravity.InterfaceStatus;

@Injectable({
  providedIn: 'root'
})
export class RaceConnectionService implements OnDestroy {
  private connectionCount = 0;
  private subscriptions: Subscription[] = [];
  private isDestroyed = false;

  // Subjects for side effects
  private lapSubject = new Subject<com.antigravity.ILap>();
  laps$ = this.lapSubject.asObservable();

  private reactionTimeSubject = new Subject<com.antigravity.IReactionTime>();
  reactionTimes$ = this.reactionTimeSubject.asObservable();

  private standingsSubject = new Subject<com.antigravity.IStandingsUpdate>();
  standingsUpdate$ = this.standingsSubject.asObservable();

  private overallStandingsSubject = new Subject<com.antigravity.IOverallStandingsUpdate>();
  overallStandingsUpdate$ = this.overallStandingsSubject.asObservable();

  private interfaceEventSubject = new Subject<com.antigravity.IInterfaceEvent>();
  interfaceEvents$ = this.interfaceEventSubject.asObservable();

  private carDataSubject = new Subject<com.antigravity.ICarData>();
  carData$ = this.carDataSubject.asObservable();

  private segmentSubject = new Subject<com.antigravity.ISegment>();
  segments$ = this.segmentSubject.asObservable();

  private raceTimeSubject = new BehaviorSubject<com.antigravity.IRaceTime>({ time: 0 });
  raceTime$ = this.raceTimeSubject.asObservable();

  private raceStateSubject = new BehaviorSubject<com.antigravity.RaceState>(com.antigravity.RaceState.UNKNOWN_STATE);
  raceState$ = this.raceStateSubject.asObservable();

  // Watchdog variables
  private noStatusWatchdog: any;
  private disconnectedTimeout: any;
  private lastInterfaceStatus: InterfaceStatus | number = -1;
  private hasInitiallyConnected = false;

  // State
  public isInterfaceConnected = false;
  public driverRankings = new Map<string, number>();

  private driversLoaded = false;
  private pendingUpdate: com.antigravity.IRace | null = null;

  // Test hook or configuration
  private get WATCHDOG_TIMEOUT(): number {
    return (window as any).WATCHDOG_TIMEOUT || 5000;
  }

  constructor(
    private dataService: DataService,
    private raceService: RaceService
  ) {}

  connect() {
    this.connectionCount++;
    console.log(`RaceConnectionService: Connection count incremented to ${this.connectionCount}`);
    if (this.connectionCount === 1) {
      this.startConnection();
    }
  }

  disconnect() {
    this.connectionCount--;
    console.log(`RaceConnectionService: Connection count decremented to ${this.connectionCount}`);
    if (this.connectionCount <= 0) {
      this.connectionCount = 0;
      this.stopConnection();
    }
  }

  private startConnection() {
    console.log('RaceConnectionService: Starting connection...');
    
    // Clear caches to ensure fresh data for new race (mirrors DefaultRacedayComponent)
    RaceConverter.clearCache();
    DriverConverter.clearCache();
    HeatConverter.clearCache();
    TrackConverter.clearCache();
    LaneConverter.clearCache();


    this.hydrateDrivers();

    this.dataService.updateRaceSubscription(true);

    this.subscriptions.push(this.dataService.getRaceUpdate().subscribe(update => {
      if (this.driversLoaded) {
        this.processRaceUpdate(update);
      } else {
        console.log('RaceConnectionService: Deferring race update until drivers are hydrated.');
        this.pendingUpdate = update;
      }
    }));

    this.subscriptions.push(this.dataService.getRaceTime().subscribe(raceTime => {
      this.raceTimeSubject.next(raceTime);
    }));

    this.subscriptions.push(this.dataService.getLaps().subscribe(lap => {
      console.log('RaceConnectionService: Lap Received:', lap);
      const heat = this.raceService.getCurrentHeat();
      if (heat && heat.heatDrivers && lap && lap.objectId) {
        const driverData = heat.heatDrivers.find(d => d.objectId === lap.objectId);
        if (driverData) {
          driverData.addLapTime(lap.lapNumber!, lap.lapTime!, lap.averageLapTime!, lap.medianLapTime!, lap.bestLapTime!, lap.driverId!);
          this.lapSubject.next(lap);
        }
      }
    }));

    this.subscriptions.push(this.dataService.getCarData().subscribe(carData => {
      const heat = this.raceService.getCurrentHeat();
      if (heat && heat.heatDrivers && carData && carData.lane != null) {
        const driverData = heat.heatDrivers[carData.lane];
        if (driverData && carData.fuelLevel != null) {
          driverData.participant.fuelLevel = carData.fuelLevel as number;
          this.carDataSubject.next(carData);
        }
      }
    }));

    this.subscriptions.push(this.dataService.getSegments().subscribe(segment => {
      const heat = this.raceService.getCurrentHeat();
      if (heat && heat.heatDrivers && segment && segment.objectId) {
        const driverData = heat.heatDrivers.find(d => d.objectId === segment.objectId);
        if (driverData) {
          const segmentIndex = (segment.segmentNumber || 1) - 1;
          driverData.addSegmentTime(segmentIndex, segment.segmentTime!);
          this.segmentSubject.next(segment);
        }
      }
    }));

    this.subscriptions.push(this.dataService.getReactionTimes().subscribe(rt => {
      const heat = this.raceService.getCurrentHeat();
      if (heat && heat.heatDrivers && rt && rt.objectId) {
        const driver = heat.heatDrivers.find(d => d.objectId === rt.objectId);
        if (driver) {
          driver.reactionTime = rt.reactionTime!;
          this.reactionTimeSubject.next(rt);
        }
      }
    }));

    this.subscriptions.push(this.dataService.getStandingsUpdate().subscribe(update => {
      const heat = this.raceService.getCurrentHeat();
      this.applyStandingsUpdate(update, heat);
      this.standingsSubject.next(update);
    }));

    this.subscriptions.push(this.dataService.getOverallStandingsUpdate().subscribe(update => {
      if (update && update.participants) {
        const participants = update.participants.map(p => RaceParticipantConverter.fromProto(p));
        this.raceService.setParticipants(participants);
        this.overallStandingsSubject.next(update);
      }
    }));

    this.subscriptions.push(this.dataService.getInterfaceEvents().subscribe(event => {
      this.handleInterfaceEvent(event);
      this.interfaceEventSubject.next(event);
    }));

    this.subscriptions.push(this.dataService.getRaceState().subscribe(state => {
      this.raceStateSubject.next(state);
    }));

    this.dataService.connectToInterfaceDataSocket();
    this.resetWatchdog();
  }

  private stopConnection() {
    console.log('RaceConnectionService: Stopping connection...');
    this.dataService.updateRaceSubscription(false);
    this.dataService.disconnectFromInterfaceDataSocket();

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    if (this.noStatusWatchdog) clearTimeout(this.noStatusWatchdog);
    this.clearDisconnectedError();
  }

  private hydrateDrivers() {
    this.subscriptions.push(this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        console.log(`RaceConnectionService: Hydrating ${drivers.length} drivers into cache.`);
        drivers.forEach(d => {
          const driver = DriverConverter.fromJSON(d);
          DriverConverter.register(driver);
        });
        this.driversLoaded = true;
        if (this.pendingUpdate) {
          this.processRaceUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      },
      error: (err) => {
        console.error('RaceConnectionService: Failed to load drivers for hydration', err);
        this.driversLoaded = true;
        if (this.pendingUpdate) {
          this.processRaceUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      }
    }));
  }

  private processRaceUpdate(update: com.antigravity.IRace) {
    let raceDataChanged = false;

    if (update.race) {
      const race = RaceConverter.fromProto(update.race);
      this.raceService.setRace(race);
      raceDataChanged = true;
    }

    if (update.drivers && update.drivers.length > 0) {
      const participants = update.drivers.map(d => RaceParticipantConverter.fromProto(d));
      this.raceService.setParticipants(participants);
      raceDataChanged = true;
    }

    if (update.heats && update.heats.length > 0) {
      const heats = update.heats.map((h, index) => HeatConverter.fromProto(h, index + 1));
      this.raceService.setHeats(heats);
      raceDataChanged = true;
    }

    if (update.currentHeat) {
      const currentHeat = HeatConverter.fromProto(update.currentHeat);
      this.raceService.setCurrentHeat(currentHeat);
      raceDataChanged = true;
    }

    // Gaps updating after race update might be needed, or it's handled by StandingsUpdate
  }

  private applyStandingsUpdate(update: com.antigravity.IStandingsUpdate, heat: any) {
    if (heat && update && update.updates) {
      update.updates.forEach(u => {
        if (u.objectId) {
          this.driverRankings.set(u.objectId, u.rank || 0);
          const driverData = heat.heatDrivers.find((d: any) => d.objectId === u.objectId);
          if (driverData) {
            driverData.gapLeader = u.gapLeader || 0;
            driverData.gapPosition = u.gapPosition || 0;
          }
        }
      });
    }
  }

  private interfaceAlertSubject = new Subject<{titleKey: string, messageKey: string}>();
  interfaceAlert$ = this.interfaceAlertSubject.asObservable();

  // ... inside starting connection ...

  private handleInterfaceEvent(event: com.antigravity.IInterfaceEvent) {
    if (event.status) {
      const status = event.status.status;
      if (status === this.lastInterfaceStatus) {
        if (status !== InterfaceStatus.DISCONNECTED && status !== InterfaceStatus.NO_DATA) {
          this.resetWatchdog();
        }
        return;
      }

      this.resetWatchdog();
      this.lastInterfaceStatus = status ?? -1;
      this.isInterfaceConnected = status === InterfaceStatus.CONNECTED;

      if (status === InterfaceStatus.NO_DATA) {
        if (!this.hasInitiallyConnected) {
          this.scheduleDisconnectedError('ACK_MODAL_TITLE_NO_DATA', 'ACK_MODAL_MSG_NO_DATA');
        } else {
          this.emitAlert('ACK_MODAL_TITLE_NO_DATA', 'ACK_MODAL_MSG_NO_DATA');
        }
      } else if (status === InterfaceStatus.DISCONNECTED) {
        this.scheduleDisconnectedError('ACK_MODAL_TITLE_DISCONNECTED', 'ACK_MODAL_MSG_DISCONNECTED');
      } else if (status === InterfaceStatus.CONNECTED) {
        this.clearDisconnectedError();
        this.emitAlert('ACK_MODAL_TITLE_CONNECTED', 'ACK_MODAL_MSG_CONNECTED');
        this.hasInitiallyConnected = true;
      }
    }
  }

  private resetWatchdog() {
    if (this.noStatusWatchdog) clearTimeout(this.noStatusWatchdog);
    this.noStatusWatchdog = setTimeout(() => {
      this.lastInterfaceStatus = -1;
      if (!this.hasInitiallyConnected) {
        this.emitAlert('ACK_MODAL_TITLE_DISCONNECTED', 'ACK_MODAL_MSG_DISCONNECTED');
      } else {
        this.emitAlert('ACK_MODAL_TITLE_NO_STATUS', 'ACK_MODAL_MSG_NO_STATUS');
      }
    }, this.WATCHDOG_TIMEOUT);
  }

  private emitAlert(titleKey: string, messageKey: string) {
    this.interfaceAlertSubject.next({ titleKey, messageKey });
  }

  private scheduleDisconnectedError(titleKey: string, messageKey: string) {
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
