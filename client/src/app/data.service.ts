import { HttpClient } from "@angular/common/http";
import { Injectable, NgZone } from "@angular/core";
import { Observable } from "rxjs";
import {
  DriverImportCommitRequest,
  DriverImportPreview,
  DriverImportResult,
} from "@app/models/driver-import.model";
import { DriverLabel } from "@app/models/driver-label";
import { Event } from "@app/models/event";
import { Season, SeasonStandingItem } from "@app/models/season";
import {
  ArduinoConfig,
  BartConfig,
  PhidgetConfig,
  TrackmateConfig,
} from "@app/models/track";
import {
  IAssetMessage,
  ICarData,
  ICustomRotation,
  IDemoConfig,
  IGroupStandingsUpdate,
  IHeat,
  IInterfaceEvent,
  ILap,
  InitializeInterfaceResponse,
  InitializeRaceResponse,
  IOverallStandingsUpdate,
  IPhidgetDeviceInfo,
  IRace,
  IRaceParticipant,
  IRaceTime,
  IRecordData,
  IRgbLedState,
  ISaveAudioSetEntry,
  ISaveImageSetEntry,
  ISegment,
  IStandingsUpdate,
  IStartRaceResponse,
  ITeamModel,
  ModifyHeatsResponse,
  RaceFlag,
  RaceState,
  RegenerateHeatsResponse,
  SetInterfacePinStateResponse,
  SetInterfaceRgbLedStateResponse,
  SystemState,
  UpdateInterfaceConfigResponse,
} from "@app/proto/antigravity";
import { DataAssetHelper } from "@app/services/data/data-asset.helper";
import { DataEntityCrudHelper } from "@app/services/data/data-entity-crud.helper";
import { DataHistoryStatsHelper } from "@app/services/data/data-history-stats.helper";
import { DataInterfaceHelper } from "@app/services/data/data-interface.helper";
import { DataRaceControlHelper } from "@app/services/data/data-race-control.helper";
import { DataSocketHelper } from "@app/services/data/data-socket.helper";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

@Injectable({
  providedIn: "root",
})
export class DataService {
  private serverIp =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  private serverPort = 7070;

  private get serverProtocol(): string {
    return typeof window !== "undefined" &&
      window.location.protocol === "https:"
      ? "https"
      : "http";
  }

  private get wsProtocol(): string {
    return typeof window !== "undefined" &&
      window.location.protocol === "https:"
      ? "wss"
      : "ws";
  }

  private get baseUrl(): string {
    return `${this.serverProtocol}://${this.serverIp}:${this.serverPort}`;
  }

  public get serverUrl(): string {
    return this.baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private connectionIntent = "";

  private assetHelper: DataAssetHelper;
  private interfaceHelper: DataInterfaceHelper;
  private raceControlHelper: DataRaceControlHelper;
  private historyStatsHelper: DataHistoryStatsHelper;
  private crudHelper: DataEntityCrudHelper;
  private socketHelper: DataSocketHelper;

  public assets$: Observable<IAssetMessage[]>;
  public socketConnected$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService,
    private ngZone: NgZone,
    private logger: LoggerService,
  ) {
    if (typeof window !== "undefined" && window.location.hostname) {
      this.serverIp = window.location.hostname;
      if (window.location.port && window.location.port !== "4200") {
        this.serverPort = parseInt(window.location.port, 10);
      }
    }
    const settings = this.settingsService.getSettings();
    if (settings.serverIp) {
      this.serverIp = settings.serverIp;
    }
    if (
      settings.serverPort &&
      (typeof window === "undefined" ||
        !window.location.port ||
        window.location.port === "4200")
    ) {
      this.serverPort = settings.serverPort;
    }
    this.logger.info(
      `DataService initialized with Base Server URL: ${this.baseUrl}`,
    );

    this.assetHelper = new DataAssetHelper(
      this.http,
      () => this.baseUrl,
      this.logger,
    );
    this.assets$ = this.assetHelper.assets$;

    this.interfaceHelper = new DataInterfaceHelper(
      this.http,
      () => this.baseUrl,
    );
    this.raceControlHelper = new DataRaceControlHelper(
      this.http,
      () => this.baseUrl,
    );
    this.historyStatsHelper = new DataHistoryStatsHelper(
      this.http,
      () => this.baseUrl,
    );
    this.crudHelper = new DataEntityCrudHelper(this.http, () => this.baseUrl);
    this.socketHelper = new DataSocketHelper(
      this.ngZone,
      this.logger,
      () => ({
        serverIp: this.serverIp,
        serverPort: this.serverPort,
        wsProtocol: this.wsProtocol,
      }),
      this,
    );
    this.socketConnected$ = this.socketHelper.socketConnected$;
  }

