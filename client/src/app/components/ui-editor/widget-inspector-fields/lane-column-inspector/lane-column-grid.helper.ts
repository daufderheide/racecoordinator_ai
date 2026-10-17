import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";

export class LaneColumnGridHelper {
  public static getGridHeaderPlacement(
    currentSettings: any,
  ): "top" | "individual" | "none" {
    return currentSettings["headerPlacement"] || "individual";
  }

  public static getGridHeaderHeight(currentSettings: any): number {
    return Number(currentSettings["headerHeight"]) || 36;
  }

  public static getGridHeaderFontFamily(currentSettings: any): string {
    return currentSettings["headerFontFamily"] || "";
  }

  public static setGridHeaderFontFamily(
    currentSettings: any,
    val: string,
    onHeaderStyleChange: () => void,
  ): void {
    currentSettings["headerFontFamily"] = val;
    onHeaderStyleChange();
  }

  public static getGridHeaderFontSize(currentSettings: any): number {
    return Number(currentSettings["headerFontSize"]) || 14;
  }

  public static setGridHeaderFontSize(
    currentSettings: any,
    val: number,
    onHeaderStyleChange: () => void,
  ): void {
    currentSettings["headerFontSize"] = Math.max(
      8,
      Math.min(72, Number(val) || 14),
    );
    onHeaderStyleChange();
  }

  public static getGridHeaderTextColor(currentSettings: any): string {
    return currentSettings["headerTextColor"] || "";
  }

  public static setGridHeaderTextColor(
    currentSettings: any,
    val: string,
    onHeaderStyleChange: () => void,
  ): void {
    currentSettings["headerTextColor"] = val;
    delete currentSettings["_reset_headerTextColor"];
    onHeaderStyleChange();
  }

  public static getGridHeaderBackgroundColor(currentSettings: any): string {
    return currentSettings["headerBackgroundColor"] || "";
  }

  public static setGridHeaderBackgroundColor(
    currentSettings: any,
    val: string,
    onHeaderStyleChange: () => void,
  ): void {
    currentSettings["headerBackgroundColor"] = val;
    delete currentSettings["_reset_headerBackgroundColor"];
    onHeaderStyleChange();
  }

  public static getGridHeaderAlignment(
    currentSettings: any,
  ): "start" | "center" | "end" {
    return currentSettings["headerAlignment"] || "center";
  }

  public static setGridHeaderAlignment(
    currentSettings: any,
    val: "start" | "center" | "end",
    onHeaderStyleChange: () => void,
  ): void {
    currentSettings["headerAlignment"] = val;
    onHeaderStyleChange();
  }

  public static getGridLabelPosition(
    currentSettings: any,
  ): "none" | "top" | "bottom" | "left" | "right" {
    return currentSettings["gridLabelPosition"] || "none";
  }

  public static setGridLabelPosition(
    currentSettings: any,
    pos: "none" | "top" | "bottom" | "left" | "right",
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelPosition"] = pos;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelText(currentSettings: any): string {
    return currentSettings["gridLabelText"] || "";
  }

  public static setGridLabelText(
    currentSettings: any,
    val: string,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelText"] = val;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelSize(currentSettings: any): number {
    return Number(currentSettings["gridLabelSize"]) || 40;
  }

  public static setGridLabelSize(
    currentSettings: any,
    val: number,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelSize"] = Math.max(
      16,
      Math.min(200, Number(val) || 40),
    );
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelFontFamily(currentSettings: any): string {
    return currentSettings["gridLabelFontFamily"] || "";
  }

  public static setGridLabelFontFamily(
    currentSettings: any,
    val: string,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelFontFamily"] = val;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelFontSize(currentSettings: any): number {
    return Number(currentSettings["gridLabelFontSize"]) || 18;
  }

  public static setGridLabelFontSize(
    currentSettings: any,
    val: number,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelFontSize"] = Math.max(
      8,
      Math.min(72, Number(val) || 18),
    );
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelFontBold(currentSettings: any): boolean {
    return currentSettings["gridLabelFontBold"] !== false;
  }

