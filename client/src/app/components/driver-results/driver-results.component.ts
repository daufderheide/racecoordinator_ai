import { CommonModule, DecimalPipe } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import { DriverConverter } from "@app/converters/driver.converter";
import { Driver } from "@app/models/driver";
import { getOverallScoreFormat } from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
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

interface HeatStandingsRow {
  rank: number;
  objectId: string;
  laps: number;
  averageLapTime: number;
  medianLapTime: number;
  bestLapTime: number;
  totalTime: number;
  gap1st: number | null;
  gapAhead: number | null;
  reactionTime: number;
}

@Component({
  standalone: true,
  selector: "app-driver-results",
  templateUrl: "./driver-results.component.html",
  styleUrls: ["./driver-results.component.css"],
  imports: [
    CommonModule,
    DecimalPipe,
    TranslatePipe,
    AvatarUrlPipe,
    RouterModule,
  ],
})
export class DriverResultsComponent implements OnInit, OnDestroy {
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
  protected activeTooltip: {
    lap: any;
    lapIdx: number;
    left: number;
    top: number;
    heatId: string;
  } | null = null;

  constructor(
    private route: ActivatedRoute,
    private raceService: RaceService,
    private raceConnectionService: RaceConnectionService,
    private translationService: TranslationService,
    private printService: PrintService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.raceConnectionService.connect();

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

  protected getLapBarHeight(lapTime: number, maxLapTime: number): number {
    if (maxLapTime === 0) return 0;
    const minHeight = 15;
    return minHeight + (lapTime / maxLapTime) * (100 - minHeight);
  }

  protected getSegmentColor(idx: number): string {
    const colors = [
      "#00e5ff", // Segment 1: Neon Cyan
      "#d500f9", // Segment 2: Neon Purple/Magenta
      "#ff9100", // Segment 3: Neon Orange/Gold
      "#00e676", // Segment 4: Neon Green
    ];
    return colors[idx % colors.length];
  }

  private recalculateAll() {
    if (!this.driverId) return;

    // 1. Resolve Driver Object
    const p = this.participants.find(
      (curr) => curr.driver && curr.driver.entity_id === this.driverId,
    );
    if (p) {
      this.driver = p.driver;
    } else {
      // Look through heats to see if driver model is loaded there
      for (const heat of this.heats) {
        const hd = heat.heatDrivers.find(
          (d) =>
            (d.participant?.driver &&
              d.participant.driver.entity_id === this.driverId) ||
            (d.participant?.team &&
              d.participant.team.entity_id === this.driverId),
        );
        if (hd) {
          this.driver = hd.participant.driver;
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
      .filter((p) => p && p.driver && !Driver.isEmpty(p.driver))
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

    const lead = sorted[0];
    const standings = sorted.map((curr, i) => {
      let gap1st: number | null = 0;
      let gapAhead: number | null = 0;

      if (i > 0) {
        // Gap to Leader
        const leadLaps = lead.totalLaps || 0;
        const leadTime = lead.totalTime || 0;
        const leadAvg = lead.averageLapTime || 0;

        const currLaps = curr.totalLaps || 0;
        const currTime = curr.totalTime || 0;
        const currAvg = curr.averageLapTime || 0;

        if (currLaps === leadLaps) {
          gap1st = currTime - leadTime;
        } else if (currLaps === 0) {
          gap1st = leadTime;
        } else {
          const lapDiff = leadLaps - currLaps;
          if (currAvg < leadAvg) {
            gap1st = currAvg * lapDiff;
          } else {
            gap1st = Math.min(currAvg, currTime - leadTime) + currAvg * lapDiff;
          }
        }

        // Gap to Driver Ahead
        const prev = sorted[i - 1];
        const prevLaps = prev.totalLaps || 0;
        const prevTime = prev.totalTime || 0;
        const prevAvg = prev.averageLapTime || 0;

        if (currLaps === prevLaps) {
          gapAhead = currTime - prevTime;
        } else if (currLaps === 0) {
          gapAhead = prevTime;
        } else {
          const lapDiff = prevLaps - currLaps;
          if (currAvg < prevAvg) {
            gapAhead = currAvg * lapDiff;
          } else {
            gapAhead =
              Math.min(currAvg, currTime - prevTime) + currAvg * lapDiff;
          }
        }
      }

      return {
        rank: curr.rank || i + 1,
        driver: curr.driver,
        score: curr.rankValue || 0,
        laps: curr.totalLaps || 0,
        averageLapTime: curr.averageLapTime || 0,
        medianLapTime: curr.medianLapTime || 0,
        bestLapTime: curr.bestLapTime || 0,
        totalTime: curr.totalTime || 0,
        gap1st,
        gapAhead,
        avatarUrl: curr.driver.avatarUrl || "",
      };
    });

    this.overallRow = standings.find(
      (row) => row.driver && row.driver.entity_id === this.driverId,
    );
  }

  private calculateHeatGaps(
    idx: number,
    lead: DriverHeatData | undefined,
    heatDriver: DriverHeatData,
    sortedHeatDrivers: DriverHeatData[],
  ): { gap1st: number | null; gapAhead: number | null } {
    let gap1st: number | null = 0;
    let gapAhead: number | null = 0;

    if (idx > 0 && lead) {
      // Gap to Leader inside this Heat
      const leadLaps = lead.adjustedLapCount;
      const leadTime = lead.totalTime;
      const leadAvg = lead.averageLapTime;

      const currLaps = heatDriver.adjustedLapCount;
      const currTime = heatDriver.totalTime;
      const currAvg = heatDriver.averageLapTime;

      if (currLaps === leadLaps) {
        gap1st = currTime - leadTime;
      } else if (currLaps === 0) {
        gap1st = leadTime;
      } else {
        const lapDiff = leadLaps - currLaps;
        if (currAvg < leadAvg) {
          gap1st = currAvg * lapDiff;
        } else {
          gap1st = Math.min(currAvg, currTime - leadTime) + currAvg * lapDiff;
        }
      }

      // Gap to Driver Ahead inside this Heat
      const prev = sortedHeatDrivers[idx - 1];
      const prevLaps = prev.adjustedLapCount;
      const prevTime = prev.totalTime;
      const prevAvg = prev.averageLapTime;

      if (currLaps === prevLaps) {
        gapAhead = currTime - prevTime;
      } else if (currLaps === 0) {
        gapAhead = prevTime;
      } else {
        const lapDiff = prevLaps - currLaps;
        if (currAvg < prevAvg) {
          gapAhead = currAvg * lapDiff;
        } else {
          gapAhead = Math.min(currAvg, currTime - prevTime) + currAvg * lapDiff;
        }
      }
    }

    return { gap1st, gapAhead };
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

      // Calculate standings for drivers within this specific heat
      const validHeatDrivers = heat.heatDrivers.filter(
        (hd) => hd.driver && !Driver.isEmpty(hd.driver),
      );

      // Sort heat drivers: descending laps, ascending total time
      const sortedHeatDrivers = [...validHeatDrivers].sort((a, b) => {
        const lapsA = a.adjustedLapCount;
        const lapsB = b.adjustedLapCount;
        if (lapsA !== lapsB) {
          return lapsB - lapsA;
        }
        return a.totalTime - b.totalTime;
      });

      const idx = sortedHeatDrivers.findIndex(
        (hd) => hd.objectId === heatDriver.objectId,
      );
      const lead = sortedHeatDrivers[0];

      const { gap1st, gapAhead } = this.calculateHeatGaps(
        idx,
        lead,
        heatDriver,
        sortedHeatDrivers,
      );

      const row: HeatStandingsRow = {
        rank: idx !== -1 ? idx + 1 : 1,
        objectId: heatDriver.objectId,
        laps: heatDriver.adjustedLapCount,
        averageLapTime: heatDriver.averageLapTime,
        medianLapTime: heatDriver.medianLapTime,
        bestLapTime: heatDriver.bestLapTime,
        totalTime: heatDriver.totalTime,
        gap1st,
        gapAhead,
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
          (d) => d.driver && d.driver.entity_id === driverId,
        );
        if (hd && hd.driver) return hd.driver.nickname || hd.driver.name;
      }
    }
    return "Unknown";
  }

  protected showTooltip(
    event: MouseEvent,
    lap: any,
    lapIdx: number,
    heatId: string,
  ) {
    const barEl = event.currentTarget as HTMLElement;
    const chartBoxEl = barEl.closest(".lap-chart-box") as HTMLElement;
    if (!chartBoxEl) return;

    const barRect = barEl.getBoundingClientRect();
    const chartRect = chartBoxEl.getBoundingClientRect();

    // Calculate position of bar center relative to the chart container
    const left = barRect.left - chartRect.left + barRect.width / 2;
    const top = barRect.top - chartRect.top;

    this.activeTooltip = {
      lap,
      lapIdx,
      left,
      top,
      heatId,
    };
  }

  protected hideTooltip() {
    this.activeTooltip = null;
  }

  protected exportPdf() {
    const driverName = this.driver
      ? this.driver.nickname || this.driver.name
      : "Driver Results";
    this.printService.print(`${driverName} - Driver Results`, true);
  }
}
