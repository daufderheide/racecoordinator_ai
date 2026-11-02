import { SafeStyle } from "@angular/platform-browser";
import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { RacedayRecordsStatsHelper } from "@app/components/raceday/helpers/raceday-records-stats.helper";
import {
  FormatContext,
  RacedayFormatUtils,
} from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { Settings } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

export interface LapDisplayInfo {
  lapTime: string;
  segments: string[];
}

function resolveHostHeats(host: any): any[] {
  const rsHeats = host.raceService?.getHeats?.();
  if (rsHeats && rsHeats.length > 0) return rsHeats;
  if (host.heats && host.heats.length > 0) return host.heats;
  if (host.race?.heats && host.race.heats.length > 0) return host.race.heats;
  return rsHeats || host.heats || [];
}

function resolveHostCurrentHeat(host: any): any {
  return host.currentHeat || host.raceService?.getCurrentHeat?.() || host.heat;
}

export class RacedayColumnLayoutHelper {
  static loadColumns(host: any): void {
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    let selectedColumns = host.currentRacedayColumns;
    if (!selectedColumns || selectedColumns.length === 0) {
      selectedColumns = Settings.DEFAULT_COLUMNS;
    }

    const { calculatedWidths, zeroWidthColumnKeys } =
      RacedayColumnLayoutHelper.resolveColumnLayout(
        host,
        selectedColumns,
        settings,
      );

    host.columns = selectedColumns.map((key: string) => {
      const layout = (host.currentColumnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      const primaryProp =
        layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;

      const labelKey = RacedayColumnLayoutHelper.getLabelKeyForColumn(
        key,
        layout,
      );
      const isResizing = zeroWidthColumnKeys.has(key);
      const width = calculatedWidths[key] ?? 275;
      const anchor = host.currentColumnAnchors[key] || AnchorPoint.CenterCenter;

      const renderer = (
        v: any,
        hd: DriverHeatData,
        col: ColumnDefinition,
        anchorParam?: string,
      ) => {
        return host.formatValue(primaryProp, v, hd, col, anchorParam);
      };

      if (key.startsWith("imageset_")) {
        const assetId = key.replace("imageset_", "");
        const asset = host.findAssetById(assetId);
        const imageRenderer = (
          v: any,
          hd: DriverHeatData,
          _col: ColumnDefinition,
        ) => {
          return RacedayColumnLayoutHelper.getSelectedImageFromSet(
            host,
            asset,
            v,
            hd,
          );
        };
        return new ColumnDefinition(
          "",
          key,
          width,
          isResizing,
          "middle",
          0,
          anchor,
          imageRenderer as any,
          layout,
        );
      }

      const finalLayout = host.reindexColumnLayout(layout);
      if (layout[AnchorPoint.CenterCenter] === "customImage" || isResizing) {
        return new ColumnDefinition(
          labelKey,
          key,
          width,
          true,
          "start",
          30,
          anchor,
          renderer as any,
          finalLayout,
        );
      }
      return new ColumnDefinition(
        labelKey,
        key,
        width,
        false,
        "middle",
        0,
        anchor,
        renderer as any,
        finalLayout,
      );
    });

    host.updateAudioRelevance();
  }

  static resolveColumnLayout(
    host: any,
    selectedColumns: string[],
    _settings: any,
  ): {
    calculatedWidths: { [key: string]: number };
    zeroWidthColumnKeys: Set<string>;
  } {
    const configuredWidths: { [key: string]: number } = {};
    const zeroWidthColumnKeys = new Set<string>();
    let totalFixed = 0;

    const laneViewWidget = host.currentRacedayLayout?.widgets?.find(
      (w: any) => w.widgetType === "lane-view",
    );
    const isVertical = laneViewWidget?.customSettings?.["isVertical"] ?? false;
    const widgetWidths = laneViewWidget?.customSettings?.["columnWidths"] || {};
    const currentWidths = host.currentColumnWidths || {};

    selectedColumns.forEach((key) => {
      const layout = (host.currentColumnLayouts || {})[key] || {
        [AnchorPoint.CenterCenter]: key,
      };
      let width: number | undefined = undefined;
      if (widgetWidths[key] !== undefined && widgetWidths[key] !== null) {
        width = Number(widgetWidths[key]);
      } else if (
        currentWidths[key] !== undefined &&
        currentWidths[key] !== null
      ) {
        width = Number(currentWidths[key]);
      } else {
        width = RacedayLayoutUtils.getDefaultColumnWidth(key, layout, {
          isPractice: host.isPracticeLayout,
          isVertical,
        });
      }

      configuredWidths[key] = width;
      if (width === 0) {
        zeroWidthColumnKeys.add(key);
      } else {
        totalFixed += width;
      }
    });

    const totalGapsWidth = Math.max(0, selectedColumns.length - 1) * 20;
    const totalRemaining = Math.max(
      0,
      host.dashboardWidth - totalFixed - totalGapsWidth,
    );

    const calculatedWidths: { [key: string]: number } = {};
    const zeroCount = zeroWidthColumnKeys.size;
    const sharedWidth =
      zeroCount > 0 ? Math.max(50, Math.floor(totalRemaining / zeroCount)) : 0;

    selectedColumns.forEach((key) => {
      if (zeroWidthColumnKeys.has(key)) {
        calculatedWidths[key] = sharedWidth;
      } else {
        calculatedWidths[key] = configuredWidths[key];
      }
    });

    return { calculatedWidths, zeroWidthColumnKeys };
  }

  static reindexColumnLayout(layout: { [A in AnchorPoint]?: string }): {
    [A in AnchorPoint]?: string;
  } {
    return RacedayLayoutUtils.reindexColumnLayout(layout);
  }

  static getSelectedImageFromSet(
    host: any,
    asset: any,
    value: any,
    hd: DriverHeatData,
  ): string {
    if (
      !asset ||
      asset.type !== "image_set" ||
      !asset.images ||
      asset.images.length === 0
    ) {
      return "";
    }

    if (typeof value === "string") {
      const match = asset.images.find(
        (img: any) => img.name === value || img.url?.includes(value),
      );
      if (match) return host.getFullUrl(match.url || "");
    }

    const level = hd.participant?.fuelLevel ?? (hd.driver as any)?.fuelLevel;
    const race = host.raceService.getRace();
    const capacity =
      (typeof host.track?.hasDigitalFuel === "function" &&
      host.track?.hasDigitalFuel()
        ? race?.digital_fuel_options?.capacity
        : race?.fuel_options?.capacity) || 100;

    let fuelPercentage = 0;
    if (typeof value === "number") {
      fuelPercentage = value;
    } else if (level !== undefined && capacity !== undefined && capacity > 0) {
      fuelPercentage = (level / capacity) * 100;
    } else {
      return "";
    }

    if (fuelPercentage === 0) {
      const zeroImage = asset.images.find((img: any) => img.percentage === 0);
      if (zeroImage) return host.getFullUrl(zeroImage.url || "");
    }

    const candidates = asset.images.filter(
      (img: any) => (img.percentage || 0) !== 0,
    );

    if (candidates.length === 0) {
      return host.getFullUrl(asset?.images?.[0]?.url || "");
    }

    let bestMatch = candidates[0];
    let minDiff = Math.abs((bestMatch.percentage || 0) - fuelPercentage);

    for (const img of candidates) {
      const diff = Math.abs((img.percentage || 0) - fuelPercentage);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = img;
      }
    }
    return host.getFullUrl(bestMatch.url || "");
  }

