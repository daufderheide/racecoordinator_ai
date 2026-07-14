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
});
