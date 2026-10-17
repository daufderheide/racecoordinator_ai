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
});