  static findAssetById(host: any, assetId: string): any {
    return RacedayRecordsStatsHelper.findAssetById(host, assetId);
  }

  static getImageUrl(
    host: any,
    propertyName: string,
    hd: DriverHeatData,
  ): string {
    const baseKey = propertyName.split("_")[0];
    if (baseKey === "fuel-gauge-builtin") {
      const asset = host.findAssetById("fuel-gauge-builtin");
      const value = RacedayFormatUtils.getPropertyValue(hd, propertyName);
      return RacedayColumnLayoutHelper.getSelectedImageFromSet(
        host,
        asset,
        value,
        hd,
      );
    }
    if (baseKey.startsWith("imageset")) {
      const assetId = propertyName.replace("imageset_", "");
      const asset = host.findAssetById(assetId);
      const value = RacedayFormatUtils.getPropertyValue(hd, propertyName);
      return RacedayColumnLayoutHelper.getSelectedImageFromSet(
        host,
        asset,
        value,
        hd,
      );
    }
    return "";
  }

  static isEmptyDriver(hd: DriverHeatData | any): boolean {
    return RacedayFormatUtils.isEmptyDriver(hd);
  }

  static formatValue(
    host: any,
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column?: ColumnDefinition,
    anchor?: string,
    widgetSettings?: any,
  ): string {
    let laneViewSettings =
      widgetSettings || host.getDefaultLaneWidgetSettings();
    if (
      laneViewSettings?.gridType !== "overall" &&
      (widgetSettings?.gridType === "overall" ||
        widgetSettings?.bindingMode === "overallPosition" ||
        laneViewSettings?.bindingMode === "overallPosition" ||
        (widgetSettings?.gridId && host.isGridOverall(widgetSettings.gridId)))
    ) {
      laneViewSettings = {
        ...(laneViewSettings || {}),
        gridType: "overall",
      };
    }
    if (
      laneViewSettings?.bindingMode !== "seed" &&
      (widgetSettings?.bindingMode === "seed" ||
        (widgetSettings?.gridId && host.isGridSeed(widgetSettings.gridId)))
    ) {
      laneViewSettings = {
        ...(laneViewSettings || {}),
        bindingMode: "seed",
      };
    }
    const resolvedEmptyRowsMode =
      laneViewSettings?.emptyRowsMode ||
      widgetSettings?.emptyRowsMode ||
      (widgetSettings?.gridId
        ? host.getGridEmptyRowsMode(widgetSettings.gridId)
        : undefined);
    if (
      resolvedEmptyRowsMode &&
      laneViewSettings?.emptyRowsMode !== resolvedEmptyRowsMode
    ) {
      laneViewSettings = {
        ...(laneViewSettings || {}),
        emptyRowsMode: resolvedEmptyRowsMode,
      };
    }
    const ctx: FormatContext = {
      translate: (key) => host.translationService.translate(key),
      getRace: () => host.raceService.getRace(),
      getTrack: () => host.track,
      getDriverRanking: (objectId) => host.driverRankings.get(objectId),
      getFlagType: () => host.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => host.getFlagUrl(flag),
      getFullUrl: (url) => host.getFullUrl(url),
      getImageSetUrl: (heatDriver, prop) => host.getImageUrl(prop, heatDriver),
      laneViewWidgetSettings: laneViewSettings,
      getParticipant: (heatDriver) => host.getDriverParticipant(heatDriver),
      getDriverOverallRanking: (heatDriver) =>
        host.getDriverOverallRanking(heatDriver),
      getDriverGroupRanking: (heatDriver) =>
        host.getDriverGroupRanking(heatDriver),
      getLaneQrCodeUrl: (laneIndex) => host.getLaneQrCodeUrl(laneIndex),
      getDriverViewQrCodeUrl: (heatDriver) =>
        host.getDriverViewQrCodeUrl(heatDriver),
      isDriverFinished: (heatDriver, scoring) =>
        host.isDriverFinished(heatDriver, scoring),
      areAllDriversFinished: () => host.areAllDriversFinished(),
      isRaceOver: () => host.isRaceOver(),
      getRaceState: () => host.raceState,
      isWarmup: () => host.isWarmup,
      isCooldown: () => host.isCooldown,
      getLaneRecordEntry: (laneIndex) => host.getLaneRecordEntry(laneIndex),
      getBestRaceLapEntry: (laneIndex) => host.getBestRaceLapEntry(laneIndex),
      formatDate: (d: any) => host.dateTimeFormatService.formatDate(d, "short"),
      getHeats: () => resolveHostHeats(host),
      getCurrentHeat: () => resolveHostCurrentHeat(host),
      getSortedHeatDrivers: () => host.sortedHeatDrivers || [],
      getHeatTime: () => host.raceTimeService?.time ?? host.time ?? 0,
    };
    return RacedayFormatUtils.formatValue(
      propertyName,
      value,
      hd,
      column,
      ctx,
      anchor,
    );
  }

