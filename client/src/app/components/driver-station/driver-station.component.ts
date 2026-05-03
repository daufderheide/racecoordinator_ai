import { DecimalPipe } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { createTTSContext, playSound } from "@app/utils/audio";

@Component({
  standalone: true,
  selector: "app-driver-station",
  templateUrl: "./driver-station.component.html",
  styleUrls: ["./driver-station.component.css"],
  imports: [DecimalPipe, TranslatePipe],
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
  protected overallPosition: number = 0;
  protected raceState: RaceState = RaceState.UNKNOWN_STATE;
  protected hasRacedInCurrentHeat: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private raceService: RaceService,
    private raceConnectionService: RaceConnectionService,
    private raceFlagService: RaceFlagService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.laneIndex = +params["lane"] - 1;
      this.loadRaceData();
    });

    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.loadRaceData();
        this.hasRacedInCurrentHeat = false;
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceTime$.subscribe((raceTime) => {
        this.time = raceTime.time || 0;
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe((lap) => {
        if (this.heat && lap && lap.objectId) {
          const driverData = this.heat.heatDrivers.find(
            (d) => d.objectId === lap.objectId,
          );
          if (
            driverData &&
            this.driverData &&
            this.driverData.objectId === lap.objectId
          ) {
            const driver = driverData.driver;
            const isBestLap = lap.lapTime === lap.bestLapTime;
            const ttsContext = createTTSContext(driver, driverData);

            if (
              isBestLap &&
              (driver.bestLapAudio.url ||
                (driver.bestLapAudio.type === "tts" &&
                  driver.bestLapAudio.text))
            ) {
              playSound(
                driver.bestLapAudio.type,
                driver.bestLapAudio.url,
                driver.bestLapAudio.text,
                this.dataService.serverUrl,
                ttsContext,
                this.logger,
              );
            } else if (
              driver.lapAudio.url ||
              (driver.lapAudio.type === "tts" && driver.lapAudio.text)
            ) {
              playSound(
                driver.lapAudio.type,
                driver.lapAudio.url,
                driver.lapAudio.text,
                this.dataService.serverUrl,
                ttsContext,
                this.logger,
              );
            }
          }
        }
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        if (state) {
          this.raceState = state;
          if (state === RaceState.RACING) {
            this.hasRacedInCurrentHeat = true;
          }
          this.cdr.detectChanges();
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.carData$.subscribe((_carData) => {
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.standingsUpdate$.subscribe((update) => {
        if (this.heat && update && update.updates) {
          update.updates.forEach((u) => {
            const teamId = this.driverData?.participant?.team?.entity_id;
            const isMatch =
              u.objectId === this.driverData?.objectId ||
              (teamId && u.objectId === teamId);
            if (isMatch) {
              this.standingsPosition = u.rank || 0;
            }
          });
          this.cdr.detectChanges();
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        if (participants && this.driverData) {
          this.calculateOverallPosition();
        }
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.raceFlag$.subscribe(() => {
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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
          const teamEntityId = this.driverData.participant?.team?.entity_id;
          const index = this.heat.standings.findIndex(
            (id) =>
              id === this.driverData?.objectId ||
              (teamEntityId && id === teamEntityId),
          );
          if (index >= 0) {
            this.standingsPosition = index + 1;
          }
        }

        // Calculate overall position immediately if participants available
        this.calculateOverallPosition();
      }
    }
  }

  private calculateOverallPosition(): void {
    const participants = this.raceService.getParticipants();
    if (participants && this.driverData) {
      const teamEntityId = this.driverData.participant?.team?.entity_id;
      const driverEntityId =
        this.driverData.actualDriver?.entity_id ||
        this.driverData.participant.driver?.entity_id;

      const index = participants.findIndex((p: any) => {
        if (teamEntityId && p.team?.entity_id === teamEntityId) {
          return true;
        }
        return p.driver?.entity_id === driverEntityId;
      });

      if (index >= 0) {
        this.overallPosition = index + 1;
      } else {
        this.overallPosition = 0;
      }
      this.cdr.detectChanges();
    }
  }

  get isFuelRace(): boolean {
    return (
      this.race?.fuel_options?.enabled ||
      this.race?.digital_fuel_options?.enabled ||
      false
    );
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
      // Show elapsed time - starts empty and fills up
      return Math.min(100, (this.time / this.finishValue) * 100);
    } else {
      // Lap based - starts empty and fills up as laps complete
      const laps = this.driverData?.lapCount || 0;
      return Math.min(100, (laps / this.finishValue) * 100);
    }
  }

  get fuelPercentage(): number {
    return this.driverData?.participant?.fuelLevel || 0;
  }

  get lane(): import("src/app/models/lane").Lane | undefined {
    return this.track?.lanes[this.laneIndex];
  }

  get foregroundColor(): string {
    return this.lane?.foreground_color || "#000000";
  }

  get raceStateColor(): string {
    return this.raceFlagService.getFlagColor();
  }

  get backgroundColor(): string {
    return this.lane?.background_color || "#ffffff";
  }
}
