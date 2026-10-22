import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

@Component({
  standalone: true,
  selector: "app-label-inspector",
  templateUrl: "./label-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class LabelInspectorComponent {
  settings = input.required<any>();
  change = output<void>();
  fontService = inject(FontService);

  onSettingsChange(): void {
    this.change.emit();
  }

  onColorChange(field: string, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (this.settings()) {
      this.settings()[field] = inputEl.value;
      this.change.emit();
    }
  }

  resetColor(field: string): void {
    if (this.settings()) {
      delete this.settings()[field];
      this.change.emit();
    }
  }
}
