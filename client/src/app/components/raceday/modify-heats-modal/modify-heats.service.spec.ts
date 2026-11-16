import { TestBed } from "@angular/core/testing";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { TranslationService } from "@app/services/translation.service";

import { DropContext, ModifyHeatsService } from "./modify-heats.service";

describe("ModifyHeatsService", () => {
  let service: ModifyHeatsService;
  let mockValidationService: any;
  let mockTranslationService: any;

  beforeEach(() => {
    mockValidationService = {
      validate: jasmine
        .createSpy("validate")
        .and.returnValue({ isValid: true }),
      getErrorMessage: jasmine
        .createSpy("getErrorMessage")
        .and.returnValue("Validation error"),
    };

    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string, _params?: any) => key),
    };

    TestBed.configureTestingModule({
      providers: [
        ModifyHeatsService,
        {
          provide: ParticipantValidationService,
          useValue: mockValidationService,
        },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    service = TestBed.inject(ModifyHeatsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  function createTestDriver(id: string, name: string): Driver {
    return new Driver(id, name, name.substring(0, 2));
  }

  function createTestParticipant(driver: Driver): RaceParticipant {
    return new RaceParticipant(
      driver.entity_id,
      driver,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
    );
  }

  it("should save and restore state correctly", () => {
    const heats = [new Heat("h1", 0, [], [], false)];
    const driver = createTestDriver("d1", "Dave");
    const participant = createTestParticipant(driver);
    const participants = [participant];

    service.saveState(heats, participants);
    const restored = service.restoreState();

    expect(restored).toBeTruthy();
    expect(restored?.heats.length).toBe(1);
    expect(restored?.participants.length).toBe(1);

    // Second restore should return null
    expect(service.restoreState()).toBeNull();
  });

  describe("handleDrop within same container (fromId === toId)", () => {
    it("should reorder participants within driver-pool", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const p2 = createTestParticipant(createTestDriver("d2", "Alice"));
      const participants = [p1, p2];

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "driver-pool", data: [p1, p2] },
        item: { data: p1 },
        currentIndex: 1,
      };

      const context: DropContext = {
        localHeats: [],
        localParticipants: participants,
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedParticipants[0]).toBe(p2);
      expect(result.updatedParticipants[1]).toBe(p1);
    });

    it("should handle dragging past end of driver-pool with placeholder search", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const emptyP = new RaceParticipant(
        "empty",
        new Driver("EMPTY_LANE", "Empty", "Empty"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        100,
      );
      const participants = [p1, emptyP];

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "driver-pool", data: [p1] },
        item: { data: p1 },
        currentIndex: 5, // past length
      };

      const context: DropContext = {
        localHeats: [],
        localParticipants: participants,
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
    });

    it("should return actionTaken: false for same non-driver-pool container", () => {
      const event: any = {
        previousContainer: { id: "heat-0-lane-0" },
        container: { id: "heat-0-lane-0" },
      };
      const context: DropContext = {
        localHeats: [],
        localParticipants: [],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };
      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeFalse();
    });
  });

  describe("handleDrop to heat lane (toId starts with heat-)", () => {
    it("should reject drop if target heat is already started", () => {
      const heat = new Heat("h1", 0, [], [], true);
      const p = createTestParticipant(createTestDriver("d1", "Dave"));

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "heat-0-lane-0" },
        item: { data: p },
      };

      const context: DropContext = {
        localHeats: [heat],
        localParticipants: [p],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: (h) => h.started,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeFalse();
    });

    it("should add participant to empty lane from driver-pool", () => {
      const heat = new Heat("h1", 0, [], [], false);
      const p = createTestParticipant(createTestDriver("d1", "Dave"));

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "heat-0-lane-1" },
        item: { data: p },
      };

      const context: DropContext = {
        localHeats: [heat],
        localParticipants: [p],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedHeats[0].heatDrivers.length).toBe(1);
      expect(result.updatedHeats[0].heatDrivers[0].laneIndex).toBe(1);
      expect(result.updatedHeats[0].heatDrivers[0].participant).toBe(p);
    });

    it("should swap drivers when moving between lanes across heats", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const p2 = createTestParticipant(createTestDriver("d2", "Alice"));

      const heat0 = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        false,
      );
      const heat1 = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd2", p2, 1)],
        [],
        false,
      );

      const event: any = {
        previousContainer: { id: "heat-0-lane-0" },
        container: { id: "heat-1-lane-1" },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat0, heat1],
        localParticipants: [p1, p2],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedHeats[0].heatDrivers[0].participant).toBe(p2);
      expect(result.updatedHeats[1].heatDrivers[0].participant).toBe(p1);
    });

    it("should replace placeholder driver without swapping it back when moving into a lane containing placeholder driver", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const pEmpty = createTestParticipant(
        new Driver("EMPTY_LANE", "Empty", "Empty"),
      );

      const heat0 = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        false,
      );
      const heat1 = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd-empty", pEmpty, 1)],
        [],
        false,
      );

      const event: any = {
        previousContainer: { id: "heat-0-lane-0" },
        container: { id: "heat-1-lane-1" },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat0, heat1],
        localParticipants: [p1, pEmpty],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedHeats[0].heatDrivers.length).toBe(0);
      expect(result.updatedHeats[1].heatDrivers.length).toBe(1);
      expect(result.updatedHeats[1].heatDrivers[0].laneIndex).toBe(1);
      expect(result.updatedHeats[1].heatDrivers[0].participant).toBe(p1);
    });

    it("should reject dropping a step-up driver into a step 1 heat", () => {
      const suDriver = new Driver("Step-Up 1", "Step-Up 1", "STEP_UP_0");
      const suPart = new RaceParticipant(
        "STEP_UP_0",
        suDriver,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        100,
      );
      suPart.isStepUp = true;

      const heat0 = new Heat("h0", 1, [], [], false);
      heat0.step = 1;

      const event: any = {
        previousContainer: { id: "step-up-pool" },
        container: { id: "heat-0-lane-0" },
        item: { data: suPart },
      };

      const context: DropContext = {
        localHeats: [heat0],
        localParticipants: [],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeFalse();
      expect(result.error).toEqual({
        title: "RDS_ERR_VALIDATION_TITLE",
        message: "RD_ERR_STEP_UP_IN_STEP_ONE",
      });
    });

    it("should allow dropping a step-up driver into a step 2 heat", () => {
      const suDriver = new Driver("Step-Up 1", "Step-Up 1", "STEP_UP_0");
      const suPart = new RaceParticipant(
        "STEP_UP_0",
        suDriver,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        100,
      );
      suPart.isStepUp = true;

      const heat1 = new Heat("h1", 2, [], [], false);
      heat1.step = 2;

      const event: any = {
        previousContainer: { id: "step-up-pool" },
        container: { id: "heat-0-lane-0" },
        item: { data: suPart },
      };

      const context: DropContext = {
        localHeats: [heat1],
        localParticipants: [],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedHeats[0].heatDrivers.length).toBe(1);
      expect(result.updatedHeats[0].heatDrivers[0].participant.objectId).toBe(
        "STEP_UP_0",
      );
    });

    it("should reject moving driver to heat they are already in", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const p2 = createTestParticipant(createTestDriver("d2", "Alice"));

      const heat0 = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        false,
      );
      const heat1 = new Heat(
        "h1",
        1,
        [
          new DriverHeatData("dhd1-dup", p1, 0),
          new DriverHeatData("dhd2", p2, 1),
        ],
        [],
        false,
      );

      const event: any = {
        previousContainer: { id: "heat-0-lane-0" },
        container: { id: "heat-1-lane-1" },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat0, heat1],
        localParticipants: [p1, p2],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeFalse();
    });

    it("should validate groups and reject cross-group assignments when group_options.enabled is true", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));

      const heat0 = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        false,
      );
      heat0.group = 0;
      const heat1 = new Heat("h1", 1, [], [], false);
      heat1.group = 1; // Different group!

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "heat-1-lane-0" },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat0, heat1],
        localParticipants: [p1],
        allDrivers: [],
        allTeams: [],
        race: { group_options: { enabled: true } } as any,
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeFalse();
      expect(result.error).toBeTruthy();
    });
  });

  describe("handleDrop to driver-pool from database-drivers and heat", () => {
    it("should add new participant from database-drivers into pool", () => {
      const driver = createTestDriver("d1", "Dave");

      const event: any = {
        previousContainer: { id: "database-drivers" },
        container: { id: "driver-pool", data: [] },
        item: { data: driver },
        currentIndex: 0,
      };

      const context: DropContext = {
        localHeats: [],
        localParticipants: [],
        allDrivers: [driver],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedParticipants.length).toBe(1);
    });

    it("should remove driver from heat when dragged from heat to driver-pool", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const heat = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 1)],
        [],
        false,
      );

      const event: any = {
        previousContainer: { id: "heat-0-lane-1" },
        container: { id: "driver-pool", data: [p1] },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat],
        localParticipants: [p1],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedHeats[0].heatDrivers.length).toBe(0);
    });
  });

  describe("handleDrop to database-drivers (deleting participant)", () => {
    it("should remove participant from unstarted heats and participants list", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const heat = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 1)],
        [],
        false,
      );

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "database-drivers" },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat],
        localParticipants: [p1],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedParticipants.length).toBe(0);
      expect(result.updatedHeats[0].heatDrivers.length).toBe(0);
    });

    it("should reject removal when participant is in started heat", () => {
      const p1 = createTestParticipant(createTestDriver("d1", "Dave"));
      const heat = new Heat(
        "h0",
        0,
        [new DriverHeatData("dhd1", p1, 1)],
        [],
        true,
      );

      const event: any = {
        previousContainer: { id: "driver-pool" },
        container: { id: "database-drivers" },
        item: { data: p1 },
      };

      const context: DropContext = {
        localHeats: [heat],
        localParticipants: [p1],
        allDrivers: [],
        allTeams: [],
        isHeatStarted: () => true,
        isParticipantInStartedHeat: () => true,
      };

      const result = service.handleDrop(event, context);
      expect(result.actionTaken).toBeFalse();
      expect(result.error).toBeTruthy();
    });
  });

  describe("handleAddFromAvailable", () => {
    it("should handle handleAddFromAvailable with Team object", () => {
      const team = new Team("t1", "Team 1", undefined, ["d1", "d2"]);
      const context: DropContext = {
        localHeats: [new Heat("h1", 0, [], [], false)],
        localParticipants: [],
        allDrivers: [],
        allTeams: [team],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleAddFromAvailable(team, context);
      expect(result.actionTaken).toBeTrue();
      expect(result.updatedParticipants.length).toBe(1);
      expect(result.updatedParticipants[0].team).toBe(team);
    });

    it("should reject handleAddFromAvailable when validation fails", () => {
      mockValidationService.validate.and.returnValue({
        isValid: false,
        errorCode: "DUPE_INDIVIDUAL_TEAM",
      });

      const driver = createTestDriver("d1", "Dave");
      const context: DropContext = {
        localHeats: [],
        localParticipants: [],
        allDrivers: [driver],
        allTeams: [],
        isHeatStarted: () => false,
        isParticipantInStartedHeat: () => false,
      };

      const result = service.handleAddFromAvailable(driver, context);
      expect(result.actionTaken).toBeFalse();
      expect(result.error).toBeTruthy();
    });
  });

  describe("container resolution and drop coordinates", () => {
    it("should resolve container id from element, data, or fallback", () => {
      const elContainer = {
        element: { nativeElement: { id: "heat-2-lane-3" } },
        id: "cdk-drop-list-42",
      } as any;
      expect(service.getContainerId(elContainer)).toBe("heat-2-lane-3");

      const dataContainer = {
        data: { heatIndex: 1, laneIndex: 0 },
        id: "cdk-drop-list-10",
      } as any;
      expect(service.getContainerId(dataContainer)).toBe("heat-1-lane-0");

      const poolData = [{ objectId: "p1" }];
      const context = { localParticipants: poolData } as any;
      const poolContainer = {
        data: poolData,
        id: "cdk-drop-list-99",
      } as any;
      expect(service.getContainerId(poolContainer, context)).toBe(
        "driver-pool",
      );

      const fallbackContainer = {
        id: "driver-pool",
      } as any;
      expect(service.getContainerId(fallbackContainer)).toBe("driver-pool");
    });

    it("should identify heat lanes and extract coords from data and id", () => {
      const laneFromData = {
        data: { heatIndex: 3, laneIndex: 2 },
      } as any;
      expect(service.isHeatLane(laneFromData)).toBeTrue();
      expect(service.getHeatLaneCoords(laneFromData)).toEqual({
        heatIndex: 3,
        laneIndex: 2,
      });

      const laneFromId = {
        element: { nativeElement: { id: "heat-0-lane-1" } },
      } as any;
      expect(service.isHeatLane(laneFromId)).toBeTrue();
      expect(service.getHeatLaneCoords(laneFromId)).toEqual({
        heatIndex: 0,
        laneIndex: 1,
      });

      const poolContainer = {
        element: { nativeElement: { id: "driver-pool" } },
      } as any;
      expect(service.isHeatLane(poolContainer)).toBeFalse();
      expect(service.getHeatLaneCoords(poolContainer)).toBeNull();
    });
  });
});
