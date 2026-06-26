import { ComponentRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";

import { RacedayHeatDriversComponent } from "./raceday-heat-drivers.component";

describe("RacedayHeatDriversComponent", () => {
  let component: RacedayHeatDriversComponent;
  let componentRef: ComponentRef<RacedayHeatDriversComponent>;
  let fixture: ComponentFixture<RacedayHeatDriversComponent>;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };

    await TestBed.configureTestingModule({
      imports: [RacedayHeatDriversComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    const mockParent = {
      isEmptyDriver: (hd: any) => hd?.driver?.isEmpty?.() ?? false,
      isTeam: (_hd: any) => false,
    };

    fixture = TestBed.createComponent(RacedayHeatDriversComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput("parent", mockParent as any);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate correct number of drivers for next heat", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          { driver: { name: "A", isEmpty: () => false } },
          { driver: { name: "B", isEmpty: () => false } },
          { driver: { isEmpty: () => true } },
        ],
      },
    ]);
    fixture.detectChanges();
    expect(component.drivers().length).toBe(3); // Should not filter empty for next heat
  });

  it("should calculate correct number of drivers for on-deck", () => {
    componentRef.setInput("type", "on-deck");
    componentRef.setInput("currentHeat", {
      heatNumber: 1,
      heatDrivers: [
        { driver: { entity_id: "d1", name: "A", isEmpty: () => false } },
      ],
    });
    componentRef.setInput("heats", [
      {
        heatNumber: 1,
        heatDrivers: [
          { driver: { entity_id: "d1", name: "A", isEmpty: () => false } },
        ],
      },
      {
        heatNumber: 2,
        heatDrivers: [
          { driver: { entity_id: "d1", name: "A", isEmpty: () => false } },
          { driver: { entity_id: "d2", name: "B", isEmpty: () => false } },
          { driver: { isEmpty: () => true } },
        ],
      },
    ]);
    fixture.detectChanges();

    // For on-deck, it filters out empty and current drivers
    const drivers = component.drivers();
    expect(drivers.length).toBe(1);
    expect(drivers[0].driver.entity_id).toBe("d2");
  });

  it("should apply custom font sizes when in fixed scale mode", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [{ driver: { name: "A", isEmpty: () => false } }],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "fixed",
      customSettings: {
        titleFontSize: 30,
        laneFontSize: 25,
      },
    });
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector(".next-heat-title");
    expect(titleEl).toBeTruthy();
    expect(titleEl.style.fontSize).toBe("30px");

    const itemEl = fixture.nativeElement.querySelector(".next-heat-item");
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.fontSize).toBe("25px");
  });

  it("should NOT apply custom font sizes when in auto scale mode", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [{ driver: { name: "A", isEmpty: () => false } }],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "auto",
      customSettings: {
        titleFontSize: 30,
        laneFontSize: 25,
      },
    });
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector(".next-heat-title");
    expect(titleEl).toBeTruthy();
    expect(titleEl.style.fontSize).toBeFalsy();

    const itemEl = fixture.nativeElement.querySelector(".next-heat-item");
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.fontSize).toBeFalsy();
  });
});
