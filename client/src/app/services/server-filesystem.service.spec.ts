import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";

import { ServerFileSystemService } from "./server-filesystem.service";

describe("ServerFileSystemService", () => {
  let service: ServerFileSystemService;
  let httpMock: HttpTestingController;
  let mockDataService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockDataService = {
      serverUrl: "http://localhost:7070",
    };

    mockLogger = {
      debug: jasmine.createSpy("debug"),
      error: jasmine.createSpy("error"),
      info: jasmine.createSpy("info"),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ServerFileSystemService,
        { provide: DataService, useValue: mockDataService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    service = TestBed.inject(ServerFileSystemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should getDirectories", async () => {
    const promise = service.getDirectories();
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/directories",
    );
    expect(req.request.method).toBe("GET");
    req.flush({
      customUiDirectory: "/path/ui",
      customWidgetDirectory: "/path/widgets",
      isLocalhost: true,
    });

    const res = await promise;
    expect(res.customUiDirectory).toBe("/path/ui");
    expect(res.customWidgetDirectory).toBe("/path/widgets");
    expect(res.isLocalhost).toBeTrue();
  });

  it("should chooseFolder", async () => {
    const promise = service.chooseFolder("widgets", "Pick folder");
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/choose-folder",
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ type: "widgets", title: "Pick folder" });
    req.flush({ success: true, path: "/chosen/path", name: "path" });

    const res = await promise;
    expect(res.success).toBeTrue();
    expect(res.path).toBe("/chosen/path");
  });

  it("should setDirectory", async () => {
    const promise = service.setDirectory("ui", "/new/ui/path");
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/set-directory",
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ type: "ui", path: "/new/ui/path" });
    req.flush({ success: true, path: "/new/ui/path", name: "path" });

    const res = await promise;
    expect(res.success).toBeTrue();
    expect(res.path).toBe("/new/ui/path");
  });

  it("should clearDirectory", async () => {
    const promise = service.clearDirectory("widgets");
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/clear-directory",
    );
    expect(req.request.method).toBe("POST");
    req.flush({ success: true });

    const res = await promise;
    expect(res).toBeTrue();
  });

  it("should listWidgets", async () => {
    const promise = service.listWidgets();
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/widgets/list",
    );
    expect(req.request.method).toBe("GET");
    req.flush([
      { name: "widget1", relativePath: "sample/widget1", group: "sample" },
    ]);

    const res = await promise;
    expect(res.length).toBe(1);
    expect(res[0].name).toBe("widget1");
  });

  it("should getWidgetFile", async () => {
    const promise = service.getWidgetFile("sample/widget1", "widget.json");
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/widgets/file?path=sample%2Fwidget1&file=widget.json",
    );
    expect(req.request.method).toBe("GET");
    req.flush('{"id":"widget1"}');

    const res = await promise;
    expect(res).toBe('{"id":"widget1"}');
  });

  it("should writeWidgetFile", async () => {
    const promise = service.writeWidgetFile(
      "sample/widget1",
      "widget.json",
      "{}",
    );
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/widgets/write-file",
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      path: "sample/widget1",
      file: "widget.json",
      content: "{}",
    });
    req.flush({ success: true });

    const res = await promise;
    expect(res).toBeTrue();
  });

  it("should deleteWidgetDir", async () => {
    const promise = service.deleteWidgetDir("sample");
    const req = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/widgets/delete-dir",
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ path: "sample" });
    req.flush({ success: true });

    const res = await promise;
    expect(res).toBeTrue();
  });

  it("should check and read custom UI files", async () => {
    const hasPromise = service.hasCustomFiles("raceday.component.html");
    const hasReq = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/custom-ui/has-files?filename=raceday.component.html",
    );
    expect(hasReq.request.method).toBe("GET");
    hasReq.flush({ exists: true, files: ["raceday.component.html"] });

    const hasRes = await hasPromise;
    expect(hasRes.exists).toBeTrue();

    const getPromise = service.getCustomFile("raceday.component.html");
    const getReq = httpMock.expectOne(
      "http://localhost:7070/api/filesystem/custom-ui/file?filename=raceday.component.html",
    );
    expect(getReq.request.method).toBe("GET");
    getReq.flush("<div>Custom HTML</div>");

    const getRes = await getPromise;
    expect(getRes).toBe("<div>Custom HTML</div>");
  });
});
