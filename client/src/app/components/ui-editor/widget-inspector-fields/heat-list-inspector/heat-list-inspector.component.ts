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
  selector: "app-heat-list-inspector",
  templateUrl: "./heat-list-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class HeatListInspectorComponent {
  settings = input.required<any>();
  disableFontSizes = input<boolean>(false);
  change = output<void>();
  fontService = inject(FontService);

  onSettingsChange() {
    this.change.emit();
  }

  onDisplayModeChange(field: string, value: string) {
    if (this.settings()) {
      this.settings()[field] = value;
      const isSummary = value === "summary" || value === "summary_lane_colors";
      if (field === "activeHeatDisplay") {
        this.settings().showActiveSummary = isSummary;
      } else if (field === "completedHeatsDisplay") {
        this.settings().showCompletedSummary = isSummary;
      } else if (field === "futureHeatsDisplay") {
        this.settings().showFutureSummary = isSummary;
      }
      this.onSettingsChange();
    }
  }

  getActiveHeatDisplay(): string {
    const s = this.settings();
    if (s?.activeHeatDisplay) {
      return s.activeHeatDisplay;
    }
    if (s?.showActiveSummary !== false) {
      return s?.summaryUseLaneColors !== false
        ? "summary_lane_colors"
        : "summary";
    }
    return "lane_colors";
  }

  getCompletedHeatsDisplay(): string {
    const s = this.settings();
    if (s?.completedHeatsDisplay) {
      return s.completedHeatsDisplay;
    }
    if (s?.showCompletedSummary !== false) {
      return s?.summaryUseLaneColors !== false
        ? "summary_lane_colors"
        : "summary";
    }
    return "lane_colors";
  }

  getFutureHeatsDisplay(): string {
    const s = this.settings();
    if (s?.futureHeatsDisplay) {
      return s.futureHeatsDisplay;
    }
    if (s?.showFutureSummary === true) {
      return s?.summaryUseLaneColors !== false
        ? "summary_lane_colors"
        : "summary";
    }
    return "lane_colors";
  }

  hasSummary(): boolean {
    const completed = this.getCompletedHeatsDisplay();
    const active = this.getActiveHeatDisplay();
    const future = this.getFutureHeatsDisplay();
    return (
      completed === "summary" ||
      completed === "summary_lane_colors" ||
      active === "summary" ||
      active === "summary_lane_colors" ||
      future === "summary" ||
      future === "summary_lane_colors"
    );
  }

  disableSummaryRowTextColor(): boolean {
    const completed = this.getCompletedHeatsDisplay();
    const active = this.getActiveHeatDisplay();
    const future = this.getFutureHeatsDisplay();
    const hasSummaryWithoutLaneColors =
      completed === "summary" || active === "summary" || future === "summary";
    return !hasSummaryWithoutLaneColors;
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
