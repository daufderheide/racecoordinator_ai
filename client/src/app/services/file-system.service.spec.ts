import { TestBed } from "@angular/core/testing";

import { FileSystemService } from "./file-system.service";

describe("FileSystemService", () => {
  let service: FileSystemService;
  let mockHandle: any;
  let mockSubfolderHandle: any;
  let mockFileHandle: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
  });
});
