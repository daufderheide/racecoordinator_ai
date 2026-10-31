import { createMockEditorData } from "@app/components/raceday/utils/raceday-mock.utils";
import { DriverConverter } from "@app/converters/driver.converter";
import { HeatConverter } from "@app/converters/heat.converter";
import { LaneConverter } from "@app/converters/lane.converter";
import { RaceConverter } from "@app/converters/race.converter";
import { RaceParticipantConverter } from "@app/converters/race_participant.converter";
import { TeamConverter } from "@app/converters/team.converter";
import { TrackConverter } from "@app/converters/track.converter";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

export class RacedayInitSetupHelper {
  static initVisualViewport(host: any): void {
    if (
      typeof window !== "undefined" &&
      window.visualViewport &&
      typeof window.visualViewport.addEventListener === "function"
    ) {
      host.visualViewportHandler = () => {
        host.updateScale();
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      };
      window.visualViewport.addEventListener(
        "resize",
        host.visualViewportHandler,
      );
      window.visualViewport.addEventListener(
        "scroll",
        host.visualViewportHandler,
      );
    }
  }

  static initHelpStepSubscription(host: any): void {
    host.subscriptions.push(
      host.helpService.currentStep$.subscribe((step: any) => {
        if (step && step.selector === "#help-widget-toolbox") {
          if (host.isLayoutEditorMinimized) {
            host.isLayoutEditorMinimized = false;

            const settings =
              host.editingSettings() || host.settingsService.getSettings();
            settings.layoutEditorMinimized = false;

            const globalSettings = host.settingsService.getSettings();
            globalSettings.layoutEditorMinimized = false;
            host.settingsService.saveSettings(globalSettings);

            host.cdr.markForCheck();
          }
        }
      }),
    );
  }

  static initThemeAndTranslationSubscriptions(host: any): void {
    host.subscriptions.push(
      host.themeService.activeTheme$.subscribe(() => {
        host.laneQrCodeCache.clear();
        host.generatingLaneQrCodes.clear();
        host.driverViewQrCodeCache.clear();
        host.updateRacedayLayout();
        host.refreshCountdownLampUrls();
        host.preloadCountdownAudio();
        host.updateTabTitle();
        if (!host.isDestroyed) {
          host.cdr.markForCheck();
        }
      }),
    );

    if (host.translationService?.getTranslationsLoaded) {
      host.subscriptions.push(
        host.translationService
          .getTranslationsLoaded()
          .subscribe((loaded: boolean) => {
            if (loaded) {
              host.updateTabTitle();
            }
          }),
      );
    }

    host.subscriptions.push(
      host.customUiService.customUIs$.subscribe(() => {
        host.updateRacedayLayout();
      }),
    );
  }

  static setupInitialState(host: any): void {
    if (host.route?.snapshot?.params?.["lane"]) {
      const parsed = parseInt(host.route.snapshot.params["lane"], 10);
      if (!isNaN(parsed) && parsed > 0) {
        host.routeLaneIndex = parsed - 1;
      }
    }
    if (host.route?.snapshot?.params?.["driverId"]) {
      host.routeDriverId = host.route.snapshot.params["driverId"];
      host.checkDriverStatus();
    }
    host.viewerRaceEndedHandler = new ViewerRaceEndedHandler(
      host.dataService,
      host.authService,
      host.cdr,
      {
        onlyForViewer: false,
        onRaceEnded: () => {
          host.showExitConfirmation = false;
          host.showSkipHeatConfirmation = false;
          host.showRestartHeatConfirmation = false;
          host.showDeferHeatConfirmation = false;
        },
      },
    );
    host.raceHasEnded = false;
    host.isInterfaceConnected = host.raceConnectionService.isInterfaceConnected;

    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    host.isLayoutEditorMinimized = settings.layoutEditorMinimized ?? false;
    host.layoutEditorPosition = host.clampLayoutEditorPosition({
      x: settings.layoutEditorPositionX ?? 0,
      y: settings.layoutEditorPositionY ?? 0,
    });
    if (host.currentRacedayLayout && host.currentRacedayLayout.widgets) {
      host.layout = JSON.parse(JSON.stringify(host.currentRacedayLayout));
    } else {
      host.layout = host.getDefaultLayout();
    }

    host.loadColumns();
    host.assets = host.dataService?.loadedAssets || [];

    // Clear caches to ensure fresh data for new race
    RaceConverter.clearCache();
    DriverConverter.clearCache();
    HeatConverter.clearCache();
    TrackConverter.clearCache();
    LaneConverter.clearCache();
    RaceParticipantConverter.clearCache();
    TeamConverter.clearCache();
  }

