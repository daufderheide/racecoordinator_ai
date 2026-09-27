import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

@Component({
  standalone: true,
  selector: "app-timer-inspector",
  templateUrl: "./timer-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class TimerInspectorComponent {
  settings = input.required<any>();
  disableFontSizes = input<boolean>(false);
  change = output<void>();
  fontService = inject(FontService);

  onSettingsChange() {
    this.change.emit();
  }

  onColorChange(field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.settings()) {
      this.settings()[field] = value;
      this.change.emit();
    }
  }

  resetColor(field: string) {
    if (this.settings()) {
      this.settings()[field] = "";
      this.change.emit();
    }
  }

  getPreview(seconds: number): string {
    const s = this.settings();
    if (!s) return "";
    return formatTimerDisplay(seconds, {
      format: s.timeDisplayFormat || "dynamic",
      subsecondMode: s.timeSubsecondMode || "threshold",
      subsecondThreshold: s.timeSubsecondThreshold ?? 10,
      subsecondDecimals: s.timeSubsecondDecimals ?? 2,
    });
  }
}
