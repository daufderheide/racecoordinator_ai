import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export class DataHistoryStatsHelper {
  constructor(
    private http: HttpClient,
    private getBaseUrl: () => string,
  ) {}

  loadRaceHistory(id: string, isDemo?: boolean): Observable<any> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/history/races/${id}/load?demo=true`
      : `${this.getBaseUrl()}/api/history/races/${id}/load`;
    return this.http.post(url, {}, { responseType: "text" });
  }

  exportRaceHistoryToCsv(id: string, isDemo?: boolean): Observable<string> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/history/races/${id}/export?demo=true`
      : `${this.getBaseUrl()}/api/history/races/${id}/export`;
    return this.http.get(url, {
      responseType: "text",
    });
  }

  updateHistoryLapSections(
    id: string,
    updates: any[],
    isDemo?: boolean,
  ): Observable<any> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/history/races/${id}/lap-sections?demo=true`
      : `${this.getBaseUrl()}/api/history/races/${id}/lap-sections`;
    return this.http.post(url, updates, { responseType: "text" });
  }

  exportRaceToCsv(): Observable<string> {
    return this.http.get(`${this.getBaseUrl()}/api/races/current/export-csv`, {
      responseType: "text",
    });
  }

  exportRaceToXls(base64Template?: string): Observable<Blob> {
    const body = base64Template ? { templateBase64: base64Template } : {};
    return this.http.post(
      `${this.getBaseUrl()}/api/races/current/export-xls`,
      body,
      {
        responseType: "blob",
      },
    );
  }

  downloadDefaultExportTemplate(): Observable<Blob> {
    return this.http.get(
      `${this.getBaseUrl()}/api/races/export-template/default`,
      {
        responseType: "blob",
      },
    );
  }

  testExportXls(base64Template?: string): Observable<Blob> {
    const body = base64Template ? { templateBase64: base64Template } : {};
    return this.http.post(
      `${this.getBaseUrl()}/api/races/test-export-xls`,
      body,
      {
        responseType: "blob",
      },
    );
  }

  getDatabases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBaseUrl()}/api/databases`);
  }

  getCurrentDatabase(): Observable<any> {
    return this.http.get<any>(
      `${this.getBaseUrl()}/api/databases/current?t=${new Date().getTime()}`,
    );
  }

  createDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/databases/create`, {
      name,
    });
  }

  switchDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/databases/switch`, {
      name,
    });
  }

  copyDatabase(name: string, source?: string): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/databases/copy`, {
      name,
      source,
    });
  }

  resetDatabase(name?: string): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/databases/reset`, {
      name,
    });
  }

  deleteDatabase(name: string): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/databases/delete`, {
      name,
    });
  }

  exportDatabase(name: string): void {
    window.location.href = `${this.getBaseUrl()}/api/databases/${encodeURIComponent(name)}/export`;
  }

  exportDatabaseBlob(name: string): Observable<Blob> {
    return this.http.get(
      `${this.getBaseUrl()}/api/databases/${encodeURIComponent(name)}/export`,
      { responseType: "blob" },
    );
  }

  importDatabase(name: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/databases/import`,
      formData,
    );
  }

  toggleServerAnalytics(enabled: boolean): Observable<string> {
    return this.http.post(
      `${this.getBaseUrl()}/api/analytics/toggle`,
      { enabled },
      { responseType: "text" },
    );
  }

  getServerAnalyticsConfig(): Observable<{
    clientId: string;
    measurementId: string;
  }> {
    return this.http.get<{ clientId: string; measurementId: string }>(
      `${this.getBaseUrl()}/api/analytics/config`,
    );
  }

  updateHistoryLapRecordStatus(
    raceHistoryId: string,
    heatNumber: number,
    lane: number,
    lapIndex: number,
    countTowardsRecords: boolean,
    isDemo?: boolean,
  ): Observable<any> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/history/races/${raceHistoryId}/heats/${heatNumber}/drivers/${lane}/laps/${lapIndex}/record-status?demo=true`
      : `${this.getBaseUrl()}/api/history/races/${raceHistoryId}/heats/${heatNumber}/drivers/${lane}/laps/${lapIndex}/record-status`;
    return this.http.put<any>(url, { countTowardsRecords, isDemo: !!isDemo });
  }

  getDriverStatistics(
    driverId: string,
    raceId?: string,
    isDemo?: boolean,
  ): Observable<any> {
    let url = `${this.getBaseUrl()}/api/history/drivers/${driverId}/stats`;
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
    let url = `${this.getBaseUrl()}/api/history/stats`;
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

  resetRaceRecords(raceId: string): Observable<void> {
    return this.http.post<void>(
      `${this.getBaseUrl()}/api/races/${raceId}/reset-records`,
      {},
    );
  }
}
