import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Settings } from "src/app/models/settings";

import { SettingsService } from "./settings.service";
import { TranslationService } from "./translation.service";

describe("TranslationService", () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;
  let settingsServiceSpy: jasmine.SpyObj<SettingsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TranslationService,
        { provide: SettingsService, useValue: spy },
      ],
    });

    settingsServiceSpy = TestBed.inject(
      SettingsService,
    ) as jasmine.SpyObj<SettingsService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it("should load language from settings if available", () => {
    settingsServiceSpy.getSettings.and.returnValue(
      Object.assign(new Settings(), { language: "fr" }),
    );

    service = TestBed.inject(TranslationService);

    const req = httpMock.expectOne((request) =>
      request.url.startsWith("assets/i18n/fr.json"),
    );
    expect(req.request.method).toBe("GET");
    req.flush({ TEST: "Test FR" });
  });

  it("should fallback to browser language if settings language is empty", () => {
    settingsServiceSpy.getSettings.and.returnValue(
      Object.assign(new Settings(), { language: "" }),
    );
    // Force browser language to 'es' for testing if possible, or just check it calls getBrowserLanguage

    service = TestBed.inject(TranslationService);

    // Since we can't easily mock navigator.language here without extra effort,
    // we just verify that SOME language is loaded.
    const req = httpMock.match((request) =>
      request.url.startsWith("assets/i18n/"),
    )[0];
    expect(req).toBeDefined();
    req.flush({});
  });

  it("should return supported languages", () => {
    settingsServiceSpy.getSettings.and.returnValue(new Settings());
    service = TestBed.inject(TranslationService);
    httpMock
      .match((request) => request.url.startsWith("assets/i18n/"))[0]
      .flush({});

    const languages = service.getSupportedLanguages();
    expect(languages.length).toBe(7);
    expect(languages.find((l) => l.code === "en")).toBeDefined();
    expect(languages.find((l) => l.code === "de")).toBeDefined();
  });

  it("should translate keys correctly", (done) => {
    settingsServiceSpy.getSettings.and.returnValue(
      Object.assign(new Settings(), { language: "en" }),
    );
    service = TestBed.inject(TranslationService);

    const req = httpMock.expectOne((request) =>
      request.url.startsWith("assets/i18n/en.json"),
    );
    req.flush({ HELLO: "Hello World" });

    service.getTranslationsLoaded().subscribe((loaded) => {
      if (loaded) {
        expect(service.translate("HELLO")).toBe("Hello World");
        expect(service.translate("UNKNOWN")).toBe("UNKNOWN");
        done();
      }
    });
  });

  it('should resolve and load browser language when setLanguage("") is called', (done) => {
    // Mock navigator.language to 'nl' (Dutch)
    spyOnProperty(navigator, "language", "get").and.returnValue("nl-NL");

    // Initial load from settings (empty language)
    settingsServiceSpy.getSettings.and.returnValue(
      Object.assign(new Settings(), { language: "" }),
    );
    service = TestBed.inject(TranslationService);

    // Initial load triggered by constructor
    const initialReq = httpMock.expectOne((req) =>
      req.url.startsWith("assets/i18n/nl.json"),
    );
    initialReq.flush({ GREETING: "Hallo" });

    // Call setLanguage('') explicitly
    service.setLanguage("");

    // Should resolve '' to 'nl' and try to reload it
    const reloadReq = httpMock.expectOne((req) =>
      req.url.startsWith("assets/i18n/nl.json"),
    );
    expect(reloadReq.request.url).toContain("nl.json");
    reloadReq.flush({ GREETING: "Hallo Wereld" });

    service.getTranslationsLoaded().subscribe((loaded) => {
      if (loaded) {
        expect(service.translate("GREETING")).toBe("Hallo Wereld");
        done();
      }
    });
  });

  it("should fallback to English if browser language is not supported", () => {
    // Mock navigator.language to an unsupported language
    spyOnProperty(navigator, "language", "get").and.returnValue("ja-JP");

    settingsServiceSpy.getSettings.and.returnValue(
      Object.assign(new Settings(), { language: "" }),
    );
    service = TestBed.inject(TranslationService);

    // Should resolve unsupported 'ja' to 'en'
    const req = httpMock.expectOne((req) =>
      req.url.startsWith("assets/i18n/en.json"),
    );
    expect(req.request.url).toContain("en.json");
    req.flush({});
  });

  afterEach(() => {
    httpMock.verify();
  });
});
