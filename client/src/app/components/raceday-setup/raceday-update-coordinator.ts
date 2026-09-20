import { interval, Subscription, timer } from "rxjs";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";
import {
  UpdateCheckResult,
  UpdateProgress,
  UpdateService,
} from "@app/services/update.service";

export interface RacedayUpdateCallbacks {
  onStateChange: () => void;
  onError: (errorMessage: string) => void;
  onStartRestartWatcher?: () => void;
}

export class RacedayUpdateCoordinator {
  public updateResult: UpdateCheckResult | null = null;
  public isUpdating = false;
  public updateBannerDismissed = false;
  public updateProgress: UpdateProgress | null = null;
  public showUpToDateModal = false;
  public progressSubscription: Subscription | null = null;
  public restartPollSubscription: Subscription | null = null;
  public targetUpdateVersion: string | null = null;
  public preUpdateServerVersion: string | null = null;
  public updateTimedOut = false;

  public readonly PENDING_UPDATE_KEY = "rcai_pending_update";

  public reloadApp: () => void = () => {
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
  };

  constructor(
    private updateService: UpdateService,
    private dataService: DataService,
    private logger: LoggerService,
    private callbacks: RacedayUpdateCallbacks,
  ) {}

  public get isUpdateBannerVisible(): boolean {
    return !!(
      this.updateResult?.updateAvailable && !this.updateBannerDismissed
    );
  }

  public get updateVersionHtml(): string {
    if (!this.updateResult) return "";
    return `<a href="${this.updateResult.releaseUrl}" target="_blank" class="update-link">${this.updateResult.latestVersion}</a>`;
  }

  public get updateSubtext(): string | null {
    if (this.updateTimedOut) return null;
    const status = this.updateProgress?.status;
    if (
      status === "RDS_UPDATE_STATUS_CONFIRM_PROMPT" ||
      status === "RDS_UPDATE_STATUS_LAUNCHING"
    ) {
      return "RDS_UPDATE_CONFIRM_PROMPT_INFO";
    }
    if (status === "RDS_UPDATE_STATUS_INSTALLING") {
      return "RDS_UPDATE_INSTALLING_INFO";
    }
    return null;
  }

  public get isIndeterminateProgress(): boolean {
    const status = this.updateProgress?.status;
    return (
      status === "RDS_UPDATE_STATUS_CONFIRM_PROMPT" ||
      status === "RDS_UPDATE_STATUS_LAUNCHING" ||
      status === "RDS_UPDATE_STATUS_INSTALLING" ||
      status === "RDS_UPDATE_STATUS_RESTARTING"
    );
  }

  public get updateTitleTextKey(): string {
    if (this.updateTimedOut) {
      return "RDS_UPDATE_STATUS_TIMEOUT";
    }
    const status = this.updateProgress?.status;
    if (
      status === "RDS_UPDATE_STATUS_CONFIRM_PROMPT" ||
      status === "RDS_UPDATE_STATUS_LAUNCHING"
    ) {
      return "RDS_UPDATE_STATUS_CONFIRM_PROMPT";
    }
    if (status === "RDS_UPDATE_STATUS_INSTALLING") {
      return "RDS_UPDATE_STATUS_INSTALLING";
    }
    if (status === "RDS_UPDATE_STATUS_RESTARTING") {
      return "RDS_UPDATE_STATUS_RESTARTING";
    }
    if (status === "RDS_UPDATE_STATUS_DOWNLOADING") {
      return "RDS_UPDATE_STATUS_DOWNLOADING";
    }
    if (status === "RDS_UPDATE_STATUS_CONNECTING") {
      return "RDS_UPDATE_STATUS_CONNECTING";
    }
    return status || "RDS_UPDATE_AVAILABLE";
  }

  public get showCancelInUpdate(): boolean {
    if (this.updateTimedOut) return false;
    const status = this.updateProgress?.status;
    return (
      status === "RDS_UPDATE_STATUS_CONNECTING" ||
      status === "RDS_UPDATE_STATUS_DOWNLOADING" ||
      status === "RDS_UPDATE_STATUS_LAUNCHING" ||
      status === "RDS_UPDATE_STATUS_CONFIRM_PROMPT"
    );
  }

  public checkForUpdates(force: boolean = false) {
    if (this.isUpdating) return;
    if (force) {
      this.updateBannerDismissed = false;
      this.showUpToDateModal = false;
    }
    this.updateService.checkForUpdates(force).subscribe({
      next: (result) => {
        this.updateResult = result;
        if (force && !result.updateAvailable) {
          this.showUpToDateModal = true;
        }
        this.callbacks.onStateChange();
      },
      error: (err) => {
        if (err.status !== 0) {
          this.logger.warn("Failed to check for updates", err);
        }
      },
    });
  }

