import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { RacedayAbsoluteWidgetComponent } from "@app/components/raceday/components/raceday-absolute-widget/raceday-absolute-widget.component";
import { LayoutConfig, Settings } from "@app/models/settings";
import { StepResults } from "@app/models/step-results.model";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CustomUiService } from "@app/services/custom-ui.service";
import { ThemeService } from "@app/services/theme.service";

@Component({
  standalone: true,
  selector: "app-raceday-step-results-dialog",
  templateUrl: "./raceday-step-results-dialog.component.html",
  styleUrls: ["./raceday-step-results-dialog.component.css"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, RacedayAbsoluteWidgetComponent],
})
export class RacedayStepResultsDialogComponent {
  visible = input<boolean>(false);
  stepResults = input<StepResults | null>(null);
  parentComponent = input<any>(null);
  customLayout = input<LayoutConfig | null>(null);

  close = output<void>();

  private themeService = inject(ThemeService, { optional: true });
  private customUiService = inject(CustomUiService, { optional: true });

  resolvedLayout = computed<LayoutConfig>(() => {
    const override = this.customLayout();
    if (override && override.widgets) {
      return override;
    }

    const theme = this.themeService?.getActiveTheme?.();
    const uiId = theme?.step_results_ui_id || "step_results_ui_layout_rc_ai";
    const customUi = this.customUiService?.getCustomUI?.(uiId);
    if (customUi?.layoutJson) {
      try {
        const parsed = JSON.parse(customUi.layoutJson);
        if (parsed && Array.isArray(parsed.widgets)) {
          return parsed;
        }
      } catch {
        // Fallback to default
      }
    }
    return Settings.DEFAULT_STEP_RESULTS_LAYOUT;
  });

  dialogParentComponent = computed(() => {
    const parent = this.parentComponent();
    const layout = this.resolvedLayout();
    const results = this.stepResults() || parent?.currentStepResults;
    const stepDrivers = this.buildStepDrivers(results);
    const rankings = new Map<string, number>();
    stepDrivers.forEach((d: any, idx: number) => {
      rankings.set(d.objectId, idx + 1);
    });

    return {
      ...parent,
      layout,
      currentStepResults: results,
      drivers: stepDrivers.length > 0 ? stepDrivers : parent?.drivers || [],
      participants: stepDrivers.map((d: any) => d.participant).filter(Boolean),
      driverRankings: rankings,
      heat: {
        ...(parent?.heat || {}),
        standings: stepDrivers.map((d: any) => d.objectId),
        drivers: stepDrivers,
      },
      formatValue: (
        colKey: string,
        val: any,
        hd: any,
        colDef: any,
        anchor: string,
        settings: any,
      ) => {
        if (colKey === "stepStatus") {
          const isUp = Boolean(
            hd?.isSteppingUp ||
            hd?.steppingUp ||
            hd?.participant?.isSteppingUp ||
            hd?.participant?.steppingUp,
          );
          return isUp
            ? parent?.translationService?.translate?.("RD_STEPPING_UP") ||
                "RD_STEPPING_UP"
            : parent?.translationService?.translate?.("RD_ELIMINATED") ||
                "RD_ELIMINATED";
        }
        if (parent?.formatValue) {
          return parent.formatValue(colKey, val, hd, colDef, anchor, settings);
        }
        return String(val ?? "--");
      },
      onFileMenuSelect: (action: string) => {
        if (action === "CLOSE") {
          this.onClose();
        } else if (parent && typeof parent.onFileMenuSelect === "function") {
          parent.onFileMenuSelect(action);
        }
      },
      closeStepResultsDialog: () => {
        this.onClose();
      },
    };
  });

  private buildStepDrivers(results: StepResults | null): any[] {
    const standings = results?.standings || [];
    if (standings.length > 0) {
      return standings.map((row, idx) => {
        const id = row.driverId || `step-driver-${row.rank || idx + 1}`;
        const name =
          row.driverName || row.driver_name || `Driver ${row.rank || idx + 1}`;
        const laps = row.totalLaps ?? row.total_laps ?? 0;
        const totalTime = row.totalTime ?? row.total_time ?? 0;
        const bestLap = row.bestLapTime ?? row.best_lap_time ?? 0;
        const points = row.totalPoints ?? row.total_points ?? 0;
        const steppingUp = Boolean(row.steppingUp || row.is_stepping_up);
        const stepUpIndex = row.stepUpIndex ?? row.step_up_index ?? 0;
        const rank = row.rank || idx + 1;

        const driverObj: any = {
          entity_id: id,
          objectId: id,
          name,
          nickname: name,
        };

        const participantObj: any = {
          objectId: id,
          rank,
          totalLaps: laps,
          totalTime,
          bestLapTime: bestLap,
          totalPoints: points,
          isSteppingUp: steppingUp,
          steppingUp,
          stepUpIndex,
          driver: driverObj,
        };

        return {
          objectId: id,
          laneIndex: idx,
          driver: driverObj,
          actualDriver: driverObj,
          participant: participantObj,
          totalLaps: laps,
          lapCount: laps,
          physicalLapCount: Math.floor(laps),
          totalTime,
          bestLapTime: bestLap,
          totalPoints: points,
          points,
          rankHeat: rank,
          rankOverall: rank,
          position: rank,
          isSteppingUp: steppingUp,
          steppingUp,
          stepUpIndex,
        };
      });
    }

    return [1, 2, 3, 4].map((rank, idx) => {
      const id = `mock-step-driver-${rank}`;
      const name = `Driver ${rank}`;
      const steppingUp = rank <= 2;
      const driverObj: any = {
        entity_id: id,
        objectId: id,
        name,
        nickname: name,
      };
      const participantObj: any = {
        objectId: id,
        rank,
        totalLaps: 10 - idx,
        totalTime: 30.0 + idx * 2.5,
        bestLapTime: 3.1 + idx * 0.15,
        totalPoints: (4 - idx) * 2,
        isSteppingUp: steppingUp,
        steppingUp,
        stepUpIndex: steppingUp ? rank : 0,
        driver: driverObj,
      };
      return {
        objectId: id,
        laneIndex: idx,
        driver: driverObj,
        actualDriver: driverObj,
        participant: participantObj,
        totalLaps: 10 - idx,
        lapCount: 10 - idx,
        physicalLapCount: 10 - idx,
        totalTime: 30.0 + idx * 2.5,
        bestLapTime: 3.1 + idx * 0.15,
        totalPoints: (4 - idx) * 2,
        points: (4 - idx) * 2,
        rankHeat: rank,
        rankOverall: rank,
        position: rank,
        isSteppingUp: steppingUp,
        steppingUp,
        stepUpIndex: steppingUp ? rank : 0,
      };
    });
  }

  @HostListener("window:keydown.escape")
  onEscape(): void {
    if (this.visible()) {
      this.onClose();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (
      (event.target as HTMLElement)?.classList?.contains(
        "step-results-dialog-backdrop",
      )
    ) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
