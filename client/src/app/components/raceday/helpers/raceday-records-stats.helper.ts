import {
  createMockBestRaceLapEntries,
  createMockLaneRecordEntries,
} from "@app/components/raceday/utils/raceday-mock.utils";
import { IRecordEntry } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

export class RacedayRecordsStatsHelper {
  static handleRecordDataUpdate(host: any, records: any): void {
    host.recordData = records;
    const overall = records?.overall;
    const current = records?.current;

    if (overall?.fastestLap) {
      const hasLap = overall.fastestLap.value && overall.fastestLap.value > 0;
      host.raceRecordLapNickname = hasLap
        ? overall.fastestLap.holderNickname ||
          overall.fastestLap.holderName ||
          "---"
        : "---";
      host.raceRecordLapTime = overall.fastestLap.value || 0;
    } else {
      host.raceRecordLapNickname = "---";
      host.raceRecordLapTime = 0;
    }

    if (overall?.highestScore) {
      host.raceRecordScoreNickname =
        overall.highestScore.holderTeamName ||
        overall.highestScore.holderNickname ||
        overall.highestScore.holderName ||
        "---";
      host.raceRecordScore = overall.highestScore.value || 0;
    } else {
      host.raceRecordScoreNickname = "---";
      host.raceRecordScore = 0;
    }

    if (current?.fastestLap) {
      const hasLap = current.fastestLap.value && current.fastestLap.value > 0;
      host.currentRaceBestNickname = hasLap
        ? current.fastestLap.holderNickname ||
          current.fastestLap.holderName ||
          "---"
        : "---";
      host.currentRaceBestTime = current.fastestLap.value || 0;
    } else {
      host.currentRaceBestNickname = "---";
      host.currentRaceBestTime = 0;
    }

    if (current?.heatFastestLap) {
      const hasLap =
        current.heatFastestLap.value && current.heatFastestLap.value > 0;
      host.heatBestNickname = hasLap
        ? current.heatFastestLap.holderNickname ||
          current.heatFastestLap.holderName ||
          "---"
        : "---";
      host.heatBestTime = current.heatFastestLap.value || 0;
    } else {
      host.heatBestNickname = "---";
      host.heatBestTime = 0;
    }

    if (!host.isDestroyed && host.cdr) {
      host.cdr.markForCheck();
    }
  }

  static getLaneRecord(host: any, hd?: DriverHeatData): number {
    const laneIndex = hd?.laneIndex ?? 0;
    const laneFastestLap = host.recordData?.overall?.laneFastestLap;
    if (Array.isArray(laneFastestLap) && laneFastestLap[laneIndex]?.value > 0) {
      return laneFastestLap[laneIndex].value;
    }
    return host.raceRecordLapTime || host.currentRaceBestTime || 0;
  }

  static getLaneRecordEntry(
    host: any,
    hd?: DriverHeatData | number,
  ): IRecordEntry | undefined {
    const laneIndex = typeof hd === "number" ? hd : (hd?.laneIndex ?? 0);
    const laneFastestLap = host.recordData?.overall?.laneFastestLap;
    if (Array.isArray(laneFastestLap) && laneFastestLap[laneIndex]) {
      return laneFastestLap[laneIndex];
    }
    if (host.isUIEditorMode && host.isUIEditorMode()) {
      const mockEntries = createMockLaneRecordEntries();
      return mockEntries[laneIndex];
    }
    return undefined;
  }

