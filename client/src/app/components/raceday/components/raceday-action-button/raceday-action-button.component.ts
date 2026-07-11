import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { Role } from "@app/models/role";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";

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

  constructor(public authService: AuthService) {}

  get isActionDisabled(): boolean {
    if (
      typeof this.parent().isUIEditorMode === "function" &&
      this.parent().isUIEditorMode()
    ) {
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
      default:
        return "";
    }
  }

  onClick(event: Event) {
    event.stopPropagation();
    if (this.isActionDisabled) return;

    let actionString = "";
    switch (this.widget().widgetType) {
      case "action-start-resume":
        actionString = "START_RESUME";
        break;
      case "action-pause":
        actionString = "PAUSE";
        break;
      case "action-next-heat":
        actionString = "NEXT_HEAT";
        break;
      case "action-restart-heat":
        actionString = "RESTART_HEAT";
        break;
      case "action-defer-heat":
        actionString = "DEFER_HEAT";
        break;
      case "action-skip-heat":
        actionString = "SKIP_HEAT";
        break;
      case "action-skip-race":
        actionString = "SKIP_RACE";
        break;
      case "action-add-lap":
        actionString = "ADD_LAP";
        break;
      case "action-modify-heats":
        actionString = "MODIFY";
        break;
    }

    if (actionString) {
      this.parent().onMenuSelect(actionString);
    }
  }
}
