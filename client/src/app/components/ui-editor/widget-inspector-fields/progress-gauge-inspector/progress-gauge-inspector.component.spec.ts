import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { ProgressGaugeInspectorComponent } from "./progress-gauge-inspector.component";

describe("ProgressGaugeInspectorComponent", () => {
  let component: ProgressGaugeInspectorComponent;
  let fixture: ComponentFixture<ProgressGaugeInspectorComponent>;
  let changeSpy: jasmine.Spy;
  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, ProgressGaugeInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressGaugeInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    fixture.componentRef.setInput("settings", {
      gaugeType: "heat-progress",
      gaugeStyle: "thermometer",
      orientation: "vertical",
      bindingMode: "hostLane",
      showLabel: true,
      fillColor: "",
      borderColor: "",
      textColor: "",
      fontFamily: "",
      fontSize: 18,
      timeDisplayFormat: "dynamic",
      timeSubsecondMode: "threshold",
      timeSubsecondThreshold: 10,
      timeSubsecondDecimals: 2,
      lapDecimalPlaces: 0,
    });

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

    component.onColorChange("fillColor", event);
    expect(component.settings().fillColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().fillColor = "#ffffff";
    component.resetColor("fillColor");
    expect(component.settings().fillColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const fontSelect = fixture.nativeElement.querySelector(
      ".font-family-select",
    );
    expect(fontSelect).toBeTruthy();
    fontSelect.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should disable font size input when disableFontSizes is true", async () => {
    fixture.componentRef.setInput("disableFontSizes", true);
    fixture.detectChanges();
    await fixture.whenStable();
    const slider = fixture.nativeElement.querySelector(
      'input[type="range"][max="100"]',
    );
    expect(slider?.disabled).toBeTrue();
  });

  it("should compute getPreview correctly with default dynamic settings", () => {
    expect(component.getPreview(3665)).toBe("1:01:05");
    expect(component.getPreview(75)).toBe("1:15");
    expect(component.getPreview(45)).toBe("45");
    expect(component.getPreview(8.45)).toBe("8.45");
  });

  it("should compute getPreview correctly with mm_ss format", () => {
    component.settings().timeDisplayFormat = "mm_ss";
    expect(component.getPreview(75)).toBe("01:15");
    expect(component.getPreview(45)).toBe("00:45");
    expect(component.getPreview(8.45)).toBe("00:08.45");
  });

  it("should hide time section when gaugeType is fuel", async () => {
    component.settings().gaugeType = "fuel";
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector(".timer-preview-grid"),
    ).toBeNull();
  });

  it("should include autofill protection attributes on number input", () => {
    const inputEl = fixture.nativeElement.querySelector('input[type="number"]');
    expect(inputEl.getAttribute("autocomplete")).toBe("off");
    expect(inputEl.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(inputEl.getAttribute("data-1p-ignore")).toBe("true");
    expect(inputEl.getAttribute("data-lpignore")).toBe("true");
    expect(inputEl.getAttribute("data-bwignore")).toBe("true");
    expect(inputEl.getAttribute("data-form-type")).toBe("other");
  });
});
