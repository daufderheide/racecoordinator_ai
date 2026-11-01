import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { DefaultRacedayAudioEventsBase } from "@app/components/raceday/bases/default-raceday-audio-events.base";
import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { RacedayActionsMenuHelper } from "@app/components/raceday/helpers/raceday-actions-menu.helper";
import { RacedayDriverStandingsHelper } from "@app/components/raceday/helpers/raceday-driver-standings.helper";
import { RacedayExportHelper } from "@app/components/raceday/helpers/raceday-export.helper";
import { RacedayHeatDriverReorderHelper } from "@app/components/raceday/helpers/raceday-heat-driver-reorder.helper";
import { RacedayKeyboardHelper } from "@app/components/raceday/helpers/raceday-keyboard.helper";
import { RacedayRaceStatusHelper } from "@app/components/raceday/helpers/raceday-race-status.helper";
import { RacedayRecordsStatsHelper } from "@app/components/raceday/helpers/raceday-records-stats.helper";
import { RacedayScaleWindowHelper } from "@app/components/raceday/helpers/raceday-scale-window.helper";
import { PdfExportOptions } from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { HeatScoring } from "@app/models/heat_scoring";
import { RaceParticipant } from "@app/models/race_participant";
import { IRecordEntry } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { RacePredictionRecord } from "@app/services/race-prediction.service";
import { TeammateUtils } from "@app/utils/teammate.utils";

export abstract class DefaultRacedayActionsBase extends DefaultRacedayAudioEventsBase {
  get groupEnabled(): boolean {
    return (this as any).race?.group_options?.enabled || false;
  }

  get isEvent(): boolean {
    return !!((this as any).race as any)?.is_event;
  }

  get eventName(): string {
    return ((this as any).race as any)?.event_name || "";
  }

  get currentEventRaceIndex(): number {
    return (((this as any).race as any)?.current_event_race_index || 0) + 1;
  }

  get totalEventRaces(): number {
    return ((this as any).race as any)?.total_event_races || 0;
  }

  get autoAdvanceRemainingSeconds(): number {
    return ((this as any).race as any)?.auto_advance_remaining_seconds || 0;
  }

  protected updateLeaderboardEntries(): void {
    RacedayDriverStandingsHelper.updateLeaderboardEntries(this);
  }

  protected updateGroupLeaderboardEntries(): void {
    RacedayDriverStandingsHelper.updateGroupLeaderboardEntries(this);
  }

  protected syncHeatDriversWithParticipants(): void {
    RacedayDriverStandingsHelper.syncHeatDriversWithParticipants(this);
  }

  protected getLeaderboardPosition(entry: any): number {
    return RacedayDriverStandingsHelper.getLeaderboardPosition(this, entry);
  }

  protected getLeaderboardScoreFormat(entry: any): string {
    return RacedayDriverStandingsHelper.getLeaderboardScoreFormat(this, entry);
  }

  protected sortHeatDrivers(): void {
    RacedayDriverStandingsHelper.sortHeatDrivers(this);
  }

  protected loadPredictionsForCurrentRace(): void {
    RacedayDriverStandingsHelper.loadPredictionsForCurrentRace(this);
  }

  protected applyPredictionsToDrivers(record: RacePredictionRecord): void {
    RacedayDriverStandingsHelper.applyPredictionsToDrivers(this, record);
  }

  generateAllLaneQrCodes(): void {
    RacedayDriverStandingsHelper.generateAllLaneQrCodes(this);
  }

  getLaneQrCodeUrl(laneIndex: number): string {
    return RacedayDriverStandingsHelper.getLaneQrCodeUrl(this, laneIndex);
  }

  getDriverViewQrCodeUrl(hd: DriverHeatData | number): string {
    return RacedayDriverStandingsHelper.getDriverViewQrCodeUrl(this, hd);
  }

  isTeamDriverSwapActive(hd: DriverHeatData, col: ColumnDefinition): boolean {
    return RacedayDriverStandingsHelper.isTeamDriverSwapActive(this, hd, col);
  }

  isLapCountColumnClickable(
    hd: DriverHeatData,
    col: ColumnDefinition,
  ): boolean {
    return RacedayDriverStandingsHelper.isLapCountColumnClickable(this, col);
  }

