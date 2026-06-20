import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";

import { ImageInspectorComponent } from "./image-inspector/image-inspector.component";
import { LeaderboardInspectorComponent } from "./leaderboard-inspector/leaderboard-inspector.component";
import { RecordsInspectorComponent } from "./records-inspector/records-inspector.component";
import { TimerInspectorComponent } from "./timer-inspector/timer-inspector.component";

@Component({
  standalone: true,
  selector: "app-widget-inspector-fields",
  templateUrl: "./widget-inspector-fields.component.html",
  imports: [
    CommonModule,
    LeaderboardInspectorComponent,
    RecordsInspectorComponent,
    TimerInspectorComponent,
    ImageInspectorComponent,
  ],
})
export class WidgetInspectorFieldsComponent {
  widget = input.required<AbsoluteWidgetNode>();
  change = output<void>();

  onSettingsChange() {
    this.change.emit();
  }
}
