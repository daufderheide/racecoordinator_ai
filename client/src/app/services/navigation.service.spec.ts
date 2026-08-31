import { TestBed } from "@angular/core/testing";
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
} from "@angular/router";
import { Subject } from "rxjs";

import { NavigationService } from "./navigation.service";

describe("NavigationService", () => {
  let service: NavigationService;
  let routerEvents: Subject<any>;
  let mockRouter: any;

  beforeEach(() => {
    routerEvents = new Subject<any>();
    mockRouter = {
      events: routerEvents.asObservable(),
    };

    TestBed.configureTestingModule({
      providers: [NavigationService, { provide: Router, useValue: mockRouter }],
    });
    service = TestBed.inject(NavigationService);
    service.resetHistory();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should detect forward navigation initially", () => {
    routerEvents.next(new NavigationEnd(1, "/page1", "/page1"));
    expect(service.getDirection()).toBe("forward");
  });

  it("should detect backward navigation when returning to previous URL", () => {
    // 1. Move to Page 1
    routerEvents.next(new NavigationEnd(1, "/page1", "/page1"));
    // 2. Move to Page 2
    routerEvents.next(new NavigationEnd(2, "/page2", "/page2"));
    expect(service.getDirection()).toBe("forward");

    // 3. Move back to Page 1
    routerEvents.next(new NavigationEnd(3, "/page1", "/page1"));
    expect(service.getDirection()).toBe("backward");
  });

  it("should maintain forward direction for new pages in sequence", () => {
    routerEvents.next(new NavigationEnd(1, "/page1", "/page1"));
    routerEvents.next(new NavigationEnd(2, "/page2", "/page2"));
    routerEvents.next(new NavigationEnd(3, "/page3", "/page3"));
    expect(service.getDirection()).toBe("forward");
  });

  it("should correctly handle history stack popping", () => {
    routerEvents.next(new NavigationEnd(1, "/page1", "/page1"));
    routerEvents.next(new NavigationEnd(2, "/page2", "/page2"));
    routerEvents.next(new NavigationEnd(3, "/page1", "/page1")); // Back to 1
    expect(service.getDirection()).toBe("backward");

    routerEvents.next(new NavigationEnd(4, "/page2", "/page2")); // Forward to 2 again
    expect(service.getDirection()).toBe("forward");
  });

  it("should track previous URL correctly during navigation", () => {
    expect(service.getPreviousUrl()).toBeNull();

    // 1. Move to Page 1
    routerEvents.next(new NavigationEnd(1, "/page1", "/page1"));
    expect(service.getPreviousUrl()).toBeNull();

    // 2. Move to Page 2
    routerEvents.next(new NavigationEnd(2, "/page2", "/page2"));
    expect(service.getPreviousUrl()).toBe("/page1");

    // 3. Move back to Page 1
    routerEvents.next(new NavigationEnd(3, "/page1", "/page1"));
    expect(service.getPreviousUrl()).toBe("/page2");
  });

  describe("Browser Back/Forward History Tracking", () => {
    it("should initially not allow going back or forward", () => {
      service.resetHistory();
      expect(service.canGoBack()).toBeFalse();
      expect(service.canGoForward()).toBeFalse();
    });

    it("should allow going back after advancing to a second page", () => {
      routerEvents.next(new NavigationEnd(1, "/home", "/home"));
      expect(service.canGoBack()).toBeFalse();
      expect(service.canGoForward()).toBeFalse();

      routerEvents.next(
        new NavigationEnd(2, "/driver-manager", "/driver-manager"),
      );
      expect(service.canGoBack()).toBeTrue();
      expect(service.canGoForward()).toBeFalse();
    });

    it("should allow going forward after navigating back", () => {
      routerEvents.next(new NavigationEnd(1, "/home", "/home"));
      routerEvents.next(
        new NavigationEnd(2, "/driver-manager", "/driver-manager"),
      );
      routerEvents.next(
        new NavigationEnd(3, "/driver-editor", "/driver-editor"),
      );

      // Simulate back to /driver-manager
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: { appHistoryIndex: 1 } }),
      );
      routerEvents.next(
        new NavigationEnd(4, "/driver-manager", "/driver-manager"),
      );

      expect(service.canGoBack()).toBeTrue();
      expect(service.canGoForward()).toBeTrue();
    });

    it("should disable canGoBack when back at initial entry (index 0)", () => {
      routerEvents.next(new NavigationEnd(1, "/home", "/home"));
      routerEvents.next(
        new NavigationEnd(2, "/driver-manager", "/driver-manager"),
      );

      // Back to home
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: { appHistoryIndex: 0 } }),
      );
      routerEvents.next(new NavigationEnd(3, "/home", "/home"));

      expect(service.canGoBack()).toBeFalse();
      expect(service.canGoForward()).toBeTrue();
    });

    it("should call window.history.back when goBack is invoked", () => {
      routerEvents.next(new NavigationEnd(1, "/home", "/home"));
      routerEvents.next(
        new NavigationEnd(2, "/driver-manager", "/driver-manager"),
      );

      spyOn(window.history, "back");
      service.goBack();
      expect(window.history.back).toHaveBeenCalled();
    });

    it("should not call window.history.back when canGoBack is false", () => {
      service.resetHistory();
      spyOn(window.history, "back");
      service.goBack();
      expect(window.history.back).not.toHaveBeenCalled();
    });

    it("should call window.history.forward when goForward is invoked", () => {
      routerEvents.next(new NavigationEnd(1, "/home", "/home"));
      routerEvents.next(
        new NavigationEnd(2, "/driver-manager", "/driver-manager"),
      );

      window.dispatchEvent(
        new PopStateEvent("popstate", { state: { appHistoryIndex: 0 } }),
      );
      routerEvents.next(new NavigationEnd(3, "/home", "/home"));

      spyOn(window.history, "forward");
      service.goForward();
      expect(window.history.forward).toHaveBeenCalled();
    });

    it("should not call window.history.forward when canGoForward is false", () => {
      service.resetHistory();
      spyOn(window.history, "forward");
      service.goForward();
      expect(window.history.forward).not.toHaveBeenCalled();
    });

    it("should handle NavigationCancel and NavigationError without breaking state", () => {
      routerEvents.next(
        new NavigationCancel(1, "/protected", "guard rejection"),
      );
      routerEvents.next(new NavigationError(2, "/error", new Error("fail")));
      expect(service.canGoBack()).toBeFalse();
    });
  });

  describe("lastEditedId management", () => {
    it("should set and retrieve last edited ID by entity type", () => {
      service.setLastEditedId("track", "track-123");
      expect(service.getLastEditedId("track")).toBe("track-123");
    });

    it("should return null for unset entity types", () => {
      expect(service.getLastEditedId("race")).toBeNull();
    });

    it("should separate IDs by entity type", () => {
      service.setLastEditedId("track", "track-123");
      service.setLastEditedId("driver", "driver-456");

      expect(service.getLastEditedId("track")).toBe("track-123");
      expect(service.getLastEditedId("driver")).toBe("driver-456");
    });

    it("should clear last edited ID", () => {
      service.setLastEditedId("team", "team-789");
      expect(service.getLastEditedId("team")).toBe("team-789");

      service.clearLastEditedId("team");
      expect(service.getLastEditedId("team")).toBeNull();
    });
  });
});