  static getLaneRecordTime(
    host: any,
    hd?: DriverHeatData,
    anchor?: string,
  ): string {
    const entry = RacedayRecordsStatsHelper.getLaneRecordEntry(host, hd);
    const isInset = anchor ? !anchor.startsWith("center-") : false;
    const laneViewWidget = host.currentRacedayLayout?.widgets?.find(
      (w: any) =>
        w.widgetType === "lane-view" || w.widgetType === "lane-column",
    );
    const colDecimals =
      laneViewWidget?.customSettings?.["columnDecimals"]?.["recordLapTime"] ??
      laneViewWidget?.customSettings?.["columnDecimalPlaces"]?.[
        "recordLapTime"
      ];
    const timeDecimals = isInset
      ? laneViewWidget?.customSettings?.["insetTimeDecimalPlaces"] !== undefined
        ? Number(laneViewWidget.customSettings["insetTimeDecimalPlaces"])
        : 3
      : colDecimals !== undefined && colDecimals !== null && colDecimals !== ""
        ? Number(colDecimals)
        : laneViewWidget?.customSettings?.["timeDecimalPlaces"] !== undefined
          ? Number(laneViewWidget.customSettings["timeDecimalPlaces"])
          : 3;
    const timePlaceholder =
      timeDecimals > 0 ? "--." + "-".repeat(timeDecimals) : "--";
    if (!entry || !entry.value || entry.value <= 0) return timePlaceholder;
    return entry.value.toFixed(timeDecimals);
  }

  static getLaneRecordHolder(host: any, hd?: DriverHeatData): string {
    const entry = RacedayRecordsStatsHelper.getLaneRecordEntry(host, hd);
    if (!entry || !entry.value || entry.value <= 0) return "---";
    return entry.holderNickname || entry.holderName || "---";
  }

  static getLaneRecordDate(host: any, hd?: DriverHeatData): string {
    const entry = RacedayRecordsStatsHelper.getLaneRecordEntry(host, hd);
    if (!entry?.date || !entry?.value || entry.value <= 0) return "---";
    let ms = 0;
    if (typeof entry.date === "number") {
      ms = entry.date;
    } else if ((entry.date as any).toNumber) {
      ms = (entry.date as any).toNumber();
    } else if (typeof entry.date === "string") {
      ms = parseInt(entry.date, 10);
    } else {
      ms = Number(entry.date);
    }
    if (ms <= 0 || isNaN(ms)) return "---";
    return host.dateTimeFormatService?.formatDate(ms, "short", "---") ?? "---";
  }

  static getBestRaceLapEntry(
    host: any,
    hd?: DriverHeatData | number,
  ): IRecordEntry | undefined {
    const laneIndex = typeof hd === "number" ? hd : (hd?.laneIndex ?? 0);
    const laneFastestLap = host.recordData?.current?.laneFastestLap;
    if (Array.isArray(laneFastestLap) && laneFastestLap[laneIndex]) {
      return laneFastestLap[laneIndex];
    }
    if (host.isUIEditorMode && host.isUIEditorMode()) {
      const mockEntries = createMockBestRaceLapEntries();
      return mockEntries[laneIndex];
    }
    return undefined;
  }

  static getBestRaceLapTime(
    host: any,
    hd?: DriverHeatData,
    anchor?: string,
  ): string {
    const entry = RacedayRecordsStatsHelper.getBestRaceLapEntry(host, hd);
    const isInset = anchor ? !anchor.startsWith("center-") : false;
    const laneViewWidget = host.currentRacedayLayout?.widgets?.find(
      (w: any) =>
        w.widgetType === "lane-view" || w.widgetType === "lane-column",
    );
    const colDecimals =
      laneViewWidget?.customSettings?.["columnDecimals"]?.["bestRaceLapTime"] ??
      laneViewWidget?.customSettings?.["columnDecimalPlaces"]?.[
        "bestRaceLapTime"
      ];
    const timeDecimals = isInset
      ? laneViewWidget?.customSettings?.["insetTimeDecimalPlaces"] !== undefined
        ? Number(laneViewWidget.customSettings["insetTimeDecimalPlaces"])
        : 3
      : colDecimals !== undefined && colDecimals !== null && colDecimals !== ""
        ? Number(colDecimals)
        : laneViewWidget?.customSettings?.["timeDecimalPlaces"] !== undefined
          ? Number(laneViewWidget.customSettings["timeDecimalPlaces"])
          : 3;
    const timePlaceholder =
      timeDecimals > 0 ? "--." + "-".repeat(timeDecimals) : "--";
    if (!entry || !entry.value || entry.value <= 0) return timePlaceholder;
    return entry.value.toFixed(timeDecimals);
  }

