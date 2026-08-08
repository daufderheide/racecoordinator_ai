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
import { Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { DataService } from "@app/data.service";
import {
  Season,
  SeasonStandingDetail,
  SeasonStandingItem,
} from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

@Component({
  standalone: true,
  selector: "app-season-manager",
  templateUrl: "./season-manager.component.html",
  styleUrls: ["./season-manager.component.css"],
  imports: [
    ManagerHeaderComponent,
    ConfirmationModalComponent,
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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  private navigationService = inject(NavigationService);
  private settingsService = inject(SettingsService);
  private connectionMonitor = inject(ConnectionMonitorService);

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
    this.dataService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
        this.isLoading = false;

        const targetId = this.route.snapshot.queryParams["id"];
        if (targetId) {
          const match = this.seasons.find((s) => s.entity_id === targetId);
          if (match) {
            this.selectSeason(match);
          } else if (this.seasons.length > 0) {
            this.selectSeason(this.seasons[0]);
          }
        } else if (this.seasons.length > 0 && !this.selectedSeason) {
          this.selectSeason(this.seasons[0]);
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
    this.calculateStandings(season);
    this.cdr.detectChanges();
  }

  calculateStandings(season: Season): void {
    if (!season || !season.races || season.races.length === 0) {
      this.standings = [];
      return;
    }

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
      const drops = season.drops || 0;
      const racesRun = scores.length;

      if (racesRun > drops && drops > 0) {
        // Sort copy to find lowest scores to drop
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
}
