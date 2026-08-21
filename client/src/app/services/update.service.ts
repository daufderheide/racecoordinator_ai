import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface UpdateCheckResult {
  updateAvailable: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseUrl: string;
  isWindows: boolean;
}

export interface UpdateProgress {
  progress: number;
  status: string;
}

export type UpdateChannel = "ALPHA" | "BETA" | "PRODUCTION" | "DISABLED";

export interface UpdateConfig {
  channel: UpdateChannel;
  skippedVersion?: string;
  snoozedVersion?: string;
  snoozedUntil?: number;
}

@Injectable({
  providedIn: "root",
})
export class UpdateService {
  private apiUrl = "http://localhost:7070/api/update";

  constructor(private http: HttpClient) {
    const currentOrigin = window.location.origin;
    if (currentOrigin && !currentOrigin.includes("localhost:4200")) {
      this.apiUrl = `${currentOrigin}/api/update`;
    }
  }

  getUpdateConfig(): Observable<UpdateConfig> {
    return this.http.get<UpdateConfig>(`${this.apiUrl}/config`);
  }

  setUpdateChannel(channel: UpdateChannel): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/channel`,
      { channel },
      { responseType: "text" },
    );
  }

  checkForUpdates(force: boolean = false): Observable<UpdateCheckResult> {
    const url = force
      ? `${this.apiUrl}/check?force=true`
      : `${this.apiUrl}/check`;
    return this.http.get<UpdateCheckResult>(url);
  }

  installUpdate(downloadUrl: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/install`,
      { downloadUrl },
      { responseType: "text" },
    );
  }

  getUpdateProgress(): Observable<UpdateProgress> {
    return this.http.get<UpdateProgress>(`${this.apiUrl}/progress`);
  }

  cancelUpdate(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/cancel`,
      {},
      { responseType: "text" },
    );
  }

  skipUpdate(version: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/skip`,
      { version },
      { responseType: "text" },
    );
  }

  snoozeUpdate(version: string, durationDays: number = 7): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/snooze`,
      { version, durationDays },
      { responseType: "text" },
    );
  }
}
