import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { LeaderboardInspectorComponent } from "./leaderboard-inspector.component";

describe("LeaderboardInspectorComponent", () => {
  let component: LeaderboardInspectorComponent;
  let fixture: ComponentFixture<LeaderboardInspectorComponent>;
  let changeSpy: jasmine.Spy;

  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, LeaderboardInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    // Set required input
    fixture.componentRef.setInput("settings", {
      decimalPlaces: 3,
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      overallLeaderFontFamily: "",
      overallLeaderFontSize: 16,
      overallLeaderTextColor: "",
      restFontFamily: "",
      restFontSize: 16,
      restTextColor: "",
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
    const selectEl =
      fixture.nativeElement.querySelectorAll("app-custom-select")[1];
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should bind decimalPlaces and emit change on selection", () => {
    const selectEl =
      fixture.nativeElement.querySelectorAll("app-custom-select")[0];
    const trigger = selectEl.querySelector(
      ".custom-select-trigger",
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const opt = selectEl.querySelector(
      '.custom-select-option[data-value="2"]',
    ) as HTMLElement;
    opt?.click();
    fixture.detectChanges();
    expect(Number(component.settings().decimalPlaces)).toBe(2);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should show subtitle section and update subtitle settings if isGroup is true", () => {
    fixture.componentRef.setInput("isGroup", true);
    fixture.componentRef.setInput("settings", {
      decimalPlaces: 3,
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      subtitleFontFamily: "",
      subtitleFontSize: 13,
      subtitleTextColor: "",
      overallLeaderFontFamily: "",
      overallLeaderFontSize: 16,
      overallLeaderTextColor: "",
      restFontFamily: "",
      restFontSize: 16,
      restTextColor: "",
    });
    fixture.detectChanges();

    const event = {
      target: {
        value: "#00ff00",
      },
    } as any;
    component.onColorChange("subtitleTextColor", event);
    expect(component.settings().subtitleTextColor).toBe("#00ff00");
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
