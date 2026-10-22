import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridDetachHelper } from "./lane-grid-detach.helper";

describe("LaneGridDetachHelper", () => {
  const baseGridWidgets: AbsoluteWidgetNode[] = [
    {
      id: "widget-1",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      zIndex: 10,
      customSettings: {
        gridId: "grid-test",
        gridLane: 0,
        gridTotalLanes: 2,
        gridDirection: "vertical",
        gridLabelPosition: "top",
        gridLabelText: "Leaderboard Title",
        gridLabelFontSize: 20,
        gridLabelFontFamily: "Roboto",
        gridLabelTextColor: "#ffff00",
        gridLabelBackgroundColor: "#112233",
        gridLabelFontBold: true,
        gridLabelFontItalic: true,
        gridLabelAlignment: "start",
        gridLabelShowBorder: true,
        gridLabelBorderColor: "#ff0000",
        gridLabelBorderWidth: 2,
        gridLabelBorderRadius: 6,
        columnKey: "driver.name",
      },
    },
    {
      id: "widget-2",
      widgetType: "lane-column",
      x: 100,
      y: 200,
      width: 200,
      height: 80,
      zIndex: 11,
      customSettings: {
        gridId: "grid-test",
        gridLane: 1,
        gridTotalLanes: 2,
        gridDirection: "vertical",
        columnKey: "driver.name",
      },
    },
  ];

  it("should return empty/unchanged array when widgets or gridId is missing", () => {
    expect(LaneGridDetachHelper.detachGrid([], "grid-test")).toEqual([]);
    expect(LaneGridDetachHelper.detachGrid(baseGridWidgets, "")).toEqual(
      baseGridWidgets,
    );
  });

  it("should detach grid without creating title widget if labelPosition is none", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        ...baseGridWidgets[0],
        customSettings: {
          ...baseGridWidgets[0].customSettings,
          gridLabelPosition: "none",
        },
      },
      baseGridWidgets[1],
    ];

    const result = LaneGridDetachHelper.detachGrid(widgets, "grid-test");
    expect(result.length).toBe(2);
    expect(result[0].customSettings?.["gridId"]).toBeUndefined();
    expect(result[0].customSettings?.["columnKey"]).toBe("driver.name");
    expect(result[1].customSettings?.["gridId"]).toBeUndefined();
    expect(result.some((w) => w.widgetType === "label")).toBeFalse();
  });

  it("should create standalone label widget with matching style properties when labelPosition is set", () => {
    const result = LaneGridDetachHelper.detachGrid(
      baseGridWidgets,
      "grid-test",
    );

    // 2 original widgets + 1 new label widget
    expect(result.length).toBe(3);

    const titleWidget = result.find((w) => w.widgetType === "label");
    expect(titleWidget).toBeDefined();
    expect(titleWidget?.customSettings?.["text"]).toBe("Leaderboard Title");
    expect(titleWidget?.customSettings?.["fontSize"]).toBe(20);
    expect(titleWidget?.customSettings?.["fontFamily"]).toBe("Roboto");
    expect(titleWidget?.customSettings?.["textColor"]).toBe("#ffff00");
    expect(titleWidget?.customSettings?.["backgroundColor"]).toBe("#112233");
    expect(titleWidget?.customSettings?.["fontBold"]).toBeTrue();
    expect(titleWidget?.customSettings?.["fontItalic"]).toBeTrue();
    expect(titleWidget?.customSettings?.["alignment"]).toBe("start");
    expect(titleWidget?.customSettings?.["showBorder"]).toBeTrue();
    expect(titleWidget?.customSettings?.["borderColor"]).toBe("#ff0000");
    expect(titleWidget?.customSettings?.["borderWidth"]).toBe(2);
    expect(titleWidget?.customSettings?.["borderRadius"]).toBe(6);
    expect(titleWidget?.customSettings?.["vertical"]).toBeFalse();
    expect(titleWidget?.zIndex).toBeGreaterThan(11);

    // Stripped original widgets
    expect(result[0].customSettings?.["gridId"]).toBeUndefined();
    expect(result[0].customSettings?.["gridLabelText"]).toBeUndefined();
    expect(result[1].customSettings?.["gridId"]).toBeUndefined();
  });

  it("should mark vertical true when labelPosition is left or right", () => {
    const widgets: AbsoluteWidgetNode[] = [
      {
        ...baseGridWidgets[0],
        customSettings: {
          ...baseGridWidgets[0].customSettings,
          gridLabelPosition: "left",
        },
      },
      baseGridWidgets[1],
    ];

    const result = LaneGridDetachHelper.detachGrid(widgets, "grid-test");
    const titleWidget = result.find((w) => w.widgetType === "label");
    expect(titleWidget).toBeDefined();
    expect(titleWidget?.customSettings?.["vertical"]).toBeTrue();
  });

  it("should default showBorder to true on detached label widget when gridLabelShowBorder is omitted", () => {
    const widgetsWithoutBorder: AbsoluteWidgetNode[] = [
      {
        ...baseGridWidgets[0],
        customSettings: {
          ...baseGridWidgets[0].customSettings,
          gridLabelShowBorder: undefined,
        },
      },
      baseGridWidgets[1],
    ];

    const result = LaneGridDetachHelper.detachGrid(
      widgetsWithoutBorder,
      "grid-test",
    );
    const titleWidget = result.find((w) => w.widgetType === "label");
    expect(titleWidget?.customSettings?.["showBorder"]).toBeTrue();
  });

  it("should set showBorder to false on detached label widget when gridLabelShowBorder is explicitly false", () => {
    const widgetsWithBorderFalse: AbsoluteWidgetNode[] = [
      {
        ...baseGridWidgets[0],
        customSettings: {
          ...baseGridWidgets[0].customSettings,
          gridLabelShowBorder: false,
        },
      },
      baseGridWidgets[1],
    ];

    const result = LaneGridDetachHelper.detachGrid(
      widgetsWithBorderFalse,
      "grid-test",
    );
    const titleWidget = result.find((w) => w.widgetType === "label");
    expect(titleWidget?.customSettings?.["showBorder"]).toBeFalse();
  });
});
