import { Role } from "@app/models/role";
import { RaceState } from "@app/proto/antigravity";

export class RacedayKeyboardHelper {
  public static handleSpacebarAction(host: any): void {
    const s = host.raceState;
    const RS = RaceState;

    if (
      !host.raceHasEnded &&
      host.raceState !== RaceState.RACE_OVER &&
      (host.autoStartRemaining > 0 || host.autoAdvanceRemaining > 0)
    ) {
      if (!host.isPauseDisabled) {
        host.onMenuSelect("ABORT_TIMERS");
        return;
      }
    }

    if (s === RS.HEAT_OVER || s === RS.RACE_OVER) {
      if (!host.isNextHeatDisabled) {
        host.onMenuSelect("NEXT_HEAT");
      }
    } else if (
      s === RS.NOT_STARTED ||
      s === RS.PAUSED ||
      s === RS.UNKNOWN_STATE
    ) {
      if (!host.isStartResumeDisabled) {
        host.onMenuSelect("START_RESUME");
      }
    } else {
      if (!host.isPauseDisabled) {
        host.onMenuSelect("PAUSE");
      }
    }
  }

  public static handleKeyUpEvent(_host: any, event: KeyboardEvent): void {
    if (event.code === "Space") {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }
      event.preventDefault();
    }
  }
  public static handleLayoutCustomizationKey(
    host: any,
    event: KeyboardEvent,
  ): boolean {
    if (event.key === "Delete" || event.key === "Backspace") {
      const selId = host.selectedWidgetId();
      if (selId) {
        event.preventDefault();
        host.removeWidget(selId);
        return true;
      }
    }
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      const selId = host.selectedWidgetId();
      if (selId && host.layout?.widgets) {
        const widget = host.layout.widgets.find((w: any) => w.id === selId);
        if (widget) {
          event.preventDefault();
          const step = event.shiftKey ? 10 : 1;
          const dx =
            event.key === "ArrowLeft"
              ? -step
              : event.key === "ArrowRight"
                ? step
                : 0;
          const dy =
            event.key === "ArrowUp"
              ? -step
              : event.key === "ArrowDown"
                ? step
                : 0;
          const baseWidth = host.layout.baseWidth || 1920;
          const baseHeight = host.layout.baseHeight || 1080;
          widget.x = Math.max(
            0,
            Math.min(baseWidth - widget.width, widget.x + dx),
          );
          widget.y = Math.max(
            0,
            Math.min(baseHeight - widget.height, widget.y + dy),
          );
          host.layoutChanged.emit(host.layout);
          return true;
        }
      }
    }
    return false;
  }

  public static handleTrackPowerKey(
    host: any,
    event: KeyboardEvent,
    isCtrlOrCmd: boolean,
    inInputField: any,
  ): boolean {
    if (
      !inInputField &&
      !isCtrlOrCmd &&
      event.altKey &&
      event.code.startsWith("Digit")
    ) {
      const digit = parseInt(event.code.replace("Digit", ""), 10);
      const isOn = !event.shiftKey;

      if (host.authService.currentRole !== Role.VIEWER) {
        if (digit === 0) {
          event.preventDefault();
          host.onTrackPowerMainSelect(isOn);
          return true;
        } else if (
          host.track &&
          host.track.lanes &&
          digit <= host.track.lanes.length
        ) {
          event.preventDefault();
          host.onTrackPowerLaneSelect({ lane: digit, on: isOn });
          return true;
        }
      }
    }
    return false;
  }

  public static handleMenuShortcutKey(
    host: any,
    event: KeyboardEvent,
    isCtrlOrCmd: boolean,
  ): boolean {
    if (isCtrlOrCmd && event.key === "s") {
      event.preventDefault();
      host.onMenuSelect("START_RESUME");
      return true;
    }
    if (isCtrlOrCmd && event.key === "p") {
      event.preventDefault();
      host.onMenuSelect("PAUSE");
      return true;
    }
    if (isCtrlOrCmd && event.key === "n") {
      event.preventDefault();
      host.onMenuSelect("NEXT_HEAT");
      return true;
    }
    if (isCtrlOrCmd && event.key === "r") {
      event.preventDefault();
      host.onMenuSelect("RESTART_HEAT");
      return true;
    }
    const isSkipHeatKey =
      (isCtrlOrCmd && event.key === "F5") ||
      (event.altKey && event.key === "F5");
    if (isSkipHeatKey) {
      event.preventDefault();
      host.onMenuSelect("SKIP_HEAT");
      return true;
    }
    const isDeferHeatKey =
      (isCtrlOrCmd && event.key === "F6") ||
      (event.altKey && event.key === "F6");
    if (isDeferHeatKey) {
      event.preventDefault();
      host.onMenuSelect("DEFER_HEAT");
      return true;
    }
    return false;
  }

  public static handlePracticeResetKey(
    host: any,
    event: KeyboardEvent,
    isCtrlOrCmd: boolean,
  ): boolean {
    if (isCtrlOrCmd && event.altKey && event.key.startsWith("F")) {
      const fKey = parseInt(event.key.replace("F", ""), 10);
      if (fKey >= 1 && fKey <= 4 && host.race?.practice) {
        event.preventDefault();
        host.resetLane(fKey - 1, event);
        return true;
      }
    }
    if (
      isCtrlOrCmd &&
      event.altKey &&
      event.key === "F12" &&
      host.race?.practice
    ) {
      event.preventDefault();
      host.resetAllLanes(event);
      return true;
    }
    return false;
  }

  public static handleKeyboardEvent(host: any, event: KeyboardEvent): void {
    if (
      host.checkWidgetShortcuts
        ? host.checkWidgetShortcuts(event)
        : RacedayKeyboardHelper.checkWidgetShortcuts(host, event)
    ) {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const inInputField =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");

    if (host.isLayoutCustomizing && !host.isUIEditorMode() && !inInputField) {
      if (
        host.handleLayoutCustomizationKey
          ? host.handleLayoutCustomizationKey(event)
          : RacedayKeyboardHelper.handleLayoutCustomizationKey(host, event)
      ) {
        return;
      }
    }

    if (event.code === "Space") {
      if (inInputField) return;
      event.preventDefault();
      if (event.repeat) return;
      RacedayKeyboardHelper.handleSpacebarAction(host);
      return;
    }

    if (
      host.handleTrackPowerKey
        ? host.handleTrackPowerKey(event, isCtrlOrCmd, inInputField)
        : RacedayKeyboardHelper.handleTrackPowerKey(
            host,
            event,
            isCtrlOrCmd,
            inInputField,
          )
    ) {
      return;
    }

    if (
      host.handleMenuShortcutKey
        ? host.handleMenuShortcutKey(event, isCtrlOrCmd)
        : RacedayKeyboardHelper.handleMenuShortcutKey(host, event, isCtrlOrCmd)
    ) {
      return;
    }

    if (host.handlePracticeResetKey) {
      host.handlePracticeResetKey(event, isCtrlOrCmd);
    } else {
      RacedayKeyboardHelper.handlePracticeResetKey(host, event, isCtrlOrCmd);
    }
  }

  public static checkWidgetShortcuts(host: any, event: KeyboardEvent): boolean {
    const inInputField =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");
    if (inInputField) return false;

    const widgets = host.layout?.widgets || [];
    for (const widget of widgets) {
      if (
        widget.widgetType.startsWith("action-") &&
        widget.customSettings?.["shortcut"]
      ) {
        if (
          RacedayKeyboardHelper.matchShortcut(
            event,
            widget.customSettings["shortcut"],
          )
        ) {
          if (host.executeWidgetAction) {
            host.executeWidgetAction(widget.widgetType);
          } else {
            RacedayKeyboardHelper.executeWidgetAction(host, widget.widgetType);
          }
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
    }
    return false;
  }

  public static matchShortcut(
    event: KeyboardEvent,
    shortcutStr: string,
  ): boolean {
    if (!shortcutStr) return false;
    const parts = shortcutStr
      .toLowerCase()
      .split("+")
      .map((p) => p.trim());
    const needsCtrl =
      parts.includes("ctrl") ||
      parts.includes("control") ||
      parts.includes("cmd");
    const needsAlt = parts.includes("alt");
    const needsShift = parts.includes("shift");

    const key = parts[parts.length - 1];
    const eventKey = event.key.toLowerCase();
    const eventCode = event.code.toLowerCase();

    // Check modifiers
    if (needsCtrl !== (event.ctrlKey || event.metaKey)) return false;
    if (needsAlt !== event.altKey) return false;
    if (needsShift !== event.shiftKey) return false;

    // Check key
    return (
      key === eventKey ||
      key === eventCode ||
      key === eventCode.replace("key", "")
    );
  }

  public static executeWidgetAction(host: any, widgetType: string): void {
    switch (widgetType) {
      case "action-start-resume":
        if (!host.isStartResumeDisabled) host.onMenuSelect("START_RESUME");
        break;
      case "action-pause":
        if (!host.isPauseDisabled) host.onMenuSelect("PAUSE");
        break;
      case "action-next-heat":
        if (!host.isNextHeatDisabled) host.onMenuSelect("NEXT_HEAT");
        break;
      case "action-restart-heat":
        if (!host.isRestartHeatDisabled) host.onMenuSelect("RESTART_HEAT");
        break;
      case "action-defer-heat":
        if (!host.isDeferHeatDisabled) host.onMenuSelect("DEFER_HEAT");
        break;
      case "action-skip-heat":
        if (!host.isSkipHeatDisabled) host.onMenuSelect("SKIP_HEAT");
        break;
      case "action-skip-race":
        if (!host.isSkipRaceDisabled) host.onMenuSelect("SKIP_RACE");
        break;
      case "action-add-lap":
        if (!host.isAddLapDisabled) host.onMenuSelect("ADD_LAP");
        break;
      case "action-modify-heats":
        if (!host.isModifyDisabled) host.onMenuSelect("MODIFY");
        break;
      case "action-export-pdf":
        host.onFileMenuSelect("EXPORT_PDF");
        break;
      case "action-export-csv":
        host.onFileMenuSelect("EXPORT_CSV");
        break;
      case "action-export-xls":
        host.onFileMenuSelect("EXPORT_XLS");
        break;
      case "action-open-heat-results":
        host.onWindowsMenuSelect("HEAT_RESULTS");
        break;
      case "action-open-race-results":
        host.onWindowsMenuSelect("RACE_RESULTS");
        break;
      case "action-open-season-results":
        host.onWindowsMenuSelect("SEASON_RESULTS");
        break;
      case "action-open-prediction-results":
        host.onWindowsMenuSelect("PREDICTION_RESULTS");
        break;
      case "action-master-power-on":
        if (!host.isMainPowerDisabled) host.onTrackPowerMainSelect(true);
        break;
      case "action-master-power-off":
        if (!host.isMainPowerDisabled) host.onTrackPowerMainSelect(false);
        break;
      case "action-back":
        host.onFileMenuSelect("BACK");
        break;
      case "action-forward":
        host.onFileMenuSelect("FORWARD");
        break;
      case "action-close":
        host.onFileMenuSelect("CLOSE");
        break;
    }
  }
}
