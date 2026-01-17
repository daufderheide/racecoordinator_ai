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
}
