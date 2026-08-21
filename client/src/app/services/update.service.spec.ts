import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { UpdateCheckResult, UpdateService } from "./update.service";

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
});