  static getBestRaceLapHolder(host: any, hd?: DriverHeatData): string {
    const entry = RacedayRecordsStatsHelper.getBestRaceLapEntry(host, hd);
    if (!entry || !entry.value || entry.value <= 0) return "---";
    return entry.holderNickname || entry.holderName || "---";
  }

  static getBestRaceLapHeat(host: any, hd?: DriverHeatData): string {
    const entry = RacedayRecordsStatsHelper.getBestRaceLapEntry(host, hd);
    if (
      !entry ||
      !entry.value ||
      entry.value <= 0 ||
      !entry.heatNumber ||
      entry.heatNumber <= 0
    ) {
      return "---";
    }
    const heatLabel = host.translationService?.translate("RD_HEAT") || "Heat";
    return `${heatLabel} ${entry.heatNumber}`;
  }

  static getPersonalBest(hd?: DriverHeatData): number {
    if (!hd) return 0;
    return hd.bestLapTime > 0 ? hd.bestLapTime : 0;
  }

  static getLeaderHeatDriver(host: any): DriverHeatData | undefined {
    const drivers = (host.heat?.heatDrivers || []).filter(
      (d: any) => !host.isEmptyDriver(d),
    );
    if (drivers.length === 0) return undefined;

    // 1. Check driverRankings map (populated from standingsUpdate$ / heat.standings)
    for (const d of drivers) {
      if (host.driverRankings?.get(d.objectId) === 1) {
        return d;
      }
    }

    // 2. Check heat.standings array
    if (host.heat?.standings && host.heat.standings.length > 0) {
      const leaderId = host.heat.standings[0];
      const leader = drivers.find((d: any) => d.objectId === leaderId);
      if (leader) return leader;
    }

    // 3. Check for 0 gap to leader with completed laps
    const zeroGap = drivers.find(
      (d: any) =>
        d.gapLeader === 0 &&
        d.lapsDownLeader === 0 &&
        (d.lapTimes?.length > 0 || d.bestLapTime > 0),
    );
    if (zeroGap) return zeroGap;

    // 4. Sort by lapCount descending, then totalTime / lastLapTime ascending
    const sorted = [...drivers].sort((a: any, b: any) => {
      const lapsA = a.lapCount ?? 0;
      const lapsB = b.lapCount ?? 0;
      if (lapsA !== lapsB) return lapsB - lapsA;
      const timeA = a.totalTime ?? a.lastLapTime ?? 0;
      const timeB = b.totalTime ?? b.lastLapTime ?? 0;
      return timeA - timeB;
    });

    return sorted[0] || drivers[0];
  }

  static findAssetById(host: any, assetId: string): any {
    if (assetId === "fuel-gauge-builtin") {
      const themeAssetId =
        host.themeService?.resolveAssetId("gauge.fuel") ||
        host.themeService?.resolveAssetId("fuel_gauge");

      const settings = host.settingsService?.getSettings();
      const resolvedId = themeAssetId || settings?.fuelGaugeImageSet;

      if (resolvedId && resolvedId !== "default_fuel-gauge-builtin") {
        const resolvedAsset = (host.assets || []).find(
          (a: any) =>
            a.model?.entityId === resolvedId ||
            a.entity_id === resolvedId ||
            a._id === resolvedId,
        );
        if (resolvedAsset) return resolvedAsset;
      }
    }

    let asset = (host.assets || []).find(
      (a: any) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );

    if (!asset && assetId === "fuel-gauge-builtin") {
      asset = (host.assets || []).find(
        (a: any) => a.type === "image_set" && a.name === "Fuel Gauge",
      );
    }

    return asset;
  }

  static getAssetUrl(host: any, name: string): string {
    const asset = (host.assets || []).find((a: any) => a.name === name);
    return asset ? host.getFullUrl(asset.url) : "";
  }

  static resolveAssetUrlBySlot(host: any, slotKey: string): string {
    const assetId = host.themeService?.resolveAssetId(slotKey);
    if (!assetId) return "";

    const asset = (host.assets || []).find(
      (a: any) =>
        a?.model?.entityId === assetId ||
        a?.entity_id === assetId ||
        a?._id === assetId,
    );
    return asset ? host.getFullUrl(asset.url) : "";
  }

