import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { SafeStyle } from "@angular/platform-browser";
import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { RacedayActiveLayoutHelper } from "@app/components/raceday/helpers/raceday-active-layout.helper";
import {
  LapDisplayInfo,
  RacedayColumnLayoutHelper,
} from "@app/components/raceday/helpers/raceday-column-layout.helper";
import { RacedayGridColumnHelper } from "@app/components/raceday/helpers/raceday-grid-column.helper";
import {
  RacedayGridDescriptor,
  RacedayGridDescriptorHelper,
} from "@app/components/raceday/helpers/raceday-grid-descriptor.helper";
import { RacedayGridLayoutHelper } from "@app/components/raceday/helpers/raceday-grid-layout.helper";
import { RacedayLayoutEditorHelper } from "@app/components/raceday/helpers/raceday-layout-editor.helper";
import { RacedayTimerLayoutHelper } from "@app/components/raceday/helpers/raceday-timer-layout.helper";
import { RacedayToolboxHelper } from "@app/components/raceday/helpers/raceday-toolbox.helper";
import { ToolboxGroup } from "@app/components/raceday/toolbox-group.helper";
import {
  GridResizeHandle,
  LaneGridBounds,
  LaneGridSession,
} from "@app/components/raceday/utils/lane-grid-replication.helper";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  AbsoluteWidgetNode,
  LayoutConfig,
  WidgetType,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { TimerFormatOptions } from "@app/utils/timer-format.utils";

export abstract class DefaultRacedayLayoutBase {
  parsedThemeLayouts: Map<string, any> = new Map<string, any>();

  getWidgets(): any[] {
    return RacedayGridDescriptorHelper.getWidgets(this);
  }

  invalidateGridCache(): void {
    RacedayGridDescriptorHelper.invalidateGridCache(this);
  }

  isGridOverall(gridId?: string): boolean {
    return RacedayGridDescriptorHelper.isGridOverall(this, gridId);
  }

  isGridSeed(gridId?: string): boolean {
    return RacedayGridDescriptorHelper.isGridSeed(this, gridId);
  }

  getGridEmptyRowsMode(gridId?: string): "remove" | "empty" | "blank" {
    return RacedayGridDescriptorHelper.getGridEmptyRowsMode(this, gridId);
  }

  getDefaultLaneWidgetSettings(): any {
    return RacedayGridDescriptorHelper.getDefaultLaneWidgetSettings(this);
  }

  getNonGridWidgets(): any[] {
    return RacedayGridDescriptorHelper.getNonGridWidgets(this);
  }

  getGrids(): RacedayGridDescriptor[] {
    return RacedayGridDescriptorHelper.getGrids(this);
  }

  protected buildGridSession(
    gridId: string,
    gridWidgets: AbsoluteWidgetNode[],
    bounds: any,
  ): { session: LaneGridSession; labelWidget: any } {
    return RacedayGridDescriptorHelper.buildGridSession(
      this,
      gridId,
      gridWidgets,
      bounds,
    );
  }

  protected partitionGridWidgets(
    sessionLike: LaneGridSession,
    allGridWidgets: AbsoluteWidgetNode[],
    headerPlacement: string,
    isVertical: boolean,
  ): {
    headerWidgets: AbsoluteWidgetNode[];
    cellWidgets: AbsoluteWidgetNode[];
  } {
    return RacedayGridDescriptorHelper.partitionGridWidgets(
      sessionLike,
      allGridWidgets,
      headerPlacement,
      isVertical,
    );
  }

  protected extractGridLabelSettings(
    labelWidget: any,
    sessionLike: LaneGridSession,
  ) {
    return RacedayGridDescriptorHelper.extractGridLabelSettings(
      labelWidget,
      sessionLike,
    );
  }

  protected syncWidgetsUnderLabel(
    sessionLike: LaneGridSession,
    widgets: AbsoluteWidgetNode[],
    gridWidgets: AbsoluteWidgetNode[],
    dataBounds: any,
  ): AbsoluteWidgetNode[] {
    return RacedayGridDescriptorHelper.syncWidgetsUnderLabel(
      this,
      sessionLike,
      widgets,
      gridWidgets,
      dataBounds,
    );
  }

