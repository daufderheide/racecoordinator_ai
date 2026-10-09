import { CommonModule } from "@angular/common";
import { Component, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

@Component({
  standalone: true,
  selector: "app-lane-column-inspector",
  templateUrl: "./lane-column-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class LaneColumnInspectorComponent {
  settings = input.required<any>();
  widget = input<AbsoluteWidgetNode>();
  availableColumns = input<{ key: string; label: string }[]>([]);
  disableFontSizes = input<boolean>(false);
  totalLanes = input<number>(4);

  change = output<void>();
  requestReplicate = output<void>();
  replicate =
    output<Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">>();
  editGrid = output<string>();
  detachGrid = output<string>();

  fontService = inject(FontService);
  showReplicateModal = signal<boolean>(false);

  get availableIndices(): number[] {
    const mode = this.currentSettings["bindingMode"];
    if (mode === "overallPosition" || mode === "seed") {
      const count = Math.max(16, Math.min(64, (this.totalLanes() || 4) * 4));
      return Array.from({ length: count }, (_, i) => i);
    }
    const laneCount = Math.max(8, this.totalLanes() || 8);
    return Array.from({ length: laneCount }, (_, i) => i);
  }

  readonly ANCHOR_POSITIONS = [
    { key: "top-left", labelKey: "UE_ANCHOR_top-left" },
    { key: "top-center", labelKey: "UE_ANCHOR_top-center" },
    { key: "top-right", labelKey: "UE_ANCHOR_top-right" },
    { key: "center-left", labelKey: "UE_ANCHOR_center-left" },
    { key: "center-right", labelKey: "UE_ANCHOR_center-right" },
    { key: "bottom-left", labelKey: "UE_ANCHOR_bottom-left" },
    { key: "bottom-center", labelKey: "UE_ANCHOR_bottom-center" },
    { key: "bottom-right", labelKey: "UE_ANCHOR_bottom-right" },
  ];

  get currentSettings(): any {
    return this.settings() || {};
  }

  get isTotalTimeColumn(): boolean {
    return RacedayLayoutUtils.isTotalTimeColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isTimeColumn(): boolean {
    return RacedayLayoutUtils.isTimeColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get isLapColumn(): boolean {
    return RacedayLayoutUtils.isLapColumnKey(
      this.currentSettings["columnKey"] || "",
    );
  }

  get onlyShowDecimalsWhenNotRacing(): boolean {
    if (this.currentSettings["onlyShowDecimalsWhenNotRacing"] !== undefined) {
      return Boolean(this.currentSettings["onlyShowDecimalsWhenNotRacing"]);
    }
    if (this.currentSettings["onlyShowSegmentsWhenNotRacing"] !== undefined) {
      return Boolean(this.currentSettings["onlyShowSegmentsWhenNotRacing"]);
    }
    return Boolean(this.currentSettings["onlyShowDecimalsIfSegments"]);
  }

  set onlyShowDecimalsWhenNotRacing(val: boolean) {
    this.currentSettings["onlyShowDecimalsWhenNotRacing"] = val;
    this.currentSettings["onlyShowSegmentsWhenNotRacing"] = val;
    this.currentSettings["onlyShowDecimalsIfSegments"] = val;
  }

  get onlyShowSegmentsWhenNotRacing(): boolean {
    return this.onlyShowDecimalsWhenNotRacing;
  }

  set onlyShowSegmentsWhenNotRacing(val: boolean) {
    this.onlyShowDecimalsWhenNotRacing = val;
  }

  get onlyShowDecimalsIfSegments(): boolean {
    return this.onlyShowDecimalsWhenNotRacing;
  }

  set onlyShowDecimalsIfSegments(val: boolean) {
    this.onlyShowDecimalsWhenNotRacing = val;
  }

  onFieldChange(): void {
    if (this.currentSettings["timeDecimalPlaces"] !== undefined) {
      this.currentSettings["timeDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["timeDecimalPlaces"])),
      );
    }
    if (this.currentSettings["lapDecimalPlaces"] !== undefined) {
      this.currentSettings["lapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["lapDecimalPlaces"])),
      );
    }
    if (this.currentSettings["insetTimeDecimalPlaces"] !== undefined) {
      this.currentSettings["insetTimeDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["insetTimeDecimalPlaces"])),
      );
    }
    if (this.currentSettings["insetLapDecimalPlaces"] !== undefined) {
      this.currentSettings["insetLapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["insetLapDecimalPlaces"])),
      );
    }
    if (this.currentSettings["timeSubsecondThreshold"] !== undefined) {
      this.currentSettings["timeSubsecondThreshold"] = Math.max(
        0,
        Number(this.currentSettings["timeSubsecondThreshold"]),
      );
    }
    if (this.currentSettings["timeSubsecondDecimals"] !== undefined) {
      this.currentSettings["timeSubsecondDecimals"] = Math.min(
        3,
        Math.max(0, Number(this.currentSettings["timeSubsecondDecimals"])),
      );
    }
    this.change.emit();
  }

  getPreview(seconds: number): string {
    return formatTimerDisplay(seconds, {
      format: this.currentSettings["timeDisplayFormat"] || "dynamic",
      subsecondMode: this.currentSettings["timeSubsecondMode"] || "threshold",
      subsecondThreshold: this.currentSettings["timeSubsecondThreshold"] ?? 10,
      subsecondDecimals: this.currentSettings["timeSubsecondDecimals"] ?? 2,
    });
  }

  getAnchorValue(anchor: string): string {
    return this.currentSettings["insets"]?.[anchor] || "";
  }

  setAnchorValue(anchor: string, val: string): void {
    if (!this.currentSettings["insets"]) {
      this.currentSettings["insets"] = {};
    }
    if (!val) {
      delete this.currentSettings["insets"][anchor];
    } else {
      this.currentSettings["insets"][anchor] = val;
    }
    this.onFieldChange();
  }

  onColorChange(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentSettings[field] = input.value;
    this.onFieldChange();
  }

  resetColor(field: string): void {
    delete this.currentSettings[field];
    this.onFieldChange();
  }

  resetHeaderTextColor(): void {
    this.resetColor("headerTextColor");
  }

  resetHeaderBackgroundColor(): void {
    this.resetColor("headerBackgroundColor");
  }

  resetInsetTextColor(): void {
    this.resetColor("insetTextColor");
  }

  onEditGridTemplate(): void {
    if (this.currentSettings["gridId"]) {
      this.editGrid.emit(this.currentSettings["gridId"]);
    }
  }

  onDetachFromGrid(): void {
    if (this.currentSettings["gridId"]) {
      this.detachGrid.emit(this.currentSettings["gridId"]);
    }
  }

  openReplicateModal(): void {
    this.showReplicateModal.set(true);
    this.requestReplicate.emit();
  }

  closeReplicateModal(): void {
    this.showReplicateModal.set(false);
  }

  onReplicateConfirm(
    options: Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">,
  ): void {
    this.showReplicateModal.set(false);
    this.replicate.emit(options);
  }
}
