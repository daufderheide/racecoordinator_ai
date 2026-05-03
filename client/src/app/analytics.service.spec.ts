import { DOCUMENT } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { NavigationEnd, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

import { AnalyticsService } from "./analytics.service";
import { DataService } from "./data.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let mockRouter: any;
  let mockSettingsService: any;
  let mockDocument: any;
  let routerEventsSubject: Subject<any>;
  let mockSettings: Settings;
  let mockDataService: any;
  let mockLoggerService: any;

  beforeEach(() => {
    // Ensure global gtag and dataLayer are clean before each test
    delete (window as any).gtag;
    delete (window as any).dataLayer;

    routerEventsSubject = new Subject<any>();
    mockRouter = {
      events: routerEventsSubject.asObservable(),
    };

    mockSettings = new Settings();
    mockSettings.shareAnalytics = true; // Default to true

    mockSettingsService = {
      getSettings: jasmine
        .createSpy("getSettings")
        .and.callFake(() => mockSettings),
    };

    const analyticsConfigSubject = new Subject<any>();
    mockDataService = {
      getServerAnalyticsConfig: jasmine
        .createSpy("getServerAnalyticsConfig")
        .and.returnValue(analyticsConfigSubject.asObservable()),
      getRecordData: jasmine
        .createSpy("getRecordData")
        .and.returnValue(of(null)),
      _analyticsConfigSubject: analyticsConfigSubject, // Expose for testing control
    };

    mockLoggerService = {
      debug: jasmine.createSpy("debug"),
      info: jasmine.createSpy("info"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
    };

    // Create a robust mock for Document that catches createElement and appendChild
    const mockHead = {
      appendChild: jasmine.createSpy("appendChild"),
    };

    // Maintain a list of created elements to verify their attributes
    const createdElements: any[] = [];

    mockDocument = {
      head: mockHead,
      defaultView: window,
      createElement: jasmine
        .createSpy("createElement")
        .and.callFake((tagName: string) => {
          const el = { tagName, src: "", async: false, innerHTML: "" };
          createdElements.push(el);
          return el;
        }),
      _createdElements: createdElements, // Expose for testing assertions
    };
    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: DataService, useValue: mockDataService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  it("should be created and define gtag fallback", () => {
    expect(service).toBeTruthy();
    const window = mockDocument.defaultView;
    expect(window.gtag).toBeDefined();
    expect(window.dataLayer).toBeDefined();

    // Verify fallback function pushes to dataLayer
    window.gtag("event", "test_event");
    expect(window.dataLayer.length).toBeGreaterThan(0);
    expect(window.dataLayer[0][0]).toBe("event");
    expect(window.dataLayer[0][1]).toBe("test_event");
  });

  describe("ensureGtagFallback", () => {
    it("should not overwrite existing gtag", () => {
      const existingGtag = jasmine.createSpy("existingGtag");
      mockDocument.defaultView.gtag = existingGtag;

      // Access private method for testing or just rely on constructor call
      (service as any).ensureGtagFallback();

      expect(mockDocument.defaultView.gtag).toBe(existingGtag);
    });
  });

  describe("initTracking", () => {
    it("should inject Google Analytics scripts and call config in correct order", () => {
      mockSettings.shareAnalytics = true;
      const window = mockDocument.defaultView;
      const gtagSpy = spyOn(window, "gtag").and.callThrough();

      service.initTracking();

      // Resolve config
      mockDataService._analyticsConfigSubject.next({
        clientId: "test-client-id-123",
        measurementId: "G-TEST12345",
      });

      // Should have checked settings
      expect(mockSettingsService.getSettings).toHaveBeenCalled();

      // Verify call order: js, then config
      const calls = gtagSpy.calls.all();
      expect(calls.length).toBeGreaterThanOrEqual(2);
      expect(calls[0].args[0]).toBe("js");
      expect(calls[1].args).toEqual([
        "config",
        "G-TEST12345",
        {
          send_page_view: false,
          client_id: "test-client-id-123",
        },
      ]);

      // Should have injected the GTAG library script into the document head
      expect(mockDocument.createElement).toHaveBeenCalledWith("script");
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(1);
    });

    it("should NOT inject Google Analytics scripts if measurementId is completely missing/empty", () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();

      // Resolve config with empty ID
      mockDataService._analyticsConfigSubject.next({
        clientId: "test-client-id-123",
        measurementId: "",
      });

      // No script should be appended
      expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
    });

    it("should NOT inject Google Analytics scripts into DOM when shareAnalytics is false", () => {
      mockSettings.shareAnalytics = false;
      service.initTracking();

      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
    });

    it("should only inject scripts once even if called multiple times", () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();
      mockDataService._analyticsConfigSubject.next({
        clientId: "test-client-id-123",
        measurementId: "G-TEST12345",
      });
      service.updateOptOutStatus();
      service.updateOptOutStatus();

      // Even after 3 updates, it should only create/append 1 script total
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        jasmine.stringMatching("Analytics: updateOptOutStatus called"),
        jasmine.any(Object),
      );
    });
  });

  describe("trackPageView", () => {
    it("should automatically dispatch page_view events when navigating router if enabled", () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();

      // Once initTracking is called, gtag is guaranteed to exist via constructor
      spyOn(window as any, "gtag").and.callThrough();

      // Initial navigation while config is still pending
      routerEventsSubject.next(
        new NavigationEnd(1, "/fake-url", "/fake-redirect-url"),
      );

      // gtag should NOT have been called yet for the event
      expect((window as any).gtag).not.toHaveBeenCalledWith(
        "event",
        "page_view",
        jasmine.any(Object),
      );

      // Resolve config
      mockDataService._analyticsConfigSubject.next({
        clientId: "test-client-id-123",
        measurementId: "G-TEST12345",
      });

      expect((window as any).gtag).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/fake-redirect-url",
        page_location: jasmine.stringMatching("/fake-redirect-url"),
        page_title: jasmine.any(String),
        send_to: "G-TEST12345",
      });
    });

    it("should completely suppress page_view events if tracking is disabled", () => {
      mockSettings.shareAnalytics = false;
      service.initTracking();

      spyOn(window as any, "gtag").and.callThrough();

      routerEventsSubject.next(
        new NavigationEnd(1, "/fake-url", "/fake-redirect-url"),
      );

      expect((window as any).gtag).not.toHaveBeenCalled();
    });
  });

  describe("trackClick", () => {
    it("should queue custom GA events until config is loaded", () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();

      spyOn(window as any, "gtag").and.callThrough();

      service.trackClick("btn_demo", { is_demo: true });

      // Should not be called yet
      expect((window as any).gtag).not.toHaveBeenCalledWith(
        "event",
        "btn_demo",
        jasmine.any(Object),
      );

      // Resolve config
      mockDataService._analyticsConfigSubject.next({
        clientId: "test-client-id-123",
        measurementId: "G-TEST12345",
      });

      expect((window as any).gtag).toHaveBeenCalledWith("event", "btn_demo", {
        is_demo: true,
        event_category: "engagement",
        event_label: "button_click",
        send_to: "G-TEST12345",
      });
    });

    it("should suppress custom GA events when tracking is disabled", () => {
      mockSettings.shareAnalytics = false;
      service.initTracking(); // Init to pull settings

      spyOn(window as any, "gtag").and.callThrough();

      service.trackClick("btn_demo", { is_demo: true });

      expect((window as any).gtag).not.toHaveBeenCalled();
    });
  });
});
