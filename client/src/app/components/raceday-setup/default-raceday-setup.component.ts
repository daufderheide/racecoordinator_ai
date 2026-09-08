/* eslint-disable max-lines */
import {
  CdkDrag,
  CdkDragDrop,
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
  inject,
  input,
  OnInit,
  output,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DemoConfigModalComponent } from "@app/components/shared/demo-config-modal/demo-config-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { LanguageSelectorComponent } from "@app/components/shared/language-selector/language-selector.component";
import { RaceHistoryDialogComponent } from "@app/components/shared/race-history-dialog/race-history-dialog.component";
import { RacingRosterDialogComponent } from "@app/components/shared/racing-roster-dialog/racing-roster-dialog.component";
import { SeasonSummaryComponent } from "@app/components/shared/season-summary/season-summary.component";
import { UpdateSelectorComponent } from "@app/components/shared/update-selector/update-selector.component";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Event as EventModel } from "@app/models/event";
import { Race } from "@app/models/race";
import { Season, SeasonStandingItem } from "@app/models/season";
import { Settings } from "@app/models/settings";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IDemoConfig } from "@app/proto/antigravity";
import { FileSystemService } from "@app/services/file-system.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { saveFileAs } from "@app/utils/file-download.utils";
import { calculateSeasonStandings } from "@app/utils/season.utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

interface ISavedRace {
  filename: string;
  isDemo: boolean;
  corrupt?: boolean;
}

type Participant = Driver | Team;

@Component({
  standalone: true,
  selector: "app-default-raceday-setup",
  templateUrl: "./default-raceday-setup.component.html",
  styleUrl: "./default-raceday-setup.component.css",
  imports: [
    ɵɵCdkScrollable,
    CdkDropList,
    CdkDrag,
    FormsModule,
    NgClass,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    DemoConfigModalComponent,
    RacingRosterDialogComponent,
    SeasonSummaryComponent,
    TranslatePipe,
    EditorTitleComponent,
    LanguageSelectorComponent,
    UpdateSelectorComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    RaceHistoryDialogComponent,
  ],
})
export class DefaultRacedaySetupComponent implements OnInit {
  showRaceHistoryDialog: boolean = false;
  requestServerConfig = output<void>();
  @ViewChild("availScrollContainer") availScrollContainer?: ElementRef;
  @ViewChild("racingScrollContainer") racingScrollContainer?: ElementRef;
  @ViewChild("importSettingsInput")
  importSettingsInput?: ElementRef<HTMLInputElement>;

  private helpLinkService = inject(HelpLinkService);

  // Driver/Team State
  selectedParticipants: Participant[] = [];
  unselectedParticipants: Participant[] = [];
  public allDrivers: Driver[] = [];
  public allTeams: Team[] = [];

  imageErrors = new Set<string>();

  // Search State
  raceSearchQuery: string = "";
  availableSearchQuery: string = "";
  racingSearchQuery: string = "";
  availableActiveIndex: number = 0;
  racingActiveIndex: number = 0;

  get filteredAvailableParticipants(): Participant[] {
    if (!this.availableSearchQuery) return this.unselectedParticipants;
    const lowerQuery = this.availableSearchQuery.trim().toLowerCase();
    if (!lowerQuery) return this.unselectedParticipants;
    const matches = this.unselectedParticipants.filter((p) => {
      const name = this.getLocalizedName(p).toLowerCase();
      const nickname = this.getLocalizedNickname(p).toLowerCase();
      return name.includes(lowerQuery) || nickname.includes(lowerQuery);
    });
    return this.sortFilteredParticipants(matches, lowerQuery);
  }

  get filteredRacingParticipants(): Participant[] {
    if (!this.racingSearchQuery) return this.selectedParticipants;
    const lowerQuery = this.racingSearchQuery.trim().toLowerCase();
    if (!lowerQuery) return this.selectedParticipants;
    const matches = this.selectedParticipants.filter((p) => {
      const name = this.getLocalizedName(p).toLowerCase();
      const nickname = this.getLocalizedNickname(p).toLowerCase();
      return name.includes(lowerQuery) || nickname.includes(lowerQuery);
    });
    return this.sortFilteredParticipants(matches, lowerQuery);
  }

  private sortFilteredParticipants(
    participants: Participant[],
    lowerQuery: string,
  ): Participant[] {
    return [...participants].sort((a, b) => {
      const aName = this.getLocalizedName(a).toLowerCase();
      const aNick = this.getLocalizedNickname(a).toLowerCase();
      const bName = this.getLocalizedName(b).toLowerCase();
      const bNick = this.getLocalizedNickname(b).toLowerCase();

      const aExact = aName === lowerQuery || aNick === lowerQuery;
      const bExact = bName === lowerQuery || bNick === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts =
        aName.startsWith(lowerQuery) || aNick.startsWith(lowerQuery);
      const bStarts =
        bName.startsWith(lowerQuery) || bNick.startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    });
  }

  // Race / Event State
  get isEventMode(): boolean {
    return !!this.selectedEvent;
  }
  races: Race[] = [];
  selectedRace?: Race;
  quickStartRaces: Race[] = [];
  events: EventModel[] = [];
  selectedEvent?: EventModel;

  // UI State
  scale: number = 1;
  translationsLoaded: boolean = false;
  isDropdownOpen: boolean = false;
  isEventDropdownOpen: boolean = false;
  isOptionsDropdownOpen: boolean = false;
  isFileDropdownOpen: boolean = false;
  isMac: boolean = false;
  quitShortcut: string = "Alt+F4";
  showLoadRaceModal: boolean = false;
  editingSaveFilename: string | null = null;
  editingSaveNewName: string = "";
  showAutoSavePrompt: boolean = false;
  autoSaveFileToLoad: string | null = null;
  pendingIsDemo: boolean = false;
  savedRaces: ISavedRace[] = [];
  selectedSavedRace: ISavedRace | null = null;
  loadedRaceName: string = "";
  public isRefreshingList: boolean = false;
  public showWelcomeMessage: boolean = true;
  isAvailableDriversCollapsed: boolean = false;

  // Conflict Error Modal
  showErrorModal: boolean = false;
  errorTitle: string = "";
  errorMessage: string = "";
  errorMessageParams?: Record<string, string>;
  showDemoConfigModal: boolean = false;
  showRacingRosterDialog: boolean = false;
  demoConfig?: IDemoConfig;

  // Quit Fallback Modal
  showQuitBlockedModal: boolean = false;

  // Season State
  seasons: Season[] = [];
  selectedSeason?: Season;
  seasonStandings: SeasonStandingItem[] = [];

  // Race State Additions
  isRaceRunning: boolean = false;
  showEndRacePrompt: boolean = false;
  showTrackEditorPrompt: boolean = false;

  // Modals
  public isAboutModalVisible = false;

  isConfigDropdownOpen: boolean = false;
  isHelpDropdownOpen: boolean = false;
  isLogDropdownOpen: boolean = false;
  isClientLogOpen: boolean = false;
  isServerLogOpen: boolean = false;
  isCustomUIPanelOpen: boolean = false;

