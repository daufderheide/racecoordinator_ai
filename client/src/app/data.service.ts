import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, ReplaySubject } from 'rxjs';
import { com } from './proto/message';
import { map } from 'rxjs/operators';
import { SettingsService } from './services/settings.service';
import { ArduinoConfig } from './models/track';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Pointing to the Java server API
  private serverIp = 'localhost';
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
    private settingsService: SettingsService
  ) {
    const settings = this.settingsService.getSettings();
    if (settings.serverIp && settings.serverPort) {
      this.serverIp = settings.serverIp;
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
    return this.http.get(`${this.baseUrl}/api/version`, { responseType: 'text' });
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

  generateHeats(raceId: string, driverCount: number): Observable<any> {
    return this.http.post<any>(`http://${this.serverIp}:${this.serverPort}/api/races/${raceId}/generate-heats`, {
      driverCount
    });
  }

  previewHeats(trackId: string, rotationType: string, driverCount: number): Observable<any> {
    return this.http.post<any>(`http://${this.serverIp}:${this.serverPort}/api/heats/preview`, {
      trackId,
      rotationType,
      driverCount
    });
  }

  getTracks(): Observable<any[]> {
    return this.http.get<any[]>(this.tracksUrl);
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

  initializeRace(raceId: string, driverIds: string[], isDemoMode: boolean): Observable<com.antigravity.InitializeRaceResponse> {
    const request = com.antigravity.InitializeRaceRequest.create({ raceId, driverIds, isDemoMode });
    const buffer = com.antigravity.InitializeRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/initialize-race`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        return com.antigravity.InitializeRaceResponse.decode(new Uint8Array(response as any));
      })
    );
  }

  initializeInterface(config: ArduinoConfig, laneCount: number): Observable<com.antigravity.InitializeInterfaceResponse> {
    const request = com.antigravity.InitializeInterfaceRequest.create({
      config: com.antigravity.ArduinoConfig.create({
        name: config.name,
        commPort: config.commPort,
        baudRate: config.baudRate,
        debounceUs: config.debounceUs,
        hardwareType: config.hardwareType,
        globalInvertLanes: config.globalInvertLanes,
        normallyClosedRelays: config.normallyClosedRelays,
        globalInvertLights: config.globalInvertLights,
        useLapsForPits: config.useLapsForPits,
        useLapsForPitEnd: config.useLapsForPitEnd,
        usePitsAsLaps: config.usePitsAsLaps,
        useLapsForSegments: config.useLapsForSegments,
        digitalIds: config.digitalIds,
        analogIds: config.analogIds,
        ledLaneColorOverrides: config.ledLaneColorOverrides || []
      }),
      laneCount
    });
    const buffer = com.antigravity.InitializeInterfaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/initialize-interface`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        return com.antigravity.InitializeInterfaceResponse.decode(new Uint8Array(response as any));
      })
    );
  }

  updateInterfaceConfig(config: ArduinoConfig): Observable<com.antigravity.UpdateInterfaceConfigResponse> {
    const request = com.antigravity.UpdateInterfaceConfigRequest.create({
      config: com.antigravity.ArduinoConfig.create({
        name: config.name,
        commPort: config.commPort,
        baudRate: config.baudRate,
        debounceUs: config.debounceUs,
        hardwareType: config.hardwareType,
        globalInvertLanes: config.globalInvertLanes,
        normallyClosedRelays: config.normallyClosedRelays,
        globalInvertLights: config.globalInvertLights,
        useLapsForPits: config.useLapsForPits,
        useLapsForPitEnd: config.useLapsForPitEnd,
        usePitsAsLaps: config.usePitsAsLaps,
        useLapsForSegments: config.useLapsForSegments,
        digitalIds: config.digitalIds,
        analogIds: config.analogIds,
        ledLaneColorOverrides: config.ledLaneColorOverrides || []
      })
    });
    const buffer = com.antigravity.UpdateInterfaceConfigRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/update-interface-config`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        return com.antigravity.UpdateInterfaceConfigResponse.decode(new Uint8Array(response as any));
      })
    );
  }

  setInterfacePinState(pin: number, isDigital: boolean, isHigh: boolean): Observable<com.antigravity.SetInterfacePinStateResponse> {
    const request = com.antigravity.SetInterfacePinStateRequest.create({
      pin,
      isDigital,
      isHigh
    });
    const buffer = com.antigravity.SetInterfacePinStateRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/set-interface-pin-state`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        return com.antigravity.SetInterfacePinStateResponse.decode(new Uint8Array(response as any));
      })
    );
  }

  startRace(): Observable<boolean> {
    const request = com.antigravity.StartRaceRequest.create({});
    const buffer = com.antigravity.StartRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/start-race`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const startResponse = com.antigravity.StartRaceResponse.decode(new Uint8Array(response as any));
        return startResponse.success;
      })
    );
  }

  pauseRace(): Observable<boolean> {
    const request = com.antigravity.PauseRaceRequest.create({});
    const buffer = com.antigravity.PauseRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/pause-race`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const pauseResponse = com.antigravity.PauseRaceResponse.decode(new Uint8Array(response as any));
        return pauseResponse.success;
      })
    );
  }

  nextHeat(): Observable<boolean> {
    const request = com.antigravity.NextHeatRequest.create({});
    const buffer = com.antigravity.NextHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/next-heat`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const nextResponse = com.antigravity.NextHeatResponse.decode(new Uint8Array(response as any));
        return nextResponse.success ?? false;
      })
    );
  }

  restartHeat(): Observable<boolean> {
    const request = com.antigravity.RestartHeatRequest.create({});
    const buffer = com.antigravity.RestartHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/restart-heat`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const restartResponse = com.antigravity.RestartHeatResponse.decode(new Uint8Array(response as any));
        return restartResponse.success ?? false;
      })
    );
  }

  skipHeat(): Observable<boolean> {
    const request = com.antigravity.SkipHeatRequest.create({});
    const buffer = com.antigravity.SkipHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/skip-heat`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const skipResponse = com.antigravity.SkipHeatResponse.decode(new Uint8Array(response as any));
        return skipResponse.success ?? false;
      })
    );
  }

  deferHeat(): Observable<boolean> {
    const request = com.antigravity.DeferHeatRequest.create({});
    const buffer = com.antigravity.DeferHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/defer-heat`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const deferResponse = com.antigravity.DeferHeatResponse.decode(new Uint8Array(response as any));
        return deferResponse.success ?? false;
      })
    );
  }

  // --- Database Management ---

  getDatabases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/databases`);
  }

  getCurrentDatabase(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/databases/current?t=${new Date().getTime()}`);
  }

  createDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/create`, { name });
  }

  switchDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/switch`, { name });
  }

  copyDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/copy`, { name });
  }

  resetDatabase(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/reset`, {});
  }

  deleteDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/databases/delete`, { name });
  }

  exportDatabase(name: string) {
    window.location.href = `${this.baseUrl}/api/databases/${name}/export`;
  }

  importDatabase(name: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/api/databases/import`, formData);
  }

  // --- Asset Management ---
  listAssets(): Observable<com.antigravity.IAsset[]> {
    return this.http.get(`${this.baseUrl}/api/assets/list`, {
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const listResponse = com.antigravity.ListAssetsResponse.decode(new Uint8Array(response as any));
        return listResponse.assets;
      })
    );
  }

  uploadAsset(name: string, type: string, data: Uint8Array): Observable<com.antigravity.IAsset> {
    const request = com.antigravity.UploadAssetRequest.create({ name, type, data });
    const buffer = com.antigravity.UploadAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/assets/upload`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const uploadResponse = com.antigravity.UploadAssetResponse.decode(new Uint8Array(response as any));
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message);
        }
        return uploadResponse.asset!;
      })
    );
  }

  deleteAsset(id: string): Observable<boolean> {
    const request = com.antigravity.DeleteAssetRequest.create({ id });
    const buffer = com.antigravity.DeleteAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/assets/delete`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const deleteResponse = com.antigravity.DeleteAssetResponse.decode(new Uint8Array(response as any));
        if (!deleteResponse.success) {
          throw new Error(deleteResponse.message);
        }
        return true;
      })
    );
  }

  renameAsset(id: string, newName: string): Observable<boolean> {
    const request = com.antigravity.RenameAssetRequest.create({ id, newName });
    const buffer = com.antigravity.RenameAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(`${this.baseUrl}/api/assets/rename`, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const renameResponse = com.antigravity.RenameAssetResponse.decode(new Uint8Array(response as any));
        if (!renameResponse.success) {
          throw new Error(renameResponse.message);
        }
        return true;
      })
    );
  }

  private raceDataSocket?: WebSocket;
  private interfaceDataSocket?: WebSocket;
  private raceTimeSubject = new BehaviorSubject<number>(0);
  private lapSubject = new Subject<com.antigravity.ILap>();
  private reactionTimeSubject = new Subject<com.antigravity.IReactionTime>();
  private standingsSubject = new Subject<com.antigravity.IStandingsUpdate>();
  private overallStandingsSubject = new Subject<com.antigravity.IOverallStandingsUpdate>();
  private raceUpdateSubject = new ReplaySubject<com.antigravity.IRace>(1);
  private interfaceEventSubject = new Subject<com.antigravity.IInterfaceEvent>();
  private raceStateSubject = new BehaviorSubject<com.antigravity.RaceState>(com.antigravity.RaceState.UNKNOWN_STATE);

  private shouldSubscribeToRaceData = false;

  public updateRaceSubscription(subscribe: boolean) {
    this.shouldSubscribeToRaceData = subscribe;
    if (this.raceDataSocket && this.raceDataSocket.readyState === WebSocket.OPEN) {
      this.sendRaceSubscriptionRequest(subscribe);
    } else {
      console.warn('Race Data WebSocket not open. Triggering connection check and queuing subscription.');
      // If we are completely disconnected, rely on the reconnect loop or trigger one now
      this.connectToRaceDataSocket();
      // Subscription will be sent on open
    }
  }

  private sendRaceSubscriptionRequest(subscribe: boolean) {
    if (!this.raceDataSocket || this.raceDataSocket.readyState !== WebSocket.OPEN) return;

    const request = com.antigravity.RaceSubscriptionRequest.create({ subscribe });
    const buffer = com.antigravity.RaceSubscriptionRequest.encode(request).finish();
    this.raceDataSocket.send(buffer);
    console.log(`Sent RaceSubscriptionRequest: subscribe=${subscribe}`);
  }

  public connectToRaceDataSocket() {
    if (this.raceDataSocket && (this.raceDataSocket.readyState === WebSocket.OPEN || this.raceDataSocket.readyState === WebSocket.CONNECTING)) {
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
    console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
    this.raceDataSocket = new WebSocket(wsUrl);
    this.raceDataSocket.binaryType = 'arraybuffer';

    this.raceDataSocket.onopen = () => {
      console.log('Connected to Race Data WebSocket');
      // If we had pending subscriptions or state, we might need to resend.
      if (this.shouldSubscribeToRaceData) {
        this.sendRaceSubscriptionRequest(true);
      }
    };

    this.raceDataSocket.onmessage = (event) => {
      try {
        const arrayBuffer = event.data as ArrayBuffer;
        const raceData = com.antigravity.RaceData.decode(new Uint8Array(arrayBuffer));

        if (raceData.raceTime) {
          this.raceTimeSubject.next(raceData.raceTime.time!);
        } else if (raceData.lap) {
          this.lapSubject.next(raceData.lap);
        } else if (raceData.reactionTime) {
          this.reactionTimeSubject.next(raceData.reactionTime);
        } else if (raceData.standingsUpdate) {
          this.standingsSubject.next(raceData.standingsUpdate);
        } else if (raceData.overallStandingsUpdate) {
          this.overallStandingsSubject.next(raceData.overallStandingsUpdate);
        } else if (raceData.raceState) {
          console.log('WS: Received RaceState', raceData.raceState);
          this.raceStateSubject.next(raceData.raceState);
        } else if (raceData.race) {
          console.log('WS: Received Race', raceData.race);
          this.raceUpdateSubject.next(raceData.race);
          if (raceData.race.state) {
            this.raceStateSubject.next(raceData.race.state);
          }
        }
      } catch (e) {
        console.error('Error parsing race data message', e);
      }
    };

    this.raceDataSocket.onclose = () => {
      console.log('Race Data WebSocket closed. Reconnecting in 2 seconds...');
      this.raceDataSocket = undefined;
      setTimeout(() => {
        this.connectToRaceDataSocket();
      }, 2000);
    };

    this.raceDataSocket.onerror = (err) => {
      console.warn('Race Data WebSocket error', err);
      // onerror often followed by onclose, so we rely on onclose for retry
    };
  }

  public connectToInterfaceDataSocket() {
    if (this.interfaceDataSocket && (this.interfaceDataSocket.readyState === WebSocket.OPEN || this.interfaceDataSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.interfaceDataSocket) {
      try {
        this.interfaceDataSocket.close();
      } catch (e) { }
    }

    const wsUrl = `ws://${this.serverIp}:${this.serverPort}/api/interface-data`;
    console.log(`Connecting to Interface WebSocket: ${wsUrl}`);
    this.interfaceDataSocket = new WebSocket(wsUrl);
    this.interfaceDataSocket.binaryType = 'arraybuffer';

    this.interfaceDataSocket.onopen = () => {
      console.log('Connected to Interface WebSocket');
    };

    this.interfaceDataSocket.onmessage = (event) => {
      try {
        const arrayBuffer = event.data as ArrayBuffer;
        const msg = com.antigravity.InterfaceEvent.decode(new Uint8Array(arrayBuffer));
        this.interfaceEventSubject.next(msg);
      } catch (e) {
        console.error('Error parsing interface data message', e);
      }
    };

    this.interfaceDataSocket.onclose = () => {
      console.log('Interface Data WebSocket closed.');
      this.interfaceDataSocket = undefined;
    };
  }

  public disconnectFromInterfaceDataSocket() {
    if (this.interfaceDataSocket) {
      this.interfaceDataSocket.close();
      this.interfaceDataSocket = undefined;
    }
  }

  public getRaceTime(): Observable<number> {
    return this.raceTimeSubject.asObservable();
  }

  public getLaps(): Observable<com.antigravity.ILap> {
    return this.lapSubject.asObservable();
  }

  public getReactionTimes(): Observable<com.antigravity.IReactionTime> {
    return this.reactionTimeSubject.asObservable();
  }

  public getStandingsUpdate(): Observable<com.antigravity.IStandingsUpdate> {
    return this.standingsSubject.asObservable();
  }

  public getOverallStandingsUpdate(): Observable<com.antigravity.IOverallStandingsUpdate> {
    return this.overallStandingsSubject.asObservable();
  }

  public getRaceUpdate(): Observable<com.antigravity.IRace> {
    return this.raceUpdateSubject.asObservable();
  }

  public getInterfaceEvents(): Observable<com.antigravity.IInterfaceEvent> {
    return this.interfaceEventSubject.asObservable();
  }

  public getRaceState(): Observable<com.antigravity.RaceState> {
    return this.raceStateSubject.asObservable();
  }
}
