import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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



  initializeRace(raceId: string, driverIds: string[]): Observable<boolean> {
    const request = com.antigravity.InitializeRaceRequest.create({ raceId, driverIds });
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

  private raceDataSocket?: WebSocket;
  private raceTimeSubject = new BehaviorSubject<number>(0);

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
      console.log('WS: Message received', event.data);
      try {
        const arrayBuffer = event.data as ArrayBuffer;
        console.log('WS: ArrayBuffer byteLength', arrayBuffer.byteLength);
        const raceTime = com.antigravity.RaceTime.decode(new Uint8Array(arrayBuffer));
        console.log('WS: Decoded RaceTime', raceTime);
        this.raceTimeSubject.next(raceTime.time);
      } catch (e) {
        console.error('Error parsing race time message', e);
      }
    };
    this.raceDataSocket.onclose = () => {
      console.log('Race Data WebSocket closed');
    };
  }

  public getRaceTime(): Observable<number> {
    return this.raceTimeSubject.asObservable();
  }
}

import { BehaviorSubject } from 'rxjs';
