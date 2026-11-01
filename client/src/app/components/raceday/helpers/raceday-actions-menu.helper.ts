import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { getThemeDisplayNameKey } from "@app/components/ui-editor/ui-editor-crud.helper";
import { RaceState } from "@app/proto/antigravity";

export class RacedayActionsMenuHelper {
  static toggleMenu(host: any): void {
    host.logger?.debug(
      "Toggling Race Director menu. Current state:",
      host.isMenuOpen,
    );
    host.isMenuOpen = !host.isMenuOpen;
    host.isFileMenuOpen = false;
    host.isManageMenuOpen = false;
    host.isDriversStationOpen = false;
    host.isWindowsMenuOpen = false;
    host.isOptionsMenuOpen = false;
  }

  static toggleFileMenu(host: any): void {
    host.logger?.debug(
      "Toggling File menu. Current state:",
      host.isFileMenuOpen,
    );
    host.isFileMenuOpen = !host.isFileMenuOpen;
    host.isMenuOpen = false;
    host.isManageMenuOpen = false;
    host.isDriversStationOpen = false;
    host.isWindowsMenuOpen = false;
    host.isOptionsMenuOpen = false;
  }

  static toggleDriversStationMenu(host: any): void {
    host.logger?.debug(
      "Toggling Drivers Station menu. Current state:",
      host.isDriversStationOpen,
    );
    host.isDriversStationOpen = !host.isDriversStationOpen;
  }

  static toggleManageMenu(host: any): void {
    host.logger?.debug(
      "Toggling Manage menu. Current state:",
      host.isManageMenuOpen,
    );
    host.isManageMenuOpen = !host.isManageMenuOpen;
    host.isFileMenuOpen = false;
    host.isMenuOpen = false;
    host.isDriversStationOpen = false;
    host.isWindowsMenuOpen = false;
    host.isOptionsMenuOpen = false;
  }

  static toggleWindowsMenu(host: any): void {
    host.logger?.debug(
      "Toggling Windows menu. Current state:",
      host.isWindowsMenuOpen,
    );
    host.isWindowsMenuOpen = !host.isWindowsMenuOpen;
    host.isFileMenuOpen = false;
    host.isMenuOpen = false;
    host.isManageMenuOpen = false;
    host.isDriversStationOpen = false;
    host.isOptionsMenuOpen = false;
  }

  static toggleOptionsMenu(host: any): void {
    host.logger?.debug(
      "Toggling Options menu. Current state:",
      host.isOptionsMenuOpen,
    );
    host.isOptionsMenuOpen = !host.isOptionsMenuOpen;
    host.isFileMenuOpen = false;
    host.isMenuOpen = false;
    host.isManageMenuOpen = false;
    host.isDriversStationOpen = false;
    host.isWindowsMenuOpen = false;
  }

  static onLanguageSelected(host: any): void {
    host.isFileMenuOpen = false;
    host.isManageMenuOpen = false;
    host.isOptionsMenuOpen = false;
    host.cdr?.markForCheck();
  }

  static navigateToUiEditor(host: any): void {
    const returnUrl = host.router.url.split("?")[0];
    host.router.navigate(["/ui-editor"], {
      queryParams: { returnUrl },
    });
  }

  static navigateToLayoutEditor(host: any): void {
    const returnUrl = host.router.url.split("?")[0];
    host.router.navigate(["/layout-editor"], {
      queryParams: { returnUrl },
    });
  }

  static navigateToThemeEditor(host: any): void {
    const returnUrl = host.router.url.split("?")[0];
    host.router.navigate(["/theme-editor"], {
      queryParams: { returnUrl },
    });
  }

  static onManageSelect(host: any, action: string): void {
    host.logger?.debug("Manage menu action:", action);
    host.isManageMenuOpen = false;
    if (action === "CUSTOMIZE_LAYOUT" || action === "LAYOUT_EDITOR") {
      RacedayActionsMenuHelper.navigateToLayoutEditor(host);
    } else if (action === "CUSTOMIZE_THEME" || action === "THEME_EDITOR") {
      RacedayActionsMenuHelper.navigateToThemeEditor(host);
    }
  }

