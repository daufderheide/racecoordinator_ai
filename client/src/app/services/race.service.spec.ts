import { TestBed } from "@angular/core/testing";
import { Car } from "@app/models/car";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Track } from "@app/models/track";
import { Heat } from "@app/race/heat";

import { RaceService } from "./race.service";

describe("RaceService", () => {
  let service: RaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaceService],
    });
    service = TestBed.inject(RaceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should set and get racing drivers", () => {
    const drivers = [new Driver("d1", "Driver 1", "D1")];
    service.setRacingDrivers(drivers);
    expect(service.getRacingDrivers()).toEqual(drivers);
  });

  it("should set participants and update racing drivers", () => {
    const driver1 = new Driver("d1", "Driver 1", "D1");
    const driver2 = new Driver("d2", "Driver 2", "D2");
    const rp1 = new RaceParticipant(
      "rp1",
      driver1,
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
    const rp2 = new RaceParticipant(
      "rp2",
      driver2,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
    );

    service.setParticipants([rp1, rp2]);
    expect(service.getParticipants()).toEqual([rp1, rp2]);
    expect(service.getRacingDrivers()).toEqual([driver1, driver2]);
  });

  it("should set group participants and current group", () => {
    const driver = new Driver("d1", "Driver 1", "D1");
    const rp = new RaceParticipant("rp1", driver, 1, 0, 0, 0, 0, 0, 0, 0, 100);

    let receivedGroup: number | undefined;
    const sub = service.currentGroup$.subscribe((g) => {
      receivedGroup = g;
    });

    service.setGroupParticipants([rp], 2);
    expect(receivedGroup).toBe(2);
    sub.unsubscribe();
  });

  it("should set and get selected race", () => {
    const mockTrack = new Track({
      entity_id: "t1",
      name: "Test Track",
      lanes: [],
    });
    const mockRace = new Race("race-1", "Test Race", mockTrack);
    service.setRace(mockRace);
    expect(service.getRace()).toBe(mockRace);
  });

  it("should set and get heats", () => {
    const mockHeat = new Heat("heat-1", 1, [], [], false);
    service.setHeats([mockHeat]);
    expect(service.getHeats()).toEqual([mockHeat]);
  });

  it("should update matching heat in the heats list when setCurrentHeat is called", () => {
    const mockHeat1 = new Heat("heat-1", 1, [], [], true);
    const mockHeat2 = new Heat("heat-2", 2, [], [], false);

    // Set initial heats
    service.setHeats([mockHeat1, mockHeat2]);

    // Create updated heat status (e.g. mockHeat1 is restarted/reset)
    const updatedHeat1 = new Heat("heat-1", 1, [], [], false);
    updatedHeat1.group = 3;

    let receivedHeats: Heat[] | undefined;
    const sub = service.heats$.subscribe((h) => {
      receivedHeats = h;
    });

    service.setCurrentHeat(updatedHeat1);

    expect(service.getCurrentHeat()).toBe(updatedHeat1);
    expect(receivedHeats).toBeTruthy();
    expect(receivedHeats![0].objectId).toBe("heat-1");
    expect(receivedHeats![0].started).toBe(false);
    expect(receivedHeats![0].group).toBe(3);

    sub.unsubscribe();
  });

  it("should handle setCurrentHeat when heats list is empty or heat does not match", () => {
    service.setHeats([]);
    const heat1 = new Heat("heat-1", 1, [], [], false);
    service.setCurrentHeat(heat1);
    expect(service.getCurrentHeat()).toBe(heat1);

    // With heats list that does not contain this heat
    const heat2 = new Heat("heat-2", 2, [], [], false);
    service.setHeats([heat2]);
    service.setCurrentHeat(heat1);
    expect(service.getCurrentHeat()).toBe(heat1);
  });

  it("should clear all state when clear is called", () => {
    const mockHeat = new Heat("heat-1", 1, [], [], false);
    service.setHeats([mockHeat]);
    service.clear();
    expect(service.getHeats()).toEqual([]);
    expect(service.getCurrentHeat()).toBeUndefined();
    expect(service.getParticipants()).toEqual([]);
    expect(service.getRace()).toBeUndefined();
    expect(service.getRacingDrivers()).toEqual([]);
  });

  it("keeps the car on each lane (IROC, #1210)", () => {
    expect(service.getLaneCars()).toEqual([]);
    const seen: unknown[] = [];
    service.laneCars$.subscribe((c) => seen.push(c));
    const lanes = [undefined, new Car("c1", "Audi R8")];
    service.setLaneCars(lanes);
    expect(service.getLaneCars()).toBe(lanes);
    expect(seen).toEqual([[], lanes]);
  });

  describe("Lane Selection Tracking", () => {
    it("should track race start lane selection", () => {
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeFalse();
      service.recordLaneSelectionOpened("RACE_START");
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeTrue();
      service.resetLaneSelectionTracking();
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeFalse();
    });

    it("should track heat start lane selection by heat number", () => {
      expect(service.hasOpenedLaneSelection("HEAT_START", 1)).toBeFalse();
      service.recordLaneSelectionOpened("HEAT_START", 1);
      expect(service.hasOpenedLaneSelection("HEAT_START", 1)).toBeTrue();
      expect(service.hasOpenedLaneSelection("HEAT_START", 2)).toBeFalse();
    });

    it("should track step start lane selection by step number", () => {
      expect(service.hasOpenedLaneSelection("STEP_START", 1)).toBeFalse();
      service.recordLaneSelectionOpened("STEP_START", 1);
      expect(service.hasOpenedLaneSelection("STEP_START", 1)).toBeTrue();
      expect(service.hasOpenedLaneSelection("STEP_START", 2)).toBeFalse();

      service.recordLaneSelectionOpened("STEP_START", 2);
      expect(service.hasOpenedLaneSelection("STEP_START", 1)).toBeTrue();
      expect(service.hasOpenedLaneSelection("STEP_START", 2)).toBeTrue();
    });

    it("should reset lane selection tracking when clear is called", () => {
      service.recordLaneSelectionOpened("RACE_START");
      service.recordLaneSelectionOpened("HEAT_START", 3);
      service.clear();
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeFalse();
      expect(service.hasOpenedLaneSelection("HEAT_START", 3)).toBeFalse();
    });

    it("should reset lane selection tracking when a different race is set", () => {
      const track = new Track({
        entity_id: "t1",
        name: "Track",
        num_track_sections: 100,
        lanes: [],
        has_digital_fuel: false,
        arduino_configs: [],
      });
      const race1 = new Race("r1", "Race 1", track);
      const race2 = new Race("r2", "Race 2", track);

      service.setRace(race1);
      service.recordLaneSelectionOpened("RACE_START");
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeTrue();

      // Setting same race should not reset
      service.setRace(race1);
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeTrue();

      // Setting different race should reset
      service.setRace(race2);
      expect(service.hasOpenedLaneSelection("RACE_START")).toBeFalse();
    });
  });
});
