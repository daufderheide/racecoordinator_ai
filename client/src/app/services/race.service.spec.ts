import { TestBed } from "@angular/core/testing";
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
});