  static onOptionsSelect(host: any, action: string): void {
    host.logger?.debug("Options menu action:", action);
    host.isOptionsMenuOpen = false;
    if (action === "CUSTOMIZE_UI") {
      RacedayActionsMenuHelper.navigateToUiEditor(host);
    } else if (action === "CUSTOMIZE_LAYOUT") {
      RacedayActionsMenuHelper.navigateToLayoutEditor(host);
    } else if (action === "CUSTOMIZE_THEME") {
      RacedayActionsMenuHelper.navigateToThemeEditor(host);
    }
  }

  static isAnyMenuDropdownOpen(host: any): boolean {
    return (
      host.isFileMenuOpen ||
      host.isMenuOpen ||
      host.isManageMenuOpen ||
      host.isWindowsMenuOpen ||
      host.isOptionsMenuOpen
    );
  }

  static onMenuItemHover(host: any, menuName: string): void {
    if (RacedayActionsMenuHelper.isAnyMenuDropdownOpen(host)) {
      if (menuName === "file" && host.isFileMenuOpen) return;
      if (menuName === "race" && host.isMenuOpen) return;
      if (menuName === "manage" && host.isManageMenuOpen) return;
      if (menuName === "windows" && host.isWindowsMenuOpen) return;
      if (menuName === "options" && host.isOptionsMenuOpen) return;

      host.isFileMenuOpen = false;
      host.isMenuOpen = false;
      host.isManageMenuOpen = false;
      host.isDriversStationOpen = false;
      host.isWindowsMenuOpen = false;
      host.isOptionsMenuOpen = false;

      if (menuName === "file") {
        host.isFileMenuOpen = true;
      } else if (menuName === "race") {
        host.isMenuOpen = true;
      } else if (menuName === "manage") {
        host.isManageMenuOpen = true;
      } else if (menuName === "windows") {
        host.isWindowsMenuOpen = true;
      } else if (menuName === "options") {
        host.isOptionsMenuOpen = true;
      }
      host.cdr?.markForCheck();
    }
  }

  static onMenuSelect(host: any, action: string): void {
    if (action === "START_RESUME" && host.isStartResumeDisabled) return;
    if (action === "PAUSE" && host.isPauseDisabled) return;
    if (action === "NEXT_HEAT" && host.isNextHeatDisabled) return;
    if (action === "RESTART_HEAT" && host.isRestartHeatDisabled) return;
    if (action === "SKIP_HEAT" && host.isSkipHeatDisabled) return;
    if (action === "DEFER_HEAT" && host.isDeferHeatDisabled) return;
    if (action === "SKIP_RACE" && host.isSkipRaceDisabled) return;
    if (action === "MODIFY" && host.isModifyDisabled) return;
    if (action === "ADD_LAP" && host.isAddLapDisabled) return;

    host.isMenuOpen = false;
    host.logger?.debug("Menu Action Selected:", action);
    RacedayActionsMenuHelper.executeMenuAction(host, action);
    host.isMenuOpen = false;
  }

  static openAbout(host: any): void {
    host.requestAbout?.emit();
  }

  static openHelpCenter(host: any): void {
    host.helpLinkService?.openHelp("raceday-operation");
  }

