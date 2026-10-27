import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Reader } from "protobufjs/minimal";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  DeferHeatRequest,
  DeferHeatResponse,
  EndRaceRequest,
  EndRaceResponse,
  IDemoConfig,
  IHeat,
  InitializeRaceRequest,
  InitializeRaceResponse,
  IRaceParticipant,
  IStartRaceResponse,
  ModifyHeatsRequest,
  ModifyHeatsResponse,
  NextHeatRequest,
  NextHeatResponse,
  PauseRaceRequest,
  PauseRaceResponse,
  RegenerateHeatsRequest,
  RegenerateHeatsResponse,
  RestartHeatRequest,
  RestartHeatResponse,
  SkipHeatRequest,
  SkipHeatResponse,
  SkipRaceRequest,
  SkipRaceResponse,
  StartRaceRequest,
  StartRaceResponse,
} from "@app/proto/antigravity";

export class DataRaceControlHelper {
  constructor(
    private http: HttpClient,
    private getBaseUrl: () => string,
  ) {}

  public getDefaultDemoConfig(): IDemoConfig {
    return {
      minLapTimeMs: 3000,
      maxLapTimeMs: 5000,
      minRefuelTimeMs: 5000,
      maxRefuelTimeMs: 10000,
      numSegments: 2,
      minLapsBetweenPits: 3,
      maxLapsBetweenPits: 7,
      minReactionTimeMs: 1,
      maxReactionTimeMs: 500,
      minPitEntryOffsetMs: 500,
      maxPitEntryOffsetMs: 1000,
    };
  }

