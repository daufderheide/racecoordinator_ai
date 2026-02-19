import { Component, OnInit, AfterViewInit, ChangeDetectorRef, HostListener, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Driver } from 'src/app/models/driver';
import { Race } from 'src/app/models/race';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RaceService } from 'src/app/services/race.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings } from 'src/app/models/settings';
import { FileSystemService } from 'src/app/services/file-system.service';
import { HelpService } from 'src/app/services/help.service';
import { Team } from 'src/app/models/team';

type Participant = Driver | Team;

@Component({
  selector: 'app-default-raceday-setup',
  templateUrl: './default-raceday-setup.component.html',
  styleUrl: './default-raceday-setup.component.css',
  standalone: false
})
export class DefaultRacedaySetupComponent implements OnInit, AfterViewInit {
  @Output() requestServerConfig = new EventEmitter<void>();

  ngAfterViewInit() {
    setTimeout(() => {
      const settings = this.settingsService.getSettings();
      if (!settings.racedaySetupWalkthroughSeen) {
        this.startHelp();
        settings.racedaySetupWalkthroughSeen = true;
        this.settingsService.saveSettings(settings);
      }
    }, 500);
  }

  // Driver/Team State
  selectedParticipants: Participant[] = [];
  unselectedParticipants: Participant[] = [];

  imageErrors = new Set<string>();

  // Search State
  driverSearchQuery: string = '';
  raceSearchQuery: string = '';

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
  isRefreshingList: boolean = false;
  isLocalizationDropdownOpen: boolean = false;
  isConfigDropdownOpen: boolean = false;

