import { of, throwError } from "rxjs";
import { Role } from "@app/models/role";
import { RaceState } from "@app/proto/antigravity";

import { RacedaySlotcarsHelper } from "./raceday-slotcars.helper";

describe("RacedaySlotcarsHelper (#1210)", () => {
  let host: any;

  beforeEach(() => {
    host = {
      raceState: RaceState.NOT_STARTED,
      authService: { currentRole: Role.DIRECTOR },
      dataService: {
        getCars: jasmine
          .createSpy("getCars")
          .and.returnValue(of([{ entity_id: "c1", name: "Audi R8" }])),
        changeCar: jasmine.createSpy("changeCar").and.returnValue(of(true)),
      },
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      logger: { error: jasmine.createSpy("error") },
    };
  });

  it("shows the menu item only when there are cars", () => {
    expect(RacedaySlotcarsHelper.hasSlotcars(host)).toBeFalse();
    RacedaySlotcarsHelper.loadCars(host);
    expect(RacedaySlotcarsHelper.hasSlotcars(host)).toBeTrue();
  });

  it("is open between heats and locked while a heat is live", () => {
    for (const s of [RaceState.NOT_STARTED, RaceState.HEAT_OVER]) {
      host.raceState = s;
      expect(RacedaySlotcarsHelper.isLocked(host)).toBeFalse();
    }
    for (const s of [
      RaceState.STARTING,
      RaceState.RACING,
      RaceState.PAUSED,
      RaceState.RACE_OVER,
    ]) {
      host.raceState = s;
      expect(RacedaySlotcarsHelper.isLocked(host)).toBeTrue();
    }
  });

  it("is locked for a viewer", () => {
    host.authService.currentRole = Role.VIEWER;
    expect(RacedaySlotcarsHelper.isLocked(host)).toBeTrue();
  });

  it("opens with a fresh car list", () => {
    RacedaySlotcarsHelper.open(host);
    expect(host.showSlotcarsDialog).toBeTrue();
    expect(host.dataService.getCars).toHaveBeenCalled();
  });

  it("sends the swap to the server", () => {
    RacedaySlotcarsHelper.swap(host, { lane: 2, carId: "c1" });
    expect(host.dataService.changeCar).toHaveBeenCalledWith(2, "c1");
    expect(host.showAckModal).toBeUndefined();
  });

  it("shows the server's reason when a swap is refused", () => {
    host.dataService.changeCar.and.returnValue(
      throwError(() => ({ error: "RD_ERR_CAR_SWAP_HEAT_STARTED" })),
    );
    RacedaySlotcarsHelper.swap(host, { lane: 0, carId: "c1" });
    expect(host.showAckModal).toBeTrue();
    expect(host.ackModalMessage).toBe("RD_ERR_CAR_SWAP_HEAT_STARTED");
  });

  it("shows a general message for other errors", () => {
    host.dataService.changeCar.and.returnValue(
      throwError(() => ({ error: "boom" })),
    );
    RacedaySlotcarsHelper.swap(host, { lane: 0, carId: "c1" });
    expect(host.ackModalMessage).toBe("RSD_ERR_MESSAGE");
  });

  it("knows when the cars stay in their lanes (IROC)", () => {
    expect(RacedaySlotcarsHelper.carsStayInLanes(host)).toBeFalse();
    host.raceService = { getRace: () => ({ cars_stay_in_lanes: true }) };
    expect(RacedaySlotcarsHelper.carsStayInLanes(host)).toBeTrue();
    host.race = { cars_stay_in_lanes: false };
    expect(RacedaySlotcarsHelper.carsStayInLanes(host)).toBeFalse();
  });

  it("hands out the car on each lane", () => {
    expect(RacedaySlotcarsHelper.laneCars(host)).toEqual([]);
    const lanes = [undefined, { entity_id: "c1" }];
    host.raceService = { getLaneCars: () => lanes };
    expect(RacedaySlotcarsHelper.laneCars(host)).toBe(lanes as any);
  });
});
