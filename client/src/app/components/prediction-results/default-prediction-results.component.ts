import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnInit } from "@angular/core";
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
export class DefaultPredictionResultsComponent implements OnInit {
  predictionRecord: RacePredictionRecord | null = null;
  evaluationRecord: PredictionEvaluationRecord | null = null;
  isLoading = true;

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
  }

  loadPredictions() {
    const raceId = this.raceService.getRace()?.entity_id || "current";
    this.predictionService.getRacePredictions(raceId).subscribe((record) => {
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
    if (prob === undefined || prob === null) {
      return "0%";
    }
    return Math.round(prob * 100) + "%";
  }
}
