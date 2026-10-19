import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridStyleHelper } from "./lane-grid-style.helper";

describe("LaneGridStyleHelper", () => {
  const gridId = "style-grid";
  const widgets: AbsoluteWidgetNode[] = [
    {
      id: "w-0",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      customSettings: {
        gridId,
        gridLane: 0,
        linkColumns: true,
      },
    },
    {
      id: "w-1",
      widgetType: "lane-column",
      x: 100,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      customSettings: {
        gridId,
        gridLane: 1,
        linkColumns: true,
      },
    },
  ];

  it("should sync header properties across columns", () => {
    const updated = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "header",
      { headerTextColor: "#ff0000" },
      widgets,
    );
    expect(updated[0].customSettings?.["headerTextColor"]).toBe("#ff0000");
    expect(updated[1].customSettings?.["headerTextColor"]).toBe("#ff0000");
  });

  it("should update linkColumns flag across grid widgets", () => {
    const updated = LaneGridStyleHelper.updateGridLinkColumns(
      widgets,
      gridId,
      false,
    );
    expect(updated[0].customSettings?.["linkColumns"]).toBeFalse();
    expect(updated[1].customSettings?.["linkColumns"]).toBeFalse();
  });

  it("should update sortByBindingMode flag across grid widgets", () => {
    const updated = LaneGridStyleHelper.updateGridSortByBindingMode(
      widgets,
      gridId,
      true,
    );
    expect(updated[0].customSettings?.["sortByBindingMode"]).toBeTrue();
    expect(updated[1].customSettings?.["sortByBindingMode"]).toBeTrue();
  });

  it("should update grid sort order across grid widgets", () => {
    const updated = LaneGridStyleHelper.updateGridSortOrder(
      widgets,
      gridId,
      "position",
    );
    expect(updated[0].customSettings?.["bindingMode"]).toBe("position");
    expect(updated[1].customSettings?.["bindingMode"]).toBe("position");
  });

  it("should sync existing gridType across widgets during updateGridSortOrder", () => {
    const mixedWidgets: AbsoluteWidgetNode[] = [
      {
        ...widgets[0],
        customSettings: { ...widgets[0].customSettings, gridType: "heat" },
      },
      {
        ...widgets[1],
        customSettings: { ...widgets[1].customSettings },
      },
    ];
    const updated = LaneGridStyleHelper.updateGridSortOrder(
      mixedWidgets,
      gridId,
      "overallPosition",
    );
    expect(updated[0].customSettings?.["bindingMode"]).toBe("overallPosition");
    expect(updated[1].customSettings?.["bindingMode"]).toBe("overallPosition");
    expect(updated[1].customSettings?.["gridType"]).toBe("heat");
  });

  it("should update layoutOrientation across grid widgets", () => {
    const updated = LaneGridStyleHelper.updateGridLayoutOrientation(
      widgets,
      gridId,
      "horizontal",
    );
    expect(updated[0].customSettings?.["layoutOrientation"]).toBe("horizontal");
    expect(updated[1].customSettings?.["layoutOrientation"]).toBe("horizontal");
  });

  it("should update gridType across grid widgets", () => {
    const updated = LaneGridStyleHelper.updateGridType(
      widgets,
      gridId,
      "overall",
    );
    expect(updated[0].customSettings?.["gridType"]).toBe("overall");
    expect(updated[1].customSettings?.["gridType"]).toBe("overall");
  });

  it("should not overwrite useLaneColors, backgroundColor, or textColor when syncing border properties", () => {
    const dataWidgets: AbsoluteWidgetNode[] = [
      {
        id: "w-0",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          useLaneColors: true,
          backgroundColor: "#112233",
          textColor: "#ffffff",
        },
      },
      {
        id: "w-1",
        widgetType: "lane-column",
        x: 100,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 1,
          useLaneColors: true,
          backgroundColor: "#445566",
          textColor: "#ffffff",
        },
      },
    ];

    const updated = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "border",
      {
        showBorder: true,
        borderColor: "#ff0000",
        borderWidth: 2,
        borderRadius: 4,
        useLaneColors: false,
        backgroundColor: "#000000",
        textColor: "#000000",
      },
      dataWidgets,
    );

    expect(updated[0].customSettings?.["showBorder"]).toBeTrue();
    expect(updated[0].customSettings?.["borderColor"]).toBe("#ff0000");
    expect(updated[0].customSettings?.["useLaneColors"]).toBeTrue();
    expect(updated[0].customSettings?.["backgroundColor"]).toBe("#112233");
    expect(updated[1].customSettings?.["showBorder"]).toBeTrue();
    expect(updated[1].customSettings?.["useLaneColors"]).toBeTrue();
    expect(updated[1].customSettings?.["backgroundColor"]).toBe("#445566");
  });

  it("should not sync data properties to or from header widgets", () => {
    const mixedWidgets: AbsoluteWidgetNode[] = [
      {
        id: "data-0",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          valueFontSize: 16,
        },
      },
      {
        id: "header-0",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        zIndex: 2,
        customSettings: {
          gridId,
          isHeaderWidget: true,
        },
      },
    ];

    // Data to header
    const updated1 = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "value",
      { valueFontSize: 24 },
      mixedWidgets,
    );
    expect(updated1[0].customSettings?.["valueFontSize"]).toBe(24);
    expect(updated1[1].customSettings?.["valueFontSize"]).toBeUndefined();

    // Header to data
    const updated2 = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "value",
      { isHeaderWidget: true, valueFontSize: 28 },
      mixedWidgets,
    );
    expect(updated2[0].customSettings?.["valueFontSize"]).toBe(16);
  });

  it("should scope header style sync to the target column when linkColumns is false", () => {
    const multiColWidgets: AbsoluteWidgetNode[] = [
      {
        id: "col-1",
        widgetType: "lane-column",
        x: 0,
        y: 36,
        width: 150,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          linkColumns: false,
        },
      },
      {
        id: "col-1_grid_header",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 150,
        height: 36,
        zIndex: 2,
        customSettings: {
          gridId,
          gridMasterId: "col-1",
          isHeaderWidget: true,
          linkColumns: false,
        },
      },
      {
        id: "col-2",
        widgetType: "lane-column",
        x: 150,
        y: 36,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          linkColumns: false,
        },
      },
      {
        id: "col-2_grid_header",
        widgetType: "lane-column",
        x: 150,
        y: 0,
        width: 100,
        height: 36,
        zIndex: 2,
        customSettings: {
          gridId,
          gridMasterId: "col-2",
          isHeaderWidget: true,
          linkColumns: false,
        },
      },
    ];

    const updated = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "header",
      { linkColumns: false, headerFontSize: 24, headerTextColor: "#00ff00" },
      multiColWidgets,
      "col-1",
    );

    expect(updated[0].customSettings?.["headerFontSize"]).toBe(24);
    expect(updated[0].customSettings?.["headerTextColor"]).toBe("#00ff00");
    expect(updated[1].customSettings?.["headerFontSize"]).toBe(24);
    expect(updated[1].customSettings?.["headerTextColor"]).toBe("#00ff00");

    expect(updated[2].customSettings?.["headerFontSize"]).toBeUndefined();
    expect(updated[2].customSettings?.["headerTextColor"]).toBeUndefined();
    expect(updated[3].customSettings?.["headerFontSize"]).toBeUndefined();
    expect(updated[3].customSettings?.["headerTextColor"]).toBeUndefined();

    const updatedFromHeader = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "header",
      {
        gridMasterId: "col-2",
        isHeaderWidget: true,
        linkColumns: false,
        headerFontSize: 18,
        headerTextColor: "#ff00ff",
      },
      updated,
      "col-2_grid_header",
    );

    expect(updatedFromHeader[0].customSettings?.["headerFontSize"]).toBe(24);
    expect(updatedFromHeader[1].customSettings?.["headerFontSize"]).toBe(24);
    expect(updatedFromHeader[2].customSettings?.["headerFontSize"]).toBe(18);
    expect(updatedFromHeader[2].customSettings?.["headerTextColor"]).toBe(
      "#ff00ff",
    );
    expect(updatedFromHeader[3].customSettings?.["headerFontSize"]).toBe(18);
    expect(updatedFromHeader[3].customSettings?.["headerTextColor"]).toBe(
      "#ff00ff",
    );
  });

  it("should sync backgroundColor, textColor, and useLaneColors across columns in the same lane when mirrorRows is false", () => {
    const gridWidgets: AbsoluteWidgetNode[] = [
      {
        id: "l0-c1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          linkColumns: true,
          mirrorRows: false,
        },
      },
      {
        id: "l0-c2",
        widgetType: "lane-column",
        x: 100,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          linkColumns: true,
          mirrorRows: false,
        },
      },
      {
        id: "l1-c1",
        widgetType: "lane-column",
        x: 0,
        y: 50,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 1,
          linkColumns: true,
          mirrorRows: false,
        },
      },
      {
        id: "l1-c2",
        widgetType: "lane-column",
        x: 100,
        y: 50,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 1,
          linkColumns: true,
          mirrorRows: false,
        },
      },
    ];

    const updated = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "value",
      {
        gridLane: 0,
        linkColumns: true,
        mirrorRows: false,
        useLaneColors: false,
        backgroundColor: "#112233",
        textColor: "#ffffff",
      },
      gridWidgets,
      "l0-c1",
    );

    // Lane 0 columns should receive the updated colors
    expect(updated[0].customSettings?.["backgroundColor"]).toBe("#112233");
    expect(updated[0].customSettings?.["textColor"]).toBe("#ffffff");
    expect(updated[0].customSettings?.["useLaneColors"]).toBeFalse();
    expect(updated[1].customSettings?.["backgroundColor"]).toBe("#112233");
    expect(updated[1].customSettings?.["textColor"]).toBe("#ffffff");
    expect(updated[1].customSettings?.["useLaneColors"]).toBeFalse();

    // Lane 1 columns should remain completely untouched
    expect(updated[2].customSettings?.["backgroundColor"]).toBeUndefined();
    expect(updated[2].customSettings?.["textColor"]).toBeUndefined();
    expect(updated[3].customSettings?.["backgroundColor"]).toBeUndefined();
    expect(updated[3].customSettings?.["textColor"]).toBeUndefined();
  });

  it("should apply value style to all columns when _forceAllColumns is true even if linkColumns is false", () => {
    const unlinkedWidgets: AbsoluteWidgetNode[] = [
      {
        id: "c1",
        widgetType: "lane-column",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          linkColumns: false,
        },
      },
      {
        id: "c2",
        widgetType: "lane-column",
        x: 100,
        y: 0,
        width: 100,
        height: 50,
        zIndex: 1,
        customSettings: {
          gridId,
          gridLane: 0,
          linkColumns: false,
        },
      },
    ];

    const updated = LaneGridStyleHelper.syncCrossColumnProperty(
      gridId,
      "value",
      {
        linkColumns: false,
        _forceAllColumns: true,
        backgroundColor: "#990000",
        textColor: "#00ff00",
      },
      unlinkedWidgets,
      "c1",
    );

    expect(updated[0].customSettings?.["backgroundColor"]).toBe("#990000");
    expect(updated[0].customSettings?.["textColor"]).toBe("#00ff00");
    expect(updated[1].customSettings?.["backgroundColor"]).toBe("#990000");
    expect(updated[1].customSettings?.["textColor"]).toBe("#00ff00");
  });
});
