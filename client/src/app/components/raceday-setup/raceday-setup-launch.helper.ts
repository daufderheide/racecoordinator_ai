import { Event as EventModel } from "@app/models/event";
import { Race } from "@app/models/race";
import { Settings } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";

export interface ParsedInitializeRaceError {
  errorTitle: string;
  errorMessage: string;
  errorMessageParams: Record<string, string>;
}

export class RacedaySetupLaunchHelper {
  static toggleDropdown(host: any, event: Event): void {
    event.stopPropagation();
    const newState = !host.isDropdownOpen;
    if (newState) {
      host.closeFileDropdown();
      host.closeConfigDropdown();
      host.closeOptionsDropdown();
      host.closeHelpDropdown();
    }
    host.isDropdownOpen = newState;
    host.cdr.detectChanges();
  }

  static closeDropdown(host: any): void {
    host.isDropdownOpen = false;
    host.isEventDropdownOpen = false;
  }

  static toggleEventDropdown(host: any, e: MouseEvent): void {
    e.stopPropagation();
    const newState = !host.isEventDropdownOpen;
    if (newState) {
      host.closeFileDropdown();
      host.closeConfigDropdown();
      host.closeOptionsDropdown();
      host.closeHelpDropdown();
      host.closeDropdown();
    }
    host.isEventDropdownOpen = newState;
    host.cdr.detectChanges();
  }

  static selectEvent(host: any, event: EventModel): void {
    host.selectedEvent = event;
    host.selectedRace = undefined;
    host.saveSettings();
    host.closeDropdown();
    host.cdr.detectChanges();
  }

  static selectRace(host: any, race: Race): void {
    host.selectedRace = race;
    host.selectedEvent = undefined;
    if (race?.entity_id) {
      if (host.themeService?.getTransientThemeId?.()) {
        host.themeService.clearTransientActiveTheme();
      }
      host.themeService.activateForRace(race.entity_id, race.theme_id);
    }
    host.saveSettings();
    host.closeDropdown();
    host.cdr.detectChanges();
  }

  static saveSettings(host: any, updateRecent: boolean = false): void {
    const settings = host.settingsService.getSettings();

    const selectedId = host.isEventMode
      ? host.selectedEvent?.entity_id || ""
      : host.selectedRace?.entity_id || "";

    if (selectedId) {
      settings.selectedRaceId = selectedId;
      settings.isEventMode = host.isEventMode;

      if (updateRecent) {
        let recentRaceIds = settings.recentRaceIds || [];
        recentRaceIds = [
          selectedId,
          ...recentRaceIds.filter((id: string) => id !== selectedId),
        ];
        settings.recentRaceIds = recentRaceIds.slice(0, 2);
      }
    }

    settings.selectedDriverIds = host.selectedParticipants.map((p: any) =>
      host.getParticipantUniqueId(p),
    );
    settings.demoConfig = host.demoConfig;
    settings.selectedSeasonId = host.selectedSeason?.entity_id || "";

    host.settingsService.saveSettings(settings);

    if (updateRecent) {
      host.updateQuickStartRaces(settings.recentRaceIds);
    }
  }

