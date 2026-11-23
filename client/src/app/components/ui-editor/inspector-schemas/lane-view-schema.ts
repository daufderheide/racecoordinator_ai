import { Component, input } from "@angular/core";
import {
  InspectorContext,
  InspectorSchema,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { LaneViewInspectorComponent } from "@app/components/ui-editor/widget-inspector-fields/lane-view-inspector/lane-view-inspector.component";

import { frameFolder, layoutFolder, textPart } from "./common";

/**
 * The Lane View's column manager, shown as-is inside the panel's Columns
 * folder. It is the old inspector in "columns only" mode, so the columns keep
 * working exactly as before (order, widths, labels, time options, dragging a
 * new column onto the canvas) and are saved in the same three places.
 */
@Component({
  standalone: true,
  selector: "app-lane-view-columns-part",
  imports: [LaneViewInspectorComponent],
  template: `
    <app-lane-view-inspector
      class="kit-lane-view-columns"
      [columnsOnly]="true"
      [settings]="settings()"
      [widget]="widget()"
      [globalSettings]="context()?.globalSettings"
      [customUi]="context()?.customUi"
      [availableColumns]="context()?.availableColumns || []"
      [isPracticeMode]="!!context()?.isPracticeMode"
      (change)="notify()()"
    ></app-lane-view-inspector>
  `,
})
export class LaneViewColumnsPartComponent {
  settings = input<Record<string, any>>({});
  widget = input<any>(null);
  context = input<InspectorContext | null>(null);
  notify = input<() => void>(() => undefined);
}

const HIGHLIGHT_STYLES = [
  ["none", "UE_INSPECTOR_HIGHLIGHT_STYLE_NONE"],
  ["classic", "UE_INSPECTOR_HIGHLIGHT_STYLE_CLASSIC"],
  ["full-glow", "UE_INSPECTOR_HIGHLIGHT_STYLE_FULL_GLOW"],
  ["glow-border", "UE_INSPECTOR_HIGHLIGHT_STYLE_GLOW_BORDER"],
  ["tint-wash", "UE_INSPECTOR_HIGHLIGHT_STYLE_TINT_WASH"],
  ["shimmer", "UE_INSPECTOR_HIGHLIGHT_STYLE_SHIMMER"],
  ["scale-pulse", "UE_INSPECTOR_HIGHLIGHT_STYLE_SCALE_PULSE"],
  ["adaptive-dip", "UE_INSPECTOR_HIGHLIGHT_STYLE_ADAPTIVE_DIP"],
] as const;

const decimals = [0, 1, 2, 3].map((v) => ({ value: v, label: String(v) }));

export const laneViewSchema: InspectorSchema = {
  widgetType: "lane-view",
  icon: "view_list",
  folders: [
    {
      id: "content",
      groups: [
        {
          titleKey: "UE_KIT_GROUP_DISPLAY",
          fields: [
            {
              id: "isVertical",
              type: "switch",
              key: "isVertical",
              labelKey: "UE_INSPECTOR_LANE_VIEW_VERTICAL_LAYOUT",
              searchTerms: "vertical layout rows columns orientation",
            },
            {
              id: "sortByStandings",
              type: "switch",
              key: "sortByStandings",
              labelKey: "UE_INSPECTOR_LANE_VIEW_SORT_BY_STANDINGS",
              searchTerms: "sort order standings position",
              // practice has no standings, as in the old inspector
              visibleWhen: (_s, c) => !c?.isPracticeMode,
            },
            {
              id: "highlightLapStyle",
              type: "select",
              key: "highlightLapStyle",
              labelKey: "UE_INSPECTOR_LANE_VIEW_HIGHLIGHT_LAP",
              options: HIGHLIGHT_STYLES.map(([value, labelKey]) => ({
                value,
                labelKey,
              })),
              touches: ["highlightRowOnLap"],
              searchTerms: "highlight lap flash glow shimmer animation",
              // older layouts only have highlightRowOnLap; both are kept in step
              read: (s) =>
                s?.["highlightLapStyle"] !== undefined
                  ? s["highlightLapStyle"]
                  : s?.["highlightRowOnLap"] === false
                    ? "none"
                    : "classic",
              write: (s, v) => {
                s["highlightLapStyle"] = v;
                s["highlightRowOnLap"] = v !== "none";
              },
            },
          ],
        },
        {
          titleKey: "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
          fields: [
            {
              id: "insetTimeDecimalPlaces",
              type: "segment",
              key: "insetTimeDecimalPlaces",
              labelKey: "UE_KIT_TIME_DECIMALS",
              options: decimals,
              searchTerms: "inset time decimals precision number format",
            },
            {
              id: "insetLapDecimalPlaces",
              type: "segment",
              key: "insetLapDecimalPlaces",
              labelKey: "UE_KIT_LAP_DECIMALS",
              options: decimals,
              searchTerms: "inset lap decimals precision number format",
            },
          ],
        },
      ],
    },
    {
      id: "columns",
      groups: [
        {
          fields: [
            {
              id: "laneViewColumns",
              type: "embed",
              component: LaneViewColumnsPartComponent,
              labelKey: "UE_KIT_FOLDER_COLUMNS",
              searchTerms:
                "columns add remove order width label time format drag",
            },
          ],
        },
      ],
    },
    {
      id: "text",
      groups: [
        {
          fields: [
            textPart("headers", "UE_KIT_PART_COLUMN_HEADERS", "column", {
              sizeMin: 10,
              sizeMax: 120,
              sample: "LAP TIME",
            }),
            {
              ...textPart("data", "UE_KIT_PART_DATA", "data", {
                sizeMin: 10,
                sizeMax: 120,
                sample: "2.100",
              }),
              // the old inspector had no colour for the data and inset text
              keys: { font: "dataFontFamily", size: "dataFontSize" },
            },
            {
              ...textPart("inset", "UE_KIT_PART_INSET", "inset", {
                sizeMin: 10,
                sizeMax: 120,
                sample: "2.300",
              }),
              keys: { font: "insetFontFamily", size: "insetFontSize" },
            },
          ],
        },
      ],
    },
    frameFolder(),
    layoutFolder(),
  ],
};