  static getLabelKeyForColumn(
    key: string,
    layout?: { [A in AnchorPoint]?: string },
  ): string {
    return RacedayLayoutUtils.getLabelKeyForColumn(key, layout);
  }

  static trackByIndex(index: number, _item: any): number {
    return index;
  }

  static trackByDriverId(_index: number, hd: DriverHeatData): any {
    return `${hd.objectId}-${hd.laneIndex}`;
  }

  static trackByColumn(index: number, col: any): string {
    return col.propertyName || col.id || col.label || index.toString();
  }

  static trackByLayout(_index: number, entry: any): string {
    return `${entry.anchor}-${entry.property}`;
  }

  static getDropdownArrowBg(host: any, hd: DriverHeatData): SafeStyle | string {
    const color =
      host.track?.lanes?.[hd?.laneIndex]?.foreground_color || "#ffffff";
    return host.getDropdownIcon(color);
  }

  static getLaneColor(
    host: any,
    hd: DriverHeatData,
    property: "background_color" | "foreground_color",
  ): string {
    const track =
      host.track || host.race?.track || host.raceService.getRace()?.track;
    return track?.lanes?.[hd?.laneIndex]?.[property] || "";
  }

  static getDropdownIcon(host: any, color: string): SafeStyle | string {
    if (host.dropdownIconCache.has(color)) {
      return host.dropdownIconCache.get(color)!;
    }
    const encodedColor = encodeURIComponent(color);
    const svg = `data:image/svg+xml;utf8,<svg fill="%23${encodedColor.replace(/^%23/, "")}" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>`;
    const safeStyle = host.sanitizer
      ? host.sanitizer.bypassSecurityTrustStyle(`url('${svg}')`)
      : `url('${svg}')`;
    host.dropdownIconCache.set(color, safeStyle);
    return safeStyle;
  }

