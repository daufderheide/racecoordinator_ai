import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { WidgetBorderInspectorComponent } from "./widget-border-inspector.component";

describe("WidgetBorderInspectorComponent", () => {
  let component: WidgetBorderInspectorComponent;
  let fixture: ComponentFixture<WidgetBorderInspectorComponent>;
  let changeSpy: jasmine.Spy;
  let settings: Record<string, any>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [FormsModule, TranslatePipe, WidgetBorderInspectorComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetBorderInspectorComponent);
    component = fixture.componentInstance;
    settings = {};
    fixture.componentRef.setInput("settings", settings);
    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fall back to defaults when settings are empty", () => {
    expect(component.showBorder).toBeTrue();
    expect(component.borderStyle).toBe("solid");
    expect(component.borderColor).toBe("#ffffff");
    expect(component.borderWidth).toBe(1);
    expect(component.borderRadius).toBe(8);
  });

  it("should read existing settings values", () => {
    settings["showBorder"] = false;
    settings["borderStyle"] = "dashed";
    settings["borderColor"] = "#123456";
    settings["borderWidth"] = 3;
    settings["borderRadius"] = 12;

    expect(component.showBorder).toBeFalse();
    expect(component.borderStyle).toBe("dashed");
    expect(component.borderColor).toBe("#123456");
    expect(component.borderWidth).toBe(3);
    expect(component.borderRadius).toBe(12);
  });

  it("should update showBorder and emit change", () => {
    component.onShowBorderChange(false);
    expect(settings["showBorder"]).toBeFalse();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update borderStyle and emit change", () => {
    component.onBorderStyleChange("dotted");
    expect(settings["borderStyle"]).toBe("dotted");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update borderColor and emit change", () => {
    const event = {
      target: { value: "#38bdf8" },
    } as unknown as Event;
    component.onBorderColorChange(event);
    expect(settings["borderColor"]).toBe("#38bdf8");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update borderWidth and emit change", () => {
    component.onBorderWidthChange(5);
    expect(settings["borderWidth"]).toBe(5);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update borderRadius and emit change", () => {
    component.onBorderRadiusChange(16);
    expect(settings["borderRadius"]).toBe(16);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should respect custom default inputs", () => {
    fixture.componentRef.setInput("defaultShowBorder", false);
    fixture.componentRef.setInput("defaultBorderStyle", "double");
    fixture.componentRef.setInput("defaultBorderColor", "#dddddd");
    fixture.componentRef.setInput("defaultBorderWidth", 2);
    fixture.componentRef.setInput("defaultBorderRadius", 4);
    fixture.detectChanges();

    expect(component.showBorder).toBeFalse();
    expect(component.borderStyle).toBe("double");
    expect(component.borderColor).toBe("#dddddd");
    expect(component.borderWidth).toBe(2);
    expect(component.borderRadius).toBe(4);
  });
});
