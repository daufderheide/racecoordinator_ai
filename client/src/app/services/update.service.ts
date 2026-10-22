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
  isLinux?: boolean;
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

export function isAlphaVersion(version?: string | null): boolean {
  if (!version) {
    return false;
  }
  const lower = version.toLowerCase();
  return lower.includes("alpha") || lower.includes("dev");
}

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function parseVersion(versionStr?: string | null): ParsedVersion | null {
  if (!versionStr) {
    return null;
  }
  const clean = versionStr.trim().replace(/^[vV]/, "");
  const match = clean.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-_](.+))?$/);
  if (!match) {
    return null;
  }
  return {
    major: parseInt(match[1], 10),
    minor: match[2] ? parseInt(match[2], 10) : 0,
    patch: match[3] ? parseInt(match[3], 10) : 0,
    prerelease: match[4] || undefined,
  };
}

export function comparePrereleases(pre1: string, pre2: string): number {
  const parts1 = pre1.split(".");
  const parts2 = pre2.split(".");
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const p1 = parts1[i];
    const p2 = parts2[i];
    if (p1 === undefined) {
      return -1;
    }
    if (p2 === undefined) {
      return 1;
    }
    if (p1 === p2) {
      continue;
    }

    const num1 = /^\d+$/.test(p1) ? parseInt(p1, 10) : NaN;
    const num2 = /^\d+$/.test(p2) ? parseInt(p2, 10) : NaN;

    if (!isNaN(num1) && !isNaN(num2)) {
      return num1 - num2;
    }
    if (!isNaN(num1) && isNaN(num2)) {
      return -1;
    }
    if (isNaN(num1) && !isNaN(num2)) {
      return 1;
    }
    return p1.localeCompare(p2);
  }
  return 0;
}

export function compareVersions(
  v1Str?: string | null,
  v2Str?: string | null,
): number {
  if (!v1Str && !v2Str) {
    return 0;
  }
  if (!v1Str) {
    return -1;
  }
  if (!v2Str) {
    return 1;
  }

  const norm1 = v1Str.trim().replace(/^[vV]/, "");
  const norm2 = v2Str.trim().replace(/^[vV]/, "");
  if (norm1 === norm2) {
    return 0;
  }

  const v1 = parseVersion(v1Str);
  const v2 = parseVersion(v2Str);

  if (!v1 && !v2) {
    return norm1.localeCompare(norm2);
  }
  if (!v1) {
    return -1;
  }
  if (!v2) {
    return 1;
  }

  if (v1.major !== v2.major) {
    return v1.major - v2.major;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor - v2.minor;
  }
  if (v1.patch !== v2.patch) {
    return v1.patch - v2.patch;
  }

  if (!v1.prerelease && v2.prerelease) {
    return 1;
  }
  if (v1.prerelease && !v2.prerelease) {
    return -1;
  }
  if (v1.prerelease && v2.prerelease) {
    return comparePrereleases(v1.prerelease, v2.prerelease);
  }

  return 0;
}

export function isDowngrade(
  currentVersion?: string | null,
  targetVersion?: string | null,
): boolean {
  if (!currentVersion || !targetVersion) {
    return false;
  }
  return compareVersions(currentVersion, targetVersion) > 0;
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
