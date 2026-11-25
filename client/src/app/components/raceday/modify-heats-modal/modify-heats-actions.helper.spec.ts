import { of, throwError } from "rxjs";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import {
  executeAutoSave,
  executeLaneCheck,
  extractParticipantMeta,
  handleExitConfirm,
  handleGroupChange,
  handleHeatDropHelper,
  handleHeatMouseMove,
  handlePointMouseMove,
  handleStepChange,
  handleTeammateChange,
  handleToggleStepUpBoundary,
  loadModifyHeatsData,
  navigateToEditorHelper,
  removeDriverFromHeatHelper,
  removeHeatHelper,
} from "./modify-heats-actions.helper";
import { HeatDragDropController } from "./modify-heats-ui.helper";

describe("modify-heats-actions.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "RD_DRIVERS_COUNT") return "drivers";
      return key;
    });
  });

  describe("extractParticipantMeta", () => {
    it("should format driver meta with nickname and badges", () => {
      const driver = new Driver("d1", "Alice", "The Rocket");
      const participant = new RaceParticipant(
        "p1",
        driver,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
      );
      participant.rankValue = 3;
      participant.seed = 2;

      const meta = extractParticipantMeta(participant, mockTranslationService);
      expect(meta).toBe('"The Rocket" • S2 #3');
    });

    it("should format team meta with count and badges", () => {
      const participant = new RaceParticipant(
        "p1",
        undefined as any,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
      );
      participant.team = {
        entity_id: "t1",
        name: "Team A",
        driverIds: ["d1", "d2"],
      } as any;
      participant.seed = 1;

      const meta = extractParticipantMeta(participant, mockTranslationService);
      expect(meta).toBe("2 drivers • S1");
    });
  });

  describe("handleTeammateChange", () => {
    it("should delegate to applyTeammateChange with value string or event", () => {
      const d1 = new Driver("d1", "Dave", "D1");
      const p1 = new RaceParticipant("p1", d1, 0, 0, 0, 0, 0, 0, 0, 0, 1);
      const dhd = new DriverHeatData("dhd1", p1, 0);
      const heat = new Heat("h1", 1, [dhd], [], false);

      const res = handleTeammateChange([heat], 0, dhd, "d1", [d1]);
      expect(res).toBeTrue();
    });
  });

  describe("handleStepChange", () => {
    it("should update heat step clamped to at least 1", () => {
      const heat = new Heat("h1", 1, [], [], false);
      handleStepChange(heat, 3);
      expect(heat.step).toBe(3);

      handleStepChange(heat, 0);
      expect(heat.step).toBe(1);
    });
  });

  describe("handleToggleStepUpBoundary", () => {
    it("should toggle boundary flag and assign step numbers when step-up is enabled", () => {
      const heat = new Heat("h1", 1, [], [], false);
      handleToggleStepUpBoundary(heat, [heat], true, 2);
      expect(heat.isStepUpBoundary).toBeTrue();
    });
  });

  describe("handleGroupChange", () => {
    it("should change group index and return true if changed", () => {
      const heat = new Heat("h1", 1, [], [], false);
      heat.group = 0;
      const changed = handleGroupChange(heat, 2);
      expect(changed).toBeTrue();
      expect(heat.group).toBe(1);

      const changedSame = handleGroupChange(heat, 2);
      expect(changedSame).toBeFalse();
    });
  });

  describe("handleExitConfirm", () => {
    it("should emit close and navigate to returnUrl", () => {
      const mockRoute: any = {
        snapshot: { queryParamMap: { get: () => "/custom-url" } },
      };
      const mockRouter: any = {
        navigateByUrl: jasmine.createSpy("navigateByUrl"),
      };
      const mockClose = { emit: jasmine.createSpy("emit") };

      handleExitConfirm(mockRoute, mockRouter, mockClose);
      expect(mockClose.emit).toHaveBeenCalledWith(false);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/custom-url");
    });
  });

  describe("navigateToEditorHelper", () => {
    it("should save state and navigate with query params", () => {
      const mockService: any = { saveState: jasmine.createSpy("saveState") };
      const mockRoute: any = {
        snapshot: { queryParamMap: { get: () => null } },
      };
      const mockRouter: any = {
        url: "/modify-heats?param=1",
        navigate: jasmine.createSpy("navigate"),
      };

      navigateToEditorHelper(
        "/driver-editor",
        mockRoute,
        mockRouter,
        mockService,
        [],
        [],
      );
      expect(mockService.saveState).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/driver-editor"], {
        queryParams: { from: "modify-heats", returnUrl: "/modify-heats" },
      });
    });
  });

  describe("handleHeatMouseMove and handlePointMouseMove", () => {
    it("should delegate to HeatDragDropController", () => {
      const controller = new HeatDragDropController();
      spyOn(controller, "updateCardHover");
      spyOn(controller, "updatePointHover");

      controller.isDraggingHeat = true;
      const heat = new Heat("h1", 1, [], [], false);
      const event = new MouseEvent("mousemove");

      handleHeatMouseMove(0, event, controller, [heat], -1, () => false);
      expect(controller.updateCardHover).toHaveBeenCalled();

      handlePointMouseMove(10, 20, controller, [heat], -1, () => false);
      expect(controller.updatePointHover).toHaveBeenCalled();
    });
  });

  describe("handleHeatDropHelper", () => {
    it("should return reordered heats and assign step numbers when step up enabled", () => {
      const controller = new HeatDragDropController();
      const h1 = new Heat("h1", 1, [], [], false);
      const h2 = new Heat("h2", 2, [], [], false);
      h1.isStepUpBoundary = true;

      spyOn(controller, "handleDrop").and.returnValue({
        reordered: true,
        newHeats: [h2, h1],
      });

      const res = handleHeatDropHelper(
        {} as any,
        controller,
        [h1, h2],
        -1,
        () => false,
        () => [],
        true,
        2,
      );

      expect(res).toEqual([h2, h1]);
      expect(res?.[0].step).toBeDefined();
    });

    it("should return null when drop was not reordered", () => {
      const controller = new HeatDragDropController();
      spyOn(controller, "handleDrop").and.returnValue({
        reordered: false,
        newHeats: [],
      });

      const res = handleHeatDropHelper(
        {} as any,
        controller,
        [],
        -1,
        () => false,
        () => [],
        false,
        undefined,
      );

      expect(res).toBeNull();
    });
  });

  describe("removeHeatHelper and removeDriverFromHeatHelper", () => {
    it("should delegate remove heat and remove driver", () => {
      const p1 = new RaceParticipant(
        "p1",
        new Driver("d1", "D1", "D"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
      );
      const dhd = new DriverHeatData("dhd1", p1, 0);
      const h1 = new Heat("h1", 1, [dhd], [], false);
      const h2 = new Heat("h2", 2, [], [], false);
      const heats = [h1, h2];

      const removedDriver = removeDriverFromHeatHelper(
        heats,
        0,
        0,
        () => false,
      );
      expect(removedDriver).toBeTrue();
      expect(h1.heatDrivers.length).toBe(0);

      const removedHeat = removeHeatHelper(
        heats,
        1,
        () => false,
        undefined,
        false,
      );
      expect(removedHeat).toBeTrue();
      expect(heats.length).toBe(1);
    });
  });

  describe("executeLaneCheck", () => {
    it("should perform lane check and return result", () => {
      const res = executeLaneCheck(
        [],
        [],
        undefined,
        mockTranslationService,
        false,
        undefined,
      );
      expect(res).toBeDefined();
      expect(res.allEqual).toBeFalse();
      expect(res.reports.length).toBeGreaterThan(0);
    });
  });

  describe("executeAutoSave", () => {
    it("should call executeModifyHeatsSave and callbacks", () => {
      const mockDataService: any = {
        modifyHeats: jasmine
          .createSpy("modifyHeats")
          .and.returnValue(of({ success: true })),
      };
      const mockUndoManager: any = {
        resetTracking: jasmine.createSpy("resetTracking"),
      };
      const onSuccess = jasmine.createSpy("onSuccess");
      const onFailure = jasmine.createSpy("onFailure");
      const onComplete = jasmine.createSpy("onComplete");

      executeAutoSave({
        localHeats: [],
        localParticipants: [],
        track: { lanes: [] } as any,
        isHeatStarted: () => false,
        dataService: mockDataService,
        undoManager: mockUndoManager,
        onSuccess,
        onFailure,
        onComplete,
      });

      expect(mockDataService.modifyHeats).toHaveBeenCalled();
      expect(mockUndoManager.resetTracking).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
    });
  });

  describe("loadModifyHeatsData", () => {
    it("should fetch drivers and teams and call onLoaded", () => {
      const mockDataService: any = {
        getDrivers: () => of([{ entity_id: "d1", name: "Driver 1" }]),
        getTeams: () => of([{ entity_id: "t1", name: "Team 1" }]),
      };
      const setAllDrivers = jasmine.createSpy("setAllDrivers");
      const setAllTeams = jasmine.createSpy("setAllTeams");
      const onLoaded = jasmine.createSpy("onLoaded");
      const onError = jasmine.createSpy("onError");

      const sub = loadModifyHeatsData(mockDataService, false, {
        setAllDrivers,
        setAllTeams,
        onLoaded,
        onError,
      });

      expect(setAllDrivers).toHaveBeenCalled();
      expect(setAllTeams).toHaveBeenCalled();
      expect(onLoaded).toHaveBeenCalledWith(false);
      sub.unsubscribe();
    });

    it("should call onError when data service fails", () => {
      const mockDataService: any = {
        getDrivers: () => throwError(() => new Error("Network error")),
        getTeams: () => of([]),
      };
      const onLoaded = jasmine.createSpy("onLoaded");
      const onError = jasmine.createSpy("onError");

      const sub = loadModifyHeatsData(mockDataService, true, {
        setAllDrivers: () => {},
        setAllTeams: () => {},
        onLoaded,
        onError,
      });

      expect(onError).toHaveBeenCalled();
      expect(onLoaded).not.toHaveBeenCalled();
      sub.unsubscribe();
    });
  });
});
