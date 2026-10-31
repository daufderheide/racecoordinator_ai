import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayTrackNameComponent } from "./raceday-track-name.component";
import { RacedayTrackNameHarness } from "./testing/raceday-track-name.harness";

describe("RacedayTrackNameComponent", () => {
  let component: RacedayTrackNameComponent;
  let fixture: ComponentFixture<RacedayTrackNameComponent>;
  let harness: RacedayTrackNameHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayTrackNameComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayTrackNameComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayTrackNameHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty content when inputs are missing", async () => {
    expect(await harness.getLabel()).toBe("");
    expect(await harness.getTrackName()).toBe("");
  });

  it("should display track name and localized label when input is provided", async () => {
    fixture.componentRef.setInput("track", {
      name: "Grand Prix Circuit",
    } as Track);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_LABEL_TRACK");
    expect(await harness.getTrackName()).toBe("Grand Prix Circuit");
  });

  it("should apply custom font size and fallback when scaleMode is custom", () => {
    fixture.componentRef.setInput("track", {
      name: "Grand Prix Circuit",
    } as Track);
    fixture.componentRef.setInput("widget", {
      id: "w-track",
      widgetType: "track-name",
      scaleMode: "",
      customSettings: {
        labelFontSize: 23,
        valueFontSize: 29,
      },
    } as any);
    fixture.detectChanges();

    const labelEl: HTMLElement =
      fixture.nativeElement.querySelector(".label-text");
    const valueEl: HTMLElement =
      fixture.nativeElement.querySelector(".value-text");
    expect(labelEl.style.fontSize).toBe("23px");
    expect(valueEl.style.fontSize).toBe("29px");

    // Test fallback when customSettings lacks font sizes
    fixture.componentRef.setInput("widget", {
      id: "w-track",
      widgetType: "track-name",
      scaleMode: "",
      customSettings: {},
    } as any);
    fixture.detectChanges();

    expect(labelEl.style.fontSize).toBe("13px");
    expect(valueEl.style.fontSize).toBe("18px");
  });

  it("should not apply inline font size when scaleMode is auto", () => {
    fixture.componentRef.setInput("track", {
      name: "Grand Prix Circuit",
    } as Track);
    fixture.componentRef.setInput("widget", {
      id: "w-track",
      widgetType: "track-name",
      scaleMode: "auto",
      customSettings: {
        labelFontSize: 23,
        valueFontSize: 29,
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
