import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import {
  PdfExportDialogComponent,
  PdfExportOptions,
} from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { DataService } from "@app/data.service";
import {
  Season,
  SeasonStandingDetail,
  SeasonStandingItem,
} from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-default-season-results",
  templateUrl: "./default-season-results.component.html",
  styleUrls: ["./default-season-results.component.css"],
  imports: [CommonModule, TranslatePipe, DatePipe, PdfExportDialogComponent],
})
export class DefaultSeasonResultsComponent implements OnInit, OnDestroy {
  season: Season | null = null;
  standings: SeasonStandingItem[] = [];
  expandedRaceIds: Set<string> = new Set<string>();

  isLoading = true;
  scale = 1;

  showPdfExportDialog = false;
  defaultIncludeBackground = true;

  private subscriptions: Subscription = new Subscription();
  private targetSeasonId: string | null = null;

  constructor(
    @Inject(DataService) private dataService: DataService,
    @Inject(RaceConnectionService)
    private raceConnectionService: RaceConnectionService,
    @Inject(RaceService) private raceService: RaceService,
    @Inject(SettingsService) private settingsService: SettingsService,
    @Inject(TranslationService)
    private translationService: TranslationService,
    @Inject(PrintService) private printService: PrintService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    @Inject(ActivatedRoute) private route: ActivatedRoute,
    @Inject(LoggerService) private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.updateScale();

    if (typeof this.raceConnectionService?.connect === "function") {
      this.raceConnectionService.connect();
    }

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((paramMap) => {
        const queryId = paramMap.get("id");
        if (queryId) {
          this.targetSeasonId = queryId;
        }
        this.loadSeasonData();
      }),
    );

    this.subscriptions.add(
      this.raceService.selectedRace$.subscribe((race) => {
        if (!this.targetSeasonId && race) {
          const raceSeasonId =
            (race as any).season_id || (race as any).seasonId;
          if (raceSeasonId) {
            this.targetSeasonId = raceSeasonId;
          }
        }
        this.loadSeasonData();
      }),
    );

    this.subscriptions.add(
      this.raceService.heats$.subscribe(() => {
        this.loadSeasonData();
      }),
    );
  }

  ngOnDestroy(): void {
    if (typeof this.raceConnectionService?.disconnect === "function") {
      this.raceConnectionService.disconnect(true);
    }
    this.subscriptions.unsubscribe();
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateScale();
  }

  private updateScale(): void {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  loadSeasonData(): void {
    const currentRace = this.raceService.getRace();
    const raceSeasonId = currentRace
      ? (currentRace as any).season_id || (currentRace as any).seasonId
      : null;

    let searchId = this.targetSeasonId || raceSeasonId;
    if (!searchId) {
      const savedSettingId =
        this.settingsService.getSettings()?.selectedSeasonId;
      searchId = savedSettingId || null;
    }

    this.dataService.getSeasons().subscribe({
      next: (seasons) => {
        if (!seasons || seasons.length === 0) {
          this.season = null;
          this.standings = [];
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        let target: Season | undefined;
        if (searchId) {
          target = seasons.find((s) => s.entity_id === searchId);
        }

        if (!target && seasons.length > 0) {
          target = seasons[0];
        }

        if (target) {
          this.season = JSON.parse(JSON.stringify(target));
          this.calculateStandings();
        } else {
          this.season = null;
          this.standings = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load seasons for Season Results", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get hasDemoRaces(): boolean {
    if (!this.season || !this.season.races) return false;
    return this.season.races.some((r) => Boolean(r.is_demo));
  }

  calculateStandings(): void {
    const season = this.season;
    if (!season || !season.races || season.races.length === 0) {
      this.standings = [];
      return;
    }

    // Sort races by date run (oldest to most recent)
    season.races.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const driverMap = new Map<
      string,
      { driver_name: string; scores: SeasonStandingDetail[] }
    >();

    for (const race of season.races) {
      if (!race.driver_results) continue;
      for (const res of race.driver_results) {
        let entry = driverMap.get(res.driver_id);
        if (!entry) {
          entry = { driver_name: res.driver_name, scores: [] };
          driverMap.set(res.driver_id, entry);
        }
        entry.scores.push({
          race_id: race.race_id,
          race_name: race.race_name,
          overall_rank: res.overall_rank,
          overall_points: res.overall_points,
          heat_points: res.heat_points,
          total_points: res.total_points,
          is_dropped: false,
        });
      }
    }

    const result: SeasonStandingItem[] = [];

    driverMap.forEach((entry, driverId) => {
      const scores = entry.scores;
      const drops = Number(season.drops) || 0;
      const racesRun = scores.length;

      if (racesRun > drops && drops > 0) {
        const sortedIndices = scores
          .map((s, idx) => ({ total: s.total_points, idx }))
          .sort((a, b) => a.total - b.total);

        for (let i = 0; i < drops; i++) {
          scores[sortedIndices[i].idx].is_dropped = true;
        }
      }

      let net = 0;
      let gross = 0;
      for (const s of scores) {
        gross += s.total_points;
        if (!s.is_dropped) {
          net += s.total_points;
        }
      }

      result.push({
        driver_id: driverId,
        driver_name: entry.driver_name,
        net_points: net,
        gross_points: gross,
        races_run: racesRun,
        race_scores: scores,
      });
    });

    result.sort((a, b) => {
      if (b.net_points !== a.net_points) return b.net_points - a.net_points;
      if (b.gross_points !== a.gross_points)
        return b.gross_points - a.gross_points;
      return b.races_run - a.races_run;
    });

    this.standings = result;
  }

  toggleRaceExpanded(raceId: string): void {
    if (this.expandedRaceIds.has(raceId)) {
      this.expandedRaceIds.delete(raceId);
    } else {
      this.expandedRaceIds.add(raceId);
    }
    this.cdr.detectChanges();
  }

  isRaceExpanded(raceId: string): boolean {
    return this.expandedRaceIds.has(raceId);
  }

  exportPdf(): void {
    this.defaultIncludeBackground =
      this.settingsService.getSettings()?.exportPdfBackgrounds ?? true;
    this.showPdfExportDialog = true;
    this.cdr.detectChanges();
  }

  onPdfExportConfirm(options: PdfExportOptions): void {
    this.showPdfExportDialog = false;
    if (options.saveAsDefault) {
      const settings = this.settingsService.getSettings();
      settings.exportPdfBackgrounds = options.includeBackground;
      this.settingsService.saveSettings(settings);
    }
    const seasonName = this.season?.name || "Season";
    this.printService.print(
      `${seasonName}-SeasonResults`,
      true,
      undefined,
      options.includeBackground,
    );
    this.cdr.detectChanges();
  }

  onPdfExportCancel(): void {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
  }
}
