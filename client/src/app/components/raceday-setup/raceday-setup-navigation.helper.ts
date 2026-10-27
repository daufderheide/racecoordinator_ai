import { Season } from "@app/models/season";

export class RacedaySetupNavigationHelper {
  static buildMenuItems(
    host: any,
  ): { label: string; action: (event: MouseEvent) => void }[] {
    return [
      {
        label: "RDS_MENU_FILE",
        action: (event: MouseEvent) => host.toggleFileDropdown(event),
      },
      {
        label: "RDS_MENU_CONFIG",
        action: (event: MouseEvent) => host.toggleConfigDropdown(event),
      },
      {
        label: "RDS_MENU_OPTIONS",
        action: (event: MouseEvent) => host.toggleOptionsDropdown(event),
      },
      {
        label: "RDS_MENU_HELP",
        action: (event: MouseEvent) => host.toggleHelpDropdown(event),
      },
    ];
  }

  static toggleOptionsDropdown(host: any, event: Event): void {
    event.stopPropagation();
    const newState = !host.isOptionsDropdownOpen;
    if (newState) {
      host.closeFileDropdown();
      host.closeConfigDropdown();
      host.closeHelpDropdown();
      host.closeDropdown();
    }
    host.isOptionsDropdownOpen = newState;
    host.cdr.detectChanges();
  }

  static toggleLogDropdown(host: any, event: Event): void {
    event.stopPropagation();
    host.isLogDropdownOpen = !host.isLogDropdownOpen;
    if (!host.isLogDropdownOpen) {
      host.isClientLogOpen = false;
      host.isServerLogOpen = false;
    }
    host.cdr.detectChanges();
  }

  static toggleClientLogDropdown(host: any, event: Event): void {
    event.stopPropagation();
    host.isClientLogOpen = !host.isClientLogOpen;
    if (host.isClientLogOpen) {
      host.isServerLogOpen = false;
    }
    host.cdr.detectChanges();
  }

  static toggleServerLogDropdown(host: any, event: Event): void {
    event.stopPropagation();
    host.isServerLogOpen = !host.isServerLogOpen;
    if (host.isServerLogOpen) {
      host.isClientLogOpen = false;
    }
    host.cdr.detectChanges();
  }

  static setClientLogLevel(host: any, level: string): void {
    const settings = host.settingsService.getSettings();
    settings.clientLogLevel = level;
    host.settingsService.saveSettings(settings);
    host.currentClientLogLevel = level;
    host.logger.setLevel(level as any);
    host.closeHelpDropdown();
  }

  static setServerLogLevel(host: any, level: string): void {
    const settings = host.settingsService.getSettings();
    settings.serverLogLevel = level;
    host.settingsService.saveSettings(settings);
    host.currentServerLogLevel = level;
    host.dataService.setServerLogLevel(level).subscribe({
      next: () => host.logger.info(`Server log level set to ${level}`),
      error: (err: any) =>
        host.logger.error("Failed to set server log level", err),
    });
    host.closeHelpDropdown();
  }

  static toggleFileDropdown(host: any, event: Event): void {
    event.stopPropagation();
    const newState = !host.isFileDropdownOpen;
    if (newState) {
      host.closeConfigDropdown();
      host.closeOptionsDropdown();
      host.closeHelpDropdown();
      host.closeDropdown();
    }
    host.isFileDropdownOpen = newState;
    host.cdr.detectChanges();
  }

  static toggleConfigDropdown(host: any, event: Event): void {
    event.stopPropagation();
    const newState = !host.isConfigDropdownOpen;
    if (newState) {
      host.closeFileDropdown();
      host.closeOptionsDropdown();
      host.closeHelpDropdown();
      host.closeDropdown();
    }
    host.isConfigDropdownOpen = newState;
    host.cdr.detectChanges();
  }

  static toggleHelpDropdown(host: any, event: Event): void {
    event.stopPropagation();
    const newState = !host.isHelpDropdownOpen;
    if (newState) {
      host.closeFileDropdown();
      host.closeConfigDropdown();
      host.closeOptionsDropdown();
      host.closeDropdown();
      host.isHelpDropdownOpen = true;
    } else {
      host.closeHelpDropdown();
    }
    host.cdr.detectChanges();
  }

  static closeHelpDropdown(host: any): void {
    host.isHelpDropdownOpen = false;
    host.isLogDropdownOpen = false;
    host.isClientLogOpen = false;
    host.isServerLogOpen = false;
  }

  static isAnyMenuDropdownOpen(host: any): boolean {
    return (
      host.isFileDropdownOpen ||
      host.isConfigDropdownOpen ||
      host.isOptionsDropdownOpen ||
      host.isHelpDropdownOpen ||
      host.isDropdownOpen ||
      host.isEventDropdownOpen ||
      host.showErrorModal ||
      host.showDemoConfigModal ||
      host.showRacingRosterDialog ||
      host.showQuitBlockedModal ||
      host.showEndRacePrompt ||
      host.showTrackEditorPrompt ||
      host.showAutoSavePrompt ||
      host.showLoadRaceModal ||
      host.isAboutModalVisible
    );
  }

