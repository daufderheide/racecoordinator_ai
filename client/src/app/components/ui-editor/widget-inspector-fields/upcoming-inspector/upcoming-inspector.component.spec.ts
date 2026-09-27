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