  isTeam(hd: DriverHeatData | any): boolean {
    return RacedayDriverStandingsHelper.isTeam(this, hd);
  }

  getTeammates(hd: DriverHeatData | any): any[] {
    return RacedayDriverStandingsHelper.getTeammates(this, hd);
  }

  onTeammateChange(hd: DriverHeatData, event: any): void {
    RacedayDriverStandingsHelper.onTeammateChange(this, hd, event);
  }

  onNextHeatTeammateChange(
    hd: DriverHeatData,
    event: any,
    heatNumber: number,
  ): void {
    RacedayDriverStandingsHelper.onNextHeatTeammateChange(
      this,
      hd,
      event,
      heatNumber,
    );
  }

  trackByLeaderboardEntry(index: number, entry: any): any {
    return (
      entry?.driver?.id || entry?.driver?.objectId || entry?.driverId || index
    );
  }

  isDriverSwapDisabled(hd: any): boolean {
    return RacedayDriverStandingsHelper.isDriverSwapDisabled(this, hd);
  }

  getDriverStats(hd: any, driverId: string): string {
    return TeammateUtils.getDriverStats(
      hd,
      driverId,
      (this as any).raceService?.getHeats(),
      {
        heatAbbr: (this as any).translationService?.translate(
          "RD_STATS_HEAT_ABBR",
        ),
        lapAbbr: (this as any).translationService?.translate(
          "RD_STATS_LAP_ABBR",
        ),
        totalAbbr: (this as any).translationService?.translate(
          "RD_STATS_TOTAL_ABBR",
        ),
      },
    );
  }

  onCellClick(
    hd: DriverHeatData,
    col: ColumnDefinition,
    event: MouseEvent,
  ): void {
    RacedayDriverStandingsHelper.onCellClick(this, hd, col, event);
  }

  protected handleNumberLapSections(event: number): void {
    RacedayDriverStandingsHelper.handleNumberLapSections(this, event);
  }

  protected handleBatchLapSections(updates: any[]): void {
    RacedayDriverStandingsHelper.handleBatchLapSections(this, updates);
  }

  protected handleCurrentHeatDriverLapSections(event: any): void {
    RacedayDriverStandingsHelper.handleCurrentHeatDriverLapSections(
      this,
      event,
    );
  }

  protected handleHeatDriverLapSections(event: any): void {
    RacedayDriverStandingsHelper.handleHeatDriverLapSections(this, event);
  }

  protected onAddLapSectionsConfirm(event: any): void {
    RacedayDriverStandingsHelper.onAddLapSectionsConfirm(this, event);
  }

  protected updateUserLaps(hd: DriverHeatData, amount: number): void {
    RacedayDriverStandingsHelper.updateUserLaps(this, hd, amount);
  }

  getDriverVisualPosition(hd: DriverHeatData): number {
    return RacedayHeatDriverReorderHelper.getDriverVisualPosition(this, hd);
  }

  protected get isSingleHeatSolo(): boolean {
    return RacedayHeatDriverReorderHelper.isSingleHeatSolo(this);
  }

  protected get isSingleHeat(): boolean {
    return RacedayHeatDriverReorderHelper.isSingleHeat(this);
  }

  protected get canSwapLanes(): boolean {
    return RacedayHeatDriverReorderHelper.canSwapLanes(this);
  }

  protected onDrop(event: CdkDragDrop<DriverHeatData[]>): void {
    RacedayHeatDriverReorderHelper.onDrop(this, event);
  }

  protected onDragStarted(laneIndex: number): void {
    RacedayHeatDriverReorderHelper.onDragStarted(this, laneIndex);
  }

  protected onDragOver(laneIndex: number): void {
    RacedayHeatDriverReorderHelper.onDragOver(this, laneIndex);
  }

  protected onDragEnded(): void {
    RacedayHeatDriverReorderHelper.onDragEnded(this);
  }

  protected isLaneOccupied(hd: DriverHeatData): boolean {
    return RacedayHeatDriverReorderHelper.isLaneOccupied(hd);
  }

  protected detectShortcutKey(): void {
    RacedayHeatDriverReorderHelper.detectShortcutKey(this);
  }

  protected loadRaceData(): void {
    RacedayHeatDriverReorderHelper.loadRaceData(this);
  }

