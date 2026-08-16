import { TestBed } from "@angular/core/testing";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
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
      validate: () => ({ isValid: true }),
      getErrorMessage: () => "Validation error",
    };

    mockTranslationService = {
      translate: (key: string) => key,
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

  it("should handle handleAddFromAvailable with valid driver", () => {
    const driver = createTestDriver("d1", "Dave");
    const context: DropContext = {
      localHeats: [new Heat("h1", 0, [], [], false)],
      localParticipants: [],
      allDrivers: [driver],
      allTeams: [],
      isHeatStarted: () => false,
      isParticipantInStartedHeat: () => false,
    };

    const result = service.handleAddFromAvailable(driver, context);
    expect(result.actionTaken).toBeTrue();
    expect(result.updatedParticipants.length).toBe(1);
  });

  it("should handle handleRemoveFromRacing when not in started heat", () => {
    const driver = createTestDriver("d1", "Dave");
    const participant = createTestParticipant(driver);
    const context: DropContext = {
      localHeats: [new Heat("h1", 0, [], [], false)],
      localParticipants: [participant],
      allDrivers: [driver],
      allTeams: [],
      isHeatStarted: () => false,
      isParticipantInStartedHeat: () => false,
    };

    const result = service.handleRemoveFromRacing(participant, context);
    expect(result.actionTaken).toBeTrue();
    expect(result.updatedParticipants.length).toBe(0);
  });

  it("should reject handleRemoveFromRacing when participant in started heat", () => {
    const driver = createTestDriver("d1", "Dave");
    const participant = createTestParticipant(driver);
    const context: DropContext = {
      localHeats: [new Heat("h1", 0, [], [], true)],
      localParticipants: [participant],
      allDrivers: [driver],
      allTeams: [],
      isHeatStarted: () => true,
      isParticipantInStartedHeat: () => true,
    };

    const result = service.handleRemoveFromRacing(participant, context);
    expect(result.actionTaken).toBeFalse();
    expect(result.error).toBeTruthy();
  });
});