  static getDisallowLapRecordsHeats(host: any): Heat[] {
    const heatsMap = new Map<number, Heat>();

    const countLaps = (h: Heat) => {
      if (!h || !h.heatDrivers) return 0;
      return h.heatDrivers.reduce((acc, d) => {
        const laps =
          typeof d?.lapTimes?.length === "number"
            ? d.lapTimes.length
            : Array.isArray((d as any)?.laps)
              ? (d as any).laps.length
              : Array.isArray((d as any)?.lapsWithDetails)
                ? (d as any).lapsWithDetails.length
                : 0;
        return acc + laps;
      }, 0);
    };

    const addOrMerge = (h?: Heat) => {
      if (!h) return;
      const num = h.heatNumber || 1;
      const existing = heatsMap.get(num);
      if (!existing) {
        heatsMap.set(num, h);
      } else {
        if (countLaps(h) > countLaps(existing)) {
          heatsMap.set(num, h);
        }
      }
    };

    const serviceHeats =
      typeof host.raceService?.getHeats === "function"
        ? host.raceService.getHeats() || []
        : [];
    for (const h of serviceHeats) addOrMerge(h);

    if (host.heats && host.heats.length > 0) {
      for (const h of host.heats) addOrMerge(h);
    }

    const currentHeat =
      host.heat ||
      (typeof host.raceService?.getCurrentHeat === "function"
        ? host.raceService.getCurrentHeat()
        : undefined);
    if (currentHeat) addOrMerge(currentHeat);

    return Array.from(heatsMap.values()).sort(
      (a, b) => (a.heatNumber || 1) - (b.heatNumber || 1),
    );
  }

  static onRecordsUpdated(
    host: any,
    event: {
      heatNumber: number;
      lane: number;
      lapIndex: number;
      countTowardsRecords: boolean;
    },
  ): void {
    if (host.heat && (host.heat.heatNumber || 1) === event.heatNumber) {
      const hd = host.heat.heatDrivers?.find(
        (d: any) => d.laneIndex === event.lane,
      );
      if (hd && typeof hd.updateLapRecordStatus === "function") {
        hd.updateLapRecordStatus(event.lapIndex, event.countTowardsRecords);
      }
    }
    if (host.heats && host.heats.length > 0) {
      const targetHeat = host.heats.find(
        (h: any) => (h.heatNumber || 1) === event.heatNumber,
      );
      const hd = targetHeat?.heatDrivers?.find(
        (d: any) => d.laneIndex === event.lane,
      );
      if (hd && typeof hd.updateLapRecordStatus === "function") {
        hd.updateLapRecordStatus(event.lapIndex, event.countTowardsRecords);
      }
    }
    host.cdr.markForCheck();
  }

  static getCurrentRaceDate(host: any): Date | number | string {
    const raceObj = host.race;
    const serviceRace = host.raceService?.getRace();
    const stats =
      (raceObj as any)?.statistics || (serviceRace as any)?.statistics;
    if (stats?.startMillis) return stats.startMillis;
    if (stats?.startTime) return stats.startTime;
    if ((raceObj as any)?.start_time_millis)
      return (raceObj as any).start_time_millis;
    if ((serviceRace as any)?.start_time_millis)
      return (serviceRace as any).start_time_millis;
    if ((raceObj as any)?.timestamp) return (raceObj as any).timestamp;
    if ((serviceRace as any)?.timestamp) return (serviceRace as any).timestamp;
    if (host.heats && host.heats.length > 0) {
      for (const h of host.heats) {
        if ((h as any)?.statistics?.startMillis)
          return (h as any).statistics.startMillis;
        if ((h as any)?.statistics?.startTime)
          return (h as any).statistics.startTime;
      }
    }
    if (
      host.disallowLapRecordsHeats &&
      host.disallowLapRecordsHeats.length > 0
    ) {
      for (const h of host.disallowLapRecordsHeats) {
        if ((h as any)?.statistics?.startMillis)
          return (h as any).statistics.startMillis;
        if ((h as any)?.statistics?.startTime)
          return (h as any).statistics.startTime;
      }
    }
    return new Date();
  }
}