  static onMenuItemHover(host: any, label: string): void {
    if (host.isAnyMenuDropdownOpen()) {
      if (label === "RDS_MENU_FILE" && host.isFileDropdownOpen) return;
      if (label === "RDS_MENU_CONFIG" && host.isConfigDropdownOpen) return;
      if (label === "RDS_MENU_OPTIONS" && host.isOptionsDropdownOpen) return;
      if (label === "RDS_MENU_HELP" && host.isHelpDropdownOpen) return;

      host.closeFileDropdown();
      host.closeConfigDropdown();
      host.closeOptionsDropdown();
      host.closeHelpDropdown();
      host.closeDropdown();

      if (label === "RDS_MENU_FILE") {
        host.isFileDropdownOpen = true;
      } else if (label === "RDS_MENU_CONFIG") {
        host.isConfigDropdownOpen = true;
      } else if (label === "RDS_MENU_OPTIONS") {
        host.isOptionsDropdownOpen = true;
      } else if (label === "RDS_MENU_HELP") {
        host.isHelpDropdownOpen = true;
      }
      host.cdr.detectChanges();
    }
  }

  static openDriverManager(host: any): void {
    host.closeConfigDropdown();
    if (host.selectedParticipantItem) {
      host.router.navigate(["/driver-editor"], {
        queryParams: { id: host.selectedParticipantItem.entity_id },
      });
    } else {
      host.router.navigate(["/driver-editor"]);
    }
  }

  static openTeamManager(host: any): void {
    host.closeConfigDropdown();
    if (host.selectedParticipantItem) {
      host.router.navigate(["/team-editor"], {
        queryParams: { id: host.selectedParticipantItem.entity_id },
      });
    } else {
      host.router.navigate(["/team-editor"]);
    }
  }

  static openTrackManager(host: any): void {
    host.closeConfigDropdown();
    if (host.isRaceRunning) {
      host.showTrackEditorPrompt = true;
      host.cdr.detectChanges();
    } else {
      host.router.navigate(["/track-editor"]);
    }
  }

  static onConfirmTrackEditor(host: any): void {
    host.showTrackEditorPrompt = false;
    host.dataService.endRace().subscribe({
      next: (success: boolean) => {
        if (success) {
          host.logger.info(
            "Race ended successfully, navigating to track manager",
          );
          host.router.navigate(["/track-editor"]);
        } else {
          host.logger.warn("Failed to end race");
        }
      },
      error: (err: any) => {
        host.logger.error("Error ending race", err);
      },
    });
  }

  static editSelectedRace(host: any): void {
    if (!host.selectedRace) return;
    sessionStorage.setItem("skipIntro", "true");
    const queryParams: any = {
      id: host.selectedRace.entity_id,
      from: "raceday-setup",
      returnUrl: "/raceday-setup",
    };
    if (host.selectedParticipants?.length > 0) {
      queryParams.driverCount = host.selectedParticipants.length;
    }
    host.router.navigate(["/race-editor"], { queryParams });
  }

  static editSelectedSeason(host: any): void {
    if (!host.selectedSeason) return;
    sessionStorage.setItem("skipIntro", "true");
    const queryParams: any = {
      id: host.selectedSeason.entity_id,
      from: "raceday-setup",
      returnUrl: "/raceday-setup",
    };
    host.router.navigate(["/season-editor"], { queryParams });
  }

  static openRaceManager(host: any): void {
    const queryParams: any = host.selectedRace
      ? { id: host.selectedRace.entity_id }
      : {};
    if (host.selectedParticipants.length > 0) {
      queryParams.driverCount = host.selectedParticipants.length;
    }
    host.closeConfigDropdown();
    host.router.navigate(["/race-editor"], { queryParams });
  }

  static openEventManager(host: any): void {
    const queryParams: any = host.selectedEvent
      ? { id: host.selectedEvent.entity_id }
      : {};
    host.closeConfigDropdown();
    host.router.navigate(["/event-editor"], { queryParams });
  }

  static onSeasonChange(host: any): void {
    host.calculateSeasonStandings();
    if (host.selectedSeason?.entity_id) {
      host.dataService
        .getSeasonStandings(host.selectedSeason.entity_id)
        .subscribe({
          next: (standings: any) => {
            host.seasonStandings = standings;
            host.cdr.detectChanges();
          },
          error: (err: any) => {
            host.logger.warn("Failed to fetch season standings", err);
          },
        });
    }
    host.saveSettings();
  }

  static selectSeason(host: any, season?: Season): void {
    host.selectedSeason = season;
    host.calculateSeasonStandings();
    if (season?.entity_id) {
      host.dataService.getSeasonStandings(season.entity_id).subscribe({
        next: (standings: any) => {
          if (host.selectedSeason?.entity_id === season.entity_id) {
            host.seasonStandings = standings;
            host.cdr.detectChanges();
          }
        },
        error: (err: any) => {
          host.logger.warn("Failed to fetch season standings", err);
        },
      });
    }
    host.saveSettings();
  }

  static openSeasonManager(host: any): void {
    const queryParams: any = host.selectedSeason
      ? { id: host.selectedSeason.entity_id }
      : {};
    host.closeConfigDropdown();
    host.router.navigate(["/season-editor"], { queryParams });
  }

  static onBrandingClick(host: any): void {
    host.closeFileDropdown();
    host.closeConfigDropdown();
    host.closeOptionsDropdown();
    host.closeHelpDropdown();
    host.closeDropdown();
    host.openHelpCenter();
  }

  static onBrandingKeyDown(host: any, event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      host.onBrandingClick();
    }
  }

  static onCheckForUpdates(host: any): void {
    if (host.isUpdateBannerVisible()) return;
    host.closeFileDropdown();
    host.closeOptionsDropdown();
    host.closeHelpDropdown();
    host.requestCheckForUpdates.emit();
  }

  static onChannelSelected(host: any, _channel: any): void {
    host.closeFileDropdown();
    host.closeOptionsDropdown();
    host.closeHelpDropdown();
    host.requestCheckForUpdates.emit();
  }
}
