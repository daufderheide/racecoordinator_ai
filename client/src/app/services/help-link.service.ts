import { Injectable } from "@angular/core";
import { AnalyticsService } from "@app/analytics.service";

import { TranslationService } from "./translation.service";

/**
 * Service for opening help center articles in a new browser tab.
 *
 * Builds localized URLs pointing to the MkDocs Material help site
 * hosted on GitHub Pages (online) or served locally by Javalin (offline).
 *
 * English articles use the base URL directly (e.g., /race-editor/).
 * Other languages use a locale prefix (e.g., /es/race-editor/).
 */
@Injectable({
  providedIn: "root",
})
export class HelpLinkService {
  private readonly ONLINE_BASE =
    "https://daufderheide.github.io/racecoordinator_ai";
  private readonly OFFLINE_PATH = "/help";

  constructor(
    private translationService: TranslationService,
    private analyticsService: AnalyticsService,
  ) {}

  /**
   * Opens the help article for the given topic in a new browser tab.
   *
   * @param article The article slug (e.g., 'race-editor', 'track-manager').
   *                Must match the Markdown filename without extension.
   * @param section Optional anchor to scroll to (e.g., 'heat-rotation-format').
   *                Must match a heading permalink in the article.
   */
  openHelp(article: string, section?: string): void {
    const url = this.buildHelpUrl(article, section);
    this.analyticsService.trackClick("help_center_link_clicked", {
      article,
      section,
      url,
    });
    window.open(url, "_blank");
  }

  /**
   * Builds the full URL for a help article, choosing online or offline
   * base and applying the user's current language prefix.
   */
  buildHelpUrl(article: string, section?: string): string {
    const fragment = section ? `#${section}` : "";
    const lang = this.translationService.getCurrentLanguageValue();
    const isOnline = this.isOnline();
    const base = isOnline ? this.ONLINE_BASE : this.OFFLINE_PATH;

    // English is the default locale (no prefix), other languages get /lang/ prefix
    const langPrefix = lang === "en" ? "" : `/${lang}`;
    const articlePath = article ? `${article}/` : "";
    return `${base}${langPrefix}/${articlePath}${fragment}`;
  }

  /**
   * Quick check for internet connectivity using the browser's navigator.onLine API.
   * This is a heuristic — it can report false positives on captive portals,
   * but is sufficient for choosing between online and local help URLs.
   */
  isOnline(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine;
  }
}
