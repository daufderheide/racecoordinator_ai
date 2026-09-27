import {
  handleCancelEnterPathModal,
  handleConfirmEnterPath,
  handlePromptEnterPath,
  handleResetDefaultDirectory,
  handleResetWidgetDirectory,
  handleSelectDirectory,
  handleSelectWidgetDirectory,
  handleUpdateSampleWidgets,
} from "./ui-editor-directory.helper";

describe("ui-editor-directory.helper", () => {
  let comp: any;

  beforeEach(() => {
    comp = {
      fileSystem: {
        selectCustomFolder: jasmine
          .createSpy("selectCustomFolder")
          .and.resolveTo(true),
        getCustomDirectoryHandle: jasmine
          .createSpy("getCustomDirectoryHandle")
          .and.resolveTo({ name: "new_dir" }),
        clearCustomFolder: jasmine
          .createSpy("clearCustomFolder")
          .and.resolveTo(),
        selectCustomWidgetFolder: jasmine
          .createSpy("selectCustomWidgetFolder")
          .and.resolveTo(true),
        getCustomWidgetDirectoryHandle: jasmine
          .createSpy("getCustomWidgetDirectoryHandle")
          .and.resolveTo({ name: "new_widget_dir" }),
        clearCustomWidgetFolder: jasmine
          .createSpy("clearCustomWidgetFolder")
          .and.resolveTo(),
      },
      customDirectoryName: "old_dir",
      customWidgetDirectoryName: "old_widget_dir",
      customWidgetService: {
        reloadCustomWidgets: jasmine
          .createSpy("reloadCustomWidgets")
          .and.resolveTo(),
        exportStarterWidgets: jasmine
          .createSpy("exportStarterWidgets")
          .and.resolveTo({
            success: true,
            count: 5,
            directory: "widgets_dir",
          }),
      },
      openSuccessModal: jasmine.createSpy("openSuccessModal"),
      logger: { error: jasmine.createSpy("error") },
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };
  });

  it("should select directory and update customDirectoryName", async () => {
    await handleSelectDirectory(comp);
    expect(comp.fileSystem.selectCustomFolder).toHaveBeenCalled();
    expect(comp.customDirectoryName).toBe("new_dir");
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should reset default directory", async () => {
    await handleResetDefaultDirectory(comp);
    expect(comp.fileSystem.clearCustomFolder).toHaveBeenCalled();
    expect(comp.customDirectoryName).toBeNull();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should select widget directory and reload custom widgets", async () => {
    await handleSelectWidgetDirectory(comp);
    expect(comp.fileSystem.selectCustomWidgetFolder).toHaveBeenCalled();
    expect(comp.customWidgetDirectoryName).toBe("new_widget_dir");
    expect(comp.customWidgetService.reloadCustomWidgets).toHaveBeenCalled();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should reset widget default directory and reload custom widgets", async () => {
    await handleResetWidgetDirectory(comp);
    expect(comp.fileSystem.clearCustomWidgetFolder).toHaveBeenCalled();
    expect(comp.customWidgetDirectoryName).toBeNull();
    expect(comp.customWidgetService.reloadCustomWidgets).toHaveBeenCalled();
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should update sample widgets and open success modal", async () => {
    await handleUpdateSampleWidgets(comp);
    expect(comp.customWidgetService.exportStarterWidgets).toHaveBeenCalled();
    expect(comp.openSuccessModal).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_TITLE",
        params: { count: 5, directory: "widgets_dir" },
      }),
    );
    expect(comp.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should log error if exportStarterWidgets fails", async () => {
    const err = new Error("failed");
    comp.customWidgetService.exportStarterWidgets.and.rejectWith(err);
    await handleUpdateSampleWidgets(comp);
    expect(comp.logger.error).toHaveBeenCalledWith(
      "Failed to update sample widgets",
      err,
    );
  });

  describe("Enter Path handlers", () => {
    it("should prompt enter path for ui", () => {
      comp.customDirectoryPath = "/custom/ui/path";
      handlePromptEnterPath(comp, "ui");
      expect(comp.enterPathType).toBe("ui");
      expect(comp.manualPathInput).toBe("/custom/ui/path");
      expect(comp.enterPathError).toBeNull();
      expect(comp.showEnterPathModal).toBeTrue();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should prompt enter path for widgets", () => {
      comp.customWidgetDirectoryPath = "/custom/widgets/path";
      handlePromptEnterPath(comp, "widgets");
      expect(comp.enterPathType).toBe("widgets");
      expect(comp.manualPathInput).toBe("/custom/widgets/path");
      expect(comp.enterPathError).toBeNull();
      expect(comp.showEnterPathModal).toBeTrue();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should cancel enter path modal", () => {
      comp.showEnterPathModal = true;
      comp.enterPathType = "ui";
      comp.manualPathInput = "/test";
      comp.enterPathError = "error";
      handleCancelEnterPathModal(comp);
      expect(comp.showEnterPathModal).toBeFalse();
      expect(comp.enterPathType).toBeNull();
      expect(comp.manualPathInput).toBe("");
      expect(comp.enterPathError).toBeNull();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should do nothing on confirm if path is empty", async () => {
      comp.manualPathInput = "   ";
      await handleConfirmEnterPath(comp);
      expect(comp.fileSystem.setCustomFolder).not.toBeDefined();
    });

    it("should confirm enter path for ui successfully", async () => {
      comp.enterPathType = "ui";
      comp.manualPathInput = "/new/ui/path";
      comp.fileSystem.setCustomFolder = jasmine
        .createSpy("setCustomFolder")
        .and.resolveTo(true);
      comp.fileSystem.getServerCustomUiPath = () => "/new/ui/path";

      await handleConfirmEnterPath(comp);

      expect(comp.fileSystem.setCustomFolder).toHaveBeenCalledWith(
        "/new/ui/path",
      );
      expect(comp.customDirectoryName).toBe("new_dir");
      expect(comp.customDirectoryPath).toBe("/new/ui/path");
      expect(comp.showEnterPathModal).toBeFalse();
      expect(comp.enterPathError).toBeNull();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should set error when setCustomFolder fails", async () => {
      comp.enterPathType = "ui";
      comp.manualPathInput = "/invalid/path";
      comp.fileSystem.setCustomFolder = jasmine
        .createSpy("setCustomFolder")
        .and.resolveTo(false);

      await handleConfirmEnterPath(comp);

      expect(comp.enterPathError).toBe("UE_ERROR_DIR_NOT_FOUND");
      expect(comp.showEnterPathModal).toBeUndefined();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should confirm enter path for widgets successfully and reload widgets", async () => {
      comp.enterPathType = "widgets";
      comp.fileSystem.setCustomWidgetFolder = jasmine
        .createSpy("setCustomWidgetFolder")
        .and.resolveTo(true);
      comp.fileSystem.getServerCustomWidgetPath = () => "/new/widget/path";

      await handleConfirmEnterPath(comp, "/new/widget/path");

      expect(comp.fileSystem.setCustomWidgetFolder).toHaveBeenCalledWith(
        "/new/widget/path",
      );
      expect(comp.customWidgetDirectoryName).toBe("new_widget_dir");
      expect(comp.customWidgetDirectoryPath).toBe("/new/widget/path");
      expect(comp.customWidgetService.reloadCustomWidgets).toHaveBeenCalled();
      expect(comp.showEnterPathModal).toBeFalse();
      expect(comp.enterPathError).toBeNull();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should set error when setCustomWidgetFolder fails", async () => {
      comp.enterPathType = "widgets";
      comp.manualPathInput = "/invalid/widget/path";
      comp.fileSystem.setCustomWidgetFolder = jasmine
        .createSpy("setCustomWidgetFolder")
        .and.resolveTo(false);

      await handleConfirmEnterPath(comp);

      expect(comp.enterPathError).toBe("UE_ERROR_DIR_NOT_FOUND");
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });
  });
});