  static handleStartResumeAction(host: any): void {
    host.dataService?.startRace().subscribe(
      (response: any) => {
        if (response && response.success) {
          host.logger?.debug("Race start command sent successfully");
        } else {
          host.logger?.error(
            "Failed to send race start command:",
            response?.message,
          );
          const msg = response?.message || "";
          if (msg.toLowerCase().includes("interface")) {
            host.showInterfaceError(
              "ACK_MODAL_TITLE_DISCONNECTED",
              "ACK_MODAL_MSG_DISCONNECTED",
            );
          } else {
            host.showInterfaceError(
              "ACK_MODAL_TITLE_START_FAILED",
              msg || "ACK_MODAL_MSG_RACE_INACTIVE",
            );
          }
        }
      },
      (error: any) => {
        host.logger?.error("Error starting race:", error);
        if (error?.status === 401 || error?.status === 403) {
          host.showInterfaceError(
            "ACK_MODAL_TITLE_PERMISSION_DENIED",
            "ACK_MODAL_MSG_PERMISSION_DENIED",
          );
        } else if (error?.status === 404) {
          host.raceHasEnded = true;
          host.showInterfaceError(
            "ACK_MODAL_TITLE_RACE_INACTIVE",
            "ACK_MODAL_MSG_RACE_INACTIVE",
          );
        } else {
          host.showInterfaceError(
            "ACK_MODAL_TITLE_START_FAILED",
            error?.error || error?.message || "ACK_MODAL_MSG_DISCONNECTED",
          );
        }
      },
    );
  }

  static handleNextHeatAction(host: any): void {
    host.dataService?.nextHeat().subscribe(
      (success: any) => {
        if (success) {
          host.logger?.debug("Next heat command sent successfully");
        } else {
          host.logger?.error("Failed to send next heat command");
        }
      },
      (error: any) => {
        host.logger?.error("Error moving to next heat:", error);
      },
    );
  }

  static executeMenuAction(host: any, action: string): void {
    if (action === "HELP_CENTER") {
      RacedayActionsMenuHelper.openHelpCenter(host);
      return;
    }
    if (action === "ABOUT") {
      RacedayActionsMenuHelper.openAbout(host);
      return;
    }
    if (action === "LOGIN") {
      host.showLoginModal = true;
      return;
    }
    if (action === "LOGOUT") {
      host.authService?.logout();
      return;
    }
    if (action === "START_RESUME") {
      RacedayActionsMenuHelper.handleStartResumeAction(host);
    } else if (action === "PAUSE" || action === "ABORT_TIMERS") {
      RacedayActionsMenuHelper.executePauseOrAbort(host, action);
    } else if (action === "NEXT_HEAT") {
      RacedayActionsMenuHelper.handleNextHeatAction(host);
    } else if (action === "RESTART_HEAT") {
      host.showRestartHeatConfirmation = true;
      host.cdr?.markForCheck();
    } else if (action === "SKIP_HEAT") {
      host.showSkipHeatConfirmation = true;
      host.cdr?.markForCheck();
    } else if (action === "SKIP_RACE") {
      host.showSkipRaceConfirmation = true;
      host.cdr?.markForCheck();
    } else if (action === "DEFER_HEAT") {
      host.showDeferHeatConfirmation = true;
      host.cdr?.markForCheck();
    } else if (action === "MODIFY") {
      const returnUrl = host.router.url.split("?")[0];
      host.router.navigate(["/modify-heats"], { queryParams: { returnUrl } });
    } else if (action === "ADD_LAP") {
      host.selectedHeatDriver = null;
      host.isMenuModeForAddLap = true;
      host.showAddLapSectionsDialog = true;
      host.cdr?.markForCheck();
    } else if (action === "DISALLOW_LAP_RECORDS") {
      host.showDisallowLapRecordsDialog = true;
      host.cdr?.markForCheck();
    }
  }

  static executePauseOrAbort(host: any, action: string): void {
    const effectiveAction =
      action === "PAUSE" &&
      (host.autoStartRemaining > 0 || host.autoAdvanceRemaining > 0)
        ? "ABORT_TIMERS"
        : action;

    const obs =
      effectiveAction === "ABORT_TIMERS"
        ? host.dataService.abortTimers()
        : host.dataService.pauseRace();

    obs.subscribe(
      (success: any) => {
        if (success) {
          host.logger?.debug(`${effectiveAction} command sent successfully`);
          if (effectiveAction === "ABORT_TIMERS") {
            host.autoStartRemaining = 0;
            host.autoAdvanceRemaining = 0;
          }
        } else {
          host.logger?.error(`Failed to send ${effectiveAction} command`);
        }
      },
      (error: any) => {
        host.logger?.error(`Error processing ${effectiveAction}:`, error);
      },
    );
  }