  generateHeats(raceId: string, driverCount: number): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/${raceId}/generate-heats`,
      {
        driverCount,
      },
    );
  }

  previewHeats(
    trackId: string,
    rotationType: string,
    driverCount: number,
    soloLaneIndex: number = 0,
    customRotationSequence: number[] = [],
    customRotationAssetId: string = "",
    customRotations: any[] = [],
    heatTimesThrough: number = 1,
    reverseHeats: boolean = false,
    groupOptions: any = null,
  ): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/api/heats/preview`, {
      trackId,
      rotationType,
      driverCount,
      soloLaneIndex,
      customRotationSequence,
      customRotationAssetId,
      customRotations,
      heatTimesThrough,
      reverseHeats,
      groupOptions,
    });
  }

  initializeRace(
    raceId: string,
    driverIds: string[],
    isDemoMode: boolean,
    demoConfig?: IDemoConfig,
    eventId?: string,
    seasonId?: string,
    themeId?: string,
  ): Observable<InitializeRaceResponse> {
    const request = InitializeRaceRequest.create({
      raceId,
      driverIds,
      isDemoMode,
      demoConfig,
      eventId,
      seasonId,
      themeId,
    });
    const buffer = InitializeRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/initialize-race`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return InitializeRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  startRace(): Observable<IStartRaceResponse> {
    const request = StartRaceRequest.create({});
    const buffer = StartRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/start-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          return StartRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  endRace(): Observable<boolean> {
    const request = EndRaceRequest.create({});
    const buffer = EndRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/end-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const endResponse = EndRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return endResponse.success ?? false;
        }),
      );
  }

  pauseRace(): Observable<boolean> {
    const request = PauseRaceRequest.create({});
    const buffer = PauseRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/pause-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const pauseResponse = PauseRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return pauseResponse.success;
        }),
      );
  }

  abortTimers(): Observable<boolean> {
    const request = PauseRaceRequest.create({});
    const buffer = PauseRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/abort-timers`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const abortResponse = PauseRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return abortResponse.success ?? false;
        }),
      );
  }

  nextHeat(): Observable<boolean> {
    const request = NextHeatRequest.create({});
    const buffer = NextHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/next-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const nextResponse = NextHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return nextResponse.success ?? false;
        }),
      );
  }

  setMainPower(on: boolean): Observable<any> {
    return this.http.post(
      `${this.getBaseUrl()}/api/track/power/main?on=${on}`,
      {},
      { responseType: "text" },
    );
  }

  setLanePower(lane: number, on: boolean): Observable<any> {
    return this.http.post(
      `${this.getBaseUrl()}/api/track/power/lane/${lane}?on=${on}`,
      {},
      { responseType: "text" },
    );
  }

  restartHeat(): Observable<boolean> {
    const request = RestartHeatRequest.create({});
    const buffer = RestartHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/restart-heat`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const restartResponse = RestartHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return restartResponse.success ?? false;
        }),
      );
  }

  skipHeat(): Observable<boolean> {
    const request = SkipHeatRequest.create({});
    const buffer = SkipHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/skip-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const skipResponse = SkipHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return skipResponse.success ?? false;
        }),
      );
  }

  skipRace(): Observable<boolean> {
    const request = SkipRaceRequest.create({});
    const buffer = SkipRaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/skip-race`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const skipResponse = SkipRaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return skipResponse.success ?? false;
        }),
      );
  }

  deferHeat(): Observable<boolean> {
    const request = DeferHeatRequest.create({});
    const buffer = DeferHeatRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(`${this.getBaseUrl()}/api/defer-heat`, new Blob([buffer as any]), {
        headers,
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          const deferResponse = DeferHeatResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          return deferResponse.success ?? false;
        }),
      );
  }

  modifyHeats(
    heats: IHeat[],
    participants: IRaceParticipant[],
  ): Observable<ModifyHeatsResponse> {
    const request = ModifyHeatsRequest.create({
      heats,
      participants,
    });
    const buffer = ModifyHeatsRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/modify-heats`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return ModifyHeatsResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  regenerateHeats(
    participants: IRaceParticipant[] = [],
  ): Observable<RegenerateHeatsResponse> {
    const request = RegenerateHeatsRequest.create({
      participants,
    });
    const buffer = RegenerateHeatsRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/regenerate-heats`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return RegenerateHeatsResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  finalizeModifyHeats(): Observable<any> {
    return this.http.post(
      `${this.getBaseUrl()}/api/finalize-modify-heats`,
      {},
      { responseType: "text" },
    );
  }

  resetLaneHeatData(lane: number | string): Observable<boolean> {
    return this.http
      .post(
        `${this.getBaseUrl()}/api/races/current-heat/drivers/${lane}/reset`,
        {},
      )
      .pipe(map(() => true));
  }

  changeLane(fromLane: number, toLane: number): Observable<boolean> {
    return this.http
      .post(
        `${this.getBaseUrl()}/api/races/current-heat/drivers/${fromLane}/change-lane/${toLane}`,
        {},
        { responseType: "text" },
      )
      .pipe(map(() => true));
  }

  saveRace(name?: string): Observable<string> {
    const payload = name ? { name, saveName: name } : {};
    return this.http.post(`${this.getBaseUrl()}/api/save-race`, payload, {
      responseType: "text",
    });
  }

  getSavedRaces(
    isDemo: boolean = false,
  ): Observable<{ filename: string; corrupt: boolean }[]> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/saved-races?demo=true`
      : `${this.getBaseUrl()}/api/saved-races`;
    return this.http.get<{ filename: string; corrupt: boolean }[]>(url);
  }

  loadRace(filename: string, isDemo: boolean = false): Observable<string> {
    const payload = {
      filename,
      isDemo,
    };
    return this.http.post(`${this.getBaseUrl()}/api/load-race`, payload, {
      responseType: "text",
    });
  }

  deleteSavedRace(
    filename: string,
    isDemo: boolean = false,
  ): Observable<string> {
    const url = isDemo
      ? `${this.getBaseUrl()}/api/saved-races/${filename}?demo=true`
      : `${this.getBaseUrl()}/api/saved-races/${filename}`;
    return this.http.delete(url, {
      responseType: "text",
    });
  }

  renameSavedRace(
    oldFilename: string,
    newFilename: string,
    isDemo: boolean = false,
  ): Observable<string> {
    const payload = {
      oldFilename,
      newFilename,
      isDemo,
    };
    return this.http.post(
      `${this.getBaseUrl()}/api/rename-saved-race`,
      payload,
      {
        responseType: "text",
      },
    );
  }

  updateUserLaps(
    lane: number,
    userLaps?: number,
    userTime?: number,
  ): Observable<any> {
    const body: Record<string, number> = {};
    if (userLaps !== undefined) {
      body["userLaps"] = userLaps;
    }
    if (userTime !== undefined) {
      body["userTime"] = userTime;
    }
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/current-heat/drivers/${lane}/user-laps`,
      body,
    );
  }

  updateHeatUserLaps(
    heatNumber: number,
    lane: number,
    userLaps?: number,
    userTime?: number,
  ): Observable<any> {
    const body: Record<string, number> = {};
    if (userLaps !== undefined) {
      body["userLaps"] = userLaps;
    }
    if (userTime !== undefined) {
      body["userTime"] = userTime;
    }
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/heats/${heatNumber}/drivers/${lane}/user-laps`,
      body,
    );
  }

  updateBatchUserLaps(
    updates: {
      heatNumber: number;
      laneIndex: number;
      userLaps?: number;
      userTime?: number;
    }[],
  ): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/heats/user-laps/batch`,
      updates,
    );
  }

  updateUserTime(lane: number, userTime: number): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/current-heat/drivers/${lane}/user-time`,
      { userTime },
    );
  }

  updateHeatUserTime(
    heatNumber: number,
    lane: number,
    userTime: number,
  ): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/heats/${heatNumber}/drivers/${lane}/user-time`,
      { userTime },
    );
  }

  updateBatchUserTime(
    updates: { heatNumber: number; laneIndex: number; userTime: number }[],
  ): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/heats/user-time/batch`,
      updates,
    );
  }

  updateLiveLapRecordStatus(
    heatNumber: number,
    lane: number,
    lapIndex: number,
    countTowardsRecords: boolean,
  ): Observable<any> {
    return this.http.post<any>(
      `${this.getBaseUrl()}/api/races/heats/${heatNumber}/drivers/${lane}/laps/${lapIndex}/record-status`,
      { countTowardsRecords },
    );
  }

  changeActualDriver(lane: number, driverId: string): Observable<boolean> {
    return this.http
      .post(
        `${this.getBaseUrl()}/api/races/current-heat/drivers/${lane}/actual-driver`,
        {
          driverId,
        },
      )
      .pipe(map(() => true));
  }

  changeActualDriverForHeat(
    heatNumber: number,
    lane: number,
    driverId: string,
  ): Observable<boolean> {
    return this.http
      .post(
        `${this.getBaseUrl()}/api/races/heats/${heatNumber}/drivers/${lane}/actual-driver`,
        {
          driverId,
        },
      )
      .pipe(map(() => true));
  }
}
