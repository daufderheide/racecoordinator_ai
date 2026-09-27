import { CommonModule } from "@angular/common";
import { Component, effect, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

@Component({
  standalone: true,
  selector: "app-records-inspector",
  templateUrl: "./records-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class RecordsInspectorComponent {
  settings = input.required<any>();
  disableFontSizes = input<boolean>(false);
  change = output<void>();
  fontService = inject(FontService);

  constructor() {
    effect(() => {
      const s = this.settings();
      if (s) {
        if (s.showRaceRecordLap === undefined) s.showRaceRecordLap = true;
        if (s.showRaceRecordScore === undefined) s.showRaceRecordScore = true;
        if (s.showCurrentRaceBest === undefined) s.showCurrentRaceBest = true;
        if (s.showHeatBest === undefined) s.showHeatBest = true;
      }
    });
  }

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
}
