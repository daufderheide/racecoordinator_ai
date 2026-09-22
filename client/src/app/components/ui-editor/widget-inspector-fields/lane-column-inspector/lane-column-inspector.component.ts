import { CommonModule } from "@angular/common";
import { Component, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

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

  availableIndices = [0, 1, 2, 3, 4, 5, 6, 7];

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

  onFieldChange(): void {
    this.change.emit();
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

  resetInsetTextColor(): void {
    delete this.currentSettings["insetTextColor"];
    this.onFieldChange();
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