  static subscribeToAssets(host: any): void {
    if (host.dataService?.assets$) {
      host.subscriptions.push(
        host.dataService.assets$.subscribe((assets: any[]) => {
          if (assets && assets.length > 0) {
            host.assets = assets;
            host.refreshCountdownLampUrls();
            if (!host.isDestroyed) {
              host.cdr.markForCheck();
            }
          }
        }),
      );
    }

    if (host.dataService?.socketConnected$) {
      host.subscriptions.push(
        host.dataService.socketConnected$.subscribe((connected: boolean) => {
          if (connected && host.dataService?.listAssets) {
            host.dataService.listAssets().subscribe({
              next: (assets: any[]) => {
                host.assets = assets || [];
                host.refreshCountdownLampUrls();
                host.loadColumns();
                host.preloadCountdownAudio();
                if (!host.isDestroyed) {
                  host.cdr.markForCheck();
                }
              },
              error: (err: any) => {
                host.logger.error(
                  "DefaultRacedayComponent: Failed to fetch assets",
                  err,
                );
              },
            });

            host.dataService.getDrivers().subscribe({
              next: (drivers: any[]) => {
                host.allDrivers = drivers || [];
                if (!host.isDestroyed) {
                  host.cdr.markForCheck();
                }
              },
              error: (err: any) => {
                host.logger.error(
                  "DefaultRacedayComponent: Failed to fetch drivers",
                  err,
                );
              },
            });
          }
        }),
      );
    }
  }

  static setupMockDataForEditor(host: any): void {
    const mockData = createMockEditorData();
    host.raceState = mockData.raceState;
    host.time = mockData.time;
    host.race = mockData.race;
    host.track = mockData.track;
    host.participants = mockData.participants;
    host.heat = mockData.heat;
    host.heats = mockData.heats;
    host.groupParticipants = mockData.groupParticipants;
    host.currentGroup = 1;
    host.qrCodeUrl =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='white'/><rect x='10' y='10' width='20' height='20' fill='black'/><rect x='50' y='10' width='20' height='20' fill='black'/><rect x='10' y='50' width='20' height='20' fill='black'/><rect x='40' y='40' width='10' height='10' fill='black'/><rect x='30' y='30' width='20' height='20' fill='black'/></svg>";

    host.laneQrCodeCache.clear();
    for (let i = 0; i < 16; i++) {
      host.laneQrCodeCache.set(i, host.qrCodeUrl);
    }
    host.driverViewQrCodeCache.clear();
    if (host.heat?.heatDrivers) {
      for (const hd of host.heat.heatDrivers) {
        const entityId =
          hd.actualDriver?.entity_id ||
          hd.driver?.entity_id ||
          hd.actualDriver?.name ||
          hd.driver?.name ||
          hd.participant?.team?.entity_id ||
          hd.participant?.team?.name ||
          hd.participant?.objectId ||
          hd.objectId;
        if (entityId) {
          host.driverViewQrCodeCache.set(entityId, host.qrCodeUrl);
        }
      }
    }
    if (host.participants) {
      for (const p of host.participants) {
        const entityId =
          p.driver?.entity_id ||
          p.driver?.name ||
          p.team?.entity_id ||
          p.team?.name ||
          p.objectId;
        if (entityId) {
          host.driverViewQrCodeCache.set(entityId, host.qrCodeUrl);
        }
      }
    }

    host.raceRecordLapNickname = "Mario";
    host.raceRecordLapTime = 1.842;
    host.raceRecordScoreNickname = "Luigi";
    host.raceRecordScore = 24.5;
    host.currentRaceBestNickname = "Bowser";
    host.currentRaceBestTime = 1.955;
    host.heatBestNickname = "Peach";
    host.heatBestTime = 2.012;
    host.recordData = mockData.recordData;

    host.driverRankings.clear();
    if (host.heat?.heatDrivers) {
      host.heat.heatDrivers.forEach((hd: any, index: number) => {
        host.driverRankings.set(hd.objectId, index + 1);
      });
      host.heat.standings = host.heat.heatDrivers.map((hd: any) => hd.objectId);
    }

    host.sortHeatDrivers();
    host.updateLeaderboardEntries();
    host.updateGroupLeaderboardEntries();
    host.syncHeatDriversWithParticipants();
    host.cdr.markForCheck();
  }
}