  static parseInitializeRaceError(
    response: any,
    selectedRaceName: string,
    selectedEventName: string,
    translationService: TranslationService,
  ): ParsedInitializeRaceError {
    const errorTitle = "RDS_ERR_VALIDATION_TITLE";
    let errorMessage: string;
    let errorMessageParams: Record<string, string>;

    if (response.errorCode === "DUPE_INDIVIDUAL_TEAM") {
      errorMessage = "RDS_ERR_DRIVER_DUPE_IND_TEAM";
      errorMessageParams = {
        driver: response.driverName,
        team: response.teamNames.join(", "),
      };
    } else if (response.errorCode === "DUPE_MULTIPLE_TEAMS") {
      errorMessage = "RDS_ERR_DRIVER_DUPE_TEAMS";
      errorMessageParams = {
        driver: response.driverName,
        teams: response.teamNames.join(", "),
      };
    } else if (response.errorCode === "TRACK_DELETED") {
      errorMessage = "RDS_ERR_TRACK_DELETED";
      errorMessageParams = {
        race: selectedRaceName || selectedEventName || "",
      };
    } else if (response.errorCode === "THEME_DELETED") {
      errorMessage = "RDS_ERR_THEME_DELETED";
      errorMessageParams = {
        race: selectedRaceName || selectedEventName || "",
      };
    } else if (response.errorCode === "NO_CUSTOM_ROTATIONS") {
      errorMessage = "RDS_ERR_NO_CUSTOM_ROTATIONS";
      errorMessageParams = {};
    } else {
      errorMessage = response.errorCode || "Unknown error";
      errorMessageParams = {};
    }

    if (response.errorCode) {
      const translatedMessage = translationService.translate(
        errorMessage,
        errorMessageParams,
      );
      const fixKey =
        response.errorCode === "NO_CUSTOM_ROTATIONS"
          ? "RDS_ERR_NO_CUSTOM_ROTATIONS_FIX"
          : response.errorCode === "TRACK_DELETED"
            ? "RDS_ERR_TRACK_DELETED_FIX"
            : response.errorCode === "THEME_DELETED"
              ? "RDS_ERR_THEME_DELETED_FIX"
              : "RDS_ERR_START_RACE_FIX_DESCRIPTION";
      const fixDescription = translationService.translate(fixKey);
      errorMessage = translatedMessage + "\n\n" + fixDescription;
      errorMessageParams = {};
    }

    return { errorTitle, errorMessage, errorMessageParams };
  }

  static computeQuickStartRaces(
    recentRaceIds: string[] = [],
    localSettings: Settings | undefined,
    races: Race[],
    events: EventModel[],
  ): (Race | EventModel)[] {
    const quickStartRaces: (Race | EventModel)[] = [];

    if (recentRaceIds && recentRaceIds.length > 0) {
      for (const id of recentRaceIds) {
        const isSelected = localSettings && localSettings.selectedRaceId === id;
        const isEventPreferred = isSelected && localSettings.isEventMode;

        if (isEventPreferred) {
          const event = events.find((e) => e.entity_id === id);
          if (event) {
            quickStartRaces.push(event);
            continue;
          }
        }

        const race = races.find((r) => r.entity_id === id);
        if (race) {
          quickStartRaces.push(race);
        } else {
          const event = events.find((e) => e.entity_id === id);
          if (event) {
            quickStartRaces.push(event);
          }
        }
      }
    }

    if (quickStartRaces.length < 2) {
      const defaults = [
        races.find((r) => r.name.toLowerCase().includes("grand prix")),
        races.find((r) => r.name.toLowerCase().includes("time trial")),
      ].filter(
        (r) =>
          r !== undefined &&
          !quickStartRaces.some((qsr) => qsr.entity_id === r.entity_id),
      ) as Race[];

      for (const d of defaults) {
        if (quickStartRaces.length < 2) {
          quickStartRaces.push(d);
        }
      }
    }

    if (quickStartRaces.length < 2) {
      const remainingRaces = races.filter(
        (r) => !quickStartRaces.some((qsr) => qsr.entity_id === r.entity_id),
      );
      for (const r of remainingRaces) {
        if (quickStartRaces.length < 2) {
          quickStartRaces.push(r);
        }
      }
    }

    if (quickStartRaces.length < 2) {
      const remainingEvents = events.filter(
        (e) => !quickStartRaces.some((qsr) => qsr.entity_id === e.entity_id),
      );
      for (const e of remainingEvents) {
        if (quickStartRaces.length < 2) {
          quickStartRaces.push(e);
        }
      }
    }

    return quickStartRaces;
  }

  static selectQuickStartItem(host: any, item: any): void {
    if (!item) return;
    const isEventItem = item.races && Array.isArray(item.races);
    if (isEventItem) {
      const foundEvent = host.events.find(
        (e: EventModel) => e.entity_id === item.entity_id,
      );
      if (foundEvent) {
        host.selectEvent(foundEvent);
        return;
      }
    }
    const foundRace = host.races.find(
      (r: Race) => r.entity_id === item.entity_id,
    );
    if (foundRace) {
      host.selectRace(foundRace);
    } else {
      const foundEvent = host.events.find(
        (e: EventModel) => e.entity_id === item.entity_id,
      );
      if (foundEvent) {
        host.selectEvent(foundEvent);
      }
    }
  }

