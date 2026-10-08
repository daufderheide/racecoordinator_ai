import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import {
  compareVersions,
  isAlphaVersion,
  isDowngrade,
  parseVersion,
  UpdateCheckResult,
  UpdateService,
} from "./update.service";

describe("UpdateService", () => {
  let service: UpdateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UpdateService],
    });
    service = TestBed.inject(UpdateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should check for updates", () => {
    const mockResult: UpdateCheckResult = {
      updateAvailable: true,
      latestVersion: "v0.0.0-alpha.20260710",
      downloadUrl: "https://example.com/update.exe",
      releaseNotes: "Fixed bugs",
      releaseUrl: "https://github.com/release",
      isWindows: true,
    };

    service.checkForUpdates().subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/check"),
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockResult);
  });

  it("should check for updates with force flag", () => {
    const mockResult: UpdateCheckResult = {
      updateAvailable: true,
      latestVersion: "v0.0.0-alpha.20260710",
      downloadUrl: "https://example.com/update.exe",
      releaseNotes: "Fixed bugs",
      releaseUrl: "https://github.com/release",
      isWindows: true,
    };

    service.checkForUpdates(true).subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/check?force=true"),
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockResult);
  });

  it("should trigger update installation", () => {
    const downloadUrl = "https://example.com/update.exe";

    service.installUpdate(downloadUrl).subscribe((result) => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/install"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ downloadUrl });
    req.flush("OK");
  });

  it("should get update progress", () => {
    const mockProgress = { progress: 45, status: "Downloading..." };

    service.getUpdateProgress().subscribe((result) => {
      expect(result).toEqual(mockProgress);
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/progress"),
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockProgress);
  });

  it("should cancel update installation", () => {
    service.cancelUpdate().subscribe((result) => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/cancel"),
    );
    expect(req.request.method).toBe("POST");
    req.flush("Cancelled");
  });

  it("should skip an update version", () => {
    const versionToSkip = "v0.0.0-alpha.20260710";

    service.skipUpdate(versionToSkip).subscribe((result) => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/skip"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ version: versionToSkip });
    req.flush("OK");
  });

  it("should get update config", () => {
    const mockConfig = {
      channel: "ALPHA" as const,
      skippedVersion: "v1.0.0",
      snoozedVersion: "v1.0.1",
      snoozedUntil: 1234567890,
    };

    service.getUpdateConfig().subscribe((config) => {
      expect(config).toEqual(mockConfig);
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/config"),
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockConfig);
  });

  it("should set update channel", () => {
    service.setUpdateChannel("BETA").subscribe((result) => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/channel"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ channel: "BETA" });
    req.flush("OK");
  });

  it("should snooze an update", () => {
    const version = "v1.0.1";
    service.snoozeUpdate(version, 7).subscribe((result) => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/snooze"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ version, durationDays: 7 });
    req.flush("OK");
  });

  describe("version parsing and comparison", () => {
    it("should parse standard semantic versions correctly", () => {
      expect(parseVersion("1.2.3")).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
      });
      expect(parseVersion("v1.2.3")).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
      });
      expect(parseVersion("1.1.0-alpha.20261001")).toEqual({
        major: 1,
        minor: 1,
        patch: 0,
        prerelease: "alpha.20261001",
      });
      expect(parseVersion("1.0.1-beta.1")).toEqual({
        major: 1,
        minor: 0,
        patch: 1,
        prerelease: "beta.1",
      });
      expect(parseVersion("0.0.0_dev")).toEqual({
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: "dev",
      });
      expect(parseVersion("")).toBeNull();
      expect(parseVersion(null)).toBeNull();
      expect(parseVersion(undefined)).toBeNull();
      expect(parseVersion("invalid")).toBeNull();
    });

    it("should compare versions accurately", () => {
      expect(compareVersions("2.0.0", "1.9.9")).toBeGreaterThan(0);
      expect(compareVersions("1.9.9", "2.0.0")).toBeLessThan(0);
      expect(compareVersions("1.2.0", "1.1.0")).toBeGreaterThan(0);
      expect(compareVersions("1.0.2", "1.0.1")).toBeGreaterThan(0);
      expect(compareVersions("1.0.0", "v1.0.0")).toBe(0);

      // Prerelease vs release: normal release has higher precedence than prerelease
      expect(compareVersions("1.1.0", "1.1.0-beta.1")).toBeGreaterThan(0);
      expect(compareVersions("1.1.0-beta.1", "1.1.0")).toBeLessThan(0);

      // Prerelease comparisons
      expect(
        compareVersions("1.1.0-beta.1", "1.1.0-alpha.20261001"),
      ).toBeGreaterThan(0);
      expect(
        compareVersions("1.1.0-alpha.20261001", "1.1.0-beta.1"),
      ).toBeLessThan(0);

      // Numeric prerelease sub-parts
      expect(
        compareVersions("1.1.0-alpha.20261002", "1.1.0-alpha.20261001"),
      ).toBeGreaterThan(0);
      expect(
        compareVersions("1.1.0-alpha.20261001", "1.1.0-alpha.20261002"),
      ).toBeLessThan(0);

      // Null / empty handling
      expect(compareVersions(null, null)).toBe(0);
      expect(compareVersions("1.0.0", null)).toBeGreaterThan(0);
      expect(compareVersions(null, "1.0.0")).toBeLessThan(0);
    });

    it("should identify downgrades correctly", () => {
      // User's specific cases:
      // alpha 1.1.0 to beta 1.0.1 -> downgrade (confirmation required)
      expect(isDowngrade("1.1.0-alpha.20261001", "1.0.1-beta.1")).toBeTrue();

      // alpha 1.1.0 to beta 1.2.0 -> NOT a downgrade (no confirmation)
      expect(isDowngrade("1.1.0-alpha.20261001", "1.2.0-beta.1")).toBeFalse();

      // Standard version upgrades and downgrades
      expect(isDowngrade("1.1.0", "1.0.1")).toBeTrue();
      expect(isDowngrade("1.0.1", "1.1.0")).toBeFalse();
      expect(isDowngrade("1.0.0", "1.0.0")).toBeFalse();

      // Prerelease downgrades on same base version
      expect(
        isDowngrade("1.1.0-alpha.20261002", "1.1.0-alpha.20261001"),
      ).toBeTrue();
      expect(
        isDowngrade("1.1.0-alpha.20261001", "1.1.0-alpha.20261002"),
      ).toBeFalse();
      expect(isDowngrade("1.1.0-beta.1", "1.1.0-alpha.20261001")).toBeTrue();
      expect(isDowngrade("1.1.0-alpha.20261001", "1.1.0-beta.1")).toBeFalse();

      // Null / undefined handling
      expect(isDowngrade(null, "1.0.0")).toBeFalse();
      expect(isDowngrade("1.0.0", null)).toBeFalse();
      expect(isDowngrade(undefined, undefined)).toBeFalse();
    });

    it("should detect alpha versions correctly", () => {
      expect(isAlphaVersion("v1.0.0-alpha.20261001")).toBeTrue();
      expect(isAlphaVersion("0.0.0_dev")).toBeTrue();
      expect(isAlphaVersion("ALPHA-BUILD-123")).toBeTrue();
      expect(isAlphaVersion("v1.0.0-beta.1")).toBeFalse();
      expect(isAlphaVersion("v1.0.0")).toBeFalse();
      expect(isAlphaVersion(null)).toBeFalse();
      expect(isAlphaVersion(undefined)).toBeFalse();
    });
    
  it("should support isLinux in update check result", () => {
    const mockResult: UpdateCheckResult = {
      updateAvailable: true,
      latestVersion: "v1.0.1",
      downloadUrl: "https://example.com/update.tar.gz",
      releaseNotes: "Linux arm64 update",
      releaseUrl: "https://github.com/release/v1.0.1",
      isWindows: false,
      isLinux: true,
    };

    service.checkForUpdates().subscribe((result) => {
      expect(result.isLinux).toBeTrue();
      expect(result.isWindows).toBeFalse();
    });

    const req = httpMock.expectOne((req) =>
      req.url.endsWith("/api/update/check"),
    );
    req.flush(mockResult);
  });
});
