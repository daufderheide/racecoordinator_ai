import { CommonModule, DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import { Driver } from "@app/models/driver";
import { AllowFinish, FinishMethod } from "@app/models/heat_scoring";
import { getOverallScoreFormat } from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IRecordData, IRecordEntry } from "@app/proto/antigravity";
import { Heat } from "@app/race/heat";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";

interface StandingsRow {
  rank: number;
  visualIndex: number;
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

interface GraphPoint {
  x: number;
  y: number;
  isOwnLap?: boolean;
  causesStandingsChange?: boolean;
}

interface DriverLine {
  objectId: string;
  driverName: string;
  color: string;
  backgroundColor: string;
  points: GraphPoint[];
  pathData: string;
  rankPoints: GraphPoint[];
  rankPathData: string;
  legendX: number;
  legendY: number;
}

const NEON_COLORS = [
  { color: "#00ffff", bg: "#0b2e30" }, // Neon Cyan
  { color: "#ff00ff", bg: "#300030" }, // Neon Pink
  { color: "#ffff00", bg: "#303000" }, // Neon Yellow
  { color: "#00ff00", bg: "#003000" }, // Neon Green
  { color: "#ff3d00", bg: "#300b00" }, // Neon Orange/Red
  { color: "#3d5afe", bg: "#000b30" }, // Neon Blue
  { color: "#d500f9", bg: "#230030" }, // Dark Magenta
  { color: "#1de9b6", bg: "#003020" }, // Mint Teal
  { color: "#ff9100", bg: "#301c00" }, // Amber Orange
  { color: "#c6ff00", bg: "#233000" }, // Lime Green
];

@Component({
  standalone: true,
  selector: "app-default-race-results",
  templateUrl: "./default-race-results.component.html",
  styleUrls: ["./default-race-results.component.css"],
  imports: [
    CommonModule,
    DecimalPipe,
    TranslatePipe,
    AvatarUrlPipe,
    RouterModule,
  ],
})
export class DefaultRaceResultsComponent implements OnInit, OnDestroy {
  protected scale = 1;
  protected participants: RaceParticipant[] = [];
  protected race?: Race;
  protected standingsRows: StandingsRow[] = [];
  protected driverLines: DriverLine[] = [];
  protected recordData: IRecordData | null = null;
  private subscriptions: Subscription[] = [];
  protected hiddenDriverKeys = new Set<string>();
  protected hoveredDriverId: string | null = null;
  private clickTimeout: any = null;
  private raceStartTime: Date = new Date();

  protected getDriverId(d: any): string {
    if (!d) return "";
    return (
      d.entity_id ||
      d.entityId ||
      d.objectId ||
      d.id ||
      d.model?.entityId ||
      d.model?.entity_id ||
      ""
    );
  }

  protected openDriverResults(driverId: string, event: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!driverId) return;
    const url = `/driver-results/${driverId}`;
    window.open(url, "_blank");
  }

  protected getDriverKey(d: any): string {
    const id = this.getDriverId(d);
    if (id) return id;
    return (d?.nickname || d?.name || d?.model?.name || "")
      .trim()
      .toLowerCase();
  }

  protected isDriverVisible(driver: any): boolean {
    if (typeof driver === "string") {
      return !this.hiddenDriverKeys.has(driver);
    }
    const key = this.getDriverKey(driver);
    return !this.hiddenDriverKeys.has(key);
  }

  protected toggleDriverVisibility(objectId: string) {
    if (this.hiddenDriverKeys.has(objectId)) {
      this.hiddenDriverKeys.delete(objectId);
    } else {
      this.hiddenDriverKeys.add(objectId);
    }
    this.cdr.detectChanges();
  }

  protected showOnlyDriver(objectId: string) {
    const allDriverKeys = this.driverLines.map((line) => line.objectId);
    const visibleCount = allDriverKeys.length - this.hiddenDriverKeys.size;

    if (visibleCount === 1 && !this.hiddenDriverKeys.has(objectId)) {
      this.hiddenDriverKeys.clear();
    } else {
      this.hiddenDriverKeys.clear();
      allDriverKeys.forEach((key) => {
        if (key !== objectId) {
          this.hiddenDriverKeys.add(key);
        }
      });
    }
    this.cdr.detectChanges();
  }

