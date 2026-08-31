import { HttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { WIDGET_REGISTRY } from "@app/components/ui-editor/widget-registry";

import { CustomWidgetService } from "./custom-widget.service";
import { DynamicComponentService } from "./dynamic-component.service";
import { FileSystemService } from "./file-system.service";
import { LoggerService } from "./logger.service";

describe("CustomWidgetService", () => {
  let service: CustomWidgetService;
  let mockFileSystem: jasmine.SpyObj<FileSystemService>;
  let mockDynamicComp: jasmine.SpyObj<DynamicComponentService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockHttp: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockFileSystem = jasmine.createSpyObj("FileSystemService", [
      "getCustomWidgetDirectoryHandle",
      "getCustomWidgetDirectories",
      "hasWidgetFile",
      "getWidgetFile",
      "writeWidgetFile",
    ]);

    mockDynamicComp = jasmine.createSpyObj("DynamicComponentService", [
      "createDynamicComponent",
    ]);

    mockLogger = jasmine.createSpyObj("LoggerService", [
      "error",
      "warn",
      "debug",
      "info",
    ]);

    mockHttp = jasmine.createSpyObj("HttpClient", ["get"]);
    mockHttp.get.and.returnValue(throwError(() => new Error("Not found")));

    TestBed.configureTestingModule({
      providers: [
        CustomWidgetService,
        { provide: FileSystemService, useValue: mockFileSystem },
        { provide: DynamicComponentService, useValue: mockDynamicComp },
        { provide: LoggerService, useValue: mockLogger },
        { provide: HttpClient, useValue: mockHttp },
      ],
    });

    service = TestBed.inject(CustomWidgetService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("isCustomWidget", () => {
    it("should return true for custom: prefix", () => {
      expect(service.isCustomWidget("custom:my-widget")).toBeTrue();
      expect(service.isCustomWidget("timer")).toBeFalse();
      expect(service.isCustomWidget(undefined)).toBeFalse();
    });
  });

  describe("reloadCustomWidgets", () => {
    it("should clear custom widgets when no directory handle configured", async () => {
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(undefined),
      );

      await service.reloadCustomWidgets();
      expect(service.getCustomWidgets().length).toBe(0);
    });

    it("should discover, compile and register custom widgets from local directory", async () => {
      const mockHandle = {} as any;
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(mockHandle),
      );
      mockFileSystem.getCustomWidgetDirectories.and.returnValue(
        Promise.resolve([{ name: "pit-telemetry", handle: {} as any }]),
      );
      mockFileSystem.hasWidgetFile.and.returnValue(Promise.resolve(true));

      const manifest = {
        id: "pit-telemetry",
        name: "Pit Telemetry",
        defaultSettings: { showSpeed: true },
        settingsSchema: [
          { key: "threshold", label: "Threshold", type: "number", default: 50 },
        ],
      };

      mockFileSystem.getWidgetFile.and.callFake((folder, file) => {
        if (file === "widget.json")
          return Promise.resolve(JSON.stringify(manifest));
        if (file === "widget.html" || file === "widget.component.html")
          return Promise.resolve("<div>Telemetry</div>");
        if (file === "widget.css" || file === "widget.component.css")
          return Promise.resolve(".telemetry { color: red; }");
        if (file === "widget.ts" || file === "widget.component.ts")
          return Promise.resolve("export default class {}");
        return Promise.reject("file not found");
      });

      const mockComponentClass = class {} as any;
      mockDynamicComp.createDynamicComponent.and.returnValue(
        Promise.resolve(mockComponentClass),
      );

      await service.reloadCustomWidgets();

      const widgets = service.getCustomWidgets();
      expect(widgets.length).toBe(1);
      const widget = service.getWidgetDefinition("custom:pit-telemetry");
      expect(widget).toBeDefined();
      expect(widget?.manifest.id).toBe("pit-telemetry");
      expect(service.getWidgetComponent("custom:pit-telemetry")).toBe(
        mockComponentClass,
      );

      const registryEntry = WIDGET_REGISTRY["custom:pit-telemetry"];
      expect(registryEntry).toBeDefined();
      expect(registryEntry.defaultSettings!()).toEqual({
        showSpeed: true,
        threshold: 50,
      });
    });

    it("should flag an explicit error when widget.html is missing", async () => {
      const mockHandle = {} as any;
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(mockHandle),
      );
      mockFileSystem.getCustomWidgetDirectories.and.returnValue(
        Promise.resolve([{ name: "no-template-widget", handle: {} as any }]),
      );
      mockFileSystem.hasWidgetFile.and.callFake((folder, file) => {
        if (file === "widget.json") return Promise.resolve(true);
        return Promise.resolve(false);
      });
      mockFileSystem.getWidgetFile.and.callFake((folder, file) => {
        if (file === "widget.json")
          return Promise.resolve(JSON.stringify({ id: "no-template-widget" }));
        return Promise.reject("not found");
      });

      await service.reloadCustomWidgets();

      const widget = service.getWidgetDefinition("custom:no-template-widget");
      expect(widget).toBeDefined();
      expect(widget?.error).toContain("Missing widget.html");
      expect(widget?.componentType).toBeUndefined();
    });

    it("should handle widget compilation error gracefully", async () => {
      const mockHandle = {} as any;
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(mockHandle),
      );
      mockFileSystem.getCustomWidgetDirectories.and.returnValue(
        Promise.resolve([{ name: "broken-widget", handle: {} as any }]),
      );
      mockFileSystem.hasWidgetFile.and.returnValue(Promise.resolve(true));
      mockFileSystem.getWidgetFile.and.callFake((folder, file) => {
        if (file === "widget.json")
          return Promise.resolve(JSON.stringify({ id: "broken-widget" }));
        if (file === "widget.html") return Promise.resolve("<div>Broken</div>");
        return Promise.reject("not found");
      });

      mockDynamicComp.createDynamicComponent.and.returnValue(
        Promise.reject(new Error("Compilation error")),
      );

      await service.reloadCustomWidgets();

      const widget = service.getWidgetDefinition("custom:broken-widget");
      expect(widget).toBeDefined();
      expect(widget?.error).toBe("Compilation error");
    });
  });

  describe("exportStarterWidgets", () => {
    it("should return error if no custom widget folder is selected", async () => {
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(undefined),
      );

      const result = await service.exportStarterWidgets();
      expect(result.success).toBeFalse();
      expect(result.error).toContain("No custom widget directory");
    });

    it("should download sample files and write to widget directory", async () => {
      const mockHandle = { name: "custom-widgets" } as any;
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(mockHandle),
      );
      mockFileSystem.getCustomWidgetDirectories.and.returnValue(
        Promise.resolve([]),
      );
      mockFileSystem.writeWidgetFile.and.returnValue(Promise.resolve());

      mockHttp.get.and.returnValue(of("sample file content"));

      const result = await service.exportStarterWidgets();
      expect(result.success).toBeTrue();
      expect(result.count).toBeGreaterThan(0);
      expect(result.directory).toBe("custom-widgets");
      expect(mockFileSystem.writeWidgetFile).toHaveBeenCalled();
    });

    it("should delegate updateSampleWidgets to exportStarterWidgets", async () => {
      const mockHandle = { name: "custom-widgets" } as any;
      mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
        Promise.resolve(mockHandle),
      );
      mockFileSystem.getCustomWidgetDirectories.and.returnValue(
        Promise.resolve([]),
      );
      mockFileSystem.writeWidgetFile.and.returnValue(Promise.resolve());
      mockHttp.get.and.returnValue(of("sample file content"));

      const result = await service.updateSampleWidgets();
      expect(result.success).toBeTrue();
      expect(result.count).toBeGreaterThan(0);
      expect(result.directory).toBe("custom-widgets");
    });
  });
});