  public setServerAddress(ip: string, port: number) {
    if (this.serverIp === ip && this.serverPort === port) {
      return;
    }
    this.serverIp = ip;
    this.serverPort = port;
    this.socketHelper.disconnectFromRaceDataSocket();
  }

  public setConnectionIntent(intent: string) {
    this.connectionIntent = intent;
  }

  getDrivers(): Observable<any[]> {
    return this.crudHelper.getDrivers();
  }
  getServerVersion(): Observable<string> {
    return this.crudHelper.getServerVersion();
  }
  getServerIp(): Observable<string> {
    return this.crudHelper.getServerIp();
  }
  setServerLogLevel(level: string): Observable<any> {
    return this.crudHelper.setServerLogLevel(level);
  }
  createDriver(driver: any): Observable<any> {
    return this.crudHelper.createDriver(driver);
  }
  updateDriver(id: string, driver: any): Observable<any> {
    return this.crudHelper.updateDriver(id, driver);
  }
  deleteDriver(id: string): Observable<any> {
    return this.crudHelper.deleteDriver(id);
  }
  getDriverLabels(): Observable<DriverLabel[]> {
    return this.crudHelper.getDriverLabels();
  }
  createDriverLabel(label: Partial<DriverLabel>): Observable<DriverLabel> {
    return this.crudHelper.createDriverLabel(label);
  }
  updateDriverLabel(label: Partial<DriverLabel>): Observable<DriverLabel>;
  updateDriverLabel(
    id: string,
    label: Partial<DriverLabel>,
  ): Observable<DriverLabel>;
  updateDriverLabel(
    idOrLabel: string | Partial<DriverLabel>,
    label?: Partial<DriverLabel>,
  ): Observable<DriverLabel> {
    return (this.crudHelper.updateDriverLabel as any)(idOrLabel, label);
  }
  deleteDriverLabel(id: string): Observable<any> {
    return this.crudHelper.deleteDriverLabel(id);
  }
  validateDriverImport(formData: FormData): Observable<DriverImportPreview> {
    return this.crudHelper.validateDriverImport(formData);
  }
  commitDriverImport(
    request: DriverImportCommitRequest,
  ): Observable<DriverImportResult> {
    return this.crudHelper.commitDriverImport(request);
  }
  downloadDriverImportTemplate(format: string): Observable<Blob> {
    return this.crudHelper.downloadDriverImportTemplate(format);
  }
  exportDrivers(format: string, driverIds?: string[]): Observable<Blob> {
    return this.crudHelper.exportDrivers(format, driverIds);
  }
  getRaces(): Observable<any[]> {
    return this.crudHelper.getRaces();
  }
  createRace(race: any): Observable<any> {
    return this.crudHelper.createRace(race);
  }
  updateRace(id: string, race: any): Observable<any> {
    return this.crudHelper.updateRace(id, race);
  }
  deleteRace(id: string): Observable<any> {
    return this.crudHelper.deleteRace(id);
  }
  getEvents(): Observable<Event[]> {
    return this.crudHelper.getEvents();
  }
  getEvent(id: string): Observable<Event> {
    return this.crudHelper.getEvent(id);
  }
  createEvent(event: Event): Observable<Event> {
    return this.crudHelper.createEvent(event);
  }
  updateEvent(id: string, event: Event): Observable<Event> {
    return this.crudHelper.updateEvent(id, event);
  }
  deleteEvent(id: string): Observable<any> {
    return this.crudHelper.deleteEvent(id);
  }
  getSeasons(): Observable<Season[]> {
    return this.crudHelper.getSeasons();
  }
  getSeason(id: string): Observable<Season> {
    return this.crudHelper.getSeason(id);
  }
  createSeason(season: Season): Observable<Season> {
    return this.crudHelper.createSeason(season);
  }
  updateSeason(id: string, season: Season): Observable<Season> {
    return this.crudHelper.updateSeason(id, season);
  }
  deleteSeason(id: string): Observable<any> {
    return this.crudHelper.deleteSeason(id);
  }
  getSeasonStandings(id: string): Observable<SeasonStandingItem[]> {
    return this.crudHelper.getSeasonStandings(id);
  }
  getRaceHistory(isDemo?: boolean): Observable<any[]> {
    return this.crudHelper.getRaceHistory(isDemo);
  }
  getRaceHistoryById(id: string, isDemo?: boolean): Observable<any> {
    return this.crudHelper.getRaceHistoryById(id, isDemo);
  }
  getAllFinishedRaceHistory(): Observable<any[]> {
    return this.crudHelper.getAllFinishedRaceHistory();
  }

