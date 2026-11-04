import { TestBed } from "@angular/core/testing";
import { AnalyticsService } from "@app/analytics.service";

import { HelpLinkService } from "./help-link.service";
import { TranslationService } from "./translation.service";

describe("HelpLinkService", () => {
  let service: HelpLinkService;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("TranslationService", [
      "getCurrentLanguageValue",
    ]);
    spy.getCurrentLanguageValue.and.returnValue("en");

    const analyticsSpy = jasmine.createSpyObj("AnalyticsService", [
      "trackClick",
    ]);

    TestBed.configureTestingModule({
      providers: [
        HelpLinkService,
        { provide: TranslationService, useValue: spy },
        { provide: AnalyticsService, useValue: analyticsSpy },
      ],
    });
    service = TestBed.inject(HelpLinkService);
    translationServiceSpy = TestBed.inject(
      TranslationService,
    ) as jasmine.SpyObj<TranslationService>;
    analyticsServiceSpy = TestBed.inject(
      AnalyticsService,
    ) as jasmine.SpyObj<AnalyticsService>;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("buildHelpUrl", () => {
    it("should build an online English URL with no language prefix", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");

      const url = service.buildHelpUrl("race-editor");
      expect(url).toBe(
        "https://daufderheide.github.io/racecoordinator_ai/race-editor/",
      );
    });

    it("should build an online URL with language prefix for non-English", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("es");

      const url = service.buildHelpUrl("race-editor");
      expect(url).toBe(
        "https://daufderheide.github.io/racecoordinator_ai/es/race-editor/",
      );
    });

    it("should include a section fragment when provided", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");

      const url = service.buildHelpUrl("race-editor", "heat-rotation-format");
      expect(url).toBe(
        "https://daufderheide.github.io/racecoordinator_ai/race-editor/#heat-rotation-format",
      );
    });

    it("should include both language prefix and section fragment", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("fr");

      const url = service.buildHelpUrl("track-editor", "arduino-setup");
      expect(url).toBe(
        "https://daufderheide.github.io/racecoordinator_ai/fr/track-editor/#arduino-setup",
      );
    });

    it("should build an offline URL when not online", () => {
      spyOn(service, "isOnline").and.returnValue(false);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");

      const url = service.buildHelpUrl("race-editor");
      expect(url).toBe("/help/race-editor/");
    });

    it("should build an offline URL with language prefix when not online", () => {
      spyOn(service, "isOnline").and.returnValue(false);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("de");

      const url = service.buildHelpUrl("track-editor");
      expect(url).toBe("/help/de/track-editor/");
    });

    it("should build an offline URL with section fragment when not online", () => {
      spyOn(service, "isOnline").and.returnValue(false);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("it");

      const url = service.buildHelpUrl("race-formats", "round-robin");
      expect(url).toBe("/help/it/race-formats/#round-robin");
    });

    it("should build an online root URL without double slashes for English", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");

      const url = service.buildHelpUrl("");
      expect(url).toBe("https://daufderheide.github.io/racecoordinator_ai/");
    });

    it("should build an online root URL without double slashes for non-English", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("es");

      const url = service.buildHelpUrl("");
      expect(url).toBe("https://daufderheide.github.io/racecoordinator_ai/es/");
    });

    it("should build an offline root URL without double slashes for English", () => {
      spyOn(service, "isOnline").and.returnValue(false);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");

      const url = service.buildHelpUrl("");
      expect(url).toBe("/help/");
    });

    it("should build an offline root URL without double slashes for non-English", () => {
      spyOn(service, "isOnline").and.returnValue(false);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("fr");

      const url = service.buildHelpUrl("");
      expect(url).toBe("/help/fr/");
    });
  });

  describe("openHelp", () => {
    it("should open a new browser tab with the correct URL and track the click", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");
      spyOn(window, "open");

      service.openHelp("race-editor");
      expect(window.open).toHaveBeenCalledWith(
        "https://daufderheide.github.io/racecoordinator_ai/race-editor/",
        "_blank",
      );
      expect(analyticsServiceSpy.trackClick).toHaveBeenCalledWith(
        "help_center_link_clicked",
        {
          article: "race-editor",
          section: undefined,
          url: "https://daufderheide.github.io/racecoordinator_ai/race-editor/",
        },
      );
    });

    it("should open help with section anchor and track the click", () => {
      spyOn(service, "isOnline").and.returnValue(true);
      translationServiceSpy.getCurrentLanguageValue.and.returnValue("en");
      spyOn(window, "open");

      service.openHelp("race-editor", "scoring-options");
      expect(window.open).toHaveBeenCalledWith(
        "https://daufderheide.github.io/racecoordinator_ai/race-editor/#scoring-options",
        "_blank",
      );
      expect(analyticsServiceSpy.trackClick).toHaveBeenCalledWith(
        "help_center_link_clicked",
        {
          article: "race-editor",
          section: "scoring-options",
          url: "https://daufderheide.github.io/racecoordinator_ai/race-editor/#scoring-options",
        },
      );
    });
  });

  describe("reachability and offline fallback", () => {
    it("should return false from isOnline when navigator is offline", () => {
      spyOnProperty(navigator, "onLine", "get").and.returnValue(false);
      expect(service.isOnline()).toBe(false);
    });

    it("should return true from isOnline when navigator is online and reachable", () => {
      spyOnProperty(navigator, "onLine", "get").and.returnValue(true);
      (service as any).onlineReachable = true;
      expect(service.isOnline()).toBe(true);
    });

    it("should return false from isOnline when navigator is online but reachable is false", () => {
      spyOnProperty(navigator, "onLine", "get").and.returnValue(true);
      (service as any).onlineReachable = false;
      expect(service.isOnline()).toBe(false);
    });

    it("should set onlineReachable to false when navigator is offline in checkOnlineReachability", () => {
      spyOnProperty(navigator, "onLine", "get").and.returnValue(false);
      (service as any).onlineReachable = true;
      service.checkOnlineReachability();
      expect((service as any).onlineReachable).toBe(false);
    });

    it("should probe online site and set onlineReachable to true on fetch success", async () => {
      spyOnProperty(navigator, "onLine", "get").and.returnValue(true);
      spyOn(window, "fetch").and.returnValue(Promise.resolve(new Response()));

      await service.checkOnlineReachability();

      expect((service as any).onlineReachable).toBe(true);
    });

    it("should probe online site and set onlineReachable to false on fetch failure", async () => {
      spyOnProperty(navigator, "onLine", "get").and.returnValue(true);
      spyOn(window, "fetch").and.returnValue(
        Promise.reject(new Error("Network Error")),
      );

      await service.checkOnlineReachability();

      expect((service as any).onlineReachable).toBe(false);
    });

    it("should handle window offline event", () => {
      (service as any).onlineReachable = true;
      window.dispatchEvent(new Event("offline"));
      expect((service as any).onlineReachable).toBe(false);
    });

    it("should return relative /help path from getOfflineBase when port is not 4200", () => {
      expect(service.getOfflineBase()).toBe("/help");
    });
  });
});
