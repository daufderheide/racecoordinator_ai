import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { FullscreenService } from "@app/services/fullscreen.service";
import { NavigationService } from "@app/services/navigation.service";

import { BrowserNavigationComponent } from "./browser-navigation.component";
import { BrowserNavigationHarness } from "./testing/browser-navigation.harness";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("BrowserNavigationComponent", () => {
  let component: BrowserNavigationComponent;
  let fixture: ComponentFixture<BrowserNavigationComponent>;
  let harness: BrowserNavigationHarness;

  let isFullscreenSubject: BehaviorSubject<boolean>;
  let canGoBackSubject: BehaviorSubject<boolean>;
  let canGoForwardSubject: BehaviorSubject<boolean>;

  let mockFullscreenService: any;
  let mockNavigationService: any;
  let mockRouter: any;

  beforeEach(async () => {
    isFullscreenSubject = new BehaviorSubject<boolean>(false);
    canGoBackSubject = new BehaviorSubject<boolean>(false);
    canGoForwardSubject = new BehaviorSubject<boolean>(false);

    mockFullscreenService = {
      isFullscreen$: isFullscreenSubject.asObservable(),
      isFullscreen: () => isFullscreenSubject.value,
    };

    mockNavigationService = {
      canGoBack$: canGoBackSubject.asObservable(),
      canGoForward$: canGoForwardSubject.asObservable(),
      canGoBack: () => canGoBackSubject.value,
      canGoForward: () => canGoForwardSubject.value,
      goBack: jasmine.createSpy("goBack"),
      goForward: jasmine.createSpy("goForward"),
    };

    mockRouter = {
      url: "/",
    };

    await TestBed.configureTestingModule({
      imports: [BrowserNavigationComponent, MockTranslatePipe],
      providers: [
        { provide: FullscreenService, useValue: mockFullscreenService },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowserNavigationComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      BrowserNavigationHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not be visible when not in fullscreen", async () => {
    isFullscreenSubject.next(false);
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeFalse();
  });

  it("should become visible when entering fullscreen", async () => {
    isFullscreenSubject.next(true);
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeTrue();
  });

  it("should disable back and forward buttons initially", async () => {
    isFullscreenSubject.next(true);
    canGoBackSubject.next(false);
    canGoForwardSubject.next(false);
    fixture.detectChanges();

    expect(await harness.isBackDisabled()).toBeTrue();
    expect(await harness.isForwardDisabled()).toBeTrue();
  });

  it("should enable back button when canGoBack is true", async () => {
    isFullscreenSubject.next(true);
    canGoBackSubject.next(true);
    canGoForwardSubject.next(false);
    fixture.detectChanges();

    expect(await harness.isBackDisabled()).toBeFalse();
    expect(await harness.isForwardDisabled()).toBeTrue();
  });

  it("should enable forward button when canGoForward is true", async () => {
    isFullscreenSubject.next(true);
    canGoBackSubject.next(false);
    canGoForwardSubject.next(true);
    fixture.detectChanges();

    expect(await harness.isBackDisabled()).toBeTrue();
    expect(await harness.isForwardDisabled()).toBeFalse();
  });

  it("should trigger goBack on navigationService when back button clicked", async () => {
    isFullscreenSubject.next(true);
    canGoBackSubject.next(true);
    fixture.detectChanges();

    await harness.clickBack();
    expect(mockNavigationService.goBack).toHaveBeenCalled();
  });

  it("should trigger goForward on navigationService when forward button clicked", async () => {
    isFullscreenSubject.next(true);
    canGoForwardSubject.next(true);
    fixture.detectChanges();

    await harness.clickForward();
    expect(mockNavigationService.goForward).toHaveBeenCalled();
  });

  describe("Close Mode", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("mode", "close");
      fixture.detectChanges();
    });

    it("should show close button and not forward/back buttons in fullscreen", async () => {
      isFullscreenSubject.next(true);
      fixture.detectChanges();

      expect(await harness.isVisible()).toBeTrue();
      expect(await harness.hasCloseButton()).toBeTrue();
      expect(await harness.hasBackButton()).toBeFalse();
      expect(await harness.hasForwardButton()).toBeFalse();
    });

    it("should not show close button when not in fullscreen", async () => {
      isFullscreenSubject.next(false);
      fixture.detectChanges();

      expect(await harness.isVisible()).toBeFalse();
      expect(await harness.hasCloseButton()).toBeFalse();
    });

    it("should call window.close and emit closeClick on clickClose", async () => {
      isFullscreenSubject.next(true);
      fixture.detectChanges();

      spyOn(window, "close");
      const closeSpy = jasmine.createSpy("closeClick");
      component.closeClick.subscribe(closeSpy);

      await harness.clickClose();

      expect(closeSpy).toHaveBeenCalled();
      expect(window.close).toHaveBeenCalled();
    });

    it("should exit fullscreen on closeWindow if document is in fullscreen", () => {
      const exitFsSpy = jasmine.createSpy("exitFullscreen");
      spyOnProperty(document, "fullscreenElement", "get").and.returnValue(
        document.body,
      );
      spyOn(document, "exitFullscreen").and.callFake(exitFsSpy);
      spyOn(window, "close");

      component.closeWindow();

      expect(exitFsSpy).toHaveBeenCalled();
      expect(window.close).toHaveBeenCalled();
    });
  });

  describe("Mode Auto-Detection", () => {
    it("should default to navigation mode when url is an editor or manager page", () => {
      fixture.componentRef.setInput("mode", undefined);
      mockRouter.url = "/race-editor";

      expect(component.effectiveMode()).toBe("navigation");
      expect(component.isCloseMode()).toBeFalse();
    });

    it("should auto-detect close mode when url includes heat-results", () => {
      fixture.componentRef.setInput("mode", undefined);
      mockRouter.url = "/heat-results";

      expect(component.effectiveMode()).toBe("close");
      expect(component.isCloseMode()).toBeTrue();
    });

    it("should auto-detect navigation mode for driver-station, driver-view, and theme urls", () => {
      fixture.componentRef.setInput("mode", undefined);
      mockRouter.url = "/driver-station";
      expect(component.effectiveMode()).toBe("navigation");
      expect(component.isCloseMode()).toBeFalse();

      mockRouter.url = "/driver-view";
      expect(component.effectiveMode()).toBe("navigation");
      expect(component.isCloseMode()).toBeFalse();

      mockRouter.url = "/default-raceday?themeId=custom-theme-1";
      expect(component.effectiveMode()).toBe("navigation");
      expect(component.isCloseMode()).toBeFalse();
    });

    it("should prioritize explicit mode over auto-detection", () => {
      fixture.componentRef.setInput("mode", "navigation");
      mockRouter.url = "/heat-results";

      expect(component.effectiveMode()).toBe("navigation");
      expect(component.isCloseMode()).toBeFalse();
    });
  });
});
