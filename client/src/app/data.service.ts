import { HttpClient } from "@angular/common/http";
import { Injectable, NgZone } from "@angular/core";
import { Reader } from "protobufjs/minimal";
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";
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
  InterfaceEvent,
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
  RaceData,
  RaceFlag,
  RaceState,
  RaceSubscriptionRequest,
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
  private lastRaceTimeReceivedAt = 0;
  private raceSubscriptionStartedAt = 0;

  private assetHelper: DataAssetHelper;
  private interfaceHelper: DataInterfaceHelper;
  private raceControlHelper: DataRaceControlHelper;
  private historyStatsHelper: DataHistoryStatsHelper;
  private crudHelper: DataEntityCrudHelper;

  public assets$: Observable<IAssetMessage[]>;

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
  }

  public setServerAddress(ip: string, port: number) {
    if (this.serverIp === ip && this.serverPort === port) {
      return;
    }
    this.serverIp = ip;
    this.serverPort = port;
    if (this.raceDataSocket) {
      this.raceDataSocket.close();
      this.raceDataSocket = undefined;
    }
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

  private raceDataSocket?: WebSocket;
  private interfaceDataSocket?: WebSocket;
  private raceTimeSubject = new BehaviorSubject<IRaceTime>({
    time: 0,
  });
  private lapSubject = new Subject<ILap>();
  private standingsSubject = new ReplaySubject<IStandingsUpdate>(1);
  private overallStandingsSubject = new ReplaySubject<IOverallStandingsUpdate>(
    1,
  );
  private groupStandingsSubject = new ReplaySubject<IGroupStandingsUpdate>(1);
  private raceUpdateSubject = new ReplaySubject<IRace>(1);
  private interfaceEventSubject = new Subject<IInterfaceEvent>();
  private carDataSubject = new Subject<ICarData>();
  private segmentSubject = new Subject<ISegment>();
  private raceStateSubject = new BehaviorSubject<RaceState>(
    RaceState.UNKNOWN_STATE,
  );
  private flagSubject = new BehaviorSubject<RaceFlag>(RaceFlag.UNKNOWN_FLAG);
  private recordDataSubject = new ReplaySubject<IRecordData>(1);
  private heatSubject = new Subject<IHeat>();
  private systemStateSubject = new BehaviorSubject<SystemState | null>(null);
  private socketConnectedSubject = new BehaviorSubject<boolean>(false);
  public socketConnected$ = this.socketConnectedSubject.asObservable();

  private shouldSubscribeToRaceData = false;
  private isInterfaceSocketExplicitlyDisconnected = false;
  private isRaceDataSocketExplicitlyDisconnected = false;

  public clearRaceData() {
    this.raceStateSubject.next(RaceState.UNKNOWN_STATE);
    this.flagSubject.next(RaceFlag.UNKNOWN_FLAG);
    this.raceTimeSubject.next({ time: 0 });
    this.lastRaceTimeReceivedAt = 0;
    this.raceSubscriptionStartedAt = 0;

    const clearReplay = (subject: any) => {
      if (subject && Array.isArray(subject._buffer)) {
        subject._buffer.length = 0;
      }
    };
    clearReplay(this.standingsSubject);
    clearReplay(this.overallStandingsSubject);
    clearReplay(this.groupStandingsSubject);
    clearReplay(this.raceUpdateSubject);
    clearReplay(this.recordDataSubject);
  }

  public resetSocketState(): void {
    this.shouldSubscribeToRaceData = false;
    this.isInterfaceSocketExplicitlyDisconnected = false;
    this.isRaceDataSocketExplicitlyDisconnected = false;
  }

  public updateRaceSubscription(subscribe: boolean) {
    this.shouldSubscribeToRaceData = subscribe;
    if (subscribe) {
      this.raceSubscriptionStartedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    } else {
      this.clearRaceData();
    }
    if (
      this.raceDataSocket &&
      this.raceDataSocket.readyState === WebSocket.OPEN
    ) {
      this.sendRaceSubscriptionRequest(subscribe);
    } else {
      this.logger.warn(
        "Race Data WebSocket not open. Triggering connection check and queuing subscription.",
      );
      // If we are completely disconnected, rely on the reconnect loop or trigger one now
      this.connectToRaceDataSocket();
      // Subscription will be sent on open
    }
  }

  private sendRaceSubscriptionRequest(subscribe: boolean) {
    if (
      !this.raceDataSocket ||
      this.raceDataSocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const request = RaceSubscriptionRequest.create({
      subscribe,
    });
    const buffer = RaceSubscriptionRequest.encode(request).finish();
    this.raceDataSocket.send(buffer);
    this.logger.info(`Sent RaceSubscriptionRequest: subscribe=${subscribe}`);
  }

  private handleRaceDataMessage(event: MessageEvent) {
    this.ngZone.run(() => {
      try {
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        const dispatchDelay =
          event &&
          typeof event.timeStamp === "number" &&
          event.timeStamp > 0 &&
          event.timeStamp <= now
            ? Math.round(now - event.timeStamp)
            : -1;

        if (dispatchDelay > 100) {
          this.logger.warn(
            `[PERF] Browser main-thread freeze: message dispatch delayed by ${dispatchDelay}ms (UI rendering or long task blocked event loop)`,
          );
        }

        const arrayBuffer = event.data as ArrayBuffer;
        const raceData = RaceData.decode(
          Reader.create(new Uint8Array(arrayBuffer)),
        );

        const previousState = this.raceStateSubject.value;
        let newState = previousState;
        if (raceData.raceState) {
          this.logger.debug("WS: Received RaceState", raceData.raceState);
          newState = raceData.raceState;
          this.raceStateSubject.next(raceData.raceState);
        }
        if (raceData.race) {
          this.logger.debug("WS: Received Race", raceData.race);
          this.raceUpdateSubject.next(raceData.race);
          if (raceData.race.state) {
            newState = raceData.race.state;
            this.raceStateSubject.next(raceData.race.state);
          }
          if (raceData.race.flag) {
            this.flagSubject.next(raceData.race.flag);
          }
          if (raceData.race.currentHeat) {
            this.heatSubject.next(raceData.race.currentHeat);
          }
        }
        if (newState !== previousState) {
          this.lastRaceTimeReceivedAt = 0;
        }
        if (raceData.raceTime) {
          this.handleRaceTimeMessage(
            raceData.raceTime,
            newState,
            now,
            dispatchDelay,
          );
        }
        this.dispatchTelemetryUpdates(raceData);
      } catch (e) {
        this.logger.error("Error parsing race data message", e);
      }
    });
  }

  private handleRaceTimeMessage(
    raceTime: IRaceTime,
    raceState: RaceState,
    now: number,
    dispatchDelay: number,
  ): void {
    const isTicking =
      raceState === RaceState.STARTING ||
      raceState === RaceState.RACING ||
      (raceTime.autoStartRemaining ?? 0) > 0 ||
      (raceTime.autoAdvanceRemaining ?? 0) > 0;

    if (isTicking && this.lastRaceTimeReceivedAt > 0) {
      const isHydrationGracePeriod =
        this.raceSubscriptionStartedAt > 0 &&
        now - this.raceSubscriptionStartedAt < 3000;
      const gap = Math.round(now - this.lastRaceTimeReceivedAt);
      if (gap > 450 && !isHydrationGracePeriod) {
        const delayInfo =
          dispatchDelay >= 0
            ? `, browser dispatch delay: ${dispatchDelay}ms`
            : "";
        this.logger.warn(
          `[PERF] RaceTime WebSocket interval lag: ${gap}ms (expected ~100ms${delayInfo})`,
        );
      }
    }
    this.lastRaceTimeReceivedAt = isTicking ? now : 0;
    this.raceTimeSubject.next(raceTime);
  }

  private dispatchTelemetryUpdates(raceData: RaceData): void {
    if (raceData.standingsUpdate) {
      this.standingsSubject.next(raceData.standingsUpdate);
    }
    if (raceData.overallStandingsUpdate) {
      this.overallStandingsSubject.next(raceData.overallStandingsUpdate);
    }
    if (raceData.groupStandingsUpdate) {
      this.groupStandingsSubject.next(raceData.groupStandingsUpdate);
    }
    if (raceData.lap) {
      this.lapSubject.next(raceData.lap);
    }
    if (raceData.carData) {
      this.carDataSubject.next(raceData.carData);
    }
    if (raceData.segment) {
      this.segmentSubject.next(raceData.segment);
    }
    if (raceData.flag) {
      this.logger.debug("WS: Received RaceFlag", raceData.flag);
      this.flagSubject.next(raceData.flag);
    }
    if (raceData.recordData) {
      this.recordDataSubject.next(raceData.recordData);
    }
    if (raceData.heat) {
      this.logger.debug("WS: Received Heat", raceData.heat);
      this.heatSubject.next(raceData.heat);
    }
    if (raceData.systemState) {
      this.systemStateSubject.next(raceData.systemState as SystemState);
    }
  }

  public connectToRaceDataSocket() {
    if (
      this.raceDataSocket &&
      (this.raceDataSocket.readyState === WebSocket.OPEN ||
        this.raceDataSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isRaceDataSocketExplicitlyDisconnected = false;

    if (this.raceDataSocket) {
      try {
        this.raceDataSocket.close();
      } catch (e) {}
    }

    const wsUrl = `${this.wsProtocol}://${this.serverIp}:${this.serverPort}/api/race-data`;
    this.logger.debug(`Connecting to Race WebSocket: ${wsUrl}`);
    this.raceDataSocket = new WebSocket(wsUrl);
    this.raceDataSocket.binaryType = "arraybuffer";

    this.raceDataSocket.onopen = () => {
      this.logger.info("Connected to Race WebSocket");
      this.socketConnectedSubject.next(true);
      if (this.shouldSubscribeToRaceData) {
        this.sendRaceSubscriptionRequest(true);
      }
    };

    this.raceDataSocket.onmessage = (event) => {
      this.handleRaceDataMessage(event);
    };

    this.raceDataSocket.onerror = (error) => {
      this.logger.error("Race WebSocket error", error);
    };

    this.raceDataSocket.onclose = () => {
      this.logger.info("Race WebSocket closed");
      this.raceDataSocket = undefined;
      this.socketConnectedSubject.next(false);
      if (!this.isRaceDataSocketExplicitlyDisconnected) {
        setTimeout(() => {
          if (!this.isRaceDataSocketExplicitlyDisconnected) {
            this.connectToRaceDataSocket();
          }
        }, 2000);
      }
    };
  }

  public connectToInterfaceDataSocket() {
    if (
      this.interfaceDataSocket &&
      (this.interfaceDataSocket.readyState === WebSocket.OPEN ||
        this.interfaceDataSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isInterfaceSocketExplicitlyDisconnected = false;

    if (this.interfaceDataSocket) {
      try {
        this.interfaceDataSocket.close();
      } catch (e) {}
    }

    const wsUrl = `${this.wsProtocol}://${this.serverIp}:${this.serverPort}/api/interface-data`;
    this.logger.debug(`Connecting to Interface WebSocket: ${wsUrl}`);
    this.interfaceDataSocket = new WebSocket(wsUrl);
    this.interfaceDataSocket.binaryType = "arraybuffer";

    this.interfaceDataSocket.onopen = () => {
      this.logger.info("Connected to Interface WebSocket");
    };

    this.interfaceDataSocket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const data = event.data;
          let uint8Array: Uint8Array;

          if (data instanceof ArrayBuffer) {
            uint8Array = new Uint8Array(data);
          } else if (typeof data === "string") {
            try {
              const trimmed = data.trim().replace(/^"|"$/g, "");
              const binaryString = atob(trimmed);
              uint8Array = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
              }
            } catch (e) {
              this.logger.error(
                "Failed to decode Base64 WebSocket message. Data was:",
                data,
                e,
              );
              return;
            }
          } else {
            this.logger.warn(
              "Received unknown data type from Interface WebSocket",
              typeof data,
            );
            return;
          }

          const msg = InterfaceEvent.decode(Reader.create(uint8Array));
          this.interfaceEventSubject.next(msg);
        } catch (e) {
          this.logger.error("Error decoding Interface WebSocket message", e);
        }
      });
    };

    this.interfaceDataSocket.onerror = (error) => {
      this.logger.error("Interface WebSocket error", error);
    };

    this.interfaceDataSocket.onclose = () => {
      this.logger.info("Interface WebSocket closed");
      this.interfaceDataSocket = undefined;
      if (!this.isInterfaceSocketExplicitlyDisconnected) {
        this.logger.info("Reconnecting Interface WebSocket in 2 seconds...");
        setTimeout(() => {
          if (!this.isInterfaceSocketExplicitlyDisconnected) {
            this.connectToInterfaceDataSocket();
          }
        }, 2000);
      }
    };
  }

  public disconnectFromInterfaceDataSocket() {
    this.isInterfaceSocketExplicitlyDisconnected = true;
    if (this.interfaceDataSocket) {
      this.interfaceDataSocket.close();
      this.interfaceDataSocket = undefined;
    }
  }

  public disconnectFromRaceDataSocket() {
    this.isRaceDataSocketExplicitlyDisconnected = true;
    if (this.raceDataSocket) {
      this.raceDataSocket.close();
      this.raceDataSocket = undefined;
      this.socketConnectedSubject.next(false);
    }
  }

  public disconnectAllSockets() {
    this.disconnectFromInterfaceDataSocket();
    this.disconnectFromRaceDataSocket();
  }

  public getRaceTime(): Observable<IRaceTime> {
    return this.raceTimeSubject.asObservable();
  }
  public getLaps(): Observable<ILap> {
    return this.lapSubject.asObservable();
  }
  public getStandingsUpdate(): Observable<IStandingsUpdate> {
    return this.standingsSubject.asObservable();
  }
  public getOverallStandingsUpdate(): Observable<IOverallStandingsUpdate> {
    return this.overallStandingsSubject.asObservable();
  }
  public getGroupStandingsUpdate(): Observable<IGroupStandingsUpdate> {
    return this.groupStandingsSubject.asObservable();
  }
  public getRaceUpdate(): Observable<IRace> {
    return this.raceUpdateSubject.asObservable();
  }
  public getInterfaceEvents(): Observable<IInterfaceEvent> {
    return this.interfaceEventSubject.asObservable();
  }
  public getRaceState(): Observable<RaceState> {
    return this.raceStateSubject.asObservable();
  }
  public getRaceFlag(): Observable<RaceFlag> {
    return this.flagSubject.asObservable();
  }
  public getCarData(): Observable<ICarData> {
    return this.carDataSubject.asObservable();
  }
  public getSegments(): Observable<ISegment> {
    return this.segmentSubject.asObservable();
  }
  public getRecordData(): Observable<IRecordData> {
    return this.recordDataSubject.asObservable();
  }
  public getHeats(): Observable<IHeat> {
    return this.heatSubject.asObservable();
  }
  public getSystemState(): Observable<SystemState | null> {
    return this.systemStateSubject.asObservable();
  }
  public getSystemStateValue(): SystemState | null {
    return this.systemStateSubject.value;
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
