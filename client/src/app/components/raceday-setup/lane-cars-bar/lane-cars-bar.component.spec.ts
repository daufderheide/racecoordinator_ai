import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Car } from "@app/models/car";
import { TranslationService } from "@app/services/translation.service";
import {
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { LaneCarsBarComponent } from "./lane-cars-bar.component";

describe("LaneCarsBarComponent (IROC, #1210)", () => {
  let fixture: ComponentFixture<LaneCarsBarComponent>;
  let component: LaneCarsBarComponent;
  let saved: string[][];

  const el = (sel: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(sel);

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    await TestBed.configureTestingModule({
      imports: [LaneCarsBarComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LaneCarsBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("lanes", [
      { lane: 0, color: "#ef4444" },
      { lane: 1, color: "" },
    ]);
    fixture.componentRef.setInput("cars", [
      new Car("c1", "Audi R8"),
      new Car("c2", "Ford GT40"),
    ]);
    fixture.componentRef.setInput("laneCarIds", ["c1", ""]);
    saved = [];
    component.save.subscribe((ids) => saved.push(ids));
    fixture.detectChanges();
  });

  afterEach(() => resetMocks());

  it("shows each lane with its car", () => {
    expect(el("#lane-car-0 .lane-car-chip")?.textContent?.trim()).toBe("1");
    expect(el("#lane-car-0 .lane-car-name")?.textContent).toContain("Audi R8");
    expect(
      (el("#lane-car-0 .lane-car-chip") as HTMLElement).style.backgroundColor,
    ).toBe("rgb(239, 68, 68)");
  });

  it("marks a lane without a car", () => {
    const name = el("#lane-car-1 .lane-car-name") as HTMLElement;
    expect(name.classList).toContain("empty");
    expect(name.textContent).toContain("RDS_LANE_CARS_NONE");
  });

  it("opens the lane cars dialog on click and closes it again", () => {
    expect(el("#lane-cars-dialog")).toBeNull();
    el("#lane-cars-bar")?.click();
    fixture.detectChanges();
    expect(el("#lane-cars-dialog")).not.toBeNull();
    el("#lane-cars-cancel")?.click();
    fixture.detectChanges();
    expect(el("#lane-cars-dialog")).toBeNull();
    expect(saved.length).toBe(0);
  });

  it("hands the saved picks to the host and closes", () => {
    el("#lane-cars-bar")?.click();
    fixture.detectChanges();
    el("#lane-cars-save")?.click();
    fixture.detectChanges();
    expect(saved).toEqual([["c1", ""]]);
    expect(component.dialogOpen()).toBeFalse();
  });

  it("uses a dark lane number on a light lane color", () => {
    const chipText = (component as any).chipText as (c?: string) => string;
    expect(chipText("#ffffff")).toBe("#0f172a");
    expect(chipText("#ef4444")).toBe("#ffffff");
  });
});
