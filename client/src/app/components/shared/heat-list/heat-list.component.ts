import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragPlaceholder,
} from "@angular/cdk/drag-drop";
import { Component, effect, input, output } from "@angular/core";

import { TranslatePipe } from "src/app/pipes/translate.pipe";

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
  laneSelected = output<number>();

  constructor() {
    effect(() => {
      const h = this.heats();
      console.log("HeatListComponent received new heats:", h?.length, "heats");
      console.log("Heats data:", h);
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
