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
  private eventQueue: any[] = [];
  private configLoaded: boolean = false;

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private dataService: DataService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.ensureGtagFallback();
  }

  private ensureGtagFallback() {
    const window = this.document.defaultView as any;
    if (window && typeof window.gtag === "undefined") {
      console.info("Analytics: Defining global gtag fallback function.");
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
  }

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
    console.debug("Analytics: updateOptOutStatus called", {
      metricsEnabled: this.metricsEnabled,
      scriptLoaded: this.scriptLoaded,
    });

    if (this.metricsEnabled && !this.scriptLoaded) {
      this.loadGoogleAnalyticsScript();
    }
  }

  private loadGoogleAnalyticsScript() {
    console.info("Analytics: loadGoogleAnalyticsScript called");
    this.scriptLoaded = true;

    this.dataService.getServerAnalyticsConfig().subscribe({
      next: (config) => {
        console.info("Analytics: Received config from server", {
          measurementId: !!config.measurementId,
          clientId: !!config.clientId,
        });
        if (config.measurementId) {
          this.measurementId = config.measurementId;
        }

        if (!this.measurementId) {
          console.warn(
            "Analytics enabled but no Measurement ID is configured on the server. Aborting script injection.",
          );
          return;
        }

        const clientId = config.clientId;
        console.info("Analytics: Configuring GTAG for ID", this.measurementId);

        // Push config to dataLayer immediately via fallback
        const window = this.document.defaultView as any;
        if (window && typeof window.gtag === "function") {
          console.info("Analytics: Pushing initial config to dataLayer");
          window.gtag("js", new Date());
          window.gtag("config", this.measurementId, {
            send_page_view: false,
            client_id: clientId, // Linked to the server-generated client ID
          });
        }

        const script1 = this.document.createElement("script");
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        script1.onload = () =>
          console.info("Analytics: GTAG library script loaded successfully.");
        script1.onerror = (e) =>
          console.error("Analytics: GTAG library script failed to load.", e);
        this.document.head.appendChild(script1);

        this.configLoaded = true;
        this.processQueue();
      },
      error: (err) => {
        console.warn(
          "Failed to fetch server tracking ID, falling back to local.",
          err,
        );
        this.configLoaded = true; // Proceed with whatever we have
        this.processQueue();
        if (!this.measurementId) return;

        // Fallback without client_id
        if (!this.measurementId) return;

        const window = this.document.defaultView as any;
        if (window && typeof window.gtag === "function") {
          window.gtag("js", new Date());
          window.gtag("config", this.measurementId, { send_page_view: false });
        }

        const script1 = this.document.createElement("script");
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        this.document.head.appendChild(script1);
      },
    });
  }

  private trackPageView(url: string) {
    if (!this.metricsEnabled) {
      console.debug("Analytics: Page view skipped (metrics disabled)");
      return;
    }

    if (!this.configLoaded) {
      console.info(
        "Analytics: Queueing page view event until config is loaded",
        { url },
      );
      this.eventQueue.push({ type: "page_view", url });
      return;
    }

    try {
      const window = this.document.defaultView as any;
      const title = this.document.title || "Race Coordinator AI";
      const fullUrl = window ? window.location.origin + url : url;

      console.info("Analytics: Tracking page view", {
        url,
        title,
        measurementId: this.measurementId,
      });
      gtag("event", "page_view", {
        page_path: url,
        page_location: fullUrl,
        page_title: title,
        send_to: this.measurementId, // Explicitly send to our measurement ID
      });
    } catch (e) {
      console.warn("Analytics: Error in trackPageView", e);
    }
  }

  // Click Event Tracking
  public trackClick(eventName: string, params: Record<string, any> = {}) {
    if (!this.metricsEnabled) return;

    if (!this.configLoaded) {
      console.info("Analytics: Queueing click event until config is loaded", {
        eventName,
      });
      this.eventQueue.push({ type: "click", eventName, params });
      return;
    }

    try {
      gtag("event", eventName, {
        ...params,
        event_category: "engagement",
        event_label: "button_click",
        send_to: this.measurementId,
      });
    } catch (e) {
      console.warn("Analytics: Error in trackClick", e);
    }
  }

  private processQueue() {
    if (this.eventQueue.length === 0) return;
    console.info(
      `Analytics: Processing ${this.eventQueue.length} queued events`,
    );
    const queue = [...this.eventQueue];
    this.eventQueue = [];
    queue.forEach((event) => {
      if (event.type === "page_view") {
        this.trackPageView(event.url);
      } else if (event.type === "click") {
        this.trackClick(event.eventName, event.params);
      }
    });
  }
}
