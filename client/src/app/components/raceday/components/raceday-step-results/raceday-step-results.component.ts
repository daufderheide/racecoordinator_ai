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
  selector: "app-raceday-step-results",
  templateUrl: "./raceday-step-results.component.html",
  styleUrls: ["./raceday-step-results.component.css"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayStepResultsComponent {
  widget = input<AbsoluteWidgetNode | null>(null);
  stepResults = input<StepResults | null>(null);
  parentComponent = input<any>(null);

  isUIEditorMode = computed(() => {
    const parent = this.parentComponent();
    return !!(
      parent?.isUIEditorMode?.() ||
      parent?.isLayoutCustomizing ||
      parent?.isEditor
    );
  });

  effectiveStepResults = computed<StepResults | null>(() => {
    const live = this.stepResults();
    if (live && live.standings && live.standings.length > 0) {
      return live;
    }
    if (this.isUIEditorMode()) {
      return {
        step: 1,
        group: 1,
        nextStep: 2,
        stepUpCount: 2,
        standings: [
          {
            rank: 1,
            driverId: "d1",
            driverName: "Mario Andretti",
            totalLaps: 50,
            totalTime: 124.521,
            totalPoints: 25,
            bestLapTime: 2.341,
            steppingUp: true,
            stepUpIndex: 0,
          },
          {
            rank: 2,
            driverId: "d2",
            driverName: "Ayrton Senna",
            totalLaps: 49,
            totalTime: 125.102,
            totalPoints: 18,
            bestLapTime: 2.355,
            steppingUp: true,
            stepUpIndex: 1,
          },
          {
            rank: 3,
            driverId: "d3",
            driverName: "Lewis Hamilton",
            totalLaps: 47,
            totalTime: 126.89,
            totalPoints: 15,
            bestLapTime: 2.412,
            steppingUp: false,
            stepUpIndex: -1,
          },
          {
            rank: 4,
            driverId: "d4",
            driverName: "Max Verstappen",
            totalLaps: 46,
            totalTime: 127.304,
            totalPoints: 12,
            bestLapTime: 2.45,
            steppingUp: false,
            stepUpIndex: -1,
          },
        ],
      };
    }
    return live;
  });

  showTotalTime = computed(() => {
    return this.widget()?.customSettings?.["showTotalTime"] ?? true;
  });

  showBestLap = computed(() => {
    return this.widget()?.customSettings?.["showBestLap"] ?? true;
  });

  showPoints = computed(() => {
    return this.widget()?.customSettings?.["showPoints"] ?? false;
  });

  effectiveBackgroundColor = computed(() => {
    return (
      this.widget()?.customSettings?.["backgroundColor"] ||
      this.widget()?.backgroundColor ||
      null
    );
  });

  trackByDriver(index: number, item: any): string {
    return item.driverId || String(index);
  }
}