  loadRaceHistory(id: string, isDemo?: boolean): Observable<any> {
    return this.historyStatsHelper.loadRaceHistory(id, isDemo);
  }
  exportRaceHistoryToCsv(id: string, isDemo?: boolean): Observable<string> {
    return this.historyStatsHelper.exportRaceHistoryToCsv(id, isDemo);
  }
  updateHistoryLapSections(
    id: string,
    updates: any[],
    isDemo?: boolean,
  ): Observable<any> {
    return this.historyStatsHelper.updateHistoryLapSections(
      id,
      updates,
      isDemo,
    );
  }
  exportRaceToCsv(): Observable<string> {
    return this.historyStatsHelper.exportRaceToCsv();
  }
  exportRaceToXls(base64Template?: string): Observable<Blob> {
    return this.historyStatsHelper.exportRaceToXls(base64Template);
  }
  downloadDefaultExportTemplate(): Observable<Blob> {
    return this.historyStatsHelper.downloadDefaultExportTemplate();
  }
  testExportXls(base64Template?: string): Observable<Blob> {
    return this.historyStatsHelper.testExportXls(base64Template);
  }
  public getDefaultDemoConfig(): IDemoConfig {
    return this.raceControlHelper.getDefaultDemoConfig();
  }
  generateHeats(raceId: string, driverCount: number): Observable<any> {
    return this.raceControlHelper.generateHeats(raceId, driverCount);
  }
  previewHeats(
    trackId: string,
    rotationType: string,
    driverCount: number,
    soloLaneIndex: number = 0,
    customRotationSequence: number[] = [],
    customRotationAssetId: string = "",
    customRotations: any[] = [],
    heatTimesThrough: number = 1,
    reverseHeats: boolean = false,
    groupOptions: any = null,
  ): Observable<any> {
    return this.raceControlHelper.previewHeats(
      trackId,
      rotationType,
      driverCount,
      soloLaneIndex,
      customRotationSequence,
      customRotationAssetId,
      customRotations,
      heatTimesThrough,
      reverseHeats,
      groupOptions,
    );
  }

  getTracks(): Observable<any[]> {
    return this.crudHelper.getTracks();
  }
  getTrackFactorySettings(): Observable<any> {
    return this.crudHelper.getTrackFactorySettings();
  }
  createTrack(track: any): Observable<any> {
    return this.crudHelper.createTrack(track);
  }
  updateTrack(id: string, track: any): Observable<any> {
    return this.crudHelper.updateTrack(id, track);
  }
  deleteTrack(id: string): Observable<any> {
    return this.crudHelper.deleteTrack(id);
  }
  getSerialPorts(): Observable<string[]> {
    return this.interfaceHelper.getSerialPorts();
  }
  getBleDevices(): Observable<string[]> {
    return this.interfaceHelper.getBleDevices();
  }
  getPhidgetDevices(): Observable<IPhidgetDeviceInfo[]> {
    return this.interfaceHelper.getPhidgetDevices();
  }