  public acknowledgeUpToDate() {
    this.showUpToDateModal = false;
    this.callbacks.onStateChange();
  }

  public dismissUpdateBanner() {
    const version = this.updateResult?.latestVersion;
    this.updateBannerDismissed = true;
    this.updateResult = null;
    this.callbacks.onStateChange();
    if (version) {
      this.updateService.snoozeUpdate(version, 7).subscribe({
        next: () => {
          this.logger.info(`Snoozed update version ${version} for 7 days`);
        },
        error: (err) => {
          this.logger.warn("Failed to snooze update on server", err);
        },
      });
    }
  }

  public savePendingUpdateSession(
    targetVersion: string | null,
    initialVersion: string | null,
  ) {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(
          this.PENDING_UPDATE_KEY,
          JSON.stringify({
            targetVersion,
            initialVersion,
            timestamp: Date.now(),
          }),
        );
      } catch {
        // Storage access not permitted or disabled
      }
    }
  }

  public clearPendingUpdateSession() {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(this.PENDING_UPDATE_KEY);
      } catch {
        // Ignored
      }
    }
  }

  public checkPendingUpdateSession(): boolean {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    try {
      const raw = window.sessionStorage.getItem(this.PENDING_UPDATE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.targetVersion || !data.timestamp) return false;

      if (Date.now() - data.timestamp < 300000) {
        this.isUpdating = true;
        this.targetUpdateVersion = data.targetVersion;
        this.preUpdateServerVersion = data.initialVersion;
        this.updateProgress = {
          progress: 100,
          status: "RDS_UPDATE_STATUS_INSTALLING",
        };
        this.startRestartWatcher();
        return true;
      } else {
        this.clearPendingUpdateSession();
        return false;
      }
    } catch {
      this.clearPendingUpdateSession();
      return false;
    }
  }

  public cleanupUpdateState() {
    this.isUpdating = false;
    this.updateProgress = null;
    this.updateTimedOut = false;
    this.targetUpdateVersion = null;
    this.preUpdateServerVersion = null;
    this.clearPendingUpdateSession();
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
      this.progressSubscription = null;
    }
    if (this.restartPollSubscription) {
      this.restartPollSubscription.unsubscribe();
      this.restartPollSubscription = null;
    }
  }

  public startRestartWatcher() {
    if (this.callbacks.onStartRestartWatcher) {
      this.callbacks.onStartRestartWatcher();
    } else {
      this.doStartRestartWatcher();
    }
  }

  public doStartRestartWatcher() {
    if (this.restartPollSubscription) return;
    this.waitForServerRestartAndReload(1000, 1000);
  }

  public installUpdate(currentServerVersion?: string) {
    if (!this.updateResult || !this.updateResult.downloadUrl) return;
    this.isUpdating = true;
    this.updateTimedOut = false;
    this.targetUpdateVersion = this.updateResult.latestVersion;
    if (currentServerVersion !== undefined) {
      this.preUpdateServerVersion = currentServerVersion;
    }
    this.savePendingUpdateSession(
      this.targetUpdateVersion,
      this.preUpdateServerVersion,
    );

    this.updateProgress = {
      progress: 0,
      status: "RDS_UPDATE_STATUS_CONNECTING",
    };
    this.updateService.installUpdate(this.updateResult.downloadUrl).subscribe({
      next: () => {
        this.logger.info("Update started");
        this.pollUpdateProgress();
      },
      error: (err) => {
        this.logger.error("Failed to install update", err);
        this.cleanupUpdateState();
        this.callbacks.onError("Update installation failed");
        this.callbacks.onStateChange();
      },
    });
  }

  private pollUpdateProgress() {
    this.progressSubscription = interval(100).subscribe(() => {
      this.updateService.getUpdateProgress().subscribe({
        next: (prog) => {
          this.updateProgress = prog;
          if (
            prog.status === "RDS_UPDATE_STATUS_LAUNCHING" ||
            prog.status === "RDS_UPDATE_STATUS_CONFIRM_PROMPT"
          ) {
            if (this.updateProgress.status === "RDS_UPDATE_STATUS_LAUNCHING") {
              this.updateProgress = {
                progress: 100,
                status: "RDS_UPDATE_STATUS_CONFIRM_PROMPT",
              };
            }
            this.callbacks.onStateChange();
            this.startRestartWatcher();
          } else if (prog.status === "RDS_UPDATE_STATUS_CANCELLED") {
            this.cleanupUpdateState();
          }
          this.callbacks.onStateChange();
        },
        error: () => {
          if (this.isUpdating) {
            this.updateProgress = {
              progress: 100,
              status: "RDS_UPDATE_STATUS_INSTALLING",
            };
            if (this.progressSubscription) {
              this.progressSubscription.unsubscribe();
              this.progressSubscription = null;
            }
            this.callbacks.onStateChange();
            this.startRestartWatcher();
          }
        },
      });
    });
  }

  public cancelUpdate() {
    this.updateService.cancelUpdate().subscribe({
      next: () => {
        this.logger.info("Update cancelled");
        this.cleanupUpdateState();
        this.callbacks.onStateChange();
      },
      error: (err) => {
        this.logger.error("Failed to cancel update", err);
        this.cleanupUpdateState();
        this.callbacks.onStateChange();
      },
    });
  }

  public retryUpdate() {
    this.cleanupUpdateState();
    this.checkForUpdates(true);
  }

  public waitForServerRestartAndReload(
    pollIntervalMs = 1000,
    initialDelayMs = 2000,
  ): void {
    if (this.restartPollSubscription) {
      this.restartPollSubscription.unsubscribe();
    }

    let hasServerGoneOffline = false;
    const startTime = Date.now();
    const timeoutMs = 90000;

    this.restartPollSubscription = timer(
      initialDelayMs,
      pollIntervalMs,
    ).subscribe(() => {
      if (Date.now() - startTime > timeoutMs && !hasServerGoneOffline) {
        this.handleTimeout();
        return;
      }

      this.dataService.getServerVersion().subscribe({
        next: (version) => {
          if (!version) return;
          if (this.shouldReloadForVersion(version, hasServerGoneOffline)) {
            this.executeReload(version);
          } else {
            this.logger.debug(
              "Server still running pre-update version; waiting for installer...",
            );
          }
        },
        error: () => {
          hasServerGoneOffline = true;
          if (
            this.isUpdating &&
            this.updateProgress?.status !== "RDS_UPDATE_STATUS_INSTALLING"
          ) {
            this.updateProgress = {
              progress: 100,
              status: "RDS_UPDATE_STATUS_INSTALLING",
            };
            this.callbacks.onStateChange();
          }
          this.logger.debug("Waiting for server to restart after update...");
        },
      });
    });
  }

  private handleTimeout() {
    this.logger.warn("Update wait timed out; server never shut down.");
    this.updateTimedOut = true;
    if (this.restartPollSubscription) {
      this.restartPollSubscription.unsubscribe();
      this.restartPollSubscription = null;
    }
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
      this.progressSubscription = null;
    }
    this.clearPendingUpdateSession();
    this.callbacks.onStateChange();
  }

  private shouldReloadForVersion(
    version: string,
    hasServerGoneOffline: boolean,
  ): boolean {
    const cleanVersion = version.replace(/^v/, "");
    const cleanTarget = this.targetUpdateVersion
      ? this.targetUpdateVersion.replace(/^v/, "")
      : null;
    const cleanInitial = this.preUpdateServerVersion
      ? this.preUpdateServerVersion.replace(/^v/, "")
      : null;

    const isTargetVersion = cleanTarget ? cleanVersion === cleanTarget : false;
    const isDifferentFromInitial = cleanInitial
      ? cleanVersion !== cleanInitial
      : false;

    return (
      (hasServerGoneOffline && !!version) ||
      isTargetVersion ||
      isDifferentFromInitial
    );
  }

  private executeReload(version: string) {
    this.logger.info(
      `Updated server is online (${version}). Reloading application...`,
    );
    if (this.restartPollSubscription) {
      this.restartPollSubscription.unsubscribe();
      this.restartPollSubscription = null;
    }
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
      this.progressSubscription = null;
    }
    this.clearPendingUpdateSession();
    this.updateProgress = {
      progress: 100,
      status: "RDS_UPDATE_STATUS_RESTARTING",
    };
    this.callbacks.onStateChange();
    this.reloadApp();
  }

  public skipVersion() {
    if (!this.updateResult || !this.updateResult.latestVersion) return;
    const version = this.updateResult.latestVersion;
    this.updateResult = null;
    this.callbacks.onStateChange();
    this.updateService.skipUpdate(version).subscribe({
      next: () => {
        this.logger.info(`Skipped update version ${version}`);
      },
      error: (err) => {
        this.logger.error("Failed to skip update", err);
      },
    });
  }

  public destroy() {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
      this.progressSubscription = null;
    }
    if (this.restartPollSubscription) {
      this.restartPollSubscription.unsubscribe();
      this.restartPollSubscription = null;
    }
  }
}
