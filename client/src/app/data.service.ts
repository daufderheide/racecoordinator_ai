import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { com } from './proto/message';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Pointing to the Java server API

  private driversUrl = 'http://localhost:7070/api/drivers';
  private tracksUrl = 'http://localhost:7070/api/tracks';
  private racesUrl = 'http://localhost:7070/api/races';

  constructor(private http: HttpClient) { }



  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(this.driversUrl);
  }

  getRaces(): Observable<any[]> {
    return this.http.get<any[]>(this.racesUrl);
  }

  getTracks(): Observable<any[]> {
    return this.http.get<any[]>(this.tracksUrl);
  }



  initializeRace(raceId: string, driverIds: string[], isDemoMode: boolean): Observable<boolean> {
    const request = com.antigravity.InitializeRaceRequest.create({ raceId, driverIds, isDemoMode });
    const buffer = com.antigravity.InitializeRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post('http://localhost:7070/api/initialize-race', new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const initResponse = com.antigravity.InitializeRaceResponse.decode(new Uint8Array(response as any));
        return initResponse.success;
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

    return this.http.post('http://localhost:7070/api/start-race', new Blob([buffer as any]), {
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

    return this.http.post('http://localhost:7070/api/pause-race', new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const pauseResponse = com.antigravity.PauseRaceResponse.decode(new Uint8Array(response as any));
        return pauseResponse.success;
      })
    );
  }

  private raceDataSocket?: WebSocket;
  private raceTimeSubject = new BehaviorSubject<number>(0);
  private lapSubject = new Subject<com.antigravity.ILap>();

  public connectToRaceDataSocket() {
    if (this.raceDataSocket) {
      this.raceDataSocket.close();
    }
    this.raceDataSocket = new WebSocket('ws://localhost:7070/api/race-data');
    this.raceDataSocket.binaryType = 'arraybuffer';
    this.raceDataSocket.onopen = () => {
      console.log('Connected to Race Data WebSocket');
    };
    this.raceDataSocket.onmessage = (event) => {
      // console.log('WS: Message received', event.data);
      try {
        const arrayBuffer = event.data as ArrayBuffer;
        // console.log('WS: ArrayBuffer byteLength', arrayBuffer.byteLength);
        const raceData = com.antigravity.RaceData.decode(new Uint8Array(arrayBuffer));

        if (raceData.raceTime) {
          this.raceTimeSubject.next(raceData.raceTime.time!);
        } else if (raceData.lap) {
          this.lapSubject.next(raceData.lap);
        }
      } catch (e) {
        console.error('Error parsing race data message', e);
      }
    };
    this.raceDataSocket.onclose = () => {
      console.log('Race Data WebSocket closed');
    };
  }

  public getRaceTime(): Observable<number> {
    return this.raceTimeSubject.asObservable();
  }

  public getLaps(): Observable<com.antigravity.ILap> {
    return this.lapSubject.asObservable();
  }
}
