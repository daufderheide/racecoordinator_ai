import { InspectorSchema } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { ensureCountdownDefaults } from "@app/components/ui-editor/widget-inspector-fields/countdown-inspector/countdown-defaults";

import { frameFolder, layoutFolder } from "./common";

/**
 * Phase 2, batch 3: Countdown and Menu Bar. Keys, ranges and options are the
 * old inspectors' ones, so nothing changes in what a layout stores.
 */

const isGlow = (s: Record<string, any>) => s["glowEffect"] !== false;
const isCustomSize = (s: Record<string, any>) =>
  (s["lampSizingMode"] || "custom") === "custom";
const isCustomBlur = (s: Record<string, any>) => s["blurArea"] === "custom";

const countdownSchema: InspectorSchema = {
  widgetType: "countdown",
  icon: "traffic",
  // The old inspector filled missing defaults and converted an old lampScale
  // every time it opened; the panel does the same with the same function.
  onOpen: (settings, context) =>
    ensureCountdownDefaults(settings, context.widget),
  folders: [
    {
      id: "content",
      groups: [
        {
          titleKey: "UE_INSPECTOR_COUNTDOWN_LAMPS",
          fields: [
            {
              id: "orientation",
              type: "segment",
              key: "orientation",
              labelKey: "UE_INSPECTOR_COUNTDOWN_ORIENTATION",
              options: [
                {
                  value: "horizontal",
                  labelKey: "UE_INSPECTOR_COUNTDOWN_ORIENTATION_HORIZONTAL",
                },
                {
                  value: "vertical",
                  labelKey: "UE_INSPECTOR_COUNTDOWN_ORIENTATION_VERTICAL",
                },
              ],
              searchTerms: "orientation horizontal vertical direction",
            },
            {
              id: "maxLamps",
              type: "segment",
              key: "maxLamps",
              labelKey: "UE_INSPECTOR_COUNTDOWN_MAX_LAMPS",
              options: [3, 4, 5, 6, 7, 8, 9, 10].map((v) => ({
                value: v,
                label: String(v),
              })),
              touches: ["previewLampCount"],
              searchTerms: "lamps lights count number",
              // older layouts may only have previewLampCount
              read: (s) =>
                Number(s?.["maxLamps"] ?? s?.["previewLampCount"]) || 5,
              write: (s, v) => {
                const count = Number(v) || 5;
                s["maxLamps"] = count;
                s["previewLampCount"] = count;
              },
            },
            {
              id: "lampSizingMode",
              type: "segment",
              key: "lampSizingMode",
              labelKey: "UE_INSPECTOR_COUNTDOWN_SIZING_MODE",
              options: [
                {
                  value: "custom",
                  labelKey: "UE_INSPECTOR_COUNTDOWN_SIZING_CUSTOM",
                },
                { value: "fit", labelKey: "UE_INSPECTOR_COUNTDOWN_SIZING_FIT" },
              ],
              searchTerms: "size sizing fit scale lamps",
            },
            {
              id: "lampScale",
              type: "stepper",
              key: "lampScale",
              labelKey: "UE_INSPECTOR_COUNTDOWN_LAMP_SCALE",
              min: 10,
              max: 300,
              step: 5,
              unit: "%",
              visibleWhen: isCustomSize,
              searchTerms: "lamp size scale bigger smaller",
              // stored as a factor (1.0), shown as a percentage (100 %)
              read: (s) => Math.round(Number(s?.["lampScale"] ?? 1) * 100),
              write: (s, v) => {
                const pct = Math.max(10, Math.min(300, Number(v) || 100));
                s["lampScale"] = Math.round(pct) / 100;
              },
            },
            {
              id: "fadeIn",
              type: "switch",
              key: "fadeIn",
              labelKey: "UE_INSPECTOR_COUNTDOWN_FADE_IN",
              searchTerms: "fade animation lamps appear",
            },
          ],
        },
      ],
    },
    {
      id: "frame",
      // no Fill group: the Countdown is always drawn without a background
      groups: [
        ...frameFolder().groups.filter(
          (g) => g.titleKey !== "UE_KIT_GROUP_FILL",
        ),
        {
          titleKey: "UE_INSPECTOR_COUNTDOWN_GLOW",
          fields: [
            {
              id: "glowEffect",
              type: "switch",
              key: "glowEffect",
              labelKey: "UE_INSPECTOR_COUNTDOWN_ENABLE_GLOW",
              searchTerms: "glow light halo",
            },
            {
              id: "glowIntensity",
              type: "stepper",
              key: "glowIntensity",
              labelKey: "UE_INSPECTOR_COUNTDOWN_GLOW_INTENSITY",
              min: 10,
              max: 100,
              step: 5,
              unit: "%",
              visibleWhen: isGlow,
              searchTerms: "glow intensity strength",
            },
            {
              id: "glowRedOverlap",
              type: "stepper",
              key: "glowRedOverlap",
              labelKey: "UE_INSPECTOR_COUNTDOWN_GLOW_RED_OVERLAP",
              min: 0,
              max: 100,
              step: 5,
              unit: "%",
              touches: ["glowOverlap"],
              visibleWhen: isGlow,
              searchTerms: "glow red overlap",
              // older layouts only have glowOverlap; both are kept in step
              read: (s) => {
                const v = s?.["glowRedOverlap"] ?? s?.["glowOverlap"];
                return typeof v === "number"
                  ? Math.max(0, Math.min(100, v))
                  : 30;
              },
              write: (s, v) => {
                const n = Number(v);
                s["glowRedOverlap"] = n;
                s["glowOverlap"] = n;
              },
            },
            {
              id: "glowGreenOverlap",
              type: "stepper",
              key: "glowGreenOverlap",
              labelKey: "UE_INSPECTOR_COUNTDOWN_GLOW_GREEN_OVERLAP",
              min: 0,
              max: 100,
              step: 5,
              unit: "%",
              visibleWhen: isGlow,
              searchTerms: "glow green overlap",
            },
          ],
        },
      ],
    },
    layoutFolder(),
    {
      id: "behaviour",
      groups: [
        {
          titleKey: "UE_INSPECTOR_COUNTDOWN_BLUR",
          fields: [
            {
              id: "blurArea",
              type: "select",
              key: "blurArea",
              labelKey: "UE_INSPECTOR_COUNTDOWN_BLUR_AREA",
              options: [
                {
                  value: "fullscreen",
                  labelKey: "UE_INSPECTOR_COUNTDOWN_BLUR_FULLSCREEN",
                },
                {
                  value: "widget",
                  labelKey: "UE_INSPECTOR_COUNTDOWN_BLUR_WIDGET",
                },
                {
                  value: "custom",
                  labelKey: "UE_INSPECTOR_COUNTDOWN_BLUR_CUSTOM",
                },
                { value: "none", labelKey: "UE_INSPECTOR_COUNTDOWN_BLUR_NONE" },
              ],
              searchTerms: "blur background behind countdown area",
            },
            {
              id: "blurAmount",
              type: "stepper",
              key: "blurAmount",
              labelKey: "UE_INSPECTOR_COUNTDOWN_BLUR_AMOUNT",
              min: 0,
              max: 100,
              unit: "%",
              visibleWhen: (s) => (s["blurArea"] || "fullscreen") !== "none",
              searchTerms: "blur amount strength",
            },
            ...(
              [
                ["blurCustomX", "UE_INSPECTOR_COUNTDOWN_BLUR_X", 3840],
                ["blurCustomY", "UE_INSPECTOR_COUNTDOWN_BLUR_Y", 2160],
                ["blurCustomWidth", "UE_INSPECTOR_COUNTDOWN_BLUR_WIDTH", 3840],
                [
                  "blurCustomHeight",
                  "UE_INSPECTOR_COUNTDOWN_BLUR_HEIGHT",
                  2160,
                ],
              ] as const
            ).map(([key, labelKey, max]) => ({
              id: key,
              type: "stepper" as const,
              key,
              labelKey,
              min: 0,
              max,
              unit: "px",
              visibleWhen: isCustomBlur,
              searchTerms: "blur custom area position size",
            })),
          ],
        },
      ],
    },
  ],
};

