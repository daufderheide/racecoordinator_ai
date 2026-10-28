import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
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
import { DriverLabelsOverflowDirective } from "@app/directives/driver-labels-overflow.directive";
import { Driver } from "@app/models/driver";
import { DriverLabel } from "@app/models/driver-label";
import { Event as EventModel } from "@app/models/event";
import { Race } from "@app/models/race";
import { Season, SeasonStandingItem } from "@app/models/season";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IDemoConfig } from "@app/proto/antigravity";
import { FileSystemService } from "@app/services/file-system.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import {
  ParticipantValidationService,
  ValidationResult,
} from "@app/services/participant-validation.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { UpdateChannel } from "@app/services/update.service";
import { calculateSeasonStandings } from "@app/utils/season.utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

import {
  formatEnumDisplay,
  getContrastColor,
  getEventDriverLimitWarning,
  getFinishValueDisplay,
  getHeatRankingDisplay,
  getHeatRotationTypeDisplay,
  getItemMaxDrivers,
  getItemRaceId,
  getOverallRankingDisplay,
  getRaceCardBackgroundClass,
  getRaceFinishMethod,
  getRaceFinishValue,
  getStartRaceTooltip,
  getThemeDisplay,
  getThemeDisplayNameKey,
  hasWarmup,
  isHandsFree,
  isPracticeRace,
} from "./raceday-setup-formatting.helper";
import { getRacedaySetupHelpSteps } from "./raceday-setup-help.helper";
import { RacedaySetupInitHelper } from "./raceday-setup-init.helper";
import { RacedaySetupLaunchHelper } from "./raceday-setup-launch.helper";
import { RacedaySetupMenuHelper } from "./raceday-setup-menu.helper";
import { RacedaySetupNavigationHelper } from "./raceday-setup-navigation.helper";
import {
  computeUnselectedParticipants,
  filterParticipants,
  getDriver,
  getLocalizedName,
  getLocalizedNickname,
  getLocalizedTeamMembers,
  getParticipantAvatarUrl,
  getParticipantLabels,
  getParticipantUniqueId,
  getTeam,
  isDriver,
  isTeam,
  Participant,
  participantHasLabel,
} from "./raceday-setup-participant.helper";
import {
  ISavedRace,
  RacedaySetupSavedRaceHelper,
} from "./raceday-setup-saved-race.helper";
import { RacedaySetupSelectionHelper } from "./raceday-setup-selection.helper";
import { RacedaySetupUiHelper } from "./raceday-setup-ui.helper";

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
    DriverLabelsOverflowDirective,
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
  selectedParticipantItem: Participant | null = null;
  clickedParticipantItem: Participant | null = null;
  public allDrivers: Driver[] = [];
  public allTeams: Team[] = [];
  public driverLabels: DriverLabel[] = [];
  public selectedAvailableLabelIds: string[] = [];
  public selectedRacingLabelIds: string[] = [];
  public availableLabelMatchMode: "any" | "all" = "any";
  public racingLabelMatchMode: "any" | "all" = "any";

  get selectedAvailableLabelId(): string {
    return this.selectedAvailableLabelIds.length > 0
      ? this.selectedAvailableLabelIds[0]
      : "";
  }

  set selectedAvailableLabelId(val: string) {
    this.selectedAvailableLabelIds = val ? [val] : [];
  }

  get selectedRacingLabelId(): string {
    return this.selectedRacingLabelIds.length > 0
      ? this.selectedRacingLabelIds[0]
      : "";
  }

  set selectedRacingLabelId(val: string) {
    this.selectedRacingLabelIds = val ? [val] : [];
  }

  imageErrors = new Set<string>();

  // Search State
  raceSearchQuery: string = "";
  availableSearchQuery: string = "";
  racingSearchQuery: string = "";
  availableActiveIndex: number = 0;
  racingActiveIndex: number = 0;

  get filteredAvailableParticipants(): Participant[] {
    return filterParticipants(
      this.unselectedParticipants,
      this.selectedAvailableLabelIds,
      this.availableLabelMatchMode,
      this.availableSearchQuery,
      this.allDrivers,
      this.translationService,
    );
  }

  get filteredRacingParticipants(): Participant[] {
    return filterParticipants(
      this.selectedParticipants,
      this.selectedRacingLabelIds,
      this.racingLabelMatchMode,
      this.racingSearchQuery,
      this.allDrivers,
      this.translationService,
    );
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
  menuItems = RacedaySetupNavigationHelper.buildMenuItems(this);

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

  ngOnInit() {
    this.updateScale();

    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
      races: this.dataService.getRaces(),
      events: this.dataService.getEvents(),
      seasons: this.dataService.getSeasons(),
      driverLabels: this.dataService.getDriverLabels(),
    }).subscribe({
      next: (result) => this.initInitialData(result),
      error: (err) => this.logger.error("Error loading initial data", err),
    });

    this.initSystemSubscriptions();
  }

  private initInitialData(result: any) {
    RacedaySetupInitHelper.initInitialData(this, result);
  }

  private initSeasonSelection(localSettings: any) {
    RacedaySetupInitHelper.initSeasonSelection(this, localSettings);
  }

  private initRaceAndEventSelection(localSettings: any) {
    RacedaySetupInitHelper.initRaceAndEventSelection(this, localSettings);
  }

  private initParticipantSelection(
    drivers: Driver[],
    teams: Team[],
    localSettings: any,
  ) {
    RacedaySetupInitHelper.initParticipantSelection(
      this,
      drivers,
      teams,
      localSettings,
    );
  }

  private initSystemSubscriptions() {
    RacedaySetupInitHelper.initSystemSubscriptions(this);
  }

  detectShortcutKey() {
    RacedaySetupUiHelper.detectShortcutKey(this);
  }

  @HostListener("window:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent) {
    RacedaySetupUiHelper.onKeyDown(this, event);
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    RacedaySetupUiHelper.onDocumentClick(this, event);
  }

  private updateScale() {
    this.scale = RacedaySetupUiHelper.calculateScale(
      window.innerWidth,
      window.innerHeight,
    );
  }

  getParticipantAvatarUrl(participant: Participant): string {
    return getParticipantAvatarUrl(participant, this.dataService.serverUrl);
  }

  getLocalizedName(participant: Participant): string {
    return getLocalizedName(participant, this.translationService);
  }

  getLocalizedNickname(participant: Participant): string {
    return getLocalizedNickname(participant, this.translationService);
  }

  getLocalizedTeamMembers(participant: Participant): string {
    return getLocalizedTeamMembers(participant, this.translationService);
  }

  participantHasLabel(participant: Participant, labelId: string): boolean {
    return participantHasLabel(participant, labelId, this.allDrivers);
  }

  getParticipantLabels(participant: Participant): DriverLabel[] {
    return getParticipantLabels(
      participant,
      this.allDrivers,
      this.driverLabels,
    );
  }

  onAvailableLabelFilterChange(
    filter: string | string[] | { value: string | string[] },
  ): void {
    RacedaySetupSelectionHelper.onAvailableLabelFilterChange(this, filter);
  }

  onRacingLabelFilterChange(
    filter: string | string[] | { value: string | string[] },
  ): void {
    RacedaySetupSelectionHelper.onRacingLabelFilterChange(this, filter);
  }

  toggleAvailableLabelMatchMode(): void {
    RacedaySetupSelectionHelper.toggleAvailableLabelMatchMode(this);
  }

  toggleRacingLabelMatchMode(): void {
    RacedaySetupSelectionHelper.toggleRacingLabelMatchMode(this);
  }

  clearAvailableLabelFilter(): void {
    RacedaySetupSelectionHelper.clearAvailableLabelFilter(this);
  }

  clearRacingLabelFilter(): void {
    RacedaySetupSelectionHelper.clearRacingLabelFilter(this);
  }

  getContrastColor(color: string | undefined): string {
    return getContrastColor(color);
  }

  onParticipantImageError(participant: Participant) {
    const id = this.getParticipantUniqueId(participant);
    this.imageErrors.add(id);
    this.cdr.detectChanges();
  }

  isParticipantInRacing(participant: Participant): boolean {
    return RacedaySetupSelectionHelper.isParticipantInRacing(this, participant);
  }

  isParticipantInAvailable(participant: Participant): boolean {
    return RacedaySetupSelectionHelper.isParticipantInAvailable(
      this,
      participant,
    );
  }

  isAnyModalOrDropdownOpen(): boolean {
    return RacedaySetupNavigationHelper.isAnyMenuDropdownOpen(this);
  }

  handleEnterKey(event?: KeyboardEvent, inputElem?: HTMLInputElement): boolean {
    return RacedaySetupSelectionHelper.handleEnterKey(this, event, inputElem);
  }

  handleArrowKey(event: KeyboardEvent): boolean {
    return RacedaySetupSelectionHelper.handleArrowKey(this, event);
  }

  selectParticipant(participant: Participant, index?: number) {
    RacedaySetupSelectionHelper.selectParticipant(this, participant, index);
  }

  isParticipantSelected(participant: Participant): boolean {
    return RacedaySetupSelectionHelper.isParticipantSelected(this, participant);
  }

  toggleParticipantSelection(
    participant: Participant,
    isSelected: boolean,
    forcedFocusElem?: HTMLInputElement,
  ) {
    RacedaySetupSelectionHelper.toggleParticipantSelection(
      this,
      participant,
      isSelected,
      forcedFocusElem,
    );
  }

  private showParticipantValidationError(
    validationResult: ValidationResult,
  ): void {
    RacedaySetupSelectionHelper.showParticipantValidationError(
      this,
      validationResult,
    );
  }

  private updateAvailableActiveItem(): void {
    RacedaySetupSelectionHelper.updateAvailableActiveItem(this);
  }

  addAllParticipants(inputElem?: HTMLInputElement) {
    RacedaySetupSelectionHelper.addAllParticipants(this, inputElem);
  }

  addAllFilteredAvailableParticipants(inputElem?: HTMLInputElement) {
    this.addAllParticipants(inputElem);
  }

  removeAllFilteredRacingParticipants(inputElem?: HTMLInputElement) {
    RacedaySetupSelectionHelper.removeAllFilteredRacingParticipants(
      this,
      inputElem,
    );
  }

  onAvailableSearchQueryChange() {
    RacedaySetupSelectionHelper.onAvailableSearchQueryChange(this);
  }

  onRacingSearchQueryChange() {
    RacedaySetupSelectionHelper.onRacingSearchQueryChange(this);
  }

  onAvailableSearchKeydown(event: KeyboardEvent, inputElem?: HTMLInputElement) {
    RacedaySetupSelectionHelper.onAvailableSearchKeydown(
      this,
      event,
      inputElem,
    );
  }

  onRacingSearchKeydown(event: KeyboardEvent, inputElem?: HTMLInputElement) {
    RacedaySetupSelectionHelper.onRacingSearchKeydown(this, event, inputElem);
  }

  addActiveAvailableParticipant(inputElem?: HTMLInputElement) {
    RacedaySetupSelectionHelper.addActiveAvailableParticipant(this, inputElem);
  }

  removeActiveRacingParticipant(inputElem?: HTMLInputElement) {
    RacedaySetupSelectionHelper.removeActiveRacingParticipant(this, inputElem);
  }

  private scrollActiveAvailableItemIntoView() {
    RacedaySetupUiHelper.scrollActiveAvailableItemIntoView(this);
  }

  private scrollActiveRacingItemIntoView() {
    RacedaySetupUiHelper.scrollActiveRacingItemIntoView(this);
  }

  scrollRacingParticipantIntoView(participant: Participant) {
    RacedaySetupUiHelper.scrollRacingParticipantIntoView(this, participant);
  }

  removeAllParticipants() {
    RacedaySetupSelectionHelper.removeAllParticipants(this);
  }

  randomizeParticipants() {
    RacedaySetupSelectionHelper.randomizeParticipants(this);
  }

  isDriver(participant: Participant | undefined): participant is Driver {
    return isDriver(participant);
  }

  isTeam(participant: Participant | undefined): participant is Team {
    return isTeam(participant);
  }

  getDriver(participant: Participant | undefined): Driver | undefined {
    return getDriver(participant);
  }

  getTeam(participant: Participant | undefined): Team | undefined {
    return getTeam(participant);
  }

  getParticipantUniqueId(participant: Participant): string {
    return getParticipantUniqueId(participant);
  }

  private updateListWithRefresh(
    action: () => void,
    forcedFocusElem?: HTMLInputElement,
    onComplete?: () => void,
  ) {
    RacedaySetupUiHelper.updateListWithRefresh(
      this,
      action,
      forcedFocusElem,
      onComplete,
    );
  }

  private clearSelectionAndBlur() {
    RacedaySetupUiHelper.clearSelectionAndBlur();
  }

  private clearSelectionAsync() {
    RacedaySetupUiHelper.clearSelectionAsync();
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
    RacedaySetupSelectionHelper.drop(this, event);
  }

  toggleAvailableDrivers() {
    this.isAvailableDriversCollapsed = !this.isAvailableDriversCollapsed;
    this.cdr.detectChanges();
  }

  // --- Race Logic ---

  toggleDropdown(event: Event) {
    RacedaySetupLaunchHelper.toggleDropdown(this, event);
  }

  closeDropdown() {
    RacedaySetupLaunchHelper.closeDropdown(this);
  }

  toggleEventDropdown(e: MouseEvent) {
    RacedaySetupLaunchHelper.toggleEventDropdown(this, e);
  }

  selectEvent(event: EventModel) {
    RacedaySetupLaunchHelper.selectEvent(this, event);
  }

  selectRace(race: Race) {
    RacedaySetupLaunchHelper.selectRace(this, race);
  }

  private saveSettings(updateRecent: boolean = false) {
    RacedaySetupLaunchHelper.saveSettings(this, updateRecent);
  }

  startRace(isDemo: boolean) {
    RacedaySetupLaunchHelper.startRace(this, isDemo);
  }

  getItemRaceId(item: any): string {
    return getItemRaceId(item);
  }

  getItemMaxDrivers(item: any): number {
    return getItemMaxDrivers(item);
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
    return getRaceFinishMethod(raceId, this.races);
  }

  getRaceFinishValue(raceId: string): string {
    return getRaceFinishValue(raceId, this.races, this.translationService);
  }

  getEventDriverLimitWarning(): string | null {
    if (!this.isEventMode || !this.selectedEvent) return null;
    return getEventDriverLimitWarning(
      this.selectedEvent,
      this.selectedParticipants.length,
      this.races,
      this.translationService,
    );
  }

  joinRace() {
    this.router.navigate(["/raceday"]);
  }

  promptEndRace() {
    this.showEndRacePrompt = true;
    this.cdr.detectChanges();
  }

  onConfirmEndRace() {
    RacedaySetupLaunchHelper.onConfirmEndRace(this);
  }

  onCancelEndRace() {
    this.showEndRacePrompt = false;
  }

  onConfirmAutoSave() {
    RacedaySetupLaunchHelper.onConfirmAutoSave(this);
  }

  onCancelAutoSave() {
    RacedaySetupLaunchHelper.onCancelAutoSave(this);
  }

  private proceedWithStart(isDemo: boolean) {
    RacedaySetupLaunchHelper.proceedWithStart(this, isDemo);
  }

  private handleInitializeRaceError(response: any) {
    const err = RacedaySetupLaunchHelper.parseInitializeRaceError(
      response,
      this.selectedRace?.name || "",
      this.selectedEvent?.name || "",
      this.translationService,
    );
    this.errorTitle = err.errorTitle;
    this.errorMessage = err.errorMessage;
    this.errorMessageParams = err.errorMessageParams;
    this.showErrorModal = true;
    this.cdr.detectChanges();
  }

  selectQuickStartItem(item: any) {
    RacedaySetupLaunchHelper.selectQuickStartItem(this, item);
  }

  updateQuickStartRaces(recentRaceIds: string[] = []) {
    this.quickStartRaces = RacedaySetupLaunchHelper.computeQuickStartRaces(
      recentRaceIds,
      this.settingsService?.getSettings(),
      this.races,
      this.events,
    ) as Race[];
  }

  getStartRaceTooltip(): string {
    return getStartRaceTooltip(
      this.selectedParticipants.length > 0,
      this.translationService,
    );
  }

  getRaceCardBackgroundClass(index: number): string {
    return getRaceCardBackgroundClass(index);
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
    this.unselectedParticipants = computeUnselectedParticipants(
      this.selectedParticipants,
      this.allDrivers,
      this.allTeams,
    );
  }

  private naturalSortParticipants(a: Participant, b: Participant): number {
    return naturalSortCompare(a.name || "", b.name || "");
  }

  // --- Options Menu Logic ---

  toggleOptionsDropdown(event: Event) {
    RacedaySetupNavigationHelper.toggleOptionsDropdown(this, event);
  }

  toggleLogDropdown(event: Event) {
    RacedaySetupNavigationHelper.toggleLogDropdown(this, event);
  }

  toggleClientLogDropdown(event: Event) {
    RacedaySetupNavigationHelper.toggleClientLogDropdown(this, event);
  }

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
    RacedaySetupNavigationHelper.toggleServerLogDropdown(this, event);
  }

  closeOptionsDropdown() {
    this.isOptionsDropdownOpen = false;
  }

  onLanguageSelected() {
    this.closeOptionsDropdown();
  }

  setClientLogLevel(level: string) {
    RacedaySetupNavigationHelper.setClientLogLevel(this, level);
  }

  setServerLogLevel(level: string) {
    RacedaySetupNavigationHelper.setServerLogLevel(this, level);
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
    RacedaySetupNavigationHelper.toggleFileDropdown(this, event);
  }

  closeFileDropdown() {
    this.isFileDropdownOpen = false;
  }

  quit() {
    RacedaySetupMenuHelper.quit(this);
  }

  closeWindow() {
    RacedaySetupMenuHelper.closeWindow(this);
  }

  handleQuitBlockedFallback() {
    RacedaySetupMenuHelper.handleQuitBlockedFallback(this);
  }

  onAcknowledgeQuitModal() {
    RacedaySetupMenuHelper.onAcknowledgeQuitModal(this);
  }

  redirectToBlank() {
    RacedaySetupMenuHelper.redirectToBlank(this);
  }

  getWindowLocation(): Location {
    return window.location;
  }

  exportSettings(): Promise<boolean> {
    return RacedaySetupMenuHelper.exportSettings(this);
  }

  triggerImportSettings() {
    RacedaySetupMenuHelper.triggerImportSettings(this);
  }

  importSettings(event: Event) {
    RacedaySetupMenuHelper.importSettings(this, event);
  }

  reloadWindow() {
    window.location.reload();
  }

  openAssetManager() {
    this.closeFileDropdown();
    this.router.navigate(["/asset-manager"]);
  }

  openDriverManager() {
    RacedaySetupNavigationHelper.openDriverManager(this);
  }

  openTeamManager() {
    RacedaySetupNavigationHelper.openTeamManager(this);
  }

  openTrackManager() {
    RacedaySetupNavigationHelper.openTrackManager(this);
  }

  openLayoutEditor() {
    RacedaySetupNavigationHelper.openLayoutEditor(this);
  }

  onConfirmTrackEditor() {
    RacedaySetupNavigationHelper.onConfirmTrackEditor(this);
  }

  onCancelTrackEditor() {
    this.showTrackEditorPrompt = false;
  }

  editSelectedRace() {
    RacedaySetupNavigationHelper.editSelectedRace(this);
  }

  editSelectedSeason() {
    RacedaySetupNavigationHelper.editSelectedSeason(this);
  }

  openRaceManager() {
    RacedaySetupNavigationHelper.openRaceManager(this);
  }

  openEventManager() {
    RacedaySetupNavigationHelper.openEventManager(this);
  }

  onSeasonChange() {
    RacedaySetupNavigationHelper.onSeasonChange(this);
  }

  selectSeason(season?: Season) {
    RacedaySetupNavigationHelper.selectSeason(this, season);
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
    RacedaySetupNavigationHelper.openSeasonManager(this);
  }

  toggleConfigDropdown(event: Event) {
    RacedaySetupNavigationHelper.toggleConfigDropdown(this, event);
  }

  closeConfigDropdown() {
    this.isConfigDropdownOpen = false;
  }

  toggleHelpDropdown(event: Event) {
    RacedaySetupNavigationHelper.toggleHelpDropdown(this, event);
  }

  closeHelpDropdown() {
    RacedaySetupNavigationHelper.closeHelpDropdown(this);
  }

  isAnyMenuDropdownOpen(): boolean {
    return RacedaySetupNavigationHelper.isAnyMenuDropdownOpen(this);
  }

  onMenuItemHover(label: string) {
    RacedaySetupNavigationHelper.onMenuItemHover(this, label);
  }

  formatEnumDisplay(value: string | undefined): string {
    return formatEnumDisplay(value);
  }

  getHeatRotationTypeDisplay(type: string | undefined): string {
    return getHeatRotationTypeDisplay(type, this.translationService);
  }

  isPracticeRace(race: any): boolean {
    return isPracticeRace(race);
  }

  getHeatRankingDisplay(race: any): string {
    return getHeatRankingDisplay(race, this.translationService);
  }

  getOverallRankingDisplay(race: any): string {
    return getOverallRankingDisplay(race, this.translationService);
  }

  getFinishValueDisplay(race: any): string {
    return getFinishValueDisplay(race, this.translationService);
  }

  getThemeDisplayNameKey(theme: any): string {
    return getThemeDisplayNameKey(theme, this.translationService);
  }

  getThemeDisplay(race: any): string {
    return getThemeDisplay(
      race,
      this.themeService.getThemes(),
      this.translationService,
    );
  }

  isHandsFree(race?: any): boolean {
    return isHandsFree(race);
  }

  hasWarmup(race?: any): boolean {
    return hasWarmup(race);
  }

  openHelpCenter() {
    this.closeHelpDropdown();
    this.helpLinkService.openHelp("");
  }

  onBrandingClick() {
    RacedaySetupNavigationHelper.onBrandingClick(this);
  }

  onBrandingKeyDown(event: KeyboardEvent) {
    RacedaySetupNavigationHelper.onBrandingKeyDown(this, event);
  }

  isUpdateBannerVisible = input<boolean>(false);

  openAbout() {
    this.closeHelpDropdown();
    this.requestAbout.emit();
  }

  requestAbout = output<void>();

  onCheckForUpdates() {
    RacedaySetupNavigationHelper.onCheckForUpdates(this);
  }

  onChannelSelected(channel: UpdateChannel) {
    RacedaySetupNavigationHelper.onChannelSelected(this, channel);
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
    return getRacedaySetupHelpSteps(this.translationService);
  }

  openRaceHistory(): void {
    this.isFileDropdownOpen = false;
    this.showRaceHistoryDialog = true;
    this.cdr.markForCheck();
  }

  loadSavedRaces() {
    RacedaySetupSavedRaceHelper.loadSavedRaces(this);
  }

  selectSavedRace(file: ISavedRace) {
    RacedaySetupSavedRaceHelper.selectSavedRace(this, file);
  }

  startInlineRename(event: MouseEvent, file: ISavedRace) {
    RacedaySetupSavedRaceHelper.startInlineRename(this, event, file);
  }

  saveInlineRename(file: ISavedRace) {
    RacedaySetupSavedRaceHelper.saveInlineRename(this, file);
  }

  cancelInlineRename() {
    RacedaySetupSavedRaceHelper.cancelInlineRename(this);
  }

  closeLoadRaceModal() {
    RacedaySetupSavedRaceHelper.closeLoadRaceModal(this);
  }

  confirmLoadRace() {
    RacedaySetupSavedRaceHelper.confirmLoadRace(this);
  }

  showDeleteSavedRaceConfirm = false;
  savedRaceToDelete: ISavedRace | null = null;

  deleteSavedRace(event: MouseEvent, file: ISavedRace) {
    RacedaySetupSavedRaceHelper.deleteSavedRace(this, event, file);
  }

  onCancelDeleteSavedRace() {
    RacedaySetupSavedRaceHelper.onCancelDeleteSavedRace(this);
  }

  onConfirmDeleteSavedRace() {
    RacedaySetupSavedRaceHelper.onConfirmDeleteSavedRace(this);
  }
}