  static onWindowsMenuSelect(host: any, action: string): void {
    host.logger?.debug("Windows menu action:", action);
    host.isWindowsMenuOpen = false;
    if (action === "HEAT_RESULTS") {
      const url = host.router.serializeUrl(
        host.router.createUrlTree(["/heat-results"]),
      );
      host.childWindowManagerService?.openWindow(action, url);
    } else if (action === "RACE_RESULTS") {
      const url = host.router.serializeUrl(
        host.router.createUrlTree(["/race-results"]),
      );
      host.childWindowManagerService?.openWindow(action, url);
    } else if (action === "SEASON_RESULTS") {
      const seasonId = host.race?.season_id || host.race?.seasonId || "";
      const queryParams = seasonId ? { id: seasonId } : {};
      const url = host.router.serializeUrl(
        host.router.createUrlTree(["/season-results"], { queryParams }),
      );
      host.childWindowManagerService?.openWindow(action, url);
    } else if (action === "PREDICTION_RESULTS") {
      const url = host.router.serializeUrl(
        host.router.createUrlTree(["/prediction-results"]),
      );
      host.childWindowManagerService?.openWindow(action, url);
    } else if (action === "DISPLAY_CLIENT") {
      const url = host.router.serializeUrl(
        host.router.createUrlTree(["/display-client"]),
      );
      window.open(url, "_blank");
    } else if (action.startsWith("THEME:")) {
      const themeId = action.substring("THEME:".length);
      if (host.onThemeMenuSelect) {
        host.onThemeMenuSelect(themeId);
      } else {
        RacedayActionsMenuHelper.onThemeMenuSelect(host, themeId);
      }
    }
  }

  static onThemeMenuSelect(host: any, themeId: string): void {
    const now = Date.now();
    if (
      host.lastThemeOpenId === themeId &&
      host.lastThemeOpenTime &&
      now - host.lastThemeOpenTime < 500
    ) {
      return;
    }
    host.lastThemeOpenTime = now;
    host.lastThemeOpenId = themeId;

    host.logger?.debug("Opening theme window for themeId:", themeId);
    const url = host.router.serializeUrl(
      host.router.createUrlTree(["/default-raceday"], {
        queryParams: { themeId },
      }),
    );
    const theme =
      host.themeService
        ?.getThemes?.()
        ?.find?.((t: any) => t.entity_id === themeId) ||
      (host.themeService?.getActiveTheme?.()?.entity_id === themeId
        ? host.themeService.getActiveTheme()
        : null);
    let themeTitle: string | undefined;
    if (theme) {
      const key = getThemeDisplayNameKey(theme, host.translationService);
      themeTitle = host.translationService?.translate
        ? host.translationService.translate(key)
        : theme.name;
    } else if (themeId === "practice_theme_rc_ai") {
      themeTitle =
        host.translationService?.translate?.("UE_LABEL_PRACTICE_THEME") ||
        "RaceCoordinator AI (Practice)";
    } else if (themeId === "default_fuel_theme_rc_ai") {
      themeTitle =
        host.translationService?.translate?.("UE_LABEL_FUEL_THEME") ||
        "RaceCoordinator AI (Fuel)";
    } else if (themeId === "default_classic_rc_ai") {
      themeTitle =
        host.translationService?.translate?.("UE_LABEL_DEFAULT_THEME") ||
        "RaceCoordinator AI";
    }
    if (themeTitle) {
      host.childWindowManagerService?.openThemeWindow(url, themeTitle);
    } else {
      host.childWindowManagerService?.openThemeWindow(url);
    }
  }

