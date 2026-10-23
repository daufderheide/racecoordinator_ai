import { CommonModule, DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";
import { AddLapSectionsDialogComponent } from "@app/components/raceday/components/add-lap-sections-dialog/add-lap-sections-dialog.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import {
  PdfExportDialogComponent,
  PdfExportOptions,
} from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { TwinGraphsComponent } from "@app/components/shared/twin-graphs/twin-graphs.component";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import {
  AllowFinish,
  FinishMethod,
  HeatRanking,
} from "@app/models/heat_scoring";
import { getOverallScoreFormat } from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { isAtLeast, Role } from "@app/models/role";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IRecordData, IRecordEntry } from "@app/proto/antigravity";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { RaceTimeService } from "@app/services/race-time.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { saveFileAs } from "@app/utils/file-download.utils";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

import {
  DriverLine,
  GraphPoint,
  NEON_COLORS,
  StandingsRow,
} from "./race-results.types";

@Component({
  standalone: true,
  selector: "app-default-race-results",
  templateUrl: "./default-race-results.component.html",
  styleUrls: ["./default-race-results.component.css"],
  imports: [
    TwinGraphsComponent,
    CommonModule,
    DecimalPipe,
    TranslatePipe,
    LocalDatePipe,
    AvatarUrlPipe,
    RouterModule,
    AcknowledgementModalComponent,
    PdfExportDialogComponent,
    BrowserNavigationComponent,
    AddLapSectionsDialogComponent,
  ],
})
export class DefaultRaceResultsComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  protected viewerRaceEndedHandler!: ViewerRaceEndedHandler;
  protected HeatRanking = HeatRanking;

  showPdfExportDialog = false;
  defaultIncludeBackground = true;
  showAddLapSectionsDialog = false;

  get canEdit(): boolean {
    return isAtLeast(this.authService.currentRole, Role.DIRECTOR);
  }

  get heats(): Heat[] {
    return this.raceService.getHeats() || [];
  }

  get isReviewingPastRace(): boolean {
    return Boolean((this.race as any)?.historyRecordId);
  }

  exitReview(): void {
    sessionStorage.setItem("skipIntro", "true");
    this.router.navigate(["/"]);
  }

  navigateToHeatResults(): void {
    this.router.navigate(["/heat-results"]);
  }

  openAddLapSections(): void {
    this.showAddLapSectionsDialog = true;
    this.cdr.markForCheck();
  }

  onAddLapSectionsConfirm(event: any): void {
    if (event?.isBatch && event.updates) {
      const histId = (this.race as any)?.historyRecordId;
      const isDemo = Boolean((this.race as any)?.is_demo);
      if (histId) {
        this.dataService
          .updateHistoryLapSections(histId, event.updates, isDemo)
          .subscribe(() => {
            this.showAddLapSectionsDialog = false;
            this.cdr.markForCheck();
          });
      } else {
        this.dataService.updateBatchUserLaps(event.updates).subscribe(() => {
          this.showAddLapSectionsDialog = false;
          this.cdr.markForCheck();
        });
      }
    } else {
      this.showAddLapSectionsDialog = false;
    }
  }

  async exportCsv(): Promise<void> {
    try {
      const histId = (this.race as any)?.historyRecordId;
      const isDemo = Boolean((this.race as any)?.is_demo);
      const csvData = histId
        ? await firstValueFrom(
            this.dataService.exportRaceHistoryToCsv(histId, isDemo),
          )
        : await firstValueFrom(this.dataService.exportRaceToCsv());

      if (!csvData || csvData.trim().length === 0) return;

      const timeStr = this.printService.formatExportTimestamp(new Date());
      const raceName = (this.race?.name || "Race").replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      );
      const suggestedName = `${raceName}-RaceResults${timeStr}.csv`;

      await saveFileAs({
        suggestedName,
        data: csvData,
        mimeType: "text/csv;charset=utf-8",
        description: "CSV Files",
        extension: ".csv",
      });
    } catch (e) {
      console.error("Failed to export CSV", e);
    }
  }

  protected getGridColumns(): string {
    const baseColumns =
      "80px 80px 200px 100px 90px 120px 120px 120px 120px 120px 120px";
    const numLanes = this.race?.track?.lanes?.length || 0;
    if (numLanes > 0) {
      return baseColumns + " " + Array(numLanes).fill("110px").join(" ");
    }
    return baseColumns;
  }

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

  scale = 1;
  protected participants: RaceParticipant[] = [];
  protected race?: Race;
  protected standingsRows: StandingsRow[] = [];
  protected driverLines: DriverLine[] = [];
  protected recordData: IRecordData | null = null;
  private subscriptions: Subscription[] = [];
  private fallbackRaceStartTime: Date = new Date();

  get raceStartTime(): Date {
    const millis =
      (this.race as any)?.start_time_millis ||
      (this.race as any)?.startTimeMillis;
    if (millis && Number(millis) > 0) {
      return new Date(Number(millis));
    }
    return this.fallbackRaceStartTime;
  }

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

  private driverResultsWindows: Window[] = [];
  protected isPrinting = false;

  @HostListener("window:beforeprint")
  onBeforePrint() {
    this.isPrinting = true;
    this.standingsRows.sort((a, b) => a.visualIndex - b.visualIndex);
    this.cdr.detectChanges();
  }

  @HostListener("window:afterprint")
  onAfterPrint() {
    this.isPrinting = false;
    this.standingsRows.sort((a, b) =>
      this.getDriverKey(a.driver).localeCompare(this.getDriverKey(b.driver)),
    );
    this.cdr.detectChanges();
  }

  protected openDriverResults(driverId: string, event: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!driverId) return;
    const url = `/driver-results/${driverId}`;
    const win = window.open(url, "_blank");
    if (win) {
      this.driverResultsWindows.push(win);
    }
  }

  protected getDriverKey(d: any): string {
    const id = this.getDriverId(d);
    if (id) return id;
    return (d?.nickname || d?.name || d?.model?.name || "")
      .trim()
      .toLowerCase();
  }

  protected getDriverFromHeatDriver(d: any): any {
    if (!d) return null;
    if (d.participant?.driver) return d.participant.driver;
    if (d.driver) {
      if (d.driver.driver) return d.driver.driver; // d.driver is RaceParticipant
      return d.driver; // d.driver is Driver
    }
    if (d.actualDriver) return d.actualDriver;
    return null;
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

  get currentFlagUrl(): string {
    return this.raceFlagService.getCurrentFlagUrl();
  }

  get formattedTime(): string {
    return this.raceTimeService.formattedTime;
  }

  get totalHeats(): number {
    return this.raceService.getHeats()?.length || 0;
  }

  get currentHeatNumber(): number | undefined {
    return this.raceService.getCurrentHeat()?.heatNumber;
  }

  constructor(
    private raceConnectionService: RaceConnectionService,
    private raceService: RaceService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private printService: PrintService,
    private raceFlagService: RaceFlagService,
    private raceTimeService: RaceTimeService,
  ) {}

  ngOnInit() {
    this.viewerRaceEndedHandler = new ViewerRaceEndedHandler(
      this.dataService,
      this.authService,
      this.cdr,
      { onlyForViewer: true },
    );
    this.viewerRaceEndedHandler.startListening();

    this.updateScale();
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.translationService.getCurrentLanguage().subscribe(() => {
        this.updateGraph();
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceFlagService.currentFlagUrl$.subscribe(() => {
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceTimeService.formattedTime$.subscribe(() => {
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
          this.fallbackRaceStartTime = new Date();
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
    if (this.viewerRaceEndedHandler) {
      this.viewerRaceEndedHandler.stopListening();
    }
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.closeDriverResultsWindows();
  }

  @HostListener("window:pagehide", ["$event"])
  onPageHide(_event: any) {
    this.raceConnectionService.disconnect();
    this.closeDriverResultsWindows();
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
    this.defaultIncludeBackground =
      this.settingsService.getSettings().exportPdfBackgrounds ?? true;
    this.showPdfExportDialog = true;
  }

  onPdfExportConfirm(options: PdfExportOptions) {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
    if (options.saveAsDefault) {
      const settings = this.settingsService.getSettings();
      settings.exportPdfBackgrounds = options.includeBackground;
      this.settingsService.saveSettings(settings);
    }
    const raceName = this.race?.name || "Race";
    this.printService.print(
      `${raceName}-RaceResults`,
      true,
      this.raceStartTime,
      options.includeBackground,
    );
  }

  onPdfExportCancel() {
    this.showPdfExportDialog = false;
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
    return this.getLaneBackgroundColor(index);
  }

  protected getLaneBackgroundColor(index: number): string {
    if (this.race?.track?.lanes && index < this.race.track.lanes.length) {
      return (
        this.race.track.lanes[index].background_color ||
        NEON_COLORS[index % NEON_COLORS.length].color
      );
    }
    return NEON_COLORS[index % NEON_COLORS.length].color;
  }

  protected getLaneForegroundColor(index: number): string {
    if (this.race?.track?.lanes && index < this.race.track.lanes.length) {
      const fg = this.race.track.lanes[index].foreground_color;
      if (fg) return fg;
    }
    return "#ffffff";
  }

  protected getHolderDisplay(entry: IRecordEntry | null | undefined): string {
    if (!entry) return "---";
    return entry.holderNickname || entry.holderName || "---";
  }

  get currentScale(): number {
    if (this.isPrinting) {
      const numLanes = this.race?.track?.lanes?.length || 0;
      const baseColumnsWidth = 1270;
      const laneColumnsWidth = numLanes * 110;
      const paddingWidth = 30; // padding of wrapper
      const gridWidth = baseColumnsWidth + laneColumnsWidth + paddingWidth;
      const availableWidth = 1920 - 80;
      if (gridWidth > availableWidth) {
        return availableWidth / gridWidth;
      }
      return 1;
    }
    return this.scale;
  }

  private updateScale() {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
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

    const laneCount = this.race?.track?.lanes?.length || 0;
    const rankingMethod = this.race?.heat_scoring?.heatRanking;

    const heats = this.raceService.getHeats() || [];
    const currentHeat = this.raceService.getCurrentHeat();

    // Merge completed heats with the current (live) heat, deduplicating by objectId
    const heatMap = new Map<string, Heat>();
    heats.forEach((h) => heatMap.set(h.objectId, h));
    if (currentHeat) {
      heatMap.set(currentHeat.objectId, currentHeat);
    }
    const allHeats = Array.from(heatMap.values());

    this.standingsRows = sorted.map((curr, i) => {
      let gap1st: number | null = curr.gapLeader ?? 0;
      let gapAhead: number | null = curr.gapPosition ?? 0;

      const laneScores: (number | null)[] = Array(laneCount).fill(null);

      allHeats.forEach((heat) => {
        const hd = heat.heatDrivers.find((d) => {
          if (!d) return false;
          const dDriver = this.getDriverFromHeatDriver(d);
          return (
            dDriver &&
            this.getDriverKey(dDriver) === this.getDriverKey(curr.driver)
          );
        });

        if (hd) {
          const laneIndex = hd.laneIndex;
          if (laneIndex >= 0 && laneIndex < laneCount) {
            let score = 0;
            if (rankingMethod === HeatRanking.HR_FASTEST_LAP) {
              score = hd.bestLapTime;
            } else if (rankingMethod === HeatRanking.HR_TOTAL_TIME) {
              score = hd.totalTime;
            } else {
              // HR_LAP_COUNT
              score = hd.lapCount;
            }

            if (laneScores[laneIndex] === null) {
              laneScores[laneIndex] = score;
            } else {
              if (rankingMethod === HeatRanking.HR_FASTEST_LAP) {
                laneScores[laneIndex] = Math.min(laneScores[laneIndex]!, score);
              } else {
                laneScores[laneIndex]! += score;
              }
            }
          }
        }
      });

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
        laneScores,
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

  protected updateGraph() {
    if (!this.standingsRows || this.standingsRows.length === 0) {
      this.driverLines = [];
      return;
    }

    const sortedHeats = this.getSortedAllHeats();
    const stableKeys = this.getStableDriverKeys();
    this.driverLines = this.buildDriverLines(sortedHeats, stableKeys);
    this.computeRankingTimeline(sortedHeats);
    this.computeGraphScalingAndLayout();
  }

  private getSortedAllHeats(): Heat[] {
    const heats = this.raceService.getHeats() || [];
    const currentHeat = this.raceService.getCurrentHeat();
    const heatMap = new Map<string, Heat>();
    heats.forEach((h) => heatMap.set(h.objectId, h));
    if (currentHeat) {
      heatMap.set(currentHeat.objectId, currentHeat);
    }
    return Array.from(heatMap.values()).sort(
      (a, b) => a.heatNumber - b.heatNumber,
    );
  }

  private getStableDriverKeys(): string[] {
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

    return stableParticipants
      .map((p) => this.getDriverKey(p?.driver))
      .filter((key) => !!key);
  }

  private buildDriverLines(
    sortedHeats: Heat[],
    stableKeys: string[],
  ): DriverLine[] {
    const getNeonColor = (key: string) => {
      const idx = stableKeys.indexOf(key);
      if (idx === -1) return NEON_COLORS[0];
      return NEON_COLORS[idx % NEON_COLORS.length];
    };

    const lines = this.standingsRows.map((row) => {
      const driver = row.driver;
      const driverName = driver.nickname || driver.name;
      const driverKey = this.getDriverKey(driver);
      const palette = getNeonColor(driverKey);

      const points: GraphPoint[] = [];
      let currentAbsoluteTime = 0;

      sortedHeats.forEach((heat) => {
        const hd = heat.heatDrivers.find((d) => {
          if (!d) return false;
          const dDriver = this.getDriverFromHeatDriver(d);
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

    lines.sort((a, b) => {
      const idxA = stableKeys.indexOf(a.objectId);
      const idxB = stableKeys.indexOf(b.objectId);
      return idxA - idxB;
    });

    return lines;
  }

  private computeRankingTimeline(sortedHeats: Heat[]): void {
    const events = this.buildChronoEvents(sortedHeats);
    const rankingHistory = this.buildRankingHistory(events);
    this.assignRankingPoints(rankingHistory);
  }

  private buildChronoEvents(
    sortedHeats: Heat[],
  ): Array<{ absoluteTime: number; objectId: string }> {
    const events: Array<{ absoluteTime: number; objectId: string }> = [];
    this.driverLines.forEach((line) => {
      let accum = 0;
      sortedHeats.forEach((heat) => {
        const hd = heat.heatDrivers.find((d) => {
          if (!d) return false;
          const dDriver = this.getDriverFromHeatDriver(d);
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
    return events.sort((a, b) => a.absoluteTime - b.absoluteTime);
  }

  private buildRankingHistory(
    events: Array<{ absoluteTime: number; objectId: string }>,
  ): { [id: string]: GraphPoint[] } {
    const lapsCount: { [id: string]: number } = {};
    const lastLapTime: { [id: string]: number } = {};
    const rankingHistory: { [id: string]: GraphPoint[] } = {};

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

    return rankingHistory;
  }

  private assignRankingPoints(rankingHistory: {
    [id: string]: GraphPoint[];
  }): void {
    this.driverLines.forEach((line) => {
      const history = rankingHistory[line.objectId] || [];
      if (history.length > 1 && history[0].x === 0 && history[0].y === 0) {
        history[0].y = history[1].y;
      }

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
  }

  private computeGraphScalingAndLayout(): void {
    const allX = this.driverLines.flatMap((line) =>
      line.points.map((p) => p.x),
    );
    const allY = this.driverLines.flatMap((line) =>
      line.points.map((p) => p.y),
    );

    this.maxX = allX.length > 0 ? Math.max(...allX) * 1.05 : 10;
    this.maxY = allY.length > 0 ? Math.max(...allY) * 1.1 : 5;

    if (this.maxX <= 0) this.maxX = 10;
    if (this.maxY <= 0) this.maxY = 5;

    const itemsPerRow = 6;
    const legendItemWidth = 180;
    const legendItemHeight = 35;
    const N = this.driverLines.length;
    const rowCount = Math.max(1, Math.ceil(N / itemsPerRow));
    const delta = (rowCount - 1) * legendItemHeight;

    this.height = 750 + delta;
    this.padding.bottom = 150 + delta;

    this.driverLines.forEach((line, i) => {
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
