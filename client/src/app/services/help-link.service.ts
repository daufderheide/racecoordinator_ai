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
  private onlineReachable = true;

  constructor(
    private translationService: TranslationService,
    private analyticsService: AnalyticsService,
  ) {
    this.initReachabilityListener();
  }

  private initReachabilityListener(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.checkOnlineReachability());
      window.addEventListener("offline", () => {
        this.onlineReachable = false;
      });
      if (typeof navigator !== "undefined" && navigator.onLine) {
        this.checkOnlineReachability();
      } else {
        this.onlineReachable = false;
      }
    }
  }

  /**
   * Checks whether the online documentation site is reachable.
   * Updates internal reachability state so offline fallback is used
   * if internet connection is down even when local network adapter is active.
   */
  checkOnlineReachability(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.onLine) {
      this.onlineReachable = false;
      return Promise.resolve(false);
    }
    if (typeof fetch !== "undefined") {
      return fetch(`${this.ONLINE_BASE}/`, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      })
        .then(() => {
          this.onlineReachable = true;
          return true;
        })
        .catch(() => {
          this.onlineReachable = false;
          return false;
        });
    }
    return Promise.resolve(this.onlineReachable);
  }

  /**
   * Opens the help article for the given topic in a new browser tab.
   *
   * @param article The article slug (e.g., 'race-editor', 'track-editor').
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
    const base = isOnline ? this.ONLINE_BASE : this.getOfflineBase();

    // English is the default locale (no prefix), other languages get /lang/ prefix
    const langPrefix = lang === "en" ? "" : `/${lang}`;
    const articlePath = article ? `${article}/` : "";
    return `${base}${langPrefix}/${articlePath}${fragment}`;
  }

  /**
   * Returns the base path for offline help.
   * When developing on the Angular dev server (port 4200), points to the backend server (port 7070).
   * Otherwise uses the relative /help path served by Javalin.
   */
  getOfflineBase(): string {
    if (typeof window !== "undefined" && window.location.port === "4200") {
      return `${window.location.protocol}//${window.location.hostname}:7070${this.OFFLINE_PATH}`;
    }
    return this.OFFLINE_PATH;
  }

  /**
   * Check for internet connectivity using the browser's navigator.onLine API
   * combined with the online documentation reachability probe.
   * If either reports offline, the offline installed help is used.
   */
  isOnline(): boolean {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    return this.onlineReachable;
  }
}
