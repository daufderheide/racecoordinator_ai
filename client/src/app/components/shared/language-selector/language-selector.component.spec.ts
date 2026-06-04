import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { LanguageSelectorComponent } from "./language-selector.component";

describe("LanguageSelectorComponent", () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    (mockTranslationService as any).getSupportedLanguages = jasmine
      .createSpy()
      .and.returnValue([
        { code: "en", nameKey: "RDS_LANG_EN" },
        { code: "es", nameKey: "RDS_LANG_ES" },
      ]);
    (mockTranslationService as any).getBrowserLanguage = jasmine
      .createSpy()
      .and.returnValue("en");

    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle localization dropdown", () => {
    component.toggleLocalizationDropdown(new MouseEvent("click"));
    expect(component.isLocalizationDropdownOpen).toBeTrue();

    component.toggleLocalizationDropdown(new MouseEvent("click"));
    expect(component.isLocalizationDropdownOpen).toBeFalse();
  });

  it("should select language and emit languageSelected event", () => {
    spyOn(component.languageSelected, "emit");
    component.selectLanguage("es");
    expect(mockTranslationService.selectLanguage).toHaveBeenCalledWith("es");
    expect(component.currentLanguage).toBe("es");
    expect(component.isLocalizationDropdownOpen).toBeFalse();
    expect(component.languageSelected.emit).toHaveBeenCalledWith("es");
  });

  it("should get language display name from translationService", () => {
    mockTranslationService.getLanguageDisplayName.and.returnValue("English");
    const name = component.getLanguageDisplayName("en");
    expect(mockTranslationService.getLanguageDisplayName).toHaveBeenCalledWith(
      "en",
    );
    expect(name).toBe("English");
  });
});
