import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { LabelInspectorComponent } from "./label-inspector.component";

describe("LabelInspectorComponent", () => {
  let component: LabelInspectorComponent;
  let fixture: ComponentFixture<LabelInspectorComponent>;
  let mockFontService: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockFontService = jasmine.createSpyObj("FontService", [
      "loadLocalFonts",
      "availableFonts",
    ]);
    mockFontService.availableFonts.and.returnValue(["Arial", "Roboto"]);

    await TestBed.configureTestingModule({
      imports: [LabelInspectorComponent, FormsModule],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: FontService, useValue: mockFontService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelInspectorComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when onSettingsChange is called", () => {
    spyOn(component.change, "emit");
    component.onSettingsChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    spyOn(component.change, "emit");
    const mockSettings: any = { textColor: "#ffffff" };
    fixture.componentRef.setInput("settings", mockSettings);

    const mockEvent = {
      target: { value: "#123456" },
    } as unknown as Event;

    component.onColorChange("textColor", mockEvent);
    expect(mockSettings.textColor).toBe("#123456");
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should delete field and emit change on resetColor", () => {
    spyOn(component.change, "emit");
    const mockSettings: any = { backgroundColor: "#ffffff" };
    fixture.componentRef.setInput("settings", mockSettings);

    component.resetColor("backgroundColor");
    expect(mockSettings.backgroundColor).toBeUndefined();
    expect(component.change.emit).toHaveBeenCalled();
  });
});
