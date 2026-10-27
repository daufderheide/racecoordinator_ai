import { Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { saveFileAs } from "@app/utils/file-download.utils";

export function attemptCloseWindow(onBlockedFallback: () => void): void {
  if (document.fullscreenElement) {
    try {
      document.exitFullscreen();
    } catch (e) {
      // ignore
    }
  }

  try {
    window.close();
  } catch (e) {
    // ignore
  }

  setTimeout(() => {
    onBlockedFallback();
  }, 150);
}

export function redirectToBlank(
  windowLocation: Location = window.location,
): void {
  try {
    windowLocation.replace("about:blank");
  } catch (e) {
    // ignore
  }
}

export function exportSettingsFile(
  settingsService: SettingsService,
): Promise<boolean> {
  const settings = settingsService.getSettings();
  const dataStr = JSON.stringify(settings, null, 2);
  return saveFileAs({
    suggestedName: "racecoordinator_settings.json",
    data: dataStr,
    mimeType: "application/json",
    description: "JSON Files",
    extension: ".json",
  });
}

export function importSettingsFromFile(
  file: File,
  settingsService: SettingsService,
  logger: LoggerService,
  onSuccess: () => void,
  onError: (err: any) => void,
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const contents = e.target?.result as string;
      const parsed = JSON.parse(contents);

      const settingsToSave = Object.assign(new Settings(), parsed);
      settingsService.saveSettings(settingsToSave);
      onSuccess();
    } catch (err) {
      logger.error("Failed to parse settings file", err);
      onError(err);
    }
  };
  reader.readAsText(file);
}

export class RacedaySetupMenuHelper {
  static quit(host: any): void {
    host.closeFileDropdown();
    host.closeWindow();
  }

  static closeWindow(host: any): void {
    attemptCloseWindow(() => host.handleQuitBlockedFallback());
  }

  static handleQuitBlockedFallback(host: any): void {
    host.showQuitBlockedModal = true;
    host.cdr.detectChanges();
  }

  static onAcknowledgeQuitModal(host: any): void {
    host.showQuitBlockedModal = false;
    host.redirectToBlank();
  }

  static redirectToBlank(host: any): void {
    redirectToBlank(host.getWindowLocation());
  }

  static exportSettings(host: any): Promise<boolean> {
    host.closeFileDropdown();
    return exportSettingsFile(host.settingsService);
  }

  static triggerImportSettings(host: any): void {
    host.closeFileDropdown();
    if (host.importSettingsInput) {
      host.importSettingsInput.nativeElement.click();
    }
  }

  static importSettings(host: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      importSettingsFromFile(
        input.files[0],
        host.settingsService,
        host.logger,
        () => host.reloadWindow(),
        (err) => {
          host.logger.error("Failed to parse settings file", err);
          host.showErrorModal = true;
          host.errorTitle = "Import Failed";
          host.errorMessage =
            "Failed to parse settings file. Make sure it is a valid JSON exported from Race Coordinator.";
        },
      );
      input.value = "";
    }
  }
}
