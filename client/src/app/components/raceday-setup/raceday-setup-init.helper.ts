import { DriverConverter } from "@app/converters/driver.converter";
import { TeamConverter } from "@app/converters/team.converter";
import { Driver } from "@app/models/driver";
import { DriverLabel } from "@app/models/driver-label";
import { Event as EventModel } from "@app/models/event";
import { Race } from "@app/models/race";
import { Season } from "@app/models/season";
import { Team } from "@app/models/team";

import { Participant } from "./raceday-setup-participant.helper";

export class RacedaySetupInitHelper {
  static initInitialData(host: any, result: any): void {
    const drivers = (result.drivers as any[]).map((d: any) => {
      const driver = DriverConverter.fromJSON(d);
      DriverConverter.register(driver);
      return driver;
    });

    const teams = (result.teams as any[]).map((t: any) => {
      const team = TeamConverter.fromJSON(t);
      TeamConverter.register(team);
      return team;
    });

    host.allDrivers = drivers;
    host.allTeams = teams;
    host.races = (result.races || []).sort((a: any, b: any) =>
      (a.name || "").localeCompare(b.name || ""),
    );
    host.events = (result.events || []).sort((a: any, b: any) =>
      (a.name || "").localeCompare(b.name || ""),
    );
    host.seasons = (result.seasons || []).sort((a: any, b: any) =>
      (a.name || "").localeCompare(b.name || ""),
    );
    host.driverLabels = (result.driverLabels as DriverLabel[]) || [];

    const localSettings = host.settingsService.getSettings();
    host.updateQuickStartRaces(localSettings.recentRaceIds);

    RacedaySetupInitHelper.initSeasonSelection(host, localSettings);
    RacedaySetupInitHelper.initRaceAndEventSelection(host, localSettings);
    RacedaySetupInitHelper.initParticipantSelection(
      host,
      drivers,
      teams,
      localSettings,
    );

    host.cdr.detectChanges();
  }

  static initSeasonSelection(host: any, localSettings: any): void {
    if (localSettings && localSettings.selectedSeasonId) {
      const matched = host.seasons.find(
        (s: Season) => s.entity_id === localSettings.selectedSeasonId,
      );
      if (matched) {
        host.selectedSeason = matched;
        host.calculateSeasonStandings();
      }
    }
  }

  static initRaceAndEventSelection(host: any, localSettings: any): void {
    if (localSettings && localSettings.selectedRaceId) {
      if (localSettings.isEventMode) {
        const matchedEvent = host.events.find(
          (e: EventModel) => e.entity_id === localSettings.selectedRaceId,
        );
        if (matchedEvent) {
          host.selectedEvent = matchedEvent;
          host.selectedRace = undefined;
        }
      } else {
        const matchedRace = host.races.find(
          (r: Race) => r.entity_id === localSettings.selectedRaceId,
        );
        if (matchedRace) {
          host.selectedRace = matchedRace;
          host.selectedEvent = undefined;
        }
      }

      if (!host.selectedRace && !host.selectedEvent) {
        const matchedRace = host.races.find(
          (r: Race) => r.entity_id === localSettings.selectedRaceId,
        );
        if (matchedRace) {
          host.selectedRace = matchedRace;
          host.selectedEvent = undefined;
        } else {
          const matchedEvent = host.events.find(
            (e: EventModel) => e.entity_id === localSettings.selectedRaceId,
          );
          if (matchedEvent) {
            host.selectedEvent = matchedEvent;
            host.selectedRace = undefined;
          }
        }
      }
    }

    if (!host.selectedRace && !host.selectedEvent) {
      if (
        localSettings &&
        localSettings.recentRaceIds &&
        localSettings.recentRaceIds.length > 0
      ) {
        const defaultId = localSettings.recentRaceIds[0];
        const matchedRace = host.races.find(
          (r: Race) => r.entity_id === defaultId,
        );
        if (matchedRace) {
          host.selectedRace = matchedRace;
          host.selectedEvent = undefined;
        } else {
          const matchedEvent = host.events.find(
            (e: EventModel) => e.entity_id === defaultId,
          );
          if (matchedEvent) {
            host.selectedEvent = matchedEvent;
            host.selectedRace = undefined;
          }
        }
      }
      if (!host.selectedRace && !host.selectedEvent && host.races.length > 0) {
        host.selectedRace = host.races[0];
      } else if (
        !host.selectedRace &&
        !host.selectedEvent &&
        host.events.length > 0
      ) {
        host.selectedEvent = host.events[0];
      }
    }

    if (host.themeService?.getTransientThemeId?.()) {
      host.themeService.clearTransientActiveTheme();
    }
    if (host.selectedRace?.entity_id) {
      host.themeService.activateForRace(
        host.selectedRace.entity_id,
        host.selectedRace.theme_id,
      );
    }
  }

  static initParticipantSelection(
    host: any,
    drivers: Driver[],
    teams: Team[],
    localSettings: any,
  ): void {
    const allParticipants: Participant[] = [...drivers, ...teams];
    const participantMap = new Map(
      allParticipants.map((p) => [
        host.isDriver(p) ? `d_${p.entity_id}` : `t_${p.entity_id}`,
        p,
      ]),
    );

    if (localSettings && localSettings.selectedDriverIds) {
      const loadedParticipants: Participant[] = [];
      for (const rawId of localSettings.selectedDriverIds) {
        let prefixedId = rawId;
        if (!rawId.startsWith("d_") && !rawId.startsWith("t_")) {
          if (participantMap.has(`d_${rawId}`)) {
            prefixedId = `d_${rawId}`;
          } else if (participantMap.has(`t_${rawId}`)) {
            prefixedId = `t_${rawId}`;
          }
        }

        const p = participantMap.get(prefixedId);
        if (p) {
          loadedParticipants.push(p);
        }
      }
      host.selectedParticipants = loadedParticipants;
    }
    host.updateUnselectedParticipants();
  }

  static initSystemSubscriptions(host: any): void {
    host.translationService
      .getTranslationsLoaded()
      .subscribe((loaded: boolean) => {
        host.translationsLoaded = loaded;
        host.cdr.detectChanges();
      });

    const settings = host.settingsService.getSettings();
    host.currentClientLogLevel = settings.clientLogLevel || "INFO";
    host.currentServerLogLevel = settings.serverLogLevel || "INFO";
    host.demoConfig = settings.demoConfig;

    host.dataService.getSystemState().subscribe((state: any) => {
      if (state) {
        host.isRaceRunning = state.resourceLockState === "RACE_RUNNING";
        if (host.isRaceRunning && state.isReplayMode) {
          host.router.navigate(["/raceday"]);
        }
        host.cdr.detectChanges();
      }
    });

    host.detectShortcutKey();
  }
}
