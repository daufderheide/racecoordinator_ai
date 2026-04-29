import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
  ɵɵCdkScrollable,
} from "@angular/cdk/drag-drop";
import { NgClass } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  output,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { DemoConfigModalComponent } from "@app/components/shared/demo-config-modal/demo-config-modal.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { ToolbarComponent as ToolbarComponent_1 } from "@app/components/shared/toolbar/toolbar.component";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IDemoConfig } from "@app/proto/antigravity";
import { FileSystemService } from "@app/services/file-system.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

type Participant = Driver | Team;

@Component({
  standalone: true,
  selector: "app-default-raceday-setup",
  templateUrl: "./default-raceday-setup.component.html",
  styleUrl: "./default-raceday-setup.component.css",
  imports: [
    ToolbarComponent_1,
    ɵɵCdkScrollable,
    CdkDropList,
    CdkDrag,
    CdkDragPreview,
    FormsModule,
    NgClass,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    DemoConfigModalComponent,
    TranslatePipe,
  ],
})
export class DefaultRacedaySetupComponent implements OnInit {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  requestServerConfig = output<void>();
  @ViewChild("scrollContainer") scrollContainer?: ElementRef;

  // Driver/Team State
  selectedParticipants: Participant[] = [];
  unselectedParticipants: Participant[] = [];

  imageErrors = new Set<string>();

  // Search State
  driverSearchQuery: string = "";
  raceSearchQuery: string = "";

  // Race State
  races: Race[] = [];
  selectedRace?: Race;
  quickStartRaces: Race[] = [];

  // UI State
  scale: number = 1;
  translationsLoaded: boolean = false;
  isDropdownOpen: boolean = false;
  isOptionsDropdownOpen: boolean = false;
  isFileDropdownOpen: boolean = false;
  showLoadRaceModal: boolean = false;
  showAutoSavePrompt: boolean = false;
  autoSaveFileToLoad: string | null = null;
  pendingIsDemo: boolean = false;
  savedRaces: string[] = [];
  selectedSavedRace: string | null = null;
  public isRefreshingList: boolean = false;
  public showWelcomeMessage: boolean = true;

  // Conflict Error Modal
  showErrorModal: boolean = false;
  errorTitle: string = "";
  errorMessage: string = "";
  errorMessageParams: any = {};

  // Demo Config State
  showDemoConfigModal: boolean = false;
  demoConfig?: IDemoConfig;

  // Modals
  public isAboutModalVisible = false;

  isLocalizationDropdownOpen: boolean = false;
  isConfigDropdownOpen: boolean = false;
  isHelpDropdownOpen: boolean = false;
  isLogDropdownOpen: boolean = false;
  isClientLogOpen: boolean = false;
  isServerLogOpen: boolean = false;
  isCustomUIPanelOpen: boolean = false;

