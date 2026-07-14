import { CommonModule, DecimalPipe } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import {
  HeatDriverExpanderComponent,
  HeatStandingsRow,
} from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import { DriverConverter } from "@app/converters/driver.converter";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { getOverallScoreFormat } from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";

interface StandingsRow {
  rank: number;
  driver: Driver;
  score: number;
  laps: number;
  averageLapTime: number;
  medianLapTime: number;
  bestLapTime: number;
  totalTime: number;
  gap1st: number | null;
  gapAhead: number | null;
  avatarUrl: string;
}

@Component({
  standalone: true,
  selector: "app-default-driver-results",
  templateUrl: "./default-driver-results.component.html",
  styleUrls: ["./default-driver-results.component.css"],
  imports: [
    HeatDriverExpanderComponent,
    CommonModule,
    DecimalPipe,
    TranslatePipe,
    AvatarUrlPipe,
    RouterModule,
  ],
})
export class DefaultDriverResultsComponent implements OnInit, OnDestroy {
  protected driverId: string = "";
  protected driver?: Driver;
  protected race?: Race;
  protected overallRow?: StandingsRow;
  protected driverHeats: {
    heat: Heat;
    heatDriver: DriverHeatData;
    row: HeatStandingsRow;
    laneColor: { foreground: string; background: string; name: string };
    maxLapTime: number;
  }[] = [];

  protected expandedHeats = new Set<string>();
  protected collapsedHeatsByUser = new Set<string>();
  private subscriptions: Subscription[] = [];
  protected participants: RaceParticipant[] = [];
  protected heats: Heat[] = [];

  protected driverStats: any = null;
  protected raceState: RaceState = RaceState.UNKNOWN_STATE;
  private loadedDriverId: string = "";
  private loadedRaceId: string = "";

  constructor(
    private route: ActivatedRoute,
    private raceService: RaceService,
    private raceConnectionService: RaceConnectionService,
    private translationService: TranslationService,
    private printService: PrintService,
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
  ) {}

  private loadDriverStats(force = false) {
    if (!this.driverId) {
      this.driverStats = null;
      return;
    }
    const currentRaceId = this.race?.entity_id;
    if (!currentRaceId && !force) {
      // Driver results view needs a saved race context to fetch specific stats.
      // Do not accidentally request global stats by passing undefined/empty raceId.
      return;
    }

    if (
      !force &&
      this.driverId === this.loadedDriverId &&
      currentRaceId === this.loadedRaceId &&
      this.driverStats !== null
    ) {
      return;
    }
    this.loadedDriverId = this.driverId;
    this.loadedRaceId = currentRaceId || "";
    const isDemo = this.race?.entity_id?.startsWith("demo_") || false;
    this.dataService
      .getDriverStatistics(this.driverId, currentRaceId || undefined, isDemo)
      .subscribe({
        next: (stats) => {
          this.driverStats = stats;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn("Failed to load driver statistics", err);
          this.driverStats = null;
          // Reset cache tracking on error to allow subsequent retries
          this.loadedDriverId = "";
          this.loadedRaceId = "";
          this.cdr.detectChanges();
        },
      });
  }