  initializeRace(
    raceId: string,
    driverIds: string[],
    isDemoMode: boolean,
    demoConfig?: IDemoConfig,
    eventId?: string,
    seasonId?: string,
    themeId?: string,
  ): Observable<InitializeRaceResponse> {
    return this.raceControlHelper.initializeRace(
      raceId,
      driverIds,
      isDemoMode,
      demoConfig,
      eventId,
      seasonId,
      themeId,
    );
  }

  initializeInterface(
    configs: ArduinoConfig[],
    trackmateConfigs: TrackmateConfig[],
    phidgetConfigsOrLaneCount: any[] | number = [],
    laneCountParam?: number,
    bartConfigs: BartConfig[] = [],
  ): Observable<InitializeInterfaceResponse> {
    return this.interfaceHelper.initializeInterface(
      configs,
      trackmateConfigs,
      phidgetConfigsOrLaneCount,
      laneCountParam,
      bartConfigs,
    );
  }

  updateInterfaceConfig(
    config: ArduinoConfig | null,
    interfaceIndex: number,
    phidgetConfig?: PhidgetConfig | null,
  ): Observable<UpdateInterfaceConfigResponse> {
    return this.interfaceHelper.updateInterfaceConfig(
      config,
      interfaceIndex,
      phidgetConfig,
    );
  }

  setInterfacePinState(
    pin: number,
    isDigital: boolean,
    isHigh: boolean,
    interfaceIndex: number,
  ): Observable<SetInterfacePinStateResponse> {
    return this.interfaceHelper.setInterfacePinState(
      pin,
      isDigital,
      isHigh,
      interfaceIndex,
    );
  }

  setInterfaceRgbLedState(
    pin: number,
    leds: IRgbLedState[],
    interfaceIndex: number,
  ): Observable<SetInterfaceRgbLedStateResponse> {
    return this.interfaceHelper.setInterfaceRgbLedState(
      pin,
      leds,
      interfaceIndex,
    );
  }

  closeInterface(): Observable<any> {
    return this.interfaceHelper.closeInterface();
  }
  startRace(): Observable<IStartRaceResponse> {
    return this.raceControlHelper.startRace();
  }
  endRace(): Observable<boolean> {
    return this.raceControlHelper.endRace();
  }
  pauseRace(): Observable<boolean> {
    return this.raceControlHelper.pauseRace();
  }
  abortTimers(): Observable<boolean> {
    return this.raceControlHelper.abortTimers();
  }
  nextHeat(): Observable<boolean> {
    return this.raceControlHelper.nextHeat();
  }
  setMainPower(on: boolean): Observable<any> {
    return this.raceControlHelper.setMainPower(on);
  }
  setLanePower(lane: number, on: boolean): Observable<any> {
    return this.raceControlHelper.setLanePower(lane, on);
  }
  restartHeat(): Observable<boolean> {
    return this.raceControlHelper.restartHeat();
  }
  skipHeat(): Observable<boolean> {
    return this.raceControlHelper.skipHeat();
  }
  skipRace(): Observable<boolean> {
    return this.raceControlHelper.skipRace();
  }
  deferHeat(): Observable<boolean> {
    return this.raceControlHelper.deferHeat();
  }
  modifyHeats(
    heats: IHeat[],
    participants: IRaceParticipant[],
  ): Observable<ModifyHeatsResponse> {
    return this.raceControlHelper.modifyHeats(heats, participants);
  }
  regenerateHeats(
    participants: IRaceParticipant[] = [],
  ): Observable<RegenerateHeatsResponse> {
    return this.raceControlHelper.regenerateHeats(participants);
  }
  finalizeModifyHeats(): Observable<any> {
    return this.raceControlHelper.finalizeModifyHeats();
  }

