import { TestBed } from "@angular/core/testing";

import { FileSystemService } from "./file-system.service";
import { ServerFileSystemService } from "./server-filesystem.service";

describe("FileSystemService", () => {
  let service: FileSystemService;
  let mockServerFs: any;
  let mockHandle: any;
  let mockSubfolderHandle: any;
  let mockFileHandle: any;

  beforeEach(() => {
    mockServerFs = jasmine.createSpyObj("ServerFileSystemService", [
      "getDirectories",
      "chooseFolder",
      "setDirectory",
      "clearDirectory",
      "listWidgets",
      "getWidgetFile",
      "writeWidgetFile",
      "deleteWidgetDir",
      "hasCustomFiles",
      "getCustomFile",
      "appendCustomUiFile",
      "deleteCustomUiFile",
    ]);
    mockServerFs.getDirectories.and.returnValue(
      Promise.resolve({ isLocalhost: false }),
    );

    TestBed.configureTestingModule({
      providers: [
        FileSystemService,
        { provide: ServerFileSystemService, useValue: mockServerFs },
      ],
    });
    service = TestBed.inject(FileSystemService);

    mockFileHandle = {
      getFile: jasmine.createSpy("getFile").and.returnValue(
        Promise.resolve({
          text: () => Promise.resolve("test content"),
          size: 0,
        }),
      ),
      createWritable: jasmine.createSpy("createWritable").and.returnValue(
        Promise.resolve({
          seek: jasmine.createSpy("seek"),
          write: jasmine.createSpy("write"),
          close: jasmine.createSpy("close"),
        }),
      ),
    };

    mockSubfolderHandle = {
      getFileHandle: jasmine
        .createSpy("getFileHandle")
        .and.returnValue(Promise.resolve(mockFileHandle)),
    };

    mockHandle = {
      queryPermission: jasmine
        .createSpy("queryPermission")
        .and.returnValue(Promise.resolve("granted")),
      getDirectoryHandle: jasmine
        .createSpy("getDirectoryHandle")
        .and.returnValue(Promise.resolve(mockSubfolderHandle)),
      getFileHandle: jasmine
        .createSpy("getFileHandle")
        .and.returnValue(Promise.resolve(mockFileHandle)),
    };

    spyOn(service, "getCustomDirectoryHandle").and.returnValue(
      Promise.resolve(mockHandle),
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("hasCustomFiles", () => {
    it("should check subfolder if provided", async () => {
      const result = await service.hasCustomFiles("test.html", "subfolder");
      expect(result).toBeTrue();
      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith("subfolder");
      expect(mockSubfolderHandle.getFileHandle).toHaveBeenCalledWith(
        "test.html",
      );
    });

    it("should check root folder if subfolder not provided", async () => {
      const result = await service.hasCustomFiles("test.html");
      expect(result).toBeTrue();
      expect(mockHandle.getDirectoryHandle).not.toHaveBeenCalled();
      expect(mockHandle.getFileHandle).toHaveBeenCalledWith("test.html");
    });

    it("should return false if subfolder missing", async () => {
      mockHandle.getDirectoryHandle.and.returnValue(
        Promise.reject("not found"),
      );
      const result = await service.hasCustomFiles("test.html", "missing");
      expect(result).toBeFalse();
    });
  });

  describe("getCustomFile", () => {
    it("should fetch file from subfolder", async () => {
      const content = await service.getCustomFile("test.html", "subfolder");
      expect(content).toBe("test content");
      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith("subfolder");
      expect(mockSubfolderHandle.getFileHandle).toHaveBeenCalledWith(
        "test.html",
      );
    });

    it("should fetch file from root if subfolder not provided", async () => {
      const content = await service.getCustomFile("test.html");
      expect(content).toBe("test content");
      expect(mockHandle.getDirectoryHandle).not.toHaveBeenCalled();
      expect(mockHandle.getFileHandle).toHaveBeenCalledWith("test.html");
    });
  });

  describe("appendToFile", () => {
    it("should create subfolder and file if provided", async () => {
      await service.appendToFile("log.txt", "content", "logs");
      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith("logs", {
        create: true,
      });
      expect(mockSubfolderHandle.getFileHandle).toHaveBeenCalledWith(
        "log.txt",
        {
          create: true,
        },
      );
    });
  });

  describe("deleteFile", () => {
    it("should remove entry from subfolder if provided", async () => {
      mockSubfolderHandle.removeEntry = jasmine
        .createSpy("removeEntry")
        .and.returnValue(Promise.resolve());
      await service.deleteFile("log.txt", "logs");
      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith("logs");
      expect(mockSubfolderHandle.removeEntry).toHaveBeenCalledWith("log.txt");
    });

    it("should remove entry from root if subfolder not provided", async () => {
      mockHandle.removeEntry = jasmine
        .createSpy("removeEntry")
        .and.returnValue(Promise.resolve());
      await service.deleteFile("log.txt");
      expect(mockHandle.getDirectoryHandle).not.toHaveBeenCalled();
      expect(mockHandle.removeEntry).toHaveBeenCalledWith("log.txt");
    });

    it("should ignore NotFoundError during deleteFile", async () => {
      mockHandle.removeEntry = jasmine
        .createSpy("removeEntry")
        .and.returnValue(Promise.reject({ name: "NotFoundError" }));
      await service.deleteFile("missing.txt");
      expect(mockHandle.removeEntry).toHaveBeenCalledWith("missing.txt");
    });
  });

  describe("Edge cases and Permissions", () => {
    it("should return false from hasCustomFiles when handle is undefined", async () => {
      (service.getCustomDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      const res = await service.hasCustomFiles("test.html");
      expect(res).toBeFalse();
    });

    it("should return false from hasCustomFiles when permission is denied", async () => {
      mockHandle.queryPermission.and.returnValue(Promise.resolve("denied"));
      mockHandle.requestPermission = jasmine
        .createSpy("requestPermission")
        .and.returnValue(Promise.resolve("denied"));
      const res = await service.hasCustomFiles("test.html");
      expect(res).toBeFalse();
    });

    it("should request permission when queryPermission returns prompt", async () => {
      mockHandle.queryPermission.and.returnValue(Promise.resolve("prompt"));
      mockHandle.requestPermission = jasmine
        .createSpy("requestPermission")
        .and.returnValue(Promise.resolve("granted"));
      const res = await service.hasCustomFiles("test.html");
      expect(res).toBeTrue();
      expect(mockHandle.requestPermission).toHaveBeenCalled();
    });

    it("should check default supported files list when no filename is given", async () => {
      const res = await service.hasCustomFiles();
      expect(res).toBeTrue();
    });

    it("should throw error in getCustomFile if handle is undefined", async () => {
      (service.getCustomDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      await expectAsync(
        service.getCustomFile("test.html"),
      ).toBeRejectedWithError("No custom directory configured");
    });

    it("should throw error in getCustomFile if permission denied", async () => {
      mockHandle.queryPermission.and.returnValue(Promise.resolve("denied"));
      mockHandle.requestPermission = jasmine
        .createSpy("requestPermission")
        .and.returnValue(Promise.resolve("denied"));
      await expectAsync(
        service.getCustomFile("test.html"),
      ).toBeRejectedWithError("Permission denied");
    });

    it("should do nothing in appendToFile and deleteFile if handle is undefined", async () => {
      (service.getCustomDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      await service.appendToFile("log.txt", "data");
      await service.deleteFile("log.txt");
      expect(mockHandle.getFileHandle).not.toHaveBeenCalled();
    });
  });

  describe("Custom Widgets methods", () => {
    let mockWidgetDirHandle: any;

    beforeEach(() => {
      mockWidgetDirHandle = {
        name: "test-widget",
        kind: "directory",
        queryPermission: jasmine
          .createSpy("queryPermission")
          .and.returnValue(Promise.resolve("granted")),
        getDirectoryHandle: jasmine
          .createSpy("getDirectoryHandle")
          .and.returnValue(Promise.resolve(mockSubfolderHandle)),
        values: async function* () {
          yield { name: "my-widget", kind: "directory" };
          yield { name: "readme.txt", kind: "file" };
        },
      };

      spyOn(service, "getCustomWidgetDirectoryHandle").and.returnValue(
        Promise.resolve(mockWidgetDirHandle),
      );
    });

    it("should get custom widget directories", async () => {
      const dirs = await service.getCustomWidgetDirectories();
      expect(dirs.length).toBe(1);
      expect(dirs[0].name).toBe("my-widget");
    });

    it("should return empty list if getCustomWidgetDirectoryHandle returns undefined", async () => {
      (service.getCustomWidgetDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      const dirs = await service.getCustomWidgetDirectories();
      expect(dirs).toEqual([]);
    });

    it("should fetch widget file", async () => {
      const content = await service.getWidgetFile("my-widget", "widget.json");
      expect(content).toBe("test content");
      expect(mockWidgetDirHandle.getDirectoryHandle).toHaveBeenCalledWith(
        "my-widget",
      );
      expect(mockSubfolderHandle.getFileHandle).toHaveBeenCalledWith(
        "widget.json",
      );
    });

    it("should throw in getWidgetFile if handle is undefined", async () => {
      (service.getCustomWidgetDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      await expectAsync(
        service.getWidgetFile("my-widget", "widget.json"),
      ).toBeRejectedWithError("No custom widget directory configured");
    });

    it("should check if widget file exists", async () => {
      const exists = await service.hasWidgetFile("my-widget", "widget.json");
      expect(exists).toBeTrue();

      mockWidgetDirHandle.getDirectoryHandle.and.returnValue(
        Promise.reject("not found"),
      );
      const notExists = await service.hasWidgetFile(
        "my-widget",
        "missing.json",
      );
      expect(notExists).toBeFalse();
    });

    it("should write widget file", async () => {
      mockSubfolderHandle.getFileHandle.and.returnValue(
        Promise.resolve(mockFileHandle),
      );
      await service.writeWidgetFile("my-widget", "widget.json", "{}");
      expect(mockWidgetDirHandle.getDirectoryHandle).toHaveBeenCalledWith(
        "my-widget",
        {
          create: true,
        },
      );
      expect(mockSubfolderHandle.getFileHandle).toHaveBeenCalledWith(
        "widget.json",
        {
          create: true,
        },
      );
    });

    it("should throw in writeWidgetFile if handle is undefined", async () => {
      (service.getCustomWidgetDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      await expectAsync(
        service.writeWidgetFile("my-widget", "widget.json", "{}"),
      ).toBeRejectedWithError("No custom widget directory configured");
    });

    it("should discover hierarchical widgets with groups and subgroups", async () => {
      const mockSubWidgetHandle = {
        name: "speedo",
        kind: "directory",
        getFileHandle: jasmine
          .createSpy("getFileHandle")
          .and.callFake((file: string) => {
            if (file === "widget.json") return Promise.resolve(mockFileHandle);
            return Promise.reject("not found");
          }),
        values: async function* () {},
      };

      const mockSubgroupHandle = {
        name: "gauges",
        kind: "directory",
        getFileHandle: jasmine
          .createSpy("getFileHandle")
          .and.rejectWith("not found"),
        values: async function* () {
          yield mockSubWidgetHandle;
        },
      };

      const mockGroupWidgetHandle = {
        name: "lap-delta",
        kind: "directory",
        getFileHandle: jasmine
          .createSpy("getFileHandle")
          .and.callFake((file: string) => {
            if (file === "widget.json") return Promise.resolve(mockFileHandle);
            return Promise.reject("not found");
          }),
        values: async function* () {},
      };

      const mockGroupHandle = {
        name: "sample",
        kind: "directory",
        getFileHandle: jasmine
          .createSpy("getFileHandle")
          .and.rejectWith("not found"),
        values: async function* () {
          yield mockGroupWidgetHandle;
          yield mockSubgroupHandle;
        },
      };

      const mockRootWidgetHandle = {
        name: "root-gauge",
        kind: "directory",
        getFileHandle: jasmine
          .createSpy("getFileHandle")
          .and.callFake((file: string) => {
            if (file === "widget.json") return Promise.resolve(mockFileHandle);
            return Promise.reject("not found");
          }),
        values: async function* () {},
      };

      const mockHierarchicalHandle = {
        name: "CustomWidgetsRoot",
        kind: "directory",
        queryPermission: jasmine
          .createSpy("queryPermission")
          .and.returnValue(Promise.resolve("granted")),
        values: async function* () {
          yield mockRootWidgetHandle;
          yield mockGroupHandle;
        },
      };

      (service.getCustomWidgetDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(mockHierarchicalHandle),
      );

      const dirs = await service.getCustomWidgetDirectories();
      expect(dirs.length).toBe(3);

      const rootWidget = dirs.find((d) => d.name === "root-gauge");
      expect(rootWidget?.group).toBe("custom-root");
      expect(rootWidget?.subgroup).toBeUndefined();

      const groupWidget = dirs.find((d) => d.name === "lap-delta");
      expect(groupWidget?.group).toBe("sample");
      expect(groupWidget?.subgroup).toBeUndefined();
      expect(groupWidget?.relativePath).toBe("sample/lap-delta");

      const subgroupWidget = dirs.find((d) => d.name === "speedo");
      expect(subgroupWidget?.group).toBe("sample");
      expect(subgroupWidget?.subgroup).toBe("gauges");
      expect(subgroupWidget?.relativePath).toBe("sample/gauges/speedo");
    });

    it("should write and read widget file with nested path", async () => {
      const mockNestedDir = {
        getFileHandle: jasmine
          .createSpy("getFileHandle")
          .and.returnValue(Promise.resolve(mockFileHandle)),
      };
      mockWidgetDirHandle.getDirectoryHandle.and.callFake((name: string) => {
        if (name === "sample") {
          return Promise.resolve({
            getDirectoryHandle: jasmine
              .createSpy("getDirectoryHandle")
              .and.returnValue(Promise.resolve(mockNestedDir)),
          });
        }
        return Promise.resolve(mockSubfolderHandle);
      });

      await service.writeWidgetFile("sample/my-widget", "widget.json", "{}");
      expect(mockWidgetDirHandle.getDirectoryHandle).toHaveBeenCalledWith(
        "sample",
        { create: true },
      );

      const content = await service.getWidgetFile(
        "sample/my-widget",
        "widget.json",
      );
      expect(content).toBe("test content");
    });

    it("should delete widget directory recursively", async () => {
      mockWidgetDirHandle.removeEntry = jasmine
        .createSpy("removeEntry")
        .and.returnValue(Promise.resolve());
      await service.deleteWidgetDirectory("sample", true);
      expect(mockWidgetDirHandle.removeEntry).toHaveBeenCalledWith("sample", {
        recursive: true,
      });
    });

    it("should delete nested widget directory recursively", async () => {
      const mockNestedDir = {
        removeEntry: jasmine
          .createSpy("removeEntry")
          .and.returnValue(Promise.resolve()),
      };
      mockWidgetDirHandle.getDirectoryHandle = jasmine
        .createSpy("getDirectoryHandle")
        .and.returnValue(Promise.resolve(mockNestedDir));

      await service.deleteWidgetDirectory("sample/nested-folder", true);
      expect(mockWidgetDirHandle.getDirectoryHandle).toHaveBeenCalledWith(
        "sample",
      );
      expect(mockNestedDir.removeEntry).toHaveBeenCalledWith("nested-folder", {
        recursive: true,
      });
    });

    it("should handle NotFoundError gracefully when deleting widget directory", async () => {
      mockWidgetDirHandle.removeEntry = jasmine
        .createSpy("removeEntry")
        .and.returnValue(Promise.reject({ name: "NotFoundError" }));
      await expectAsync(
        service.deleteWidgetDirectory("nonexistent"),
      ).toBeResolved();
    });

    it("should do nothing if handle is not configured when deleting widget directory", async () => {
      (service.getCustomWidgetDirectoryHandle as jasmine.Spy).and.returnValue(
        Promise.resolve(undefined),
      );
      await expectAsync(service.deleteWidgetDirectory("sample")).toBeResolved();
    });
  });

  describe("Server-backed directory operations", () => {
    it("should use chooseFolder when selecting custom folder on localhost", async () => {
      (service as any).isLocalhost = true;
      mockServerFs.chooseFolder.and.returnValue(
        Promise.resolve({
          success: true,
          path: "/custom/ui",
          name: "ui",
        }),
      );

      const res = await service.selectCustomFolder();
      expect(res).toBeTrue();
      expect(mockServerFs.chooseFolder).toHaveBeenCalledWith("ui");
      expect(service.getServerCustomUiPath()).toBe("/custom/ui");
    });

    it("should use chooseFolder when selecting custom widget folder on localhost", async () => {
      (service as any).isLocalhost = true;
      mockServerFs.chooseFolder.and.returnValue(
        Promise.resolve({
          success: true,
          path: "/custom/widgets",
          name: "widgets",
        }),
      );

      const res = await service.selectCustomWidgetFolder();
      expect(res).toBeTrue();
      expect(mockServerFs.chooseFolder).toHaveBeenCalledWith("widgets");
      expect(service.getServerCustomWidgetPath()).toBe("/custom/widgets");
    });

    it("should set custom folder path directly", async () => {
      mockServerFs.setDirectory.and.returnValue(
        Promise.resolve({
          success: true,
          path: "/pasted/ui",
          name: "ui",
        }),
      );

      const res = await service.setCustomFolder("/pasted/ui");
      expect(res).toBeTrue();
      expect(service.getServerCustomUiPath()).toBe("/pasted/ui");
    });

    it("should set custom widget folder path directly", async () => {
      mockServerFs.setDirectory.and.returnValue(
        Promise.resolve({
          success: true,
          path: "/pasted/widgets",
          name: "widgets",
        }),
      );

      const res = await service.setCustomWidgetFolder("/pasted/widgets");
      expect(res).toBeTrue();
      expect(service.getServerCustomWidgetPath()).toBe("/pasted/widgets");
    });

    it("should delegate widget operations to ServerFileSystemService when server widget path is set", async () => {
      (service as any).serverCustomWidgetPath = "/custom/widgets";
      (service as any).serverCustomWidgetName = "widgets";

      mockServerFs.listWidgets.and.returnValue(
        Promise.resolve([
          { name: "w1", relativePath: "sample/w1", group: "sample" },
        ]),
      );
      mockServerFs.getWidgetFile.and.returnValue(
        Promise.resolve("widget-content"),
      );
      mockServerFs.writeWidgetFile.and.returnValue(Promise.resolve(true));
      mockServerFs.deleteWidgetDir.and.returnValue(Promise.resolve(true));

      const dirs = await service.getCustomWidgetDirectories();
      expect(dirs.length).toBe(1);
      expect(dirs[0].name).toBe("w1");

      const file = await service.getWidgetFile("sample/w1", "widget.json");
      expect(file).toBe("widget-content");

      const exists = await service.hasWidgetFile("sample/w1", "widget.json");
      expect(exists).toBeTrue();

      await service.writeWidgetFile("sample/w1", "widget.json", "{}");
      expect(mockServerFs.writeWidgetFile).toHaveBeenCalledWith(
        "sample/w1",
        "widget.json",
        "{}",
      );

      await service.deleteWidgetDirectory("sample");
      expect(mockServerFs.deleteWidgetDir).toHaveBeenCalledWith("sample");
    });

    it("should delegate custom UI operations to ServerFileSystemService when server UI path is set", async () => {
      (service as any).serverCustomUiPath = "/custom/ui";
      (service as any).serverCustomUiName = "ui";

      mockServerFs.hasCustomFiles.and.returnValue(
        Promise.resolve({ exists: true, files: ["raceday.component.html"] }),
      );
      mockServerFs.getCustomFile.and.returnValue(
        Promise.resolve("<div>UI</div>"),
      );
      mockServerFs.appendCustomUiFile.and.returnValue(Promise.resolve(true));
      mockServerFs.deleteCustomUiFile.and.returnValue(Promise.resolve(true));

      const has = await service.hasCustomFiles("raceday.component.html");
      expect(has).toBeTrue();

      const content = await service.getCustomFile("raceday.component.html");
      expect(content).toBe("<div>UI</div>");

      await service.appendToFile("raceday.component.html", "more");
      expect(mockServerFs.appendCustomUiFile).toHaveBeenCalledWith(
        "raceday.component.html",
        "more",
        undefined,
      );

      await service.deleteFile("raceday.component.html");
      expect(mockServerFs.deleteCustomUiFile).toHaveBeenCalledWith(
        "raceday.component.html",
        undefined,
      );
    });
  });
});