  clientLogLevels = ["DEBUG", "INFO", "WARN", "ERROR"];
  serverLogLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
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
    private validationService: ParticipantValidationService,
    private themeService: ThemeService,
  ) {}

  /* eslint-disable max-lines-per-function */
  ngOnInit() {
    this.updateScale();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
      races: this.dataService.getRaces(),
      events: this.dataService.getEvents(),
      seasons: this.dataService.getSeasons(),
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
                  (d.lapSoundType === "tts"
                    ? "tts"
                    : d.lapSoundType === "none"
                      ? "none"
                      : "preset"),
                url: d.lapAudio?.url || d.lapSoundUrl,
                text: d.lapAudio?.text || d.lapSoundText,
              },
              {
                type:
                  d.bestLapAudio?.type ||
                  (d.bestLapSoundType === "tts"
                    ? "tts"
                    : d.bestLapSoundType === "none"
                      ? "none"
                      : "preset"),
                url: d.bestLapAudio?.url || d.bestLapSoundUrl,
                text: d.bestLapAudio?.text || d.bestLapSoundText,
              },
              {
                type:
                  d.penaltyAudio?.type ||
                  (d.penaltySoundType === "tts"
                    ? "tts"
                    : d.penaltySoundType === "none"
                      ? "none"
                      : "preset"),
                url: d.penaltyAudio?.url || d.penaltySoundUrl,
                text: d.penaltyAudio?.text || d.penaltySoundText,
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
        this.allDrivers = drivers;
        this.allTeams = teams;

        const races = result.races;

        // --- Race Setup ---
        (this as any).races = races.sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || ""),
        );

        this.events = (result.events || []).sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || ""),
        );

        this.seasons = (result.seasons || []).sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || ""),
        );

        const localSettings = this.settingsService.getSettings();
        this.updateQuickStartRaces(localSettings.recentRaceIds);

        if (localSettings && localSettings.selectedSeasonId) {
          const matchedSeason = this.seasons.find(
            (s) => s.entity_id === localSettings.selectedSeasonId,
          );
          if (matchedSeason) {
            this.selectedSeason = matchedSeason;
            this.calculateSeasonStandings();
          }
        }

        if (localSettings && localSettings.selectedRaceId) {
          if (localSettings.isEventMode) {
            const matchedEvent = this.events.find(
              (e) => e.entity_id === localSettings.selectedRaceId,
            );
            if (matchedEvent) {
              this.selectedEvent = matchedEvent;
              this.selectedRace = undefined;
            }
          } else {
            const matchedRace = this.races.find(
              (r) => r.entity_id === localSettings.selectedRaceId,
            );
            if (matchedRace) {
              this.selectedRace = matchedRace;
              this.selectedEvent = undefined;
            }
          }

          if (!this.selectedRace && !this.selectedEvent) {
            const matchedRace = this.races.find(
              (r) => r.entity_id === localSettings.selectedRaceId,
            );
            if (matchedRace) {
              this.selectedRace = matchedRace;
              this.selectedEvent = undefined;
            } else {
              const matchedEvent = this.events.find(
                (e) => e.entity_id === localSettings.selectedRaceId,
              );
              if (matchedEvent) {
                this.selectedEvent = matchedEvent;
                this.selectedRace = undefined;
              }
            }
          }
        }

        if (!this.selectedRace && !this.selectedEvent) {
          if (
            localSettings &&
            localSettings.recentRaceIds &&
            localSettings.recentRaceIds.length > 0
          ) {
            const defaultId = localSettings.recentRaceIds[0];
            const matchedRace = this.races.find(
              (r) => r.entity_id === defaultId,
            );
            if (matchedRace) {
              this.selectedRace = matchedRace;
              this.selectedEvent = undefined;
            } else {
              const matchedEvent = this.events.find(
                (e) => e.entity_id === defaultId,
              );
              if (matchedEvent) {
                this.selectedEvent = matchedEvent;
                this.selectedRace = undefined;
              }
            }
          }
          if (
            !this.selectedRace &&
            !this.selectedEvent &&
            this.races.length > 0
          ) {
            this.selectedRace = this.races[0];
          } else if (
            !this.selectedRace &&
            !this.selectedEvent &&
            this.events.length > 0
          ) {
            this.selectedEvent = this.events[0];
          }
        }

        if (this.selectedRace?.entity_id) {
          this.themeService.activateForRace(this.selectedRace.entity_id);
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
          const loadedParticipants: Participant[] = [];
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
              loadedParticipants.push(p);
            }
          }
          this.selectedParticipants = loadedParticipants;
        }
        this.updateUnselectedParticipants();

        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Error loading initial data", err),
    });

    this.translationService.getTranslationsLoaded().subscribe((loaded) => {
      this.translationsLoaded = loaded;
      this.cdr.detectChanges();
    });

    this.currentClientLogLevel =
      this.settingsService.getSettings().clientLogLevel || "INFO";
    this.currentServerLogLevel =
      this.settingsService.getSettings().serverLogLevel || "INFO";
    this.demoConfig = this.settingsService.getSettings().demoConfig;

    this.dataService.getSystemState().subscribe((state) => {
      if (state) {
        this.isRaceRunning = state.resourceLockState === "RACE_RUNNING";
        if (this.isRaceRunning && (state as any).isReplayMode) {
          this.router.navigate(["/raceday"]);
        }
        this.cdr.detectChanges();
      }
    });

    this.detectShortcutKey();
  }

  detectShortcutKey() {
    if (typeof navigator !== "undefined") {
      this.isMac =
        navigator.platform?.toUpperCase().indexOf("MAC") >= 0 ||
        navigator.userAgent?.toUpperCase().indexOf("MAC") >= 0;
      this.quitShortcut = this.isMac ? "Cmd+Q" : "Alt+F4";
    }
  }

  @HostListener("window:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent) {
    const inInputField =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");

    if (inInputField) {
      return;
    }

    if (this.isMac) {
      if (event.metaKey && (event.key === "q" || event.key === "Q")) {
        event.preventDefault();
        this.quit();
      }
    } else {
      if (event.altKey && event.key === "F4") {
        this.closeFileDropdown();
        return;
      }
      if (event.ctrlKey && (event.key === "q" || event.key === "Q")) {
        event.preventDefault();
        this.quit();
      }
    }
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

  toggleParticipantSelection(
    participant: Participant,
    isSelected: boolean,
    forcedFocusElem?: HTMLInputElement,
  ) {
    let added = false;
    this.updateListWithRefresh(
      () => {
        if (isSelected) {
          // Was selected, now unselecting
          this.selectedParticipants = this.selectedParticipants.filter(
            (p) =>
              !(
                p.entity_id === participant.entity_id &&
                this.isDriver(p) === this.isDriver(participant)
              ),
          );
        } else {
          // Was unselected, now selecting
          // Perform validation
          const potentialParticipants = [
            ...this.selectedParticipants,
            participant,
          ];
          const validationResult = this.validationService.validate(
            potentialParticipants,
            this.allTeams,
            this.allDrivers,
          );

          if (!validationResult.isValid) {
            this.errorTitle = "RDS_ERR_VALIDATION_TITLE";
            this.errorMessage = this.validationService.getErrorMessage(
              validationResult,
              this.translationService,
            );
            // RDS uses errorMessageParams but getErrorMessage already translates it.
            // We clear errorMessageParams to avoid double translation if the component tries to translate again.
            this.errorMessageParams = {};
            this.showErrorModal = true;
            this.cdr.detectChanges();
            return;
          }

          this.selectedParticipants = [
            ...this.selectedParticipants,
            participant,
          ];
          added = true;
        }
        this.updateUnselectedParticipants();
      },
      forcedFocusElem,
      () => {
        if (added) {
          this.scrollRacingParticipantIntoView(participant);
        }
      },
    );
  }

  addAllParticipants() {
    const unselectedDrivers = this.unselectedParticipants.filter((p) =>
      this.isDriver(p),
    );
    const potentialParticipants = [
      ...this.selectedParticipants,
      ...unselectedDrivers,
    ];
    const validationResult = this.validationService.validate(
      potentialParticipants,
      this.allTeams,
      this.allDrivers,
    );

    if (!validationResult.isValid) {
      this.errorTitle = "RDS_ERR_VALIDATION_TITLE";
      this.errorMessage = this.validationService.getErrorMessage(
        validationResult,
        this.translationService,
      );
      this.errorMessageParams = {};
      this.showErrorModal = true;
      this.cdr.detectChanges();
      return;
    }

    this.updateListWithRefresh(() => {
      this.selectedParticipants = [
        ...this.selectedParticipants,
        ...unselectedDrivers,
      ];
      this.updateUnselectedParticipants();
    });
  }

  addAllFilteredAvailableParticipants(inputElem?: HTMLInputElement) {
    if (!this.availableSearchQuery) {
      this.addAllParticipants();
      return;
    }

    const unselectedDrivers = this.filteredAvailableParticipants.filter((p) =>
      this.isDriver(p),
    );
    if (unselectedDrivers.length === 0) return;

    const potentialParticipants = [
      ...this.selectedParticipants,
      ...unselectedDrivers,
    ];
    const validationResult = this.validationService.validate(
      potentialParticipants,
      this.allTeams,
      this.allDrivers,
    );

    if (!validationResult.isValid) {
      this.errorTitle = "RDS_ERR_VALIDATION_TITLE";
      this.errorMessage = this.validationService.getErrorMessage(
        validationResult,
        this.translationService,
      );
      this.errorMessageParams = {};
      this.showErrorModal = true;
      this.cdr.detectChanges();
      return;
    }

    this.updateListWithRefresh(() => {
      this.selectedParticipants = [
        ...this.selectedParticipants,
        ...unselectedDrivers,
      ];
      this.updateUnselectedParticipants();
    }, inputElem);
  }

  removeAllFilteredRacingParticipants(inputElem?: HTMLInputElement) {
    if (!this.racingSearchQuery) {
      this.removeAllParticipants();
      return;
    }

    const filteredSet = new Set(
      this.filteredRacingParticipants.map(
        (p) => p.entity_id + (this.isDriver(p) ? "_d" : "_t"),
      ),
    );

    const remainingParticipants = this.selectedParticipants.filter((p) => {
      const id = p.entity_id + (this.isDriver(p) ? "_d" : "_t");
      return !filteredSet.has(id);
    });

    this.updateListWithRefresh(() => {
      this.selectedParticipants = remainingParticipants;
      this.updateUnselectedParticipants();
    }, inputElem);
  }

  onAvailableSearchQueryChange() {
    this.availableActiveIndex = 0;
  }

  onRacingSearchQueryChange() {
    this.racingActiveIndex = 0;
  }

  onAvailableSearchKeydown(event: KeyboardEvent, inputElem?: HTMLInputElement) {
    const list = this.filteredAvailableParticipants;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (list.length > 0) {
        this.availableActiveIndex = Math.min(
          this.availableActiveIndex + 1,
          list.length - 1,
        );
        this.scrollActiveAvailableItemIntoView();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (list.length > 0) {
        this.availableActiveIndex = Math.max(this.availableActiveIndex - 1, 0);
        this.scrollActiveAvailableItemIntoView();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey || event.ctrlKey) {
        this.addAllFilteredAvailableParticipants(inputElem);
      } else {
        this.addActiveAvailableParticipant(inputElem);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.availableSearchQuery = "";
      this.availableActiveIndex = 0;
    }
  }

  onRacingSearchKeydown(event: KeyboardEvent, inputElem?: HTMLInputElement) {
    const list = this.filteredRacingParticipants;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (list.length > 0) {
        this.racingActiveIndex = Math.min(
          this.racingActiveIndex + 1,
          list.length - 1,
        );
        this.scrollActiveRacingItemIntoView();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (list.length > 0) {
        this.racingActiveIndex = Math.max(this.racingActiveIndex - 1, 0);
        this.scrollActiveRacingItemIntoView();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey || event.ctrlKey) {
        this.removeAllFilteredRacingParticipants(inputElem);
      } else {
        this.removeActiveRacingParticipant(inputElem);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.racingSearchQuery = "";
      this.racingActiveIndex = 0;
    }
  }

  addActiveAvailableParticipant(inputElem?: HTMLInputElement) {
    const participants = this.filteredAvailableParticipants;
    if (participants.length === 0) return;

    const index = Math.min(
      Math.max(0, this.availableActiveIndex),
      participants.length - 1,
    );
    const participant = participants[index];
    if (!participant) return;

    this.toggleParticipantSelection(participant, false, inputElem);

    const remaining = this.filteredAvailableParticipants.length;
    if (this.availableActiveIndex >= remaining) {
      this.availableActiveIndex = Math.max(0, remaining - 1);
    }
    this.scrollActiveAvailableItemIntoView();
  }

  removeActiveRacingParticipant(inputElem?: HTMLInputElement) {
    const participants = this.filteredRacingParticipants;
    if (participants.length === 0) return;

    const index = Math.min(
      Math.max(0, this.racingActiveIndex),
      participants.length - 1,
    );
    const participant = participants[index];
    if (!participant) return;

    this.toggleParticipantSelection(participant, true, inputElem);

    const remaining = this.filteredRacingParticipants.length;
    if (this.racingActiveIndex >= remaining) {
      this.racingActiveIndex = Math.max(0, remaining - 1);
    }
    this.scrollActiveRacingItemIntoView();
  }

  private scrollActiveAvailableItemIntoView() {
    setTimeout(() => {
      const el = document.getElementById(
        `avail-item-${this.availableActiveIndex}`,
      );
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  }

  private scrollActiveRacingItemIntoView() {
    setTimeout(() => {
      const el = document.getElementById(
        `racing-item-${this.racingActiveIndex}`,
      );
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  }

  scrollRacingParticipantIntoView(participant: Participant) {
    setTimeout(() => {
      const uniqueId = this.getParticipantUniqueId(participant);
      const index = this.filteredRacingParticipants.findIndex(
        (p) => this.getParticipantUniqueId(p) === uniqueId,
      );
      if (index === -1) return;
      const container = this.racingScrollContainer?.nativeElement;
      const el =
        (typeof container?.querySelector === "function"
          ? container.querySelector(`[data-participant-id="${uniqueId}"]`)
          : null) || document.getElementById(`racing-item-${index}`);
      el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }, 0);
  }

  removeAllParticipants() {
    this.updateListWithRefresh(() => {
      this.selectedParticipants = [];
      this.updateUnselectedParticipants();
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

  private updateListWithRefresh(
    action: () => void,
    forcedFocusElem?: HTMLInputElement,
    onComplete?: () => void,
  ) {
    // Capture scroll positions
    const availScrollTop =
      this.availScrollContainer?.nativeElement?.scrollTop || 0;
    const racingScrollTop =
      this.racingScrollContainer?.nativeElement?.scrollTop || 0;

    // Capture active element before blur
    const activeElem =
      forcedFocusElem || (document.activeElement as HTMLElement);
    const isSearchInput = activeElem?.classList?.contains("search-input");

    // Skip the blur and DOM reset completely if we're triggered by a search input
    if (forcedFocusElem || isSearchInput) {
      action();
      this.saveSettings();
      this.cdr.detectChanges();

      // Ensure focus remains intact
      if (
        document.activeElement !== activeElem &&
        typeof activeElem.focus === "function"
      ) {
        activeElem.focus();
      }
      onComplete?.();
      return;
    }

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

      // Restore scroll positions after DOM is re-rendered
      if (this.availScrollContainer?.nativeElement) {
        this.availScrollContainer.nativeElement.scrollTop = availScrollTop;
      }
      if (this.racingScrollContainer?.nativeElement) {
        this.racingScrollContainer.nativeElement.scrollTop = racingScrollTop;
      }
      onComplete?.();
    }, 0);
  }

  private clearSelectionAndBlur() {
    // Blur whatever button might have focus
    if (document.activeElement instanceof HTMLElement) {
      if (!document.activeElement.classList.contains("search-input")) {
        document.activeElement.blur();
      }
    }
    // Clear selection immediately
    const isSearchInput =
      document.activeElement?.classList?.contains("search-input");
    if (window.getSelection && !isSearchInput) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private clearSelectionAsync() {
    setTimeout(() => {
      const activeElem = document.activeElement as HTMLElement;
      if (activeElem?.classList?.contains("search-input")) return;

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
    if (event.previousContainer === event.container) {
      // Reordering within the same container
      if (
        event.container.id === "selected-list" &&
        event.isPointerOverContainer
      ) {
        if (this.racingSearchQuery) {
          // Disable reordering while searching
          return;
        }
        const updated = [...this.selectedParticipants];
        moveItemInArray(updated, event.previousIndex, event.currentIndex);
        this.selectedParticipants = updated;
        this.saveSettings();
      }
    } else {
      // Dragging between containers
      if (event.container.id === "selected-list") {
        // Dragging from available-list to selected-list
        const participant = event.previousContainer.data[
          event.previousIndex
        ] as Participant;
        if (!participant) return;

        // Perform validation
        const potentialParticipants = [...this.selectedParticipants];
        const targetIndex = event.currentIndex;
        if (targetIndex >= 0 && targetIndex <= potentialParticipants.length) {
          potentialParticipants.splice(targetIndex, 0, participant);
        } else {
          potentialParticipants.push(participant);
        }

        const validationResult = this.validationService.validate(
          potentialParticipants,
          this.allTeams,
          this.allDrivers,
        );

        if (!validationResult.isValid) {
          this.errorTitle = "RDS_ERR_VALIDATION_TITLE";
          this.errorMessage = this.validationService.getErrorMessage(
            validationResult,
            this.translationService,
          );
          this.errorMessageParams = {};
          this.showErrorModal = true;
          this.cdr.detectChanges();
          return;
        }

        // Apply changes
        this.updateListWithRefresh(
          () => {
            const updated = [...this.selectedParticipants];
            if (targetIndex >= 0 && targetIndex <= updated.length) {
              updated.splice(targetIndex, 0, participant);
            } else {
              updated.push(participant);
            }
            this.selectedParticipants = updated;
            this.updateUnselectedParticipants();
          },
          undefined,
          () => {
            this.scrollRacingParticipantIntoView(participant);
          },
        );
      } else if (event.container.id === "available-list") {
        // Dragging from selected-list to available-list
        const participant = this.selectedParticipants[event.previousIndex];
        if (!participant) return;

        this.updateListWithRefresh(() => {
          this.selectedParticipants = this.selectedParticipants.filter(
            (p) =>
              !(
                p.entity_id === participant.entity_id &&
                this.isDriver(p) === this.isDriver(participant)
              ),
          );
          this.updateUnselectedParticipants();
        });
      }
    }
  }

  toggleAvailableDrivers() {
    this.isAvailableDriversCollapsed = !this.isAvailableDriversCollapsed;
    this.cdr.detectChanges();
  }

  // --- Race Logic ---

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isDropdownOpen;
    if (newState) {
      this.closeFileDropdown();
      this.closeConfigDropdown();
      this.closeOptionsDropdown();
      this.closeHelpDropdown();
    }
    this.isDropdownOpen = newState;
    this.cdr.detectChanges();
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    this.isEventDropdownOpen = false;
  }

  toggleEventDropdown(e: MouseEvent) {
    e.stopPropagation();
    const newState = !this.isEventDropdownOpen;
    if (newState) {
      this.closeFileDropdown();
      this.closeConfigDropdown();
      this.closeOptionsDropdown();
      this.closeHelpDropdown();
      this.closeDropdown();
    }
    this.isEventDropdownOpen = newState;
    this.cdr.detectChanges();
  }

  selectEvent(event: EventModel) {
    this.selectedEvent = event;
    this.selectedRace = undefined;
    this.saveSettings();
    this.closeDropdown();
    this.cdr.detectChanges();
  }

  selectRace(race: Race) {
    this.selectedRace = race;
    this.selectedEvent = undefined;
    if (race?.entity_id) {
      this.themeService.activateForRace(race.entity_id);
    }
    this.saveSettings();
    this.closeDropdown();
    this.cdr.detectChanges();
  }

  private saveSettings(updateRecent: boolean = false) {
    const settings = this.settingsService.getSettings();

    const selectedId = this.isEventMode
      ? this.selectedEvent?.entity_id || ""
      : this.selectedRace?.entity_id || "";

    if (selectedId) {
      settings.selectedRaceId = selectedId;
      settings.isEventMode = this.isEventMode;

      if (updateRecent) {
        let recentRaceIds = settings.recentRaceIds || [];
        recentRaceIds = [
          selectedId,
          ...recentRaceIds.filter((id) => id !== selectedId),
        ];
        // Keep only the last two
        settings.recentRaceIds = recentRaceIds.slice(0, 2);
      }
    }

    settings.selectedDriverIds = this.selectedParticipants.map((p) =>
      this.getParticipantUniqueId(p),
    );
    settings.demoConfig = this.demoConfig;
    settings.selectedSeasonId = this.selectedSeason?.entity_id || "";

    this.settingsService.saveSettings(settings);

    if (updateRecent) {
      this.updateQuickStartRaces(settings.recentRaceIds);
    }
  }

  startRace(isDemo: boolean = false) {
    const hasSelection = this.isEventMode
      ? this.selectedEvent && this.selectedParticipants.length > 0
      : this.selectedRace && this.selectedParticipants.length > 0;

    if (hasSelection) {
      const raceId = this.isEventMode
        ? this.selectedEvent?.entity_id || ""
        : this.selectedRace!.entity_id;

      this.dataService.getSavedRaces().subscribe({
        next: (races) => {
          const autoSaveFile = races.find(
            (f) => f.filename === `autosave_${raceId}.json`,
          );
          if (autoSaveFile) {
            this.autoSaveFileToLoad = autoSaveFile.filename;
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

  getItemRaceId(item: any): string {
    if (!item) return "";
    return item.raceId || item.race_id || "";
  }

  getItemMaxDrivers(item: any): number {
    if (!item) return 0;
    return item.maxDrivers !== undefined
      ? item.maxDrivers
      : item.max_drivers !== undefined
        ? item.max_drivers
        : 0;
  }

  getRace(raceId: string): Race | undefined {
    if (!raceId) return undefined;
    return this.races.find((rc) => rc.entity_id === raceId);
  }

  getRaceName(raceId: string): string {
    if (!raceId) return "";
    const r = this.getRace(raceId);
    return r ? r.name : raceId;
  }

  getRaceFinishMethod(raceId: string): string {
    const race: any = this.getRace(raceId);
    if (!race) return "";
    const fm =
      race.heat_scoring?.finish_method || race.heat_scoring?.finishMethod;
    return this.formatEnumDisplay(fm);
  }

  getRaceFinishValue(raceId: string): string {
    const race: any = this.getRace(raceId);
    if (!race) return "";
    const val =
      race.heat_scoring?.finish_value !== undefined
        ? race.heat_scoring?.finish_value
        : race.heat_scoring?.finishValue;
    if (val === 0 || val === "0") {
      return this.translationService.translate("GEN_INFINITE");
    }
    return val !== undefined && val !== null ? String(val) : "";
  }

  getEventDriverLimitWarning(): string | null {
    if (
      this.isEventMode &&
      this.selectedEvent &&
      this.selectedEvent.races &&
      this.selectedEvent.races.length > 0
    ) {
      const race0 = this.selectedEvent.races[0];
      const maxDrivers = this.getItemMaxDrivers(race0);
      const raceId = this.getItemRaceId(race0);
      if (maxDrivers > 0 && this.selectedParticipants.length > maxDrivers) {
        const raceName = this.getRaceName(raceId);
        return (
          this.translationService.translate("RDS_EVENT_WARNING_LIMIT", {
            limit: maxDrivers,
            raceName: raceName,
          }) ||
          `Warning: Only the top ${maxDrivers} drivers will participate in ${raceName}.`
        );
      }
    }
    return null;
  }

  joinRace() {
    this.router.navigate(["/raceday"]);
  }

  promptEndRace() {
    this.showEndRacePrompt = true;
    this.cdr.detectChanges();
  }

  onConfirmEndRace() {
    this.showEndRacePrompt = false;
    this.dataService.endRace().subscribe({
      next: (success) => {
        if (success) {
          this.logger.info("Race ended successfully");
        } else {
          this.logger.warn("Failed to end race");
        }
      },
      error: (err) => {
        this.logger.error("Error ending race", err);
      },
    });
  }

  onCancelEndRace() {
    this.showEndRacePrompt = false;
  }

  onConfirmAutoSave() {
    this.showAutoSavePrompt = false;
    this.saveSettings(true);
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
    const validationResult = this.validationService.validate(
      this.selectedParticipants,
      this.allTeams,
      this.allDrivers,
    );

    if (!validationResult.isValid) {
      this.errorTitle = "RDS_ERR_VALIDATION_TITLE";
      this.errorMessage = this.validationService.getErrorMessage(
        validationResult,
        this.translationService,
      );
      this.errorMessageParams = {};
      this.showErrorModal = true;
      this.cdr.detectChanges();
      return;
    }

    this.saveSettings(true);
    const settings = this.settingsService.getSettings();

    const raceId = this.isEventMode ? "" : this.selectedRace?.entity_id || "";
    const eventId = this.isEventMode
      ? this.selectedEvent?.entity_id || ""
      : undefined;
    const seasonId = this.selectedSeason?.entity_id || undefined;
    const demoConfig = isDemo
      ? this.demoConfig || this.dataService.getDefaultDemoConfig()
      : undefined;

    const themeId =
      (raceId ? settings.raceThemeOverrides?.[raceId] : undefined) ||
      this.selectedRace?.theme_id ||
      undefined;

    const initializeObservable =
      eventId || seasonId
        ? this.dataService.initializeRace(
            raceId,
            settings.selectedDriverIds,
            isDemo,
            demoConfig,
            eventId,
            seasonId,
            themeId,
          )
        : this.dataService.initializeRace(
            raceId,
            settings.selectedDriverIds,
            isDemo,
            demoConfig,
            undefined,
            undefined,
            themeId,
          );

    initializeObservable.subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(["/raceday"]);
        } else {
          // Handle validation error
          this.errorTitle = "RDS_ERR_VALIDATION_TITLE";

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
          } else if (response.errorCode === "TRACK_DELETED") {
            this.errorMessage = "RDS_ERR_TRACK_DELETED";
            this.errorMessageParams = {
              race: this.selectedRace?.name || this.selectedEvent?.name || "",
            };
          } else if (response.errorCode === "THEME_DELETED") {
            this.errorMessage = "RDS_ERR_THEME_DELETED";
            this.errorMessageParams = {
              race: this.selectedRace?.name || this.selectedEvent?.name || "",
            };
          } else if (response.errorCode === "NO_CUSTOM_ROTATIONS") {
            this.errorMessage = "RDS_ERR_NO_CUSTOM_ROTATIONS";
            this.errorMessageParams = {};
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
            const fixKey =
              response.errorCode === "NO_CUSTOM_ROTATIONS"
                ? "RDS_ERR_NO_CUSTOM_ROTATIONS_FIX"
                : response.errorCode === "TRACK_DELETED"
                  ? "RDS_ERR_TRACK_DELETED_FIX"
                  : response.errorCode === "THEME_DELETED"
                    ? "RDS_ERR_THEME_DELETED_FIX"
                    : "RDS_ERR_START_RACE_FIX_DESCRIPTION";
            const fixDescription = this.translationService.translate(fixKey);
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

  selectQuickStartItem(item: any) {
    if (!item) return;
    const isEventItem = item.races && Array.isArray(item.races);
    if (isEventItem) {
      const foundEvent = this.events.find(
        (e) => e.entity_id === item.entity_id,
      );
      if (foundEvent) {
        this.selectEvent(foundEvent);
        return;
      }
    }
    const foundRace = this.races.find((r) => r.entity_id === item.entity_id);
    if (foundRace) {
      this.selectRace(foundRace);
    } else {
      const foundEvent = this.events.find(
        (e) => e.entity_id === item.entity_id,
      );
      if (foundEvent) {
        this.selectEvent(foundEvent);
      }
    }
  }

  updateQuickStartRaces(recentRaceIds: string[] = []) {
    this.quickStartRaces = [];
    const localSettings = this.settingsService?.getSettings();

    // 1. Try to populate from recent list
    if (recentRaceIds && recentRaceIds.length > 0) {
      for (const id of recentRaceIds) {
        const isSelected = localSettings && localSettings.selectedRaceId === id;
        const isEventPreferred = isSelected && localSettings.isEventMode;

        if (isEventPreferred) {
          const event = this.events.find((e) => e.entity_id === id);
          if (event) {
            this.quickStartRaces.push(event as any);
            continue;
          }
        }

        const race = this.races.find((r) => r.entity_id === id);
        if (race) {
          this.quickStartRaces.push(race);
        } else {
          const event = this.events.find((e) => e.entity_id === id);
          if (event) {
            this.quickStartRaces.push(event as any);
          }
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

    // 3. Last fallback: pick first available races/events
    if (this.quickStartRaces.length < 2) {
      const remainingRaces = this.races.filter(
        (r) =>
          !this.quickStartRaces.some((qsr) => qsr.entity_id === r.entity_id),
      );
      for (const r of remainingRaces) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(r);
        }
      }
    }

    if (this.quickStartRaces.length < 2) {
      const remainingEvents = this.events.filter(
        (e) =>
          !this.quickStartRaces.some((qsr) => qsr.entity_id === e.entity_id),
      );
      for (const e of remainingEvents) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(e as any);
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

  get filteredRaces(): Race[] {
    if (!this.raceSearchQuery) return this.races;
    const q = this.raceSearchQuery.toLowerCase();
    return this.races.filter((r) => r.name.toLowerCase().includes(q));
  }

  get filteredEvents(): EventModel[] {
    if (!this.raceSearchQuery) return this.events;
    const q = this.raceSearchQuery.toLowerCase();
    return this.events.filter((e) => e.name.toLowerCase().includes(q));
  }

  public updateUnselectedParticipants() {
    const selectedDriverIds = new Set<string>();
    const selectedTeamIds = new Set<string>();

    this.selectedParticipants.forEach((p) => {
      if (this.isDriver(p)) {
        selectedDriverIds.add(p.entity_id);
      } else if (this.isTeam(p)) {
        selectedTeamIds.add(p.entity_id);
        p.driverIds.forEach((id) => selectedDriverIds.add(id));
      }
    });

    const availableDrivers = this.allDrivers.filter((d) => {
      return !selectedDriverIds.has(d.entity_id);
    });

    const availableTeams = this.allTeams.filter((t) => {
      if (selectedTeamIds.has(t.entity_id)) return false;
      return !t.driverIds.some((dId) => selectedDriverIds.has(dId));
    });

    this.unselectedParticipants = [...availableDrivers, ...availableTeams].sort(
      (a, b) => this.naturalSortParticipants(a, b),
    );
  }

  private naturalSortParticipants(a: Participant, b: Participant): number {
    return naturalSortCompare(a.name || "", b.name || "");
  }

  // --- Options Menu Logic ---

  toggleOptionsDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isOptionsDropdownOpen;
    if (newState) {
      this.closeFileDropdown();
      this.closeConfigDropdown();
      this.closeHelpDropdown();
      this.closeDropdown();
    }
    this.isOptionsDropdownOpen = newState;
    if (!this.isOptionsDropdownOpen) {
      // closed
    }
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

  openRacingRosterDialog(): void {
    this.selectedParticipants = [...this.selectedParticipants];
    this.showRacingRosterDialog = true;
    this.cdr.detectChanges();
  }

  closeRacingRosterDialog(): void {
    this.showRacingRosterDialog = false;
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
  }

  onLanguageSelected() {
    this.closeOptionsDropdown();
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
    this.closeDropdown();
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
      this.closeConfigDropdown();
      this.closeOptionsDropdown();
      this.closeHelpDropdown();
      this.closeDropdown();
    }
    this.isFileDropdownOpen = newState;
    this.cdr.detectChanges();
  }

  closeFileDropdown() {
    this.isFileDropdownOpen = false;
  }

  quit() {
    this.closeFileDropdown();
    this.closeWindow();
  }

  closeWindow() {
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch (e) {
        // ignore
      }
    }

    try {
      window.close();
    } catch (e) {
      // ignore
    }

    setTimeout(() => {
      this.handleQuitBlockedFallback();
    }, 150);
  }

  handleQuitBlockedFallback() {
    this.showQuitBlockedModal = true;
    this.cdr.detectChanges();
  }

  onAcknowledgeQuitModal() {
    this.showQuitBlockedModal = false;
    this.redirectToBlank();
  }

  redirectToBlank() {
    try {
      this.getWindowLocation().replace("about:blank");
    } catch (e) {
      // ignore
    }
  }

  getWindowLocation(): Location {
    return window.location;
  }

  exportSettings(): Promise<boolean> {
    this.closeFileDropdown();
    const settings = this.settingsService.getSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    return saveFileAs({
      suggestedName: "racecoordinator_settings.json",
      data: dataStr,
      mimeType: "application/json",
      description: "JSON Files",
      extension: ".json",
    });
  }

  triggerImportSettings() {
    this.closeFileDropdown();
    if (this.importSettingsInput) {
      this.importSettingsInput.nativeElement.click();
    }
  }

  importSettings(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const contents = e.target?.result as string;
          const parsed = JSON.parse(contents);

          const settingsToSave = Object.assign(new Settings(), parsed);
          this.settingsService.saveSettings(settingsToSave);

          // Reload the window to apply all imported settings
          this.reloadWindow();
        } catch (err) {
          this.logger.error("Failed to parse settings file", err);
          this.showErrorModal = true;
          this.errorTitle = "Import Failed";
          this.errorMessage =
            "Failed to parse settings file. Make sure it is a valid JSON exported from Race Coordinator.";
        }
        input.value = "";
      };
      reader.readAsText(file);
    }
  }

  reloadWindow() {
    window.location.reload();
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
    if (this.isRaceRunning) {
      this.showTrackEditorPrompt = true;
      this.cdr.detectChanges();
    } else {
      this.router.navigate(["/track-manager"]);
    }
  }

  onConfirmTrackEditor() {
    this.showTrackEditorPrompt = false;
    this.dataService.endRace().subscribe({
      next: (success) => {
        if (success) {
          this.logger.info(
            "Race ended successfully, navigating to track manager",
          );
          this.router.navigate(["/track-manager"]);
        } else {
          this.logger.warn("Failed to end race");
        }
      },
      error: (err) => {
        this.logger.error("Error ending race", err);
      },
    });
  }

  onCancelTrackEditor() {
    this.showTrackEditorPrompt = false;
  }

  editSelectedRace() {
    if (!this.selectedRace) return;
    sessionStorage.setItem("skipIntro", "true");
    const queryParams: any = {
      id: this.selectedRace.entity_id,
      from: "raceday-setup",
      returnUrl: "/raceday-setup",
    };
    if (this.selectedParticipants?.length > 0) {
      queryParams.driverCount = this.selectedParticipants.length;
    }
    this.router.navigate(["/race-editor"], { queryParams });
  }

  editSelectedSeason() {
    if (!this.selectedSeason) return;
    sessionStorage.setItem("skipIntro", "true");
    const queryParams: any = {
      id: this.selectedSeason.entity_id,
      from: "raceday-setup",
      returnUrl: "/raceday-setup",
    };
    this.router.navigate(["/season-editor"], { queryParams });
  }

  openRaceManager() {
    const queryParams: any = this.selectedRace
      ? { id: this.selectedRace.entity_id }
      : {};
    if (this.selectedParticipants.length > 0) {
      queryParams.driverCount = this.selectedParticipants.length;
    }
    this.closeConfigDropdown();
    this.router.navigate(["/race-manager"], { queryParams });
  }

  openEventManager() {
    const queryParams: any = this.selectedEvent
      ? { id: this.selectedEvent.entity_id }
      : {};
    this.closeConfigDropdown();
    this.router.navigate(["/event-manager"], { queryParams });
  }

  onSeasonChange() {
    this.calculateSeasonStandings();
    if (this.selectedSeason?.entity_id) {
      this.dataService
        .getSeasonStandings(this.selectedSeason.entity_id)
        .subscribe({
          next: (standings) => {
            this.seasonStandings = standings;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.logger.warn("Failed to fetch season standings", err);
          },
        });
    }
    this.saveSettings();
  }

  selectSeason(season?: Season) {
    this.selectedSeason = season;
    this.calculateSeasonStandings();
    if (season?.entity_id) {
      this.dataService.getSeasonStandings(season.entity_id).subscribe({
        next: (standings) => {
          if (this.selectedSeason?.entity_id === season.entity_id) {
            this.seasonStandings = standings;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.logger.warn("Failed to fetch season standings", err);
        },
      });
    }
    this.saveSettings();
  }

  calculateSeasonStandings(): void {
    this.seasonStandings = calculateSeasonStandings(this.selectedSeason);
  }

  compareSeasons(s1?: Season, s2?: Season): boolean {
    if (!s1 && !s2) return true;
    if (!s1 || !s2) return false;
    return s1.entity_id === s2.entity_id;
  }

  openSeasonManager() {
    const queryParams: any = this.selectedSeason
      ? { id: this.selectedSeason.entity_id }
      : {};
    this.closeConfigDropdown();
    this.router.navigate(["/season-manager"], { queryParams });
  }

  toggleConfigDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isConfigDropdownOpen;
    if (newState) {
      this.closeFileDropdown();
      this.closeOptionsDropdown();
      this.closeHelpDropdown();
      this.closeDropdown();
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
      this.closeFileDropdown();
      this.closeConfigDropdown();
      this.closeOptionsDropdown();
      this.closeDropdown();
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

  isAnyMenuDropdownOpen(): boolean {
    return (
      this.isFileDropdownOpen ||
      this.isConfigDropdownOpen ||
      this.isOptionsDropdownOpen ||
      this.isHelpDropdownOpen
    );
  }

  onMenuItemHover(label: string) {
    if (this.isAnyMenuDropdownOpen()) {
      if (label === "RDS_MENU_FILE" && this.isFileDropdownOpen) return;
      if (label === "RDS_MENU_CONFIG" && this.isConfigDropdownOpen) return;
      if (label === "RDS_MENU_OPTIONS" && this.isOptionsDropdownOpen) return;
      if (label === "RDS_MENU_HELP" && this.isHelpDropdownOpen) return;

      this.closeFileDropdown();
      this.closeConfigDropdown();
      this.closeOptionsDropdown();
      this.closeHelpDropdown();
      this.closeDropdown();

      if (label === "RDS_MENU_FILE") {
        this.isFileDropdownOpen = true;
      } else if (label === "RDS_MENU_CONFIG") {
        this.isConfigDropdownOpen = true;
      } else if (label === "RDS_MENU_OPTIONS") {
        this.isOptionsDropdownOpen = true;
      } else if (label === "RDS_MENU_HELP") {
        this.isHelpDropdownOpen = true;
      }
      this.cdr.detectChanges();
    }
  }

  formatEnumDisplay(value: string | undefined): string {
    if (!value) return "";
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getHeatRotationTypeDisplay(type: string | undefined): string {
    if (!type) return "";
    const key = `RE_ROTATION_${type
      .replace(/([A-Z])/g, "_$1")
      .toUpperCase()
      .replace(/^_/, "")}`;
    const translated = this.translationService.translate(key);
    return translated && translated !== key
      ? translated
      : type.replace(/([A-Z])/g, " $1").trim();
  }

  isPracticeRace(race: any): boolean {
    return !!(race?.practice || race?.heat_rotation_type === "Practice");
  }

  getHeatRankingDisplay(race: any): string {
    if (this.isPracticeRace(race)) {
      return this.translationService.translate("GEN_UNRANKED");
    }
    return this.formatEnumDisplay(race?.heat_scoring?.heat_ranking);
  }

  getOverallRankingDisplay(race: any): string {
    if (this.isPracticeRace(race)) {
      return this.translationService.translate("GEN_UNRANKED");
    }
    return this.formatEnumDisplay(race?.overall_scoring?.ranking_method);
  }

  getFinishValueDisplay(race: any): string {
    const val = race?.heat_scoring?.finish_value;
    if (val === 0 || val === "0") {
      return this.translationService.translate("GEN_INFINITE");
    }
    return val !== undefined && val !== null ? String(val) : "";
  }

  getThemeDisplayNameKey(theme: any): string {
    if (!theme) return "";
    if (
      theme.entity_id === "default_classic_rc_ai" ||
      theme.id === "default_classic_rc_ai" ||
      theme._id === "default_classic_rc_ai"
    ) {
      return "UE_LABEL_DEFAULT_THEME";
    }
    if (
      theme.entity_id === "practice_theme_rc_ai" ||
      theme.id === "practice_theme_rc_ai" ||
      theme._id === "practice_theme_rc_ai"
    ) {
      return "UE_LABEL_PRACTICE_THEME";
    }
    if (
      theme.entity_id === "default_fuel_theme_rc_ai" ||
      theme.id === "default_fuel_theme_rc_ai" ||
      theme._id === "default_fuel_theme_rc_ai"
    ) {
      return "UE_LABEL_FUEL_THEME";
    }
    return theme.name || theme.entity_id || "";
  }

  getThemeDisplay(race: any): string {
    const themeId = race?.theme_id || "default_classic_rc_ai";
    const themes = this.themeService.getThemes() || [];
    const theme = themes.find(
      (t) => (t.entity_id || (t as any).id || (t as any)._id) === themeId,
    );
    if (theme) {
      const key = this.getThemeDisplayNameKey(theme);
      return this.translationService.translate(key) || theme.name || themeId;
    }
    if (themeId === "default_classic_rc_ai") {
      return (
        this.translationService.translate("UE_LABEL_DEFAULT_THEME") || "Default"
      );
    }
    if (themeId === "practice_theme_rc_ai") {
      return (
        this.translationService.translate("UE_LABEL_PRACTICE_THEME") ||
        "Practice"
      );
    }
    if (themeId === "default_fuel_theme_rc_ai") {
      return this.translationService.translate("UE_LABEL_FUEL_THEME") || "Fuel";
    }
    return themeId;
  }

  isHandsFree(race?: any): boolean {
    if (!race) {
      return false;
    }
    return (race.auto_advance_time ?? 0) > 0 && (race.auto_start_time ?? 0) > 0;
  }

  hasWarmup(race?: any): boolean {
    if (!race) {
      return false;
    }
    return (
      (race.auto_advance_warmup_time ?? 0) > 0 ||
      (race.auto_start_warmup_time ?? 0) > 0
    );
  }

  openHelpCenter() {
    this.closeHelpDropdown();
    this.helpLinkService.openHelp("");
  }

  isUpdateBannerVisible = input<boolean>(false);

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

  onCheckForUpdates() {
    if (this.isUpdateBannerVisible()) return;
    this.closeFileDropdown();
    this.closeOptionsDropdown();
    this.closeHelpDropdown();
    this.requestCheckForUpdates.emit();
  }

  requestCheckForUpdates = output<void>();

  openDatabaseManager() {
    this.closeFileDropdown();
    this.router.navigate(["/database-manager"]);
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
        targetId: "available-drivers-section",
        title: this.translationService.translate(
          "RDS_HELP_DRIVER_AVAILABLE_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_DRIVER_AVAILABLE_CONTENT",
        ),
        position: "right",
      },
      {
        selector: "#available-drivers-section .header-actions",
        title: this.translationService.translate(
          "RDS_HELP_DRIVER_TEAM_STATS_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_DRIVER_TEAM_STATS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#available-drivers-section .list-search",
        title: this.translationService.translate(
          "RDS_HELP_SEARCH_AVAILABLE_DRIVERS_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_SEARCH_AVAILABLE_DRIVERS_CONTENT",
        ),
        position: "bottom",
      },
      {
        targetId: "racing-drivers-section",
        title: this.translationService.translate(
          "RDS_HELP_DRIVER_RACING_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_DRIVER_RACING_CONTENT",
        ),
        position: "right",
      },
      {
        selector: "#racing-drivers-section .section-header",
        title: this.translationService.translate(
          "RDS_HELP_DRIVER_ACTIONS_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_DRIVER_ACTIONS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#racing-drivers-section .list-search",
        title: this.translationService.translate(
          "RDS_HELP_SEARCH_DRIVERS_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_SEARCH_DRIVERS_CONTENT",
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
        selector: ".event-details-card",
        title: this.translationService.translate(
          "RDS_HELP_SELECTION_SUMMARY_TITLE",
        ),
        content: this.translationService.translate(
          "RDS_HELP_SELECTION_SUMMARY_CONTENT",
        ),
        position: "top",
      },
      {
        selector: ".preview-panel .search-wrapper",
        title: this.translationService.translate("RDS_HELP_SEARCH_TITLE"),
        content: this.translationService.translate("RDS_HELP_SEARCH_CONTENT"),
        position: "top",
      },
      {
        selector: ".season-selection-wrapper",
        title: this.translationService.translate("RDS_HELP_SEASON_TITLE"),
        content: this.translationService.translate("RDS_HELP_SEASON_CONTENT"),
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

  openRaceHistory(): void {
    this.isFileDropdownOpen = false;
    this.showRaceHistoryDialog = true;
    this.cdr.markForCheck();
  }

  loadSavedRaces() {
    this.isFileDropdownOpen = false;
    forkJoin({
      normal: this.dataService.getSavedRaces(false),
      demo: this.dataService.getSavedRaces(true),
    }).subscribe({
      next: (result) => {
        const normalList = result.normal
          .filter(
            (f) =>
              !f.filename.startsWith("autosave_") &&
              !f.filename.toLowerCase().includes("autosave"),
          )
          .map((f) => ({
            filename: f.filename,
            isDemo: false,
            corrupt: f.corrupt,
          }));
        const demoList = result.demo
          .filter(
            (f) =>
              !f.filename.startsWith("autosave_") &&
              !f.filename.toLowerCase().includes("autosave"),
          )
          .map((f) => ({
            filename: f.filename,
            isDemo: true,
            corrupt: f.corrupt,
          }));
        this.savedRaces = [...normalList, ...demoList];
        this.showLoadRaceModal = true;
        this.selectedSavedRace = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Failed to get saved races:", err),
    });
  }

  selectSavedRace(file: ISavedRace) {
    if (file.corrupt) {
      return;
    }
    this.selectedSavedRace = file;
  }

  startInlineRename(event: MouseEvent, file: ISavedRace) {
    event.stopPropagation();
    if (file.corrupt) return;
    this.editingSaveFilename = file.filename;
    let name = file.filename;
    if (name.toLowerCase().endsWith(".json")) {
      name = name.substring(0, name.length - 5);
    }
    this.editingSaveNewName = name;
    this.cdr.detectChanges();
  }

  saveInlineRename(file: ISavedRace) {
    if (!this.editingSaveNewName || !this.editingSaveNewName.trim()) {
      this.cancelInlineRename();
      return;
    }
    let normalized = this.editingSaveNewName.trim();
    if (!normalized.toLowerCase().endsWith(".json")) {
      normalized += ".json";
    }
    if (normalized === file.filename) {
      this.cancelInlineRename();
      return;
    }
    const oldFilename = file.filename;
    this.dataService
      .renameSavedRace(oldFilename, normalized, file.isDemo)
      .subscribe({
        next: () => {
          file.filename = normalized;
          this.savedRaces = [...this.savedRaces];
          if (this.selectedSavedRace?.filename === oldFilename) {
            this.selectedSavedRace = file;
          }
          this.editingSaveFilename = null;
          this.editingSaveNewName = "";
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Failed to rename saved race:", err);
          this.errorTitle = "Error";
          this.errorMessage =
            typeof err?.error === "string" && err.error.trim()
              ? err.error
              : err?.message || "Failed to rename saved race";
          this.showErrorModal = true;
          this.editingSaveFilename = null;
          this.editingSaveNewName = "";
          this.cdr.detectChanges();
        },
      });
  }

  cancelInlineRename() {
    this.editingSaveFilename = null;
    this.editingSaveNewName = "";
    this.cdr.detectChanges();
  }

  closeLoadRaceModal() {
    this.showLoadRaceModal = false;
  }

  confirmLoadRace() {
    if (!this.selectedSavedRace) return;

    this.dataService
      .loadRace(this.selectedSavedRace.filename, this.selectedSavedRace.isDemo)
      .subscribe({
        next: () => {
          this.closeLoadRaceModal();
          this.router.navigate(["/raceday"]);
        },
        error: (err) => console.error("Failed to load race:", err),
      });
  }

  deleteSavedRace(event: MouseEvent, file: ISavedRace) {
    event.stopPropagation(); // Prevent selection
    if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      this.dataService.deleteSavedRace(file.filename, file.isDemo).subscribe({
        next: () => {
          this.savedRaces = this.savedRaces.filter(
            (r) => r.filename !== file.filename,
          );
          if (this.selectedSavedRace?.filename === file.filename) {
            this.selectedSavedRace = null;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error("Failed to delete race:", err),
      });
    }
  }
}
