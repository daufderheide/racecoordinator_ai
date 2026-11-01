import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import deJson from "../../../../../assets/i18n/de.json";
import enJson from "../../../../../assets/i18n/en.json";
import esJson from "../../../../../assets/i18n/es.json";
import frJson from "../../../../../assets/i18n/fr.json";
import itJson from "../../../../../assets/i18n/it.json";
import nlJson from "../../../../../assets/i18n/nl.json";
import ptJson from "../../../../../assets/i18n/pt.json";
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

  describe("Alignment localization", () => {
    const i18nFiles = [
      { lang: "en", json: enJson },
      { lang: "de", json: deJson },
      { lang: "es", json: esJson },
      { lang: "fr", json: frJson },
      { lang: "it", json: itJson },
      { lang: "nl", json: nlJson },
      { lang: "pt", json: ptJson },
    ];

    const requiredKeys = [
      "UE_INSPECTOR_ALIGNMENT",
      "UE_INSPECTOR_ALIGN_LEFT",
      "UE_INSPECTOR_ALIGN_CENTER",
      "UE_INSPECTOR_ALIGN_RIGHT",
    ];

    it("should define non-empty alignment keys across all 7 supported languages", () => {
      i18nFiles.forEach(({ lang, json }) => {
        const langData = json as Record<string, string>;
        requiredKeys.forEach((key) => {
          const val = langData[key];
          expect(val)
            .withContext(`Missing ${key} in ${lang}.json`)
            .toBeDefined();
          expect(val?.trim().length)
            .withContext(`Empty ${key} in ${lang}.json`)
            .toBeGreaterThan(0);
        });
      });
    });
  });
});
