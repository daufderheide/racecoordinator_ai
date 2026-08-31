import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, of, Subscription } from "rxjs";
import { catchError } from "rxjs/operators";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { SeasonSummaryComponent } from "@app/components/shared/season-summary/season-summary.component";
import { DataService } from "@app/data.service";
import { Season, SeasonStandingItem } from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { calculateSeasonStandings } from "@app/utils/season.utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

@Component({
  standalone: true,
  selector: "app-season-manager",
  templateUrl: "./season-manager.component.html",
  styleUrls: ["./season-manager.component.css"],
  imports: [
    ManagerHeaderComponent,
    ConfirmationModalComponent,
    SeasonSummaryComponent,
    TranslatePipe,
    FormsModule,
  ],
})
export class SeasonManagerComponent implements OnInit, OnDestroy {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  seasons: Season[] = [];
  selectedSeason?: Season;
  standings: SeasonStandingItem[] = [];
  isLoading: boolean = true;
  isSaving: boolean = false;
  scale: number = 1;
  searchQuery: string = "";
  isConnectionLost: boolean = false;
  showDeleteConfirmation: boolean = false;

  @ViewChildren("seasonRow") seasonRows!: QueryList<ElementRef>;

  get hasDemoRaces(): boolean {
    if (!this.selectedSeason || !this.selectedSeason.races) return false;
    return this.selectedSeason.races.some((r) => Boolean(r.is_demo));
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  private navigationService = inject(NavigationService);
  private settingsService = inject(SettingsService);
  private connectionMonitor = inject(ConnectionMonitorService);
  private translationService = inject(TranslationService);

  private connectionSub?: Subscription;

  get filteredSeasons(): Season[] {
    let filtered = this.seasons;
    if (this.searchQuery && this.searchQuery.trim() !== "") {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = this.seasons.filter(
        (s) => s.name && s.name.toLowerCase().includes(query),
      );
    }
    return filtered.sort((a, b) =>
      naturalSortCompare(a.name || "", b.name || ""),
    );
  }

  ngOnInit(): void {
    this.updateScale();
    this.loadData();

    this.connectionSub = this.connectionMonitor.connectionState$.subscribe(
      (state) => {
        if (state === ConnectionState.DISCONNECTED) {
          this.logger.warn("Connection lost in SeasonManagerComponent");
          this.isConnectionLost = true;
        } else {
          this.isConnectionLost = false;
        }
        this.cdr.detectChanges();
      },
    );
  }

  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateScale();
  }

