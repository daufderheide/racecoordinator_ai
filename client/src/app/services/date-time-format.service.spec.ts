import { TestBed } from "@angular/core/testing";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

import { DateTimeFormatService } from "./date-time-format.service";

describe("DateTimeFormatService", () => {
  let service: DateTimeFormatService;
  let mockTranslationService: any;
  let mockSettingsService: any;

  beforeEach(() => {
    mockTranslationService = {
      getCurrentLanguageValue: jasmine
        .createSpy("getCurrentLanguageValue")
        .and.returnValue("en"),
    };
    mockSettingsService = {
      getSettings: jasmine
        .createSpy("getSettings")
        .and.returnValue({ language: "" }),
    };

    TestBed.configureTestingModule({
      providers: [
        DateTimeFormatService,
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    });

    service = TestBed.inject(DateTimeFormatService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("parseDate", () => {
    it("should return null for null, undefined, or empty string", () => {
      expect(service.parseDate(null)).toBeNull();
      expect(service.parseDate(undefined)).toBeNull();
      expect(service.parseDate("")).toBeNull();
    });

    it("should return Date object when valid Date is passed", () => {
      const d = new Date(2026, 8, 7, 14, 30, 0);
      expect(service.parseDate(d)).toBe(d);
    });

    it("should return null for Invalid Date", () => {
      const d = new Date("invalid date string");
      expect(service.parseDate(d)).toBeNull();
    });

    it("should parse numeric timestamp", () => {
      const ts = 1788784800000;
      const parsed = service.parseDate(ts);
      expect(parsed).toBeTruthy();
      expect(parsed?.getTime()).toBe(ts);
    });

    it("should return null for numeric 0 or negative values", () => {
      expect(service.parseDate(0)).toBeNull();
      expect(service.parseDate(-100)).toBeNull();
      expect(service.parseDate(NaN)).toBeNull();
    });

    it("should parse ISO date string", () => {
      const parsed = service.parseDate("2026-09-07T12:00:00Z");
      expect(parsed).toBeTruthy();
      expect(parsed?.toISOString()).toBe("2026-09-07T12:00:00.000Z");
    });

    it("should parse numeric string timestamp", () => {
      const parsed = service.parseDate("1788784800000");
      expect(parsed).toBeTruthy();
      expect(parsed?.getTime()).toBe(1788784800000);
    });
  });

  describe("getResolvedLocale", () => {
    it("should use explicit language setting when configured", () => {
      mockSettingsService.getSettings.and.returnValue({ language: "de" });
      expect(service.getResolvedLocale()).toBe("de");
    });

    it("should use translationService language when settings language is empty and not English", () => {
      mockSettingsService.getSettings.and.returnValue({ language: "" });
      mockTranslationService.getCurrentLanguageValue.and.returnValue("fr");
      expect(service.getResolvedLocale()).toBe("fr");
    });

    it("should resolve to navigator.language when language is en and browser is en-AU", () => {
      mockSettingsService.getSettings.and.returnValue({ language: "en" });
      mockTranslationService.getCurrentLanguageValue.and.returnValue("en");
      // Spy or override navigator.language property
      const originalNavigator = window.navigator;
      try {
        Object.defineProperty(window, "navigator", {
          value: { ...originalNavigator, language: "en-AU" },
          configurable: true,
        });
        expect(service.getResolvedLocale()).toBe("en-AU");
      } finally {
        Object.defineProperty(window, "navigator", {
          value: originalNavigator,
          configurable: true,
        });
      }
    });

    it("should resolve to en-US when language is en and browser is non-English", () => {
      mockSettingsService.getSettings.and.returnValue({ language: "en" });
      mockTranslationService.getCurrentLanguageValue.and.returnValue("en");
      const originalNavigator = window.navigator;
      try {
        Object.defineProperty(window, "navigator", {
          value: { ...originalNavigator, language: "de-DE" },
          configurable: true,
        });
        expect(service.getResolvedLocale()).toBe("en-US");
      } finally {
        Object.defineProperty(window, "navigator", {
          value: originalNavigator,
          configurable: true,
        });
      }
    });
  });

  describe("formatting with localeOverride", () => {
    // 2026-09-07 14:35:10 UTC -> construct via UTC/local to test predictable patterns
    const testDate = new Date(2026, 8, 7, 14, 35, 10); // Sept 7, 2026 14:35:10 local

    it("should format en-AU as DD/MM/YYYY", () => {
      const formatted = service.format(testDate, "shortDate", "", "en-AU");
      // Australian format uses day first (e.g., 7/9/26 or 07/09/2026)
      expect(formatted).toMatch(/0?7\/0?9\/(20)?26/);
    });

    it("should format en-US as MM/DD/YYYY", () => {
      const formatted = service.format(testDate, "shortDate", "", "en-US");
      // US format uses month first (e.g., 9/7/26 or 09/07/2026)
      expect(formatted).toMatch(/0?9\/0?7\/(20)?26/);
    });

    it("should format de as DD.MM.YYYY", () => {
      const formatted = service.format(testDate, "shortDate", "", "de");
      // German format uses dots (e.g., 07.09.26 or 07.09.2026)
      expect(formatted).toMatch(/0?7\.0?9\.(20)?26/);
    });

    it("should format short date-time according to locale", () => {
      const formattedAU = service.format(testDate, "short", "", "en-AU");
      const formattedUS = service.format(testDate, "short", "", "en-US");

      expect(formattedAU).toBeTruthy();
      expect(formattedUS).toBeTruthy();
      // Both should contain the year 26
      expect(formattedAU).toContain("26");
      expect(formattedUS).toContain("26");
    });

    it("should return fallback for invalid date", () => {
      expect(service.format(null, "short", "—")).toBe("—");
      expect(service.format(undefined, "short", "N/A")).toBe("N/A");
      expect(service.format("invalid", "short", "--")).toBe("--");
    });

    it("should format with custom Intl options", () => {
      const formatted = service.format(
        testDate,
        { year: "numeric", month: "2-digit", day: "2-digit" },
        "",
        "en-US",
      );
      expect(formatted).toBe("09/07/2026");
    });

    it("should support formatDate helper method", () => {
      const formatted = service.formatDate(testDate, "short", "", "en-US");
      expect(formatted).toMatch(/0?9\/0?7\/(20)?26/);
    });

    it("should support formatDateTime helper method", () => {
      const formatted = service.formatDateTime(testDate, "short", "", "en-US");
      expect(formatted).toBeTruthy();
      expect(formatted).toContain("26");
    });

    it("should parse and format objects with toNumber() method (e.g. Long)", () => {
      const longObj = { toNumber: () => testDate.getTime() };
      const formatted = service.formatDate(longObj, "short", "", "en-US");
      expect(formatted).toMatch(/0?9\/0?7\/(20)?26/);

      const invalidLong = { toNumber: () => 0 };
      expect(service.formatDate(invalidLong, "short", "---", "en-US")).toBe(
        "---",
      );
    });

    it("should support formatTime helper method", () => {
      const formatted = service.formatTime(testDate, "short", "", "en-US");
      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