  ngOnInit() {
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        this.raceState = state;
        if (state === RaceState.RACE_OVER) {
          // Immediately try to fetch stats (if server completed persistence rapidly)
          this.loadDriverStats(true);
          // Also delay a fetch by 500ms to robustly handle database write latency
          setTimeout(() => {
            this.loadDriverStats(true);
          }, 500);
          // And one more at 1500ms as a robust fallback for slower database writes
          setTimeout(() => {
            this.loadDriverStats(true);
          }, 1500);
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.driverId = params["driverId"] || "";
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceService.selectedRace$.subscribe((race) => {
        this.race = race;
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        this.participants = participants || [];
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceService.heats$.subscribe((heats) => {
        this.heats = heats || [];
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.overallStandingsUpdate$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.standingsUpdate$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.translationService.getCurrentLanguage().subscribe(() => {
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  protected getScoreFormat(): string {
    const rankingMethod = this.race?.overall_scoring?.rankingMethod;
    return getOverallScoreFormat(rankingMethod);
  }

  protected toggleHeat(heatId: string) {
    if (this.expandedHeats.has(heatId)) {
      this.expandedHeats.delete(heatId);
      this.collapsedHeatsByUser.add(heatId);
    } else {
      this.expandedHeats.add(heatId);
      this.collapsedHeatsByUser.delete(heatId);
    }
    this.cdr.detectChanges();
  }

  protected formatGap(gap: number | null): string {
    if (gap === null) return "--.---";
    if (gap === 0) return "0.000";
    const sign = gap > 0 ? "+" : "";
    return `${sign}${gap.toFixed(3)}`;
  }

  private recalculateAll() {
    if (!this.driverId) return;

    this.loadDriverStats();

    // 1. Resolve Driver Object
    const p = this.participants.find(
      (curr) =>
        (curr.driver && curr.driver.entity_id === this.driverId) ||
        (curr.team && curr.team.entity_id === this.driverId),
    );
    if (p) {
      this.driver =
        p.team && p.team.entity_id === this.driverId
          ? (p.team as any)
          : (p.driver as any);
    } else {
      // Look through heats to see if driver model is loaded there
      for (const heat of this.heats) {
        const hd = heat.heatDrivers.find(
          (curr) =>
            (curr.participant?.driver &&
              curr.participant.driver.entity_id === this.driverId) ||
            (curr.participant?.team &&
              curr.participant.team.entity_id === this.driverId),
        );
        if (hd && hd.participant) {
          this.driver =
            hd.participant.team &&
            hd.participant.team.entity_id === this.driverId
              ? (hd.participant.team as any)
              : (hd.participant.driver as any);
          break;
        }
      }
    }

    // 2. Recalculate Overall Row
    this.recalculateOverallStandings();

    // 3. Recalculate Heats and Heat Standings
    this.recalculateHeats();

    this.cdr.detectChanges();
  }

  private recalculateOverallStandings() {
    if (!this.participants || this.participants.length === 0) {
      this.overallRow = undefined;
      return;
    }

    const sorted = [...this.participants]
      .filter((p) => p && ((p.driver && !Driver.isEmpty(p.driver)) || p.team))
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          if (a.rank === 0) return 1;
          if (b.rank === 0) return -1;
          return a.rank - b.rank;
        }
        if (b.rankValue !== a.rankValue) {
          return b.rankValue - a.rankValue;
        }
        if (b.totalLaps !== a.totalLaps) {
          return b.totalLaps - a.totalLaps;
        }
        return a.totalTime - b.totalTime;
      });

    if (sorted.length === 0) {
      this.overallRow = undefined;
      return;
    }

    const standings = sorted.map((curr, i) => {
      let gap1st: number | null = curr.gapLeader ?? 0;
      let gapAhead: number | null = curr.gapPosition ?? 0;

      return {
        rank: curr.rank || i + 1,
        driver: (curr.driver || curr.team) as any,
        score: curr.rankValue || 0,
        laps: curr.totalLaps || 0,
        averageLapTime: curr.averageLapTime || 0,
        medianLapTime: curr.medianLapTime || 0,
        bestLapTime: curr.bestLapTime || 0,
        totalTime: curr.totalTime || 0,
        gap1st,
        gapAhead,
        avatarUrl: curr.driver?.avatarUrl || "",
      };
    });

    this.overallRow = standings.find(
      (row) => row.driver && row.driver.entity_id === this.driverId,
    );
  }

  private recalculateHeats() {
    const currentHeat = this.raceService.getCurrentHeat();

    // Merge completed heats with the current (live) heat, deduplicating by objectId
    const heatMap = new Map<string, Heat>();
    if (this.heats) {
      this.heats.forEach((h) => heatMap.set(h.objectId, h));
    }
    if (currentHeat) {
      heatMap.set(currentHeat.objectId, currentHeat);
    }

    const allHeats = Array.from(heatMap.values());

    if (allHeats.length === 0) {
      this.driverHeats = [];
      return;
    }

    // Auto expand the active running heat if it's started and not explicitly collapsed
    if (
      currentHeat &&
      currentHeat.started &&
      !this.collapsedHeatsByUser.has(currentHeat.objectId)
    ) {
      this.expandedHeats.add(currentHeat.objectId);
    }

    const matchedHeats: typeof this.driverHeats = [];

    allHeats.forEach((heat) => {
      if (!heat.heatDrivers) return;

      const heatDriver = heat.heatDrivers.find(
        (hd) =>
          (hd.participant?.driver &&
            hd.participant.driver.entity_id === this.driverId) ||
          (hd.participant?.team &&
            hd.participant.team.entity_id === this.driverId),
      );

      if (!heatDriver) return;

      const row: HeatStandingsRow = {
        rank: heatDriver.rank || 1,
        objectId: heatDriver.objectId,
        laps: heatDriver.adjustedLapCount,
        averageLapTime: heatDriver.averageLapTime,
        medianLapTime: heatDriver.medianLapTime,
        bestLapTime: heatDriver.bestLapTime,
        totalTime: heatDriver.totalTime,
        gap1st: heatDriver.gapLeader ?? 0,
        gapAhead: heatDriver.gapPosition ?? 0,
        reactionTime: heatDriver.reactionTime,
      };

      // Resolve Lane Details from track
      let foreground = "#ffffff";
      let background = "#333333";
      let name = this.translationService.translate("DR_LABEL_LANE", {
        lane: heatDriver.laneIndex + 1,
      });

      if (
        this.race?.track?.lanes &&
        this.race.track.lanes[heatDriver.laneIndex]
      ) {
        const lane = this.race.track.lanes[heatDriver.laneIndex];
        foreground = lane.foreground_color || foreground;
        background = lane.background_color || background;
      }

      // Calculate max lap time in this heat for chart scaling
      const laps = heatDriver.lapsWithDetails;
      const maxLapTime =
        laps.length > 0 ? Math.max(...laps.map((l) => l.time)) : 0;

      matchedHeats.push({
        heat,
        heatDriver,
        row,
        laneColor: { foreground, background, name },
        maxLapTime,
      });
    });

    // Sort matching heats by heatNumber ascending
    this.driverHeats = matchedHeats.sort(
      (a, b) => a.heat.heatNumber - b.heat.heatNumber,
    );
  }

  protected isTeam(): boolean {
    const p = this.participants.find(
      (curr) =>
        (curr.driver && curr.driver.entity_id === this.driverId) ||
        (curr.team && curr.team.entity_id === this.driverId),
    );
    if (p && p.team) return true;
    for (const dh of this.driverHeats) {
      if (dh.heatDriver?.participant?.team) return true;
    }
    return false;
  }

  protected getDriverName(driverId: string): string {
    if (!driverId) return "";
    const cached = DriverConverter.get(driverId);
    if (cached) return cached.nickname || cached.name;
    const p = this.participants.find(
      (curr) => curr.driver && curr.driver.entity_id === driverId,
    );
    if (p && p.driver) return p.driver.nickname || p.driver.name;
    for (const heat of this.heats) {
      if (heat.heatDrivers) {
        const hd = heat.heatDrivers.find(
          (d) =>
            (d.driver && d.driver.entity_id === driverId) ||
            (d.actualDriver && d.actualDriver.entity_id === driverId),
        );
        if (hd) {
          if (hd.actualDriver && hd.actualDriver.entity_id === driverId)
            return hd.actualDriver.nickname || hd.actualDriver.name;
          if (hd.driver && hd.driver.entity_id === driverId)
            return hd.driver.nickname || hd.driver.name;
        }
      }
    }
    return "Unknown";
  }

  protected exportPdf() {
    const driverName = this.driver
      ? this.driver.nickname || this.driver.name
      : "Driver Results";
    this.printService.print(`${driverName} - Driver Results`, true);
  }

  protected getLanes(): any[] {
    if (this.race?.track?.lanes) {
      return this.race.track.lanes;
    }
    if (this.driverStats?.lane_best_lap_times) {
      return this.driverStats.lane_best_lap_times;
    }
    return [];
  }
}
