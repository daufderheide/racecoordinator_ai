import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayRaceNameComponent } from "./raceday-race-name.component";
import { RacedayRaceNameHarness } from "./testing/raceday-race-name.harness";

describe("RacedayRaceNameComponent", () => {
  let component: RacedayRaceNameComponent;
  let fixture: ComponentFixture<RacedayRaceNameComponent>;
  let harness: RacedayRaceNameHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayRaceNameComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayRaceNameComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayRaceNameHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty content when inputs are missing", async () => {
    expect(await harness.getLabel()).toBe("");
    expect(await harness.getRaceName()).toBe("");
  });

  it("should display race name and localized label when input is provided", async () => {
    fixture.componentRef.setInput("race", {
      name: "Championship Race",
    } as Race);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_LABEL_RACE");
    expect(await harness.getRaceName()).toBe("Championship Race");
  });

  it("should display race name with x / y when race is running under an event", async () => {
    fixture.componentRef.setInput("race", {
      name: "Heat 1",
      is_event: true,
      event_name: "Summer Championship",
      current_event_race_index: 0,
      total_event_races: 4,
    } as any);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_LABEL_RACE");
    expect(await harness.getRaceName()).toBe("Heat 1 1 / 4");
  });

  it("should apply custom font size and fallback when scaleMode is custom", () => {
    fixture.componentRef.setInput("race", { name: "Test Race" } as Race);
    fixture.componentRef.setInput("widget", {
      id: "w-race",
      widgetType: "race-name",
      scaleMode: "",
      customSettings: {
        labelFontSize: 22,
        valueFontSize: 28,
      },
    } as any);
    fixture.detectChanges();

    const labelEl: HTMLElement =
      fixture.nativeElement.querySelector(".label-text");
    const valueEl: HTMLElement =
      fixture.nativeElement.querySelector(".value-text");
    expect(labelEl.style.fontSize).toBe("22px");
    expect(valueEl.style.fontSize).toBe("28px");

    // Test fallback when customSettings lacks font sizes
    fixture.componentRef.setInput("widget", {
      id: "w-race",
      widgetType: "race-name",
      scaleMode: "",
      customSettings: {},
    } as any);
    fixture.detectChanges();

    expect(labelEl.style.fontSize).toBe("13px");
    expect(valueEl.style.fontSize).toBe("18px");
  });

  it("should not apply inline font size when scaleMode is auto", () => {
    fixture.componentRef.setInput("race", { name: "Test Race" } as Race);
    fixture.componentRef.setInput("widget", {
      id: "w-race",
      widgetType: "race-name",
      scaleMode: "auto",
      customSettings: {
        labelFontSize: 22,
        valueFontSize: 28,
      },
    } as any);
    fixture.detectChanges();

    const labelEl: HTMLElement =
      fixture.nativeElement.querySelector(".label-text");
    const valueEl: HTMLElement =
      fixture.nativeElement.querySelector(".value-text");
    expect(labelEl.style.fontSize).toBe("");
    expect(valueEl.style.fontSize).toBe("");
  });
});
