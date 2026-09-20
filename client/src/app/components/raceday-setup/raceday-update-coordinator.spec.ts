import { fakeAsync, tick } from "@angular/core/testing";
import { of, throwError } from "rxjs";

import { RacedayUpdateCoordinator } from "./raceday-update-coordinator";

describe("RacedayUpdateCoordinator", () => {
  let coordinator: RacedayUpdateCoordinator;
  let mockUpdateService: any;
  let mockDataService: any;
  let mockLogger: any;
  let stateChanged: boolean;
  let lastErrorMessage: string | null;
  let restartWatcherStarted: boolean;

  beforeEach(() => {
    stateChanged = false;
    lastErrorMessage = null;
    restartWatcherStarted = false;

    mockUpdateService = {
      checkForUpdates: jasmine.createSpy("checkForUpdates").and.returnValue(
        of({
          updateAvailable: true,
          latestVersion: "v1.2.3",
          downloadUrl: "http://example.com/dl",
          releaseNotes: "Notes",
          releaseUrl: "http://example.com/rel",
          isWindows: true,
        }),
      ),
      installUpdate: jasmine
        .createSpy("installUpdate")
        .and.returnValue(of(true)),
      getUpdateProgress: jasmine
        .createSpy("getUpdateProgress")
        .and.returnValue(
          of({ progress: 50, status: "RDS_UPDATE_STATUS_DOWNLOADING" }),
        ),
      cancelUpdate: jasmine.createSpy("cancelUpdate").and.returnValue(of(true)),
      skipUpdate: jasmine.createSpy("skipUpdate").and.returnValue(of(true)),
      snoozeUpdate: jasmine.createSpy("snoozeUpdate").and.returnValue(of(true)),
    };

    mockDataService = {
      getServerVersion: jasmine
        .createSpy("getServerVersion")
        .and.returnValue(of("v1.2.3")),
    };

    mockLogger = {
      info: jasmine.createSpy("info"),
      debug: jasmine.createSpy("debug"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
    };

    coordinator = new RacedayUpdateCoordinator(
      mockUpdateService,
      mockDataService,
      mockLogger,
      {
        onStateChange: () => {
          stateChanged = true;
        },
        onError: (err) => {
          lastErrorMessage = err;
        },
        onStartRestartWatcher: () => {
          restartWatcherStarted = true;
        },
      },
    );
  });

  afterEach(() => {
    coordinator.destroy();
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(coordinator.PENDING_UPDATE_KEY);
    }
  });

  it("should initialize with default state", () => {
    expect(coordinator.updateResult).toBeNull();
    expect(coordinator.isUpdating).toBeFalse();
    expect(coordinator.updateBannerDismissed).toBeFalse();
    expect(coordinator.updateProgress).toBeNull();
    expect(coordinator.showUpToDateModal).toBeFalse();
    expect(coordinator.updateTimedOut).toBeFalse();
    expect(coordinator.isUpdateBannerVisible).toBeFalse();
    expect(coordinator.updateVersionHtml).toBe("");
    expect(coordinator.updateSubtext).toBeNull();
  });

  describe("computed getters", () => {
    it("should compute updateVersionHtml correctly", () => {
      coordinator.updateResult = {
        updateAvailable: true,
        latestVersion: "v1.2.3",
        downloadUrl: "http://example.com/dl",
        releaseNotes: "",
        releaseUrl: "http://example.com/rel",
        isWindows: true,
      };
      expect(coordinator.updateVersionHtml).toContain(
        'href="http://example.com/rel"',
      );
      expect(coordinator.updateVersionHtml).toContain("v1.2.3");
    });

    it("should compute updateSubtext for various statuses", () => {
      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_CONFIRM_PROMPT",
      };
      expect(coordinator.updateSubtext).toBe("RDS_UPDATE_CONFIRM_PROMPT_INFO");

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_LAUNCHING",
      };
      expect(coordinator.updateSubtext).toBe("RDS_UPDATE_CONFIRM_PROMPT_INFO");

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_INSTALLING",
      };
      expect(coordinator.updateSubtext).toBe("RDS_UPDATE_INSTALLING_INFO");

      coordinator.updateProgress = {
        progress: 50,
        status: "RDS_UPDATE_STATUS_DOWNLOADING",
      };
      expect(coordinator.updateSubtext).toBeNull();

      coordinator.updateTimedOut = true;
      expect(coordinator.updateSubtext).toBeNull();
    });

    it("should compute isIndeterminateProgress correctly", () => {
      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_CONFIRM_PROMPT",
      };
      expect(coordinator.isIndeterminateProgress).toBeTrue();

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_INSTALLING",
      };
      expect(coordinator.isIndeterminateProgress).toBeTrue();

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_RESTARTING",
      };
      expect(coordinator.isIndeterminateProgress).toBeTrue();

      coordinator.updateProgress = {
        progress: 50,
        status: "RDS_UPDATE_STATUS_DOWNLOADING",
      };
      expect(coordinator.isIndeterminateProgress).toBeFalse();
    });

    it("should compute updateTitleTextKey correctly", () => {
      coordinator.updateTimedOut = true;
      expect(coordinator.updateTitleTextKey).toBe("RDS_UPDATE_STATUS_TIMEOUT");

      coordinator.updateTimedOut = false;
      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_CONFIRM_PROMPT",
      };
      expect(coordinator.updateTitleTextKey).toBe(
        "RDS_UPDATE_STATUS_CONFIRM_PROMPT",
      );

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_INSTALLING",
      };
      expect(coordinator.updateTitleTextKey).toBe(
        "RDS_UPDATE_STATUS_INSTALLING",
      );

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_RESTARTING",
      };
      expect(coordinator.updateTitleTextKey).toBe(
        "RDS_UPDATE_STATUS_RESTARTING",
      );

      coordinator.updateProgress = {
        progress: 50,
        status: "RDS_UPDATE_STATUS_DOWNLOADING",
      };
      expect(coordinator.updateTitleTextKey).toBe(
        "RDS_UPDATE_STATUS_DOWNLOADING",
      );

      coordinator.updateProgress = {
        progress: 0,
        status: "RDS_UPDATE_STATUS_CONNECTING",
      };
      expect(coordinator.updateTitleTextKey).toBe(
        "RDS_UPDATE_STATUS_CONNECTING",
      );

      coordinator.updateProgress = null;
      expect(coordinator.updateTitleTextKey).toBe("RDS_UPDATE_AVAILABLE");
    });

    it("should compute showCancelInUpdate correctly", () => {
      coordinator.updateTimedOut = true;
      expect(coordinator.showCancelInUpdate).toBeFalse();

      coordinator.updateTimedOut = false;
      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_CONFIRM_PROMPT",
      };
      expect(coordinator.showCancelInUpdate).toBeTrue();

      coordinator.updateProgress = {
        progress: 100,
        status: "RDS_UPDATE_STATUS_INSTALLING",
      };
      expect(coordinator.showCancelInUpdate).toBeFalse();
    });
  });

  describe("update checks and banner actions", () => {
    it("should handle checkForUpdates when an update is available", () => {
      coordinator.checkForUpdates(true);
      expect(mockUpdateService.checkForUpdates).toHaveBeenCalledWith(true);
      expect(coordinator.updateResult?.updateAvailable).toBeTrue();
      expect(coordinator.updateBannerDismissed).toBeFalse();
      expect(stateChanged).toBeTrue();
    });

    it("should showUpToDateModal when forced check finds no updates", () => {
      mockUpdateService.checkForUpdates.and.returnValue(
        of({ updateAvailable: false, latestVersion: "v1.0.0" }),
      );
      coordinator.checkForUpdates(true);
      expect(coordinator.showUpToDateModal).toBeTrue();
      expect(stateChanged).toBeTrue();

      coordinator.acknowledgeUpToDate();
      expect(coordinator.showUpToDateModal).toBeFalse();
    });

    it("should dismiss update banner and snooze", () => {
      coordinator.updateResult = {
        updateAvailable: true,
        latestVersion: "v1.2.3",
        downloadUrl: "http://example.com/dl",
        releaseNotes: "",
        releaseUrl: "http://example.com/rel",
        isWindows: true,
      };
      coordinator.dismissUpdateBanner();
      expect(coordinator.updateBannerDismissed).toBeTrue();
      expect(coordinator.updateResult).toBeNull();
      expect(mockUpdateService.snoozeUpdate).toHaveBeenCalledWith("v1.2.3", 7);
    });

    it("should skip version when requested", () => {
      coordinator.updateResult = {
        updateAvailable: true,
        latestVersion: "v1.2.3",
        downloadUrl: "http://example.com/dl",
        releaseNotes: "",
        releaseUrl: "http://example.com/rel",
        isWindows: true,
      };
      coordinator.skipVersion();
      expect(coordinator.updateResult).toBeNull();
      expect(mockUpdateService.skipUpdate).toHaveBeenCalledWith("v1.2.3");
    });
  });

  describe("pending update session management", () => {
    it("should save, check, and clear pending update session", () => {
      coordinator.savePendingUpdateSession("v2.0.0", "v1.0.0");

      const hasPending = coordinator.checkPendingUpdateSession();
      expect(hasPending).toBeTrue();
      expect(coordinator.isUpdating).toBeTrue();
      expect(coordinator.targetUpdateVersion).toBe("v2.0.0");
      expect(coordinator.preUpdateServerVersion).toBe("v1.0.0");
      expect(restartWatcherStarted).toBeTrue();

      coordinator.clearPendingUpdateSession();
      expect(
        window.sessionStorage.getItem(coordinator.PENDING_UPDATE_KEY),
      ).toBeNull();
    });

    it("should ignore expired pending update sessions", () => {
      const expiredSession = {
        targetVersion: "v2.0.0",
        initialVersion: "v1.0.0",
        timestamp: Date.now() - 400000, // > 5 minutes ago
      };
      window.sessionStorage.setItem(
        coordinator.PENDING_UPDATE_KEY,
        JSON.stringify(expiredSession),
      );

      const hasPending = coordinator.checkPendingUpdateSession();
      expect(hasPending).toBeFalse();
      expect(coordinator.isUpdating).toBeFalse();
    });
  });

  describe("install and cancel workflow", () => {
    it("should start installation and progress polling", fakeAsync(() => {
      coordinator.updateResult = {
        updateAvailable: true,
        latestVersion: "v2.0.0",
        downloadUrl: "http://example.com/dl",
        releaseNotes: "",
        releaseUrl: "http://example.com/rel",
        isWindows: true,
      };

      coordinator.installUpdate("v1.0.0");
      expect(coordinator.isUpdating).toBeTrue();
      expect(coordinator.preUpdateServerVersion).toBe("v1.0.0");
      expect(mockUpdateService.installUpdate).toHaveBeenCalledWith(
        "http://example.com/dl",
      );

      tick(100);
      expect(mockUpdateService.getUpdateProgress).toHaveBeenCalled();

      coordinator.destroy();
    }));

    it("should handle error during installUpdate", () => {
      coordinator.updateResult = {
        updateAvailable: true,
        latestVersion: "v2.0.0",
        downloadUrl: "http://example.com/dl",
        releaseNotes: "",
        releaseUrl: "http://example.com/rel",
        isWindows: true,
      };
      mockUpdateService.installUpdate.and.returnValue(
        throwError(() => new Error("Network error")),
      );

      coordinator.installUpdate("v1.0.0");
      expect(lastErrorMessage).toBe("Update installation failed");
      expect(coordinator.isUpdating).toBeFalse();
    });

    it("should cancel update and cleanup state", () => {
      coordinator.isUpdating = true;
      coordinator.cancelUpdate();
      expect(mockUpdateService.cancelUpdate).toHaveBeenCalled();
      expect(coordinator.isUpdating).toBeFalse();
    });
  });

  describe("restart polling and timeout", () => {
    it("should trigger reload when server updates to target version", fakeAsync(() => {
      const reloadSpy = jasmine.createSpy("reloadApp");
      coordinator.reloadApp = reloadSpy;
      coordinator.isUpdating = true;
      coordinator.targetUpdateVersion = "v2.0.0";
      coordinator.preUpdateServerVersion = "v1.0.0";

      mockDataService.getServerVersion.and.returnValue(of("v2.0.0"));

      coordinator.doStartRestartWatcher();
      tick(2000);

      expect(reloadSpy).toHaveBeenCalled();
      expect(coordinator.updateProgress?.status).toBe(
        "RDS_UPDATE_STATUS_RESTARTING",
      );
    }));

    it("should timeout if server does not restart within limit", fakeAsync(() => {
      coordinator.isUpdating = true;
      coordinator.targetUpdateVersion = "v2.0.0";
      coordinator.preUpdateServerVersion = "v1.0.0";

      // Server continues serving old version
      mockDataService.getServerVersion.and.returnValue(of("v1.0.0"));

      coordinator.doStartRestartWatcher();
      tick(95000);

      expect(coordinator.updateTimedOut).toBeTrue();
      expect(coordinator.updateTitleTextKey).toBe("RDS_UPDATE_STATUS_TIMEOUT");
    }));
  });
});