  protected computeGridDimensions(
    sessionLike: LaneGridSession,
    dataBounds: any,
    dataCount: number,
    allWidgets?: AbsoluteWidgetNode[],
  ) {
    return RacedayGridDescriptorHelper.computeGridDimensions(
      sessionLike,
      dataBounds,
      dataCount,
      allWidgets,
    );
  }

  protected buildGridDescriptor(
    gridId: string,
    widgets: AbsoluteWidgetNode[],
  ): RacedayGridDescriptor | null {
    return RacedayGridDescriptorHelper.buildGridDescriptor(
      this,
      gridId,
      widgets,
    );
  }

  protected resolveGridLabelDescriptorData(
    sessionLike: any,
    labelWidget: any,
    gridWidgets: any[],
    labelBounds: LaneGridBounds | null,
  ) {
    return RacedayGridDescriptorHelper.resolveGridLabelDescriptorData(
      sessionLike,
      labelWidget,
      gridWidgets,
      labelBounds,
    );
  }

  getBlueprintGridLabelFontSize(labelBounds: LaneGridBounds | null): number {
    return RacedayGridDescriptorHelper.getBlueprintGridLabelFontSize(
      this,
      labelBounds,
    );
  }

  getBlueprintGridLabelWrap(labelBounds: LaneGridBounds | null): boolean {
    return RacedayGridDescriptorHelper.getBlueprintGridLabelWrap(
      this,
      labelBounds,
    );
  }

  isGridSessionScaleAuto(): boolean {
    return RacedayGridDescriptorHelper.isGridSessionScaleAuto(this);
  }

  getTableBodyHeight(): number {
    return RacedayGridDescriptorHelper.getTableBodyHeight(this);
  }

  getRowHeight(): number {
    return RacedayGridDescriptorHelper.getRowHeight(this);
  }

  getImageMetrics(colIndex: number) {
    return RacedayGridDescriptorHelper.getImageMetrics(this, colIndex);
  }

  getColumnTextX(columnIndex: number, anchor?: any): number {
    return RacedayGridDescriptorHelper.getColumnTextX(
      this,
      columnIndex,
      anchor,
    );
  }

  getColumnTextY(
    columnIndex: number,
    hasTeam: boolean = false,
    anchor?: any,
  ): number {
    return RacedayGridDescriptorHelper.getColumnTextY(
      this,
      columnIndex,
      hasTeam,
      anchor,
    );
  }

  getColumnTextAnchor(columnIndex: number, anchor?: any): string {
    return RacedayGridDescriptorHelper.getColumnTextAnchor(
      this,
      columnIndex,
      anchor,
    );
  }

  getColumnMaxWidth(columnIndex: number): number {
    return RacedayGridDescriptorHelper.getColumnMaxWidth(this, columnIndex);
  }

  getAnchorFontSize(anchor: string): number {
    return RacedayGridDescriptorHelper.getAnchorFontSize(anchor);
  }

  toggleLayoutCustomize(): void {
    RacedayLayoutEditorHelper.toggleLayoutCustomize(this);
  }

  getWidgetTypeLabelKey(widgetType: string): string {
    return RacedayToolboxHelper.getWidgetTypeLabelKey(this, widgetType);
  }

  saveLayout(): void {
    RacedayLayoutEditorHelper.saveLayout(this);
  }

  cancelLayoutCustomize(): void {
    RacedayLayoutEditorHelper.cancelLayoutCustomize(this);
  }

  resetLayoutToDefaults(): void {
    RacedayLayoutEditorHelper.resetLayoutToDefaults(this);
  }

  getUnusedWidgets(): WidgetType[] {
    return RacedayToolboxHelper.getUnusedWidgets(this);
  }

  loadToolboxExpandedStatesFromLayout(): void {
    RacedayToolboxHelper.loadToolboxExpandedStatesFromLayout(this);
  }

  ensureToolboxExpandedStatesLoaded(): void {
    RacedayToolboxHelper.ensureToolboxExpandedStatesLoaded(this);
  }

  protected saveToolboxExpandedStatesToLayout(): void {
    RacedayToolboxHelper.saveToolboxExpandedStatesToLayout(this);
  }

  getToolboxGroups(): ToolboxGroup[] {
    return RacedayToolboxHelper.getToolboxGroups(this);
  }

  toggleToolboxGroup(groupId: string): void {
    RacedayToolboxHelper.toggleToolboxGroup(this, groupId);
  }

