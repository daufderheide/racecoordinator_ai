import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from "@angular/cdk/drag-drop";
import { Component, effect, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";

@Component({
  standalone: true,
  selector: "app-heat-list",
  templateUrl: "./heat-list.component.html",
  styleUrls: ["./heat-list.component.css"],
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    TranslatePipe,
  ],
})
export class HeatListComponent {
  heats = input<any[]>([]);
  showHeader = input(true);
  columns = input(2);
  canDragLanes = input(false);
  showGroups = input(false);
  groupNames = input<string[]>([]);
  laneSelected = output<number>();

  getCustomGroupName(groupIdx: number): string {
    const names = this.groupNames();
    if (
      groupIdx !== undefined &&
      groupIdx !== null &&
      names &&
      names[groupIdx] &&
      names[groupIdx].trim() !== ""
    ) {
      return names[groupIdx].trim();
    }
    return "";
  }

  constructor(private logger: LoggerService) {
    effect(() => {
      const h = this.heats();
      this.logger.debug(
        "HeatListComponent received new heats:",
        h?.length,
        "heats",
      );
      this.logger.debug("Heats data:", h);
    });
  }

  trackByHeatNumber(index: number, heat: any): number {
    return heat.heatNumber || index;
  }

  trackByLaneNumber(index: number, lane: any): number {
    return lane.laneNumber || index;
  }

  onDrop(event: CdkDragDrop<any[]>, _heat: any) {
    if (!this.canDragLanes()) return;
    // We only care about the target lane index
    const targetLaneIndex = event.currentIndex;
    this.laneSelected.emit(targetLaneIndex);
  }

  isLaneOccupied(lane: any): boolean {
    return !!lane.driverNumber;
  }

  onLaneClick(laneIndex: number) {
    const heats = this.heats();
    if (!this.canDragLanes() || !heats || heats.length === 0) return;

    const heat = heats[0];
    if (
      heat &&
      heat.lanes &&
      heat.lanes[laneIndex] &&
      !this.isLaneOccupied(heat.lanes[laneIndex])
    ) {
      this.laneSelected.emit(laneIndex);
    }
  }
}
