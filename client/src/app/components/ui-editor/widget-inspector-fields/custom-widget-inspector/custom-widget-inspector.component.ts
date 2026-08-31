import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomWidgetDefinition,
  CustomWidgetSettingField,
} from "@app/models/custom-widget.model";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CustomWidgetService } from "@app/services/custom-widget.service";

@Component({
  standalone: true,
  selector: "app-custom-widget-inspector",
  templateUrl: "./custom-widget-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class CustomWidgetInspectorComponent {
  widget = input.required<AbsoluteWidgetNode>();
  change = output<AbsoluteWidgetNode>();

  private customWidgetService = inject(CustomWidgetService);

  get definition(): CustomWidgetDefinition | undefined {
    return this.customWidgetService.getWidgetDefinition(
      this.widget().widgetType,
    );
  }

  get schema(): CustomWidgetSettingField[] {
    return this.definition?.manifest?.settingsSchema || [];
  }

  get widgetName(): string {
    return (
      this.definition?.manifest?.name ||
      this.widget().widgetType.replace(/^custom:/, "")
    );
  }

  get widgetDescription(): string {
    return this.definition?.manifest?.description || "";
  }

  getSettingValue(key: string, defaultValue: any): any {
    const node = this.widget();
    if (
      !node ||
      !node.customSettings ||
      node.customSettings[key] === undefined
    ) {
      return defaultValue;
    }
    return node.customSettings[key];
  }

  onSettingChanged(key: string, value: any) {
    const node = this.widget();
    if (!node) return;
    if (!node.customSettings) {
      node.customSettings = {};
    }
    node.customSettings[key] = value;
    this.change.emit(node);
  }

  onCheckboxChange(key: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.onSettingChanged(key, checked);
  }

  onNumberInput(key: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const num = val === "" ? 0 : Number(val);
    this.onSettingChanged(key, isNaN(num) ? 0 : num);
  }

  onTextInput(key: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.onSettingChanged(key, val);
  }

  onSelectChange(key: string, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.onSettingChanged(key, val);
  }

  onColorChange(key: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onSettingChanged(key, value);
  }

  resetColor(key: string, defaultColor?: any) {
    this.onSettingChanged(key, defaultColor !== undefined ? defaultColor : "");
  }
}
