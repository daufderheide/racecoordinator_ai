import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";

import { LeaderboardInspectorComponent } from "./leaderboard-inspector/leaderboard-inspector.component";

@Component({
  standalone: true,
  selector: "app-widget-inspector-fields",
  templateUrl: "./widget-inspector-fields.component.html",
  imports: [CommonModule, LeaderboardInspectorComponent],
})
export class WidgetInspectorFieldsComponent {
  widget = input.required<AbsoluteWidgetNode>();
  change = output<void>();

  onSettingsChange() {
    this.change.emit();
  }
}