  static updateTabTitle(host: any, themeIdOverride?: string): void {
    const themeId =
      themeIdOverride ||
      host.route?.snapshot?.queryParams?.["themeId"] ||
      host.themeService?.getTransientThemeId?.();
    if (!themeId) {
      return;
    }
    const activeTheme = host.themeService?.getActiveTheme?.();
    const theme =
      (activeTheme?.entity_id === themeId ? activeTheme : null) ||
      host.themeService
        ?.getThemes?.()
        ?.find?.((t: any) => t.entity_id === themeId) ||
      null;
    let titleToSet: string | undefined;
    if (theme) {
      const displayNameKey = getThemeDisplayNameKey(
        theme,
        host.translationService,
      );
      titleToSet = host.translationService?.translate
        ? host.translationService.translate(displayNameKey)
        : theme.name;
    } else if (themeId === "practice_theme_rc_ai") {
      titleToSet =
        host.translationService?.translate?.("UE_LABEL_PRACTICE_THEME") ||
        "RaceCoordinator AI (Practice)";
    } else if (themeId === "default_fuel_theme_rc_ai") {
      titleToSet =
        host.translationService?.translate?.("UE_LABEL_FUEL_THEME") ||
        "RaceCoordinator AI (Fuel)";
    } else if (themeId === "default_classic_rc_ai") {
      titleToSet =
        host.translationService?.translate?.("UE_LABEL_DEFAULT_THEME") ||
        "RaceCoordinator AI";
    }
    if (titleToSet) {
      host.titleService?.setTitle(titleToSet);
    }
  }

  static onFileMenuSelect(host: any, action: string): void {
    host.logger?.debug("File menu action:", action);
    host.activeMenu = null;
    host.isFileMenuOpen = false;
    if (action === "EXPORT_CSV") {
      host.exportToCsv();
    } else if (action === "EXPORT_XLS") {
      host.exportToXls();
    } else if (action === "EXPORT_PDF") {
      host.exportToPdf();
    } else if (action === "CUSTOMIZE_UI") {
      RacedayActionsMenuHelper.navigateToUiEditor(host);
    } else if (action === "SAVE") {
      host.saveRace();
    } else if (action === "RACE_HISTORY") {
      host.showRaceHistoryDialog = true;
      host.cdr?.markForCheck();
    } else if (action === "BACK") {
      if (host.isBackDisabled) return;
      window.history.back();
    } else if (action === "FORWARD") {
      if (host.isForwardDisabled) return;
      window.history.forward();
    } else if (action === "CLOSE") {
      RacedayActionsMenuHelper.closeWindow();
    }
  }

  static isBackDisabled(host: any): boolean {
    return !host.navigationService?.canGoBack?.();
  }

  static isForwardDisabled(host: any): boolean {
    return !host.navigationService?.canGoForward?.();
  }