  protected initializeHeat(): void {
    RacedayHeatDriverReorderHelper.initializeHeat(this);
  }

  checkDriverStatus(): void {
    RacedayHeatDriverReorderHelper.checkDriverStatus(this);
  }

  getDriverParticipant(hd: DriverHeatData): RaceParticipant | undefined {
    return RacedayHeatDriverReorderHelper.getDriverParticipant(this, hd);
  }

  getDriverOverallRanking(hd: DriverHeatData): number | undefined {
    return RacedayHeatDriverReorderHelper.getDriverOverallRanking(this, hd);
  }

  getDriverGroupRanking(hd: DriverHeatData): number | undefined {
    return RacedayHeatDriverReorderHelper.getDriverGroupRanking(this, hd);
  }

  getLaneRecord(hd?: DriverHeatData): number {
    return RacedayRecordsStatsHelper.getLaneRecord(this, hd);
  }

  getLaneRecordEntry(hd?: DriverHeatData | number): IRecordEntry | undefined {
    return RacedayRecordsStatsHelper.getLaneRecordEntry(this, hd);
  }

  getLaneRecordTime(hd?: DriverHeatData, anchor?: string): string {
    return RacedayRecordsStatsHelper.getLaneRecordTime(this, hd, anchor);
  }

  getLaneRecordHolder(hd?: DriverHeatData): string {
    return RacedayRecordsStatsHelper.getLaneRecordHolder(this, hd);
  }

  getLaneRecordDate(hd?: DriverHeatData): string {
    return RacedayRecordsStatsHelper.getLaneRecordDate(this, hd);
  }

  getBestRaceLapEntry(hd?: DriverHeatData | number): IRecordEntry | undefined {
    return RacedayRecordsStatsHelper.getBestRaceLapEntry(this, hd);
  }

  getBestRaceLapTime(hd?: DriverHeatData, anchor?: string): string {
    return RacedayRecordsStatsHelper.getBestRaceLapTime(this, hd, anchor);
  }

  getBestRaceLapHolder(hd?: DriverHeatData): string {
    return RacedayRecordsStatsHelper.getBestRaceLapHolder(this, hd);
  }

  getBestRaceLapHeat(hd?: DriverHeatData): string {
    return RacedayRecordsStatsHelper.getBestRaceLapHeat(this, hd);
  }

  getPersonalBest(hd?: DriverHeatData): number {
    return RacedayRecordsStatsHelper.getPersonalBest(hd);
  }

  getLeaderHeatDriver(): DriverHeatData | undefined {
    return RacedayRecordsStatsHelper.getLeaderHeatDriver(this);
  }

  get heatLeaderAvgTime(): number {
    const leader = this.getLeaderHeatDriver();
    return leader && leader.averageLapTime > 0 ? leader.averageLapTime : 0;
  }

  get heatLeaderMedianTime(): number {
    const leader = this.getLeaderHeatDriver();
    return leader && leader.medianLapTime > 0 ? leader.medianLapTime : 0;
  }

  get heatLeaderBestTime(): number {
    const leader = this.getLeaderHeatDriver();
    if (leader && leader.bestLapTime > 0) return leader.bestLapTime;
    return (this as any).heatBestTime || 0;
  }

  get leaderBoardWindow(): Window | null {
    return (this as any).childWindowManagerService?.getLeaderBoardWindow();
  }
  set leaderBoardWindow(val: Window | null) {
    (this as any).childWindowManagerService?.setLeaderBoardWindow(val);
  }

  get heatResultsWindow(): Window | null {
    return (this as any).childWindowManagerService?.getHeatResultsWindow();
  }
  set heatResultsWindow(val: Window | null) {
    (this as any).childWindowManagerService?.setHeatResultsWindow(val);
  }

  get raceResultsWindow(): Window | null {
    return (this as any).childWindowManagerService?.getRaceResultsWindow();
  }
  set raceResultsWindow(val: Window | null) {
    (this as any).childWindowManagerService?.setRaceResultsWindow(val);
  }

  get seasonResultsWindow(): Window | null {
    return (this as any).childWindowManagerService?.getSeasonResultsWindow();
  }
  set seasonResultsWindow(val: Window | null) {
    (this as any).childWindowManagerService?.setSeasonResultsWindow(val);
  }

