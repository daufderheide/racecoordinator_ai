import { Component, input } from "@angular/core";
import {
  InspectorContext,
  InspectorSchema,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { LaneColumnInspectorComponent } from "@app/components/ui-editor/widget-inspector-fields/lane-column-inspector/lane-column-inspector.component";

import { layoutFolder } from "./common";

/**
 * The Lane Column inspector, shown whole inside the panel. Columns in a grid
 * stay in step through handleGridWidgetInspectorSync, which reacts to marker
 * keys this inspector writes (_syncAction, _gridTypeChanged, ...), so it is
 * kept as it is: same inputs, and its outputs go to the same editor handlers
 * (context.actions) as before.
 */
@Component({
  standalone: true,
  selector: "app-lane-column-part",
  imports: [LaneColumnInspectorComponent],
  template: `
    <app-lane-column-inspector
      class="kit-lane-column"
      [settings]="settings()"
      [widget]="widget()"
      [availableColumns]="context()?.availableColumns || []"
      [totalLanes]="context()?.totalLanes || 4"
      [selectedAnchor]="context()?.selectedAnchor ?? null"
      [selectionToken]="context()?.selectionToken ?? 0"
      [activeTab]="context()?.activeTab ?? null"
      (change)="notify()()"
      (tabChange)="context()?.actions?.tabChange?.($event)"
      (anchorChange)="context()?.actions?.anchorChange?.($event)"
      (requestReplicate)="context()?.actions?.requestReplicate?.()"
      (replicate)="context()?.actions?.replicate?.($event)"
      (editGrid)="context()?.actions?.editGrid?.($event)"
      (detachGrid)="context()?.actions?.detachGrid?.($event)"
      (deleteGrid)="context()?.actions?.deleteGrid?.($event)"
      (reMirrorGrid)="context()?.actions?.reMirrorGrid?.($event)"
      (bringGridToFront)="context()?.actions?.bringGridToFront?.($event)"
    ></app-lane-column-inspector>
  `,
})
export class LaneColumnPartComponent {
  settings = input<Record<string, any>>({});
  widget = input<any>(null);
  context = input<InspectorContext | null>(null);
  notify = input<() => void>(() => undefined);
}

/** Lane Column, Average Score and Drift Indicator share the inspector. */
export function laneColumnSchema(
  widgetType: string,
  icon: string,
): InspectorSchema {
  return {
    widgetType,
    icon,
    folders: [
      {
        id: "content",
        groups: [
          {
            fields: [
              {
                id: "laneColumn",
                type: "embed",
                component: LaneColumnPartComponent,
                labelKey: "UE_INSPECTOR_LANE_COLUMN_SETTINGS",
                searchTerms:
                  "column grid widget inset font colour color header lanes data",
              },
            ],
          },
        ],
      },
      layoutFolder(),
    ],
  };
}

export const LANE_COLUMN_SCHEMAS: Record<string, InspectorSchema> = {
  "lane-column": laneColumnSchema("lane-column", "view_column"),
  "average-score": laneColumnSchema("average-score", "functions"),
  "drift-indicator": laneColumnSchema("drift-indicator", "drive_eta"),
};