  static startRace(host: any, isDemo: boolean): void {
    const hasSelection = host.isEventMode
      ? host.selectedEvent && host.selectedParticipants.length > 0
      : host.selectedRace && host.selectedParticipants.length > 0;

    if (hasSelection) {
      const raceId = host.isEventMode
        ? host.selectedEvent?.entity_id || ""
        : host.selectedRace!.entity_id;

      host.dataService.getSavedRaces(isDemo).subscribe({
        next: (races: any[]) => {
          const autoSaveFile = races.find(
            (f) => f.filename === `autosave_${raceId}.json`,
          );
          if (autoSaveFile) {
            host.autoSaveFileToLoad = autoSaveFile.filename;
            host.pendingIsDemo = isDemo;
            host.showAutoSavePrompt = true;
            host.cdr.detectChanges();
            return;
          }
          host.proceedWithStart(isDemo);
        },
        error: (err: any) => {
          host.logger.error("Failed to check for auto-save:", err);
          host.proceedWithStart(isDemo);
        },
      });
    }
  }

  static proceedWithStart(host: any, isDemo: boolean): void {
    const validationResult = host.validationService.validate(
      host.selectedParticipants,
      host.allTeams,
      host.allDrivers,
    );

    if (!validationResult.isValid) {
      host.errorTitle = "RDS_ERR_VALIDATION_TITLE";
      host.errorMessage = host.validationService.getErrorMessage(
        validationResult,
        host.translationService,
      );
      host.errorMessageParams = {};
      host.showErrorModal = true;
      host.cdr.detectChanges();
      return;
    }

    host.saveSettings(true);
    const settings = host.settingsService.getSettings();

    const raceId = host.isEventMode ? "" : host.selectedRace?.entity_id || "";
    const eventId = host.isEventMode
      ? host.selectedEvent?.entity_id || ""
      : undefined;
    const seasonId = host.selectedSeason?.entity_id || undefined;
    const demoConfig = isDemo
      ? host.demoConfig || host.dataService.getDefaultDemoConfig()
      : undefined;

    const themeId =
      (raceId ? settings.raceThemeOverrides?.[raceId] : undefined) ||
      host.selectedRace?.theme_id ||
      undefined;

    const initializeObservable =
      eventId || seasonId
        ? host.dataService.initializeRace(
            raceId,
            settings.selectedDriverIds,
            isDemo,
            demoConfig,
            eventId,
            seasonId,
            themeId,
          )
        : host.dataService.initializeRace(
            raceId,
            settings.selectedDriverIds,
            isDemo,
            demoConfig,
            undefined,
            undefined,
            themeId,
          );

    initializeObservable.subscribe({
      next: (response: any) => {
        if (response.success) {
          host.router.navigate(["/raceday"]);
        } else {
          host.handleInitializeRaceError(response);
        }
      },
      error: (err: any) => host.logger.error("Failed to initialize race", err),
    });
  }

  static onConfirmEndRace(host: any): void {
    host.showEndRacePrompt = false;
    host.dataService.endRace().subscribe({
      next: (success: boolean) => {
        if (success) {
          host.logger.info("Race ended successfully");
        } else {
          host.logger.warn("Failed to end race");
        }
      },
      error: (err: any) => {
        host.logger.error("Error ending race", err);
      },
    });
  }

  static onConfirmAutoSave(host: any): void {
    host.showAutoSavePrompt = false;
    host.saveSettings(true);
    if (host.autoSaveFileToLoad) {
      host.dataService
        .loadRace(host.autoSaveFileToLoad, host.pendingIsDemo)
        .subscribe({
          next: () => host.router.navigate(["/raceday"]),
          error: (err: any) =>
            host.logger.error("Failed to load auto-save:", err),
        });
    }
  }

  static onCancelAutoSave(host: any): void {
    host.showAutoSavePrompt = false;
    if (host.autoSaveFileToLoad) {
      host.dataService
        .deleteSavedRace(host.autoSaveFileToLoad, host.pendingIsDemo)
        .subscribe({
          error: (err: any) =>
            host.logger.error("Failed to delete auto-save:", err),
        });
    }
    host.proceedWithStart(host.pendingIsDemo);
  }
}
