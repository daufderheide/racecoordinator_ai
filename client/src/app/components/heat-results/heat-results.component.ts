import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import {
  HeatDriverExpanderComponent,
  HeatExpanderData,
  HeatStandingsRow,
} from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import {
  DriverLine,
  TwinGraphsComponent,
} from "@app/components/shared/twin-graphs/twin-graphs.component";
import { DataService } from "@app/data.service";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

@Component({
  standalone: true,
  selector: "app-heat-results",
  templateUrl: "./heat-results.component.html",
  styleUrls: ["./heat-results.component.css"],
  imports: [
    TranslatePipe,
    AcknowledgementModalComponent,
    HeatDriverExpanderComponent,
    TwinGraphsComponent,
  ],
})
export class HeatResultsComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  protected viewerRaceEndedHandler!: ViewerRaceEndedHandler;

  get showAckModal(): boolean {
    return this.viewerRaceEndedHandler?.showAckModal ?? false;
  }
  set showAckModal(v: boolean) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.showAckModal = v;
  }
  get ackModalTitle(): string {
    return this.viewerRaceEndedHandler?.ackModalTitle ?? "";
  }
  set ackModalTitle(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalTitle = v;
  }
  get ackModalMessage(): string {
    return this.viewerRaceEndedHandler?.ackModalMessage ?? "";
  }
  set ackModalMessage(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalMessage = v;
  }
  get ackModalButtonText(): string {
    return (
      this.viewerRaceEndedHandler?.ackModalButtonText ?? "ACK_MODAL_BTN_OK"
    );
  }
  set ackModalButtonText(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalButtonText = v;
  }
  get raceHasEnded(): boolean {
    return this.viewerRaceEndedHandler?.raceHasEnded ?? false;
  }
  set raceHasEnded(v: boolean) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.raceHasEnded = v;
  }

  onAcknowledgeModal() {
    const raceHasEnded = this.raceHasEnded;
    this.showAckModal = false;
    if (raceHasEnded) {
      this.router.navigate(["/raceday-setup"]);
    }
  }

  private subscriptions: Subscription[] = [];
  protected heat?: Heat;
  protected heatData: HeatExpanderData[] = [];
  protected expandedHeats = new Set<string>();
  protected participants: RaceParticipant[] = [];

  protected toggleHeat(driverId: string) {
    if (this.expandedHeats.has(driverId)) {
      this.expandedHeats.delete(driverId);
    } else {
      this.expandedHeats.add(driverId);
    }
  }

  protected isTeam(): boolean {
    return this.participants.some((p) => !!p.team);
  }
  protected race?: Race;
  protected driverLines: DriverLine[] = [];
  private driverResultsWindows: Window[] = [];

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
    this.viewerRaceEndedHandler = new ViewerRaceEndedHandler(
      this.dataService,
      this.authService,
      this.cdr,
      { onlyForViewer: true },
    );
    this.viewerRaceEndedHandler.startListening();

    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.translationService.getCurrentLanguage().subscribe(() => {
        this.updateGraph();
        this.calculateHeatStandings();
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.loadRaceData();
        this.updateGraph();
        this.calculateHeatStandings();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe(() => {
        this.updateGraph();
        this.calculateHeatStandings();
      }),
    );

    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        this.participants = participants;
      }),
    );

    this.loadRaceData();
    this.updateGraph();
    this.calculateHeatStandings();
  }

  ngOnDestroy() {
    if (this.viewerRaceEndedHandler) {
      this.viewerRaceEndedHandler.stopListening();
    }
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.closeDriverResultsWindows();
  }

  @HostListener("window:unload", ["$event"])
  onUnload(_event: any) {
    this.closeDriverResultsWindows();
  }

  protected openDriverResults(driverId: string) {
    if (!driverId) return;
    const url = `/driver-results/${driverId}`;
    const win = window.open(url, "_blank");
    if (win) {
      this.driverResultsWindows.push(win);
    }
  }

  private closeDriverResultsWindows() {
    this.driverResultsWindows.forEach((win) => {
      if (win && !win.closed) {
        win.close();
      }
    });
    this.driverResultsWindows = [];
  }

  exportPdf() {
    const raceName = this.race?.name || "Race";
    this.printService.print(`${raceName}-HeatResults`, true);
  }

  // TODO(aufderheide): This shouldn't be done on the client, the server should be sending us the standings already sorted.
  private calculateHeatStandings() {
    try {
      if (!this.heat || !this.heat.heatDrivers) return;
      this.heatData = [];

      const validHeatDrivers = this.heat.heatDrivers.filter((hd: any) => {
        const dName =
          hd.actualDriver?.name ?? hd.driver?.name ?? hd.driver?.driver?.name;
        const isValid =
          dName &&
          dName.trim().toLowerCase() !== "empty" &&
          dName.trim() !== "";
        return isValid;
      });

      console.log(
        `[HeatStandings] validHeatDrivers length: ${validHeatDrivers.length}`,
      );

      validHeatDrivers.forEach((heatDriver) => {
        const data = this.buildHeatExpanderData(heatDriver);
        if (data) {
          this.heatData.push(data);
          this.expandedHeats.add(heatDriver.objectId); // Default expand all
        }
      });

      // Sort by lane index
      this.heatData.sort(
        (a, b) => a.heatDriver.laneIndex - b.heatDriver.laneIndex,
      );
      console.log(
        "Heat Data successfully populated with length",
        this.heatData.length,
      );
    } catch (e) {
      console.error("ERROR in calculateHeatStandings", e);
    }
  }

  private buildHeatExpanderData(heatDriver: any): HeatExpanderData | null {
    const dName =
      heatDriver.actualDriver?.name ??
      heatDriver.driver?.name ??
      (heatDriver as any).driver?.driver?.name;
    const isSkip =
      !dName || dName.trim().toLowerCase() === "empty" || dName.trim() === "";
    console.log(
      `[HeatStandings] Loop processing driver ${heatDriver?.driver?.name}, isSkip: ${isSkip}`,
    );
    if (isSkip) return null;

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

    let foreground = "#ffffff";
    let background = "#333333";
    let name = `Lane ${heatDriver.laneIndex + 1}`;
    if (
      this.race?.track?.lanes &&
      this.race.track.lanes[heatDriver.laneIndex]
    ) {
      const lane = this.race.track.lanes[heatDriver.laneIndex];
      foreground = lane.foreground_color || foreground;
      background = lane.background_color || background;
    }
    const maxLapTime =
      heatDriver.lapsWithDetails && heatDriver.lapsWithDetails.length > 0
        ? Math.max(...heatDriver.lapsWithDetails.map((l: any) => l.time))
        : 0;

    const actual = heatDriver.actualDriver;
    const driver = heatDriver.participant?.driver;
    const team = heatDriver.participant?.team;
    let participantName = "";
    if (team) participantName = team.name;
    else if (actual) participantName = actual.nickname || actual.name;
    else if (driver) participantName = driver.nickname || driver.name;
    else
      participantName =
        heatDriver.driver?.nickname ||
        heatDriver.driver?.name ||
        (heatDriver as any).driver?.driver?.name;

    return {
      heat: this.heat!,
      heatDriver,
      row,
      laneColor: { foreground, background, name },
      maxLapTime,
      driverName: participantName,
    };
  }

  private loadRaceData() {
    this.race = this.raceService.getRace();
    this.heat = this.raceService.getCurrentHeat();
  }

  /* eslint-disable max-lines-per-function */
  protected updateGraph() {
    if (!this.heat || !this.heat.heatDrivers) return;

    this.driverLines = this.heat.heatDrivers
      .filter((hd: any) => {
        const dName =
          hd.actualDriver?.name ?? hd.driver?.name ?? hd.driver?.driver?.name;
        return (
          dName && dName.trim().toLowerCase() !== "empty" && dName.trim() !== ""
        );
      })
      .map((hd: any) => {
        const team = hd.participant?.team;
        const actual = hd.actualDriver;
        const driver = hd.participant?.driver;

        let driverName = "";
        if (team) driverName = team.name;
        else if (actual) driverName = actual.nickname || actual.name;
        else if (driver) driverName = driver.nickname || driver.name;
        else
          driverName =
            hd.driver?.nickname ||
            hd.driver?.name ||
            hd.driver?.driver?.nickname ||
            hd.driver?.driver?.name;
        const driverId =
          hd.actualDriver?.entity_id ||
          hd.driver?.entity_id ||
          hd.driver?.objectId ||
          hd.driver?.driver?.model?.entityId ||
          "";
        const lane = this.race?.track?.lanes[hd.laneIndex];
        const color = lane?.foreground_color || "#ffffff";
        const backgroundColor = lane?.background_color || "#333333";

        const laps = hd.lapTimes; // Uses our new getter
        let currentAbsoluteTime = 0;
        const points: any[] = [];

        laps.forEach((lapTime: number) => {
          currentAbsoluteTime += lapTime;
          points.push({ x: currentAbsoluteTime, y: lapTime });
        });

        return {
          objectId: hd.objectId,
          driverId,
          driverName,
          color,
          backgroundColor,
          points,
          pathData: "",
          rankPoints: [],
          rankPathData: "",
        };
      });

    // --- Compute Ranking Timeline ---
    interface ChronoEvent {
      absoluteTime: number;
      objectId: string;
    }

    const events: ChronoEvent[] = [];
    this.driverLines.forEach((line) => {
      let accum = 0;
      // Get the corresponding DriverHeatData to fetch lapTimes
      const hd = this.heat?.heatDrivers.find(
        (d) => d.objectId === line.objectId,
      );
      const laps = hd?.lapTimes || [];
      laps.forEach((lap) => {
        accum += lap;
        events.push({ absoluteTime: accum, objectId: line.objectId });
      });
    });

    events.sort((a, b) => a.absoluteTime - b.absoluteTime);

    // Track active laps completed counts
    const lapsCount: { [id: string]: number } = {};
    const lastLapTime: { [id: string]: number } = {};
    const rankingHistory: { [id: string]: any[] } = {};

    this.driverLines.forEach((line) => {
      lapsCount[line.objectId] = 0;
      lastLapTime[line.objectId] = 0;
      rankingHistory[line.objectId] = [{ x: 0, y: 0 }]; // Initial setup loaded from timeline loops
    });

    events.forEach((event) => {
      lapsCount[event.objectId]++;
      lastLapTime[event.objectId] = event.absoluteTime;

      // Score drivers: descending laps first, tiebreak with ascending total time spent completing that lap length
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
        rankingHistory[score.objectId].push({
          x: event.absoluteTime,
          y: index + 1,
          isOwnLap: score.objectId === event.objectId,
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
      const filtered: any[] = [];
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
    let allX = this.driverLines.flatMap((line) => line.points.map((p) => p.x));
    let allY = this.driverLines.flatMap((line) => line.points.map((p) => p.y));

    if (allX.length > 0) {
      this.maxX = Math.max(...allX) * 1.05; // 5% padding
      console.log(`[HeatResults] Set maxX to: ${this.maxX}`);
    } else {
      this.maxX = 10;
    }

    if (allY.length > 0) {
      this.maxY = Math.max(...allY) * 1.1; // 10% padding
    } else {
      this.maxY = 5;
    }

    this.cdr.markForCheck();
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