  static closeWindow(): void {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch (_) {}
    }
    if (typeof window !== "undefined") {
      try {
        window.close();
      } catch (_) {}
    }
  }

  static onLaneMenuSelect(host: any, laneIndex: number): void {
    host.logger?.debug("Lane selected for Driver Station:", laneIndex);
    host.isWindowsMenuOpen = false;
    host.isDriversStationOpen = false;

    const returnUrl = host.router.url.split("?")[0];
    const activeTheme = host.themeService?.getActiveTheme?.();
    const targetThemeId =
      activeTheme?.driver_station_theme_id || "driver_station_theme_rc_ai";
    host.router.navigate(["/driver-station", laneIndex + 1], {
      queryParams: { themeId: targetThemeId, returnUrl },
    });
  }

  static onDriverViewMenuSelect(host: any, driverId: string): void {
    host.logger?.debug("Driver selected for Driver View:", driverId);
    host.isWindowsMenuOpen = false;

    const returnUrl = host.router.url.split("?")[0];
    const activeTheme = host.themeService?.getActiveTheme?.();
    const targetThemeId =
      activeTheme?.driver_view_theme_id ||
      activeTheme?.driver_station_theme_id ||
      "driver_station_theme_rc_ai";
    host.router.navigate(["/driver-view", driverId], {
      state: { bypassDeactivate: true },
      queryParams: { themeId: targetThemeId, returnUrl },
    });
  }

  static onAcknowledgeModal(host: any): void {
    const isSaveModal =
      host.ackModalTitle === "RD_SAVE_SUCCESS" ||
      host.ackModalTitle === "RD_SAVE_ERROR" ||
      host.ackModalTitle ===
        host.translationService?.translate("RD_SAVE_SUCCESS") ||
      host.ackModalTitle ===
        host.translationService?.translate("RD_SAVE_ERROR");

    const isRaceEndedModal =
      !isSaveModal &&
      (host.ackModalTitle === "RD_RACE_ENDED_TITLE" ||
        host.ackModalTitle ===
          host.translationService?.translate("RD_RACE_ENDED_TITLE") ||
        !host.ackModalTitle);

    host.showAckModal = false;
    host.ackModalTitle = "";
    host.cdr?.markForCheck();
    host.cdr?.detectChanges();
    if (host.raceHasEnded && isRaceEndedModal) {
      host.forceExit = true;
      const returnUrl =
        host.route?.snapshot?.queryParamMap?.get("returnUrl") ||
        "/raceday-setup";
      if (returnUrl === "/raceday-setup") {
        host.router.navigate(["/raceday-setup"]);
      } else {
        host.router.navigateByUrl(returnUrl);
      }
    }
  }

  static onExitConfirm(host: any): void {
    if (!host.raceHasEnded && host.raceState !== RaceState.RACE_OVER) {
      sessionStorage.setItem("skipIntro", "true");
    }
    host.showExitConfirmation = false;
    host.cdr?.markForCheck();
    host.deactivateSubject?.next(true);
  }

  static onExitCancel(host: any): void {
    host.showExitConfirmation = false;
    host.cdr?.markForCheck();
    host.deactivateSubject?.next(false);
  }

  static onSkipHeatConfirm(host: any): void {
    host.showSkipHeatConfirmation = false;
    host.dataService?.skipHeat().subscribe(
      (success: any) => {
        if (success) {
          host.logger?.debug("Skip heat command sent successfully");
        } else {
          host.logger?.error("Failed to send skip heat command");
        }
      },
      (error: any) => {
        host.logger?.error("Error skipping heat:", error);
      },
    );
    host.cdr?.markForCheck();
  }

  static onSkipHeatCancel(host: any): void {
    host.showSkipHeatConfirmation = false;
    host.cdr?.markForCheck();
  }

  static onSkipRaceConfirm(host: any): void {
    host.showSkipRaceConfirmation = false;
    host.dataService?.skipRace().subscribe(
      (success: any) => {
        if (success) {
          host.logger?.debug("Skip race command sent successfully");
        } else {
          host.logger?.error("Failed to send skip race command");
        }
      },
      (error: any) => {
        host.logger?.error("Error skipping race:", error);
      },
    );
    host.cdr?.markForCheck();
  }

  static onSkipRaceCancel(host: any): void {
    host.showSkipRaceConfirmation = false;
    host.cdr?.markForCheck();
  }

  static onRestartHeatConfirm(host: any): void {
    host.showRestartHeatConfirmation = false;
    host.hasRacedInCurrentHeat = false;
    host.resetFuelAudioTracking?.();
    host.audioService?.reset();
    LaneGridAnimationHelper.reset();
    host.dataService?.restartHeat().subscribe(
      (success: any) => {
        if (success) {
          host.logger?.debug("Restart heat command sent successfully");
        } else {
          host.logger?.error("Failed to send restart heat command");
        }
      },
      (error: any) => {
        host.logger?.error("Error restarting heat:", error);
      },
    );
    host.cdr?.markForCheck();
  }

  static onRestartHeatCancel(host: any): void {
    host.showRestartHeatConfirmation = false;
    host.cdr?.markForCheck();
  }

  static onDeferHeatConfirm(host: any): void {
    host.showDeferHeatConfirmation = false;
    host.dataService?.deferHeat().subscribe(
      (success: any) => {
        if (success) {
          host.logger?.debug("Defer heat command sent successfully");
        } else {
          host.logger?.error("Failed to send defer heat command");
        }
      },
      (error: any) => {
        host.logger?.error("Error deferring heat:", error);
      },
    );
    host.cdr?.markForCheck();
  }

  static onDeferHeatCancel(host: any): void {
    host.showDeferHeatConfirmation = false;
    host.cdr?.markForCheck();
  }
}
