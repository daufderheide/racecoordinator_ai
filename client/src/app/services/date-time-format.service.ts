import { inject, Injectable } from "@angular/core";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

export type DateFormatPreset =
  | "short"
  | "shortDate"
  | "medium"
  | "mediumDate"
  | "shortTime"
  | "mediumTime";

export type DateInput =
  | Date
  | number
  | string
  | { toNumber?: () => number }
  | null
  | undefined;

@Injectable({
  providedIn: "root",
})
export class DateTimeFormatService {
  private translationService = inject(TranslationService);
  private settingsService = inject(SettingsService);

  /**
   * Resolves the BCP 47 locale to use for formatting.
   * - If a specific language is set in application settings (e.g. 'de', 'es', 'fr'),
   *   we use that language (or preserve regional subtag if the browser matches, e.g. 'de-AT').
   * - If language is 'en' or unset (auto), we check navigator.language so regional English
   *   locales (like 'en-AU' -> DD/MM/YYYY, 'en-GB' -> DD/MM/YYYY, 'en-US' -> MM/DD/YYYY)
   *   are respected.
   */
  getResolvedLocale(): string {
    const rawSetting = this.settingsService?.getSettings?.()?.language;
    const currentLang =
      rawSetting && rawSetting.trim() !== ""
        ? rawSetting.trim()
        : this.translationService?.getCurrentLanguageValue?.() || "en";

    const browserLocale =
      typeof navigator !== "undefined"
        ? navigator.language || (navigator as any).userLanguage || "en-US"
        : "en-US";

    if (!currentLang || currentLang === "en") {
      // If browser is English variant (e.g. en-AU, en-GB, en-US, en-CA), respect it
      if (browserLocale.toLowerCase().startsWith("en")) {
        return browserLocale;
      }
      return "en-US";
    }

    // If browser matches current language prefix (e.g., current is 'de' and browser is 'de-AT'),
    // use browser's regional locale
    if (browserLocale.toLowerCase().startsWith(currentLang.toLowerCase())) {
      return browserLocale;
    }

    return currentLang;
  }

  /**
   * Parses input into a valid Date object, or returns null if invalid/empty.
   */
  parseDate(value: DateInput): Date | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (
      typeof value === "object" &&
      typeof (value as any).toNumber === "function"
    ) {
      const num = (value as any).toNumber();
      if (isNaN(num) || num <= 0) return null;
      const d = new Date(num);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "number") {
      if (isNaN(value) || value <= 0) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
      const num = Number(value);
      if (!isNaN(num) && num > 0) {
        const d = new Date(num);
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  /**
   * Resolves options for a preset name.
   */
  private getOptionsForPreset(
    preset: DateFormatPreset,
  ): Intl.DateTimeFormatOptions {
    switch (preset) {
      case "short":
        return { dateStyle: "short", timeStyle: "short" };
      case "shortDate":
        return { dateStyle: "short" };
      case "medium":
        return { dateStyle: "medium", timeStyle: "medium" };
      case "mediumDate":
        return { dateStyle: "medium" };
      case "shortTime":
        return { timeStyle: "short" };
      case "mediumTime":
        return { timeStyle: "medium" };
      default:
        return { dateStyle: "short", timeStyle: "short" };
    }
  }

  /**
   * Formats a date, timestamp, or date string into a localized string.
   */
  format(
    value: DateInput,
    presetOrOptions: DateFormatPreset | Intl.DateTimeFormatOptions = "short",
    fallback: string = "",
    localeOverride?: string,
  ): string {
    const date = this.parseDate(value);
    if (!date) {
      return fallback;
    }

    const locale = localeOverride || this.getResolvedLocale();
    const options: Intl.DateTimeFormatOptions =
      typeof presetOrOptions === "string"
        ? this.getOptionsForPreset(presetOrOptions)
        : presetOrOptions;

    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch {
      // Fallback in case of an invalid locale string
      return new Intl.DateTimeFormat("en-US", options).format(date);
    }
  }

  /**
   * Formats localized date only.
   */
  formatDate(
    value: DateInput,
    style: "short" | "medium" = "short",
    fallback: string = "",
    localeOverride?: string,
  ): string {
    return this.format(
      value,
      style === "medium" ? "mediumDate" : "shortDate",
      fallback,
      localeOverride,
    );
  }

  /**
   * Formats localized date and time.
   */
  formatDateTime(
    value: DateInput,
    style: "short" | "medium" = "short",
    fallback: string = "",
    localeOverride?: string,
  ): string {
    return this.format(value, style, fallback, localeOverride);
  }

  /**
   * Formats localized time only.
   */
  formatTime(
    value: DateInput,
    style: "short" | "medium" = "short",
    fallback: string = "",
    localeOverride?: string,
  ): string {
    return this.format(
      value,
      style === "medium" ? "mediumTime" : "shortTime",
      fallback,
      localeOverride,
    );
  }
}