  public changeActualDriver(
    lane: number,
    driverId: string,
  ): Observable<boolean> {
    return this.raceControlHelper.changeActualDriver(lane, driverId);
  }

  public changeActualDriverForHeat(
    heatNumber: number,
    lane: number,
    driverId: string,
  ): Observable<boolean> {
    return this.raceControlHelper.changeActualDriverForHeat(
      heatNumber,
      lane,
      driverId,
    );
  }

  getTeams(): Observable<ITeamModel[]> {
    return this.crudHelper.getTeams();
  }
  createTeam(team: any): Observable<any> {
    return this.crudHelper.createTeam(team);
  }
  updateTeam(id: string, team: any): Observable<any> {
    return this.crudHelper.updateTeam(id, team);
  }
  deleteTeam(id: string): Observable<any> {
    return this.crudHelper.deleteTeam(id);
  }
  getCustomUIs(): Observable<any[]> {
    return this.crudHelper.getCustomUIs();
  }
  getCustomUI(id: string): Observable<any> {
    return this.crudHelper.getCustomUI(id);
  }
  createCustomUI(ui: any): Observable<any> {
    return this.crudHelper.createCustomUI(ui);
  }
  updateCustomUI(id: string, ui: any): Observable<any> {
    return this.crudHelper.updateCustomUI(id, ui);
  }
  deleteCustomUI(id: string): Observable<any> {
    return this.crudHelper.deleteCustomUI(id);
  }
  duplicateCustomUI(id: string, name?: string): Observable<any> {
    return this.crudHelper.duplicateCustomUI(id, name);
  }
  getThemes(): Observable<any[]> {
    return this.crudHelper.getThemes();
  }
  getDefaultTheme(): Observable<any> {
    return this.crudHelper.getDefaultTheme();
  }
  getThemeFactorySettings(): Observable<any> {
    return this.crudHelper.getThemeFactorySettings();
  }
  getTheme(id: string): Observable<any> {
    return this.crudHelper.getTheme(id);
  }
  createTheme(theme: any): Observable<any> {
    return this.crudHelper.createTheme(theme);
  }
  updateTheme(id: string, theme: any): Observable<any> {
    return this.crudHelper.updateTheme(id, theme);
  }
  deleteTheme(id: string): Observable<any> {
    return this.crudHelper.deleteTheme(id);
  }
  duplicateTheme(id: string, name?: string): Observable<any> {
    return this.crudHelper.duplicateTheme(id, name);
  }

  getDatabases(): Observable<any[]> {
    return this.historyStatsHelper.getDatabases();
  }
  getCurrentDatabase(): Observable<any> {
    return this.historyStatsHelper.getCurrentDatabase();
  }
  createDatabase(name: string): Observable<any> {
    return this.historyStatsHelper.createDatabase(name);
  }
  switchDatabase(name: string): Observable<any> {
    return this.historyStatsHelper.switchDatabase(name);
  }
  copyDatabase(name: string, source?: string): Observable<any> {
    return this.historyStatsHelper.copyDatabase(name, source);
  }
  resetDatabase(name?: string): Observable<any> {
    return this.historyStatsHelper.resetDatabase(name);
  }
  deleteDatabase(name: string): Observable<any> {
    return this.historyStatsHelper.deleteDatabase(name);
  }
  exportDatabase(name: string): void {
    this.historyStatsHelper.exportDatabase(name);
  }
  exportDatabaseBlob(name: string): Observable<Blob> {
    return this.historyStatsHelper.exportDatabaseBlob(name);
  }
  importDatabase(name: string, file: File): Observable<any> {
    return this.historyStatsHelper.importDatabase(name, file);
  }

