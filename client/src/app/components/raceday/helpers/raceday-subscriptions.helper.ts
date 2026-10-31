import * as QRCode from "qrcode";
import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { HighlightLapStyle } from "@app/models/settings";
import { LapType, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { AudioAssociation } from "@app/services/audio.service";
import { createTTSContext, getEffectiveDriver } from "@app/utils/audio";
import { DriverMatchingUtils } from "@app/utils/driver-matching.utils";
import {
  arbitrateLapAudioCandidates,
  LapAudioCandidate,
} from "@app/utils/lap-audio-arbitrator";

export class RacedaySubscriptionsHelper {
  public static subscribeToRaceData(host: any): void {
    host.subscriptions.push(
      host.raceService.participants$.subscribe((participants: any) => {
        host.participants = participants || [];
        host.updateLeaderboardEntries();
        host.syncHeatDriversWithParticipants();
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceService.groupParticipants$.subscribe((participants: any) => {
        host.groupParticipants = participants || [];
        host.updateGroupLeaderboardEntries();

        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceService.currentGroup$.subscribe((group: any) => {
        host.currentGroup = group || 0;
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceService.heats$.subscribe((heats: any) => {
        host.heats = heats || [];
        if (host.heats.length > 0) {
          host.totalHeats = host.heats.length;
        }
        if (host.sortedHeatDrivers.length === 0 || !host.heat || !host.track) {
          host.initializeHeat();
        }
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    RacedaySubscriptionsHelper.subscribeToCurrentHeat(host);
    host.viewerRaceEndedHandler.startListening();
    RacedaySubscriptionsHelper.subscribeToServerIp(host);

    host.subscriptions.push(
      host.raceService.currentHeat$.subscribe(() => {
        host.loadRaceData();
      }),
    );

    host.subscriptions.push(
      host.raceService.selectedRace$.subscribe(() => {
        host.loadRaceData();
        if (host.heat) {
          host.sortHeatDrivers();
        }
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.raceState$.subscribe((state: any) => {
        host.handleRaceStateChange(state);
      }),
    );

    host.raceConnectionService.connect();
  }

  public static subscribeToCurrentHeat(host: any): void {
    host.subscriptions.push(
      host.raceService.currentHeat$.subscribe((heat: any) => {
        if (heat) {
          if (host.heat?.objectId !== heat.objectId) {
            LaneGridAnimationHelper.reset();
          }
          host.heat = heat;
          if (
            !host.track ||
            !host.track.lanes ||
            host.track.lanes.length === 0
          ) {
            host.track = host.race?.track || host.raceService.getRace()?.track;
          }
          if (
            !host.track ||
            !host.track.lanes ||
            host.track.lanes.length === 0
          ) {
            host.dataService.updateRaceSubscription(true);
          }
          host.sortHeatDrivers();
          host.syncHeatDriversWithParticipants();
          if (host.isDriverView) {
            host.checkDriverStatus();
            host.updateRacedayLayout();
            host.updateAudioRelevance();
          }
          if (!host.isDestroyed) {
            host.cdr.markForCheck();
          }
        }
      }),
    );
  }

  public static subscribeToServerIp(host: any): void {
    host.subscriptions.push(
      host.dataService.getServerIp().subscribe({
        next: (ip: string) => {
          if (ip) {
            const port = window.location.port;
            const url = `${window.location.protocol}//${ip}${port ? ":" + port : ""}`;
            if (host.serverUrlBase !== url) {
              host.serverUrlBase = url;
              host.laneQrCodeCache.clear();
              host.generatingLaneQrCodes.clear();
              host.driverViewQrCodeCache.clear();
            }
            QRCode.toDataURL(url, { margin: 1 })
              .then((dataUrl) => {
                host.qrCodeUrl = dataUrl;
                if (!host.isDestroyed) {
                  host.cdr.markForCheck();
                }
              })
              .catch((err) =>
                host.logger.error("QR Code generation failed", err),
              );
          }
        },
        error: (err: any) => {
          host.logger.warn("Failed to fetch server IP", err);
        },
      }),
    );
  }

  public static subscribeToRaceTime(host: any): void {
    host.subscriptions.push(
      host.raceConnectionService.raceTime$.subscribe((raceTime: any) => {
        if (host.handleRaceTimeUpdate) {
          host.handleRaceTimeUpdate(raceTime);
        } else {
          RacedaySubscriptionsHelper.handleRaceTimeUpdate(host, raceTime);
        }
      }),
    );
  }

  public static handleRaceTimeUpdate(host: any, raceTime: any): void {
    if (host.raceHasEnded || host.raceState === RaceState.RACE_OVER) {
      host.autoStartRemaining = 0;
      host.autoAdvanceRemaining = 0;
      host.time = 0;
      host.previousTime = 0;
      host.timeFormat = "1.0-0";
      if (!host.isDestroyed) {
        host.cdr.markForCheck();
      }
      return;
    }

    RacedaySubscriptionsHelper.updateAutoStartAndAdvance(host, raceTime);
    const time = RacedaySubscriptionsHelper.computeDisplayRaceTime(
      host,
      raceTime,
    );
    RacedaySubscriptionsHelper.updateRaceTimeFormat(host, time);

    if (host.raceState === RaceState.RACING) {
      host.checkAudioCallouts(time, host.previousTime);
    }

    host.time = time;
    host.previousTime = time;

    if (!host.isDestroyed) {
      host.cdr.markForCheck();
    }
  }

  public static updateAutoStartAndAdvance(host: any, raceTime: any): void {
    if (
      host.raceState === RaceState.NOT_STARTED ||
      host.raceState === RaceState.UNKNOWN_STATE ||
      host.raceState === RaceState.STARTING
    ) {
      host.autoStartRemaining = raceTime.autoStartRemaining || 0;
    } else {
      host.autoStartRemaining = 0;
    }

    const prevAutoStart = host.previousAutoStartRemaining;
    if (
      (host.raceState === RaceState.NOT_STARTED ||
        host.raceState === RaceState.UNKNOWN_STATE ||
        host.raceState === RaceState.STARTING) &&
      host.autoStartRemaining > 0
    ) {
      host.checkAutoStartCallouts(host.autoStartRemaining, prevAutoStart);
    } else if (host.autoStartRemaining <= 0) {
      host.playedAutoStart.clear();
      host.playedAutoStartElapsed.clear();
    }
    host.previousAutoStartRemaining = host.autoStartRemaining;

    if (
      host.raceState === RaceState.HEAT_OVER ||
      host.raceState === RaceState.UNKNOWN_STATE
    ) {
      host.autoAdvanceRemaining =
        raceTime.autoAdvanceRemaining ||
        (host.race as any)?.auto_advance_remaining_seconds ||
        0;
    } else {
      host.autoAdvanceRemaining = 0;
    }

    const prevAutoAdvance = host.previousAutoAdvanceRemaining;
    if (
      (host.raceState === RaceState.HEAT_OVER ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoAdvanceRemaining > 0
    ) {
      host.checkAutoAdvanceCallouts(host.autoAdvanceRemaining, prevAutoAdvance);
    } else if (host.autoAdvanceRemaining <= 0) {
      host.playedAutoAdvance.clear();
      host.playedAutoAdvanceElapsed.clear();
    }
    host.previousAutoAdvanceRemaining = host.autoAdvanceRemaining;
  }

  public static computeDisplayRaceTime(host: any, raceTime: any): number {
    const actualRaceTime = raceTime.time || 0;
    let time = actualRaceTime;
    if (
      (host.raceState === RaceState.NOT_STARTED ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoStartRemaining > 0 &&
      !host.isRestarting
    ) {
      time = host.autoStartRemaining;
    } else if (
      (host.raceState === RaceState.HEAT_OVER ||
        host.raceState === RaceState.UNKNOWN_STATE) &&
      host.autoAdvanceRemaining > 0
    ) {
      time = host.autoAdvanceRemaining;
    }

    if (host.showCountdownOverlay) {
      const countdownVal =
        host.autoStartRemaining > 0 ? host.autoStartRemaining : time;
      if (host.countdownTotalLamps === 0 && countdownVal > 0) {
        host.countdownTotalLamps = Math.min(
          host.getCountdownMaxLamps ? host.getCountdownMaxLamps() : 5,
          Math.ceil(countdownVal),
        );
      }
      host.updateCountdownLamps(countdownVal);
    }

    if (
      time === 0 &&
      host.previousTime > 0 &&
      host.showCountdownOverlay &&
      host.autoStartRemaining <= 0 &&
      host.autoAdvanceRemaining <= 0
    ) {
      time = host.previousTime;
    }
    return time;
  }

  public static updateRaceTimeFormat(host: any, time: number): void {
    const timerOpts = host.getTimerFormatOptions();
    host.raceTimeService?.setTimerFormatOptions(timerOpts);

    if (timerOpts.subsecondMode === "always") {
      const decimals = timerOpts.subsecondDecimals ?? 2;
      host.timeFormat = `1.${decimals}-${decimals}`;
    } else if (timerOpts.subsecondMode === "never") {
      host.timeFormat = "1.0-0";
    } else if (time > host.previousTime) {
      host.timeFormat = "1.0-0";
    } else if (time < host.previousTime) {
      if (host.raceState === RaceState.STARTING) {
        host.timeFormat = "1.0-0";
      } else {
        const threshold = timerOpts.subsecondThreshold ?? 10;
        const decimals = timerOpts.subsecondDecimals ?? 2;
        if (time < threshold && decimals > 0) {
          host.timeFormat = `1.${decimals}-${decimals}`;
        } else {
          host.timeFormat = "1.0-0";
        }
      }
    } else {
      if (time === 0) host.timeFormat = "1.0-0";
    }
  }

  public static subscribeToLapEvents(host: any): void {
    host.subscriptions.push(
      host.raceConnectionService.laps$.subscribe((lap: any) => {
        const currentHeat = host.raceService.getCurrentHeat() || host.heat;
        if (!currentHeat || !currentHeat.heatDrivers || !lap) return;

        const driverData = DriverMatchingUtils.findDriverForLap(
          currentHeat.heatDrivers,
          lap,
        );
        if (!driverData) return;

        const lapTotalTime =
          lap.totalTime != null && lap.totalTime > 0
            ? lap.totalTime
            : (lap as any).total_time != null && (lap as any).total_time > 0
              ? (lap as any).total_time
              : undefined;

        if (lap.type === LapType.FALSE_START) {
          if (lap.adjustedLapCount != null && !isNaN(lap.adjustedLapCount)) {
            driverData.adjustedLapCount = lap.adjustedLapCount;
          }
        } else {
          RacedaySubscriptionsHelper.applyLapTimeToDriver(
            driverData,
            lap,
            lapTotalTime,
          );
        }

        RacedaySubscriptionsHelper.syncLapToHeats(
          host,
          currentHeat,
          lap,
          driverData,
          lapTotalTime,
        );

        if (lap.fuelLevel != null) {
          if (driverData.participant) {
            driverData.participant.fuelLevel = Number(lap.fuelLevel);
          }
          const lane = driverData.laneIndex;
          if (lane != null) {
            host.updateLaneFuel(
              lane,
              Number(lap.fuelLevel),
              !!driverData.isRefueling,
            );
          }
        }

        host.handleLapEvent(lap, driverData);
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );
  }

  public static applyLapTimeToDriver(
    driverData: DriverHeatData,
    lap: any,
    lapTotalTime?: number,
  ): void {
    const currentLapCount =
      typeof driverData.lapTimes?.length === "number"
        ? driverData.lapTimes.length
        : Array.isArray((driverData as any).laps)
          ? (driverData as any).laps.length
          : (driverData as any).lapCount || 0;

    if (
      lap.lapNumber &&
      currentLapCount < lap.lapNumber &&
      typeof driverData.addLapTime === "function"
    ) {
      const segmentsCopy = [...(driverData.currentLapSegments || [])];
      driverData.addLapTime(
        lap.lapNumber,
        lap.lapTime ?? 0,
        lap.averageLapTime ?? 0,
        lap.medianLapTime ?? 0,
        lap.bestLapTime ?? 0,
        lap.adjustedLapCount ?? 0,
        lap.driverId ?? undefined,
        lap.isDrift ?? undefined,
        lap.type ?? undefined,
        segmentsCopy,
        lap.countTowardsRecords !== false,
        lapTotalTime,
      );
    }
  }

  public static syncLapToHeats(
    host: any,
    currentHeat: any,
    lap: any,
    driverData: DriverHeatData,
    lapTotalTime?: number,
  ): void {
    if (host.heat && host.heat !== currentHeat && host.heat.heatDrivers) {
      const localHd = DriverMatchingUtils.findDriverForLap(
        host.heat.heatDrivers,
        lap,
      );
      if (localHd) {
        if (lap.type === LapType.FALSE_START) {
          if (lap.adjustedLapCount != null && !isNaN(lap.adjustedLapCount)) {
            localHd.adjustedLapCount = lap.adjustedLapCount;
          }
        } else {
          RacedaySubscriptionsHelper.applyLapTimeToDriver(
            localHd,
            lap,
            lapTotalTime,
          );
        }
      }
    }

    if (host.heats && host.heats.length > 0 && currentHeat) {
      const targetHeat = host.heats.find(
        (h: any) =>
          (currentHeat.objectId && h.objectId === currentHeat.objectId) ||
          h.heatNumber === currentHeat.heatNumber,
      );
      if (targetHeat && targetHeat.heatDrivers) {
        const targetHd = DriverMatchingUtils.findDriverForLap(
          targetHeat.heatDrivers,
          lap,
        );
        if (targetHd && targetHd !== driverData) {
          if (lap.type === LapType.FALSE_START) {
            if (lap.adjustedLapCount != null && !isNaN(lap.adjustedLapCount)) {
              targetHd.adjustedLapCount = lap.adjustedLapCount;
            }
          } else {
            RacedaySubscriptionsHelper.applyLapTimeToDriver(
              targetHd,
              lap,
              lapTotalTime,
            );
          }
        }
      }
    }
  }

  public static handleLapEvent(
    host: any,
    lap: any,
    driverData: DriverHeatData,
  ): void {
    if (!host.isDestroyed) {
      host.livePredictionSubject.next();
    }

    const rawDriver =
      driverData?.actualDriver ||
      driverData?.participant?.driver ||
      (driverData?.driver as any)?.driver ||
      driverData?.driver;
    const activeTheme = host.themeService?.getActiveTheme?.();
    const driver = getEffectiveDriver(rawDriver, activeTheme);
    const isBestLap = lap.lapTime === lap.bestLapTime;
    const ttsContext = createTTSContext(driver as any, driverData as any);

    const hd =
      driverData ||
      host.heat?.heatDrivers?.find(
        (d: any) =>
          d.objectId === lap.objectId ||
          d.driver?.entity_id === driver?.entity_id ||
          d.laneIndex === lap.lane,
      );
    const association: AudioAssociation = {
      widgetType: "lane-view",
      laneIndex: hd?.laneIndex,
      driverId:
        driver?.entity_id || (driver as any)?.id || (driver as any)?.objectId,
    };

    if (
      host.handleSpecialLapAudio(
        lap,
        driverData,
        driver,
        ttsContext,
        association,
      )
    ) {
      return;
    }

    const candidates = RacedaySubscriptionsHelper.collectLapCandidates(
      host,
      lap,
      driverData,
      driver,
      isBestLap,
      ttsContext,
      association,
    );

    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > host.leaderLaps) {
      host.leaderLaps = lapNum;
    }

    const arbitration = arbitrateLapAudioCandidates(candidates);

    let played = false;
    if (arbitration.winner) {
      played = host.dispatchLapCandidate(arbitration.winner, false);
      for (const queued of arbitration.toQueue) {
        host.dispatchLapCandidate(queued, true);
      }
    }

    if (!played) {
      host.dispatchLapFallbackSfx(
        driver,
        isBestLap,
        ttsContext,
        association,
        arbitration.winner?.id === "milestone"
          ? arbitration.winner.config
          : undefined,
      );
    }

    host.handleLapHighlight(lap, driverData);
  }

  private static collectLapCandidates(
    host: any,
    lap: any,
    driverData: DriverHeatData,
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
  ): (LapAudioCandidate | null)[] {
    const candidates: (LapAudioCandidate | null)[] = [];

    const milestoneCandidate = host.resolveLapMilestoneCandidate(
      lap,
      driver,
      isBestLap,
      ttsContext,
      association,
    );
    if (milestoneCandidate) {
      candidates.push(milestoneCandidate);
    }

    const lapsLeftCandidate = host.resolveLapsLeftCandidate(lap, driverData);
    if (lapsLeftCandidate) {
      candidates.push(lapsLeftCandidate);
    }

    const halfwayCandidate = host.resolveHalfwayCandidate(lap, driverData);
    if (halfwayCandidate) {
      candidates.push(halfwayCandidate);
    }

    return candidates;
  }

  public static handleLapHighlight(
    host: any,
    lap: any,
    driverData?: DriverHeatData,
  ): void {
    const idsToHighlight: string[] = [];
    if (lap?.objectId) idsToHighlight.push(lap.objectId);
    if (driverData?.objectId && !idsToHighlight.includes(driverData.objectId)) {
      idsToHighlight.push(driverData.objectId);
    }
    if (
      driverData?.participant?.objectId &&
      !idsToHighlight.includes(driverData.participant.objectId)
    ) {
      idsToHighlight.push(driverData.participant.objectId);
    }
    if (lap?.driverId && !idsToHighlight.includes(lap.driverId)) {
      idsToHighlight.push(lap.driverId);
    }
    if (idsToHighlight.length === 0) return;

    const laneWidgets =
      host.currentRacedayLayout?.widgets?.filter(
        (w: any) =>
          w.widgetType === "lane-view" ||
          w.widgetType === "lane-column" ||
          w.widgetType === "progress-gauge" ||
          w.widgetType === "flag" ||
          Boolean(w.widgetType?.startsWith("custom:")),
      ) || [];
    const settings = host.settingsService.getSettings();
    const fallbackEnabled = host.isPracticeLayout
      ? settings?.highlightPracticeRowOnLap !== false
      : settings?.highlightRowOnLap !== false;

    const shouldHighlight =
      laneWidgets.length > 0
        ? laneWidgets.some((w: any) => {
            const style = w.customSettings?.["highlightLapStyle"];
            if (style === "none") return false;
            if (style) return true;
            return w.customSettings?.["highlightRowOnLap"] !== undefined
              ? Boolean(w.customSettings["highlightRowOnLap"])
              : fallbackEnabled;
          })
        : fallbackEnabled;

    if (shouldHighlight) {
      RacedaySubscriptionsHelper.applyLapHighlightTimer(host, idsToHighlight);
    }
  }

  private static applyLapHighlightTimer(
    host: any,
    idsToHighlight: string[],
  ): void {
    for (const id of idsToHighlight) {
      const existingTimer = host.lapHighlightTimers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        host.lapHighlightTimers.delete(id);
      }
      host.highlightedDrivers.add(id);
    }
    if (!host.isDestroyed) {
      host.cdr.markForCheck();
    }
    const timer = setTimeout(() => {
      for (const id of idsToHighlight) {
        host.lapHighlightTimers.delete(id);
        host.highlightedDrivers.delete(id);
      }
      if (!host.isDestroyed) {
        host.cdr.markForCheck();
      }
    }, 400);
    for (const id of idsToHighlight) {
      host.lapHighlightTimers.set(id, timer);
    }
  }

  public static getHighlightLapStyle(host: any): HighlightLapStyle {
    const laneWidgets =
      host.currentRacedayLayout?.widgets?.filter(
        (w: any) =>
          w.widgetType === "lane-view" ||
          w.widgetType === "lane-column" ||
          w.widgetType === "progress-gauge" ||
          w.widgetType === "flag" ||
          Boolean(w.widgetType?.startsWith("custom:")),
      ) || [];
    for (const w of laneWidgets) {
      const customStyle = w.customSettings?.["highlightLapStyle"];
      if (customStyle) {
        return customStyle;
      }
      if (w.customSettings?.["highlightRowOnLap"] === false) {
        return "none";
      }
      if (w.customSettings?.["highlightRowOnLap"] === true) {
        return "classic";
      }
    }
    const settings = host.settingsService?.getSettings();
    if (host.isPracticeLayout && settings?.highlightPracticeLapStyle) {
      return settings.highlightPracticeLapStyle;
    }
    return settings?.highlightLapStyle || "classic";
  }

  public static subscribeToLiveUpdates(host: any): void {
    host.subscriptions.push(
      host.raceConnectionService.carData$.subscribe((carData: any) => {
        if (!host.isDestroyed && carData && carData.lane != null) {
          if (carData.location != null) {
            host.carLocations.set(carData.lane, carData.location);
          }
          host.handleCarFuelAudio(carData);
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.segments$.subscribe((_segment: any) => {
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.reactionTimes$.subscribe((_rt: any) => {
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.standingsUpdate$.subscribe((update: any) => {
        if (update && update.updates) {
          update.updates.forEach((u: any) => {
            if (u.objectId) {
              host.driverRankings.set(u.objectId, u.rank || 0);
            }
          });
          if (host.heat?.heatDrivers) {
            const sortedByRank = [...host.heat.heatDrivers].sort((a, b) => {
              const rankA = host.driverRankings.get(a.objectId) ?? 999;
              const rankB = host.driverRankings.get(b.objectId) ?? 999;
              return rankA - rankB;
            });
            host.heat.standings = sortedByRank.map((hd: any) => hd.objectId);
          }
        }
        host.sortHeatDrivers();
      }),
    );
  }

  public static subscribeToUIEvents(host: any): void {
    if (host.route?.params) {
      host.subscriptions.push(
        host.route.params.subscribe((params: any) => {
          if (params && params["lane"]) {
            const parsed = parseInt(params["lane"], 10);
            if (!isNaN(parsed) && parsed > 0) {
              host.routeLaneIndex = parsed - 1;
              host.updateRacedayLayout();
              host.updateAudioRelevance();
              host.cdr.markForCheck();
            }
          }
          if (params && params["driverId"]) {
            host.routeDriverId = params["driverId"];
            host.checkDriverStatus();
            host.updateRacedayLayout();
            host.updateAudioRelevance();
            host.cdr.markForCheck();
          }
        }),
      );
    }

    host.subscriptions.push(
      host.route.queryParams.subscribe((params: any) => {
        if (params["themeId"]) {
          const themeId = params["themeId"];
          Promise.all([
            host.themeService.setTransientActiveTheme(themeId),
            host.customUiService.initialize(),
          ]).then(() => {
            host.updateRacedayLayout();
            host.updateTabTitle(themeId);
          });
        } else if (host.themeService?.getTransientThemeId?.()) {
          host.themeService.clearTransientActiveTheme();
          const activeRace = host.race || host.raceService?.getRace();
          if (activeRace?.entity_id) {
            host.themeService.activateForRace(
              activeRace.entity_id,
              activeRace.theme_id,
            );
          } else {
            host.updateRacedayLayout();
            host.updateTabTitle();
          }
        }
        if (params["modifyHeats"] === "true") {
          const returnUrl = host.router.url.split("?")[0];
          host.router.navigate(["/modify-heats"], {
            queryParams: { returnUrl },
            replaceUrl: true,
          });
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.interfaceEvents$.subscribe((_event: any) => {
        host.isInterfaceConnected =
          host.raceConnectionService.isInterfaceConnected;
        host.cdr.markForCheck();
        host.cdr.detectChanges();
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.interfaceAlert$.subscribe((alert: any) => {
        if (!host.raceHasEnded && host.raceState !== RaceState.RACE_OVER) {
          host.showInterfaceError(alert.titleKey, alert.messageKey);
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.recordData$.subscribe((records: any) => {
        if (records) {
          host.handleRecordDataUpdate(records);
        }
      }),
    );

    host.subscriptions.push(
      host.raceConnectionService.raceFlag$.subscribe((_flag: any) => {
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );
  }
}
