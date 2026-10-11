import { Driver } from "@app/models/driver";

import {
  applySavedDriver,
  buildDriverSelectItems,
  buildNewDriverTemplate,
  formatSaveErrorMessage,
  loadExpanderState,
  loadLinkState,
  mapRawDrivers,
  navigateDriverEditorBack,
  navigateNewDriver,
  prepareDriverForSaveAsNew,
  processImportedAssets,
  resolveInitialDriverId,
  resolveTargetDriverIdAfterImport,
  saveExpanderState,
  saveLinkState,
} from "./driver-editor-actions.helper";

describe("driver-editor-actions.helper", () => {
  let mockLogger: any;
  let mockTranslationService: any;
  let mockRouter: any;
  let mockRoute: any;
  let mockLocation: any;

  beforeEach(() => {
    mockLogger = {
      error: jasmine.createSpy("error"),
      warn: jasmine.createSpy("warn"),
    };
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };
    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
      navigateByUrl: jasmine.createSpy("navigateByUrl"),
      serializeUrl: jasmine
        .createSpy("serializeUrl")
        .and.returnValue("/driver-editor?id=d1"),
      createUrlTree: jasmine.createSpy("createUrlTree"),
    };
    mockRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };
    mockLocation = {
      replaceState: jasmine.createSpy("replaceState"),
    };
  });

  afterEach(() => {
    localStorage.removeItem("driver_editor_name_nickname_linked");
    localStorage.removeItem("driver_editor_expanders");
  });

  describe("Expander and Link State", () => {
    it("should save and load expander state", () => {
      saveExpanderState({ audio: false }, mockLogger);
      const loaded = loadExpanderState({ audio: true }, mockLogger);
      expect(loaded).toBeDefined();
    });

    it("should save and load link state", () => {
      saveLinkState(true, mockLogger);
      const loaded = loadLinkState(false, mockLogger);
      expect(typeof loaded).toBe("boolean");
    });
  });

  describe("buildDriverSelectItems", () => {
    it("should sort drivers naturally by name", () => {
      const drivers = [
        new Driver("d2", "Driver 10", "d10"),
        new Driver("d1", "Driver 2", "d2"),
        new Driver("d3", "Driver 1", "d1"),
      ];
      const items = buildDriverSelectItems(drivers);
      expect(items.map((i) => i.name)).toEqual([
        "Driver 1",
        "Driver 2",
        "Driver 10",
      ]);
    });

    it("should handle empty or null driver list", () => {
      expect(buildDriverSelectItems([])).toEqual([]);
      expect(buildDriverSelectItems(null as any)).toEqual([]);
    });
  });

  describe("navigateNewDriver", () => {
    it("should replace state when auto-saving", () => {
      navigateNewDriver(mockRouter, mockRoute, mockLocation, "d-new", true);
      expect(mockRouter.createUrlTree).toHaveBeenCalled();
      expect(mockLocation.replaceState).toHaveBeenCalledWith(
        "/driver-editor?id=d1",
      );
    });

    it("should navigate when manual save", () => {
      navigateNewDriver(mockRouter, mockRoute, mockLocation, "d-new", false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/driver-editor"],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({ id: "d-new" }),
          replaceUrl: true,
        }),
      );
    });
  });

  describe("formatSaveErrorMessage", () => {
    it("should return conflict message on status 409", () => {
      const msg = formatSaveErrorMessage(
        { status: 409, error: "Custom conflict" },
        mockTranslationService,
      );
      expect(msg).toBe("Custom conflict");
    });

    it("should return default conflict message on 409 without custom error", () => {
      const msg = formatSaveErrorMessage(
        { status: 409 },
        mockTranslationService,
      );
      expect(msg).toBe("DE_ERROR_NAME_EXISTS");
    });

    it("should format generic error message", () => {
      const msg = formatSaveErrorMessage(
        { message: "Network timeout" },
        mockTranslationService,
      );
      expect(msg).toBe("DE_ERROR_SAVE_FAILEDNetwork timeout");
    });
  });

  describe("applySavedDriver", () => {
    it("should update editing driver and driver list on update", () => {
      const existing = new Driver("d1", "Existing", "New");
      const result = applySavedDriver({
        result: { entity_id: "d1" },
        driverToSend: { ...existing, nickname: "New" },
        wasNew: false,
        isSaveAsNew: false,
        isAutoSave: false,
        transitionToReadOnlyOnSave: true,
        editingDriver: existing,
        allDrivers: [existing],
      });

      expect(result.savedDriver.entity_id).toBe("d1");
      expect(result.isEditMode).toBeFalse();
      expect(result.allDrivers.length).toBe(1);
      expect(result.allDrivers[0].nickname).toBe("New");
    });

    it("should append new driver when wasNew is true", () => {
      const existing = new Driver("d1", "Existing", "Old");
      const result = applySavedDriver({
        result: { entity_id: "d2" },
        driverToSend: { name: "Created", nickname: "CreatedNick" },
        wasNew: true,
        isSaveAsNew: false,
        isAutoSave: false,
        transitionToReadOnlyOnSave: false,
        allDrivers: [existing],
      });

      expect(result.savedDriver.entity_id).toBe("d2");
      expect(result.isEditMode).toBeTrue();
      expect(result.isPreservingEditModeOnNavigation).toBeTrue();
      expect(result.allDrivers.length).toBe(2);
      expect(result.allDrivers[1].name).toBe("Created");
    });
  });

  describe("resolveInitialDriverId", () => {
    const d1 = new Driver("d1", "Driver One", "one");
    const d2 = new Driver("d2", "Driver Two", "two");

    it("should return isNew true when idParam is 'new'", () => {
      const res = resolveInitialDriverId([d1, d2], "new", null, null);
      expect(res.isNew).toBeTrue();
      expect(res.target).toBeNull();
    });

    it("should find driver by idParam", () => {
      const res = resolveInitialDriverId([d1, d2], "d2", null, null);
      expect(res.isNew).toBeFalse();
      expect(res.target).toBe(d2);
    });

    it("should fallback to last edited driver when idParam not found", () => {
      const res = resolveInitialDriverId([d1, d2], "unknown", "d2", null);
      expect(res.isNew).toBeFalse();
      expect(res.target).toBe(d2);
    });

    it("should fallback to first driver when last edited not found", () => {
      const res = resolveInitialDriverId(
        [d1, d2],
        "unknown",
        "not_there",
        null,
      );
      expect(res.isNew).toBeFalse();
      expect(res.target).toBe(d1);
    });

    it("should return isNew true when driver list is empty", () => {
      const res = resolveInitialDriverId([], "unknown", null, null);
      expect(res.isNew).toBeTrue();
      expect(res.target).toBeNull();
    });

    it("should resolve currentLastEditedId when idParam is null", () => {
      const res = resolveInitialDriverId([d1, d2], null, null, "d2");
      expect(res.isNew).toBeFalse();
      expect(res.target).toBe(d2);
    });
  });

  describe("navigateDriverEditorBack", () => {
    it("should navigate to returnUrl when present", () => {
      mockRoute.snapshot.queryParamMap.get.and.callFake((key: string) =>
        key === "returnUrl" ? "/custom-return" : null,
      );
      navigateDriverEditorBack(mockRouter, mockRoute);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/custom-return");
    });

    it("should navigate to default-raceday when from is modify-heats", () => {
      mockRoute.snapshot.queryParamMap.get.and.callFake((key: string) =>
        key === "from" ? "modify-heats" : null,
      );
      navigateDriverEditorBack(mockRouter, mockRoute);
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/default-raceday"], {
        queryParams: { modifyHeats: "true" },
      });
    });

    it("should fallback to raceday-setup", () => {
      mockRoute.snapshot.queryParamMap.get.and.returnValue(null);
      navigateDriverEditorBack(mockRouter, mockRoute);
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });
  });

  describe("buildNewDriverTemplate", () => {
    it("should generate unique name and nickname and omit entity_id", () => {
      const existing = [new Driver("d1", "New Driver", "New Driver Nickname")];
      const template = buildNewDriverTemplate(
        existing,
        "New Driver",
        "New Driver Nickname",
      );
      expect(template.name).toBe("New Driver_1");
      expect(template.nickname).toBe("New Driver Nickname_1");
      expect((template as any).entity_id).toBeUndefined();
    });
  });

  describe("prepareDriverForSaveAsNew", () => {
    it("should generate forced unique suffix for name and nickname", () => {
      const existing = [new Driver("d1", "Alpha", "Speedy")];
      const result = prepareDriverForSaveAsNew(existing[0], existing);
      expect(result.name).toBe("Alpha_1");
      expect(result.nickname).toBe("Speedy_1");
    });
  });

  describe("resolveTargetDriverIdAfterImport", () => {
    it("should return the first created driver id when created drivers exist", () => {
      const result = {
        success: true,
        importedCount: 2,
        updatedCount: 0,
        skippedCount: 0,
        createdDriverIds: ["d-new-1", "d-new-2"],
        messages: [],
      };
      expect(resolveTargetDriverIdAfterImport(result, "d1")).toBe("d-new-1");
    });

    it("should retain current selection if current driver was updated", () => {
      const result = {
        success: true,
        importedCount: 1,
        updatedCount: 1,
        skippedCount: 0,
        createdDriverIds: [],
        updatedDriverIds: ["d1", "d2"],
        messages: [],
      };
      expect(resolveTargetDriverIdAfterImport(result, "d1")).toBe("d1");
    });

    it("should select first updated driver if current selection is not among updated", () => {
      const result = {
        success: true,
        importedCount: 1,
        updatedCount: 1,
        skippedCount: 0,
        createdDriverIds: [],
        updatedDriverIds: ["d2"],
        messages: [],
      };
      expect(resolveTargetDriverIdAfterImport(result, "d1")).toBe("d2");
    });

    it("should fallback to current selection when no created or updated ids exist", () => {
      const result = {
        success: true,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 1,
        createdDriverIds: [],
        messages: [],
      };
      expect(resolveTargetDriverIdAfterImport(result, "d1")).toBe("d1");
      expect(resolveTargetDriverIdAfterImport(result, null)).toBeUndefined();
    });
  });

  describe("processImportedAssets", () => {
    it("should separate images and audio assets correctly", () => {
      const assets = [
        { type: "image", name: "avatar.png" },
        { type: "sound", name: "engine.wav" },
        { type: "audio", name: "horn.mp3" },
        { type: "audio_set", name: "fuel_set" },
      ];
      const processed = processImportedAssets(assets);
      expect(processed.avatarAssets.length).toBe(1);
      expect(processed.avatarAssets[0].name).toBe("avatar.png");
      expect(processed.soundAssets.length).toBe(2);
      expect(processed.soundAssets.map((s) => s.name)).toEqual([
        "engine.wav",
        "horn.mp3",
      ]);
    });

    it("should handle null or empty assets", () => {
      const processed = processImportedAssets(null as any);
      expect(processed.avatarAssets).toEqual([]);
      expect(processed.soundAssets).toEqual([]);
    });
  });

  describe("mapRawDrivers", () => {
    it("should map raw driver objects to Driver instances", () => {
      const raw = [
        { entity_id: "d1", name: "Driver 1", nickname: "D1" },
        { entity_id: "d2", name: "Driver 2", nickname: "D2" },
      ];
      const mapped = mapRawDrivers(raw);
      expect(mapped.length).toBe(2);
      expect(mapped[0] instanceof Driver).toBeTrue();
      expect(mapped[0].entity_id).toBe("d1");
      expect(mapped[1].name).toBe("Driver 2");
    });
  });
});
