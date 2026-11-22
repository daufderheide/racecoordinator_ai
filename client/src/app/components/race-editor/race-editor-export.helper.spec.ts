import { of, throwError } from "rxjs";

import {
  RaceEditorExportHelper,
  RaceExportHost,
} from "./race-editor-export.helper";

describe("RaceEditorExportHelper", () => {
  let mockHost: jasmine.SpyObj<RaceExportHost>;
  let mockDataService: any;

  beforeEach(() => {
    mockDataService = {
      exportRaceConfigBlob: jasmine
        .createSpy("exportRaceConfigBlob")
        .and.returnValue(of(new Blob(["{}"], { type: "application/json" }))),
      importRaceConfig: jasmine
        .createSpy("importRaceConfig")
        .and.returnValue(of({ entity_id: "race-1", name: "Imported Race" })),
    };

    mockHost = {
      selectedRace: { entity_id: "race-1", name: "GT3 Sprint" },
      selectedRaceId: "race-1",
      isSaving: false,
      dataService: mockDataService,
      logger: {
        error: jasmine.createSpy("error"),
        warn: jasmine.createSpy("warn"),
        info: jasmine.createSpy("info"),
      },
      cdr: { detectChanges: jasmine.createSpy("detectChanges") },
      showError: jasmine.createSpy("showError"),
      showAckModal: false,
      ackModalTitle: "",
      ackModalMessage: "",
      loadRaces: jasmine.createSpy("loadRaces"),
      selectRace: jasmine.createSpy("selectRace"),
      showConfigConflictModal: false,
      configConflictExistingName: "",
      configConflictSuggestedName: "",
      pendingImportFile: null,
    };
  });

  describe("exportRaceConfig", () => {
    it("should do nothing if selectedRace has no entity_id", async () => {
      mockHost.selectedRace = null;
      await RaceEditorExportHelper.exportRaceConfig(mockHost);
      expect(mockDataService.exportRaceConfigBlob).not.toHaveBeenCalled();

      mockHost.selectedRace = { entity_id: "" };
      await RaceEditorExportHelper.exportRaceConfig(mockHost);
      expect(mockDataService.exportRaceConfigBlob).not.toHaveBeenCalled();
    });

    it("should call exportRaceConfigBlob with the race entity_id", async () => {
      mockHost.selectedRace = {
        entity_id: "race-1",
        name: "  GT3 & Cup @ 2026!  ",
      };
      await RaceEditorExportHelper.exportRaceConfig(mockHost);
      expect(mockDataService.exportRaceConfigBlob).toHaveBeenCalledWith(
        "race-1",
      );
    });

    it("should handle error gracefully and show error modal", async () => {
      mockDataService.exportRaceConfigBlob.and.returnValue(
        throwError(() => new Error("Network error")),
      );
      await RaceEditorExportHelper.exportRaceConfig(mockHost);
      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_EXPORT_CONFIG_ERROR_TITLE",
        "RE_EXPORT_CONFIG_ERROR_MSG",
      );
    });

    it("should ignore AbortError when user cancels file picker", async () => {
      const abortError = new Error("User cancelled");
      abortError.name = "AbortError";
      mockDataService.exportRaceConfigBlob.and.returnValue(
        throwError(() => abortError),
      );
      await RaceEditorExportHelper.exportRaceConfig(mockHost);
      expect(mockHost.logger.error).not.toHaveBeenCalled();
      expect(mockHost.showError).not.toHaveBeenCalled();
    });

    it("should fallback to 'Race' if race name is missing", async () => {
      mockHost.selectedRace = { entity_id: "race-99" };
      await RaceEditorExportHelper.exportRaceConfig(mockHost);
      expect(mockDataService.exportRaceConfigBlob).toHaveBeenCalledWith(
        "race-99",
      );
    });
  });

  describe("triggerImport", () => {
    it("should reset value and trigger click on file input", () => {
      const mockInput = {
        value: "some-file.json",
        click: jasmine.createSpy("click"),
      } as any;
      RaceEditorExportHelper.triggerImport(mockInput);
      expect(mockInput.value).toBe("");
      expect(mockInput.click).toHaveBeenCalled();
    });

    it("should handle null fileInput gracefully", () => {
      expect(() =>
        RaceEditorExportHelper.triggerImport(null as any),
      ).not.toThrow();
    });
  });

  describe("handleFileSelected", () => {
    it("should do nothing if no file selected", async () => {
      const event = { target: { files: [] } } as any;
      await RaceEditorExportHelper.handleFileSelected(mockHost, event);
      expect(mockDataService.importRaceConfig).not.toHaveBeenCalled();

      await RaceEditorExportHelper.handleFileSelected(mockHost, {} as any);
      expect(mockDataService.importRaceConfig).not.toHaveBeenCalled();
    });

    it("should import successfully and reload races", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockDataService.importRaceConfig).toHaveBeenCalledWith(file);
      expect(mockHost.loadRaces).toHaveBeenCalled();
      expect(mockHost.selectRace).toHaveBeenCalledWith({
        entity_id: "race-1",
        name: "Imported Race",
      });
      expect(mockHost.showAckModal).toBeTrue();
      expect(mockHost.ackModalTitle).toBe("RE_IMPORT_CONFIG_SUCCESS_TITLE");
    });

    it("should import successfully even if created response is null", async () => {
      mockDataService.importRaceConfig.and.returnValue(of(null));
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockHost.loadRaces).toHaveBeenCalled();
      expect(mockHost.selectRace).not.toHaveBeenCalled();
      expect(mockHost.showAckModal).toBeTrue();
    });

    it("should open conflict modal on 409 conflict response", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => ({
          status: 409,
          error: {
            conflict: true,
            existing_name: "GT3 Sprint",
            suggested_name: "GT3 Sprint (1)",
          },
        })),
      );

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockHost.pendingImportFile).toBe(file);
      expect(mockHost.configConflictExistingName).toBe("GT3 Sprint");
      expect(mockHost.configConflictSuggestedName).toBe("GT3 Sprint (1)");
      expect(mockHost.showConfigConflictModal).toBeTrue();
      expect(mockHost.cdr.detectChanges).toHaveBeenCalled();
    });

    it("should handle 409 conflict with fallback names if not provided", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => ({
          status: 409,
          error: {
            conflict: true,
          },
        })),
      );

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);
      expect(mockHost.configConflictExistingName).toBe("");
      expect(mockHost.configConflictSuggestedName).toBe("");
    });

    it("should display error modal on generic failure with error.message", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => ({
          error: { message: "Invalid format" },
        })),
      );

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "Invalid format",
      );
    });

    it("should display error modal on generic failure with plain error message", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => new Error("Plain JS Error")),
      );

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "Plain JS Error",
      );
    });

    it("should display error modal on 409 status without conflict object", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => ({
          status: 409,
          error: null,
          message: "Conflict but no payload",
        })),
      );

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);
      expect(mockHost.showConfigConflictModal).toBeFalse();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "Conflict but no payload",
      );
    });

    it("should display error modal on generic failure with null error", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(throwError(() => null));

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "RE_IMPORT_CONFIG_ERROR_MSG",
      );
    });

    it("should display error modal on generic failure with fallback message", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      const event = { target: { files: [file] } } as any;
      mockDataService.importRaceConfig.and.returnValue(throwError(() => ({})));

      await RaceEditorExportHelper.handleFileSelected(mockHost, event);

      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "RE_IMPORT_CONFIG_ERROR_MSG",
      );
    });
  });

  describe("resolveConflict", () => {
    it("should cancel cleanly if CANCEL is selected", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;
      mockHost.showConfigConflictModal = true;

      await RaceEditorExportHelper.resolveConflict(mockHost, "CANCEL");

      expect(mockHost.showConfigConflictModal).toBeFalse();
      expect(mockHost.pendingImportFile).toBeNull();
      expect(mockDataService.importRaceConfig).not.toHaveBeenCalled();
      expect(mockHost.cdr.detectChanges).toHaveBeenCalled();
    });

    it("should return early if pendingImportFile is null", async () => {
      mockHost.pendingImportFile = null;
      await RaceEditorExportHelper.resolveConflict(mockHost, "OVERWRITE");
      expect(mockDataService.importRaceConfig).not.toHaveBeenCalled();
      expect(mockHost.cdr.detectChanges).toHaveBeenCalled();
    });

    it("should call importRaceConfig with resolution and reload races", async () => {
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;

      await RaceEditorExportHelper.resolveConflict(mockHost, "AUTO_RENAME");

      expect(mockDataService.importRaceConfig).toHaveBeenCalledWith(
        file,
        "AUTO_RENAME",
      );
      expect(mockHost.loadRaces).toHaveBeenCalled();
      expect(mockHost.selectRace).toHaveBeenCalledWith({
        entity_id: "race-1",
        name: "Imported Race",
      });
      expect(mockHost.showAckModal).toBeTrue();
    });

    it("should handle null created response in resolveConflict", async () => {
      mockDataService.importRaceConfig.and.returnValue(of(null));
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;

      await RaceEditorExportHelper.resolveConflict(mockHost, "OVERWRITE");
      expect(mockHost.loadRaces).toHaveBeenCalled();
      expect(mockHost.selectRace).not.toHaveBeenCalled();
      expect(mockHost.showAckModal).toBeTrue();
    });

    it("should handle error in resolveConflict gracefully", async () => {
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => new Error("Disk full")),
      );
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;

      await RaceEditorExportHelper.resolveConflict(mockHost, "OVERWRITE");
      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "Disk full",
      );
    });

    it("should handle error in resolveConflict with error.message payload", async () => {
      mockDataService.importRaceConfig.and.returnValue(
        throwError(() => ({
          error: { message: "Permission denied" },
        })),
      );
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;

      await RaceEditorExportHelper.resolveConflict(mockHost, "OVERWRITE");
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "Permission denied",
      );
    });

    it("should handle null error in resolveConflict gracefully", async () => {
      mockDataService.importRaceConfig.and.returnValue(throwError(() => null));
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;

      await RaceEditorExportHelper.resolveConflict(mockHost, "OVERWRITE");
      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "RE_IMPORT_CONFIG_ERROR_MSG",
      );
    });

    it("should handle error in resolveConflict with fallback message", async () => {
      mockDataService.importRaceConfig.and.returnValue(throwError(() => ({})));
      const file = new File(["{}"], "race.json", {
        type: "application/json",
      });
      mockHost.pendingImportFile = file;

      await RaceEditorExportHelper.resolveConflict(mockHost, "OVERWRITE");
      expect(mockHost.showError).toHaveBeenCalledWith(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        "RE_IMPORT_CONFIG_ERROR_MSG",
      );
    });
  });
});
