import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subscription } from "rxjs";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import {
  DriverProjection,
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
  imports: [CommonModule, TranslatePipe, BrowserNavigationComponent],
})
export class DefaultPredictionResultsComponent implements OnInit, OnDestroy {
  predictionRecord: RacePredictionRecord | null = null;
  evaluationRecord: PredictionEvaluationRecord | null = null;
  isLoading = true;
  isRaceOver = false;
  hoveredDriverProj: DriverProjection | null = null;
  popoverTop = 0;
  popoverLeft = 0;
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
    if (typeof this.raceConnectionService?.connect === "function") {
      this.raceConnectionService.connect();
    }

    if (this.raceConnectionService?.raceState$) {
      this.subscriptions.add(
        this.raceConnectionService.raceState$.subscribe((state) => {
          this.isRaceOver = state === RaceState.RACE_OVER;
          this.loadPredictions();
          if (state === RaceState.RACE_OVER) {
            this.scheduleEvaluationReloads();
          }
        }),
      );
    } else {
      this.loadPredictions();
    }
  }

  ngOnDestroy() {
    if (typeof this.raceConnectionService?.disconnect === "function") {
      this.raceConnectionService.disconnect();
    }
    this.subscriptions.unsubscribe();
    this.retryTimeouts.forEach((t) => clearTimeout(t));
    this.retryTimeouts = [];
  }

  @HostListener("window:pagehide")
  onPageHide() {
    if (typeof this.raceConnectionService?.disconnect === "function") {
      this.raceConnectionService.disconnect();
    }
  }

  private scheduleEvaluationReloads() {
    const delays = [300, 1000, 2000, 4000];
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
      .getPredictionEvaluation(raceId, isDemo)
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

  getImpliedPace(proj: DriverProjection | undefined): string {
    if (
      !proj ||
      !proj.projected_laps ||
      proj.projected_laps <= 0 ||
      !proj.projected_time_seconds ||
      proj.projected_time_seconds <= 0
    ) {
      return "";
    }
    const pace = (proj.projected_time_seconds / proj.projected_laps).toFixed(2);
    return this.translationService.translate("PRED_AT_PACE", { pace });
  }

  formatLaneMedians(proj: DriverProjection | undefined): string {
    if (!proj || !proj.per_lane_medians) {
      return "";
    }
    return Object.entries(proj.per_lane_medians)
      .map(([lane, val]) => `${lane}: ${val}s`)
      .join(", ");
  }

  getLaneMediansKeys(proj: DriverProjection | undefined): string[] {
    if (!proj || !proj.per_lane_medians) {
      return [];
    }
    return Object.keys(proj.per_lane_medians);
  }

  onDriverHover(event: MouseEvent, proj: DriverProjection) {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    this.hoveredDriverProj = proj;

    let top = rect.top - 10;
    let left = rect.left + rect.width + 12;

    const popoverHeight = 300;
    const popoverWidth = 360;

    if (left + popoverWidth > window.innerWidth - 10) {
      left = rect.left - popoverWidth - 12;
    }

    if (top + popoverHeight > window.innerHeight - 10) {
      top = window.innerHeight - popoverHeight - 10;
    }
    if (top < 10) {
      top = 10;
    }

    left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));

    this.popoverTop = top;
    this.popoverLeft = left;
  }

  onDriverLeave() {
    this.hoveredDriverProj = null;
  }
}
