import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { WidgetBorderInspectorComponent } from "@app/components/ui-editor/widget-inspector-fields/widget-border-inspector/widget-border-inspector.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

@Component({
  standalone: true,
  selector: "app-upcoming-inspector",
  templateUrl: "./upcoming-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    WidgetBorderInspectorComponent,
  ],
})
export class UpcomingInspectorComponent {
  settings = input.required<any>();
  disableFontSizes = input<boolean>(false);
  widgetType = input<string>("next-heat");
  change = output<void>();
  fontService = inject(FontService);

  isNextHeat = computed(() => this.widgetType() === "next-heat");

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
