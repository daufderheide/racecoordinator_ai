import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  input,
  ViewEncapsulation,
} from "@angular/core";
import { RacedayBrandingComponent } from "@app/components/raceday/components/raceday-branding/raceday-branding.component";
import { RacedayFlagComponent } from "@app/components/raceday/components/raceday-flag/raceday-flag.component";
import { RacedayGroupLeaderboardComponent } from "@app/components/raceday/components/raceday-group-leaderboard/raceday-group-leaderboard.component";
import { RacedayHeatInfoComponent } from "@app/components/raceday/components/raceday-heat-info/raceday-heat-info.component";
import { RacedayLaneViewComponent } from "@app/components/raceday/components/raceday-lane-view/raceday-lane-view.component";
import { RacedayLeaderboardComponent } from "@app/components/raceday/components/raceday-leaderboard/raceday-leaderboard.component";
import { RacedayMenuBarComponent } from "@app/components/raceday/components/raceday-menu-bar/raceday-menu-bar.component";
import { RacedayNextHeatComponent } from "@app/components/raceday/components/raceday-next-heat/raceday-next-heat.component";
import { RacedayOnDeckComponent } from "@app/components/raceday/components/raceday-on-deck/raceday-on-deck.component";
import { RacedayQrComponent } from "@app/components/raceday/components/raceday-qr/raceday-qr.component";
import { RacedayRaceNameComponent } from "@app/components/raceday/components/raceday-race-name/raceday-race-name.component";
import { RacedayRecordsComponent } from "@app/components/raceday/components/raceday-records/raceday-records.component";
import { RacedayTimerComponent } from "@app/components/raceday/components/raceday-timer/raceday-timer.component";
import { RacedayTrackNameComponent } from "@app/components/raceday/components/raceday-track-name/raceday-track-name.component";
import { AbsoluteWidgetNode } from "@app/models/settings";

@Component({
  standalone: true,
  selector: "app-raceday-absolute-widget",
  templateUrl: "./raceday-absolute-widget.component.html",
  styleUrls: ["./raceday-absolute-widget.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    DragDropModule,
    RacedayMenuBarComponent,
    RacedayRaceNameComponent,
    RacedayHeatInfoComponent,
    RacedayTrackNameComponent,
    RacedayBrandingComponent,
    RacedayQrComponent,
    RacedayFlagComponent,
    RacedayTimerComponent,
    RacedayRecordsComponent,
    RacedayLeaderboardComponent,
    RacedayGroupLeaderboardComponent,
    RacedayLaneViewComponent,
    RacedayOnDeckComponent,
    RacedayNextHeatComponent,
  ],
})
export class RacedayAbsoluteWidgetComponent {
  widget = input.required<AbsoluteWidgetNode>();
  parentComponent = input<any>(undefined);
  isCustomizing = input<boolean>(false);

  private isResizing = false;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private startPointerX = 0;
  private startPointerY = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  onResizeStart(event: PointerEvent, handle: string) {
    if (!this.isCustomizing()) return;
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizeStartWidth = this.widget().width;
    this.resizeStartHeight = this.widget().height;
    this.resizeStartX = this.widget().x;
    this.resizeStartY = this.widget().y;
    this.startPointerX = event.clientX;
    this.startPointerY = event.clientY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!this.isResizing) return;

      const scale = this.parentComponent().visualScale || 1;
      const deltaX = (moveEvent.clientX - this.startPointerX) / scale;
      const deltaY = (moveEvent.clientY - this.startPointerY) / scale;

      let newW = this.resizeStartWidth;
      let newH = this.resizeStartHeight;
      let newX = this.resizeStartX;
      let newY = this.resizeStartY;

      if (handle.includes("e")) newW += deltaX;
      if (handle.includes("w")) {
        newW -= deltaX;
        newX += deltaX;
      }
      if (handle.includes("s")) newH += deltaY;
      if (handle.includes("n")) {
        newH -= deltaY;
        newY += deltaY;
      }

      if (newW < 50) {
        if (handle.includes("w")) newX -= 50 - newW;
        newW = 50;
      }
      if (newH < 50) {
        if (handle.includes("n")) newY -= 50 - newH;
        newH = 50;
      }

      let snapped = { x: newX, y: newY, w: newW, h: newH };
      if (this.parentComponent().snapToEdges) {
        snapped = this.parentComponent().snapToEdges(
          newX,
          newY,
          newW,
          newH,
          this.widget().id,
          handle,
        );
      }

      this.widget().x = snapped.x;
      this.widget().y = snapped.y;
      this.widget().width = snapped.w;
      this.widget().height = snapped.h;

      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      this.isResizing = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (this.parentComponent().layoutChanged) {
        this.parentComponent().layoutChanged.emit(
          this.parentComponent().layout,
        );
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  // Handle dragging manually to support snapping better than cdkDrag might out of the box
  onDragStart(event: PointerEvent) {
    if (!this.isCustomizing()) return;
    // Don't drag if clicking a resize handle
    if ((event.target as HTMLElement).classList.contains("resize-handle"))
      return;
    if ((event.target as HTMLElement).tagName === "BUTTON") return;

    event.preventDefault();
    event.stopPropagation();

    this.bringToFront();

    const scale = this.parentComponent().visualScale || 1;
    const startX = event.clientX;
    const startY = event.clientY;
    const initialWidgetX = this.widget().x;
    const initialWidgetY = this.widget().y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let newX = initialWidgetX + deltaX;
      let newY = initialWidgetY + deltaY;

      let snapped = {
        x: newX,
        y: newY,
        w: this.widget().width,
        h: this.widget().height,
      };
      if (this.parentComponent().snapToEdges) {
        snapped = this.parentComponent().snapToEdges(
          newX,
          newY,
          this.widget().width,
          this.widget().height,
          this.widget().id,
          "all",
        );
      }

      this.widget().x = snapped.x;
      this.widget().y = snapped.y;
      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (this.parentComponent().layoutChanged) {
        this.parentComponent().layoutChanged.emit(
          this.parentComponent().layout,
        );
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  moveForward(event: Event) {
    event.stopPropagation();
    if (this.parentComponent().moveWidgetForward) {
      this.parentComponent().moveWidgetForward(this.widget().id);
    }
  }

  moveBackward(event: Event) {
    event.stopPropagation();
    if (this.parentComponent().moveWidgetBackward) {
      this.parentComponent().moveWidgetBackward(this.widget().id);
    }
  }

  removeWidget(event: Event) {
    event.stopPropagation();
    if (this.parentComponent().removeWidget) {
      this.parentComponent().removeWidget(this.widget().id);
    }
  }

  bringToFront() {
    if (this.parentComponent() && this.parentComponent().bringToFront) {
      this.parentComponent().bringToFront(this.widget().id);
    }
  }
}