  get predictionResultsWindow(): Window | null {
    return (
      this as any
    ).childWindowManagerService?.getPredictionResultsWindow();
  }
  set predictionResultsWindow(val: Window | null) {
    (this as any).childWindowManagerService?.setPredictionResultsWindow(val);
  }

  get driverStationTabs(): Window[] {
    return (
      (this as any).childWindowManagerService?.getDriverStationTabs() || []
    );
  }
  set driverStationTabs(val: Window[]) {
    if (val.length === 0) {
      (this as any).childWindowManagerService?.clearDriverStationTabs();
    }
  }

  toggleLayoutEditorMinimize(event: Event): void {
    RacedayScaleWindowHelper.toggleLayoutEditorMinimize(this, event);
  }

  ensureToolboxVisible(): void {
    RacedayScaleWindowHelper.ensureToolboxVisible(this);
  }

  resetLayoutEditorPosition(event?: MouseEvent): void {
    RacedayScaleWindowHelper.resetLayoutEditorPosition(this, event);
  }

  onLayoutEditorDragEnded(event: any): void {
    RacedayScaleWindowHelper.onLayoutEditorDragEnded(this, event);
  }

  get isLetterboxMode(): boolean {
    if ((this as any).isUIEditorMode?.()) return false;
    return (this as any).layout?.scaleMode === "letterbox";
  }

  isPortraitLayout(): boolean {
    return RacedayScaleWindowHelper.isPortraitLayout(this);
  }

  onResize(): void {
    RacedayScaleWindowHelper.onResize(this);
  }

  onDocumentClick(event: MouseEvent): void {
    RacedayScaleWindowHelper.onDocumentClick(this, event);
  }

  protected updateScale(): void {
    RacedayScaleWindowHelper.updateScale(this);
  }

  clampLayoutEditorPosition(pos: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    return RacedayScaleWindowHelper.clampLayoutEditorPosition(this, pos);
  }

  toggleMenu(): void {
    RacedayActionsMenuHelper.toggleMenu(this);
  }

  toggleFileMenu(): void {
    RacedayActionsMenuHelper.toggleFileMenu(this);
  }

  toggleDriversStationMenu(): void {
    RacedayActionsMenuHelper.toggleDriversStationMenu(this);
  }

  toggleManageMenu(): void {
    RacedayActionsMenuHelper.toggleManageMenu(this);
  }

  toggleWindowsMenu(): void {
    RacedayActionsMenuHelper.toggleWindowsMenu(this);
  }

  toggleOptionsMenu(): void {
    RacedayActionsMenuHelper.toggleOptionsMenu(this);
  }

  onLanguageSelected(): void {
    RacedayActionsMenuHelper.onLanguageSelected(this);
  }

  navigateToUiEditor(): void {
    RacedayActionsMenuHelper.navigateToUiEditor(this);
  }

  navigateToLayoutEditor(): void {
    RacedayActionsMenuHelper.navigateToLayoutEditor(this);
  }

  navigateToThemeEditor(): void {
    RacedayActionsMenuHelper.navigateToThemeEditor(this);
  }

  onManageSelect(action: string): void {
    RacedayActionsMenuHelper.onManageSelect(this, action);
  }

  onOptionsSelect(action: string): void {
    RacedayActionsMenuHelper.onOptionsSelect(this, action);
  }

  isAnyMenuDropdownOpen(): boolean {
    return RacedayActionsMenuHelper.isAnyMenuDropdownOpen(this);
  }

  onMenuItemHover(menuName: string): void {
    RacedayActionsMenuHelper.onMenuItemHover(this, menuName);
  }

  onMenuSelect(action: string): void {
    RacedayActionsMenuHelper.onMenuSelect(this, action);
  }

  openAbout(): void {
    RacedayActionsMenuHelper.openAbout(this);
  }

  openHelpCenter(): void {
    RacedayActionsMenuHelper.openHelpCenter(this);
  }

  protected handleStartResumeAction(): void {
    RacedayActionsMenuHelper.handleStartResumeAction(this);
  }

  protected handleNextHeatAction(): void {
    RacedayActionsMenuHelper.handleNextHeatAction(this);
  }

  protected executeMenuAction(action: string): void {
    RacedayActionsMenuHelper.executeMenuAction(this, action);
  }