  toggleToolboxSubgroup(subgroupId: string): void {
    RacedayToolboxHelper.toggleToolboxSubgroup(this, subgroupId);
  }

  clearToolboxSearch(): void {
    RacedayToolboxHelper.clearToolboxSearch(this);
  }

  onToolboxDragStart(event: DragEvent, type: string): void {
    RacedayToolboxHelper.onToolboxDragStart(this, event, type);
  }

  onCanvasDragOver(event: DragEvent): void {
    RacedayLayoutEditorHelper.onCanvasDragOver(this, event);
  }

  protected handleGridDrop(
    event: DragEvent,
    scalableContent: HTMLElement,
    rect: DOMRect,
  ): void {
    RacedayLayoutEditorHelper.handleGridDrop(
      this,
      event,
      scalableContent,
      rect,
    );
  }

  protected computeDroppedWidgetDimensions(draggedType: string): {
    width: number;
    height: number;
  } {
    return RacedayLayoutEditorHelper.computeDroppedWidgetDimensions(
      this,
      draggedType,
    );
  }

  onCanvasDrop(event: DragEvent): void {
    RacedayLayoutEditorHelper.onCanvasDrop(this, event);
  }

  getNextZIndex(): number {
    return RacedayLayoutEditorHelper.getNextZIndex(this);
  }

  bringGridToFront(gridId: string): void {
    RacedayGridColumnHelper.bringGridToFront(this, gridId);
  }

  onGridContainerPointerDown(event: PointerEvent, gridId: string): void {
    RacedayGridColumnHelper.onGridContainerPointerDown(this, event, gridId);
  }

  getGridSessionZIndex(): number {
    return RacedayGridColumnHelper.getGridSessionZIndex(this);
  }

  bringToFront(id: string): void {
    RacedayLayoutEditorHelper.bringToFront(this, id);
  }

  normalizeZIndices(): void {
    RacedayLayoutEditorHelper.normalizeZIndices(this);
  }

  removeWidget(id: string): void {
    RacedayLayoutEditorHelper.removeWidget(this, id);
  }

  getGridDividers(): number[] {
    return RacedayGridLayoutHelper.getGridDividers(this);
  }

  getGridCells(): {
    bounds: LaneGridBounds;
    laneIndex: number;
    isMaster: boolean;
  }[] {
    return RacedayGridLayoutHelper.getGridCells(this);
  }

  getHeaderRowBounds(): LaneGridBounds | null {
    return RacedayGridLayoutHelper.getHeaderRowBounds(this);
  }

  getGridLabelBounds(): LaneGridBounds | null {
    return RacedayGridLayoutHelper.getGridLabelBounds(this);
  }

  getGridLabelJustify(position?: string, alignment?: string): string {
    return RacedayGridLayoutHelper.getGridLabelJustify(position, alignment);
  }

  get selectedWidget(): AbsoluteWidgetNode | null {
    return RacedayGridLayoutHelper.getSelectedWidget(this);
  }

  get selectedGridBounds(): LaneGridBounds | null {
    return RacedayGridLayoutHelper.getSelectedGridBounds(this);
  }

  get selectedGridLabel(): string {
    const sel = (this as any).selectedWidget;
    const customTitle =
      sel?.customSettings?.["gridLabelText"]?.trim() ||
      (this as any).getGridCustomTitle(sel?.customSettings?.["gridId"]);
    if (customTitle) {
      return customTitle;
    }
    const labelPos =
      sel?.customSettings?.["gridLabelPosition"] ||
      (this as any).getGridLabelPosition(sel?.customSettings?.["gridId"]);
    if (labelPos && labelPos !== "none") {
      const defaultLabel = (this as any).translationService?.translate(
        "UE_GRID_LABEL_DEFAULT",
      );
      if (defaultLabel && defaultLabel !== "UE_GRID_LABEL_DEFAULT") {
        return defaultLabel;
      }
    }
    const count =
      sel?.customSettings?.["gridTotalLanes"] ||
      (this as any).track?.lanes?.length ||
      4;
    const mode = sel?.customSettings?.["bindingMode"];
    const key =
      mode === "position"
        ? "UE_GRID_POSITION_CONTAINER_LABEL"
        : "UE_GRID_CONTAINER_LABEL";
    const translated = (this as any).translationService?.translate(key, {
      count,
    });
    if (translated && translated !== key) {
      return translated;
    }
    return mode === "position"
      ? `Position Grid (${count} Positions)`
      : `Lane Grid (${count} Lanes)`;
  }