  get loadedAssets(): IAssetMessage[] {
    return this.assetHelper.loadedAssets;
  }
  setLoadedAssets(assets: IAssetMessage[]): void {
    this.assetHelper.setLoadedAssets(assets);
  }
  registerAsset(asset: IAssetMessage): void {
    this.assetHelper.registerAsset(asset);
  }
  async computeFileHash(file: File): Promise<string> {
    return this.assetHelper.computeFileHash(file);
  }
  findAssetByHash(hash: string, type?: string): IAssetMessage | undefined {
    return this.assetHelper.findAssetByHash(hash, type);
  }
  listAssets(): Observable<IAssetMessage[]> {
    return this.assetHelper.listAssets();
  }
  getAssetUrl(id: string): string {
    return this.assetHelper.getAssetUrl(id);
  }
  resolveAssetUrl(url?: string): string {
    return this.assetHelper.resolveAssetUrl(url);
  }
  uploadAsset(
    name: string,
    type: string,
    data: Uint8Array,
  ): Observable<IAssetMessage> {
    return this.assetHelper.uploadAsset(name, type, data);
  }
  saveImageSet(
    name: string,
    entries: ISaveImageSetEntry[],
    id?: string,
  ): Observable<IAssetMessage> {
    return this.assetHelper.saveImageSet(name, entries, id);
  }
  saveAudioSet(
    name: string,
    entries: ISaveAudioSetEntry[],
    id?: string,
  ): Observable<IAssetMessage> {
    return this.assetHelper.saveAudioSet(name, entries, id);
  }
  saveCustomRotation(
    name: string,
    numLanes: number,
    rotations: ICustomRotation[],
    id?: string,
  ): Observable<IAssetMessage> {
    return this.assetHelper.saveCustomRotation(name, numLanes, rotations, id);
  }
  deleteAsset(id: string): Observable<boolean> {
    return this.assetHelper.deleteAsset(id);
  }
  renameAsset(id: string, newName: string): Observable<boolean> {
    return this.assetHelper.renameAsset(id, newName);
  }

  public get raceDataSocket(): WebSocket | undefined {
    return this.socketHelper.raceDataSocket;
  }
  public set raceDataSocket(val: WebSocket | undefined) {
    this.socketHelper.raceDataSocket = val;
  }
  public get interfaceDataSocket(): WebSocket | undefined {
    return this.socketHelper.interfaceDataSocket;
  }
  public set interfaceDataSocket(val: WebSocket | undefined) {
    this.socketHelper.interfaceDataSocket = val;
  }
  public get isInterfaceSocketExplicitlyDisconnected(): boolean {
    return this.socketHelper.isInterfaceSocketExplicitlyDisconnected;
  }
  public set isInterfaceSocketExplicitlyDisconnected(val: boolean) {
    this.socketHelper.isInterfaceSocketExplicitlyDisconnected = val;
  }
  public get isRaceDataSocketExplicitlyDisconnected(): boolean {
    return this.socketHelper.isRaceDataSocketExplicitlyDisconnected;
  }
  public set isRaceDataSocketExplicitlyDisconnected(val: boolean) {
    this.socketHelper.isRaceDataSocketExplicitlyDisconnected = val;
  }
  public get shouldSubscribeToRaceData(): boolean {
    return this.socketHelper.shouldSubscribeToRaceData;
  }
  public set shouldSubscribeToRaceData(val: boolean) {
    this.socketHelper.shouldSubscribeToRaceData = val;
  }
  public get lastRaceTimeReceivedAt(): number {
    return this.socketHelper.lastRaceTimeReceivedAt;
  }
  public set lastRaceTimeReceivedAt(val: number) {
    this.socketHelper.lastRaceTimeReceivedAt = val;
  }
  public get raceSubscriptionStartedAt(): number {
    return this.socketHelper.raceSubscriptionStartedAt;
  }
  public set raceSubscriptionStartedAt(val: number) {
    this.socketHelper.raceSubscriptionStartedAt = val;
  }

