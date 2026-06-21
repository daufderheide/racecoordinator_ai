import { CdkDrag, CdkDragHandle, CdkDropList } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-lane-view",
  templateUrl: "./raceday-lane-view.component.html",
  styleUrls: ["./raceday-lane-view.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TranslatePipe,
    FormsModule,
  ],
})
export class RacedayLaneViewComponent {
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  getHeaderHeight(): number {
    const columnFontSize = this.widget()?.customSettings?.["columnFontSize"];
    return columnFontSize ? Math.max(36, Number(columnFontSize) + 12) : 36;
  }
}