  supportedLanguages: { code: string; nameKey: string }[] = [];
  logLevels = ["DEBUG", "INFO", "WARN", "ERROR"];
  currentLanguage: string = "";
  currentClientLogLevel: string = "INFO";
  currentServerLogLevel: string = "INFO";
  menuItems = [
    {
      label: "RDS_MENU_FILE",
      action: (event: MouseEvent) => this.toggleFileDropdown(event),
    },
    {
      label: "RDS_MENU_CONFIG",
      action: (event: MouseEvent) => this.toggleConfigDropdown(event),
    },
    {
      label: "RDS_MENU_OPTIONS",
      action: (event: MouseEvent) => this.toggleOptionsDropdown(event),
    },
    {
      label: "RDS_MENU_CUMULATIVE_RESULTS",
      action: (event: MouseEvent) => this.openCumulativeResults(),
    },
    {
      label: "RDS_MENU_HELP",
      action: (event: MouseEvent) => this.toggleHelpDropdown(event),
    },
  ];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private raceService: RaceService,
    private router: Router,
    private translationService: TranslationService,
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private helpService: HelpService,
    private logger: LoggerService,
  ) {}

  ngOnInit() {
    this.updateScale();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
      races: this.dataService.getRaces(),
    }).subscribe({
      next: (result) => {
        const drivers = (result.drivers as any).map(
          (d: any) =>
            new Driver(
              d.entity_id,
              d.name || "",
              d.nickname || "",
              d.avatarUrl || undefined,
              {
                type:
                  d.lapAudio?.type ||
                  (d.lapSoundType === "tts" ? "tts" : "preset"),
                url: d.lapAudio?.url || d.lapSoundUrl,
                text: d.lapAudio?.text || d.lapSoundText,
              },
              {
                type:
                  d.bestLapAudio?.type ||
                  (d.bestLapSoundType === "tts" ? "tts" : "preset"),
                url: d.bestLapAudio?.url || d.bestLapSoundUrl,
                text: d.bestLapAudio?.text || d.bestLapSoundText,
              },
            ),
        );
        const teams = (result.teams as any).map(
          (t: any) =>
            new Team(
              t.entity_id || t.entityId || "",
              t.name || "",
              t.avatarUrl || undefined,
              t.driverIds || [],
            ),
        );
        const races = result.races;

        // --- Race Setup ---
        (this as any).races = races.sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || ""),
        );

        const localSettings = this.settingsService.getSettings();
        this.updateQuickStartRaces(localSettings.recentRaceIds);

        if (
          localSettings &&
          (localSettings.selectedRaceId ||
            localSettings.recentRaceIds?.length > 0)
        ) {
          const defaultRaceId =
            localSettings.selectedRaceId || localSettings.recentRaceIds[0];
          this.selectedRace = this.races.find(
            (r) => r.entity_id === defaultRaceId,
          );
        }

        if (!this.selectedRace && this.races.length > 0) {
          this.selectedRace = this.races[0];
        }

        // --- Participant Setup ---
        const allParticipants: Participant[] = [...drivers, ...teams];
        // Use prefixed IDs to avoid collision between drivers and teams sharing the same numeric sequence
        const participantMap = new Map(
          allParticipants.map((p) => [
            this.isDriver(p) ? `d_${p.entity_id}` : `t_${p.entity_id}`,
            p,
          ]),
        );

        // Populate Selected (in saved order)
        if (localSettings && localSettings.selectedDriverIds) {
          for (const rawId of localSettings.selectedDriverIds) {
            // Support both prefixed and non-prefixed IDs for backward compatibility
            let prefixedId = rawId;
            if (!rawId.startsWith("d_") && !rawId.startsWith("t_")) {
              // Old style ID, try driver first then team
              if (participantMap.has(`d_${rawId}`)) {
                prefixedId = `d_${rawId}`;
              } else if (participantMap.has(`t_${rawId}`)) {
                prefixedId = `t_${rawId}`;
              }
            }

            const p = participantMap.get(prefixedId);
            if (p) {
              this.selectedParticipants.push(p);
              participantMap.delete(prefixedId);
            }
          }
        }
        this.unselectedParticipants = Array.from(participantMap.values()).sort(
          (a, b) => this.naturalSortParticipants(a, b),
        );

        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Error loading initial data", err),
    });

    this.translationService.getTranslationsLoaded().subscribe((loaded) => {
      this.translationsLoaded = loaded;
      this.cdr.detectChanges();
    });

    this.supportedLanguages = this.translationService
      .getSupportedLanguages()
      .sort((a, b) => {
        const nameA = this.translationService.translate(a.nameKey);
        const nameB = this.translationService.translate(b.nameKey);
        return nameA.localeCompare(nameB);
      });
    this.currentLanguage = this.settingsService.getSettings().language;
    this.currentClientLogLevel =
      this.settingsService.getSettings().clientLogLevel || "INFO";
    this.currentServerLogLevel =
      this.settingsService.getSettings().serverLogLevel || "INFO";
    this.demoConfig = this.settingsService.getSettings().demoConfig;
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".custom-dropdown-container")) {
      this.closeDropdown();
    }
    if (!target.closest(".options-menu-container")) {
      this.closeOptionsDropdown();
    }
    if (!target.closest(".file-menu-container")) {
      this.closeFileDropdown();
    }
    if (!target.closest(".config-menu-container")) {
      this.closeConfigDropdown();
    }
    if (!target.closest(".help-menu-container")) {
      this.closeHelpDropdown();
    }
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

  getParticipantAvatarUrl(participant: Participant): string {
    if (!participant.avatarUrl) return "";
    if (participant.avatarUrl.startsWith("/")) {
      return `${this.dataService.serverUrl}${participant.avatarUrl}`;
    }
    return participant.avatarUrl;
  }

  getLocalizedName(participant: Participant): string {
    if (
      (participant.name === "Empty" || participant.name === "Unknown") &&
      (!participant.entity_id ||
        participant.entity_id === "" ||
        participant.entity_id === "empty")
    ) {
      return this.translationService.translate("RD_EMPTY_LANE");
    }
    return participant.name || "";
  }

  getLocalizedNickname(participant: Participant): string {
    if (this.isDriver(participant)) {
      if (
        (participant.nickname === "Empty" ||
          participant.name === "Empty" ||
          participant.name === "Unknown") &&
        (!participant.entity_id ||
          participant.entity_id === "" ||
          participant.entity_id === "empty")
      ) {
        return this.translationService.translate("RD_EMPTY_LANE");
      }
      return participant.nickname || participant.name || "";
    }
    return "";
  }

  getLocalizedTeamMembers(participant: Participant): string {
    if (this.isTeam(participant)) {
      return `${participant.driverIds.length} ${this.translationService.translate("RDS_TEAM_DRIVERS")}`;
    }
    return "";
  }

  onParticipantImageError(participant: Participant) {
    this.imageErrors.add(
      (this.isDriver(participant) ? "d_" : "t_") + participant.entity_id,
    );
  }

  // --- Participant Logic ---

  toggleParticipantSelection(participant: Participant, isSelected: boolean) {
    this.updateListWithRefresh(() => {
      if (isSelected) {
        // Was selected, now unselecting
        this.selectedParticipants = this.selectedParticipants.filter(
          (p) =>
            !(
              p.entity_id === participant.entity_id &&
              this.isDriver(p) === this.isDriver(participant)
            ),
        );
        this.unselectedParticipants = [
          ...this.unselectedParticipants,
          participant,
        ].sort((a, b) => this.naturalSortParticipants(a, b));
      } else {
        // Was unselected, now selecting
        this.unselectedParticipants = this.unselectedParticipants.filter(
          (p) =>
            !(
              p.entity_id === participant.entity_id &&
              this.isDriver(p) === this.isDriver(participant)
            ),
        );
        this.selectedParticipants = [...this.selectedParticipants, participant];
      }
    });
  }

  addAllParticipants() {
    this.updateListWithRefresh(() => {
      this.selectedParticipants = [
        ...this.selectedParticipants,
        ...this.unselectedParticipants,
      ];
      this.unselectedParticipants = [];
    });
  }

  removeAllParticipants() {
    this.updateListWithRefresh(() => {
      this.unselectedParticipants = [
        ...this.unselectedParticipants,
        ...this.selectedParticipants,
      ].sort((a, b) => this.naturalSortParticipants(a, b));
      this.selectedParticipants = [];
    });
  }

  randomizeParticipants() {
    this.updateListWithRefresh(() => {
      // Immutable shuffle
      const shuffled = [...this.selectedParticipants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      this.selectedParticipants = shuffled;
    });
  }

  isDriver(participant: Participant | undefined): participant is Driver {
    return (
      !!participant &&
      (participant instanceof Driver || "nickname" in participant)
    );
  }

  isTeam(participant: Participant | undefined): participant is Team {
    return (
      !!participant &&
      (participant instanceof Team || "driverIds" in participant)
    );
  }

  getDriver(participant: Participant | undefined): Driver | undefined {
    return participant instanceof Driver ? participant : undefined;
  }

  getTeam(participant: Participant | undefined): Team | undefined {
    return participant instanceof Team ? participant : undefined;
  }

  getParticipantUniqueId(participant: Participant): string {
    return (this.isDriver(participant) ? "d_" : "t_") + participant.entity_id;
  }

  private updateListWithRefresh(action: () => void) {
    // Capture scroll position
    const scrollTop = this.scrollContainer?.nativeElement?.scrollTop || 0;

    this.clearSelectionAndBlur();

    // TODO(aufderheide): Look into proper fix for this hack
    // Trigger a complete DOM reset for the list to wipe any browser selection state
    this.isRefreshingList = true;
    this.cdr.detectChanges();

    // Perform the data update
    action();

    this.saveSettings();

    // Restore the list in the next tick
    setTimeout(() => {
      this.isRefreshingList = false;
      this.clearSelectionAsync();
      this.cdr.detectChanges();

      // Restore scroll position after DOM is re-rendered
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = scrollTop;
      }
    }, 0);
  }

  private clearSelectionAndBlur() {
    // Blur whatever button might have focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Clear selection immediately
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private clearSelectionAsync() {
    setTimeout(() => {
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    }, 0);
  }

  trackByParticipant = (index: number, participant: Participant): string => {
    return (this.isDriver(participant) ? "d_" : "t_") + participant.entity_id;
  };

  preventSelection(event: Event) {
    event.preventDefault();
  }

  onDragStarted(_event: any) {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  drop(event: CdkDragDrop<Participant[]>) {
    // Only reorder within the selected list and if dropped strictly inside the container
    if (
      event.container.id === "selected-list" &&
      event.isPointerOverContainer
    ) {
      moveItemInArray(
        this.selectedParticipants,
        event.previousIndex,
        event.currentIndex,
      );
      this.saveSettings();
    }
  }

  // --- Race Logic ---

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isDropdownOpen;
    if (newState) {
      this.isFileDropdownOpen = false;
      this.isConfigDropdownOpen = false;
      this.isOptionsDropdownOpen = false;
      this.isLocalizationDropdownOpen = false;
    }
    this.isDropdownOpen = newState;
    this.cdr.detectChanges();
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  selectRace(race: Race) {
    this.selectedRace = race;

    // Auto-select drivers if the race has them
    if ((race as any).driver_ids && (race as any).driver_ids.length > 0) {
      const driverIds = (race as any).driver_ids as string[];
      const allParticipants = [
        ...this.selectedParticipants,
        ...this.unselectedParticipants,
      ];

      const newSelected: Participant[] = [];

      for (const id of driverIds) {
        const p = allParticipants.find(
          (part) => part.entity_id === id && this.isDriver(part),
        );
        if (p) {
          newSelected.push(p);
        }
      }

      // Keep others in unselected
      this.selectedParticipants = newSelected;
      this.unselectedParticipants = allParticipants
        .filter((p) => !newSelected.includes(p))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    this.saveSettings();
    this.closeDropdown();
    this.cdr.detectChanges();
  }

  private saveSettings(updateRecent: boolean = false) {
    const settings = this.settingsService.getSettings();

    if (this.selectedRace) {
      settings.selectedRaceId = this.selectedRace.entity_id;

      if (updateRecent) {
        let recentRaceIds = settings.recentRaceIds || [];
        recentRaceIds = [
          this.selectedRace.entity_id,
          ...recentRaceIds.filter((id) => id !== this.selectedRace?.entity_id),
        ];
        // Keep only the last two
        settings.recentRaceIds = recentRaceIds.slice(0, 2);
      }
    }

    settings.selectedDriverIds = this.selectedParticipants.map((p) =>
      this.getParticipantUniqueId(p),
    );
    settings.demoConfig = this.demoConfig;

    this.settingsService.saveSettings(settings);

    if (updateRecent) {
      this.updateQuickStartRaces(settings.recentRaceIds);
    }
  }

  startRace(isDemo: boolean = false) {
    if (this.selectedRace && this.selectedParticipants.length > 0) {
      console.log(
        `Starting race: ${this.selectedRace.name} with ${this.selectedParticipants.length} participants`,
      );

      const raceId = this.selectedRace.entity_id;

      this.dataService.getSavedRaces().subscribe({
        next: (races) => {
          const autoSaveFile = races.find(
            (f) => f === `autosave_${raceId}.json`,
          );
          if (autoSaveFile) {
            this.autoSaveFileToLoad = autoSaveFile;
            this.pendingIsDemo = isDemo;
            this.showAutoSavePrompt = true;
            this.cdr.detectChanges();
            return;
          }
          this.proceedWithStart(isDemo);
        },
        error: (err) => {
          this.logger.error("Failed to check for auto-save:", err);
          this.proceedWithStart(isDemo);
        },
      });
    }
  }

  onConfirmAutoSave() {
    this.showAutoSavePrompt = false;
    if (this.autoSaveFileToLoad) {
      this.dataService.loadRace(this.autoSaveFileToLoad).subscribe({
        next: () => this.router.navigate(["/raceday"]),
        error: (err) => this.logger.error("Failed to load auto-save:", err),
      });
    }
  }

  onCancelAutoSave() {
    this.showAutoSavePrompt = false;
    if (this.autoSaveFileToLoad) {
      this.dataService.deleteSavedRace(this.autoSaveFileToLoad).subscribe({
        error: (err) => this.logger.error("Failed to delete auto-save:", err),
      });
    }
    this.proceedWithStart(this.pendingIsDemo);
  }

  private proceedWithStart(isDemo: boolean) {
    this.saveSettings(true);
    const settings = this.settingsService.getSettings();

    this.dataService
      .initializeRace(
        this.selectedRace!.entity_id,
        settings.selectedDriverIds,
        isDemo,
        isDemo
          ? this.demoConfig || this.dataService.getDefaultDemoConfig()
          : undefined,
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(["/raceday"]);
          } else {
            // Handle validation error
            this.errorTitle = "RDS_ERR_VALIDATION_TITLE";
            const fixDescription = this.translationService.translate(
              "RDS_ERR_START_RACE_FIX_DESCRIPTION",
            );

            if (response.errorCode === "DUPE_INDIVIDUAL_TEAM") {
              this.errorMessage = "RDS_ERR_DRIVER_DUPE_IND_TEAM";
              this.errorMessageParams = {
                driver: response.driverName,
                team: response.teamNames.join(", "),
              };
            } else if (response.errorCode === "DUPE_MULTIPLE_TEAMS") {
              this.errorMessage = "RDS_ERR_DRIVER_DUPE_TEAMS";
              this.errorMessageParams = {
                driver: response.driverName,
                teams: response.teamNames.join(", "),
              };
            } else {
              this.errorMessage = response.errorCode || "Unknown error";
              this.errorMessageParams = {};
            }

            // Append fix description if it's a known error
            if (response.errorCode) {
              const translatedMessage = this.translationService.translate(
                this.errorMessage,
                this.errorMessageParams,
              );
              this.errorMessage = translatedMessage + "\n\n" + fixDescription;
              // Clear messageParams since we've already done the translation for the main part
              this.errorMessageParams = {};
            }

            this.showErrorModal = true;
            this.cdr.detectChanges();
          }
        },
        error: (err) => this.logger.error("Failed to initialize race", err),
      });
  }

  updateQuickStartRaces(recentRaceIds: string[] = []) {
    this.quickStartRaces = [];

    // 1. Try to populate from recent list
    if (recentRaceIds && recentRaceIds.length > 0) {
      for (const id of recentRaceIds) {
        const race = this.races.find((r) => r.entity_id === id);
        if (race) {
          this.quickStartRaces.push(race);
        }
      }
    }

    // 2. If we don't have enough, try to find "Grand Prix" or "Time Trial" as defaults if they aren't already in the list
    if (this.quickStartRaces.length < 2) {
      const defaults = [
        this.races.find((r) => r.name.toLowerCase().includes("grand prix")),
        this.races.find((r) => r.name.toLowerCase().includes("time trial")),
      ].filter(
        (r) =>
          r !== undefined &&
          !this.quickStartRaces.some((qsr) => qsr.entity_id === r.entity_id),
      ) as Race[];

      for (const d of defaults) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(d);
        }
      }
    }

    // 3. Last fallback: just pick first available races
    if (this.quickStartRaces.length < 2) {
      const remaining = this.races.filter(
        (r) =>
          !this.quickStartRaces.some((qsr) => qsr.entity_id === r.entity_id),
      );
      for (const r of remaining) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(r);
        }
      }
    }
  }

  getStartRaceTooltip(): string {
    if (this.selectedParticipants.length > 0) return "";
    const translated = this.translationService.translate(
      "RDS_START_RACE_TOOLTIP",
    );
    return translated;
  }

  getRaceCardBackgroundClass(index: number): string {
    const backgrounds = ["card-bg-gp", "card-bg-tt"];
    return backgrounds[index % backgrounds.length];
  }

  get filteredUnselectedParticipants(): Participant[] {
    if (!this.driverSearchQuery) return this.unselectedParticipants;
    const q = this.driverSearchQuery.toLowerCase();
    return this.unselectedParticipants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        ((p as any).nickname && (p as any).nickname.toLowerCase().includes(q)),
    );
  }

  get filteredRaces(): Race[] {
    if (!this.raceSearchQuery) return this.races;
    const q = this.raceSearchQuery.toLowerCase();
    return this.races.filter((r) => r.name.toLowerCase().includes(q));
  }

  private naturalSortParticipants(a: Participant, b: Participant): number {
    return naturalSortCompare(a.name || "", b.name || "");
  }

  // --- Options Menu Logic ---

  toggleOptionsDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isOptionsDropdownOpen;
    if (newState) {
      this.isFileDropdownOpen = false;
      this.isConfigDropdownOpen = false;
      this.isDropdownOpen = false;
    }
    this.isOptionsDropdownOpen = newState;
    if (!this.isOptionsDropdownOpen) {
      this.isLocalizationDropdownOpen = false;
    }
    this.cdr.detectChanges();
  }

  toggleLocalizationDropdown(event: Event) {
    event.stopPropagation();
    this.isLocalizationDropdownOpen = !this.isLocalizationDropdownOpen;
    this.cdr.detectChanges();
  }
  toggleLogDropdown(event: Event) {
    event.stopPropagation();
    this.isLogDropdownOpen = !this.isLogDropdownOpen;
    if (!this.isLogDropdownOpen) {
      this.isClientLogOpen = false;
      this.isServerLogOpen = false;
    }
    this.cdr.detectChanges();
  }

  toggleClientLogDropdown(event: Event) {
    event.stopPropagation();
    this.isClientLogOpen = !this.isClientLogOpen;
    if (this.isClientLogOpen) {
      this.isServerLogOpen = false;
    }
    this.cdr.detectChanges();
  }

  // --- Demo Config Logic ---

  configureDemo() {
    this.showDemoConfigModal = true;
    this.closeOptionsDropdown();
    this.cdr.detectChanges();
  }

  onDemoConfigConfirm(config: IDemoConfig) {
    this.demoConfig = config;
    this.showDemoConfigModal = false;
    this.saveSettings();
    this.cdr.detectChanges();
  }

  onDemoConfigCancel() {
    this.showDemoConfigModal = false;
    this.cdr.detectChanges();
  }

  toggleServerLogDropdown(event: Event) {
    event.stopPropagation();
    this.isServerLogOpen = !this.isServerLogOpen;
    if (this.isServerLogOpen) {
      this.isClientLogOpen = false;
    }
    this.cdr.detectChanges();
  }

  closeOptionsDropdown() {
    this.isOptionsDropdownOpen = false;
    this.isLocalizationDropdownOpen = false;
  }

  selectLanguage(code: string) {
    this.translationService.setLanguage(code);
    const settings = this.settingsService.getSettings();
    settings.language = code;
    this.settingsService.saveSettings(settings);
    this.currentLanguage = code;
    this.closeOptionsDropdown();
  }

  getLanguageDisplayName(code: string): string {
    if (code === "") {
      const browserCode = this.translationService.getBrowserLanguage();
      const langNameKey = `RDS_LANG_${browserCode.toUpperCase()}`;
      const browserLangName = this.translationService.translate(langNameKey);
      return `${this.translationService.translate("RDS_LANG_DEFAULT")} (${browserLangName})`;
    }
    const lang = this.supportedLanguages.find((l) => l.code === code);
    return lang ? this.translationService.translate(lang.nameKey) : code;
  }
  setClientLogLevel(level: string) {
    const settings = this.settingsService.getSettings();
    settings.clientLogLevel = level;
    this.settingsService.saveSettings(settings);
    this.currentClientLogLevel = level;
    this.logger.setLevel(level as any);
    this.closeHelpDropdown();
  }
  setServerLogLevel(level: string) {
    const settings = this.settingsService.getSettings();
    settings.serverLogLevel = level;
    this.settingsService.saveSettings(settings);
    this.currentServerLogLevel = level;
    // TODO: Send to server via API
    this.dataService.setServerLogLevel(level).subscribe({
      next: () => this.logger.info(`Server log level set to ${level}`),
      error: (err) => this.logger.error("Failed to set server log level", err),
    });
    this.closeHelpDropdown();
  }

  configureCustomUI() {
    this.closeOptionsDropdown();
    this.router.navigate(["/ui-editor"]);
  }

  openServerSettings() {
    this.closeOptionsDropdown();
    this.requestServerConfig.emit();
  }

  // --- File Menu Logic ---

  toggleFileDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isFileDropdownOpen;
    if (newState) {
      this.isConfigDropdownOpen = false;
      this.isOptionsDropdownOpen = false;
      this.isDropdownOpen = false;
      this.isLocalizationDropdownOpen = false;
    }
    this.isFileDropdownOpen = newState;
    this.cdr.detectChanges();
  }

  closeFileDropdown() {
    this.isFileDropdownOpen = false;
  }

  openAssetManager() {
    this.closeFileDropdown();
    this.router.navigate(["/asset-manager"]);
  }

  openDriverManager() {
    this.closeConfigDropdown();
    this.router.navigate(["/driver-manager"]);
  }

  openTeamManager() {
    this.closeConfigDropdown();
    this.router.navigate(["/team-manager"]);
  }

  openTrackManager() {
    this.closeConfigDropdown();
    this.router.navigate(["/track-manager"]);
  }

  openRaceManager() {
    const queryParams: any = this.selectedRace
      ? { id: this.selectedRace.entity_id }
      : {};
    queryParams.driverCount = this.selectedParticipants.length;
    this.closeConfigDropdown();
    this.router.navigate(["/race-manager"], { queryParams });
  }

  toggleConfigDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isConfigDropdownOpen;
    if (newState) {
      this.isFileDropdownOpen = false;
      this.isOptionsDropdownOpen = false;
      this.isDropdownOpen = false;
      this.isLocalizationDropdownOpen = false;
    }
    this.isConfigDropdownOpen = newState;
    this.cdr.detectChanges();
  }

  closeConfigDropdown() {
    this.isConfigDropdownOpen = false;
  }

  toggleHelpDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isHelpDropdownOpen;
    if (newState) {
      this.isFileDropdownOpen = false;
      this.isConfigDropdownOpen = false;
      this.isOptionsDropdownOpen = false;
      this.isDropdownOpen = false;
      this.isLocalizationDropdownOpen = false;
      this.isHelpDropdownOpen = true;
    } else {
      this.closeHelpDropdown();
    }
    this.cdr.detectChanges();
  }

  closeHelpDropdown() {
    this.isHelpDropdownOpen = false;
    this.isLogDropdownOpen = false;
    this.isClientLogOpen = false;
    this.isServerLogOpen = false;
  }

  openAbout() {
    this.closeHelpDropdown();
    // Communicate with parent RacedaySetupComponent
    // We can use the parent reference or just emit an event.
    // Looking at RacedaySetupComponent, it holds the state.
    // DefaultRacedaySetupComponent is created via ViewContainerRef.
    // Let's add an Output.
    this.requestAbout.emit();
  }

  requestAbout = output<void>();

  openDatabaseManager() {
    this.closeFileDropdown();
    this.router.navigate(["/database-manager"]);
  }

  openCumulativeResults() {
    this.closeFileDropdown();
    this.router.navigate(["/cumulative-results"]);
  }

  onSearchChange() {
    if (this.raceSearchQuery) {
      this.isDropdownOpen = true;
    }
    this.cdr.detectChanges();
  }

  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("RDS_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("RDS_HELP_WELCOME_CONTENT"),
      },
      {
        selector: ".panel.driver-panel",
        title: this.translationService.translate(
          "RDS_HELP_DRIVER_SELECTION_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_DRIVER_SELECTION_CONTENT",
        ),
        position: "right",
      },
      {
        selector: ".driver-action-bar",
        title: this.translationService.translate(
          "RDS_HELP_DRIVER_ACTIONS_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_DRIVER_ACTIONS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".custom-dropdown-container",
        title: this.translationService.translate(
          "RDS_HELP_RACE_SELECTION_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_RACE_SELECTION_CONTENT",
        ),
        position: "top",
      },
      {
        targetId: "race-card-0",
        title: this.translationService.translate("RDS_HELP_RECENT_RACE_TITLE"),
        content: this.translationService.translate(
          "RDS_HELP_RECENT_RACE_MOST_RECENT_CONTENT",
        ),
        position: "bottom",
      },
      {
        targetId: "race-card-1",
        title: this.translationService.translate("RDS_HELP_RECENT_RACE_TITLE"),
        content: this.translationService.translate(
          "RDS_HELP_RECENT_RACE_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".btn-start",
        title: this.translationService.translate("RDS_HELP_START_RACE_TITLE"),
        content: this.translationService.translate(
          "RDS_HELP_START_RACE_CONTENT",
        ),
        position: "top",
      },
      {
        selector: ".btn-demo",
        title: this.translationService.translate("RDS_HELP_START_DEMO_TITLE"),
        content: this.translationService.translate(
          "RDS_HELP_START_DEMO_CONTENT",
        ),
        position: "top",
      },
    ];
  }
  loadSavedRaces() {
    this.isFileDropdownOpen = false;
    this.dataService.getSavedRaces().subscribe({
      next: (races) => {
        this.savedRaces = races;
        this.showLoadRaceModal = true;
        this.selectedSavedRace = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Failed to get saved races:", err),
    });
  }

  selectSavedRace(file: string) {
    this.selectedSavedRace = file;
  }

  closeLoadRaceModal() {
    this.showLoadRaceModal = false;
  }

  confirmLoadRace() {
    if (!this.selectedSavedRace) return;

    this.dataService.loadRace(this.selectedSavedRace).subscribe({
      next: () => {
        this.closeLoadRaceModal();
        this.router.navigate(["/raceday"]);
      },
      error: (err) => console.error("Failed to load race:", err),
    });
  }

  deleteSavedRace(event: MouseEvent, file: string) {
    event.stopPropagation(); // Prevent selection
    if (confirm(`Are you sure you want to delete "${file}"?`)) {
      this.dataService.deleteSavedRace(file).subscribe({
        next: () => {
          this.savedRaces = this.savedRaces.filter((r) => r !== file);
          if (this.selectedSavedRace === file) {
            this.selectedSavedRace = null;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error("Failed to delete race:", err),
      });
    }
  }
}
