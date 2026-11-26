import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { StepResults } from "@app/models/step-results.model";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-step-badge",
  templateUrl: "./raceday-step-badge.component.html",
  styleUrls: ["./raceday-step-badge.component.css"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayStepBadgeComponent {
  widget = input<AbsoluteWidgetNode>();
  parentComponent = input<any>();
  stepResults = input<StepResults | null>(null);

  effectiveResults = computed(() => {
    const direct = this.stepResults();
    if (direct) return direct;
    const parentResults = this.parentComponent()?.currentStepResults;
    if (parentResults) return parentResults;
    // Fallback for editor mode or unpopulated state
    return {
      step: 1,
      group: 1,
      nextStep: 2,
      stepUpCount: 2,
      standings: [],
    };
  });

  stepNumber = computed(() => this.effectiveResults()?.step ?? 1);

  nextStepNumber = computed(
    () =>
      this.effectiveResults()?.nextStep ??
      this.effectiveResults()?.next_step ??
      this.stepNumber() + 1,
  );

  showAdvance = computed(() => {
    const s = this.widget()?.customSettings;
    if (s?.["showAdvanceText"] === false) return false;
    return this.nextStepNumber() > this.stepNumber();
  });

  badgeFontSize = computed(() => {
    const w = this.widget();
    return w?.customSettings?.["fontSize"] || w?.fontSize || 18;
  });

  badgeTextColor = computed(() => {
    const w = this.widget();
    return w?.customSettings?.["textColor"] || w?.textColor || "#38bdf8";
  });

  badgeBgColor = computed(() => {
    const w = this.widget();
    return (
      w?.customSettings?.["backgroundColor"] ||
      w?.backgroundColor ||
      "rgba(56, 189, 248, 0.15)"
    );
  });
}
