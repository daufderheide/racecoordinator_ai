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
  private apiUrl = 'http://localhost:7070/api/hello';
  private protoUrl = 'http://localhost:7070/api/proto-hello';

  constructor(private http: HttpClient) { }

  getData(): Observable<string> {
    // We expect text response "Hello from Java Server"
    return this.http.get(this.apiUrl, { responseType: 'text' });
  }

  getProtoData(name: string): Observable<string> {
    const request = com.antigravity.HelloRequest.create({ name });
    const buffer = com.antigravity.HelloRequest.encode(request).finish();

    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });

    return this.http.post(this.protoUrl, new Blob([buffer as any]), {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(response => {
        const helloResponse = com.antigravity.HelloResponse.decode(new Uint8Array(response as any));
        return helloResponse.greeting;
      })
    );
  }
}
