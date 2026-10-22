import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { CustomUI } from "@app/models/custom-ui";
import { AbsoluteWidgetNode, Settings } from "@app/models/settings";

import { ActionButtonInspectorComponent } from "./action-button-inspector/action-button-inspector.component";
import { CountdownInspectorComponent } from "./countdown-inspector/countdown-inspector.component";
import { CustomWidgetInspectorComponent } from "./custom-widget-inspector/custom-widget-inspector.component";
import { HeatListInspectorComponent } from "./heat-list-inspector/heat-list-inspector.component";
import { ImageInspectorComponent } from "./image-inspector/image-inspector.component";
import { LabelInspectorComponent } from "./label-inspector/label-inspector.component";
import { LaneColumnInspectorComponent } from "./lane-column-inspector/lane-column-inspector.component";
import { LaneViewInspectorComponent } from "./lane-view-inspector/lane-view-inspector.component";
import { LeaderboardInspectorComponent } from "./leaderboard-inspector/leaderboard-inspector.component";
import { MenuInspectorComponent } from "./menu-inspector/menu-inspector.component";
import { RecordsInspectorComponent } from "./records-inspector/records-inspector.component";
import { TextInfoInspectorComponent } from "./text-info-inspector/text-info-inspector.component";
import { TimerInspectorComponent } from "./timer-inspector/timer-inspector.component";
import { UpcomingInspectorComponent } from "./upcoming-inspector/upcoming-inspector.component";

@Component({
  standalone: true,
  selector: "app-widget-inspector-fields",
  templateUrl: "./widget-inspector-fields.component.html",
  imports: [
    CommonModule,
    LeaderboardInspectorComponent,
    LaneViewInspectorComponent,
    LaneColumnInspectorComponent,
    RecordsInspectorComponent,
    TimerInspectorComponent,
    CountdownInspectorComponent,
    ImageInspectorComponent,
    LabelInspectorComponent,
    UpcomingInspectorComponent,
    HeatListInspectorComponent,
    TextInfoInspectorComponent,
    MenuInspectorComponent,
    ActionButtonInspectorComponent,
    CustomWidgetInspectorComponent,
  ],
})
export class WidgetInspectorFieldsComponent {
  widget = input.required<AbsoluteWidgetNode>();
  globalSettings = input<Settings>();
  customUi = input<CustomUI>();
  availableColumns = input<{ key: string; label: string }[]>([]);
  isPracticeMode = input<boolean>(false);
  selectedAnchor = input<string | null>(null);
  anchorChange = output<string | null>();
  change = output<AbsoluteWidgetNode>();
  replicate = output<any>();
  requestReplicate = output<void>();
  editGrid = output<string>();
  detachGrid = output<string>();
  deleteGrid = output<string>();
  reMirrorGrid = output<string>();
  bringGridToFront = output<string>();

  isCustomWidget(type: string | undefined): boolean {
    return type?.startsWith("custom:") ?? false;
  }

  onAnchorChange(anchor: string | null): void {
    this.anchorChange.emit(anchor);
  }

  isLaneColumnWidget(widget: AbsoluteWidgetNode | undefined): boolean {
    if (!widget) return false;
    if (widget.widgetType === "lane-column") return true;
    if (widget.customSettings?.["gridId"]) return true;
    if (this.isCustomWidget(widget.widgetType)) {
      const s = widget.customSettings;
      return Boolean(
        s?.["gridId"] ||
        s?.["bindingMode"] !== undefined ||
        s?.["gridLane"] !== undefined ||
        s?.["targetIndex"] !== undefined ||
        (s?.["insets"] && Object.values(s["insets"]).some((v) => Boolean(v))),
      );
    }
    return false;
  }

  onSettingsChange(node?: AbsoluteWidgetNode) {
    this.change.emit(node || this.widget());
  }
}
