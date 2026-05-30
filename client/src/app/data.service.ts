/* eslint-disable max-lines */
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, NgZone } from "@angular/core";
import { Reader } from "protobufjs";
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ArduinoConfig } from "@app/models/track";
import {
  ArduinoConfig as ProtoArduinoConfig,
  DeferHeatRequest,
  DeferHeatResponse,
  DeleteAssetRequest,
  DeleteAssetResponse,
  IAssetMessage,
  ICarData,
  ICustomRotation,
  IDemoConfig,
  IHeat,
  IInterfaceEvent,
  ILap,
  InitializeInterfaceRequest,
  InitializeInterfaceResponse,
  InitializeRaceRequest,
  InitializeRaceResponse,
  InterfaceEvent,
  IOverallStandingsUpdate,
  IRace,
  IRaceParticipant,
  IRaceTime,
  IRecordData,
  IRgbLedState,
  ISaveAudioSetEntry,
  ISaveImageSetEntry,
  ISegment,
  IStandingsUpdate,
  ITeamModel,
  LedString as ProtoLedString,
  ListAssetsResponse,
  ModifyHeatsRequest,
  ModifyHeatsResponse,
  NextHeatRequest,
  NextHeatResponse,
  PauseRaceRequest,
  PauseRaceResponse,
  RaceData,
  RaceFlag,
  RaceState,
  RaceSubscriptionRequest,
  RegenerateHeatsRequest,
  RegenerateHeatsResponse,
  RenameAssetRequest,
  RenameAssetResponse,
  RestartHeatRequest,
  RestartHeatResponse,
  RgbLedState,
  SaveAudioSetRequest,
  SaveAudioSetResponse,
  SaveCustomRotationRequest,
  SaveCustomRotationResponse,
  SaveImageSetRequest,
  SaveImageSetResponse,
  SetInterfacePinStateRequest,
  SetInterfacePinStateResponse,
  SetInterfaceRgbLedStateRequest,
  SetInterfaceRgbLedStateResponse,
  SkipHeatRequest,
  SkipHeatResponse,
  StartRaceRequest,
  StartRaceResponse,
  SystemState,
  UpdateInterfaceConfigRequest,
  UpdateInterfaceConfigResponse,
  UploadAssetRequest,
  UploadAssetResponse,
  VoltageConfig as ProtoVoltageConfig,
  VoltageConfig,
} from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

@Injectable({
  providedIn: "root",
})
export class DataService {
  // Pointing to the Java server API
  private serverIp =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  private serverPort = 7070;

  private get baseUrl(): string {
    return `http://${this.serverIp}:${this.serverPort}`;
  }

  public get serverUrl(): string {
    return this.baseUrl;
  }

  private get driversUrl(): string {
    return `${this.baseUrl}/api/drivers`;
  }

  private get tracksUrl(): string {
    return `${this.baseUrl}/api/tracks`;
  }

