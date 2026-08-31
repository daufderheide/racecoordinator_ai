import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
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

    await TestBed.configureTestingModule({
      imports: [BrowserNavigationComponent, MockTranslatePipe],
      providers: [
        { provide: FullscreenService, useValue: mockFullscreenService },
        { provide: NavigationService, useValue: mockNavigationService },
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
});