  hasWidgetId(id: string): boolean {
    return RacedayGridLayoutHelper.hasWidgetId(this, id);
  }

  snapToEdges(
    x: number,
    y: number,
    w: number,
    h: number,
    ignoreId: string,
    handle: string,
    layoutWidth: number = 1920,
    layoutHeight: number = 1080,
  ): { x: number; y: number; w: number; h: number } {
    return RacedayGridLayoutHelper.snapToEdges(
      this,
      x,
      y,
      w,
      h,
      ignoreId,
      handle,
      layoutWidth,
      layoutHeight,
    );
  }

  onGridResizeStart(event: PointerEvent, handle: GridResizeHandle): void {
    RacedayGridColumnHelper.onGridResizeStart(this, event, handle);
  }

  onGridMoveStart(event: PointerEvent): void {
    RacedayGridColumnHelper.onGridMoveStart(this, event);
  }

  onDeleteGridClicked(): void {
    RacedayGridColumnHelper.onDeleteGridClicked(this);
  }

  onMasterWidgetModified(widget: AbsoluteWidgetNode): void {
    RacedayLayoutEditorHelper.onMasterWidgetModified(this, widget);
  }

  onCanvasPointerDown(_event: PointerEvent): void {}

  getDefaultLayout(): LayoutConfig {
    return RacedayLayoutEditorHelper.getDefaultLayout(this);
  }

  replicateLaneWidgets(options: LaneReplicationOptions): void {
    RacedayLayoutEditorHelper.replicateLaneWidgets(this, options);
  }

  getGridLabelPosition(gridId?: string): string {
    return RacedayGridLayoutHelper.getGridLabelPosition(this, gridId) ?? "";
  }

  getGridCustomTitle(gridId?: string): string | null {
    return RacedayGridLayoutHelper.getGridCustomTitle(this, gridId);
  }

  onColumnDrop(event: CdkDragDrop<string[]>): void {
    RacedayGridColumnHelper.onColumnDrop(this, event);
  }

  onColumnDragOver(event: DragEvent): void {
    RacedayGridColumnHelper.onColumnDragOver(this, event);
  }

  onColumnDragLeave(event: DragEvent): void {
    RacedayGridColumnHelper.onColumnDragLeave(this, event);
  }

  onColumnHeaderDrop(event: DragEvent, dropColData: ColumnDefinition): void {
    RacedayGridColumnHelper.onColumnHeaderDrop(this, event, dropColData);
  }

  onColumnHeaderRowDrop(event: DragEvent): void {
    RacedayGridColumnHelper.onColumnHeaderRowDrop(this, event);
  }

  deleteColumn(colData: ColumnDefinition): void {
    RacedayGridColumnHelper.deleteColumn(this, colData);
  }

  onAnchorDragOver(event: DragEvent): void {
    RacedayGridColumnHelper.onAnchorDragOver(this, event);
  }

  onAnchorDragEnter(event: DragEvent): void {
    RacedayGridColumnHelper.onAnchorDragEnter(this, event);
  }

  onAnchorDragLeave(event: DragEvent): void {
    RacedayGridColumnHelper.onAnchorDragLeave(this, event);
  }

  onAnchorDrop(
    event: DragEvent,
    colData: ColumnDefinition,
    anchor: string,
  ): void {
    RacedayGridColumnHelper.onAnchorDrop(this, event, colData, anchor);
  }

  deleteAnchor(colData: ColumnDefinition, anchor: string, event: Event): void {
    RacedayGridColumnHelper.deleteAnchor(this, colData, anchor, event);
  }

  hasAnchorValue(colData: ColumnDefinition, anchor: string): boolean {
    return RacedayGridColumnHelper.hasAnchorValue(this, colData, anchor);
  }

  get isDriverStationLayout(): boolean {
    return RacedayActiveLayoutHelper.isDriverStationLayout(this);
  }

  get activeLane(): any | undefined {
    return RacedayActiveLayoutHelper.getActiveLane(this);
  }

  get activeLaneBackgroundColor(): string {
    return RacedayActiveLayoutHelper.getActiveLaneBackgroundColor(this);
  }

