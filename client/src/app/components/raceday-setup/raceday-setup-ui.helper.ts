import { Participant } from "./raceday-setup-participant.helper";

export class RacedaySetupUiHelper {
  static detectShortcutKey(host: any): void {
    if (typeof navigator !== "undefined") {
      host.isMac =
        navigator.platform?.toUpperCase().indexOf("MAC") >= 0 ||
        navigator.userAgent?.toUpperCase().indexOf("MAC") >= 0;
      host.quitShortcut = host.isMac ? "Cmd+Q" : "Alt+F4";
    }
  }

  static calculateScale(windowWidth: number, windowHeight: number): number {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    return Math.min(scaleX, scaleY);
  }

  static onKeyDown(host: any, event: KeyboardEvent): void {
    if (
      document.querySelector(".modal-backdrop") ||
      document.querySelector(".help-overlay-container") ||
      host.helpService?.isVisible
    ) {
      return;
    }

    const inInputField =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");

    if (inInputField) {
      return;
    }

    if (host.isMac) {
      if (event.metaKey && (event.key === "q" || event.key === "Q")) {
        event.preventDefault();
        host.quit();
        return;
      }
    } else {
      if (event.altKey && event.key === "F4") {
        host.closeFileDropdown();
        return;
      }
      if (event.ctrlKey && (event.key === "q" || event.key === "Q")) {
        event.preventDefault();
        host.quit();
        return;
      }
    }

    if (event.key === "Enter") {
      const activeElem = document.activeElement as HTMLElement;
      if (activeElem && activeElem.tagName === "BUTTON") {
        return;
      }
      host.handleEnterKey(event);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      host.handleArrowKey(event);
    }
  }

  static onDocumentClick(host: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".custom-dropdown-container")) {
      host.closeDropdown();
    }
    if (!target.closest(".options-menu-container")) {
      host.closeOptionsDropdown();
    }
    if (!target.closest(".file-menu-container")) {
      host.closeFileDropdown();
    }
    if (!target.closest(".config-menu-container")) {
      host.closeConfigDropdown();
    }
    if (!target.closest(".help-menu-container")) {
      host.closeHelpDropdown();
    }
  }

  static updateListWithRefresh(
    host: any,
    action: () => void,
    forcedFocusElem?: HTMLInputElement,
    onComplete?: () => void,
  ): void {
    const availScrollTop =
      host.availScrollContainer?.nativeElement?.scrollTop || 0;
    const racingScrollTop =
      host.racingScrollContainer?.nativeElement?.scrollTop || 0;

    const activeElem =
      forcedFocusElem || (document.activeElement as HTMLElement);
    const isSearchInput = activeElem?.classList?.contains("search-input");

    if (forcedFocusElem || isSearchInput) {
      action();
      host.saveSettings();
      host.cdr.detectChanges();

      if (
        document.activeElement !== activeElem &&
        typeof activeElem.focus === "function"
      ) {
        activeElem.focus();
      }
      onComplete?.();
      return;
    }

    RacedaySetupUiHelper.clearSelectionAndBlur();

    host.isRefreshingList = true;
    host.cdr.detectChanges();

    action();
    host.saveSettings();

    setTimeout(() => {
      host.isRefreshingList = false;
      RacedaySetupUiHelper.clearSelectionAsync();
      host.cdr.detectChanges();

      if (host.availScrollContainer?.nativeElement) {
        host.availScrollContainer.nativeElement.scrollTop = availScrollTop;
      }
      if (host.racingScrollContainer?.nativeElement) {
        host.racingScrollContainer.nativeElement.scrollTop = racingScrollTop;
      }
      onComplete?.();
    }, 0);
  }

  static clearSelectionAndBlur(): void {
    if (document.activeElement instanceof HTMLElement) {
      if (!document.activeElement.classList.contains("search-input")) {
        document.activeElement.blur();
      }
    }
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  static clearSelectionAsync(): void {
    setTimeout(() => {
      const activeElem = document.activeElement as HTMLElement;
      if (activeElem?.classList?.contains("search-input")) return;

      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    }, 0);
  }

  static scrollActiveAvailableItemIntoView(host: any): void {
    setTimeout(() => {
      const container = host.availScrollContainer?.nativeElement;
      const activeElem = container?.querySelector(".driver-item.active");
      activeElem?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  }

  static scrollActiveRacingItemIntoView(host: any): void {
    setTimeout(() => {
      const container = host.racingScrollContainer?.nativeElement;
      const activeElem = container?.querySelector(".driver-item.active");
      activeElem?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
  }

  static scrollRacingParticipantIntoView(
    host: any,
    participant: Participant,
  ): void {
    setTimeout(() => {
      const uniqueId = host.getParticipantUniqueId(participant);
      const index = host.filteredRacingParticipants.findIndex(
        (p: Participant) => host.getParticipantUniqueId(p) === uniqueId,
      );
      if (index === -1) return;
      const container = host.racingScrollContainer?.nativeElement;
      const el =
        (typeof container?.querySelector === "function"
          ? container.querySelector(`[data-participant-id="${uniqueId}"]`)
          : null) || document.getElementById(`racing-item-${index}`);
      el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }, 0);
  }
}
