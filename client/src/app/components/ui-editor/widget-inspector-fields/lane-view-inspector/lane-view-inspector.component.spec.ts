import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { LaneViewInspectorComponent } from "./lane-view-inspector.component";

describe("LaneViewInspectorComponent", () => {
  let component: LaneViewInspectorComponent;
  let fixture: ComponentFixture<LaneViewInspectorComponent>;
  let changeSpy: jasmine.Spy;
  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, LaneViewInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LaneViewInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    fixture.componentRef.setInput("settings", {
      timeDecimalPlaces: 3,
      lapDecimalPlaces: 2,
      columnFontFamily: "",
      columnFontSize: 24,
      columnTextColor: "",
      dataFontFamily: "",
      dataFontSize: 54,
      dataTextColor: "",
      insetTimeDecimalPlaces: 3,
      insetLapDecimalPlaces: 2,
      insetFontFamily: "",
      insetFontSize: 24,
      insetTextColor: "",
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

  it("should bind timeDecimalPlaces and emit change on selection", () => {
    const selectEl = fixture.nativeElement.querySelectorAll("select")[1]; // second select
    selectEl.value = "1";
    selectEl.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(Number(component.settings().timeDecimalPlaces)).toBe(1);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should bind lapDecimalPlaces and emit change on selection", () => {
    const selectEl = fixture.nativeElement.querySelectorAll("select")[2]; // third select
    selectEl.value = "0";
    selectEl.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(Number(component.settings().lapDecimalPlaces)).toBe(0);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    const event = {
      target: {
        value: "#ff0000",
      },
    } as any;

    component.onColorChange("columnTextColor", event);
    expect(component.settings().columnTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().columnTextColor = "#ffffff";
    component.resetColor("columnTextColor");
    expect(component.settings().columnTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const selectEl = fixture.nativeElement.querySelector("select");
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });
});