  private updateScale(): void {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.dataService.getSeasons().pipe(catchError(() => of([]))),
      this.dataService
        .getAllFinishedRaceHistory()
        .pipe(catchError(() => of([]))),
    ]).subscribe({
      next: ([seasons, history]) => {
        this.seasons = (seasons || []).sort((a, b) =>
          naturalSortCompare(a.name || "", b.name || ""),
        );
        const demoHistorySet = new Set<string>();

        if (Array.isArray(history)) {
          for (const item of history) {
            const isDemo = Boolean(
              item.is_demo ||
              item.isDemo ||
              item.demo ||
              item.isDemoMode ||
              (item.model && (item.model.demoMode || item.model.isDemoMode)),
            );
            if (isDemo) {
              const raceId =
                item.original_entity_id || item.model?.entity_id || item._id;
              const timestamp =
                item.statistics?.startMillis ||
                item.timestamp ||
                (item.id?.timestamp ? item.id.timestamp * 1000 : 0);
              if (raceId) demoHistorySet.add(String(raceId));
              if (timestamp) demoHistorySet.add(String(timestamp));
              if (raceId && timestamp)
                demoHistorySet.add(`${raceId}_${timestamp}`);
            }
          }
        }

        for (const s of this.seasons) {
          if (!s || !s.races) continue;
          for (const r of s.races) {
            const raceId = r.race_id;
            const timestamp = r.timestamp;
            const isDemo = Boolean(
              r.is_demo ||
              demoHistorySet.has(String(raceId)) ||
              demoHistorySet.has(String(timestamp)) ||
              demoHistorySet.has(`${raceId}_${timestamp}`) ||
              String(raceId).startsWith("demo_"),
            );
            r.is_demo = isDemo;
          }
        }

        this.isLoading = false;

        const lastEdited = this.navigationService.getLastEditedId("season");
        const savedSettingId =
          this.settingsService.getSettings().selectedSeasonId;
        let targetId =
          this.route.snapshot.queryParams["id"] ||
          this.route.snapshot.queryParams["selectedId"];

        if (lastEdited) {
          targetId = lastEdited;
          this.navigationService.clearLastEditedId("season");
          this.router.navigate([], {
            queryParams: { id: lastEdited },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        } else if (!targetId && savedSettingId) {
          targetId = savedSettingId;
        }

        if (targetId) {
          const match = this.seasons.find((s) => s.entity_id === targetId);
          if (match) {
            this.selectSeason(match);
          } else if (this.seasons.length > 0) {
            this.selectSeason(this.filteredSeasons[0] || this.seasons[0]);
          }
        } else if (this.seasons.length > 0 && !this.selectedSeason) {
          this.selectSeason(this.filteredSeasons[0] || this.seasons[0]);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load seasons", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectSeason(season: Season): void {
    this.selectedSeason = season;
    if (season && season.entity_id) {
      const settings = this.settingsService.getSettings();
      settings.selectedSeasonId = season.entity_id;
      this.settingsService.saveSettings(settings);
    }
    this.calculateStandings(season);
    if (season && season.entity_id) {
      this.dataService.getSeasonStandings(season.entity_id).subscribe({
        next: (standings) => {
          if (this.selectedSeason?.entity_id === season.entity_id) {
            this.standings = standings;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.logger.warn("Failed to fetch season standings from server", err);
        },
      });
    }
    this.cdr.detectChanges();
  }

  calculateStandings(season: Season): void {
    this.standings = calculateSeasonStandings(season);
  }

  onNew(): void {
    this.router.navigate(["/season-editor"]);
  }

  onEdit(): void {
    if (this.selectedSeason) {
      this.router.navigate(["/season-editor"], {
        queryParams: { id: this.selectedSeason.entity_id },
      });
    }
  }

  onDelete(): void {
    if (this.selectedSeason) {
      this.showDeleteConfirmation = true;
    }
  }

  confirmDelete(): void {
    if (!this.selectedSeason || !this.selectedSeason.entity_id) return;
    this.isSaving = true;
    this.dataService.deleteSeason(this.selectedSeason.entity_id).subscribe({
      next: () => {
        this.isSaving = false;
        this.showDeleteConfirmation = false;
        this.selectedSeason = undefined;
        this.loadData();
      },
      error: (err) => {
        this.logger.error("Failed to delete season", err);
        this.isSaving = false;
        this.showDeleteConfirmation = false;
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  onBack(): void {
    this.router.navigate(["/raceday-setup"]);
  }

  getHelpSteps(): GuideStep[] {
    const demoStep: GuideStep = this.hasDemoRaces
      ? {
          selector: "#season-detail-demo-badge",
          title: this.translationService.translate("SM_HELP_DEMO_BADGE_TITLE"),
          content: this.translationService.translate(
            "SM_HELP_DEMO_BADGE_PRESENT_CONTENT",
          ),
          position: "bottom",
        }
      : {
          selector: "#season-detail-meta",
          title: this.translationService.translate("SM_HELP_DEMO_BADGE_TITLE"),
          content: this.translationService.translate(
            "SM_HELP_DEMO_BADGE_ABSENT_CONTENT",
          ),
          position: "bottom",
        };

    return [
      {
        title: this.translationService.translate("SM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("SM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: "#season-list-container",
        title: this.translationService.translate("SM_HELP_LIST_TITLE"),
        content: this.translationService.translate("SM_HELP_LIST_CONTENT"),
        position: "right",
      },
      {
        selector: "#season-search-bar",
        title: this.translationService.translate("SM_HELP_SEARCH_TITLE"),
        content: this.translationService.translate("SM_HELP_SEARCH_CONTENT"),
        position: "right",
      },
      {
        selector: "#season-detail-name",
        title: this.translationService.translate("SM_HELP_NAME_TITLE"),
        content: this.translationService.translate("SM_HELP_NAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#season-detail-drops",
        title: this.translationService.translate("SM_HELP_DROPS_TITLE"),
        content: this.translationService.translate("SM_HELP_DROPS_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#season-detail-races",
        title: this.translationService.translate("SM_HELP_RACES_RUN_TITLE"),
        content: this.translationService.translate("SM_HELP_RACES_RUN_CONTENT"),
        position: "bottom",
      },
      demoStep,
      {
        selector: "#season-detail-standings",
        title: this.translationService.translate("SM_HELP_STANDINGS_TITLE"),
        content: this.translationService.translate("SM_HELP_STANDINGS_CONTENT"),
        position: "left",
      },
    ];
  }
}
