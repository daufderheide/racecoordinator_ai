import { CommonModule } from "@angular/common";
import { Component, inject, input, ViewEncapsulation } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { Role } from "@app/models/role";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { NavigationService } from "@app/services/navigation.service";

@Component({
  standalone: true,
  selector: "app-raceday-action-button",
  templateUrl: "./raceday-action-button.component.html",
  styleUrls: ["./raceday-action-button.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayActionButtonComponent {
  widget = input.required<AbsoluteWidgetNode>();
  parent = input.required<any>();

  private navigationService = inject(NavigationService, { optional: true });

  public canGoBack = toSignal(this.navigationService?.canGoBack$ || of(false), {
    initialValue: this.navigationService?.canGoBack?.() ?? false,
  });

  public canGoForward = toSignal(
    this.navigationService?.canGoForward$ || of(false),
    {
      initialValue: this.navigationService?.canGoForward?.() ?? false,
    },
  );

  get isNavOrCloseButton(): boolean {
    const t = this.widget().widgetType;
    return (
      t === "action-back" || t === "action-forward" || t === "action-close"
    );
  }

  constructor(public authService: AuthService) {}

  get isActionDisabled(): boolean {
    if (
      typeof this.parent().isUIEditorMode === "function" &&
      this.parent().isUIEditorMode()
    ) {
      return false;
    }

    if (this.widget().widgetType === "action-back") {
      return !this.canGoBack();
    }
    if (this.widget().widgetType === "action-forward") {
      return !this.canGoForward();
    }
    if (this.widget().widgetType === "action-close") {
      return false;
    }

    if (this.authService.currentRole === Role.VIEWER) {
      return true;
    }

    switch (this.widget().widgetType) {
      case "action-start-resume":
        return this.parent().isStartResumeDisabled;
      case "action-pause":
        return this.parent().isPauseDisabled;
      case "action-next-heat":
        return this.parent().isNextHeatDisabled;
      case "action-restart-heat":
        return this.parent().isRestartHeatDisabled;
      case "action-defer-heat":
        return this.parent().isDeferHeatDisabled;
      case "action-skip-heat":
        return this.parent().isSkipHeatDisabled;
      case "action-skip-race":
        return this.parent().isSkipRaceDisabled;
      case "action-add-lap":
        return this.parent().isAddLapDisabled;
      case "action-modify-heats":
        return this.parent().isModifyDisabled;
      case "action-master-power-on":
      case "action-master-power-off":
        return this.parent().isMainPowerDisabled;
      default:
        return false;
    }
  }

  get actionLabelKey(): string {
    switch (this.widget().widgetType) {
      case "action-start-resume":
        return "RD_MENU_START_RESUME";
      case "action-pause":
        return "RD_MENU_PAUSE";
      case "action-next-heat":
        return "RD_MENU_NEXT_HEAT";
      case "action-restart-heat":
        return "RD_MENU_RESTART";
      case "action-defer-heat":
        return "RD_MENU_DEFER";
      case "action-skip-heat":
        return "RD_MENU_SKIP_HEAT";
      case "action-skip-race":
        return "RD_MENU_SKIP_RACE";
      case "action-add-lap":
        return "RD_MENU_ADD_LAP";
      case "action-modify-heats":
        return "RD_MENU_MODIFY";
      case "action-export-pdf":
        return "RD_MENU_EXPORT_PDF";
      case "action-export-csv":
        return "RD_MENU_EXPORT_CSV";
      case "action-export-xls":
        return "RD_MENU_EXPORT_XLS";
      case "action-open-heat-results":
        return "RD_WIN_HEAT_RESULTS";
      case "action-open-race-results":
        return "RD_WIN_RACE_RESULTS";
      case "action-open-season-results":
        return "RD_WIN_SEASON_RESULTS";
      case "action-open-prediction-results":
        return "RD_WIN_PREDICTION_RESULTS";
      case "action-master-power-on":
        return "RD_MENU_MAIN_POWER_ON";
      case "action-master-power-off":
        return "RD_MENU_MAIN_POWER_OFF";
      case "action-back":
        return "RD_MENU_BACK";
      case "action-forward":
        return "RD_MENU_FORWARD";
      case "action-close":
        return "RD_MENU_CLOSE";
      default:
        return "";
    }
  }

  private getActionString(): string {
    switch (this.widget().widgetType) {
      case "action-start-resume":
        return "START_RESUME";
      case "action-pause":
        return "PAUSE";
      case "action-next-heat":
        return "NEXT_HEAT";
      case "action-restart-heat":
        return "RESTART_HEAT";
      case "action-defer-heat":
        return "DEFER_HEAT";
      case "action-skip-heat":
        return "SKIP_HEAT";
      case "action-skip-race":
        return "SKIP_RACE";
      case "action-add-lap":
        return "ADD_LAP";
      case "action-modify-heats":
        return "MODIFY";
      case "action-export-pdf":
        return "EXPORT_PDF";
      case "action-export-csv":
        return "EXPORT_CSV";
      case "action-export-xls":
        return "EXPORT_XLS";
      case "action-open-heat-results":
        return "HEAT_RESULTS";
      case "action-open-race-results":
        return "RACE_RESULTS";
      case "action-open-season-results":
        return "SEASON_RESULTS";
      case "action-open-prediction-results":
        return "PREDICTION_RESULTS";
      case "action-master-power-on":
        return "MASTER_POWER_ON";
      case "action-master-power-off":
        return "MASTER_POWER_OFF";
      case "action-back":
        return "BACK";
      case "action-forward":
        return "FORWARD";
      case "action-close":
        return "CLOSE";
      default:
        return "";
    }
  }

  private executeFileOrNavAction(actionString: string): void {
    if (typeof this.parent()?.onFileMenuSelect === "function") {
      this.parent().onFileMenuSelect(actionString);
      return;
    }
    if (actionString === "BACK") {
      this.navigationService?.goBack?.();
    } else if (actionString === "FORWARD") {
      this.navigationService?.goForward?.();
    } else if (actionString === "CLOSE") {
      if (typeof document !== "undefined" && document.fullscreenElement) {
        try {
          document.exitFullscreen();
        } catch (e) {}
      }
      if (typeof window !== "undefined") {
        try {
          window.close();
        } catch (e) {}
      }
    }
  }

  onClick(event: Event) {
    event.stopPropagation();
    if (this.isActionDisabled) return;

    const actionString = this.getActionString();
    if (!actionString) return;

    if (
      actionString === "EXPORT_CSV" ||
      actionString === "EXPORT_XLS" ||
      actionString === "EXPORT_PDF" ||
      actionString === "BACK" ||
      actionString === "FORWARD" ||
      actionString === "CLOSE"
    ) {
      this.executeFileOrNavAction(actionString);
    } else if (
      actionString === "HEAT_RESULTS" ||
      actionString === "RACE_RESULTS" ||
      actionString === "SEASON_RESULTS" ||
      actionString === "PREDICTION_RESULTS"
    ) {
      this.parent().onWindowsMenuSelect(actionString);
    } else if (actionString === "MASTER_POWER_ON") {
      this.parent().onTrackPowerMainSelect(true);
    } else if (actionString === "MASTER_POWER_OFF") {
      this.parent().onTrackPowerMainSelect(false);
    } else {
      this.parent().onMenuSelect(actionString);
    }
  }
}