  supportedLanguages: { code: string, nameKey: string }[] = [];
  currentLanguage: string = '';
  browserLanguage: string = '';
  menuItems = [
    { label: 'RDS_MENU_FILE', action: (event: MouseEvent) => this.toggleFileDropdown(event) },
    { label: 'RDS_MENU_CONFIG', action: (event: MouseEvent) => this.toggleConfigDropdown(event) },
    { label: 'RDS_MENU_OPTIONS', action: (event: MouseEvent) => this.toggleOptionsDropdown(event) },
    { label: 'RDS_MENU_HELP', action: () => this.startHelp() }
  ];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private raceService: RaceService,
    private router: Router,
    private translationService: TranslationService,
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private helpService: HelpService
  ) { }

  ngOnInit() {
    this.updateScale();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
      races: this.dataService.getRaces()
    }).subscribe({
      next: (result) => {
        const drivers = result.drivers.map(d => new Driver(
          d.entity_id,
          d.name,
          d.nickname || '',
          d.avatarUrl,
          {
            type: d.lapAudio?.type || (d.lapSoundType === 'tts' ? 'tts' : 'preset'),
            url: d.lapAudio?.url || d.lapSoundUrl,
            text: d.lapAudio?.text || d.lapSoundText
          },
          {
            type: d.bestLapAudio?.type || (d.bestLapSoundType === 'tts' ? 'tts' : 'preset'),
            url: d.bestLapAudio?.url || d.bestLapSoundUrl,
            text: d.bestLapAudio?.text || d.bestLapSoundText
          }
        ));
        const teams = result.teams.map((t: any) => new Team(
          t.entity_id || t.entityId || '',
          t.name || '',
          t.avatarUrl || undefined,
          t.driverIds || []
        ));
        const races = result.races;

        // --- Race Setup ---
        this.races = races.sort((a, b) => a.name.localeCompare(b.name));

        const localSettings = this.settingsService.getSettings();
        this.updateQuickStartRaces(localSettings.recentRaceIds);

        if (localSettings && localSettings.recentRaceIds?.length > 0) {
          const defaultRaceId = localSettings.recentRaceIds[0];
          this.selectedRace = this.races.find(r => r.entity_id === defaultRaceId);
        }

        if (!this.selectedRace && this.races.length > 0) {
          this.selectedRace = this.races[0];
        }

        // --- Participant Setup ---
        const allParticipants: Participant[] = [...drivers, ...teams];
        // Use prefixed IDs to avoid collision between drivers and teams sharing the same numeric sequence
        const participantMap = new Map(allParticipants.map(p => [this.isDriver(p) ? `d_${p.entity_id}` : `t_${p.entity_id}`, p]));

        // Populate Selected (in saved order)
        if (localSettings && localSettings.selectedDriverIds) {
          for (const rawId of localSettings.selectedDriverIds) {
            // Support both prefixed and non-prefixed IDs for backward compatibility
            let prefixedId = rawId;
            if (!rawId.startsWith('d_') && !rawId.startsWith('t_')) {
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
        } // 抽离. driver name and team name. Unselected (Alphabetical)
        this.unselectedParticipants = Array.from(participantMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading initial data', err)
    });

    this.translationService.getTranslationsLoaded().subscribe(loaded => {
      this.translationsLoaded = loaded;
      this.cdr.detectChanges();
    });

    this.supportedLanguages = this.translationService.getSupportedLanguages().sort((a, b) => {
      const nameA = this.translationService.translate(a.nameKey);
      const nameB = this.translationService.translate(b.nameKey);
      return nameA.localeCompare(nameB);
    });
    this.currentLanguage = this.settingsService.getSettings().language;
    this.browserLanguage = this.translationService.getBrowserLanguage().toUpperCase();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.closeDropdown();
    }
    if (!target.closest('.options-menu-container')) {
      this.closeOptionsDropdown();
    }
    if (!target.closest('.file-menu-container')) {
      this.closeFileDropdown();
    }
    if (!target.closest('.config-menu-container')) {
      this.closeConfigDropdown();
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
    if (!participant.avatarUrl) return '';
    if (participant.avatarUrl.startsWith('/')) {
      return `${this.dataService.serverUrl}${participant.avatarUrl}`;
    }
    return participant.avatarUrl;
  }

  onParticipantImageError(participant: Participant) {
    this.imageErrors.add((this.isDriver(participant) ? 'd_' : 't_') + participant.entity_id); // 抽离. driver name and team name.
  }

  // --- Participant Logic ---

  toggleParticipantSelection(participant: Participant, isSelected: boolean) {
    this.updateListWithRefresh(() => {
      if (isSelected) {
        // Was selected, now unselecting
        this.selectedParticipants = this.selectedParticipants.filter(p =>
          !(p.entity_id === participant.entity_id && this.isDriver(p) === this.isDriver(participant))
        );
        this.unselectedParticipants = [...this.unselectedParticipants, participant].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        // Was unselected, now selecting
        this.unselectedParticipants = this.unselectedParticipants.filter(p =>
          !(p.entity_id === participant.entity_id && this.isDriver(p) === this.isDriver(participant))
        );
        this.selectedParticipants = [...this.selectedParticipants, participant];
      }
    });
  } // 抽离. driver name and team name.

  addAllParticipants() {
    this.updateListWithRefresh(() => {
      this.selectedParticipants = [...this.selectedParticipants, ...this.unselectedParticipants];
      this.unselectedParticipants = [];
    });
  }

  removeAllParticipants() {
    this.updateListWithRefresh(() => {
      this.unselectedParticipants = [...this.unselectedParticipants, ...this.selectedParticipants].sort((a, b) => a.name.localeCompare(b.name));
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
    return participant instanceof Driver;
  }

  isTeam(participant: Participant | undefined): participant is Team {
    return participant instanceof Team;
  }

  getDriver(participant: Participant | undefined): Driver | undefined {
    return participant instanceof Driver ? participant : undefined;
  }

  getTeam(participant: Participant | undefined): Team | undefined {
    return participant instanceof Team ? participant : undefined;
  }

  getParticipantUniqueId(participant: Participant): string {
    return (this.isDriver(participant) ? 'd_' : 't_') + participant.entity_id;
  } // 抽离. driver name and team name.

  private updateListWithRefresh(action: () => void) {
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
    return (this.isDriver(participant) ? 'd_' : 't_') + participant.entity_id; // 抽离. driver name and team name.
  }

  preventSelection(event: Event) {
    event.preventDefault();
  }

  onDragStarted(event: any) {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  drop(event: CdkDragDrop<Participant[]>) {
    // Only reorder within the selected list and if dropped strictly inside the container
    if (event.container.id === 'selected-list' && event.isPointerOverContainer) {
      moveItemInArray(this.selectedParticipants, event.previousIndex, event.currentIndex);
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
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  selectRace(race: Race) {
    this.selectedRace = race;
    this.saveSettings();
    this.closeDropdown();
  }

  private saveSettings() {
    const localSettings = this.settingsService.getSettings();
    let recentRaceIds = localSettings.recentRaceIds || [];

    if (this.selectedRace) {
      // Prepend the new race ID, remove it if it was already in the list
      recentRaceIds = [this.selectedRace.entity_id, ...recentRaceIds.filter(id => id !== this.selectedRace?.entity_id)];
      // Keep only the last two
      recentRaceIds = recentRaceIds.slice(0, 2);
    }

    // Always persist
    const settings = new Settings(
      recentRaceIds,
      this.selectedParticipants.map(p => this.getParticipantUniqueId(p)),
      localSettings.serverIp,
      localSettings.serverPort,
      localSettings.language,
      localSettings.racedaySetupWalkthroughSeen,
      localSettings.flagGreen,
      localSettings.flagYellow,
      localSettings.flagRed,
      localSettings.flagWhite,
      localSettings.flagBlack,
      localSettings.flagCheckered
    );
    this.settingsService.saveSettings(settings); // 抽离. driver name and team name.
    this.updateQuickStartRaces(recentRaceIds);
  }

  startRace(isDemo: boolean = false) {
    if (this.selectedRace && this.selectedParticipants.length > 0) {
      console.log(`Starting race: ${this.selectedRace.name} with ${this.selectedParticipants.length} participants`);

      // Ensure settings are up to date before redirecting
      this.saveSettings();

      const settings = this.settingsService.getSettings(); // Get back what we just saved (or what was there)

      this.dataService.initializeRace(this.selectedRace.entity_id, settings.selectedDriverIds, isDemo).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/raceday']);
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  updateQuickStartRaces(recentRaceIds: string[] = []) {
    this.quickStartRaces = [];

    // 1. Try to populate from recent list
    if (recentRaceIds && recentRaceIds.length > 0) {
      for (const id of recentRaceIds) {
        const race = this.races.find(r => r.entity_id === id);
        if (race) {
          this.quickStartRaces.push(race);
        }
      }
    }

    // 2. If we don't have enough, try to find "Grand Prix" or "Time Trial" as defaults if they aren't already in the list
    if (this.quickStartRaces.length < 2) {
      const defaults = [
        this.races.find(r => r.name.toLowerCase().includes('grand prix')),
        this.races.find(r => r.name.toLowerCase().includes('time trial'))
      ].filter(r => r !== undefined && !this.quickStartRaces.some(qsr => qsr.entity_id === r.entity_id)) as Race[];

      for (const d of defaults) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(d);
        }
      }
    }

    // 3. Last fallback: just pick first available races
    if (this.quickStartRaces.length < 2) {
      const remaining = this.races.filter(r => !this.quickStartRaces.some(qsr => qsr.entity_id === r.entity_id));
      for (const r of remaining) {
        if (this.quickStartRaces.length < 2) {
          this.quickStartRaces.push(r);
        }
      }
    }
  }

  getStartRaceTooltip(): string {
    if (this.selectedParticipants.length > 0) return '';
    const translated = this.translationService.translate('RDS_START_RACE_TOOLTIP');
    console.log('DEBUG: getStartRaceTooltip returning:', translated);
    return translated;
  }

  getRaceCardBackgroundClass(index: number): string {
    const backgrounds = ['card-bg-gp', 'card-bg-tt']; // Add more if available
    return backgrounds[index % backgrounds.length];
  }

  get filteredUnselectedParticipants(): Participant[] {
    if (!this.driverSearchQuery) return this.unselectedParticipants;
    const q = this.driverSearchQuery.toLowerCase();
    return this.unselectedParticipants.filter(p =>
      p.name.toLowerCase().includes(q) ||
      ((p as any).nickname && (p as any).nickname.toLowerCase().includes(q))
    );
  }

  get filteredRaces(): Race[] {
    if (!this.raceSearchQuery) return this.races;
    const q = this.raceSearchQuery.toLowerCase();
    return this.races.filter(r => r.name.toLowerCase().includes(q));
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
  }

  toggleLocalizationDropdown(event: Event) {
    event.stopPropagation();
    this.isLocalizationDropdownOpen = !this.isLocalizationDropdownOpen;
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
    if (code === '') {
      return `${this.translationService.translate('RDS_LANG_DEFAULT')} (${this.browserLanguage})`;
    }
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang ? this.translationService.translate(lang.nameKey) : code;
  }

  configureCustomUI() {
    this.closeOptionsDropdown();
    this.router.navigate(['/ui-editor']);
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
  }

  closeFileDropdown() {
    this.isFileDropdownOpen = false;
  }

  openAssetManager() {
    this.closeFileDropdown();
    this.router.navigate(['/asset-manager']);
  }

  openDriverManager() {
    this.closeConfigDropdown();
    this.router.navigate(['/driver-manager']);
  }

  openTeamManager() {
    this.closeConfigDropdown();
    this.router.navigate(['/team-manager']);
  }

  openTrackManager() {
    this.closeConfigDropdown();
    this.router.navigate(['/track-manager']);
  }

  openRaceManager() {
    const queryParams: any = this.selectedRace ? { id: this.selectedRace.entity_id } : {};
    // Pass the number of selected participants to the race manager for heat generation
    queryParams.driverCount = this.selectedParticipants.length;
    this.closeConfigDropdown();
    this.router.navigate(['/race-manager'], { queryParams });
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
  }

  closeConfigDropdown() {
    this.isConfigDropdownOpen = false;
  }

  openDatabaseManager() {
    this.closeFileDropdown();
    this.router.navigate(['/database-manager']);
  }

  startHelp() {
    this.helpService.startGuide([
      {
        title: this.translationService.translate('RDS_HELP_WELCOME_TITLE'),
        content: this.translationService.translate('RDS_HELP_WELCOME_CONTENT')
      },
      {
        selector: '.help-icon',
        title: this.translationService.translate('RDS_HELP_WALKTHROUGH_TITLE'),
        content: this.translationService.translate('RDS_HELP_WALKTHROUGH_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '.panel.driver-panel',
        title: this.translationService.translate('RDS_HELP_DRIVER_SELECTION_TITLE'),
        content: this.translationService.translate('RDS_HELP_DRIVER_SELECTION_CONTENT'),
        position: 'right'
      },
      {
        selector: '.driver-action-bar',
        title: this.translationService.translate('RDS_HELP_DRIVER_ACTIONS_TITLE'),
        content: this.translationService.translate('RDS_HELP_DRIVER_ACTIONS_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '.custom-dropdown-container',
        title: this.translationService.translate('RDS_HELP_RACE_SELECTION_TITLE'),
        content: this.translationService.translate('RDS_HELP_RACE_SELECTION_CONTENT'),
        position: 'top'
      },
      {
        targetId: 'race-card-0',
        title: this.translationService.translate('RDS_HELP_RECENT_RACE_TITLE'),
        content: this.translationService.translate('RDS_HELP_RECENT_RACE_MOST_RECENT_CONTENT'),
        position: 'bottom'
      },
      {
        targetId: 'race-card-1',
        title: this.translationService.translate('RDS_HELP_RECENT_RACE_TITLE'),
        content: this.translationService.translate('RDS_HELP_RECENT_RACE_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '.btn-start',
        title: this.translationService.translate('RDS_HELP_START_RACE_TITLE'),
        content: this.translationService.translate('RDS_HELP_START_RACE_CONTENT'),
        position: 'top'
      },
      {
        selector: '.btn-demo',
        title: this.translationService.translate('RDS_HELP_START_DEMO_TITLE'),
        content: this.translationService.translate('RDS_HELP_START_DEMO_CONTENT'),
        position: 'top'
      }
    ]);
  }
}