/**
 * The Menu Bar keeps its font, size and text colour on the widget itself (the
 * widget wrapper draws them from there). The background is kept on both the
 * widget and customSettings, as the old inspector did; the wrapper reads
 * customSettings first.
 */
const menuBarSchema: InspectorSchema = {
  widgetType: "menu-bar",
  icon: "menu",
  folders: [
    {
      id: "text",
      groups: [
        {
          fields: [
            {
              id: "menu",
              type: "textPart",
              labelKey: "UE_KIT_PART_MENU",
              keys: {
                font: "fontFamily",
                size: "fontSize",
                color: "textColor",
              },
              on: "widget",
              sizeMin: 8,
              sizeMax: 120,
              // a new widget gets fontSize 24 on the widget itself when it is dropped
              keyDefaults: { font: "", size: 24, color: "" },
              sample: "Race  Options  Help",
              searchTerms: "font size colour color menu text",
            },
          ],
        },
      ],
    },
    {
      ...frameFolder(),
      groups: frameFolder().groups.map((g, i) =>
        i === 0
          ? {
              ...g,
              fields: g.fields.map((f) =>
                f.id === "backgroundColor" ? { ...f, on: "both" as const } : f,
              ),
            }
          : g,
      ),
    },
    layoutFolder(),
  ],
};

export const BATCH3_SCHEMAS: Record<string, InspectorSchema> = {
  countdown: countdownSchema,
  "menu-bar": menuBarSchema,
};
