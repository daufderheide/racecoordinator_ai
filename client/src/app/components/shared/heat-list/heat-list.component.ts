import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";

@Component({
  selector: "app-heat-list",
  templateUrl: "./heat-list.component.html",
  styleUrls: ["./heat-list.component.css"],
  standalone: false,
})
export class HeatListComponent implements OnChanges {
  @Input() heats: any[] = [];
  @Input() showHeader: boolean = true;
  @Input() columns: number = 2;
  @Input() canDragLanes: boolean = false;
  @Output() laneSelected = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes["heats"]) {
      console.log(
        "HeatListComponent received new heats:",
        this.heats?.length,
        "heats",
      );
      console.log("Heats data:", this.heats);
    }
  }

  trackByHeatNumber(index: number, heat: any): number {
    return heat.heatNumber || index;
  }

  trackByLaneNumber(index: number, lane: any): number {
    return lane.laneNumber || index;
  }

  onDrop(event: CdkDragDrop<any[]>, heat: any) {
    if (!this.canDragLanes) return;
    // We only care about the target lane index
    const targetLaneIndex = event.currentIndex;
    this.laneSelected.emit(targetLaneIndex);
  }

  isLaneOccupied(lane: any): boolean {
    return !!lane.driverNumber;
  }

  onLaneClick(laneIndex: number) {
    if (!this.canDragLanes || !this.heats || this.heats.length === 0) return;

    const heat = this.heats[0];
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
