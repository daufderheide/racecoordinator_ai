import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  finalize,
  Observable,
  of,
  shareReplay,
} from "rxjs";
import { DataService } from "@app/data.service";

export interface DriverProjection {
  driver_id: string;
  driver_name: string;
  projected_rank: number;
  projected_laps: number;
  projected_time_seconds: number;
  win_probability: number;
  podium_probability: number;
  prior_median_lap_time?: number;
  prior_std_dev?: number;
  historical_laps?: number;
  per_lane_medians?: { [laneName: string]: number };
  empirical_laps?: number;
  empirical_median_lap_time?: number;
  simulated_wins?: number;
  total_simulations?: number;
}

export interface HeatForecast {
  heat_number: number;
  predicted_winner_id: string;
  driver_projected_laps: { [driverId: string]: number };
}

export interface PredictionSnapshot {
  heat_index: number;
  completed_laps: number;
  win_probabilities: { [driverId: string]: number };
  podium_probabilities: { [driverId: string]: number };
  projected_standings: DriverProjection[];
  heat_forecasts: HeatForecast[];
}

export interface RacePredictionRecord {
  _id?: string;
  race_id: string;
  timestamp: number;
  pre_race: PredictionSnapshot;
  realtime_snapshots: PredictionSnapshot[];
}

export interface DriverEvaluation {
  driver_id: string;
  driver_name: string;
  pre_race_win_prob: number;
  projected_rank: number;
  actual_rank: number;
  projected_laps: number;
  actual_laps: number;
}

export interface PredictionEvaluationRecord {
  _id?: string;
  race_id: string;
  evaluated_at: number;
  brier_score: number;
  rank_mae: number;
  lap_projection_mae: number;
  driver_evaluations: DriverEvaluation[];
}

@Injectable({
  providedIn: "root",
})
export class RacePredictionService {
  private currentPredictionSubject =
    new BehaviorSubject<PredictionSnapshot | null>(null);
  currentPrediction$ = this.currentPredictionSubject.asObservable();

  private inFlightPredictions = new Map<
    string,
    Observable<RacePredictionRecord | null>
  >();
  private inFlightEvaluations = new Map<
    string,
    Observable<PredictionEvaluationRecord | null>
  >();

  constructor(
    private http: HttpClient,
    private dataService: DataService,
  ) {}

  updateLivePrediction(snapshot: PredictionSnapshot) {
    this.currentPredictionSubject.next(snapshot);
  }

  getRacePredictions(
    raceId: string,
    isDemo: boolean,
  ): Observable<RacePredictionRecord | null> {
    const key = `${raceId}:${isDemo}`;
    const inFlight = this.inFlightPredictions.get(key);
    if (inFlight) {
      return inFlight;
    }

    const baseUrl = this.dataService.serverUrl || "";
    const url = `${baseUrl}/api/predictions/races/${raceId}?isDemo=${isDemo}&t=${Date.now()}`;
    const req$ = this.http.get<RacePredictionRecord>(url).pipe(
      catchError(() => of(null)),
      shareReplay(1),
      finalize(() => {
        this.inFlightPredictions.delete(key);
      }),
    );

    this.inFlightPredictions.set(key, req$);
    return req$;
  }

  getPredictionEvaluation(
    raceId: string,
    isDemo: boolean,
  ): Observable<PredictionEvaluationRecord | null> {
    const key = `${raceId}:${isDemo}`;
    const inFlight = this.inFlightEvaluations.get(key);
    if (inFlight) {
      return inFlight;
    }

    const baseUrl = this.dataService.serverUrl || "";
    const url = `${baseUrl}/api/predictions/evaluations/${raceId}?isDemo=${isDemo}&t=${Date.now()}`;
    const req$ = this.http.get<PredictionEvaluationRecord>(url).pipe(
      catchError(() => of(null)),
      shareReplay(1),
      finalize(() => {
        this.inFlightEvaluations.delete(key);
      }),
    );

    this.inFlightEvaluations.set(key, req$);
    return req$;
  }
}