  protected onLegendClick(objectId: string) {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }

    this.clickTimeout = setTimeout(() => {
      this.toggleDriverVisibility(objectId);
      this.clickTimeout = null;
    }, 250);
  }

  protected onLegendDblClick(objectId: string) {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    this.showOnlyDriver(objectId);
  }

  // SVG Dimensions
  protected width = 1400;
  protected height = 750;

  // Padding for graph area
  protected padding = { top: 80, right: 100, bottom: 150, left: 100 };

  protected maxX = 10; // Min scale
  protected maxY = 5; // Min scale

  protected legendItemWidth = 180;

  get legendStartX(): number {
    const totalWidth = this.driverLines.length * this.legendItemWidth;
    return (this.width - totalWidth) / 2;
  }

  constructor(
    private raceConnectionService: RaceConnectionService,
    private raceService: RaceService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private printService: PrintService,
  ) {}

  ngOnInit() {
    this.updateScale();
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.translationService.getCurrentLanguage().subscribe(() => {
        this.updateGraph();
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceService.heats$.subscribe(() => {
        this.recalculateStandings();
      }),
    );

    this.subscriptions.push(
      this.raceService.selectedRace$.subscribe((race) => {
        this.race = race;
        this.recalculateStandings();
      }),
    );

    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        const hadNoParticipants =
          !this.participants || this.participants.length === 0;
        this.participants = participants || [];
        if (hadNoParticipants && this.participants.length > 0) {
          this.raceStartTime = new Date();
        }
        this.recalculateStandings();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.standingsUpdate$.subscribe(() => {
        this.recalculateStandings();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.overallStandingsUpdate$.subscribe(() => {
        this.recalculateStandings();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe(() => {
        this.recalculateStandings();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.recordData$.subscribe((records) => {
        if (records) {
          this.recordData = records;
          this.cdr.detectChanges();
        }
      }),
    );
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  exportPdf() {
    this.printService.print("Race Results", true, this.raceStartTime);
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  protected getRecordDate(dateVal: any): Date | null {
    if (!dateVal) return null;
    let ms = 0;
    if (typeof dateVal === "number") {
      ms = dateVal;
    } else if (dateVal.toNumber) {
      ms = dateVal.toNumber();
    } else if (typeof dateVal === "string") {
      ms = parseInt(dateVal, 10);
    } else {
      ms = Number(dateVal);
    }
    return ms > 0 ? new Date(ms) : null;
  }

  protected getLaneColor(index: number): string {
    if (this.race?.track?.lanes && index < this.race.track.lanes.length) {
      return (
        this.race.track.lanes[index].background_color ||
        NEON_COLORS[index % NEON_COLORS.length].color
      );
    }
    return NEON_COLORS[index % NEON_COLORS.length].color;
  }

  protected getHolderDisplay(entry: IRecordEntry | null | undefined): string {
    if (!entry) return "---";
    return entry.holderNickname || entry.holderName || "---";
  }

  private updateScale() {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    const newScale = Math.min(scaleX, scaleY);
    if (Math.abs(this.scale - newScale) > 0.001) {
      this.scale = newScale;
    }
  }

  protected recalculateStandings() {
    if (!this.participants || this.participants.length === 0) {
      this.standingsRows = [];
      this.cdr.detectChanges();
      return;
    }

    // Sort by rank ascending (1, 2, 3...)
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

    const lead = sorted[0];
    this.standingsRows = sorted.map((curr, i) => {
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
        visualIndex: i,
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

    // Sort standingsRows by a stable property so Angular doesn't move DOM nodes,
    // which breaks CSS transitions. We compute visual positions via visualIndex.
    this.standingsRows.sort((a, b) =>
      this.getDriverKey(a.driver).localeCompare(this.getDriverKey(b.driver)),
    );

    this.updateGraph();
    this.cdr.detectChanges();
  }

  protected formatGap(value: number | null): string {
    if (value === null || value === undefined) return "";
    if (value === 0) return "--.---";
    const sign = value > 0 ? "+" : "";
    return sign + value.toFixed(3);
  }

  protected getScoreFormat(): string {
    const rankingMethod = this.race?.overall_scoring?.rankingMethod;
    return getOverallScoreFormat(rankingMethod);
  }

  protected isAllowFinishLapBasedRace(): boolean {
    if (!this.race) return false;
    const hs = this.race.heat_scoring;
    if (!hs) return false;
    return (
      hs.finishMethod === FinishMethod.Lap &&
      hs.allowFinish === AllowFinish.AF_ALLOW
    );
  }

  protected trackByDriver(index: number, row: StandingsRow): string {
    return this.getDriverKey(row.driver);
  }

  protected trackByDriverLine(index: number, line: DriverLine): string {
    return line.objectId;
  }

  /* eslint-disable max-lines-per-function */
  protected updateGraph() {
    if (!this.standingsRows || this.standingsRows.length === 0) {
      this.driverLines = [];
      return;
    }

    const heats = this.raceService.getHeats() || [];
    const currentHeat = this.raceService.getCurrentHeat();

    // Merge completed heats with the current (live) heat, deduplicating by objectId
    const heatMap = new Map<string, Heat>();
    heats.forEach((h) => heatMap.set(h.objectId, h));
    if (currentHeat) {
      heatMap.set(currentHeat.objectId, currentHeat);
    }
    const allHeats = Array.from(heatMap.values());
    const sortedHeats = allHeats.sort((a, b) => a.heatNumber - b.heatNumber);

    // Safe helper to extract the "identity" driver from any shape of HeatDriver.
    // For graph matching we need the driver identity that corresponds to the
    // standings (i.e. the RaceParticipant's driver, which in team races is the
    // team entity).  actualDriver is only the individual who happened to drive
    // in that heat, so we try participant.driver first.
    const getDriverFromHeatDriver = (d: any): any => {
      if (!d) return null;
      if (d.participant?.driver) return d.participant.driver;
      if (d.driver) {
        if (d.driver.driver) return d.driver.driver; // d.driver is RaceParticipant
        return d.driver; // d.driver is Driver
      }
      if (d.actualDriver) return d.actualDriver;
      return null;
    };

    // Get stable unique driver keys sorted by seed (registration order), falling back to nickname/name alphabetically.
    // This ensures colors and legends are permanently stable under all race/position changes.
    const stableParticipants = [...this.participants].sort((a, b) => {
      const seedA = a.seed || 0;
      const seedB = b.seed || 0;
      if (seedA !== seedB) {
        return seedA - seedB;
      }
      const nameA = (a.driver?.nickname || a.driver?.name || "")
        .trim()
        .toLowerCase();
      const nameB = (b.driver?.nickname || b.driver?.name || "")
        .trim()
        .toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const stableKeys = stableParticipants
      .map((p) => this.getDriverKey(p?.driver))
      .filter((key) => !!key);

    const getNeonColor = (key: string) => {
      const idx = stableKeys.indexOf(key);
      if (idx === -1) return NEON_COLORS[0];
      return NEON_COLORS[idx % NEON_COLORS.length];
    };

    // Map each standings row to a DriverLine config
    this.driverLines = this.standingsRows.map((row) => {
      const driver = row.driver;
      const driverName = driver.nickname || driver.name;
      const driverKey = this.getDriverKey(driver);
      const palette = getNeonColor(driverKey);

      // Concatenate lap times across all sorted heats
      const points: GraphPoint[] = [];
      let currentAbsoluteTime = 0;

      sortedHeats.forEach((heat) => {
        const hd = heat.heatDrivers.find((d) => {
          if (!d) return false;
          const dDriver = getDriverFromHeatDriver(d);
          return dDriver && this.getDriverKey(dDriver) === driverKey;
        });
        if (hd) {
          const laps = hd.lapTimes || (hd as any).laps || [];
          laps.forEach((lapTime) => {
            currentAbsoluteTime += lapTime;
            points.push({ x: currentAbsoluteTime, y: lapTime });
          });
        }
      });

      return {
        objectId: driverKey,
        driverName,
        color: palette.color,
        backgroundColor: palette.bg,
        points,
        pathData: "",
        rankPoints: [],
        rankPathData: "",
        legendX: 0,
        legendY: 0,
      };
    });

    // CRITICAL: Sort the driver lines in stable registration driver order.
    // This satisfies: "The graph legends should never change. They should remain in driver order no matter what is happening in the race"
    this.driverLines.sort((a, b) => {
      const idxA = stableKeys.indexOf(a.objectId);
      const idxB = stableKeys.indexOf(b.objectId);
      return idxA - idxB;
    });

    // --- Compute Overall Standing Ranks Timeline ---
    interface ChronoEvent {
      absoluteTime: number;
      objectId: string;
    }

    const events: ChronoEvent[] = [];
    this.driverLines.forEach((line) => {
      let accum = 0;
      // Get all sorted heats for this driver to find cumulative events
      sortedHeats.forEach((heat) => {
        const hd = heat.heatDrivers.find((d) => {
          if (!d) return false;
          const dDriver = getDriverFromHeatDriver(d);
          return dDriver && this.getDriverKey(dDriver) === line.objectId;
        });
        if (hd) {
          const laps = hd.lapTimes || (hd as any).laps || [];
          laps.forEach((lap) => {
            accum += lap;
            events.push({ absoluteTime: accum, objectId: line.objectId });
          });
        }
      });
    });

    events.sort((a, b) => a.absoluteTime - b.absoluteTime);

    // Track active laps completed counts
    const lapsCount: { [id: string]: number } = {};
    const lastLapTime: { [id: string]: number } = {};
    const rankingHistory: { [id: string]: GraphPoint[] } = {};

    // To get the correct initial standings at x = 0, sort drivers by their starting positions/seed.
    const initialScores = this.driverLines.map((line) => {
      const participant = this.participants.find(
        (p) => p && p.driver && this.getDriverKey(p.driver) === line.objectId,
      );
      return {
        objectId: line.objectId,
        rank: participant?.rank || 0,
        rankValue: participant?.rankValue || 0,
        seed: participant?.seed || 0,
      };
    });

    initialScores.sort((a, b) => {
      if (a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      if (b.rankValue !== a.rankValue) {
        return b.rankValue - a.rankValue;
      }
      return a.seed - b.seed;
    });

    this.driverLines.forEach((line) => {
      lapsCount[line.objectId] = 0;
      lastLapTime[line.objectId] = 0;
      const initialIndex = initialScores.findIndex(
        (s) => s.objectId === line.objectId,
      );
      rankingHistory[line.objectId] = [
        { x: 0, y: initialIndex !== -1 ? initialIndex + 1 : 1 },
      ];
    });

    events.forEach((event) => {
      lapsCount[event.objectId]++;
      lastLapTime[event.objectId] = event.absoluteTime;

      // Score drivers: descending laps first, tiebreak with ascending total time
      const scores = this.driverLines.map((line) => ({
        objectId: line.objectId,
        laps: lapsCount[line.objectId],
        time: lastLapTime[line.objectId],
      }));

      scores.sort((a, b) => {
        if (a.laps !== b.laps) return b.laps - a.laps;
        return a.time - b.time;
      });

      scores.forEach((score, index) => {
        const isOwnLap = score.objectId === event.objectId;
        const history = rankingHistory[score.objectId];
        const prevRank = history[history.length - 1].y;
        const newRank = index + 1;
        const causesStandingsChange = isOwnLap && newRank !== prevRank;

        history.push({
          x: event.absoluteTime,
          y: newRank,
          isOwnLap,
          causesStandingsChange,
        });
      });
    });

    // Assign ranking points to driver lines
    this.driverLines.forEach((line) => {
      const history = rankingHistory[line.objectId];
      if (history.length > 1 && history[0].x === 0 && history[0].y === 0) {
        history[0].y = history[1].y; // align start point for cleaner curve
      }

      // Filter to keep only the points when 1 or more positions change, or when it's the driver's own completed lap (and boundary start/end points)
      const filtered: GraphPoint[] = [];
      if (history.length > 0) {
        filtered.push(history[0]);
        for (let idx = 1; idx < history.length - 1; idx++) {
          const prev = history[idx - 1];
          const curr = history[idx];
          const next = history[idx + 1];

          if (curr.y !== prev.y || curr.y !== next.y || curr.isOwnLap) {
            filtered.push(curr);
          }
        }
        if (history.length > 1) {
          filtered.push(history[history.length - 1]);
        }
      }
      line.rankPoints = filtered;
    });

    // Calculate Max X & Max Y for scaling
    const allX = this.driverLines.flatMap((line) =>
      line.points.map((p) => p.x),
    );
    const allY = this.driverLines.flatMap((line) =>
      line.points.map((p) => p.y),
    );

    if (allX.length > 0) {
      this.maxX = Math.max(...allX) * 1.05; // 5% padding
    } else {
      this.maxX = 10;
    }

    if (allY.length > 0) {
      this.maxY = Math.max(...allY) * 1.1; // 10% padding
    } else {
      this.maxY = 5;
    }

    // Safeguard from division-by-zero or negative boundaries
    if (this.maxX <= 0) {
      this.maxX = 10;
    }
    if (this.maxY <= 0) {
      this.maxY = 5;
    }

    // Calculate legend row wrapping and positions
    const itemsPerRow = 6;
    const legendItemWidth = 180;
    const legendItemHeight = 35;
    const N = this.driverLines.length;
    const rowCount = Math.max(1, Math.ceil(N / itemsPerRow));
    const delta = (rowCount - 1) * legendItemHeight;

    this.height = 750 + delta;
    this.padding.bottom = 150 + delta;

    // Generate SVG path strings and legend positions
    this.driverLines.forEach((line, i) => {
      if (line.points.length > 0) {
        line.pathData = this.generatePath(line.points, false);
      }
      if (line.rankPoints.length > 0) {
        line.rankPathData = this.generatePath(line.rankPoints, true);
      }

      const r = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      const startIdx = r * itemsPerRow;
      const endIdx = Math.min(N, (r + 1) * itemsPerRow);
      const itemsInRow = endIdx - startIdx;
      const rowStartX = (this.width - itemsInRow * legendItemWidth) / 2;

      line.legendX = rowStartX + col * legendItemWidth;
      line.legendY =
        this.height - this.padding.bottom + 85 + r * legendItemHeight;
    });

    this.cdr.detectChanges();
  }

  private generatePath(points: GraphPoint[], isRank: boolean): string {
    if (points.length === 0) return "";

    return points
      .map((point, index) => {
        const x = isRank ? this.scaleXLeft(point.x) : this.scaleXRight(point.x);
        const y = isRank ? this.scaleYLeft(point.y) : this.scaleY(point.y);
        return (index === 0 ? "M" : "L") + ` ${x} ${y}`;
      })
      .join(" ");
  }

  protected scaleXLeft(x: number): number {
    const graphWidth =
      (this.width - this.padding.left - this.padding.right - 80) / 2;
    return this.padding.left + (x / this.maxX) * graphWidth;
  }

  protected scaleXRight(x: number): number {
    const graphWidth =
      (this.width - this.padding.left - this.padding.right - 80) / 2;
    const offset = this.padding.left + graphWidth + 80;
    return offset + (x / this.maxX) * graphWidth;
  }

  protected scaleYLeft(rank: number): number {
    const graphHeight = this.height - this.padding.top - this.padding.bottom;
    const N = this.driverLines.length || 4;
    if (N <= 1) return this.padding.top + graphHeight / 2;
    return this.padding.top + ((rank - 1) / (N - 1)) * graphHeight;
  }

  protected scaleX(x: number): number {
    const graphWidth = this.width - this.padding.left - this.padding.right;
    return this.padding.left + (x / this.maxX) * graphWidth;
  }

  protected scaleY(y: number): number {
    const graphHeight = this.height - this.padding.top - this.padding.bottom;
    // Invert Y for SVG coord system (0,0 is top-left)
    return this.height - this.padding.bottom - (y / this.maxY) * graphHeight;
  }

  // Grid helpers
  get xTicks(): number[] {
    const ticks = [];
    const step = Math.ceil(this.maxX / 10) || 1;
    for (let i = 0; i <= this.maxX; i += step) {
      ticks.push(i);
    }
    return ticks;
  }

  get yTicks(): number[] {
    const ticks = [];
    const step = Math.ceil(this.maxY / 5) || 1;
    for (let i = 0; i <= this.maxY; i += step) {
      ticks.push(i);
    }
    return ticks;
  }

  get yTicksLeft(): number[] {
    const N = this.driverLines.length || 4;
    const ticks = [];
    for (let i = 1; i <= N; i++) {
      ticks.push(i);
    }
    return ticks;
  }
}