  public get raceTimeSubject() {
    return this.socketHelper.raceTimeSubject;
  }
  public get lapSubject() {
    return this.socketHelper.lapSubject;
  }
  public get standingsSubject() {
    return this.socketHelper.standingsSubject;
  }
  public get overallStandingsSubject() {
    return this.socketHelper.overallStandingsSubject;
  }
  public get groupStandingsSubject() {
    return this.socketHelper.groupStandingsSubject;
  }
  public get raceUpdateSubject() {
    return this.socketHelper.raceUpdateSubject;
  }
  public get interfaceEventSubject() {
    return this.socketHelper.interfaceEventSubject;
  }
  public get carDataSubject() {
    return this.socketHelper.carDataSubject;
  }
  public get segmentSubject() {
    return this.socketHelper.segmentSubject;
  }
  public get raceStateSubject() {
    return this.socketHelper.raceStateSubject;
  }
  public get flagSubject() {
    return this.socketHelper.flagSubject;
  }
  public get recordDataSubject() {
    return this.socketHelper.recordDataSubject;
  }
  public get heatSubject() {
    return this.socketHelper.heatSubject;
  }
  public get systemStateSubject() {
    return this.socketHelper.systemStateSubject;
  }
  public get socketConnectedSubject() {
    return this.socketHelper.socketConnectedSubject;
  }

  public clearRaceData(): void {
    this.socketHelper.clearRaceData();
  }
  public resetSocketState(): void {
    this.socketHelper.resetSocketState();
  }
  public updateRaceSubscription(subscribe: boolean): void {
    this.socketHelper.updateRaceSubscription(subscribe);
  }
  public sendRaceSubscriptionRequest(subscribe: boolean): void {
    this.socketHelper.sendRaceSubscriptionRequest(subscribe);
  }
  public handleRaceDataMessage(event: MessageEvent): void {
    this.socketHelper.handleRaceDataMessage(event);
  }
  public connectToRaceDataSocket(): void {
    this.socketHelper.connectToRaceDataSocket();
  }
  public connectToInterfaceDataSocket(): void {
    this.socketHelper.connectToInterfaceDataSocket();
  }
  public disconnectFromInterfaceDataSocket(): void {
    this.socketHelper.disconnectFromInterfaceDataSocket();
  }
  public disconnectFromRaceDataSocket(): void {
    this.socketHelper.disconnectFromRaceDataSocket();
  }
  public disconnectAllSockets(): void {
    this.disconnectFromInterfaceDataSocket();
    this.disconnectFromRaceDataSocket();
  }
  public getRaceTime(): Observable<IRaceTime> {
    return this.socketHelper.getRaceTime();
  }
  public getLaps(): Observable<ILap> {
    return this.socketHelper.getLaps();
  }
  public getStandingsUpdate(): Observable<IStandingsUpdate> {
    return this.socketHelper.getStandingsUpdate();
  }
  public getOverallStandingsUpdate(): Observable<IOverallStandingsUpdate> {
    return this.socketHelper.getOverallStandingsUpdate();
  }
  public getGroupStandingsUpdate(): Observable<IGroupStandingsUpdate> {
    return this.socketHelper.getGroupStandingsUpdate();
  }
  public getRaceUpdate(): Observable<IRace> {
    return this.socketHelper.getRaceUpdate();
  }
  public getInterfaceEvents(): Observable<IInterfaceEvent> {
    return this.socketHelper.getInterfaceEvents();
  }
  public getRaceState(): Observable<RaceState> {
    return this.socketHelper.getRaceState();
  }
  public getRaceFlag(): Observable<RaceFlag> {
    return this.socketHelper.getRaceFlag();
  }
  public getCarData(): Observable<ICarData> {
    return this.socketHelper.getCarData();
  }
  public getSegments(): Observable<ISegment> {
    return this.socketHelper.getSegments();
  }
  public getRecordData(): Observable<IRecordData> {
    return this.socketHelper.getRecordData();
  }
  public getHeats(): Observable<IHeat> {
    return this.socketHelper.getHeats();
  }
  public getSystemState(): Observable<SystemState | null> {
    return this.socketHelper.getSystemState();
  }
  public getSystemStateValue(): SystemState | null {
    return this.socketHelper.getSystemStateValue();
  }

