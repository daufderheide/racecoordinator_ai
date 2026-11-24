import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Car } from "@app/models/car";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import {
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import {
  RacedaySlotcarsDialogComponent,
  SlotcarSwap,
} from "./raceday-slotcars-dialog.component";

describe("RacedaySlotcarsDialogComponent (#1210)", () => {
  let fixture: ComponentFixture<RacedaySlotcarsDialogComponent>;
  let component: RacedaySlotcarsDialogComponent;
  let swaps: SlotcarSwap[];

  const audi = new Car("c1", "Audi R8");
  const ann = new Driver("d1", "Ann", "A");
  const bob = new Driver("d2", "Bob", "B");
  const participant = (id: string, d: Driver, team?: Team) =>
    new RaceParticipant(id, d, 0, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0, team);

  function heat(): Heat {
    const hd0 = new DriverHeatData("h0", participant("p1", ann) as any, 0);
    hd0.car = audi;
    const team = new Team("t1", "Ferrari", undefined, ["d1", "d2"]);
    const hd1 = new DriverHeatData(
      "h1",
      participant("p2", new Driver("t_t1", "Ferrari"), team) as any,
      1,
      bob,
    );
    return new Heat("heat-1", 3, [hd0, hd1]);
  }

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    await TestBed.configureTestingModule({
      imports: [RacedaySlotcarsDialogComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RacedaySlotcarsDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("cars", [audi, new Car("c2", "Ford GT40")]);
    fixture.componentRef.setInput("heat", heat());
    fixture.componentRef.setInput("visible", true);
    swaps = [];
    component.swap.subscribe((s) => swaps.push(s));
    fixture.detectChanges();
  });

  afterEach(() => resetMocks());

  it("lists each lane of the heat with its racer and car", () => {
    const rows = component.rows();
    expect(rows.map((r) => r.name)).toEqual(["Ann", "Ferrari (Bob)"]);
    expect(rows.map((r) => r.carId)).toEqual(["c1", ""]);
    expect(
      fixture.nativeElement.querySelector("#slotcars-lane-1"),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector("app-preview-badge"),
    ).not.toBeNull();
  });

  it("swaps a car straight away", () => {
    component.onSwap(component.rows()[1], "c2");
    component.onSwap(component.rows()[0], "");
    expect(swaps).toEqual([
      { lane: 1, carId: "c2" },
      { lane: 0, carId: "" },
    ]);
  });

  it("ignores picking the car the racer already has", () => {
    component.onSwap(component.rows()[0], "c1");
    expect(swaps).toEqual([]);
  });

  it("locks the lists while a heat is live", () => {
    fixture.componentRef.setInput("locked", true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("#slotcars-locked"),
    ).not.toBeNull();
    component.onSwap(component.rows()[1], "c2");
    expect(swaps).toEqual([]);
  });

  it("says so when the heat has no racers", () => {
    fixture.componentRef.setInput("heat", new Heat("h", 1, []));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("#slotcars-empty"),
    ).not.toBeNull();
  });

  describe("cars stay in their lanes (IROC)", () => {
    const ford = new Car("c2", "Ford GT40");

    function irocHeat(): Heat {
      const hd0 = new DriverHeatData("h0", participant("p1", ann) as any, 0);
      hd0.car = audi; // the copy of a heat that has run
      const empty = new DriverHeatData(
        "h1",
        participant("e1", new Driver("EMPTY_LANE", "")) as any,
        1,
      );
      return new Heat("heat-2", 3, [hd0, empty]);
    }

    beforeEach(() => {
      fixture.componentRef.setInput("heat", irocHeat());
      fixture.componentRef.setInput("lanesMode", true);
      fixture.componentRef.setInput("laneCars", [ford, undefined]);
      fixture.detectChanges();
    });

    it("lists every lane, empty ones too, with the lane's car right now", () => {
      const rows = component.rows();
      expect(rows.map((r) => r.lane)).toEqual([0, 1]);
      expect(rows.map((r) => r.name)).toEqual(["Ann", ""]);
      expect(rows.map((r) => r.carId)).toEqual(["c2", ""]);
    });

    it("explains the lanes and names an empty lane", () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector("#slotcars-intro-lanes")).not.toBeNull();
      const name = host.querySelector("#slotcars-lane-1 .rsd-name")!;
      expect(name.classList).toContain("rsd-empty");
      expect(name.textContent).toContain("RSD_EMPTY_LANE");
    });

    it("swaps the car of an empty lane", () => {
      component.onSwap(component.rows()[1], "c1");
      expect(swaps).toEqual([{ lane: 1, carId: "c1" }]);
    });

    it("leaves empty lanes out when the racers keep their own cars", () => {
      fixture.componentRef.setInput("lanesMode", false);
      fixture.detectChanges();
      expect(component.rows().map((r) => r.lane)).toEqual([0]);
      expect(component.rows()[0].carId).toBe("c1");
    });
  });

  it("uses a dark lane number on a light lane color", () => {
    const chipText = (component as any).chipText as (c?: string) => string;
    expect(chipText("#ffffff")).toBe("#0f172a");
    expect(chipText("#ef4444")).toBe("#ffffff");
  });
});
