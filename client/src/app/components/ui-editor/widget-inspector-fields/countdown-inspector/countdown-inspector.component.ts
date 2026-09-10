import { CommonModule } from "@angular/common";
import { Component, effect, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

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
    const s = this.settings();
    if (!s) return;
    let modified = false;
    if (!s.orientation) {
      s.orientation = "horizontal";
      modified = true;
    }
    if (!s.lampSizingMode) {
      s.lampSizingMode = "custom";
      modified = true;
    }
    if (!s.previewLampCount) {
      s.previewLampCount = 5;
      modified = true;
    } else if (typeof s.previewLampCount === "string") {
      s.previewLampCount = Number(s.previewLampCount) || 5;
      modified = true;
    }
    if (!s.blurArea) {
      s.blurArea = "fullscreen";
      modified = true;
    }
    if (s.blurAmount === undefined || s.blurAmount === null) {
      s.blurAmount = 50;
      modified = true;
    }
    if (s.lampScale === undefined || s.lampScale === null) {
      s.lampScale = 1.0;
      modified = true;
    }
    if (s.glowEffect === undefined || s.glowEffect === null) {
      s.glowEffect = true;
      modified = true;
    }
    if (s.glowIntensity === undefined || s.glowIntensity === null) {
      s.glowIntensity = 100;
      modified = true;
    }
    if (s.glowOverlap === undefined || s.glowOverlap === null) {
      s.glowOverlap = 100;
      modified = true;
    }
    if (s.glowRedOverlap === undefined || s.glowRedOverlap === null) {
      s.glowRedOverlap = s.glowOverlap ?? 100;
      modified = true;
    }
    if (s.glowGreenOverlap === undefined || s.glowGreenOverlap === null) {
      s.glowGreenOverlap = 100;
      modified = true;
    }
    if (modified) {
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

  get previewLampCount(): number {
    return Number(this.settings()?.previewLampCount) || 5;
  }

  setPreviewLampCount(count: any) {
    if (this.settings()) {
      this.settings().previewLampCount = Number(count) || 5;
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
    return typeof val === "number" ? Math.max(0, Math.min(100, val)) : 100;
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
    return typeof val === "number" ? Math.max(0, Math.min(100, val)) : 100;
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
