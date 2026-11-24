import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { AvailableGroup, AvailableStep } from "./heats-filter.utils";

@Component({
  standalone: true,
  selector: "app-heats-filter-bar",
  templateUrl: "./heats-filter-bar.component.html",
  styleUrls: ["./heats-filter-bar.component.css"],
  imports: [CommonModule, TranslatePipe],
})
export class HeatsFilterBarComponent {
  readonly hasGroupFilter = input<boolean>(false);
  readonly hasStepFilter = input<boolean>(false);
  readonly availableGroups = input<AvailableGroup[]>([]);
  readonly availableSteps = input<AvailableStep[]>([]);
  readonly selectedGroup = input<number | null>(null);
  readonly selectedStep = input<number | null>(null);
  readonly totalHeats = input<number>(0);
  readonly visibleHeats = input<number>(0);

  readonly groupChange = output<number | null>();
  readonly stepChange = output<number | null>();
  readonly clearFilters = output<void>();

  isFilterActive(): boolean {
    return this.selectedGroup() !== null || this.selectedStep() !== null;
  }

  onSelectGroup(grp: number | null): void {
    this.groupChange.emit(grp);
  }

  onSelectStep(step: number | null): void {
    this.stepChange.emit(step);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
