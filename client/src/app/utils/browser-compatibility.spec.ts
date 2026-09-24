import deJson from "../../assets/i18n/de.json";
import enJson from "../../assets/i18n/en.json";
import esJson from "../../assets/i18n/es.json";
import frJson from "../../assets/i18n/fr.json";
import itJson from "../../assets/i18n/it.json";
import nlJson from "../../assets/i18n/nl.json";
import ptJson from "../../assets/i18n/pt.json";
import {
  BROWSER_UNSUPPORTED_TRANSLATIONS,
  getBrowserUnsupportedTranslations,
  isBrowserSupported,
  renderUnsupportedBrowserBanner,
} from "./browser-compatibility";

describe("BrowserCompatibility", () => {
  const i18nFiles = [
    { lang: "en", json: enJson },
    { lang: "de", json: deJson },
    { lang: "es", json: esJson },
    { lang: "fr", json: frJson },
    { lang: "it", json: itJson },
    { lang: "nl", json: nlJson },
    { lang: "pt", json: ptJson },
  ];

  afterEach(() => {
    const existing = document.getElementById("rc-unsupported-browser-overlay");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  });

  describe("Localization JSON synchronization", () => {
    it("should define all BROWSER_UNSUPPORTED keys in all 7 supported language files", () => {
      i18nFiles.forEach(({ lang, json }) => {
        expect((json as any).BROWSER_UNSUPPORTED_TITLE)
          .withContext(`Missing BROWSER_UNSUPPORTED_TITLE in ${lang}.json`)
          .toBeDefined();
        expect((json as any).BROWSER_UNSUPPORTED_DESC)
          .withContext(`Missing BROWSER_UNSUPPORTED_DESC in ${lang}.json`)
          .toBeDefined();
        expect((json as any).BROWSER_UNSUPPORTED_REQUIREMENTS)
          .withContext(
            `Missing BROWSER_UNSUPPORTED_REQUIREMENTS in ${lang}.json`,
          )
          .toBeDefined();
        expect((json as any).BROWSER_UNSUPPORTED_LEARN_MORE)
          .withContext(`Missing BROWSER_UNSUPPORTED_LEARN_MORE in ${lang}.json`)
          .toBeDefined();

        expect(
          (json as any).BROWSER_UNSUPPORTED_TITLE.trim().length,
        ).toBeGreaterThan(0);
        expect(
          (json as any).BROWSER_UNSUPPORTED_DESC.trim().length,
        ).toBeGreaterThan(0);
        expect(
          (json as any).BROWSER_UNSUPPORTED_REQUIREMENTS.trim().length,
        ).toBeGreaterThan(0);
        expect(
          (json as any).BROWSER_UNSUPPORTED_LEARN_MORE.trim().length,
        ).toBeGreaterThan(0);
      });
    });

    it("should match translations dictionary in browser-compatibility.ts", () => {
      expect(Object.keys(BROWSER_UNSUPPORTED_TRANSLATIONS)).toEqual([
        "en",
        "de",
        "es",
        "fr",
        "it",
        "nl",
        "pt",
      ]);
    });
  });

  describe("getBrowserUnsupportedTranslations", () => {
    it("should return English translations by default or when language is undefined", () => {
      const result = getBrowserUnsupportedTranslations(undefined);
      expect(result.title).toBe("Browser Not Supported");
      expect(result.desc).toContain("Race Coordinator AI requires");
      expect(result.reqs).toContain("Android 9+");
      expect(result.reqs).toContain("Windows 7+");
      expect(result.learnMore).toBe("Learn more about browser compatibility");
    });

    it("should return localized translations for supported languages", () => {
      expect(getBrowserUnsupportedTranslations("de").title).toBe(
        "Browser nicht unterstützt",
      );
      expect(getBrowserUnsupportedTranslations("de").learnMore).toBe(
        "Mehr über Browserkompatibilität erfahren",
      );
      expect(getBrowserUnsupportedTranslations("es-MX").title).toBe(
        "Navegador no compatible",
      );
      expect(getBrowserUnsupportedTranslations("fr-FR").title).toBe(
        "Navigateur non pris en charge",
      );
      expect(getBrowserUnsupportedTranslations("it").title).toBe(
        "Browser non supportato",
      );
      expect(getBrowserUnsupportedTranslations("nl-NL").title).toBe(
        "Browser niet ondersteund",
      );
      expect(getBrowserUnsupportedTranslations("pt-BR").title).toBe(
        "Navegador não suportado",
      );
    });

    it("should fall back to English for unknown languages", () => {
      const result = getBrowserUnsupportedTranslations("ja-JP");
      expect(result.title).toBe("Browser Not Supported");
      expect(result.learnMore).toBe("Learn more about browser compatibility");
    });
  });

  describe("isBrowserSupported", () => {
    it("should return true in the test runner environment", () => {
      expect(isBrowserSupported(window)).toBeTrue();
    });

    it("should return false if window is undefined or null", () => {
      expect(isBrowserSupported(undefined)).toBeFalse();
      expect(isBrowserSupported(null)).toBeFalse();
    });

    it("should return false if CSS or CSS.supports is missing", () => {
      const mockWin = {
        CSS: undefined,
      };
      expect(isBrowserSupported(mockWin)).toBeFalse();

      const mockWinNoSupports = {
        CSS: {},
      };
      expect(isBrowserSupported(mockWinNoSupports)).toBeFalse();
    });

    it("should return false if CSS custom properties are not supported", () => {
      const mockWin = {
        CSS: {
          supports: (_prop: string, _val: string) => false,
        },
      };
      expect(isBrowserSupported(mockWin)).toBeFalse();
    });
  });

  describe("renderUnsupportedBrowserBanner", () => {
    it("should return null if document is null or undefined", () => {
      expect(renderUnsupportedBrowserBanner(undefined as any)).toBeNull();
    });

    it("should create overlay element in document.body", () => {
      const el = renderUnsupportedBrowserBanner(document, "en");
      expect(el).not.toBeNull();
      expect(document.getElementById("rc-unsupported-browser-overlay")).toBe(
        el,
      );

      expect(el?.getAttribute("role")).toBe("alert");
      expect(el?.getAttribute("aria-live")).toBe("assertive");
      expect(el?.querySelector(".rc-unsupported-title")?.textContent).toBe(
        "Browser Not Supported",
      );
      expect(el?.querySelector(".rc-unsupported-desc")?.textContent).toContain(
        "Race Coordinator AI requires a modern web browser",
      );
      expect(el?.querySelector(".rc-unsupported-reqs")?.textContent).toContain(
        "Android 9+",
      );
      expect(el?.querySelector(".rc-unsupported-reqs")?.textContent).toContain(
        "Windows 7+",
      );
      const link = el?.querySelector(
        ".rc-unsupported-learn-more",
      ) as HTMLAnchorElement;
      expect(link).not.toBeNull();
      expect(link?.textContent).toContain(
        "Learn more about browser compatibility",
      );
      expect(link?.getAttribute("href")).toContain(
        "troubleshooting/#browser-compatibility",
      );
      expect(link?.getAttribute("target")).toBe("_blank");
    });

    it("should render localized overlay according to specified language", () => {
      const el = renderUnsupportedBrowserBanner(document, "de");
      expect(el?.querySelector(".rc-unsupported-title")?.textContent).toBe(
        "Browser nicht unterstützt",
      );
      expect(el?.querySelector(".rc-unsupported-desc")?.textContent).toContain(
        "Race Coordinator AI erfordert einen modernen Webbrowser",
      );
      const link = el?.querySelector(
        ".rc-unsupported-learn-more",
      ) as HTMLAnchorElement;
      expect(link?.textContent).toContain(
        "Mehr über Browserkompatibilität erfahren",
      );
      expect(link?.getAttribute("href")).toContain(
        "/de/troubleshooting/#browser-compatibility",
      );
    });

    it("should return existing element and not duplicate if called multiple times", () => {
      const first = renderUnsupportedBrowserBanner(document, "en");
      const second = renderUnsupportedBrowserBanner(document, "de");
      expect(second).toBe(first);
      const overlays = document.querySelectorAll(
        "#rc-unsupported-browser-overlay",
      );
      expect(overlays.length).toBe(1);
    });
  });
});
