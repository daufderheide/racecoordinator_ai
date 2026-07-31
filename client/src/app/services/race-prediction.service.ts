import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, catchError, Observable, of } from "rxjs";
import { DataService } from "@app/data.service";

export interface DriverProjection {
  driver_id: string;
  driver_name: string;
  projected_rank: number;
  projected_laps: number;
  projected_time_seconds: number;
  win_probability: number;
  podium_probability: number;
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

  constructor(
    private http: HttpClient,
    private dataService: DataService,
  ) {}

  updateLivePrediction(snapshot: PredictionSnapshot) {
    this.currentPredictionSubject.next(snapshot);
  }

  getRacePredictions(
    raceId: string,
    isDemo: boolean = false,
  ): Observable<RacePredictionRecord | null> {
    const baseUrl = this.dataService.serverUrl || "";
    const url = `${baseUrl}/api/predictions/races/${raceId}?isDemo=${isDemo}&t=${Date.now()}`;
    return this.http
      .get<RacePredictionRecord>(url)
      .pipe(catchError(() => of(null)));
  }

  getPredictionEvaluation(
    raceId: string,
    isDemo: boolean = false,
  ): Observable<PredictionEvaluationRecord | null> {
    const baseUrl = this.dataService.serverUrl || "";
    const url = `${baseUrl}/api/predictions/evaluations/${raceId}?isDemo=${isDemo}`;
    return this.http
      .get<PredictionEvaluationRecord>(url)
      .pipe(catchError(() => of(null)));
  }
}