  public resetLaneHeatData(lane: number | string): Observable<boolean> {
    return this.raceControlHelper.resetLaneHeatData(lane);
  }
  changeLane(fromLane: number, toLane: number): Observable<boolean> {
    return this.raceControlHelper.changeLane(fromLane, toLane);
  }
  saveRace(name?: string): Observable<string> {
    return this.raceControlHelper.saveRace(name);
  }
  getSavedRaces(
    isDemo: boolean = false,
  ): Observable<{ filename: string; corrupt: boolean }[]> {
    return this.raceControlHelper.getSavedRaces(isDemo);
  }
  loadRace(filename: string, isDemo: boolean = false): Observable<string> {
    return this.raceControlHelper.loadRace(filename, isDemo);
  }
  deleteSavedRace(
    filename: string,
    isDemo: boolean = false,
  ): Observable<string> {
    return this.raceControlHelper.deleteSavedRace(filename, isDemo);
  }
  renameSavedRace(
    oldFilename: string,
    newFilename: string,
    isDemo: boolean = false,
  ): Observable<string> {
    return this.raceControlHelper.renameSavedRace(
      oldFilename,
      newFilename,
      isDemo,
    );
  }

  toggleServerAnalytics(enabled: boolean): Observable<string> {
    return this.historyStatsHelper.toggleServerAnalytics(enabled);
  }
  getServerAnalyticsConfig(): Observable<{
    clientId: string;
    measurementId: string;
  }> {
    return this.historyStatsHelper.getServerAnalyticsConfig();
  }
  updateUserLaps(
    lane: number,
    userLaps?: number,
    userTime?: number,
  ): Observable<any> {
    return this.raceControlHelper.updateUserLaps(lane, userLaps, userTime);
  }
  updateHeatUserLaps(
    heatNumber: number,
    lane: number,
    userLaps?: number,
    userTime?: number,
  ): Observable<any> {
    return this.raceControlHelper.updateHeatUserLaps(
      heatNumber,
      lane,
      userLaps,
      userTime,
    );
  }
  updateBatchUserLaps(
    updates: {
      heatNumber: number;
      laneIndex: number;
      userLaps?: number;
      userTime?: number;
    }[],
  ): Observable<any> {
    return this.raceControlHelper.updateBatchUserLaps(updates);
  }
  updateUserTime(lane: number, userTime: number): Observable<any> {
    return this.raceControlHelper.updateUserTime(lane, userTime);
  }
  updateHeatUserTime(
    heatNumber: number,
    lane: number,
    userTime: number,
  ): Observable<any> {
    return this.raceControlHelper.updateHeatUserTime(
      heatNumber,
      lane,
      userTime,
    );
  }
  updateBatchUserTime(
    updates: { heatNumber: number; laneIndex: number; userTime: number }[],
  ): Observable<any> {
    return this.raceControlHelper.updateBatchUserTime(updates);
  }
  updateLiveLapRecordStatus(
    heatNumber: number,
    lane: number,
    lapIndex: number,
    countTowardsRecords: boolean,
  ): Observable<any> {
    return this.raceControlHelper.updateLiveLapRecordStatus(
      heatNumber,
      lane,
      lapIndex,
      countTowardsRecords,
    );
  }
  updateHistoryLapRecordStatus(
    raceHistoryId: string,
    heatNumber: number,
    lane: number,
    lapIndex: number,
    countTowardsRecords: boolean,
    isDemo?: boolean,
  ): Observable<any> {
    return this.historyStatsHelper.updateHistoryLapRecordStatus(
      raceHistoryId,
      heatNumber,
      lane,
      lapIndex,
      countTowardsRecords,
      isDemo,
    );
  }

  getDriverStatistics(
    driverId: string,
    raceId?: string,
    isDemo?: boolean,
  ): Observable<any> {
    return this.historyStatsHelper.getDriverStatistics(
      driverId,
      raceId,
      isDemo,
    );
  }
  getGlobalStatistics(raceId?: string, isDemo?: boolean): Observable<any> {
    return this.historyStatsHelper.getGlobalStatistics(raceId, isDemo);
  }
  resetRaceRecords(raceId: string): Observable<void> {
    return this.historyStatsHelper.resetRaceRecords(raceId);
  }
}
