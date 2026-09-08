import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { HeatListInspectorComponent } from "./heat-list-inspector.component";

describe("HeatListInspectorComponent", () => {
  let component: HeatListInspectorComponent;
  let fixture: ComponentFixture<HeatListInspectorComponent>;
  let changeSpy: jasmine.Spy;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, HeatListInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatListInspectorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("settings", {
      showHeader: true,
      autoScrollToCurrent: true,
      highlightCurrentHeat: true,
      heatColumns: "auto",
      laneColumns: "auto",
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      heatNumberFontFamily: "",
      heatNumberFontSize: 14,
      heatNumberTextColor: "",
      laneFontFamily: "",
      laneFontSize: 12,
      laneTextColor: "",
    });

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when settings change", () => {
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    const event = {
      target: { value: "#38bdf8" },
    } as unknown as Event;

    component.onColorChange("titleTextColor", event);
    expect(component.settings().titleTextColor).toBe("#38bdf8");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color and emit change on resetColor", () => {
    component.settings().titleTextColor = "#38bdf8";
    component.resetColor("titleTextColor");
    expect(component.settings().titleTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should toggle showHeader and column settings cleanly", () => {
    component.settings().showHeader = false;
    component.onSettingsChange();
    expect(component.settings().showHeader).toBeFalse();
    expect(changeSpy).toHaveBeenCalled();

    component.settings().heatColumns = "2";
    component.onSettingsChange();
    expect(component.settings().heatColumns).toBe("2");
  });

  it("should toggle scaleToWindow and disable heatColumns dropdown and font size sliders", async () => {
    fixture.componentRef.setInput("settings", {
      ...component.settings(),
      scaleToWindow: true,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.settings().scaleToWindow).toBeTrue();
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();

    const customSelects =
      fixture.nativeElement.querySelectorAll("app-custom-select");
    // The first app-custom-select is heatColumns
    const heatColumnsSelect = customSelects[0];
    const container = heatColumnsSelect.querySelector(
      ".custom-select-container",
    );
    expect(container?.classList.contains("disabled")).toBeTrue();

    // Check sliders
    const sliders = fixture.nativeElement.querySelectorAll(".inspector-slider");
    expect(sliders[0].disabled).toBeFalse();
    expect(sliders[1].disabled).toBeTrue();
    expect(sliders[2].disabled).toBeTrue();
  });

  it("should handle summary configuration toggles and color updates", () => {
    fixture.componentRef.setInput("settings", {
      ...component.settings(),
      showCompletedSummary: true,
      showActiveSummary: true,
      summaryShowPosition: true,
      summaryShowDriver: true,
      summaryShowLaps: true,
      summaryShowBestLap: true,
      summaryShowGap: false,
      summaryShowAverageLap: false,
      summaryShowMedianLap: false,
      summaryLapDecimalPlaces: "auto",
      summaryTimeDecimalPlaces: 3,
      summaryHeaderTextColor: "",
      summaryBorderColor: "",
    });
    fixture.detectChanges();

    component.settings().summaryShowMedianLap = true;
    component.onSettingsChange();
    expect(component.settings().summaryShowMedianLap).toBeTrue();
    expect(changeSpy).toHaveBeenCalled();

    component.onColorChange("summaryBorderColor", {
      target: { value: "#00ffff" },
    } as unknown as Event);
    expect(component.settings().summaryBorderColor).toBe("#00ffff");

    component.resetColor("summaryBorderColor");
    expect(component.settings().summaryBorderColor).toBe("");
  });

  it("should toggle showCurrentHeatFlag and showCurrentHeatTime settings", () => {
    component.settings().showCurrentHeatFlag = false;
    component.onSettingsChange();
    expect(component.settings().showCurrentHeatFlag).toBeFalse();
    expect(changeSpy).toHaveBeenCalled();

    component.settings().showCurrentHeatTime = false;
    component.onSettingsChange();
    expect(component.settings().showCurrentHeatTime).toBeFalse();
  });
});
