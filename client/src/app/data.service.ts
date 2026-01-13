import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Pointing to the Java server API
  private apiUrl = 'http://localhost:7070/api/hello';

  constructor(private http: HttpClient) { }

  getData(): Observable<string> {
    // We expect text response "Hello from Java Server"
    return this.http.get(this.apiUrl, { responseType: 'text' });
  }
}
