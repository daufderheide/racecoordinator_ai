import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { LayoutConfig } from "@app/models/settings";

import { RacedayLayoutUtils } from "./raceday-layout.utils";

describe("RacedayLayoutUtils", () => {
  const mockColumns: ColumnDefinition[] = [
    new ColumnDefinition(
      "NAME",
      "driver.name",
      100,
      false,
      "start",
      10,
      AnchorPoint.CenterLeft,
    ),
    new ColumnDefinition(
      "LAP",
      "lapCount",
      150,
      false,
      "middle",
      8,
      AnchorPoint.CenterCenter,
    ),
    new ColumnDefinition(
      "LAST_LAP",
      "lastLapTime",
      200,
      false,
      "end",
      12,
      AnchorPoint.TopRight,
    ),
  ];

  it("should calculate column X coordinates correctly", () => {
    expect(RacedayLayoutUtils.getColumnX([], 0)).toBe(0);
    expect(RacedayLayoutUtils.getColumnX(mockColumns, 0)).toBe(0);
    expect(RacedayLayoutUtils.getColumnX(mockColumns, 1)).toBe(100);
    expect(RacedayLayoutUtils.getColumnX(mockColumns, 2)).toBe(250);
    expect(RacedayLayoutUtils.getColumnX(mockColumns, 3)).toBe(450);
  });

  it("should calculate column center X coordinates correctly", () => {
    expect(RacedayLayoutUtils.getColumnCenterX([], 0)).toBe(0);
    expect(RacedayLayoutUtils.getColumnCenterX(mockColumns, 0)).toBe(50);
    expect(RacedayLayoutUtils.getColumnCenterX(mockColumns, 1)).toBe(100 + 75);
    expect(RacedayLayoutUtils.getColumnCenterX(mockColumns, 2)).toBe(250 + 100);
  });

  it("should compute header, body, and row heights", () => {
    const layoutWithoutLaneView: LayoutConfig = {
      widgets: [{ widgetType: "timer", height: 100 } as any],
    } as any;
    expect(RacedayLayoutUtils.getHeaderHeight(undefined)).toBe(36);
    expect(RacedayLayoutUtils.getHeaderHeight(layoutWithoutLaneView)).toBe(36);
    expect(RacedayLayoutUtils.getTableBodyHeight(undefined)).toBe(672);

    const layoutWithLaneView: LayoutConfig = {
      widgets: [
        {
          widgetType: "lane-view",
          height: 500,
          customSettings: { columnFontSize: 20 },
        } as any,
      ],
    } as any;

    const headerH = RacedayLayoutUtils.getHeaderHeight(layoutWithLaneView);
    expect(headerH).toBe(Math.max(36, Math.round(20 * 1.3 + 8)));

    const bodyH = RacedayLayoutUtils.getTableBodyHeight(layoutWithLaneView);
    expect(bodyH).toBe(Math.max(100, 500 - 10 - headerH));

    const rowH = RacedayLayoutUtils.getRowHeight(layoutWithLaneView, 4);
    expect(rowH).toBe((bodyH - 3 * 2) / 4);
  });

  it("should calculate image metrics", () => {
    const metrics = RacedayLayoutUtils.getImageMetrics(mockColumns, 0, 80);
    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeGreaterThan(0);
    expect(metrics.y).toBe((80 - metrics.height) / 2);
  });

  it("should compute column text X coordinates for various anchors", () => {
    expect(RacedayLayoutUtils.getColumnTextX([], 0)).toBe(0);

    // CenterLeft (targetAnchor) -> xBase + padding
    expect(
      RacedayLayoutUtils.getColumnTextX(mockColumns, 0, AnchorPoint.CenterLeft),
    ).toBe(10);
    // CenterRight -> xBase + width - padding
    expect(
      RacedayLayoutUtils.getColumnTextX(
        mockColumns,
        0,
        AnchorPoint.CenterRight,
      ),
    ).toBe(100 - 10);
    // CenterCenter -> xBase + width / 2
    expect(
      RacedayLayoutUtils.getColumnTextX(
        mockColumns,
        0,
        AnchorPoint.CenterCenter,
      ),
    ).toBe(50);
  });

  it("should compute column text Y coordinates for various anchors", () => {
    const rowH = 100;
    expect(RacedayLayoutUtils.getColumnTextY(rowH, AnchorPoint.TopLeft)).toBe(
      22,
    );
    expect(
      RacedayLayoutUtils.getColumnTextY(rowH, AnchorPoint.BottomLeft),
    ).toBe(78);
    expect(
      RacedayLayoutUtils.getColumnTextY(rowH, AnchorPoint.CenterCenter),
    ).toBe(52);
  });

  it("should compute column text anchor alignment", () => {
    expect(RacedayLayoutUtils.getColumnTextAnchor([], 0)).toBe("middle");
    expect(
      RacedayLayoutUtils.getColumnTextAnchor(
        mockColumns,
        0,
        AnchorPoint.TopLeft,
      ),
    ).toBe("start");
    expect(
      RacedayLayoutUtils.getColumnTextAnchor(
        mockColumns,
        0,
        AnchorPoint.TopRight,
      ),
    ).toBe("end");
    expect(
      RacedayLayoutUtils.getColumnTextAnchor(
        mockColumns,
        0,
        AnchorPoint.TopCenter,
      ),
    ).toBe("middle");
  });

  it("should compute column max width", () => {
    expect(RacedayLayoutUtils.getColumnMaxWidth([], 0)).toBe(0);
    expect(RacedayLayoutUtils.getColumnMaxWidth(mockColumns, 0)).toBe(100 - 20);
  });

  it("should get anchor font size and anchor classes", () => {
    expect(RacedayLayoutUtils.getAnchorFontSize(AnchorPoint.CenterCenter)).toBe(
      45,
    );
    expect(RacedayLayoutUtils.getAnchorFontSize(AnchorPoint.TopLeft)).toBe(20);
    expect(RacedayLayoutUtils.getAnchorClass("TopLeft")).toBe("anchor-topleft");
  });

  it("should get layout entries correctly", () => {
    expect(RacedayLayoutUtils.getLayoutEntries(null as any)).toEqual([]);
    expect(RacedayLayoutUtils.getLayoutEntries(mockColumns[0])).toEqual([
      { anchor: AnchorPoint.CenterLeft, property: "driver.name" },
    ]);

    const complexCol = new ColumnDefinition(
      "COMPLEX",
      "multiple",
      100,
      false,
      "middle",
      5,
      AnchorPoint.CenterCenter,
      (v) => v,
      {
        [AnchorPoint.TopLeft]: "driver.name",
        [AnchorPoint.BottomRight]: "lastLapTime",
      },
    );
    const entries = RacedayLayoutUtils.getLayoutEntries(complexCol);
    expect(entries.length).toBe(2);
  });

  it("should identify lap time columns", () => {
    expect(RacedayLayoutUtils.isLapTimeColumn(mockColumns[2])).toBe(true);
    expect(RacedayLayoutUtils.isLapTimeColumn(mockColumns[0])).toBe(false);
  });

  it("should identify image and avatar properties", () => {
    expect(RacedayLayoutUtils.isImageProperty("driver.avatarUrl")).toBe(true);
    expect(RacedayLayoutUtils.isImageProperty("imageset_custom")).toBe(true);
    expect(RacedayLayoutUtils.isImageProperty("fuel-gauge-builtin")).toBe(true);
    expect(RacedayLayoutUtils.isImageProperty("flag")).toBe(true);
    expect(RacedayLayoutUtils.isImageProperty("qrCode")).toBe(true);
    expect(RacedayLayoutUtils.isImageProperty("driverViewQrCode")).toBe(true);
    expect(RacedayLayoutUtils.isImageProperty("lapCount")).toBe(false);
    expect(RacedayLayoutUtils.isImageProperty("")).toBe(false);

    expect(RacedayLayoutUtils.isAvatarProperty("driver.avatarUrl")).toBe(true);
    expect(RacedayLayoutUtils.isAvatarProperty("flag")).toBe(false);
    expect(RacedayLayoutUtils.isAvatarProperty("")).toBe(false);
  });

  it("should check if lane color should be displayed", () => {
    expect(RacedayLayoutUtils.shouldShowLaneColor(mockColumns[0])).toBe(true);
    expect(RacedayLayoutUtils.shouldShowLaneColor(mockColumns[1])).toBe(false);
    expect(RacedayLayoutUtils.shouldShowLaneColor(null as any)).toBe(false);
  });

  it("should translate label keys for columns", () => {
    expect(RacedayLayoutUtils.getLabelKeyForColumn("lapCount")).toBe(
      "RD_COL_LAP",
    );
    expect(RacedayLayoutUtils.getLabelKeyForColumn("lapsLed")).toBe(
      "RD_COL_LAPS_LED",
    );
    expect(RacedayLayoutUtils.getLabelKeyForColumn("lastLapTime")).toBe(
      "RD_COL_LAP_TIME",
    );
    expect(RacedayLayoutUtils.getLabelKeyForColumn("driver.name")).toBe(
      "RD_COL_NAME",
    );
    expect(RacedayLayoutUtils.getLabelKeyForColumn("unknown_prop")).toBe(
      "UNKNOWN",
    );
  });

  it("should reindex column layout segment times sequentially", () => {
    const layout = {
      [AnchorPoint.TopLeft]: "segmentTime_5",
      [AnchorPoint.BottomRight]: "segmentTime_2",
      [AnchorPoint.CenterCenter]: "driver.name",
    };
    const reindexed = RacedayLayoutUtils.reindexColumnLayout(layout);
    expect(reindexed[AnchorPoint.TopLeft]).toBe("segmentTime");
    expect(reindexed[AnchorPoint.BottomRight]).toBe("segmentTime_1");
    expect(reindexed[AnchorPoint.CenterCenter]).toBe("driver.name");
  });

  it("should snap widgets to layout bounds and adjacent widgets", () => {
    const widgets = [{ id: "w1", x: 100, y: 100, width: 200, height: 150 }];

    // Near left edge (0) with threshold 10
    const snappedLeft = RacedayLayoutUtils.snapToEdges(
      widgets,
      5,
      50,
      100,
      100,
      "w2",
      "all",
    );
    expect(snappedLeft.x).toBe(0);

    // Near w1 right edge (300)
    const snappedAdjacent = RacedayLayoutUtils.snapToEdges(
      widgets,
      305,
      100,
      100,
      100,
      "w2",
      "all",
    );
    expect(snappedAdjacent.x).toBe(300);
  });
});
