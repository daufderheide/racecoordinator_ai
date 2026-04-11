import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { ManagerHeaderComponent } from "src/app/components/shared/manager-header/manager-header.component";
import { DataService } from "src/app/data.service";
import { Driver } from "src/app/models/driver";
import { Team } from "src/app/models/team";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "src/app/services/connection-monitor.service";
import { GuideStep, HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";
import { naturalSortCompare } from "src/app/utils/sorting.utils";

@Component({
  selector: "app-team-manager",
  templateUrl: "./team-manager.component.html",
  styleUrls: ["./team-manager.component.css"],
  standalone: false,
})
export class TeamManagerComponent implements OnInit, OnDestroy {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  teams: Team[] = [];
  selectedTeam?: Team;
  editingTeam?: Team;
  isLoading: boolean = true;
  isSaving: boolean = false;
  scale: number = 1;
  searchQuery: string = "";

  get filteredTeams(): Team[] {
    let filtered = this.teams;
    if (this.searchQuery && this.searchQuery.trim() !== "") {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = this.teams.filter(
        (t) => t.name && t.name.toLowerCase().includes(query),
      );
    }
    return filtered.sort((a, b) => naturalSortCompare(a.name || "", b.name || ""));
  }

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService,
    private helpService: HelpService,
    private settingsService: SettingsService,
  ) {}

  drivers: Driver[] = [];
  driversMap: Map<string, Driver> = new Map();

  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadData();
  }

  ngOnDestroy() {
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      teams: this.dataService.getTeams(),
      drivers: this.dataService.getDrivers(),
    }).subscribe({
      next: (result) => {
        const teams = result.teams;
        this.drivers = result.drivers;
        this.driversMap = new Map(this.drivers.map((d) => [d.entity_id, d]));

        this.teams = teams.map(
          (t: any) =>
            new Team(
              t.entity_id || t.entityId || "",
              t.name || "",
              t.avatarUrl || undefined,
              t.driverIds || [],
            ),
        );

        const selectedId = this.route.snapshot.queryParamMap.get("id");
        if (selectedId) {
          const found = this.teams.find((t) => t.entity_id === selectedId);
          if (found) {
            this.selectTeam(found);
          } else if (this.teams.length > 0 && !this.selectedTeam) {
            this.selectTeam(this.teams[0]);
          }
        } else if (this.teams.length > 0 && !this.selectedTeam) {
          this.selectTeam(this.teams[0]);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to load data", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("TMM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("TMM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: ".sidebar-list",
        title: this.translationService.translate("TMM_HELP_SIDEBAR_TITLE"),
        content: this.translationService.translate("TMM_HELP_SIDEBAR_CONTENT"),
        position: "right",
      },
      {
        selector: ".detail-panel",
        title: this.translationService.translate("TMM_HELP_DETAIL_TITLE"),
        content: this.translationService.translate("TMM_HELP_DETAIL_CONTENT"),
        position: "left",
      },
    ];
  }

  getDriversForTeam(team: Team): Driver[] {
    if (!team || !team.driverIds) return [];
    return team.driverIds
      .map((id) => this.driversMap.get(id))
      .filter((d): d is Driver => !!d);
  }

  selectTeam(team: Team) {
    console.log("Selecting team:", team);
    this.selectedTeam = team;
    this.editingTeam = new Team(team.entity_id, team.name, team.avatarUrl, [
      ...team.driverIds,
    ]);
  }

  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        this.isConnectionLost = state === ConnectionState.DISCONNECTED;
      });
  }

  updateTeam() {
    console.log("Update team clicked. Selected Team:", this.selectedTeam);
    if (!this.selectedTeam) return;
    console.log("Navigating to editor with ID:", this.selectedTeam.entity_id);
    this.router.navigate(["/team-editor"], {
      queryParams: { id: this.selectedTeam.entity_id },
    });
  }

  createNewTeam() {
    if (this.isSaving) return;
    this.isSaving = true;

    const baseName = this.translationService.translate("TMM_DEFAULT_TEAM_NAME");
    const uniqueName = this.generateUniqueTeamName(baseName);

    const newTeam = {
      name: uniqueName,
      driverIds: [],
      avatarUrl: undefined,
    };

    this.dataService.createTeam(newTeam).subscribe({
      next: (createdTeam: any) => {
        this.isSaving = false;
        this.router.navigate(["/team-editor"], {
          queryParams: { id: createdTeam.entity_id },
        });
      },
      error: (err: any) => {
        console.error("Failed to create new team", err);
        this.isSaving = false;
      },
    });
  }

  private generateUniqueTeamName(baseName: string): string {
    let name = baseName;
    if (!this.teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      return name;
    }
    let counter = 1;
    while (true) {
      const candidate = `${baseName}_${counter}`;
      if (
        !this.teams.some(
          (t) => t.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  showDeleteConfirmation = false;

  deleteTeam() {
    if (!this.editingTeam) return;
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete() {
    if (!this.editingTeam) return;
    this.showDeleteConfirmation = false;
    this.isSaving = true;
    this.dataService.deleteTeam(this.editingTeam.entity_id).subscribe({
      next: () => {
        this.selectedTeam = undefined;
        this.editingTeam = undefined;
        this.isSaving = false;
        this.loadData();
      },
      error: (err) => {
        console.error("Failed to delete team", err);
        this.isSaving = false;
      },
    });
  }

  onCancelDelete() {
    this.showDeleteConfirmation = false;
  }

  trackByTeam(index: number, team: Team): string {
    return team.entity_id;
  }
}
