import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { TextInfoInspectorHarness } from "./testing/text-info-inspector.harness";
import { TextInfoInspectorComponent } from "./text-info-inspector.component";

describe("TextInfoInspectorComponent", () => {
  let component: TextInfoInspectorComponent;
  let fixture: ComponentFixture<TextInfoInspectorComponent>;
  let harness: TextInfoInspectorHarness;
  let changeSpy: jasmine.Spy;

  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, TextInfoInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TextInfoInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    // Set required input
    fixture.componentRef.setInput("settings", {
      labelFontFamily: "",
      labelFontSize: 17,
      labelTextColor: "",
      valueFontFamily: "",
      valueFontSize: 19,
      valueTextColor: "",
    });

    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      TextInfoInspectorHarness,
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

    component.onColorChange("labelTextColor", event);
    expect(component.settings().labelTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().labelTextColor = "#ffffff";
    component.resetColor("labelTextColor");
    expect(component.settings().labelTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const selectEl = fixture.nativeElement.querySelector("app-custom-select");
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should read and write values via harness", async () => {
    expect(await harness.getLabelFontSize()).toBe(17);
    await harness.setLabelFontSize(45);
    expect(await harness.getLabelFontSize()).toBe(45);
    expect(changeSpy).toHaveBeenCalled();
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
