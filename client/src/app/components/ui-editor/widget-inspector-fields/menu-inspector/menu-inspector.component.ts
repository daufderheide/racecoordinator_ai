import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

@Component({
  standalone: true,
  selector: "app-menu-inspector",
  templateUrl: "./menu-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class MenuInspectorComponent {
  widget = input.required<AbsoluteWidgetNode>();
  disableFontSizes = input<boolean>(false);
  change = output<void>();
  fontService = inject(FontService);

  onSettingsChange() {
    this.change.emit();
  }

  onColorChange(field: "textColor" | "backgroundColor", event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.widget()) {
      this.widget()[field] = value;
      this.change.emit();
    }
  }

  resetColor(field: "textColor" | "backgroundColor") {
    if (this.widget()) {
      this.widget()[field] = "";
      this.change.emit();
    }
  }
}
