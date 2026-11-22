import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Car } from "@app/models/car";
import { CarChoice } from "@app/models/car-choice";
import { TranslationService } from "@app/services/translation.service";
import {
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { carLabel, CarPickDialogComponent } from "./car-pick-dialog.component";

describe("CarPickDialogComponent (#1210)", () => {
  let fixture: ComponentFixture<CarPickDialogComponent>;
  let component: CarPickDialogComponent;
  let saved: CarChoice[];
  let closed: number;

  const cars = [
    new Car("c2", "Ford GT40"),
    new Car("c1", "audi R8", { carClass: "GT3", scale: "1/32" }),
  ];

  function open(inputs: Record<string, unknown>) {
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  }

  const el = (sel: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(sel);

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    await TestBed.configureTestingModule({
      imports: [CarPickDialogComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CarPickDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("cars", cars);
    saved = [];
    closed = 0;
    component.save.subscribe((c) => saved.push(c));
    component.close.subscribe(() => closed++);
  });

  afterEach(() => resetMocks());

  it("is hidden until opened", () => {
    fixture.detectChanges();
    expect(el("#car-pick-dialog")).toBeNull();
  });

  it("shows the entry, sorted cars and the preview badge", () => {
    open({ entryName: "Alice" });
    expect(el("#car-pick-entry")?.textContent).toContain("Alice");
    expect(el("app-preview-badge")).not.toBeNull();
    expect(component.sortedCars().map((c) => c.name)).toEqual([
      "audi R8",
      "Ford GT40",
    ]);
    expect(el("#car-pick-team-shared")).toBeNull();
  });

  it("labels a car with its class and scale", () => {
    expect(carLabel(cars[1])).toBe("audi R8 (GT3 · 1/32)");
    expect(carLabel(cars[0])).toBe("Ford GT40");
  });

  it("saves one car for a driver", () => {
    open({ choice: { carId: "c2", carPerDriver: false, driverCars: {} } });
    expect(component.draft.carId).toBe("c2");
    component.setCar("c1");
    (el("#car-pick-save") as HTMLButtonElement).click();
    expect(saved).toEqual([
      { carId: "c1", carPerDriver: false, driverCars: {} },
    ]);
  });

  it("keeps the pick when the host hands in a new choice object", () => {
    open({ choice: { carId: "", carPerDriver: false, driverCars: {} } });
    component.setCar("c1");
    fixture.componentRef.setInput("choice", {
      carId: "",
      carPerDriver: false,
      driverCars: {},
    });
    fixture.detectChanges();
    component.onSave();
    expect(saved[0].carId).toBe("c1");
  });

  it("starts from the host's choice again when reopened", () => {
    open({ choice: { carId: "c2", carPerDriver: false, driverCars: {} } });
    component.setCar("c1");
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    open({});
    expect(component.draft.carId).toBe("c2");
  });

  it("lets a team pick a car per driver", () => {
    open({
      entryName: "Ferrari",
      teamDrivers: [
        { id: "d1", name: "Ann" },
        { id: "d2", name: "Bob" },
      ],
    });
    (el("#car-pick-team-per-driver") as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el("#car-pick-driver-d1")).not.toBeNull();
    component.setDriverCar("d1", "c1");
    component.setDriverCar("d2", "c2");
    component.setDriverCar("d2", "");
    component.onSave();
    expect(saved[0]).toEqual({
      carId: "",
      carPerDriver: true,
      driverCars: { d1: "c1" },
    });
  });

  it("never offers per driver in the single swap", () => {
    open({
      mode: "single",
      teamDrivers: [{ id: "d1", name: "Ann" }],
      choice: { carId: "", carPerDriver: true, driverCars: { d1: "c1" } },
    });
    expect(el("#car-pick-team-shared")).toBeNull();
    expect(component.draft.carPerDriver).toBeFalse();
  });

  it("does not change the input while editing, and cancels", () => {
    const choice: CarChoice = {
      carId: "c1",
      carPerDriver: false,
      driverCars: {},
    };
    open({ choice });
    component.setCar("c2");
    expect(choice.carId).toBe("c1");
    (el("#car-pick-cancel") as HTMLButtonElement).click();
    expect(closed).toBe(1);
    expect(saved).toEqual([]);
  });

  it("explains when there are no cars yet", () => {
    fixture.componentRef.setInput("cars", []);
    open({});
    expect(el("#car-pick-empty")?.textContent).toContain("CPD_EMPTY");
  });
});