  public static setGridLabelFontBold(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelFontBold"] = Boolean(val);
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelFontItalic(currentSettings: any): boolean {
    return Boolean(currentSettings["gridLabelFontItalic"]);
  }

  public static setGridLabelFontItalic(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelFontItalic"] = Boolean(val);
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelAlignment(
    currentSettings: any,
  ): "start" | "center" | "end" {
    return currentSettings["gridLabelAlignment"] || "center";
  }

  public static setGridLabelAlignment(
    currentSettings: any,
    val: "start" | "center" | "end",
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelAlignment"] = val;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelTextColor(currentSettings: any): string {
    return currentSettings["gridLabelTextColor"] || "#ffffff";
  }

  public static setGridLabelTextColor(
    currentSettings: any,
    val: string,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelTextColor"] = val;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelBackgroundColor(currentSettings: any): string {
    return (
      currentSettings["gridLabelBackgroundColor"] || "rgba(15, 23, 42, 0.85)"
    );
  }

  public static setGridLabelBackgroundColor(
    currentSettings: any,
    val: string,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelBackgroundColor"] = val;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static resetGridLabelTextColor(
    currentSettings: any,
    onFieldChange: () => void,
  ): void {
    delete currentSettings["gridLabelTextColor"];
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static resetGridLabelBackgroundColor(
    currentSettings: any,
    onFieldChange: () => void,
  ): void {
    delete currentSettings["gridLabelBackgroundColor"];
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelShowBorder(currentSettings: any): boolean {
    return currentSettings["gridLabelShowBorder"] !== false;
  }

  public static setGridLabelShowBorder(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelShowBorder"] = Boolean(val);
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelBorderColor(currentSettings: any): string {
    return (
      currentSettings["gridLabelBorderColor"] ||
      currentSettings["gridLabelTextColor"] ||
      "#ffffff"
    );
  }

  public static setGridLabelBorderColor(
    currentSettings: any,
    val: string,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelBorderColor"] = val;
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static resetGridLabelBorderColor(
    currentSettings: any,
    onFieldChange: () => void,
  ): void {
    delete currentSettings["gridLabelBorderColor"];
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelBorderWidth(currentSettings: any): number {
    return currentSettings["gridLabelBorderWidth"] != null
      ? Math.max(
          0,
          Math.min(10, Number(currentSettings["gridLabelBorderWidth"])),
        )
      : 1;
  }

  public static setGridLabelBorderWidth(
    currentSettings: any,
    val: number,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelBorderWidth"] = Math.max(
      0,
      Math.min(10, Number(val) || 0),
    );
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getGridLabelBorderRadius(currentSettings: any): number {
    return currentSettings["gridLabelBorderRadius"] != null
      ? Math.max(
          0,
          Math.min(32, Number(currentSettings["gridLabelBorderRadius"])),
        )
      : 4;
  }

  public static setGridLabelBorderRadius(
    currentSettings: any,
    val: number,
    onFieldChange: () => void,
  ): void {
    currentSettings["gridLabelBorderRadius"] = Math.max(
      0,
      Math.min(32, Number(val) || 0),
    );
    currentSettings["_gridLabelChanged"] = true;
    onFieldChange();
  }

  public static getHighlightRowOnLap(currentSettings: any): boolean {
    return currentSettings["highlightRowOnLap"] !== false;
  }

  public static setHighlightRowOnLap(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["highlightRowOnLap"] = Boolean(val);
    onFieldChange();
  }

  public static getLinkColumns(currentSettings: any): boolean {
    return currentSettings["linkColumns"] !== false;
  }

  public static setLinkColumns(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["linkColumns"] = Boolean(val);
    currentSettings["_linkColumnsChanged"] = true;
    onFieldChange();
  }

  public static getMirrorRows(currentSettings: any): boolean {
    return currentSettings["mirrorRows"] !== false;
  }

  public static setMirrorRows(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["mirrorRows"] = Boolean(val);
    currentSettings["_mirrorRowsChanged"] = true;
    onFieldChange();
  }

  public static getGridType(currentSettings: any): "heat" | "overall" {
    if (currentSettings["gridType"] === "overall") return "overall";
    if (currentSettings["gridType"] === "heat") return "heat";
    if (RacedayLayoutUtils.isOverallColumnKey(currentSettings["columnKey"])) {
      return "overall";
    }
    return "heat";
  }

  public static setGridType(
    currentSettings: any,
    val: "heat" | "overall",
    onFieldChange: () => void,
  ): void {
    currentSettings["gridType"] = val;
    currentSettings["_gridTypeChanged"] = true;
    onFieldChange();
  }

  public static getGridSortOrder(
    currentSettings: any,
  ): "lane" | "position" | "overallPosition" | "seed" {
    return currentSettings["bindingMode"] || "lane";
  }

  public static setGridSortOrder(
    currentSettings: any,
    val: "lane" | "position" | "overallPosition" | "seed",
    onFieldChange: () => void,
  ): void {
    currentSettings["bindingMode"] = val;
    currentSettings["_gridSortOrderChanged"] = true;
    onFieldChange();
  }

  public static getSortByBindingMode(currentSettings: any): boolean {
    return currentSettings["sortByBindingMode"] !== false;
  }

  public static setSortByBindingMode(
    currentSettings: any,
    val: boolean,
    onFieldChange: () => void,
  ): void {
    currentSettings["sortByBindingMode"] = Boolean(val);
    currentSettings["_sortByBindingModeChanged"] = true;
    onFieldChange();
  }

  public static getGridTotalLanes(
    currentSettings: any,
    defaultLanes?: number,
  ): number {
    return Math.max(
      1,
      Math.min(
        32,
        Number(currentSettings["gridTotalLanes"]) || defaultLanes || 4,
      ),
    );
  }

  public static setGridTotalLanes(
    currentSettings: any,
    val: number,
    onFieldChange: () => void,
  ): void {
    const count = Math.max(1, Math.min(32, Math.round(Number(val) || 1)));
    currentSettings["gridTotalLanes"] = count;
    currentSettings["_gridTotalLanesChanged"] = true;
    onFieldChange();
  }

  public static getGridDirection(
    currentSettings: any,
  ): "horizontal" | "vertical" {
    return currentSettings["gridDirection"] === "horizontal"
      ? "horizontal"
      : "vertical";
  }

  public static getGridLayoutOrientation(
    currentSettings: any,
  ): "vertical" | "horizontal" {
    return currentSettings["layoutOrientation"] === "horizontal"
      ? "horizontal"
      : "vertical";
  }

  public static setGridLayoutOrientation(
    currentSettings: any,
    val: "vertical" | "horizontal",
    onFieldChange: () => void,
  ): void {
    const orientation = val === "horizontal" ? "horizontal" : "vertical";
    currentSettings["layoutOrientation"] = orientation;
    currentSettings["_layoutOrientationChanged"] = true;
    onFieldChange();
  }

  public static setGridHeaderPlacement(
    currentSettings: any,
    placement: "top" | "individual" | "none",
    onFieldChange: () => void,
  ): void {
    currentSettings["headerPlacement"] = placement;
    currentSettings["_headerPlacementChanged"] = true;
    onFieldChange();
  }

  public static setGridHeaderHeight(
    currentSettings: any,
    height: number,
    onFieldChange: () => void,
  ): void {
    currentSettings["headerHeight"] = Math.max(
      20,
      Math.min(200, Number(height) || 36),
    );
    currentSettings["_headerHeightChanged"] = true;
    onFieldChange();
  }

  public static isMasterCell(
    currentSettings: any,
    isHeaderWidget: boolean,
  ): boolean {
    if (isHeaderWidget) {
      return false;
    }
    const idx =
      currentSettings["gridLane"] != null
        ? currentSettings["gridLane"]
        : currentSettings["targetIndex"] != null
          ? currentSettings["targetIndex"]
          : 0;
    return Number(idx) === 0;
  }

  public static getGridBreadcrumbLabel(
    currentSettings: any,
    defaultLanes?: number,
  ): string {
    const count = currentSettings["gridTotalLanes"] || defaultLanes || 4;
    const mode = currentSettings["bindingMode"];
    if (mode === "position") return `Grid (${count} Pos)`;
    return `Grid (${count} Lanes)`;
  }

  public static getCellBreadcrumbLabel(
    currentSettings: any,
    isHeaderWidget: boolean,
  ): string {
    if (isHeaderWidget) {
      return "Header";
    }
    const mode = currentSettings["bindingMode"];
    const idx =
      (currentSettings["gridLane"] != null
        ? currentSettings["gridLane"]
        : currentSettings["targetIndex"] != null
          ? currentSettings["targetIndex"]
          : 0) + 1;
    if (mode === "position") return `Pos ${idx}`;
    if (mode === "overallPosition") return `Overall Pos ${idx}`;
    if (mode === "seed") return `Seed ${idx}`;
    return `Lane ${idx}`;
  }

  public static getAvailableIndices(
    currentSettings: any,
    totalLanes?: number,
  ): number[] {
    const mode = currentSettings["bindingMode"];
    if (mode === "overallPosition" || mode === "seed") {
      const count = Math.max(16, Math.min(64, (totalLanes || 4) * 4));
      return Array.from({ length: count }, (_, i) => i);
    }
    const laneCount = Math.max(8, totalLanes || 8);
    return Array.from({ length: laneCount }, (_, i) => i);
  }
}