  protected executePauseOrAbort(action: string): void {
    RacedayActionsMenuHelper.executePauseOrAbort(this, action);
  }

  onWindowsMenuSelect(action: string): void {
    RacedayActionsMenuHelper.onWindowsMenuSelect(this, action);
  }

  onThemeMenuSelect(themeId: string): void {
    RacedayActionsMenuHelper.onThemeMenuSelect(this, themeId);
  }

  updateTabTitle(themeIdOverride?: string): void {
    RacedayActionsMenuHelper.updateTabTitle(this, themeIdOverride);
  }

  onFileMenuSelect(action: string): void {
    RacedayActionsMenuHelper.onFileMenuSelect(this, action);
  }

  get isBackDisabled(): boolean {
    return RacedayActionsMenuHelper.isBackDisabled(this);
  }

  get isForwardDisabled(): boolean {
    return RacedayActionsMenuHelper.isForwardDisabled(this);
  }

  closeWindow(): void {
    RacedayActionsMenuHelper.closeWindow();
  }

  onLaneMenuSelect(laneIndex: number): void {
    RacedayActionsMenuHelper.onLaneMenuSelect(this, laneIndex);
  }

  onDriverViewMenuSelect(driverId: string): void {
    RacedayActionsMenuHelper.onDriverViewMenuSelect(this, driverId);
  }

  onAcknowledgeModal(): void {
    RacedayActionsMenuHelper.onAcknowledgeModal(this);
  }

  onExitConfirm(): void {
    RacedayActionsMenuHelper.onExitConfirm(this);
  }

  onExitCancel(): void {
    RacedayActionsMenuHelper.onExitCancel(this);
  }

  onSkipHeatConfirm(): void {
    RacedayActionsMenuHelper.onSkipHeatConfirm(this);
  }

  onSkipHeatCancel(): void {
    RacedayActionsMenuHelper.onSkipHeatCancel(this);
  }

  onSkipRaceConfirm(): void {
    RacedayActionsMenuHelper.onSkipRaceConfirm(this);
  }

  onSkipRaceCancel(): void {
    RacedayActionsMenuHelper.onSkipRaceCancel(this);
  }

  onRestartHeatConfirm(): void {
    RacedayActionsMenuHelper.onRestartHeatConfirm(this);
  }

  onRestartHeatCancel(): void {
    RacedayActionsMenuHelper.onRestartHeatCancel(this);
  }

  onDeferHeatConfirm(): void {
    RacedayActionsMenuHelper.onDeferHeatConfirm(this);
  }

  onDeferHeatCancel(): void {
    RacedayActionsMenuHelper.onDeferHeatCancel(this);
  }

  protected onModifyHeatsClose(saved: boolean): void {
    if (saved) {
      (this as any).raceService?.loadRace();
    }
    (this as any).showModifyHeatsModal = false;
  }

  saveRace(): void {
    RacedayExportHelper.saveRace(this);
  }

  onSaveRaceConfirm(name: string): void {
    RacedayExportHelper.onSaveRaceConfirm(this, name);
  }

  onSaveRaceCancel(): void {
    RacedayExportHelper.onSaveRaceCancel(this);
  }

  resetLane(lane: number, event: Event): void {
    RacedayDriverStandingsHelper.resetLane(this, lane, event);
  }

  resetAllLanes(event: Event): void {
    RacedayDriverStandingsHelper.resetAllLanes(this, event);
  }

  protected applyLocalLaneReset(lane: number | "all"): void {
    RacedayDriverStandingsHelper.applyLocalLaneReset(this, lane);
  }

  getExportTimestamp(): Date {
    return RacedayExportHelper.getExportTimestamp(this);
  }

  exportToPdf(): void {
    RacedayExportHelper.exportToPdf(this);
  }

  onPdfExportConfirm(options: PdfExportOptions): void {
    RacedayExportHelper.onPdfExportConfirm(this, options);
  }

  onPdfExportCancel(): void {
    RacedayExportHelper.onPdfExportCancel(this);
  }

  async exportToCsv(): Promise<void> {
    await RacedayExportHelper.exportToCsv(this);
  }

  async exportToXls(): Promise<void> {
    await RacedayExportHelper.exportToXls(this);
  }

