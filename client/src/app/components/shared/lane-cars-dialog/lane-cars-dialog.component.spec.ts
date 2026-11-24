import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Car } from "@app/models/car";
import { TranslationService } from "@app/services/translation.service";
import {
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { LaneCarsDialogComponent } from "./lane-cars-dialog.component";

describe("LaneCarsDialogComponent (IROC, #1210)", () => {
  let fixture: ComponentFixture<LaneCarsDialogComponent>;
  let component: LaneCarsDialogComponent;
  let saved: string[][];
  let closed: number;

  const cars = [new Car("c2", "Ford GT40"), new Car("c1", "audi R8")];
  const lanes = [
    { lane: 0, color: "#ef4444" },
    { lane: 1, color: "" },
    { lane: 2, color: "#3b82f6" },
  ];

  function open(laneCarIds: string[] = []) {
    fixture.componentRef.setInput("laneCarIds", laneCarIds);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  }

  const el = (sel: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(sel);

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) =>
        params?.lane ? `${key}:${params.lane}` : key,
    );
    await TestBed.configureTestingModule({
      imports: [LaneCarsDialogComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LaneCarsDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("cars", cars);
    fixture.componentRef.setInput("lanes", lanes);
    saved = [];
    closed = 0;
    component.save.subscribe((ids) => saved.push(ids));
    component.close.subscribe(() => closed++);
  });

  afterEach(() => resetMocks());

  it("is hidden until opened", () => {
    fixture.detectChanges();
    expect(el("#lane-cars-dialog")).toBeNull();
  });

  it("shows one row per lane with its number, colour and name", () => {
    open();
    expect(el("#lane-cars-lane-0")).not.toBeNull();
    expect(el("#lane-cars-lane-2")).not.toBeNull();
    const chip = el("#lane-cars-lane-0 .lcd-lane") as HTMLElement;
    expect(chip.textContent?.trim()).toBe("1");
    expect(chip.style.backgroundColor).toBe("rgb(239, 68, 68)");
    expect(
      (el("#lane-cars-lane-1 .lcd-lane") as HTMLElement).style.backgroundColor,
    ).toBe("");
    expect(el("#lane-cars-lane-2 .lcd-name")?.textContent).toContain(
      "LCD_LANE:3",
    );
  });

  it("sorts the cars by name", () => {
    expect(component.sortedCars().map((c) => c.name)).toEqual([
      "audi R8",
      "Ford GT40",
    ]);
  });

  it("starts from the picks it is given, one per lane", () => {
    open(["c1", "", "c2", "extra"]);
    expect(component.draft).toEqual(["c1", "", "c2"]);
    expect(component.carFor(1)).toBe("");
  });

  it("saves the edited picks", () => {
    open(["c1"]);
    component.setCar(1, "c2");
    component.setCar(0, "");
    el("#lane-cars-save")?.click();
    expect(saved).toEqual([["", "c2", ""]]);
  });

  it("forgets unsaved edits when opened again", () => {
    open(["c1"]);
    component.setCar(0, "c2");
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    open(["c1"]);
    expect(component.draft[0]).toBe("c1");
  });

  it("closes on cancel, the close button and the backdrop", () => {
    open();
    el("#lane-cars-cancel")?.click();
    el("#lane-cars-close")?.click();
    el("#lane-cars-backdrop")?.click();
    expect(closed).toBe(3);
    expect(saved.length).toBe(0);
  });

  it("does not close when clicking inside the dialog", () => {
    open();
    el("#lane-cars-dialog")?.click();
    expect(closed).toBe(0);
  });

  it("says when there are no cars", () => {
    fixture.componentRef.setInput("cars", []);
    open();
    expect(el("#lane-cars-empty")).not.toBeNull();
  });

  it("labels a car with its class and scale", () => {
    expect(component.label(new Car("c3", "Porsche", { carClass: "GT3" }))).toBe(
      "Porsche (GT3)",
    );
  });

  it("uses a dark lane number on a light lane color", () => {
    const chipText = (component as any).chipText as (c?: string) => string;
    expect(chipText("#ffffff")).toBe("#0f172a");
    expect(chipText("#ef4444")).toBe("#ffffff");
  });
});
