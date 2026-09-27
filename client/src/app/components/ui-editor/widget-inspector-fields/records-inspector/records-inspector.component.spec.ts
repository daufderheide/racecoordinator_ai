import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { RecordsInspectorComponent } from "./records-inspector.component";
import { RecordsInspectorHarness } from "./testing/records-inspector.harness";

describe("RecordsInspectorComponent", () => {
  let component: RecordsInspectorComponent;
  let fixture: ComponentFixture<RecordsInspectorComponent>;
  let harness: RecordsInspectorHarness;
  let changeSpy: jasmine.Spy;

  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, RecordsInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordsInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    // Set required input
    fixture.componentRef.setInput("settings", {
      headerFontFamily: "",
      headerFontSize: 17,
      headerTextColor: "",
      valueFontFamily: "",
      valueFontSize: 19,
      valueTextColor: "",
    });

    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RecordsInspectorHarness,
    );

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when general settings change", () => {
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    const event = {
      target: {
        value: "#ff0000",
      },
    } as any;

    component.onColorChange("headerTextColor", event);
    expect(component.settings().headerTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().headerTextColor = "#ffffff";
    component.resetColor("headerTextColor");
    expect(component.settings().headerTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const selectEl = fixture.nativeElement.querySelector("app-custom-select");
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should read and write values via harness", async () => {
    expect(await harness.getHeaderFontSize()).toBe(17);
    await harness.setHeaderFontSize(45);
    expect(await harness.getHeaderFontSize()).toBe(45);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should initialize checkboxes to true by default", async () => {
    expect(await harness.getShowRaceRecordLap()).toBeTrue();
    expect(await harness.getShowRaceRecordScore()).toBeTrue();
    expect(await harness.getShowCurrentRaceBest()).toBeTrue();
    expect(await harness.getShowHeatBest()).toBeTrue();
  });

  it("should toggle checkboxes and emit changes", async () => {
    await harness.setShowRaceRecordLap(false);
    expect(component.settings().showRaceRecordLap).toBeFalse();
    expect(changeSpy).toHaveBeenCalled();

    await harness.setShowRaceRecordScore(false);
    expect(component.settings().showRaceRecordScore).toBeFalse();

    await harness.setShowCurrentRaceBest(false);
    expect(component.settings().showCurrentRaceBest).toBeFalse();

    await harness.setShowHeatBest(false);
    expect(component.settings().showHeatBest).toBeFalse();

    await harness.setShowRaceRecordLap(true);
    expect(component.settings().showRaceRecordLap).toBeTrue();
  });

  it("should disable font size inputs when disableFontSizes is true", async () => {
    fixture.componentRef.setInput("disableFontSizes", true);
    fixture.detectChanges();
    await fixture.whenStable();
    const sliders = fixture.nativeElement.querySelectorAll(
      'input[type="range"]',
    );
    expect(sliders.length).toBeGreaterThan(0);
    sliders.forEach((slider: HTMLInputElement) => {
      expect(slider.disabled).toBeTrue();
    });
  });
});
