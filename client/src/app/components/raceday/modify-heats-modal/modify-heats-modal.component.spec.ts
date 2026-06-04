import { DragDropModule } from "@angular/cdk/drag-drop";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
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
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";

import { ModifyHeatsModalComponent } from "./modify-heats-modal.component";

describe("ModifyHeatsModalComponent", () => {
  let component: ModifyHeatsModalComponent;
  let fixture: ComponentFixture<ModifyHeatsModalComponent>;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockValidationService: any;
  let mockRaceConnectionService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "getTeams",
      "regenerateHeats",
      "modifyHeats",
      "updateRaceSubscription",
      "finalizeModifyHeats",
    ]);
    mockDataService.updateRaceSubscription.and.stub();
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getTeams.and.returnValue(of([]));
    mockDataService.regenerateHeats.and.returnValue(
      of({ success: true, heats: [] }),
    );
    mockDataService.modifyHeats.and.returnValue(of({ success: true }));
    mockDataService.finalizeModifyHeats.and.returnValue(of("OK"));

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockValidationService = jasmine.createSpyObj(
      "ParticipantValidationService",
      ["validate", "getErrorMessage"],
    );

    mockRaceConnectionService = jasmine.createSpyObj("RaceConnectionService", [
      "connect",
      "disconnect",
    ]);
    mockRaceConnectionService.raceState$ = of(RaceState.NOT_STARTED);

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
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifyHeatsModalComponent);
    component = fixture.componentInstance;

    // Provide required inputs to prevent NG0950 errors
    const track = createMockTrack();
    fixture.componentRef.setInput("trackInput", track);
    fixture.componentRef.setInput("raceInput", createMockRace(track, true));
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
    fixture.componentRef.setInput("raceInput", createMockRace(track));
    fixture.componentRef.setInput("trackInput", track);
    fixture.componentRef.setInput("participantsInput", [participant]);
    fixture.componentRef.setInput("heatsInput", [heat]);
    fixture.componentRef.setInput("raceStateInput", RaceState.NOT_STARTED);

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
    fixture.componentRef.setInput("raceInput", createMockRace(track));
    fixture.componentRef.setInput("trackInput", track);
    fixture.componentRef.setInput("participantsInput", [participant]);
    fixture.componentRef.setInput("heatsInput", [heat]);

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
    fixture.componentRef.setInput("raceInput", createMockRace(track));
    fixture.componentRef.setInput("trackInput", track);
    fixture.componentRef.setInput("participantsInput", [placeholder]);
    fixture.componentRef.setInput("heatsInput", []);

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
      fixture.componentRef.setInput("currentHeatNumberInput", 2);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should consider heat started if race state is RACE_OVER", () => {
      fixture.componentRef.setInput("raceStateInput", RaceState.RACE_OVER);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should consider current heat started if race is in active state", () => {
      fixture.componentRef.setInput("currentHeatNumberInput", 1);
      fixture.componentRef.setInput("raceStateInput", RaceState.RACING);
      const heat = new Heat("h1", 1, [], [], false);
      expect(component["isHeatStarted"](heat)).toBeTrue();
    });

    it("should NOT consider current heat started if race is NOT_STARTED", () => {
      fixture.componentRef.setInput("currentHeatNumberInput", 1);
      fixture.componentRef.setInput("raceStateInput", RaceState.NOT_STARTED);
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

    it("should pass all local participants including empty drivers to regenerateHeats", () => {
      const realDriver = new RaceParticipant(
        "rp1",
        new Driver("d1", "Real", "Real"),
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
      const emptyDriver = new RaceParticipant(
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
      component["localParticipants"] = [realDriver, emptyDriver];

      component["onRegenerateHeats"]();

      expect(mockDataService.regenerateHeats).toHaveBeenCalled();
      const calledWith =
        mockDataService.regenerateHeats.calls.mostRecent().args[0];
      // Should have 2 items, we are verifying empty drivers are NOT filtered out
      expect(calledWith.length).toBe(2);
      expect(calledWith[0].driver.name).toBe("Real");
      expect(calledWith[1].driver.name).toBe("Empty");
    });

    it("should remove a participant from a heat lane when onRemoveFromHeat is called", () => {
      const realDriver = new RaceParticipant(
        "rp1",
        new Driver("d1", "Real", "Real"),
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
      component["localParticipants"] = [realDriver];
      component["localHeats"] = [
        new Heat(
          "h1",
          1,
          [new DriverHeatData("dhd1", realDriver, 0)],
          [],
          false,
        ),
      ];

      component["onRemoveFromHeat"](0, 0);

      expect(component["localHeats"][0].heatDrivers.length).toBe(0);
      expect(mockDataService.modifyHeats).toHaveBeenCalled();
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

      fixture.componentRef.setInput("heatsInput", [originalHeat]);
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

      fixture.componentRef.setInput("heatsInput", [originalHeat]);
      fixture.componentRef.setInput("participantsInput", [p1]);
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

      fixture.componentRef.setInput("heatsInput", [originalHeat]);
      fixture.componentRef.setInput("participantsInput", [p1]);
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

      fixture.componentRef.setInput("raceInput", race);
      fixture.componentRef.setInput("heatsInput", [heat1, heat2]);
      fixture.componentRef.setInput("participantsInput", [p1]);
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

      fixture.componentRef.setInput("raceInput", race as any);
      fixture.componentRef.setInput("trackInput", track);
      fixture.componentRef.setInput("heatsInput", [heat1, heat2]);

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

    it("should allow non-sequential group change", fakeAsync(() => {
      const targetHeat = component["localHeats"][1];
      fixture.detectChanges();
      tick();
      component["onGroupChange"](targetHeat, 3); // Group 1 exists, Group 3 is too far
      fixture.detectChanges();
      tick();

      expect(targetHeat.group).toBe(2);
      expect(component["errorMessage"]()).toBeUndefined();
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

    it("should reset tracking on successful save", () => {
      mockDataService.modifyHeats.and.returnValue(of({ success: true }));

      // Trigger a change (like changing a group index)
      component["onGroupChange"](component["localHeats"][1], 2);

      // Verify that after successful autosave, hasChanges() is false
      expect(component["undoManager"].hasChanges()).toBeFalse();
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

    it("should be valid if starting from non-zero", () => {
      const heat1 = new Heat("h1", 1, []);
      heat1.group = 1;
      const result = component["validateGroupSequence"]([heat1]);
      expect(result.isValid).toBeTrue();
    });

    it("should be valid if there is a gap", () => {
      const h1 = new Heat("h1", 1, []);
      h1.group = 0;
      const h2 = new Heat("h2", 2, []);
      h2.group = 2;
      const result = component["validateGroupSequence"]([h1, h2]);
      expect(result.isValid).toBeTrue();
    });
  });

  describe("onLaneCheck", () => {
    it("should perform lane equality checking and populate equalityReport and isHeatsEqual", () => {
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
      const heat1 = new Heat("h1", 1, [
        new DriverHeatData("dhd1", p1, 0),
        new DriverHeatData("dhd2", p2, 1),
      ]);
      const heat2 = new Heat("h2", 2, [
        new DriverHeatData("dhd3", p2, 0),
        new DriverHeatData("dhd4", p1, 1),
      ]);

      const track = createMockTrack();
      fixture.componentRef.setInput("trackInput", track);
      component["localHeats"] = [heat1, heat2];
      component["localParticipants"] = [p1, p2];

      component["onLaneCheck"]();

      expect(component["equalityReport"]).toBeDefined();
      expect(component["isHeatsEqual"]).toBeTrue();
    });

    it("should ignore empty lanes (Driver.isEmpty()) when checking lane equality", () => {
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
      const emptyParticipant = new RaceParticipant(
        "p-empty",
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
      const heat1 = new Heat("h1", 1, [
        new DriverHeatData("dhd1", p1, 0),
        new DriverHeatData("dhd2", emptyParticipant, 1),
      ]);
      const heat2 = new Heat("h2", 2, [
        new DriverHeatData("dhd3", p1, 0),
        new DriverHeatData("dhd4", emptyParticipant, 1),
      ]);

      const track = createMockTrack();
      fixture.componentRef.setInput("trackInput", track);
      component["localHeats"] = [heat1, heat2];
      component["localParticipants"] = [p1, emptyParticipant];

      component["onLaneCheck"]();

      expect(component["isHeatsEqual"]).toBeTrue();
      expect(component["equalityReport"]?.[0]?.key).toBe("AM_REPORT_ALL_EQUAL");
    });

    it("should mark as unequal and add an empty heat warning if a heat is completely empty", () => {
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
      const heat1 = new Heat("h1", 1, []);
      const heat2 = new Heat("h2", 2, [new DriverHeatData("dhd3", p1, 0)]);

      const track = createMockTrack();
      fixture.componentRef.setInput("trackInput", track);
      component["localHeats"] = [heat1, heat2];
      component["localParticipants"] = [p1];

      component["onLaneCheck"]();

      expect(component["isHeatsEqual"]).toBeFalse();
      expect(component["equalityReport"]?.[0]?.key).toBe(
        "AM_REPORT_EMPTY_HEAT",
      );
      expect(component["equalityReport"]?.[0]?.params?.heat).toBe(1);
    });

    it("should update isHeatsEqual but not open diagnostic report overlay when showModal is false", () => {
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
      const heat1 = new Heat("h1", 1, [
        new DriverHeatData("dhd1", p1, 0),
        new DriverHeatData("dhd2", p2, 1),
      ]);
      const heat2 = new Heat("h2", 2, [
        new DriverHeatData("dhd3", p2, 0),
        new DriverHeatData("dhd4", p1, 1),
      ]);

      const track = createMockTrack();
      fixture.componentRef.setInput("trackInput", track);
      component["localHeats"] = [heat1, heat2];
      component["localParticipants"] = [p1, p2];

      component["equalityReport"] = null;

      component["onLaneCheck"](false);

      expect(component["isHeatsEqual"]).toBeTrue();
      expect(component["equalityReport"]).toBeNull();
    });

    it("should call onLaneCheck(false) during component initialization to set isHeatsEqual", () => {
      spyOn(component as any, "onLaneCheck").and.callThrough();

      fixture.detectChanges();

      expect(component["onLaneCheck"]).toHaveBeenCalledWith(false);
      expect(component["isHeatsEqual"]).toBeFalse();
    });

    it("should call onLaneCheck(false) during autoSave to update isHeatsEqual", fakeAsync(() => {
      fixture.detectChanges();

      spyOn(component as any, "onLaneCheck").and.callThrough();

      component["autoSave"]();
      tick();

      expect(component["onLaneCheck"]).toHaveBeenCalledWith(false);
    }));

    it("should bind isHeatsEqual to EditorTitleComponent's isHeatsEqual input", () => {
      fixture.detectChanges();

      const editorTitleEl = fixture.debugElement.query(
        By.directive(EditorTitleComponent),
      );
      expect(editorTitleEl).toBeTruthy();

      component["isHeatsEqual"] = false;
      fixture.detectChanges();
      expect(editorTitleEl.componentInstance.isHeatsEqual()).toBeFalse();

      component["isHeatsEqual"] = true;
      fixture.detectChanges();
      expect(editorTitleEl.componentInstance.isHeatsEqual()).toBeTrue();
    });
  });

  describe("collapsible available drivers sidebar height", () => {
    let container: HTMLDivElement;
    let styleElement: HTMLStyleElement;

    beforeEach(() => {
      // Inject a style to disable transitions/animations completely for instant layout updates
      styleElement = document.createElement("style");
      styleElement.innerHTML = `
        * {
          transition: none !important;
          transition-duration: 0s !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(styleElement);

      container = document.createElement("div");
      container.style.height = "800px";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      document.body.appendChild(container);
      container.appendChild(fixture.nativeElement);
    });

    afterEach(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    });

    it("should give more height to the racing list when available drivers pool is collapsed", () => {
      // Setup elements with styling
      const editorPanel = fixture.nativeElement.querySelector(
        ".editor-panel",
      ) as HTMLElement;
      expect(editorPanel).toBeTruthy();
      editorPanel.style.height = "500px";
      editorPanel.style.display = "flex";
      editorPanel.style.flexDirection = "column";

      // Mock participants and drivers to simulate a real pool layout
      component["databaseParticipants"] = [
        new Driver("d-avail", "Avail Driver", "Avail"),
      ];
      component["driverPool"] = [
        new RaceParticipant(
          "rp-racing",
          new Driver("d-racing", "Racing Driver", "Racing"),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          100,
        ),
      ];

      // Toggle first to ensure starting at expanded state
      component["isAvailableDriversCollapsed"] = false;
      fixture.detectChanges();

      const poolSections = fixture.nativeElement.querySelectorAll(
        ".driver-pool-section",
      );
      expect(poolSections.length).toBe(2);

      const racingSection = poolSections[0] as HTMLElement;
      const availableSection = poolSections[1] as HTMLElement;

      // Get original height of racing drivers pool section when expanded
      const heightExpanded = racingSection.offsetHeight;

      // Collapse available drivers pool
      component["toggleAvailableDrivers"]();
      fixture.detectChanges();

      expect(component["isAvailableDriversCollapsed"]).toBeTrue();
      expect(availableSection.classList.contains("collapsed")).toBeTrue();

      // Get new height of racing drivers pool section when collapsed
      const heightCollapsed = racingSection.offsetHeight;

      // Verification: the racing pool height must be significantly larger when available drivers is collapsed
      expect(heightCollapsed).toBeGreaterThan(heightExpanded);
    });
  });

  describe("seeding order maintenance and preservation", () => {
    it("should sort participants by seed order on retrieval", () => {
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
        3,
        100,
      ); // seed 3
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
        1,
        100,
      ); // seed 1
      const p3 = new RaceParticipant(
        "p3",
        new Driver("d3", "D3", "D3"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        2,
        100,
      ); // seed 2

      fixture.componentRef.setInput("participantsInput", [p1, p2, p3]);
      fixture.detectChanges();

      const sorted = component.participants();
      expect(sorted[0].objectId).toBe("p2");
      expect(sorted[1].objectId).toBe("p3");
      expect(sorted[2].objectId).toBe("p1");
    });

    it("should correctly re-order participants inside the driver pool via onDrop", () => {
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
        1,
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
        2,
        100,
      );
      const p3 = new RaceParticipant(
        "p3",
        new Driver("d3", "D3", "D3"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        3,
        100,
      );

      fixture.componentRef.setInput("participantsInput", [p1, p2, p3]);
      fixture.detectChanges();

      // Trigger a drag and drop re-order (moving p1 to position after p2)
      const event: any = {
        container: { id: "driver-pool", data: [p1, p2, p3] },
        previousContainer: { id: "driver-pool", data: [p1, p2, p3] },
        item: { data: p1 },
        previousIndex: 0,
        currentIndex: 1,
      };

      component["onDrop"](event);

      expect(component["localParticipants"][0].objectId).toBe("p2");
      expect(component["localParticipants"][1].objectId).toBe("p1");
      expect(component["localParticipants"][2].objectId).toBe("p3");
    });

    it("should correctly insert new driver from database at the dropped index", () => {
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
        1,
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
        2,
        100,
      );
      const newDriver = new Driver("d3", "D3", "D3");

      fixture.componentRef.setInput("participantsInput", [p1, p2]);
      component["allDrivers"] = [newDriver];
      fixture.detectChanges();

      mockValidationService.validate.and.returnValue({ isValid: true });

      // Dropping d3 at index 1 (between p1 and p2)
      const event: any = {
        container: { id: "driver-pool", data: [p1, p2] },
        previousContainer: { id: "database-drivers", data: [newDriver] },
        item: { data: newDriver },
        previousIndex: 0,
        currentIndex: 1,
      };

      component["onDrop"](event);

      // Verify new participant is inserted at index 1
      expect(component["localParticipants"][0].objectId).toBe("p1");
      expect(component["localParticipants"][1].driver.name).toBe("D3");
      expect(component["localParticipants"][2].objectId).toBe("p2");
    });
  });

  describe("ngOnDestroy finalization", () => {
    it("should always call finalizeModifyHeats when destroyed", () => {
      // Setup with no started heats
      const heat1 = new Heat("h1", 1, [], [], false);
      const heat2 = new Heat("h2", 2, [], [], false);
      component["localHeats"] = [heat1, heat2];

      fixture.detectChanges();

      // Destroy the component
      fixture.destroy();

      expect(mockDataService.finalizeModifyHeats).toHaveBeenCalled();
    });

    it("should call finalizeModifyHeats even when all heats are started", () => {
      // Setup with all started heats
      const heat1 = new Heat("h1", 1, [], [], true);
      component["localHeats"] = [heat1];
      fixture.componentRef.setInput("raceStateInput", RaceState.HEAT_OVER);

      fixture.detectChanges();

      fixture.destroy();

      expect(mockDataService.finalizeModifyHeats).toHaveBeenCalled();
    });

    it("should call finalizeModifyHeats when some heats started and some not", () => {
      // Setup with mixed started/unstarted heats (the original bug scenario)
      const heat1 = new Heat("h1", 1, [], [], true); // started
      const heat2 = new Heat("h2", 2, [], [], false); // not started
      component["localHeats"] = [heat1, heat2];

      fixture.detectChanges();

      fixture.destroy();

      expect(mockDataService.finalizeModifyHeats).toHaveBeenCalled();
    });
  });
});
