import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { toValidHexColor } from "@app/utils/widget-border.utils";

@Component({
  standalone: true,
  selector: "app-widget-border-inspector",
  templateUrl: "./widget-border-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class WidgetBorderInspectorComponent {
  settings = input.required<Record<string, any>>();
  defaultShowBorder = input<boolean>(true);
  defaultBorderStyle = input<string>("solid");
  defaultBorderColor = input<string>("#ffffff");
  defaultBorderWidth = input<number>(1);
  defaultBorderRadius = input<number>(8);
  change = output<void>();

  get showBorder(): boolean {
    const s = this.settings();
    if (!s) return this.defaultShowBorder();
    return s["showBorder"] !== undefined
      ? Boolean(s["showBorder"])
      : this.defaultShowBorder();
  }

  onShowBorderChange(val: boolean): void {
    const s = this.settings();
    if (s) {
      s["showBorder"] = val;
      this.change.emit();
    }
  }

  get borderStyle(): string {
    const s = this.settings();
    return s?.["borderStyle"] || this.defaultBorderStyle();
  }

  onBorderStyleChange(val: string): void {
    const s = this.settings();
    if (s) {
      s["borderStyle"] = val;
      this.change.emit();
    }
  }

  get borderColor(): string {
    const s = this.settings();
    const raw = s?.["borderColor"];
    const fallback = toValidHexColor(this.defaultBorderColor(), "#ffffff");
    return toValidHexColor(raw, fallback);
  }

  onBorderColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const s = this.settings();
    if (s && input) {
      s["borderColor"] = input.value;
      this.change.emit();
    }
  }

  get borderWidth(): number {
    const s = this.settings();
    if (!s || s["borderWidth"] === undefined || s["borderWidth"] === null) {
      return this.defaultBorderWidth();
    }
    return Number(s["borderWidth"]);
  }

  onBorderWidthChange(val: number): void {
    const s = this.settings();
    if (s) {
      s["borderWidth"] = Number(val);
      this.change.emit();
    }
  }

  get borderRadius(): number {
    const s = this.settings();
    if (!s || s["borderRadius"] === undefined || s["borderRadius"] === null) {
      return this.defaultBorderRadius();
    }
    return Number(s["borderRadius"]);
  }

  onBorderRadiusChange(val: number): void {
    const s = this.settings();
    if (s) {
      s["borderRadius"] = Number(val);
      this.change.emit();
    }
  }
}