  static isNameProperty(property: string): boolean {
    const baseKey = property.split("_")[0];
    return baseKey === "driver.name" || baseKey === "driver.nickname";
  }

  static getColumnLabel(host: any, column: ColumnDefinition): string {
    if (!column || !column.labelKey) {
      return "";
    }
    if (column.propertyName === "driver.avatarUrl") {
      return "";
    }
    const translation = host.translationService.translate(column.labelKey);
    if (column.propertyName.startsWith("segmentTime")) {
      const segmentColumns = host.columns.filter((c: any) =>
        c.propertyName.startsWith("segmentTime"),
      );
      if (segmentColumns.length > 1) {
        const parts = column.propertyName.split("_");
        const index = parts.length > 1 ? parseInt(parts[1], 10) + 1 : 1;
        return `${translation} ${index}`;
      }
    }
    return translation;
  }

  static getColumnX(host: any, columnIndex: number): number {
    return RacedayLayoutUtils.getColumnX(host.columns, columnIndex);
  }

  static getColumnCenterX(host: any, columnIndex: number): number {
    return RacedayLayoutUtils.getColumnCenterX(host.columns, columnIndex);
  }

  static formatColumnValue(
    host: any,
    heatDriver: DriverHeatData,
    column?: ColumnDefinition,
    propertyName?: string,
    anchor?: string,
  ): string {
    const laneViewWidget = host.currentRacedayLayout?.widgets?.find(
      (w: any) =>
        w.widgetType === "lane-view" || w.widgetType === "lane-column",
    );
    const ctx: FormatContext = {
      translate: (key) => host.translationService.translate(key),
      getRace: () => host.raceService.getRace(),
      getTrack: () => host.track,
      getDriverRanking: (objectId) => host.driverRankings.get(objectId),
      getFlagType: () => host.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => host.getFlagUrl(flag),
      getFullUrl: (url) => host.getFullUrl(url),
      getImageSetUrl: (hd, prop) => host.getImageUrl(prop, hd),
      laneViewWidgetSettings: laneViewWidget?.customSettings,
      getParticipant: (hd) => host.getDriverParticipant(hd),
      getDriverOverallRanking: (hd) => host.getDriverOverallRanking(hd),
      getDriverGroupRanking: (hd) => host.getDriverGroupRanking(hd),
      getLaneQrCodeUrl: (laneIndex) => host.getLaneQrCodeUrl(laneIndex),
      getDriverViewQrCodeUrl: (hd) => host.getDriverViewQrCodeUrl(hd),
      isDriverFinished: (hd, scoring) => host.isDriverFinished(hd, scoring),
      areAllDriversFinished: () => host.areAllDriversFinished(),
      isRaceOver: () => host.isRaceOver(),
      getRaceState: () => host.raceState,
      isWarmup: () => host.isWarmup,
      isCooldown: () => host.isCooldown,
      getLaneRecordEntry: (laneIndex) => host.getLaneRecordEntry(laneIndex),
      getBestRaceLapEntry: (laneIndex) => host.getBestRaceLapEntry(laneIndex),
      formatDate: (d: any) => host.dateTimeFormatService.formatDate(d, "short"),
      getHeats: () => resolveHostHeats(host),
      getCurrentHeat: () => resolveHostCurrentHeat(host),
      getSortedHeatDrivers: () => host.sortedHeatDrivers || [],
      getHeatTime: () => host.raceTimeService?.time ?? host.time ?? 0,
    };
    return RacedayFormatUtils.formatColumnValue(
      heatDriver,
      column,
      propertyName,
      ctx,
      anchor,
    );
  }