  get activeLaneForegroundColor(): string {
    return RacedayActiveLayoutHelper.getActiveLaneForegroundColor(this);
  }

  get seasonName(): string {
    return RacedayActiveLayoutHelper.getSeasonName(this);
  }

  get seasonStandings(): any[] {
    return RacedayActiveLayoutHelper.getSeasonStandings(this);
  }

  protected getParsedCustomUiProperty(
    customUI: any,
    propName: string,
    fallbackVal: any,
  ): any {
    return RacedayActiveLayoutHelper.getParsedCustomUiProperty(
      this,
      customUI,
      propName,
      fallbackVal,
    );
  }

  get currentRacedayLayout(): LayoutConfig | undefined {
    return RacedayActiveLayoutHelper.getCurrentRacedayLayout(this);
  }
  set currentRacedayLayout(layout: LayoutConfig | undefined) {
    RacedayActiveLayoutHelper.setCurrentRacedayLayout(this, layout);
  }

  get currentRacedayColumns(): string[] {
    return RacedayActiveLayoutHelper.getCurrentRacedayColumns(this);
  }
  set currentRacedayColumns(cols: string[]) {
    RacedayActiveLayoutHelper.setCurrentRacedayColumns(this, cols);
  }

  get currentColumnAnchors(): { [key: string]: AnchorPoint } {
    return RacedayActiveLayoutHelper.getCurrentColumnAnchors(this);
  }
  set currentColumnAnchors(anchors: { [key: string]: AnchorPoint }) {
    RacedayActiveLayoutHelper.setCurrentColumnAnchors(this, anchors);
  }

  get currentColumnLayouts(): {
    [key: string]: { [A in AnchorPoint]?: string };
  } {
    return RacedayActiveLayoutHelper.getCurrentColumnLayouts(this);
  }
  set currentColumnLayouts(layouts: {
    [key: string]: { [A in AnchorPoint]?: string };
  }) {
    RacedayActiveLayoutHelper.setCurrentColumnLayouts(this, layouts);
  }

  get currentColumnWidths(): { [columnKey: string]: number } {
    return RacedayActiveLayoutHelper.getCurrentColumnWidths(this);
  }
  set currentColumnWidths(widths: { [columnKey: string]: number }) {
    RacedayActiveLayoutHelper.setCurrentColumnWidths(this, widths);
  }

  protected updateRacedayLayout(): void {
    RacedayActiveLayoutHelper.updateRacedayLayout(this);
  }

  protected get autoStatusLabel(): string {
    return RacedayTimerLayoutHelper.getAutoStatusLabel(this);
  }

  protected get isAutoSegments(): boolean {
    return RacedayTimerLayoutHelper.isAutoSegments(this);
  }

  protected getTimerFormatOptions(): TimerFormatOptions {
    return RacedayTimerLayoutHelper.getTimerFormatOptions(this);
  }

  protected get formattedTime(): string {
    return RacedayTimerLayoutHelper.getFormattedTime(this);
  }

  protected get gridTemplateColumns(): string {
    return RacedayTimerLayoutHelper.getGridTemplateColumns(this);
  }

  protected get gridTemplateRowsVertical(): string {
    return RacedayTimerLayoutHelper.getGridTemplateRowsVertical(this);
  }

  public get isWarmup(): boolean {
    return RacedayTimerLayoutHelper.isWarmup(this);
  }

  public get isCooldown(): boolean {
    return RacedayTimerLayoutHelper.isCooldown(this);
  }

  protected getLayoutEntries(
    column: ColumnDefinition,
  ): { anchor: string; property: string }[] {
    return RacedayLayoutUtils.getLayoutEntries(column);
  }

  protected getAnchorClass(anchor: string): string {
    return RacedayLayoutUtils.getAnchorClass(anchor);
  }

  isLapTimeColumn(col: ColumnDefinition): boolean {
    return RacedayLayoutUtils.isLapTimeColumn(col);
  }

  protected isImageProperty(prop: string): boolean {
    return RacedayLayoutUtils.isImageProperty(prop);
  }

  protected isAvatarProperty(prop: string): boolean {
    return RacedayLayoutUtils.isAvatarProperty(prop);
  }

  public isPacingProperty(prop: string): boolean {
    return RacedayLayoutUtils.isPacingProperty(prop);
  }

