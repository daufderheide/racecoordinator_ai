import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { UpcomingInspectorComponent } from "./upcoming-inspector.component";

describe("UpcomingInspectorComponent", () => {
  let component: UpcomingInspectorComponent;
  let fixture: ComponentFixture<UpcomingInspectorComponent>;
  let changeSpy: jasmine.Spy;
  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, UpcomingInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    // Set required input
    fixture.componentRef.setInput("settings", {
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      laneFontFamily: "",
      laneFontSize: 16,
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
      target: {
        value: "#ff0000",
      },
    } as any;

    component.onColorChange("titleTextColor", event);
    expect(component.settings().titleTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().titleTextColor = "#ffffff";
    component.resetColor("titleTextColor");
    expect(component.settings().titleTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const selectEl = fixture.nativeElement.querySelector("app-custom-select");
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should disable font size inputs when disableFontSizes is true", async () => {
    fixture.componentRef.setInput("widgetType", "on-deck");
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

  it("should render appearance section with background color and alternating row contrast for next-heat", () => {
    fixture.componentRef.setInput("widgetType", "next-heat");
    fixture.detectChanges();

    const colorPickers = fixture.nativeElement.querySelectorAll(
      'input[type="color"]',
    );
    // Title text color, Lane text color, Background color
    expect(colorPickers.length).toBe(3);

    const event = { target: { value: "#1e293b" } } as any;
    component.onColorChange("backgroundColor", event);
    expect(component.settings().backgroundColor).toBe("#1e293b");
    expect(changeSpy).toHaveBeenCalled();

    component.resetColor("backgroundColor");
    expect(component.settings().backgroundColor).toBe("");
    expect(changeSpy).toHaveBeenCalledTimes(2);
  });

  it("should not render appearance section when widgetType is on-deck", () => {
    fixture.componentRef.setInput("widgetType", "on-deck");
    fixture.detectChanges();

    const colorPickers = fixture.nativeElement.querySelectorAll(
      'input[type="color"]',
    );
    // Only Title text color and Lane text color
    expect(colorPickers.length).toBe(2);
  });

  it("should update alternatingRowContrast and emit change", () => {
    fixture.componentRef.setInput("widgetType", "next-heat");
    fixture.detectChanges();

    component.settings().alternatingRowContrast = 45;
    component.onSettingsChange();
    expect(component.settings().alternatingRowContrast).toBe(45);
    expect(changeSpy).toHaveBeenCalled();
  });
});
