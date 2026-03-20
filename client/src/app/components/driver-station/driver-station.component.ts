import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { DriverHeatData } from 'src/app/race/driver_heat_data';
import { Race } from 'src/app/models/race';
import { Track } from 'src/app/models/track';
import { Heat } from 'src/app/race/heat';
import { FinishMethod } from 'src/app/models/heat_scoring';
import { com } from 'src/app/proto/message';
import { RaceConverter } from 'src/app/converters/race.converter';
import { DriverConverter } from 'src/app/converters/driver.converter';
import { HeatConverter } from 'src/app/converters/heat.converter';
import { TrackConverter } from 'src/app/converters/track.converter';
import { LaneConverter } from 'src/app/converters/lane.converter';
import { RaceParticipantConverter } from 'src/app/converters/race_participant.converter';
import { playSound, createTTSContext } from 'src/app/utils/audio';

@Component({
  selector: 'app-driver-station',
  templateUrl: './driver-station.component.html',
  styleUrls: ['./driver-station.component.css'],
  standalone: false
})
export class DriverStationComponent implements OnInit, OnDestroy {
  // ... existing code ...
  private subscriptions: Subscription[] = [];
  protected laneIndex: number = 0;
  protected driverData?: DriverHeatData;
  protected race?: Race;
  protected track?: Track;
  protected heat?: Heat;
  protected time: number = 0;
  protected standingsPosition: number = 0;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private raceService: RaceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.laneIndex = +params['lane'];
      this.loadRaceData();
    });

    // Subscriptions similar to DefaultRacedayComponent
    this.dataService.updateRaceSubscription(true);

    this.subscriptions.push(this.dataService.getRaceUpdate().subscribe(update => {
      this.processRaceUpdate(update);
    }));

    this.subscriptions.push(this.dataService.getRaceTime().subscribe(time => {
      this.time = time;
      this.cdr.detectChanges();
    }));

    this.subscriptions.push(this.dataService.getLaps().subscribe(lap => {
      if (this.heat && lap && lap.objectId) {
        const driverData = this.heat.heatDrivers.find(d => d.objectId === lap.objectId);
        if (driverData) {
          driverData.addLapTime(lap.lapNumber!, lap.lapTime!, lap.averageLapTime!, lap.medianLapTime!, lap.bestLapTime!);
          this.cdr.detectChanges();

          // Audio Feedback (Only for this driver station's lane)
          if (this.driverData && this.driverData.objectId === lap.objectId) {
            const driver = driverData.driver;
            const isBestLap = lap.lapTime === lap.bestLapTime;
            const ttsContext = createTTSContext(driver, driverData);

            if (isBestLap && (driver.bestLapAudio.url || (driver.bestLapAudio.type === 'tts' && driver.bestLapAudio.text))) {
              playSound(driver.bestLapAudio.type, driver.bestLapAudio.url, driver.bestLapAudio.text, this.dataService.serverUrl, ttsContext);
            } else if (driver.lapAudio.url || (driver.lapAudio.type === 'tts' && driver.lapAudio.text)) {
              playSound(driver.lapAudio.type, driver.lapAudio.url, driver.lapAudio.text, this.dataService.serverUrl, ttsContext);
            }
          }
        }
      }
    }));


    this.subscriptions.push(this.dataService.getCarData().subscribe(carData => {
      if (this.heat && this.heat.heatDrivers && carData && carData.lane != null) {
        const driverData = this.heat.heatDrivers[carData.lane];
        if (driverData && carData.fuelLevel != null) {
          driverData.participant.fuelLevel = carData.fuelLevel as number;
          this.cdr.detectChanges();
        }
      }
    }));

    this.subscriptions.push(this.dataService.getStandingsUpdate().subscribe(update => {
      if (this.heat && update && update.updates) {
        update.updates.forEach(u => {
          if (u.objectId) {
            const driverData = this.heat!.heatDrivers.find(d => d.objectId === u.objectId);
            if (driverData) {
              driverData.gapLeader = u.gapLeader || 0;
              driverData.gapPosition = u.gapPosition || 0;
              
              if (u.objectId === this.driverData?.objectId) {
                this.standingsPosition = u.rank || 0;
              }
            }
          }
        });
        this.cdr.detectChanges();
      }
    }));

    // Test hook for screendiff tests
    (window as any).mockRaceData = (data: any) => {
      if (data && data.race) {
        this.processRaceUpdate(data.race);
      }
    };

    this.dataService.connectToInterfaceDataSocket();

  }

  ngOnDestroy() {
    this.dataService.updateRaceSubscription(false);
    this.dataService.disconnectFromInterfaceDataSocket();
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

    if (raceDataChanged) {
      this.loadRaceData();
      this.cdr.detectChanges();
    }
  }

  private loadRaceData() {
    this.race = this.raceService.getRace();
    if (this.race) {
      this.track = this.race.track;
      this.heat = this.raceService.getCurrentHeat();
      if (this.heat) {
        this.driverData = this.heat.heatDrivers[this.laneIndex];
        
        // Update standings position from heat standings if available
        if (this.driverData && this.heat.standings) {
             const index = this.heat.standings.indexOf(this.driverData.objectId);
             if (index >= 0) {
                 this.standingsPosition = index + 1;
             }
        }
      }
    }
  }

  get isFuelRace(): boolean {
    return this.race?.fuel_options?.enabled || this.race?.digital_fuel_options?.enabled || false;
  }

  get finishMethod(): FinishMethod {
    return this.race?.heat_scoring?.finishMethod || FinishMethod.Lap;
  }

  get finishValue(): number {
    return this.race?.heat_scoring?.finishValue || 0;
  }

  get progressPercentage(): number {
    if (!this.finishValue) return 0;
    
    if (this.finishMethod === FinishMethod.Timed) {
      // For Timed, how much time is left / total time
      // Wait, prompt says "indicates how much time is left"
      // Thermometer usually fills UP. Or shows remaining.
      // If we want to show "how much time left", filled could mean MAX time left, and it empties.
      // Or filled means time ELAPSED (like regular view).
      // Prompt says "indicates how much time is left".
      // Let's assume full = max time left, and it goes down, or empty to full to match other themes.
      // Usually a progress bar for "time left" would be full at start and decrease, or filled for elapsed.
      // Let's assume filled = percentage of completion (e.g. time elapsed).
      // But prompt says "how much time is left".
      // Let's look at how DefaultRacedayComponent does it or just make it intuitive.
      // I will calculate percentage as: (current / max) for filling up.
      // But if it's "how much time is left", maybe we show the value.
      // I'll calculate `current / max` and we can style it.
      return Math.min(100, (this.time / this.finishValue) * 100);
    } else {
      // Lap based
      const laps = this.driverData?.lapCount || 0;
      return Math.min(100, (laps / this.finishValue) * 100);
    }
  }

  get fuelPercentage(): number {
    return this.driverData?.participant?.fuelLevel || 0;
  }

  get lane(): import('src/app/models/lane').Lane | undefined {
    return this.track?.lanes[this.laneIndex];
  }

  get foregroundColor(): string {
    return this.lane?.foreground_color || '#000000';
  }

  get backgroundColor(): string {
    return this.lane?.background_color || '#ffffff';
  }
}
