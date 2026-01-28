import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, ReplaySubject } from 'rxjs';
import { com } from './proto/message';
import { map } from 'rxjs/operators';

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

  private get driversUrl(): string {
    return `${this.baseUrl}/api/drivers`;
  }

  private get tracksUrl(): string {
    return `${this.baseUrl}/api/tracks`;
  }

  private get racesUrl(): string {
    return `${this.baseUrl}/api/races`;
  }

  constructor(private http: HttpClient) { }

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

  getRaces(): Observable<any[]> {
    return this.http.get<any[]>(this.racesUrl);
  }

  getTracks(): Observable<any[]> {
    return this.http.get<any[]>(this.tracksUrl);
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

  private raceDataSocket?: WebSocket;
  private raceTimeSubject = new BehaviorSubject<number>(0);
  private lapSubject = new Subject<com.antigravity.ILap>();
  private reactionTimeSubject = new Subject<com.antigravity.IReactionTime>();
  private standingsSubject = new Subject<com.antigravity.IStandingsUpdate>();
  private overallStandingsSubject = new Subject<com.antigravity.IOverallStandingsUpdate>();
  private raceUpdateSubject = new ReplaySubject<com.antigravity.IRace>(1);

  public updateRaceSubscription(subscribe: boolean) {
    if (this.raceDataSocket && this.raceDataSocket.readyState === WebSocket.OPEN) {
      const request = com.antigravity.RaceSubscriptionRequest.create({ subscribe });
      const buffer = com.antigravity.RaceSubscriptionRequest.encode(request).finish();
      this.raceDataSocket.send(buffer);
      console.log(`Sent RaceSubscriptionRequest: subscribe=${subscribe}`);
    } else {
      console.warn('Race Data WebSocket not open. Triggering connection check and queuing fallback (retry logic handles actual connect).');
      // If we are completely disconnected, rely on the reconnect loop or trigger one now
      this.connectToRaceDataSocket();

      // We can't send right now, but once connected, the race component (if active) 
      // might need to re-request.
      // Ideally, we'd queue this message, but for now we expect the component 
      // to rely on the stream.
      // NOTE: RacedayComponent usually subscribes in ngOnInit.
    }
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
      // For now, rely on components to call updateRaceSubscription if they are active.
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
        } else if (raceData.race) {
          console.log('WS: Received Race', raceData.race);
          this.raceUpdateSubject.next(raceData.race);
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
}
