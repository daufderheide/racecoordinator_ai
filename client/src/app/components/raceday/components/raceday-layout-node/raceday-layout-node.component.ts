import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  Input,
  ViewEncapsulation,
} from "@angular/core";
import { LayoutNode, SplitNode, WidgetNode } from "@app/models/settings";

import { RacedayBrandingComponent } from "../raceday-branding/raceday-branding.component";
import { RacedayFlagComponent } from "../raceday-flag/raceday-flag.component";
import { RacedayInfoBarComponent } from "../raceday-info-bar/raceday-info-bar.component";
import { RacedayLaneViewComponent } from "../raceday-lane-view/raceday-lane-view.component";
import { RacedayLeaderboardComponent } from "../raceday-leaderboard/raceday-leaderboard.component";
import { RacedayMenuBarComponent } from "../raceday-menu-bar/raceday-menu-bar.component";
import { RacedayRecordsComponent } from "../raceday-records/raceday-records.component";
import { RacedayTimerComponent } from "../raceday-timer/raceday-timer.component";

@Component({
  standalone: true,
  selector: "app-raceday-layout-node",
  templateUrl: "./raceday-layout-node.component.html",
  styleUrls: ["./raceday-layout-node.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    RacedayMenuBarComponent,
    RacedayInfoBarComponent,
    RacedayBrandingComponent,
    RacedayFlagComponent,
    RacedayTimerComponent,
    RacedayRecordsComponent,
    RacedayLeaderboardComponent,
    RacedayLaneViewComponent,
    RacedayLayoutNodeComponent,
  ],
})
export class RacedayLayoutNodeComponent {
  @Input() node!: LayoutNode;
  @Input() parentComponent: any;
  @Input() isCustomizing = false;

  showCompass = false;
  previewZone: "top" | "bottom" | "left" | "right" | "center" | null = null;

  private isResizing = false;
  private resizeStartSize = 50;
  private resizeStartPos = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  get splitNode(): SplitNode {
    return this.node as SplitNode;
  }

  get widgetNode(): WidgetNode {
    return this.node as WidgetNode;
  }

  // Resizing Logic
  onResizeStart(event: PointerEvent, direction: "horizontal" | "vertical") {
    event.preventDefault();
    this.isResizing = true;
    this.resizeStartSize = this.splitNode.size;
    this.resizeStartPos =
      direction === "horizontal" ? event.clientX : event.clientY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!this.isResizing) return;
      const element = event.target as HTMLElement;
      const parent = element.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const delta =
        (direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY) -
        this.resizeStartPos;
      const totalSize = direction === "horizontal" ? rect.width : rect.height;
      const percentageDelta = (delta / totalSize) * 100;

      let newSize = this.resizeStartSize + percentageDelta;
      newSize = Math.max(10, Math.min(90, newSize)); // constrain between 10% and 90%
      this.splitNode.size = Math.round(newSize);
      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      this.isResizing = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  // Drag and Drop Docking
  onDragStart(event: DragEvent) {
    if (!this.isCustomizing) return;
    this.parentComponent.draggedWidgetType = this.widgetNode.widgetType;
    this.parentComponent.draggedNode = this.node;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", this.widgetNode.widgetType);
    }
  }

  onDragOver(event: DragEvent) {
    if (!this.isCustomizing || !this.parentComponent.draggedWidgetType) return;
    // Don't dock on self
    if (this.parentComponent.draggedNode === this.node) return;
    event.preventDefault();
    this.showCompass = true;
  }

  onDragLeave(event: DragEvent) {
    // Only hide if cursor exited the main node boundary
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX >= rect.right ||
      event.clientY < rect.top ||
      event.clientY >= rect.bottom
    ) {
      this.showCompass = false;
      this.previewZone = null;
    }
  }

  setPreview(
    zone: "top" | "bottom" | "left" | "right" | "center",
    event: DragEvent,
  ) {
    event.preventDefault();
    event.stopPropagation();
    this.previewZone = zone;
  }

  clearPreview() {
    this.previewZone = null;
  }

  onDrop(event: DragEvent) {
    if (!this.isCustomizing || !this.parentComponent.draggedWidgetType) return;
    event.preventDefault();
    this.showCompass = false;
    this.previewZone = null;
  }

  dropOn(
    zone: "top" | "bottom" | "left" | "right" | "center",
    event: DragEvent,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const draggedType = this.parentComponent.draggedWidgetType;
    const draggedNode = this.parentComponent.draggedNode;

    this.showCompass = false;
    this.previewZone = null;

    if (!draggedType) return;

    this.parentComponent.dockWidget(draggedNode, this.node, zone);
  }

  removeWidget() {
    this.parentComponent.undockWidget(this.node);
  }
}
