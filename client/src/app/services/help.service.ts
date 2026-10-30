import { inject, Injectable, OnDestroy } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { BehaviorSubject, Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { AnalyticsService } from "@app/analytics.service";

export interface GuideStep {
  targetId?: string; // ID of the element to highlight. If null/undefined, it's a general modal.
  selector?: string; // CSS selector of the element to highlight.
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center"; // Preferred position relative to target
  onEnter?: () => void;
  onLeave?: () => void;
}

@Injectable({
  providedIn: "root",
})
export class HelpService implements OnDestroy {
  steps: GuideStep[] = [];
  currentStepIndex = 0;
  private guideStartUrl: string | null = null;

  private _isVisible = new BehaviorSubject<boolean>(false);
  isVisible$ = this._isVisible.asObservable();

  get isVisible(): boolean {
    return this._isVisible.value;
  }

  private _currentStep = new BehaviorSubject<GuideStep | null>(null);
  currentStep$ = this._currentStep.asObservable();

  private _hasNext = new BehaviorSubject<boolean>(false);
  hasNext$ = this._hasNext.asObservable();

  private _hasPrevious = new BehaviorSubject<boolean>(false);
  hasPrevious$ = this._hasPrevious.asObservable();

  private router = inject(Router, { optional: true });
  private routerSubscription?: Subscription;
  private readonly boundPopStateListener: () => void;

  constructor(private analyticsService: AnalyticsService) {
    this.boundPopStateListener = () => {
      if (this.isVisible && this.guideStartUrl) {
        const currentBaseUrl = this.getCurrentBaseUrl();
        if (currentBaseUrl !== this.guideStartUrl) {
          this.endGuide();
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", this.boundPopStateListener);
    }

    if (this.router?.events) {
      this.routerSubscription = this.router.events
        .pipe(
          filter(
            (event) =>
              event instanceof NavigationStart ||
              event instanceof NavigationEnd,
          ),
        )
        .subscribe((event: any) => {
          if (!this.isVisible || !this.guideStartUrl) {
            return;
          }
          const targetUrl =
            event instanceof NavigationStart
              ? event.url
              : event.urlAfterRedirects || event.url;
          const targetBaseUrl = this.getBaseUrl(targetUrl);
          if (targetBaseUrl !== this.guideStartUrl) {
            this.endGuide();
          }
        });
    }
  }

  ngOnDestroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", this.boundPopStateListener);
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  startGuide(steps: GuideStep[]) {
    if (!steps || steps.length === 0) return;
    this.steps = steps;
    this.currentStepIndex = 0;
    this.guideStartUrl = this.getCurrentBaseUrl();

    const guideName = steps[0].title || "Unknown Guide";
    this.analyticsService.trackClick("help_started", { guide_name: guideName });

    this.updateState();
    this._isVisible.next(true);
  }

  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      const current = this.steps[this.currentStepIndex];
      if (current?.onLeave) current.onLeave();
      this.currentStepIndex++;
      this.updateState();
    } else {
      this.endGuide();
    }
  }

  previousStep() {
    if (this.currentStepIndex > 0) {
      const current = this.steps[this.currentStepIndex];
      if (current?.onLeave) current.onLeave();
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
    this.guideStartUrl = null;
  }

  private getCurrentBaseUrl(): string {
    const rawUrl =
      this.router?.url ||
      (typeof window !== "undefined"
        ? (window.location?.pathname || "") + (window.location?.search || "")
        : "");
    return this.getBaseUrl(rawUrl);
  }

  private getBaseUrl(url?: string): string {
    if (!url) return "";
    const path = url.split("?")[0].split("#")[0];
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  }

  private updateState() {
    const step = this.steps[this.currentStepIndex];
    if (step?.onEnter) step.onEnter();
    this._currentStep.next(step);
    this._hasNext.next(this.currentStepIndex < this.steps.length - 1);
    this._hasPrevious.next(this.currentStepIndex > 0);
  }
}