  handleKeyUpEvent(event: KeyboardEvent): void {
    RacedayKeyboardHelper.handleKeyUpEvent(this, event);
  }

  protected handleLayoutCustomizationKey(event: KeyboardEvent): boolean {
    return RacedayKeyboardHelper.handleLayoutCustomizationKey(this, event);
  }

  protected handleTrackPowerKey(
    event: KeyboardEvent,
    isCtrlOrCmd: boolean,
    inInputField: any,
  ): boolean {
    return RacedayKeyboardHelper.handleTrackPowerKey(
      this,
      event,
      isCtrlOrCmd,
      inInputField,
    );
  }

  protected handleMenuShortcutKey(
    event: KeyboardEvent,
    isCtrlOrCmd: boolean,
  ): boolean {
    return RacedayKeyboardHelper.handleMenuShortcutKey(
      this,
      event,
      isCtrlOrCmd,
    );
  }

  protected handlePracticeResetKey(
    event: KeyboardEvent,
    isCtrlOrCmd: boolean,
  ): boolean {
    return RacedayKeyboardHelper.handlePracticeResetKey(
      this,
      event,
      isCtrlOrCmd,
    );
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    RacedayKeyboardHelper.handleKeyboardEvent(this, event);
  }

  protected checkWidgetShortcuts(event: KeyboardEvent): boolean {
    return RacedayKeyboardHelper.checkWidgetShortcuts(this, event);
  }

  protected matchShortcut(event: KeyboardEvent, shortcutStr: string): boolean {
    return RacedayKeyboardHelper.matchShortcut(event, shortcutStr);
  }

  protected executeWidgetAction(widgetType: string): void {
    RacedayKeyboardHelper.executeWidgetAction(this, widgetType);
  }

  get isSaveDisabled(): boolean {
    return RacedayRaceStatusHelper.isSaveDisabled(this);
  }

  onTrackPowerMainSelect(on: boolean): void {
    RacedayRaceStatusHelper.onTrackPowerMainSelect(this, on);
  }

  onTrackPowerLaneSelect(event: { lane: number; on: boolean }): void {
    RacedayRaceStatusHelper.onTrackPowerLaneSelect(this, event);
  }

  get isMainPowerDisabled(): boolean {
    return RacedayRaceStatusHelper.isMainPowerDisabled(this);
  }

  get isStartResumeDisabled(): boolean {
    return RacedayRaceStatusHelper.isStartResumeDisabled(this);
  }

  get isPauseDisabled(): boolean {
    return RacedayRaceStatusHelper.isPauseDisabled(this);
  }

  get isNextHeatDisabled(): boolean {
    return RacedayRaceStatusHelper.isNextHeatDisabled(this);
  }

  isDriverFinished(
    hd: DriverHeatData,
    scoring?: HeatScoring | null | undefined,
  ): boolean {
    return RacedayRaceStatusHelper.isDriverFinished(this, hd, scoring);
  }

  areAllDriversFinished(): boolean {
    return RacedayRaceStatusHelper.areAllDriversFinished(this);
  }

  isRaceOver(): boolean {
    return RacedayRaceStatusHelper.isRaceOver(this);
  }

  getFlagUrl(flag: any): string {
    return RacedayRaceStatusHelper.getFlagUrl(this, flag);
  }

  getCurrentFlagUrl(): string {
    return RacedayRaceStatusHelper.getCurrentFlagUrl(this);
  }

  getFullUrl(url: string | undefined): string {
    return RacedayRaceStatusHelper.getFullUrl(this, url);
  }

  get isRestartHeatDisabled(): boolean {
    return RacedayRaceStatusHelper.isRestartHeatDisabled(this);
  }

  get isDeferHeatDisabled(): boolean {
    return RacedayRaceStatusHelper.isDeferHeatDisabled(this);
  }

  get isSkipHeatDisabled(): boolean {
    return RacedayRaceStatusHelper.isSkipHeatDisabled(this);
  }

  get isSkipRaceDisabled(): boolean {
    return RacedayRaceStatusHelper.isSkipRaceDisabled(this);
  }

  get isAddLapDisabled(): boolean {
    return RacedayRaceStatusHelper.isAddLapDisabled(this);
  }

  get isModifyDisabled(): boolean {
    return RacedayRaceStatusHelper.isModifyDisabled(this);
  }
}
