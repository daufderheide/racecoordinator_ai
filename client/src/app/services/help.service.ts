import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AnalyticsService } from "@app/services/analytics.service";

export interface GuideStep {
  targetId?: string; // ID of the element to highlight. If null/undefined, it's a general modal.
  selector?: string; // CSS selector of the element to highlight.
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center"; // Preferred position relative to target
}

@Injectable({
  providedIn: "root",
})
export class HelpService {
  steps: GuideStep[] = [];
  currentStepIndex = 0;

  private _isVisible = new BehaviorSubject<boolean>(false);
  isVisible$ = this._isVisible.asObservable();

  private _currentStep = new BehaviorSubject<GuideStep | null>(null);
  currentStep$ = this._currentStep.asObservable();

  private _hasNext = new BehaviorSubject<boolean>(false);
  hasNext$ = this._hasNext.asObservable();

  private _hasPrevious = new BehaviorSubject<boolean>(false);
  hasPrevious$ = this._hasPrevious.asObservable();

  constructor(private analyticsService: AnalyticsService) {}

  startGuide(steps: GuideStep[]) {
    if (!steps || steps.length === 0) return;
    this.steps = steps;
    this.currentStepIndex = 0;

    const guideName = steps[0].title || "Unknown Guide";
    this.analyticsService.trackClick("help_started", { guide_name: guideName });

    this.updateState();
    this._isVisible.next(true);
  }

  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.updateState();
    } else {
      this.endGuide();
    }
  }

  previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.updateState();
    }
  }

  endGuide() {
    if (this.steps.length > 0) {
      const guideName = this.steps[0].title || "Unknown Guide";
      if (this.currentStepIndex === this.steps.length - 1) {
        this.analyticsService.trackClick("help_completed", {
          guide_name: guideName,
        });
      } else {
        const stepTitle = this.steps[this.currentStepIndex].title;
        this.analyticsService.trackClick("help_ended_early", {
          guide_name: guideName,
          step_index: this.currentStepIndex,
          step_title: stepTitle,
        });
      }
    }

    this._isVisible.next(false);
    this._currentStep.next(null);
    this.steps = [];
    this.currentStepIndex = 0;
  }

  private updateState() {
    const step = this.steps[this.currentStepIndex];
    this._currentStep.next(step);
    this._hasNext.next(this.currentStepIndex < this.steps.length - 1);
    this._hasPrevious.next(this.currentStepIndex > 0);
  }
}
