import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import {
  applyLayoutAspectRatioChange,
  applyLayoutScaleModeChange,
  calculatePreviewScaleNumber,
  computeScaledLayout,
  getCanvasViewportMaxHeightHelper,
  getDefaultAspectRatioOptions,
  getInspectorHeightHelper,
  getLayoutAspectRatio,
  getLayoutAspectRatioOptions,
  getLayoutScaleMode,
  getLayoutZoomHelper,
  persistLayoutState,
  scaleLayoutDimensions,
  setLayoutZoomHelper,
} from "./ui-editor-resolution.helper";

describe("ui-editor-resolution.helper", () => {
  it("should scale layout dimensions and widgets proportionally", () => {
    const layout: LayoutConfig = {
      baseWidth: 1000,
      baseHeight: 500,
      widgets: [
        {
          id: "w1",
          widgetType: "lane-view",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 1,
        },
      ],
    };

    scaleLayoutDimensions(layout, 2000, 1000);
    expect(layout.baseWidth).toBe(2000);
    expect(layout.baseHeight).toBe(1000);
    expect(layout.widgets[0].x).toBe(200);
    expect(layout.widgets[0].y).toBe(100);
    expect(layout.widgets[0].width).toBe(400);
    expect(layout.widgets[0].height).toBe(200);
  });

  it("should calculate preview scale number correctly for landscape and portrait", () => {
    const scaleNoInspector = calculatePreviewScaleNumber(
      1920,
      false,
      1920,
      1080,
      2000,
    );
    const scaleWithInspector = calculatePreviewScaleNumber(
      1920,
      true,
      1920,
      1080,
      2000,
    );
    expect(scaleNoInspector).toBeGreaterThan(scaleWithInspector);

    // Portrait mode should constrain by height
    const portraitScale = calculatePreviewScaleNumber(
      1080,
      false,
      1920,
      1920,
      900,
    );
    expect(portraitScale).toBeLessThan(1920 / 1080);
  });

  it("should compute scaled layout copy", () => {
    const orig: LayoutConfig = {
      baseWidth: 1000,
      baseHeight: 500,
      widgets: [
        {
          id: "w1",
          widgetType: "lane-view",
          x: 10,
          y: 10,
          width: 100,
          height: 50,
          zIndex: 1,
        },
      ],
    };
    const scaled = computeScaledLayout(orig, 2000, 1000);
    expect(scaled.baseWidth).toBe(2000);
    expect(orig.baseWidth).toBe(1000);
  });

  it("should return default aspect ratio options with current display at the top followed by landscape and portrait groups", () => {
    const options = getDefaultAspectRatioOptions();
    expect(options.length).toBeGreaterThanOrEqual(10);
    expect(options[0].ratio).toBe("current");
    expect(options[0].label).toBe("UI_EDITOR_ASPECT_CURRENT_DISPLAY");
    expect(options[0].separator).toBeTrue();
    const landscapeOpts = options.filter((o) => o.group === "landscape");
    const portraitOpts = options.filter((o) => o.group === "portrait");
    expect(landscapeOpts.some((o) => o.ratio === "16:9")).toBeTrue();
    const opt54 = landscapeOpts.find((o) => o.ratio === "5:4");
    expect(opt54).toBeDefined();
    expect(opt54?.width).toBe(1350);
    expect(opt54?.height).toBe(1080);
    expect(opt54?.label).toBe("UI_EDITOR_ASPECT_5_4");
    expect(portraitOpts.some((o) => o.ratio === "9:16")).toBeTrue();
  });

  it("should determine layout aspect ratio from explicit field or default to current", () => {
    expect(getLayoutAspectRatio(undefined)).toBe("current");
    expect(getLayoutAspectRatio({ widgets: [] })).toBe("current");
    expect(getLayoutAspectRatio({ widgets: [], aspectRatio: "4:3" })).toBe(
      "4:3",
    );
    expect(getLayoutAspectRatio({ widgets: [], aspectRatio: "5:4" })).toBe(
      "5:4",
    );
    expect(getLayoutAspectRatio({ widgets: [], aspectRatio: "16:9" })).toBe(
      "16:9",
    );
    expect(getLayoutAspectRatio({ widgets: [], aspectRatio: "current" })).toBe(
      "current",
    );
  });

  it("should append custom aspect ratio option if layout has non-standard ratio", () => {
    const baseOptions = getDefaultAspectRatioOptions();
    const layout: LayoutConfig = {
      widgets: [],
      aspectRatio: "1234:567",
      baseWidth: 1234,
      baseHeight: 567,
    };
    const options = getLayoutAspectRatioOptions(baseOptions, layout);
    expect(options.length).toBe(baseOptions.length + 1);
    expect(options[options.length - 1].ratio).toBe("1234:567");
  });

  it("should return correct layout scale mode with default stretch", () => {
    expect(getLayoutScaleMode(undefined)).toBe("stretch");
    expect(getLayoutScaleMode({ widgets: [] })).toBe("stretch");
    expect(getLayoutScaleMode({ widgets: [], scaleMode: "letterbox" })).toBe(
      "letterbox",
    );
    expect(getLayoutScaleMode({ widgets: [], scaleMode: "stretch" })).toBe(
      "stretch",
    );
  });

  it("should apply aspect ratio change and scale layout", () => {
    const layout: LayoutConfig = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: [
        {
          id: "w1",
          widgetType: "timer",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 1,
        },
      ],
    };
    const ui: CustomUI = {
      _id: "default_ui_layout_rc_ai",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: "{}",
    };
    const settings = new Settings();
    const options = getDefaultAspectRatioOptions();

    applyLayoutAspectRatioChange("4:3", options, layout, ui, settings);
    expect(layout.aspectRatio).toBe("4:3");
    expect(layout.baseWidth).toBe(1440);
    expect(layout.baseHeight).toBe(1080);
    expect(layout.widgets[0].x).toBe(75); // 100 * (1440/1920)
    expect(settings.racedayLayout?.aspectRatio).toBe("4:3");

    applyLayoutAspectRatioChange("5:4", options, layout, ui, settings);
    expect(layout.aspectRatio).toBe("5:4");
    expect(layout.baseWidth).toBe(1350);
    expect(layout.baseHeight).toBe(1080);
    expect(settings.racedayLayout?.aspectRatio).toBe("5:4");
  });

  it("should apply scale mode change and persist", () => {
    const layout: LayoutConfig = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: [],
    };
    const ui: CustomUI = {
      _id: "default_ui_layout_rc_ai",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: "{}",
    };
    const settings = new Settings();

    applyLayoutScaleModeChange("stretch", layout, ui, settings);
    expect(layout.scaleMode).toBe("stretch");
    expect(settings.racedayLayout?.scaleMode).toBe("stretch");
  });

  it("should persist layout state to default custom UI and editingSettings", () => {
    const ui: CustomUI = {
      _id: "default_ui_layout_rc_ai",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: "{}",
    };
    const layout: LayoutConfig = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: [],
    };
    const settings = new Settings();

    const cache = new Map<string, LayoutConfig>();
    persistLayoutState(layout, ui, settings, cache);
    expect(settings.racedayLayout?.baseWidth).toBe(1920);
    expect(JSON.parse(ui.layoutJson || "{}").baseWidth).toBe(1920);
    expect(cache.get("default_ui_layout_rc_ai")?.baseWidth).toBe(1920);
  });

  it("should persist layout state to practice custom UI and editingSettings", () => {
    const ui: CustomUI = {
      _id: "practice_ui_layout_rc_ai",
      entity_id: "practice_ui_layout_rc_ai",
      name: "Practice UI",
      is_default: true,
      layoutJson: "{}",
    };
    const layout: LayoutConfig = {
      baseWidth: 1920,
      baseHeight: 1080,
      widgets: [],
    };
    const settings = new Settings();
    const cache = new Map<string, LayoutConfig>();

    persistLayoutState(layout, ui, settings, cache);
    expect(settings.practiceRacedayLayout?.baseWidth).toBe(1920);
    expect(JSON.parse(ui.layoutJson || "{}").baseWidth).toBe(1920);
    expect(cache.get("practice_ui_layout_rc_ai")?.baseWidth).toBe(1920);
  });

  it("should handle zoom map helper functions", () => {
    const zoomMap = new Map<string, number>();
    expect(getLayoutZoomHelper(zoomMap, "target1")).toBe(100);

    setLayoutZoomHelper(zoomMap, "target1", 175);
    expect(getLayoutZoomHelper(zoomMap, "target1")).toBe(175);

    setLayoutZoomHelper(zoomMap, "target1", 600);
    expect(getLayoutZoomHelper(zoomMap, "target1")).toBe(500);

    setLayoutZoomHelper(zoomMap, "target1", 10);
    expect(getLayoutZoomHelper(zoomMap, "target1")).toBe(75);
  });

  it("should calculate canvas viewport and inspector heights", () => {
    const vh = getCanvasViewportMaxHeightHelper();
    expect(vh).toBeGreaterThanOrEqual(500);

    // Inspector height clamped between 400 and viewportMaxHeight
    expect(getInspectorHeightHelper(300, 700)).toBe(400);
    expect(getInspectorHeightHelper(600, 700)).toBe(600);
    expect(getInspectorHeightHelper(900, 700)).toBe(700);
  });

  it("should calculate component preview scale and container dimensions", () => {
    const {
      getComponentPreviewScaleNumber,
      getComponentPreviewContainerWidth,
      getComponentPreviewContainerHeight,
    } = require("./ui-editor-resolution.helper");

    const comp = {
      activeCustomUi: { entity_id: "default_ui" },
      getLayout: () => ({ baseWidth: 1920, baseHeight: 1080 }),
      getLayoutZoom: () => 100,
      currentSelectedWidget: null,
      getPreviewScaleNumber: () => 0.5,
    };

    const scale = getComponentPreviewScaleNumber(comp);
    expect(scale).toBeGreaterThan(0);

    const width = getComponentPreviewContainerWidth(comp);
    expect(width).toBe(960);

    const height = getComponentPreviewContainerHeight(comp);
    expect(height).toBe(540);
  });
});
