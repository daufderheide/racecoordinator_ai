import { DragDropModule } from "@angular/cdk/drag-drop";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { GroupOptions } from "@app/models/group_options";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { TranslationService } from "@app/services/translation.service";

import { ModifyHeatsModalComponent } from "./modify-heats-modal.component";

describe("ModifyHeatsModalComponent", () => {
  let component: ModifyHeatsModalComponent;
  let fixture: ComponentFixture<ModifyHeatsModalComponent>;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockValidationService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "getTeams",
      "regenerateHeats",
      "modifyHeats",
      "updateRaceSubscription",
    ]);
    mockDataService.updateRaceSubscription.and.stub();
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getTeams.and.returnValue(of([]));
    mockDataService.regenerateHeats.and.returnValue(
      of({ success: true, heats: [] }),
    );
    mockDataService.modifyHeats.and.returnValue(of({ success: true }));

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockValidationService = jasmine.createSpyObj(
      "ParticipantValidationService",
      ["validate", "getErrorMessage"],
    );

    const mockActivatedRoute = {
      queryParams: of({}),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };

    const mockRouter = {
      navigate: jasmine.createSpy("navigate"),
      events: of(),
    };

    await TestBed.configureTestingModule({
      imports: [
        ModifyHeatsModalComponent,
        DragDropModule,
        TranslatePipe,
        AvatarUrlPipe,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ParticipantValidationService,
          useValue: mockValidationService,
        },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifyHeatsModalComponent);
    component = fixture.componentInstance;

    // Provide required inputs to prevent NG0950 errors
    const track = createMockTrack();
    fixture.componentRef.setInput("track", track);
    fixture.componentRef.setInput("race", createMockRace(track, true));
  });

  const createMockRace = (track: Track, groupEnabled: boolean = false) => {
    const race = new Race("race-1", "Test Race", track);
    // Use defineProperty to ensure the value is set correctly and picks up by signals
    Object.defineProperty(race, "group_options", {
      value: new GroupOptions(groupEnabled),
      writable: true,
      configurable: true,
    });
    return race;
  };

  const createMockTrack = () => {
    return new Track("track-1", "Test Track", 100, [
      {
        lane_index: 0,
        background_color: "red",
        foreground_color: "white",
      } as any,
      {
        lane_index: 1,
        background_color: "blue",
        foreground_color: "white",
      } as any,
    ]);
  };

  it("should show all participants in RACING pool even if they are assigned to a heat", () => {
    const driver = new Driver("d1", "Austin", "Austin");
    const participant = new RaceParticipant(
      "rp1",
      driver,
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
    const heat = new Heat("h1", 1, [
      new DriverHeatData("dhd1", participant, 0),
    ]);

    const track = createMockTrack();
    fixture.componentRef.setInput("race", createMockRace(track));
    fixture.componentRef.setInput("track", track);
    fixture.componentRef.setInput("participants", [participant]);
    fixture.componentRef.setInput("heats", [heat]);
    fixture.componentRef.setInput("raceState", RaceState.NOT_STARTED);

    fixture.detectChanges();

    // Verify driverPool contains the participant despite being in heat 1
    expect(component["driverPool"].length).toBe(1);
    expect(component["driverPool"][0].objectId).toBe("rp1");
  });

  it("should show team participants in RACING pool even if they are assigned to a heat", () => {
    const team = new Team("t1", "The Girls", undefined, ["d1", "d2"]);
    const participant = new RaceParticipant(
      "rp-team",
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
      team,
    );
    const heat = new Heat("h1", 1, [
      new DriverHeatData("dhd-team", participant, 0),
    ]);

    const track = createMockTrack();
    fixture.componentRef.setInput("race", createMockRace(track));
    fixture.componentRef.setInput("track", track);
    fixture.componentRef.setInput("participants", [participant]);
    fixture.componentRef.setInput("heats", [heat]);

    fixture.detectChanges();

    expect(component["driverPool"].length).toBe(1);
    expect(component["driverPool"][0].team?.name).toBe("The Girls");
  });

  it("should exclude empty lane placeholders from the RACING pool", () => {
    const placeholder = new RaceParticipant(
      "rp-empty",
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

    const track = createMockTrack();
    fixture.componentRef.setInput("race", createMockRace(track));
    fixture.componentRef.setInput("track", track);
    fixture.componentRef.setInput("participants", [placeholder]);
    fixture.componentRef.setInput("heats", []);

    fixture.detectChanges();

    expect(component["driverPool"].length).toBe(0);
  });

  describe("database participant filtering", () => {
    let d1: Driver, d2: Driver, t1: Team, t2: Team;

    beforeEach(() => {
      d1 = new Driver("d1", "Driver 1", "D1");
      d2 = new Driver("d2", "Driver 2", "D2");
      t1 = new Team("t1", "Team 1", undefined, ["d1"]);
      t2 = new Team("t2", "Team 2", undefined, ["d2"]);

      component["allDrivers"] = [d1, d2];
      component["allTeams"] = [t1, t2];
    });

    it("should filter out drivers already in the race", () => {
      const p1 = new RaceParticipant("rp1", d1, 0, 0, 0, 0, 0, 0, 0, 0, 100);
      component["localParticipants"] = [p1];

      component["updateDatabaseParticipants"]();

      expect(component["databaseDrivers"]).not.toContain(d1);
      expect(component["databaseDrivers"]).toContain(d2);
    });

    it("should filter out teams already in the race", () => {
      const p1 = new RaceParticipant(
        "rp-t1",
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
        t1,
      );
      component["localParticipants"] = [p1];

      component["updateDatabaseParticipants"]();

      expect(component["databaseTeams"]).not.toContain(t1);
      expect(component["databaseTeams"]).toContain(t2);
    });

    it("should filter out drivers who are in teams already in the race", () => {
      // t1 contains d1
      const p1 = new RaceParticipant(
        "rp-t1",
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
        t1,
      );
      component["localParticipants"] = [p1];

      component["updateDatabaseParticipants"]();

      expect(component["databaseDrivers"]).not.toContain(d1);
    });

    it("should filter out teams that contain drivers already in the race", () => {
      // t1 contains d1
      const p1 = new RaceParticipant("rp1", d1, 0, 0, 0, 0, 0, 0, 0, 0, 100);
      component["localParticipants"] = [p1];

      component["updateDatabaseParticipants"]();

      expect(component["databaseTeams"]).not.toContain(t1);
    });
  });

  describe("heat locking logic", () => {
    it("should consider heat started if heat.started is true", () => {
      const heat = new Heat("h1", 1, [], [], true);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should consider heat started if heat number is less than current heat number", () => {
      fixture.componentRef.setInput("currentHeatNumber", 2);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should consider heat started if race state is RACE_OVER", () => {
      fixture.componentRef.setInput("raceState", RaceState.RACE_OVER);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should consider current heat started if race is in active state", () => {
      fixture.componentRef.setInput("currentHeatNumber", 1);
      fixture.componentRef.setInput("raceState", RaceState.RACING);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should NOT consider current heat started if race is NOT_STARTED", () => {
      fixture.componentRef.setInput("currentHeatNumber", 1);
      fixture.componentRef.setInput("raceState", RaceState.NOT_STARTED);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeFalse();
    });
  });

  describe("actions", () => {
    it("should add a new heat when onAddHeat is called", () => {
      const initialHeatsCount = component["localHeats"].length;
      component["onAddHeat"]();
      expect(component["localHeats"].length).toBe(initialHeatsCount + 1);
      expect(component["localHeats"][initialHeatsCount].heatNumber).toBe(
        initialHeatsCount + 1,
      );
    });

    it("should remove a heat when onRemoveHeat is called on an unstarted heat", () => {
      const heat1 = new Heat("h1", 1, [], [], false);
      const heat2 = new Heat("h2", 2, [], [], false);
      component["localHeats"] = [heat1, heat2];

      component["onRemoveHeat"](0);

      expect(component["localHeats"].length).toBe(1);
      expect(component["localHeats"][0].objectId).toBe("h2");
      expect(component["localHeats"][0].heatNumber).toBe(1); // Renumbered
    });

    it("should NOT remove a heat if it is started", () => {
      const heat1 = new Heat("h1", 1, [], [], true);
      component["localHeats"] = [heat1];

      component["onRemoveHeat"](0);

      expect(component["localHeats"].length).toBe(1);
    });
  });

  describe("validation", () => {
    it("should return error if a started heat was modified", () => {
      const p1 = new RaceParticipant(
        "p1",
        new Driver("d1", "D1", "D1"),
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
      const p2 = new RaceParticipant(
        "p2",
        new Driver("d2", "D2", "D2"),
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
      const originalHeat = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        true,
      );

      fixture.componentRef.setInput("heats", [originalHeat]);
      component["localHeats"] = [
        new Heat("h1", 1, [new DriverHeatData("dhd1", p2, 0)], [], true),
      ];

      const error = component["getValidationError"]();
      expect(error).toBe("RD_ERR_STARTED_HEAT_MODIFIED");
    });

    it("should return error if a participant from a started heat was removed", () => {
      const p1 = new RaceParticipant(
        "p1",
        new Driver("d1", "D1", "D1"),
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
      const originalHeat = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        true,
      );

      fixture.componentRef.setInput("heats", [originalHeat]);
      fixture.componentRef.setInput("participants", [p1]);
      component["localParticipants"] = []; // p1 removed

      const error = component["getValidationError"]();
      expect(error).toBe("RD_ERR_STARTED_PARTICIPANT_REMOVED");
    });

    it("should return null if no validation errors", () => {
      const p1 = new RaceParticipant(
        "p1",
        new Driver("d1", "D1", "D1"),
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
      const originalHeat = new Heat(
        "h1",
        1,
        [new DriverHeatData("dhd1", p1, 0)],
        [],
        false,
      ); // not started

      fixture.componentRef.setInput("heats", [originalHeat]);
      fixture.componentRef.setInput("participants", [p1]);
      component["localHeats"] = [new Heat("h1", 1, [], [], false)]; // modified but unstarted
      component["localParticipants"] = [p1];

      const error = component["getValidationError"]();
      expect(error).toBeNull();
    });
  });

  describe("group validation", () => {
    it("should prevent dropping a driver into a heat with a different group assignment", () => {
      const p1 = new RaceParticipant(
        "p1",
        new Driver("d1", "D1", "D1"),
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
      const heat1 = new Heat("h1", 1, [new DriverHeatData("dhd1", p1, 0)]);
      heat1.group = 0; // Group 1
      const heat2 = new Heat("h2", 2, []);
      heat2.group = 1; // Group 2

      const track = createMockTrack();
      const race = createMockRace(track);
      race.group_options.enabled = true;

      fixture.componentRef.setInput("race", race);
      fixture.componentRef.setInput("heats", [heat1, heat2]);
      fixture.componentRef.setInput("participants", [p1]);
      fixture.detectChanges();

      // Mock event for dropping p1 into heat 2 lane 0
      const event: any = {
        container: { id: "heat-1-lane-0" }, // toHIdx = 1, toLIdx = 0
        previousContainer: { id: "driver-pool" },
        item: { data: p1 },
      };

      component["onDrop"](event);

      expect(component["showAckModal"]).toBeTrue();
      expect(component["ackModalMessage"]).toBe(
        "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS",
      );
    });
  });

  describe("Group modifications and Undo/Redo", () => {
    let p1: RaceParticipant;
    let heat1: Heat, heat2: Heat;

    beforeEach(async () => {
      p1 = new RaceParticipant(
        "p1",
        new Driver("d1", "D1", "D1"),
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
      heat1 = new Heat("h1", 1, [new DriverHeatData("dhd1", p1, 0)]);
      heat1.group = 0; // Group 1
      heat2 = new Heat("h2", 2, []);
      heat2.group = 0; // Group 1

      const track = createMockTrack();
      const race = {
        entity_id: "race-1",
        name: "Test Race",
        track: track,
        group_options: { enabled: true },
        clone: function () {
          return { ...this };
        },
      };

      fixture.componentRef.setInput("race", race as any);
      fixture.componentRef.setInput("track", track);
      fixture.componentRef.setInput("heats", [heat1, heat2]);

      component["undoManager"].initialize({
        heats: [heat1, heat2],
        participants: [p1],
      });
      fixture.detectChanges();

      // Force enabled state on the signal's value to be absolutely sure
      if (component.race()) {
        (component.race() as any).group_options = { enabled: true };
      }
    });

    it("should allow valid sequential group change", () => {
      component["onGroupChange"](heat2, 2);
      expect(heat2.group).toBe(1);
      expect(component["errorMessage"]()).toBeUndefined();
    });

    it("should prevent non-sequential group change", fakeAsync(() => {
      const targetHeat = component["localHeats"][1];
      fixture.detectChanges();
      tick();
      component["onGroupChange"](targetHeat, 3); // Group 1 exists, Group 3 is too far
      fixture.detectChanges();
      tick();

      expect(targetHeat.group).toBe(2);
      expect(component["errorMessage"]()).toBe("RD_ERR_GROUP_NON_SEQUENTIAL");
    }));

    it("should prevent group change that causes participant to be in multiple groups", fakeAsync(() => {
      const targetHeat = component["localHeats"][1];
      targetHeat.heatDrivers = [new DriverHeatData("dhd2", p1, 0)];
      fixture.detectChanges();
      tick();

      component["onGroupChange"](targetHeat, 2);
      fixture.detectChanges();
      tick();

      expect(targetHeat.group).toBe(1);
      expect(component["errorMessage"]()).toBe(
        "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS",
      );
    }));

    it("should prevent group change to less than 1", fakeAsync(() => {
      const targetHeat = component["localHeats"][1];
      fixture.detectChanges();
      tick();
      component["onGroupChange"](targetHeat, 0);
      fixture.detectChanges();
      tick();

      expect(targetHeat.group).toBe(-1);
      expect(component["errorMessage"]()).toBe("RD_ERR_GROUP_MIN_VALUE");
    }));

    it("should undo group change correctly", () => {
      component["onGroupChange"](component["localHeats"][1], 2);
      expect(component["localHeats"][1].group).toBe(1);

      component["undoManager"].undo();
      expect(component["localHeats"][1].group).toBe(0);
    });

    it("should redo group change correctly", () => {
      component["onGroupChange"](component["localHeats"][1], 2);
      component["undoManager"].undo();
      component["undoManager"].redo();
      expect(component["localHeats"][1].group).toBe(1);
    });

    it("should revert state on server save failure", () => {
      mockDataService.modifyHeats.and.returnValue(of({ success: false }));

      component["onGroupChange"](component["localHeats"][1], 2);
      // Server failure should trigger undo
      expect(component["localHeats"][1].group).toBe(0);
    });
  });

  describe("validateGroupSequence", () => {
    it("should be valid for empty heats", () => {
      const result = component["validateGroupSequence"]([]);
      expect(result.isValid).toBeTrue();
    });

    it("should be valid for single group", () => {
      const heat1 = new Heat("h1", 1, []);
      heat1.group = 0;
      const result = component["validateGroupSequence"]([heat1]);
      expect(result.isValid).toBeTrue();
    });

    it("should be invalid if starting from non-zero", () => {
      const heat1 = new Heat("h1", 1, []);
      heat1.group = 1;
      const result = component["validateGroupSequence"]([heat1]);
      expect(result.isValid).toBeFalse();
      expect(result.expected).toBe(1);
      expect(result.found).toBe(2);
    });

    it("should be invalid if there is a gap", () => {
      const h1 = new Heat("h1", 1, []);
      h1.group = 0;
      const h2 = new Heat("h2", 2, []);
      h2.group = 2;
      const result = component["validateGroupSequence"]([h1, h2]);
      expect(result.isValid).toBeFalse();
      expect(result.expected).toBe(2);
      expect(result.found).toBe(3);
    });
  });
});