  public shouldShowLaneColor(col: ColumnDefinition): boolean {
    return RacedayLayoutUtils.shouldShowLaneColor(col);
  }

  protected loadColumns(): void {
    RacedayColumnLayoutHelper.loadColumns(this);
  }

  protected resolveColumnLayout(
    selectedColumns: string[],
    settings: any,
  ): {
    calculatedWidths: { [key: string]: number };
    zeroWidthColumnKeys: Set<string>;
  } {
    return RacedayColumnLayoutHelper.resolveColumnLayout(
      this,
      selectedColumns,
      settings,
    );
  }

  protected reindexColumnLayout(layout: { [A in AnchorPoint]?: string }): {
    [A in AnchorPoint]?: string;
  } {
    return RacedayColumnLayoutHelper.reindexColumnLayout(layout);
  }

  protected getSelectedImageFromSet(
    asset: any,
    value: any,
    hd: DriverHeatData,
  ): string {
    return RacedayColumnLayoutHelper.getSelectedImageFromSet(
      this,
      asset,
      value,
      hd,
    );
  }

  protected findAssetById(assetId: string): any {
    return RacedayColumnLayoutHelper.findAssetById(this, assetId);
  }

  protected getImageUrl(propertyName: string, hd: DriverHeatData): string {
    return RacedayColumnLayoutHelper.getImageUrl(this, propertyName, hd);
  }

  isEmptyDriver(hd: DriverHeatData | any): boolean {
    return RacedayColumnLayoutHelper.isEmptyDriver(hd);
  }

  formatValue(
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column?: ColumnDefinition,
    anchor?: string,
    widgetSettings?: any,
  ): string {
    return RacedayColumnLayoutHelper.formatValue(
      this,
      propertyName,
      value,
      hd,
      column,
      anchor,
      widgetSettings,
    );
  }

  protected getLabelKeyForColumn(
    key: string,
    layout?: { [A in AnchorPoint]?: string },
  ): string {
    return RacedayColumnLayoutHelper.getLabelKeyForColumn(key, layout);
  }

  protected trackByIndex(index: number, item: any): number {
    return RacedayColumnLayoutHelper.trackByIndex(index, item);
  }

  protected trackByDriverId(index: number, hd: DriverHeatData): any {
    return RacedayColumnLayoutHelper.trackByDriverId(index, hd);
  }

  protected trackByColumn(index: number, col: any): string {
    return RacedayColumnLayoutHelper.trackByColumn(index, col);
  }

  protected trackByLayout(index: number, entry: any): string {
    return RacedayColumnLayoutHelper.trackByLayout(index, entry);
  }

  getDropdownArrowBg(hd: DriverHeatData): SafeStyle | string {
    return RacedayColumnLayoutHelper.getDropdownArrowBg(this, hd);
  }

  getLaneColor(
    hd: DriverHeatData,
    property: "background_color" | "foreground_color",
  ): string {
    return RacedayColumnLayoutHelper.getLaneColor(this, hd, property);
  }

  getDropdownIcon(color: string): SafeStyle | string {
    return RacedayColumnLayoutHelper.getDropdownIcon(this, color);
  }

  isNameProperty(property: string): boolean {
    return RacedayColumnLayoutHelper.isNameProperty(property);
  }

  getColumnLabel(column: ColumnDefinition): string {
    return RacedayColumnLayoutHelper.getColumnLabel(this, column);
  }

  getColumnX(columnIndex: number): number {
    return RacedayColumnLayoutHelper.getColumnX(this, columnIndex);
  }

  getColumnCenterX(columnIndex: number): number {
    return RacedayColumnLayoutHelper.getColumnCenterX(this, columnIndex);
  }

  formatColumnValue(
    heatDriver: DriverHeatData,
    column?: ColumnDefinition,
    propertyName?: string,
    anchor?: string,
  ): string {
    return RacedayColumnLayoutHelper.formatColumnValue(
      this,
      heatDriver,
      column,
      propertyName,
      anchor,
    );
  }

  getLastLaps(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    anchor?: string,
    countOverride?: number,
  ): LapDisplayInfo[] {
    return RacedayColumnLayoutHelper.getLastLaps(
      this,
      heatDriver,
      column,
      anchor,
      countOverride,
    );
  }
}
