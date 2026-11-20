import { CommonModule } from "@angular/common";
import { Component, effect, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { WidgetBorderInspectorComponent } from "@app/components/ui-editor/widget-inspector-fields/widget-border-inspector/widget-border-inspector.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { ensureCountdownDefaults } from "./countdown-defaults";

@Component({
  standalone: true,
  selector: "app-countdown-inspector",
  templateUrl: "./countdown-inspector.component.html",
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
export class CountdownInspectorComponent {
  settings = input.required<any>();
  widget = input<AbsoluteWidgetNode | null>(null);
  change = output<void>();

  constructor() {
    effect(() => {
      this.ensureDefaults();
    });
  }

  ensureDefaults() {
    if (ensureCountdownDefaults(this.settings(), this.widget())) {
      this.change.emit();
    }
  }

  get orientation(): string {
    return this.settings()?.orientation || "horizontal";
  }

  setOrientation(val: string) {
    if (this.settings()) {
      this.settings().orientation = val;
      this.onSettingsChange();
    }
  }

  get lampSizingMode(): string {
    return this.settings()?.lampSizingMode || "custom";
  }

  setLampSizingMode(mode: string) {
    if (this.settings()) {
      this.settings().lampSizingMode = mode;
      this.onSettingsChange();
    }
  }

  get maxLamps(): number {
    const val = this.settings()?.maxLamps ?? this.settings()?.previewLampCount;
    return Number(val) || 5;
  }

  setMaxLamps(count: any) {
    if (this.settings()) {
      const num = Number(count) || 5;
      this.settings().maxLamps = num;
      this.settings().previewLampCount = num;
      this.onSettingsChange();
    }
  }

  get previewLampCount(): number {
    return this.maxLamps;
  }

  setPreviewLampCount(count: any) {
    this.setMaxLamps(count);
  }

  get fadeIn(): boolean {
    return this.settings()?.fadeIn !== false;
  }

  setFadeIn(val: boolean) {
    if (this.settings()) {
      this.settings().fadeIn = val;
      this.onSettingsChange();
    }
  }

  get glowEffect(): boolean {
    return this.settings()?.glowEffect !== false;
  }

  setGlowEffect(val: boolean) {
    if (this.settings()) {
      this.settings().glowEffect = val;
      this.onSettingsChange();
    }
  }

  get glowIntensity(): number {
    const val = this.settings()?.glowIntensity;
    return typeof val === "number" ? Math.max(10, Math.min(100, val)) : 100;
  }

  setGlowIntensity(val: any) {
    if (this.settings()) {
      this.settings().glowIntensity = Number(val) || 100;
      this.onSettingsChange();
    }
  }

  get glowOverlap(): number {
    return this.glowRedOverlap;
  }

  setGlowOverlap(val: any) {
    this.setGlowRedOverlap(val);
  }

  get glowRedOverlap(): number {
    const val = this.settings()?.glowRedOverlap ?? this.settings()?.glowOverlap;
    return typeof val === "number" ? Math.max(0, Math.min(100, val)) : 30;
  }

  setGlowRedOverlap(val: any) {
    if (this.settings()) {
      const n = Number(val);
      this.settings().glowRedOverlap = n;
      this.settings().glowOverlap = n;
      this.onSettingsChange();
    }
  }

  get glowGreenOverlap(): number {
    const val = this.settings()?.glowGreenOverlap;
    return typeof val === "number" ? Math.max(0, Math.min(100, val)) : 25;
  }

  setGlowGreenOverlap(val: any) {
    if (this.settings()) {
      this.settings().glowGreenOverlap = Number(val);
      this.onSettingsChange();
    }
  }

  get blurArea(): string {
    return this.settings()?.blurArea || "fullscreen";
  }

  setBlurArea(area: string) {
    if (this.settings()) {
      this.settings().blurArea = area;
      this.onSettingsChange();
    }
  }

  onSettingsChange() {
    this.change.emit();
  }

  getLampScalePercent(): number {
    const scale = this.settings()?.lampScale ?? 1.0;
    return Math.round(scale * 100);
  }
}