  static getLastLaps(
    host: any,
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    anchor?: string,
    countOverride?: number,
  ): LapDisplayInfo[] {
    if (!heatDriver) return [];
    const laps = heatDriver.lapTimes || [];
    const lapsDetails = heatDriver.lapsWithDetails || [];
    const n = laps.length;
    const result: LapDisplayInfo[] = [];
    const laneViewWidget = host.currentRacedayLayout?.widgets?.find(
      (w: any) =>
        w.widgetType === "lane-view" || w.widgetType === "lane-column",
    );
    const ctx: FormatContext = {
      translate: (key) => host.translationService.translate(key),
      getRace: () => host.raceService.getRace(),
      getTrack: () => host.track,
      getDriverRanking: (objectId) => host.driverRankings.get(objectId),
      getFlagType: () => host.raceFlagService.getFlagType(),
      getFlagUrl: (flag) => host.getFlagUrl(flag),
      getFullUrl: (url) => host.getFullUrl(url),
      getImageSetUrl: (hd, prop) => host.getImageUrl(prop, hd),
      laneViewWidgetSettings: laneViewWidget?.customSettings,
      getParticipant: (hd) => host.getDriverParticipant(hd),
      getDriverOverallRanking: (hd) => host.getDriverOverallRanking(hd),
      getDriverGroupRanking: (hd) => host.getDriverGroupRanking(hd),
      isDriverFinished: (hd, scoring) => host.isDriverFinished(hd, scoring),
      areAllDriversFinished: () => host.areAllDriversFinished(),
      isRaceOver: () => host.isRaceOver(),
      getRaceState: () => host.raceState,
      isWarmup: () => host.isWarmup,
      isCooldown: () => host.isCooldown,
      formatDate: (d: any) => host.dateTimeFormatService.formatDate(d, "short"),
      getHeats: () => resolveHostHeats(host),
      getCurrentHeat: () => resolveHostCurrentHeat(host),
      getSortedHeatDrivers: () => host.sortedHeatDrivers || [],
      getHeatTime: () => host.raceTimeService?.time ?? host.time ?? 0,
    };

    const isInset = anchor ? anchor !== "center-center" : false;
    const customColDecimals =
      ctx.laneViewWidgetSettings?.columnDecimals ||
      ctx.laneViewWidgetSettings?.columnDecimalPlaces;
    const colDecimalOverride = customColDecimals
      ? (customColDecimals[column?.propertyName ?? ""] ??
        customColDecimals["lastLaps"])
      : undefined;
    const timeDecimals = isInset
      ? ctx.laneViewWidgetSettings?.insetTimeDecimalPlaces !== undefined
        ? Number(ctx.laneViewWidgetSettings.insetTimeDecimalPlaces)
        : 3
      : colDecimalOverride !== undefined &&
          colDecimalOverride !== null &&
          colDecimalOverride !== ""
        ? Number(colDecimalOverride)
        : ctx.laneViewWidgetSettings?.timeDecimalPlaces !== undefined
          ? Number(ctx.laneViewWidgetSettings.timeDecimalPlaces)
          : 3;

    const lapsCount =
      countOverride !== undefined && countOverride > 0
        ? countOverride
        : ctx.laneViewWidgetSettings?.lastLapsCount !== undefined &&
            Number(ctx.laneViewWidgetSettings.lastLapsCount) > 0
          ? Math.round(Number(ctx.laneViewWidgetSettings.lastLapsCount))
          : 5;

    for (let i = 1; i <= lapsCount; i++) {
      const index = n - 1 - i;
      result.push(
        RacedayColumnLayoutHelper.formatLapDisplayEntry(
          heatDriver,
          column,
          laps,
          lapsDetails,
          index,
          ctx,
          anchor,
          timeDecimals,
        ),
      );
    }
    return result;
  }

  private static formatLapDisplayEntry(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    laps: number[],
    lapsDetails: any[],
    index: number,
    ctx: FormatContext,
    anchor: string | undefined,
    timeDecimals: number,
  ): LapDisplayInfo {
    const val = index >= 0 && laps[index] > 0 ? laps[index] : 0;
    const formattedLapTime = RacedayFormatUtils.formatValue(
      "lastLapTime",
      val,
      heatDriver,
      column,
      ctx,
      anchor,
    );

    const segments: string[] = [];
    if (index >= 0 && lapsDetails[index]?.segments) {
      const rawSegments = lapsDetails[index].segments || [];
      const numToDisplay = Math.min(rawSegments.length, 4);
      for (let s = 0; s < numToDisplay; s++) {
        const segVal = rawSegments[s];
        if (segVal > 0) {
          segments.push(segVal.toFixed(timeDecimals));
        } else {
          segments.push("--." + "-".repeat(timeDecimals));
        }
      }
    }
    return { lapTime: formattedLapTime, segments };
  }
}
