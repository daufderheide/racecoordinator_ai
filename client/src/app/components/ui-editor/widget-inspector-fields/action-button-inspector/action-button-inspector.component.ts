import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

@Component({
  standalone: true,
  selector: "app-action-button-inspector",
  templateUrl: "./action-button-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class ActionButtonInspectorComponent {
  widget = input.required<AbsoluteWidgetNode>();
  disableFontSizes = input<boolean>(false);
  change = output<void>();

  fontService = inject(FontService);

  get settings(): any {
    if (!this.widget().customSettings) {
      this.widget().customSettings = {};
    }
    return this.widget().customSettings;
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
      case "action-open-heat-results":
        return "RD_WIN_HEAT_RESULTS";
      case "action-open-race-results":
        return "RD_WIN_RACE_RESULTS";
      default:
        return "";
    }
  }

  onFieldChange() {
    this.change.emit();
  }

  onColorChange(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.settings[field] = input.value;
    this.onFieldChange();
  }

  resetColor(field: string) {
    this.settings[field] = "";
    this.onFieldChange();
  }
}
