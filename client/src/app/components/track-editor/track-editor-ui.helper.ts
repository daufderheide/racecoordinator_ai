import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { NavigationService } from "@app/services/navigation.service";

export interface TrackEditorSections {
  general: boolean;
  interfaces: boolean;
  lanes: boolean;
}

export class TrackEditorUiHelper {
  static calculateScale(windowWidth: number, windowHeight: number): number {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    return Math.min(scaleX, scaleY);
  }

  static handleKeyboardEvent(
    event: KeyboardEvent,
    isEditMode: boolean,
    undo: () => void,
    redo: () => void,
  ): void {
    if (!isEditMode) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      redo();
    }
  }

  static loadSavedSections(): TrackEditorSections {
    const defaultSections: TrackEditorSections = {
      general: true,
      interfaces: true,
      lanes: true,
    };
    const saved = localStorage.getItem("rc.track-editor.sections");
    if (saved) {
      try {
        const savedSections = JSON.parse(saved);
        return { ...defaultSections, ...savedSections };
      } catch {
        return defaultSections;
      }
    }
    return defaultSections;
  }

  static saveSections(sections: TrackEditorSections): void {
    localStorage.setItem("rc.track-editor.sections", JSON.stringify(sections));
  }

  static toggleSection(
    sections: TrackEditorSections,
    section: keyof TrackEditorSections,
    forcedState?: boolean,
  ): TrackEditorSections {
    const updated = {
      ...sections,
      [section]:
        typeof forcedState === "boolean" ? forcedState : !sections[section],
    };
    TrackEditorUiHelper.saveSections(updated);
    return updated;
  }

  static toggleAllSections(
    sections: TrackEditorSections,
    forcedState?: boolean,
  ): { nextState: boolean; sections: TrackEditorSections } {
    const areAllExpanded = Object.values(sections).every(Boolean);
    const nextState = forcedState !== undefined ? forcedState : !areAllExpanded;
    const updated: TrackEditorSections = {
      general: nextState,
      interfaces: nextState,
      lanes: nextState,
    };
    TrackEditorUiHelper.saveSections(updated);
    return { nextState, sections: updated };
  }

  static focusNameInput(elementId: string = "track-name-input"): void {
    setTimeout(() => {
      const el = document.getElementById(elementId) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }

  static navigateBack(router: Router, route: ActivatedRoute): void {
    const returnUrl = route.snapshot.queryParamMap.get("returnUrl");
    const from = route.snapshot.queryParamMap.get("from");
    if (returnUrl) {
      router.navigateByUrl(returnUrl);
    } else if (from === "modify-heats") {
      router.navigate(["/default-raceday"], {
        queryParams: { modifyHeats: "true" },
      });
    } else {
      router.navigate(["/raceday-setup"]);
    }
  }

  static navigateToTrack(
    router: Router,
    route: ActivatedRoute,
    navigationService: NavigationService,
    trackId: string,
  ): void {
    navigationService.setLastEditedId("track", trackId);
    router.navigate([], {
      relativeTo: route,
      queryParams: { id: trackId },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  static monitorConnection(
    connectionMonitor: ConnectionMonitorService,
    onStateChange: (isLost: boolean) => void,
  ): Subscription {
    return connectionMonitor.connectionState$.subscribe((state) => {
      onStateChange(state === ConnectionState.DISCONNECTED);
    });
  }

  static handleConnectionLoss(
    isConnectionLost: () => boolean,
    onTimeout: () => void,
    timeoutMs: number = 5000,
    checkIntervalMs: number = 1000,
  ): any {
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      if (!isConnectionLost()) {
        clearInterval(intervalId);
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(intervalId);
        onTimeout();
      }
    }, checkIntervalMs);
    return intervalId;
  }

  static confirmLedStringDialog(
    requestingArduinoIndex: number,
    numLeds: number,
    editors: Array<{ addLedString: (num: number) => void }>,
  ): boolean {
    if (requestingArduinoIndex >= 0 && editors[requestingArduinoIndex]) {
      editors[requestingArduinoIndex].addLedString(numLeds);
      return true;
    }
    return false;
  }
}
