import { HttpClient } from "@angular/common/http";
import { forkJoin, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import {
  DriverImportCommitRequest,
  DriverImportPreview,
  DriverImportResult,
} from "@app/models/driver-import.model";
import { DriverLabel } from "@app/models/driver-label";
import { Event } from "@app/models/event";
import { Season, SeasonStandingItem } from "@app/models/season";
import { ITeamModel } from "@app/proto/antigravity";

export class DataEntityCrudHelper {
  constructor(
    private http: HttpClient,
    private getBaseUrl: () => string,
  ) {}

  private get driverLabelsUrl(): string {
    return `${this.getBaseUrl()}/api/driver-labels`;
  }

  private get driversUrl(): string {
    return `${this.getBaseUrl()}/api/drivers`;
  }

  private get eventsUrl(): string {
    return `${this.getBaseUrl()}/api/events`;
  }

  private get seasonsUrl(): string {
    return `${this.getBaseUrl()}/api/seasons`;
  }

  private get tracksUrl(): string {
    return `${this.getBaseUrl()}/api/tracks`;
  }

  private get racesUrl(): string {
    return `${this.getBaseUrl()}/api/races`;
  }

  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(this.driversUrl);
  }

  getServerVersion(): Observable<string> {
    return this.http.get(`${this.getBaseUrl()}/api/version`, {
      responseType: "text",
    });
  }

  getServerIp(): Observable<string> {
    return this.http.get(`${this.getBaseUrl()}/api/server-ip`, {
      responseType: "text",
    });
  }

  setServerLogLevel(level: string): Observable<any> {
    return this.http.post(
      `${this.getBaseUrl()}/api/settings/log-level?level=${level}`,
      {},
      { responseType: "text" },
    );
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

  getDriverLabels(): Observable<DriverLabel[]> {
    return this.http.get<DriverLabel[]>(this.driverLabelsUrl);
  }

  createDriverLabel(label: Partial<DriverLabel>): Observable<DriverLabel> {
    return this.http.post<DriverLabel>(this.driverLabelsUrl, label);
  }

  updateDriverLabel(label: Partial<DriverLabel>): Observable<DriverLabel>;
  updateDriverLabel(
    id: string,
    label: Partial<DriverLabel>,
  ): Observable<DriverLabel>;
  updateDriverLabel(
    idOrLabel: string | Partial<DriverLabel>,
    label?: Partial<DriverLabel>,
  ): Observable<DriverLabel> {
    const id =
      typeof idOrLabel === "string"
        ? idOrLabel
        : idOrLabel.entity_id || (idOrLabel as any).id || "";
    const body = typeof idOrLabel === "object" ? idOrLabel : label || {};
    return this.http.put<DriverLabel>(`${this.driverLabelsUrl}/${id}`, body);
  }

  deleteDriverLabel(id: string): Observable<any> {
    return this.http.delete<any>(`${this.driverLabelsUrl}/${id}`);
  }

  validateDriverImport(formData: FormData): Observable<DriverImportPreview> {
    return this.http.post<DriverImportPreview>(
      `${this.driversUrl}/import/preview`,
      formData,
    );
  }

  commitDriverImport(
    request: DriverImportCommitRequest,
  ): Observable<DriverImportResult> {
    return this.http.post<DriverImportResult>(
      `${this.driversUrl}/import/commit`,
      request,
    );
  }

  downloadDriverImportTemplate(format: string): Observable<Blob> {
    return this.http.get(
      `${this.driversUrl}/import/template?format=${format}`,
      {
        responseType: "blob",
      },
    );
  }

  exportDrivers(format: string, driverIds?: string[]): Observable<Blob> {
    let url = `${this.driversUrl}/export?format=${encodeURIComponent(format)}`;
    if (driverIds && driverIds.length > 0) {
      url += `&driverIds=${encodeURIComponent(driverIds.join(","))}`;
    }
    return this.http.get(url, {
      responseType: "blob",
    });
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

  getTracks(): Observable<any[]> {
    return this.http.get<any[]>(this.tracksUrl);
  }

  getTrackFactorySettings(): Observable<any> {
    return this.http.get<any>(`${this.tracksUrl}/factory-settings`);
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

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.eventsUrl);
  }

  getEvent(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.eventsUrl}/${id}`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.eventsUrl, event);
  }

  updateEvent(id: string, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.eventsUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete<any>(`${this.eventsUrl}/${id}`);
  }

  getSeasons(): Observable<Season[]> {
    return this.http.get<Season[]>(this.seasonsUrl);
  }

  getSeason(id: string): Observable<Season> {
    return this.http.get<Season>(`${this.seasonsUrl}/${id}`);
  }

  createSeason(season: Season): Observable<Season> {
    return this.http.post<Season>(this.seasonsUrl, season);
  }

  updateSeason(id: string, season: Season): Observable<Season> {
    return this.http.put<Season>(`${this.seasonsUrl}/${id}`, season);
  }

  deleteSeason(id: string): Observable<any> {
    return this.http.delete<any>(`${this.seasonsUrl}/${id}`);
  }

  getSeasonStandings(id: string): Observable<SeasonStandingItem[]> {
    return this.http.get<SeasonStandingItem[]>(
      `${this.seasonsUrl}/${id}/standings`,
    );
  }

  getRaceHistory(isDemo?: boolean): Observable<any[]> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/history/races?demo=true`
      : `${this.getBaseUrl()}/api/history/races`;
    return this.http.get<any[]>(url).pipe(
      map((items) =>
        (items || []).map((item) => ({
          ...item,
          is_demo:
            isDemo !== undefined
              ? isDemo
              : Boolean(item.is_demo || item.isDemo || item.demo),
        })),
      ),
    );
  }

  getRaceHistoryById(id: string, isDemo?: boolean): Observable<any> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/history/races/${id}?demo=true`
      : `${this.getBaseUrl()}/api/history/races/${id}`;
    return this.http.get<any>(url);
  }

  getAllFinishedRaceHistory(): Observable<any[]> {
    return forkJoin([
      this.getRaceHistory(false).pipe(catchError(() => of([]))),
      this.getRaceHistory(true).pipe(catchError(() => of([]))),
    ]).pipe(map(([prod, demo]) => [...(prod || []), ...(demo || [])]));
  }

  getTeams(): Observable<ITeamModel[]> {
    return this.http.get<ITeamModel[]>(`${this.getBaseUrl()}/api/teams`);
  }

  createTeam(team: any): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/teams`, team);
  }

  updateTeam(id: string, team: any): Observable<any> {
    return this.http.put<any>(`${this.getBaseUrl()}/api/teams/${id}`, team);
  }

  deleteTeam(id: string): Observable<any> {
    return this.http.delete<any>(`${this.getBaseUrl()}/api/teams/${id}`);
  }

  getCustomUIs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBaseUrl()}/api/custom-ui`);
  }

  getCustomUI(id: string): Observable<any> {
    return this.http.get<any>(`${this.getBaseUrl()}/api/custom-ui/${id}`);
  }

  createCustomUI(ui: any): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/custom-ui`, ui);
  }

  updateCustomUI(id: string, ui: any): Observable<any> {
    return this.http.put<any>(`${this.getBaseUrl()}/api/custom-ui/${id}`, ui);
  }

  deleteCustomUI(id: string): Observable<any> {
    return this.http.delete<any>(`${this.getBaseUrl()}/api/custom-ui/${id}`);
  }

  duplicateCustomUI(id: string, name?: string): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/custom-ui/${id}/duplicate`,
      {
        name,
      },
    );
  }

  getThemes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBaseUrl()}/api/themes`);
  }

  getDefaultTheme(): Observable<any> {
    return this.http.get<any>(`${this.getBaseUrl()}/api/themes/default`);
  }

  getThemeFactorySettings(): Observable<any> {
    return this.http.get<any>(
      `${this.getBaseUrl()}/api/themes/factory-settings`,
    );
  }

  getTheme(id: string): Observable<any> {
    return this.http.get<any>(`${this.getBaseUrl()}/api/themes/${id}`);
  }

  createTheme(theme: any): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/themes`, theme);
  }

  updateTheme(id: string, theme: any): Observable<any> {
    return this.http.put<any>(`${this.getBaseUrl()}/api/themes/${id}`, theme);
  }

  deleteTheme(id: string): Observable<any> {
    return this.http.delete<any>(`${this.getBaseUrl()}/api/themes/${id}`);
  }

  duplicateTheme(id: string, name?: string): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/themes/${id}/duplicate`,
      {
        name,
      },
    );
  }
}
