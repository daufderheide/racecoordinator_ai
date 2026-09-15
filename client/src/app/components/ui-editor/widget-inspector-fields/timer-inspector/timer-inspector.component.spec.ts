import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { TimerInspectorComponent } from "./timer-inspector.component";

describe("TimerInspectorComponent", () => {
  let component: TimerInspectorComponent;
  let fixture: ComponentFixture<TimerInspectorComponent>;
  let changeSpy: jasmine.Spy;

  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, TimerInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    // Set required input
    fixture.componentRef.setInput("settings", {
      timeFontFamily: "",
      timeFontSize: 100,
      timeTextColor: "",
      timeDisplayFormat: "dynamic",
      timeSubsecondMode: "threshold",
      timeSubsecondThreshold: 10,
      timeSubsecondDecimals: 2,
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

    component.onColorChange("timeTextColor", event);
    expect(component.settings().timeTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().timeTextColor = "#ffffff";
    component.resetColor("timeTextColor");
    expect(component.settings().timeTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const selectEl = fixture.nativeElement.querySelector("app-custom-select");
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should disable font size inputs when disableFontSizes is true", async () => {
    fixture.componentRef.setInput("disableFontSizes", true);
    fixture.detectChanges();
    await fixture.whenStable();
    const sliders = Array.from<HTMLInputElement>(
      fixture.nativeElement.querySelectorAll('input[type="range"]'),
    ).filter((el) => el.getAttribute("max") === "200");
    expect(sliders.length).toBeGreaterThan(0);
    sliders.forEach((slider: HTMLInputElement) => {
      expect(slider.disabled).toBeTrue();
    });
  });

  it("should update timeSubsecondThreshold and emit change", async () => {
    const inputEl = fixture.nativeElement.querySelector('input[type="number"]');
    inputEl.value = "15";
    inputEl.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.settings().timeSubsecondThreshold).toBe(15);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update timeSubsecondDecimals and emit change", async () => {
    const slider = Array.from<HTMLInputElement>(
      fixture.nativeElement.querySelectorAll('input[type="range"]'),
    ).find((el) => el.getAttribute("max") === "3");

    expect(slider).toBeTruthy();
    if (slider) {
      slider.value = "1";
      slider.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.settings().timeSubsecondDecimals).toBe(1);
      expect(changeSpy).toHaveBeenCalled();
    }
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

  it("should compute getPreview correctly with hh_mm_ss format", () => {
    component.settings().timeDisplayFormat = "hh_mm_ss";
    expect(component.getPreview(75)).toBe("00:01:15");
    expect(component.getPreview(45)).toBe("00:00:45");
  });

  it("should compute getPreview correctly with seconds format", () => {
    component.settings().timeDisplayFormat = "seconds";
    expect(component.getPreview(75)).toBe("75");
    expect(component.getPreview(45)).toBe("45");
  });

  it("should hide threshold input when subsecondMode is always or never", async () => {
    component.settings().timeSubsecondMode = "always";
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('input[type="number"]'),
    ).toBeNull();

    component.settings().timeSubsecondMode = "never";
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('input[type="number"]'),
    ).toBeNull();
  });

  it("should hide decimal slider when subsecondMode is never", async () => {
    component.settings().timeSubsecondMode = "never";
    fixture.detectChanges();
    await fixture.whenStable();
    const decimalSlider = Array.from<HTMLInputElement>(
      fixture.nativeElement.querySelectorAll('input[type="range"]'),
    ).find((el) => el.getAttribute("max") === "3");
    expect(decimalSlider).toBeUndefined();
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