  private get racesUrl(): string {
    return `${this.baseUrl}/api/races`;
  }

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService,
    private ngZone: NgZone,
    private logger: LoggerService,
  ) {
    const settings = this.settingsService.getSettings();
    if (settings.serverIp) {
      this.serverIp = settings.serverIp;
    }
    if (settings.serverPort) {
      this.serverPort = settings.serverPort;
    }
  }

  public setServerAddress(ip: string, port: number) {
    this.serverIp = ip;
    this.serverPort = port;
    // Reconnect socket if it was open? Usually we just let the next attempt handle it,
    // or we can force a reconnect. Since this is mainly for startup configuration,
    // the next call to connectToRaceDataSocket() will pick it up.
    if (this.raceDataSocket) {
      this.raceDataSocket.close();
      this.raceDataSocket = undefined;
    }
  }

  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(this.driversUrl);
  }

  getServerVersion(): Observable<string> {
    return this.http.get(`${this.baseUrl}/api/version`, {
      responseType: "text",
    });
  }

  getServerIp(): Observable<string> {
    return this.http.get(`${this.baseUrl}/api/server-ip`, {
      responseType: "text",
    });
  }

  setServerLogLevel(level: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/settings/log-level?level=${level}`,
      {},
      { responseType: "text" },
    );
  }

  createDriver(driver: any): Observable<any> {
    return this.http.post<any>(this.driversUrl, driver);
  }

  updateDriver(id: string, driver: any): Observable<any> {
    return this.http.put<any>(`${this.driversUrl}/${id}`, driver);
  }

  deleteDriver(id: string): Observable<any> {
    return this.http.delete<any>(`${this.driversUrl}/${id}`);
  }

  getRaces(): Observable<any[]> {
    return this.http.get<any[]>(this.racesUrl);
  }

  createRace(race: any): Observable<any> {
    return this.http.post<any>(this.racesUrl, race);
  }

  updateRace(id: string, race: any): Observable<any> {
    return this.http.put<any>(`${this.racesUrl}/${id}`, race);
  }

  deleteRace(id: string): Observable<any> {
    return this.http.delete<any>(`${this.racesUrl}/${id}`);
  }

  exportRaceToCsv(): Observable<string> {
    return this.http.get(`${this.baseUrl}/api/races/current/export-csv`, {
      responseType: "text",
    });
  }

  public getDefaultDemoConfig(): IDemoConfig {
    return {
      minLapTimeMs: 3000,
      maxLapTimeMs: 5000,
      minRefuelTimeMs: 5000,
      maxRefuelTimeMs: 10000,
      numSegments: 4,
      minLapsBetweenPits: 3,
      maxLapsBetweenPits: 7,
      minReactionTimeMs: 1,
      maxReactionTimeMs: 500,
      minPitEntryOffsetMs: 500,
      maxPitEntryOffsetMs: 1000,
    };
  }

  generateHeats(raceId: string, driverCount: number): Observable<any> {
    return this.http.post<any>(
      `http://${this.serverIp}:${this.serverPort}/api/races/${raceId}/generate-heats`,
      {
        driverCount,
      },
    );
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
    return this.http.post<any>(
      `http://${this.serverIp}:${this.serverPort}/api/heats/preview`,
      {
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
      },
    );
  }

  getTracks(): Observable<any[]> {
    return this.http.get<any[]>(this.tracksUrl);
  }

  getTrackFactorySettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/tracks/factory-settings`);
  }

  createTrack(track: any): Observable<any> {
    return this.http.post<any>(this.tracksUrl, track);
  }

  updateTrack(id: string, track: any): Observable<any> {
    return this.http.put<any>(`${this.tracksUrl}/${id}`, track);
  }

  deleteTrack(id: string): Observable<any> {
    return this.http.delete<any>(`${this.tracksUrl}/${id}`);
  }

  getSerialPorts(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/api/serial-ports`);
  }

  initializeRace(
    raceId: string,
    driverIds: string[],
    isDemoMode: boolean,
    demoConfig?: IDemoConfig,
  ): Observable<InitializeRaceResponse> {
    const request = InitializeRaceRequest.create({
      raceId,
      driverIds,
      isDemoMode,
      demoConfig,
    });
    const buffer = InitializeRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/initialize-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          return InitializeRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  initializeInterface(
    configs: ArduinoConfig[],
    laneCount: number,
  ): Observable<InitializeInterfaceResponse> {
    const request = InitializeInterfaceRequest.create({
      configs: configs.map((config) =>
        ProtoArduinoConfig.create({
          name: config.name,
          commPort: config.commPort,
          baudRate: config.baudRate,
          debounceUs: config.debounceUs,
          hardwareType: config.hardwareType,
          normallyClosedLaneSensors: config.normallyClosedLaneSensors,
          normallyClosedRelays: config.normallyClosedRelays,
          globalInvertLights: config.globalInvertLights,
          usePitsAsLaps: config.usePitsAsLaps,
          useLapsForSegments: config.useLapsForSegments,
          digitalIds: config.digitalIds,
          analogIds: config.analogIds,
          ledStrings:
            config.ledStrings?.map((ls) =>
              ProtoLedString.create({
                pin: ls.pin,
                leds: ls.leds,
                numUsedLeds: ls.numUsedLeds,
                addressableLeds: ls.addressableLeds,
                brightness: ls.brightness,
                colorOrder: ls.colorOrder,
                flagFlashRate: ls.flagFlashRate,
                ledLaneColorOverrides: ls.ledLaneColorOverrides,
              }),
            ) || [],
          voltageConfigs: Object.entries(config.voltageConfigs || {}).map(
            ([lane, maxVoltage]) =>
              ProtoVoltageConfig.create({
                lane: parseInt(lane, 10),
                maxVoltage: maxVoltage as number,
              }),
          ),
        }),
      ),
      laneCount,
    });
    const buffer = InitializeInterfaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.baseUrl}/api/initialize-interface`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return InitializeInterfaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  updateInterfaceConfig(
    config: ArduinoConfig,
    interfaceIndex: number,
  ): Observable<UpdateInterfaceConfigResponse> {
    const request = UpdateInterfaceConfigRequest.create({
      config: ProtoArduinoConfig.create({
        name: config.name,
        commPort: config.commPort,
        baudRate: config.baudRate,
        debounceUs: config.debounceUs,
        hardwareType: config.hardwareType,
        normallyClosedLaneSensors: config.normallyClosedLaneSensors,
        normallyClosedRelays: config.normallyClosedRelays,
        globalInvertLights: config.globalInvertLights,
        usePitsAsLaps: config.usePitsAsLaps,
        useLapsForSegments: config.useLapsForSegments,
        digitalIds: config.digitalIds,
        analogIds: config.analogIds,
        ledStrings:
          config.ledStrings?.map((ls) =>
            ProtoLedString.create({
              pin: ls.pin,
              leds: ls.leds,
              numUsedLeds: ls.numUsedLeds,
              addressableLeds: ls.addressableLeds,
              brightness: ls.brightness,
              colorOrder: ls.colorOrder,
              flagFlashRate: ls.flagFlashRate,
              ledLaneColorOverrides: ls.ledLaneColorOverrides,
            }),
          ) || [],
        voltageConfigs: Object.entries(config.voltageConfigs || {}).map(
          ([lane, maxVoltage]) =>
            VoltageConfig.create({
              lane: parseInt(lane, 10),
              maxVoltage: maxVoltage as number,
            }),
        ),
      }),
      interfaceIndex,
    });
    const buffer = UpdateInterfaceConfigRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.baseUrl}/api/update-interface-config`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return UpdateInterfaceConfigResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  setInterfacePinState(
    pin: number,
    isDigital: boolean,
    isHigh: boolean,
    interfaceIndex: number,
  ): Observable<SetInterfacePinStateResponse> {
    const request = SetInterfacePinStateRequest.create({
      pin,
      isDigital,
      isHigh,
      interfaceIndex,
    });
    const buffer = SetInterfacePinStateRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.baseUrl}/api/set-interface-pin-state`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return SetInterfacePinStateResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  setInterfaceRgbLedState(
    pin: number,
    leds: IRgbLedState[],
    interfaceIndex: number,
  ): Observable<SetInterfaceRgbLedStateResponse> {
    const request = SetInterfaceRgbLedStateRequest.create({
      pin,
      leds: leds.map((l) => RgbLedState.create(l)),
      interfaceIndex,
    });
    const buffer = SetInterfaceRgbLedStateRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.baseUrl}/api/set-interface-rgb-led-state`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return SetInterfaceRgbLedStateResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  closeInterface(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/close-interface`, {});
  }

  startRace(): Observable<boolean> {
    const request = StartRaceRequest.create({});
    const buffer = StartRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/start-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const startResponse = StartRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return startResponse.success;
        }),
      );
  }

  pauseRace(): Observable<boolean> {
    const request = PauseRaceRequest.create({});
    const buffer = PauseRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/pause-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const pauseResponse = PauseRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return pauseResponse.success;
        }),
      );
  }

  abortTimers(): Observable<boolean> {
    const request = PauseRaceRequest.create({});
    const buffer = PauseRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/abort-timers`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const abortResponse = PauseRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return abortResponse.success ?? false;
        }),
      );
  }

  nextHeat(): Observable<boolean> {
    const request = NextHeatRequest.create({});
    const buffer = NextHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/next-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const nextResponse = NextHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return nextResponse.success ?? false;
        }),
      );
  }

  restartHeat(): Observable<boolean> {
    const request = RestartHeatRequest.create({});
    const buffer = RestartHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/restart-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const restartResponse = RestartHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return restartResponse.success ?? false;
        }),
      );
  }

  skipHeat(): Observable<boolean> {
    const request = SkipHeatRequest.create({});
    const buffer = SkipHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/skip-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const skipResponse = SkipHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return skipResponse.success ?? false;
        }),
      );
  }

  deferHeat(): Observable<boolean> {
    const request = DeferHeatRequest.create({});
    const buffer = DeferHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/defer-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const deferResponse = DeferHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return deferResponse.success ?? false;
        }),
      );
  }

  modifyHeats(
    heats: IHeat[],
    participants: IRaceParticipant[],
  ): Observable<ModifyHeatsResponse> {
    const request = ModifyHeatsRequest.create({
      heats,
      participants,
    });
    const buffer = ModifyHeatsRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/modify-heats`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          return ModifyHeatsResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  regenerateHeats(
    participants: IRaceParticipant[] = [],
  ): Observable<RegenerateHeatsResponse> {
    const request = RegenerateHeatsRequest.create({
      participants,
    });
    const buffer = RegenerateHeatsRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/regenerate-heats`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          return RegenerateHeatsResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  // --- Database Management ---

  getTeams(): Observable<ITeamModel[]> {
    return this.http.get<ITeamModel[]>(`${this.baseUrl}/api/teams`);
  }

  createTeam(team: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/teams`, team);
  }

  updateTeam(id: string, team: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/teams/${id}`, team);
  }

  deleteTeam(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/teams/${id}`);
  }

  // --- Theme API ---

  getThemes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/themes`);
  }

  getDefaultTheme(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/themes/default`);
  }

  getTheme(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/themes/${id}`);
  }

  createTheme(theme: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/themes`, theme);
  }

  updateTheme(id: string, theme: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/themes/${id}`, theme);
  }

  deleteTheme(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/themes/${id}`);
  }

  duplicateTheme(id: string, name?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/themes/${id}/duplicate`, {
      name,
    });
  }

  getDatabases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/databases`);
  }

  getCurrentDatabase(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/databases/current?t=${new Date().getTime()}`,
    );
  }

  createDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/create`, {
      name,
    });
  }

  switchDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/switch`, {
      name,
    });
  }

  copyDatabase(name: string, source?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/copy`, {
      name,
      source,
    });
  }

  resetDatabase(name?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/reset`, { name });
  }

  deleteDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/delete`, {
      name,
    });
  }

  exportDatabase(name: string) {
    window.location.href = `${this.baseUrl}/api/databases/${name}/export`;
  }

  importDatabase(name: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);
    return this.http.post<any>(
      `${this.baseUrl}/api/databases/import`,
      formData,
    );
  }

  // --- Asset Management ---
  listAssets(): Observable<IAssetMessage[]> {
    return this.http
      .get(`${this.baseUrl}/api/assets/list`, {
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          try {
            const listResponse = ListAssetsResponse.decode(
              Reader.create(new Uint8Array(response as any)),
            );
            return listResponse.assets;
          } catch (error) {
            this.logger.error("Error decoding asset list protobuf", error);
            return [];
          }
        }),
      );
  }

  getAssetUrl(id: string): string {
    return `${this.baseUrl}/api/assets/download/${id}`;
  }

  uploadAsset(
    name: string,
    type: string,
    data: Uint8Array,
  ): Observable<IAssetMessage> {
    const request = UploadAssetRequest.create({
      name,
      type,
      data,
    });
    const buffer = UploadAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/assets/upload`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const uploadResponse = UploadAssetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!uploadResponse.success) {
            throw new Error(uploadResponse.message);
          }
          return uploadResponse.asset!;
        }),
      );
  }

  saveImageSet(
    name: string,
    entries: ISaveImageSetEntry[],
    id?: string,
  ): Observable<IAssetMessage> {
    const request = SaveImageSetRequest.create({
      id,
      name,
      entries,
    });
    const buffer = SaveImageSetRequest.encode(request).finish();
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/octet-stream",
    );

    return this.http
      .post(
        `${this.baseUrl}/api/assets/save-image-set`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const saveResponse = SaveImageSetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!saveResponse.success) {
            throw new Error(
              saveResponse.message ?? "Unknown error saving image set",
            );
          }
          return saveResponse.asset!;
        }),
      );
  }

  saveAudioSet(
    name: string,
    entries: ISaveAudioSetEntry[],
    id?: string,
  ): Observable<IAssetMessage> {
    const request = SaveAudioSetRequest.create({
      id,
      name,
      entries,
    });
    const buffer = SaveAudioSetRequest.encode(request).finish();
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/octet-stream",
    );

    return this.http
      .post(
        `${this.baseUrl}/api/assets/save-audio-set`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const saveResponse = SaveAudioSetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!saveResponse.success) {
            throw new Error(
              saveResponse.message ?? "Unknown error saving audio set",
            );
          }
          return saveResponse.asset!;
        }),
      );
  }

  saveCustomRotation(
    name: string,
    numLanes: number,
    rotations: ICustomRotation[],
    id?: string,
  ): Observable<IAssetMessage> {
    const request = SaveCustomRotationRequest.create({
      id,
      name,
      numLanes,
      rotations,
    });
    const buffer = SaveCustomRotationRequest.encode(request).finish();
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/octet-stream",
    );

    return this.http
      .post(
        `${this.baseUrl}/api/assets/save-custom-rotation`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const saveResponse = SaveCustomRotationResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!saveResponse.success) {
            throw new Error(
              saveResponse.message ?? "Unknown error saving custom rotation",
            );
          }
          return saveResponse.asset!;
        }),
      );
  }

  deleteAsset(id: string): Observable<boolean> {
    const request = DeleteAssetRequest.create({ id });
    const buffer = DeleteAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/assets/delete`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const deleteResponse = DeleteAssetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!deleteResponse.success) {
            throw new Error(deleteResponse.message);
          }
          return true;
        }),
      );
  }

  renameAsset(id: string, newName: string): Observable<boolean> {
    const request = RenameAssetRequest.create({ id, newName });
    const buffer = RenameAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.baseUrl}/api/assets/rename`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const renameResponse = RenameAssetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!renameResponse.success) {
            throw new Error(renameResponse.message);
          }
          return true;
        }),
      );
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

  public updateRaceSubscription(subscribe: boolean) {
    this.shouldSubscribeToRaceData = subscribe;
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
    )
      return;

    const request = RaceSubscriptionRequest.create({
      subscribe,
    });
    const buffer = RaceSubscriptionRequest.encode(request).finish();
    this.raceDataSocket.send(buffer);
    this.logger.info(`Sent RaceSubscriptionRequest: subscribe=${subscribe}`);
  }

  public connectToRaceDataSocket() {
    if (
      this.raceDataSocket &&
      (this.raceDataSocket.readyState === WebSocket.OPEN ||
        this.raceDataSocket.readyState === WebSocket.CONNECTING)
    ) {
      return; // Already connecting or connected
    }

    if (this.raceDataSocket) {
      try {
        this.raceDataSocket.close();
      } catch (e) {
        // Ignore
      }
    }

    const wsUrl = `ws://${this.serverIp}:${this.serverPort}/api/race-data`;
    this.logger.debug(`Attempting to connect to WebSocket: ${wsUrl}`);
    this.raceDataSocket = new WebSocket(wsUrl);
    this.raceDataSocket.binaryType = "arraybuffer";

    this.raceDataSocket.onopen = () => {
      this.logger.info("Connected to Race Data WebSocket");
      this.socketConnectedSubject.next(true);
      // If we had pending subscriptions or state, we might need to resend.
      if (this.shouldSubscribeToRaceData) {
        this.sendRaceSubscriptionRequest(true);
      }
    };

    this.raceDataSocket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const arrayBuffer = event.data as ArrayBuffer;
          const raceData = RaceData.decode(
            Reader.create(new Uint8Array(arrayBuffer)),
          );

          if (raceData.raceTime) {
            this.raceTimeSubject.next(raceData.raceTime);
          }
          if (raceData.lap) {
            this.lapSubject.next(raceData.lap);
          }
          if (raceData.standingsUpdate) {
            this.standingsSubject.next(raceData.standingsUpdate);
          }
          if (raceData.overallStandingsUpdate) {
            this.overallStandingsSubject.next(raceData.overallStandingsUpdate);
          }
          if (raceData.raceState) {
            this.logger.debug("WS: Received RaceState", raceData.raceState);
            this.raceStateSubject.next(raceData.raceState);
          }
          if (raceData.race) {
            this.logger.debug("WS: Received Race", raceData.race);
            this.raceUpdateSubject.next(raceData.race);
            if (raceData.race.state) {
              this.raceStateSubject.next(raceData.race.state);
            }
            if (raceData.race.flag) {
              this.flagSubject.next(raceData.race.flag);
            }
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
        } catch (e) {
          this.logger.error("Error parsing race data message", e);
        }
      });
    };

    this.raceDataSocket.onclose = () => {
      this.logger.info(
        "Race Data WebSocket closed. Reconnecting in 2 seconds...",
      );
      this.socketConnectedSubject.next(false);
      this.raceDataSocket = undefined;
      setTimeout(() => {
        this.connectToRaceDataSocket();
      }, 2000);
    };

    this.raceDataSocket.onerror = (err) => {
      this.logger.warn("Race Data WebSocket error", err);
      // onerror often followed by onclose, so we rely on onclose for retry
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

    if (this.interfaceDataSocket) {
      try {
        this.interfaceDataSocket.close();
      } catch (e) {}
    }

    const wsUrl = `ws://${this.serverIp}:${this.serverPort}/api/interface-data`;
    this.logger.debug(`Connecting to Interface WebSocket: ${wsUrl}`);
    this.interfaceDataSocket = new WebSocket(wsUrl);
    this.interfaceDataSocket.binaryType = "arraybuffer";

    this.interfaceDataSocket.onopen = () => {
      this.logger.info("Connected to Interface WebSocket");
    };

    this.interfaceDataSocket.onmessage = (event) => {
      try {
        const data = event.data;
        let uint8Array: Uint8Array;

        if (data instanceof ArrayBuffer) {
          uint8Array = new Uint8Array(data);
        } else if (typeof data === "string") {
          // Some environments/proxies might return Base64 strings
          try {
            const trimmed = data.trim().replace(/^"|"$/g, ""); // Remove quotes if they exist
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
    };

    this.interfaceDataSocket.onclose = () => {
      this.logger.info("Interface Data WebSocket closed.");
      this.interfaceDataSocket = undefined;
    };
  }

  public disconnectFromInterfaceDataSocket() {
    if (this.interfaceDataSocket) {
      this.interfaceDataSocket.close();
      this.interfaceDataSocket = undefined;
    }
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

  public changeActualDriver(
    lane: number,
    driverId: string,
  ): Observable<boolean> {
    return this.http
      .post(
        `${this.baseUrl}/api/races/current-heat/drivers/${lane}/actual-driver`,
        {
          driverId,
        },
      )
      .pipe(map(() => true));
  }

  changeLane(fromLane: number, toLane: number): Observable<boolean> {
    return this.http
      .post(
        `${this.baseUrl}/api/races/current-heat/drivers/${fromLane}/change-lane/${toLane}`,
        {},
        { responseType: "text" },
      )
      .pipe(map(() => true));
  }

  saveRace(): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/api/save-race`,
      {},
      { responseType: "text" },
    );
  }

  getSavedRaces(isDemo: boolean = false): Observable<string[]> {
    const url = isDemo
      ? `${this.baseUrl}/api/saved-races?demo=true`
      : `${this.baseUrl}/api/saved-races`;
    return this.http.get<string[]>(url);
  }

  loadRace(filename: string, isDemo: boolean = false): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/api/load-race`,
      { filename, isDemo },
      { responseType: "text" },
    );
  }

  deleteSavedRace(
    filename: string,
    isDemo: boolean = false,
  ): Observable<string> {
    const url = isDemo
      ? `${this.baseUrl}/api/saved-races/${filename}?demo=true`
      : `${this.baseUrl}/api/saved-races/${filename}`;
    return this.http.delete(url, {
      responseType: "text",
    });
  }

  toggleServerAnalytics(enabled: boolean): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/api/analytics/toggle`,
      { enabled },
      { responseType: "text" },
    );
  }

  getServerAnalyticsConfig(): Observable<{
    clientId: string;
    measurementId: string;
  }> {
    return this.http.get<{ clientId: string; measurementId: string }>(
      `${this.baseUrl}/api/analytics/config`,
    );
  }

  updateUserLaps(lane: number, userLaps: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/races/current-heat/drivers/${lane}/user-laps`,
      { userLaps },
    );
  }

  getDriverStatistics(
    driverId: string,
    raceId?: string,
    isDemo?: boolean,
  ): Observable<any> {
    let url = `${this.baseUrl}/api/history/drivers/${driverId}/stats`;
    const params = new URLSearchParams();
    if (raceId) {
      params.append("raceId", raceId);
    }
    if (isDemo !== undefined) {
      params.append("isDemo", isDemo.toString());
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.http.get<any>(url);
  }

  getGlobalStatistics(raceId?: string, isDemo?: boolean): Observable<any> {
    let url = `${this.baseUrl}/api/history/stats`;
    const params = new URLSearchParams();
    if (raceId) {
      params.append("raceId", raceId);
    }
    if (isDemo !== undefined) {
      params.append("isDemo", isDemo.toString());
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.http.get<any>(url);
  }

  getRaceHistory(isDemo: boolean = false): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/history/races?demo=${isDemo}`,
    );
  }

  getRaceHistoryById(id: string, isDemo: boolean = false): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/history/races/${id}?demo=${isDemo}`,
    );
  }

  deleteRaceHistory(
    id: string,
    isDemo: boolean = false,
    database?: string,
  ): Observable<any> {
    let url = `${this.baseUrl}/api/history/races/${id}?demo=${isDemo}`;
    if (database) {
      url += `&database=${encodeURIComponent(database)}`;
    }
    return this.http.delete<any>(url);
  }
}
