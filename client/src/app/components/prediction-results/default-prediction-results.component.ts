import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subscription } from "rxjs";
import { RaceState } from "@app/proto/antigravity";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import {
  PredictionEvaluationRecord,
  RacePredictionRecord,
  RacePredictionService,
} from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-default-prediction-results",
  templateUrl: "./default-prediction-results.component.html",
  styleUrls: ["./default-prediction-results.component.css"],
  imports: [CommonModule],
})
export class DefaultPredictionResultsComponent implements OnInit, OnDestroy {
  predictionRecord: RacePredictionRecord | null = null;
  evaluationRecord: PredictionEvaluationRecord | null = null;
  isLoading = true;
  private subscriptions: Subscription = new Subscription();
  private retryTimeouts: any[] = [];

  constructor(
    @Inject(RaceConnectionService)
    protected raceConnectionService: RaceConnectionService,
    @Inject(RaceService) protected raceService: RaceService,
    @Inject(TranslationService)
    protected translationService: TranslationService,
    @Inject(RacePredictionService)
    protected predictionService: RacePredictionService,
    @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadPredictions();

    if (this.raceConnectionService?.raceState$) {
      this.subscriptions.add(
        this.raceConnectionService.raceState$.subscribe((state) => {
          this.loadPredictions();
          if (state === RaceState.RACE_OVER) {
            this.scheduleEvaluationReloads();
          }
        }),
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.retryTimeouts.forEach((t) => clearTimeout(t));
    this.retryTimeouts = [];
  }

  private scheduleEvaluationReloads() {
    const delays = [500, 1500, 3000];
    delays.forEach((delay) => {
      const timeout = setTimeout(() => {
        this.loadPredictions();
      }, delay);
      this.retryTimeouts.push(timeout);
    });
  }

  loadPredictions() {
    const race = this.raceService.getRace();
    const raceId = race?.entity_id || "current";
    const isDemo = race?.practice || false;
    this.predictionService
      .getRacePredictions(raceId, isDemo)
      .subscribe((record) => {
        this.predictionRecord = record;
        this.isLoading = false;
        this.cdr.markForCheck();
      });

    this.predictionService
      .getPredictionEvaluation(raceId)
      .subscribe((evalRec) => {
        this.evaluationRecord = evalRec;
        this.cdr.markForCheck();
      });
  }

  getWinProbPercent(prob: number | undefined): string {
    if (prob === undefined || prob === null || prob < 0) {
      return "--%";
    }
    return Math.round(prob * 100) + "%";
  }
}
