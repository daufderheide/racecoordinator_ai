import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { filter } from "rxjs/operators";
import { SettingsService } from "src/app/services/settings.service";

import { DataService } from "./data.service";

// Declare standard gtag function
declare const gtag: Function;

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private metricsEnabled: boolean = false;
  private measurementId: string = "";
  private scriptLoaded: boolean = false;

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private dataService: DataService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  public isEnabled(): boolean {
    return this.settingsService.getSettings().shareAnalytics;
  }

  public toggleAnalytics(): Observable<{
    success: boolean;
    titleKey?: string;
    messageKey?: string;
  }> {
    const settings = this.settingsService.getSettings();
    const newValue = !settings.shareAnalytics;
    settings.shareAnalytics = newValue;
    this.settingsService.saveSettings(settings);
    this.updateOptOutStatus();

    const serverIp = settings.serverIp?.toLowerCase();
    const isLocal =
      serverIp === "localhost" ||
      serverIp === "127.0.0.1" ||
      serverIp === "0.0.0.0" ||
      serverIp === "::1" ||
      serverIp === "0:0:0:0:0:0:0:1" ||
      !serverIp;

    if (isLocal) {
      return this.dataService.toggleServerAnalytics(newValue).pipe(
        map(() => ({ success: true })),
        catchError((err) => {
          console.error("Failed to synchronize server analytics setting", err);
          return of({
            success: false,
            titleKey: newValue
              ? "RDS_ANALYTICS_ENABLED_TITLE"
              : "RDS_ANALYTICS_DISABLED_TITLE",
            messageKey: "RDS_ANALYTICS_SYNC_ERROR",
          });
        }),
      );
    } else {
      return of({ success: true });
    }
  }

  public initTracking() {
    this.updateOptOutStatus();

    // 1. Setup Page View tracking on Router changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  public updateOptOutStatus() {
    const settings = this.settingsService.getSettings();
    this.metricsEnabled = settings.shareAnalytics;

    if (this.metricsEnabled && !this.scriptLoaded) {
      this.loadGoogleAnalyticsScript();
    }
  }

  private loadGoogleAnalyticsScript() {
    this.scriptLoaded = true;

    this.dataService.getServerAnalyticsConfig().subscribe({
      next: (config) => {
        if (config.measurementId) {
          this.measurementId = config.measurementId;
        }

        if (!this.measurementId) {
          console.warn(
            "Analytics enabled but no Measurement ID is configured on the server.",
          );
          return;
        }

        const clientId = config.clientId;

        const script1 = this.document.createElement("script");
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        this.document.head.appendChild(script1);

        const script2 = this.document.createElement("script");
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${this.measurementId}', { 
            send_page_view: false,
            client_id: '${clientId}'
          });
        `;
        this.document.head.appendChild(script2);
      },
      error: (err) => {
        console.warn(
          "Failed to fetch server tracking ID, falling back to local.",
          err,
        );
        if (!this.measurementId) return;

        // Fallback without client_id
        const script1 = this.document.createElement("script");
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        this.document.head.appendChild(script1);

        const script2 = this.document.createElement("script");
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${this.measurementId}', { send_page_view: false });
        `;
        this.document.head.appendChild(script2);
      },
    });
  }

  private trackPageView(url: string) {
    if (!this.metricsEnabled) return;

    try {
      if (typeof gtag !== "undefined") {
        // Since we initialized with send_page_view: false, we explicitly
        // trigger a page_view event on router navigation.
        gtag("event", "page_view", {
          page_path: url,
        });
      }
    } catch (e) {
      console.warn("Analytics not initialized properly");
    }
  }

  // Click Event Tracking
  public trackClick(eventName: string, params: Record<string, any> = {}) {
    if (!this.metricsEnabled) return;

    try {
      if (typeof gtag !== "undefined") {
        gtag("event", eventName, {
          ...params,
          event_category: "engagement",
          event_label: "button_click",
        });
      }
    } catch (e) {
      console.warn("Analytics not initialized properly");
    }
  }
}
