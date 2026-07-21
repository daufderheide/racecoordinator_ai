import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ChangeDetectorRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep, HelpService } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { TranslationService } from "@app/services/translation.service";

import { HelpOverlayComponent } from "./help-overlay.component";
import { HelpOverlayHarness } from "./testing/help-overlay.harness";

describe("HelpOverlayComponent", () => {
  let component: HelpOverlayComponent;
  let fixture: ComponentFixture<HelpOverlayComponent>;
  let harness: HelpOverlayHarness;
  let helpServiceMock: any;
  let translationServiceMock: any;
  let helpLinkServiceMock: any;
  let isVisibleSubject: BehaviorSubject<boolean>;
  let currentStepSubject: BehaviorSubject<GuideStep | null>;
  let hasNextSubject: BehaviorSubject<boolean>;
  let hasPreviousSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    isVisibleSubject = new BehaviorSubject<boolean>(false);
    currentStepSubject = new BehaviorSubject<GuideStep | null>(null);
    hasNextSubject = new BehaviorSubject<boolean>(false);
    hasPreviousSubject = new BehaviorSubject<boolean>(false);

    helpServiceMock = {
      isVisible$: isVisibleSubject.asObservable(),
      currentStep$: currentStepSubject.asObservable(),
      hasNext$: hasNextSubject.asObservable(),
      hasPrevious$: hasPreviousSubject.asObservable(),
      steps: [],
      currentStepIndex: 0,
      nextStep: jasmine.createSpy("nextStep"),
      previousStep: jasmine.createSpy("previousStep"),
      endGuide: jasmine.createSpy("endGuide"),
    };

    translationServiceMock = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };

    helpLinkServiceMock = {
      openHelp: jasmine.createSpy("openHelp"),
    };

    await TestBed.configureTestingModule({
      imports: [HelpOverlayComponent, TranslatePipe],
      providers: [
        { provide: HelpService, useValue: helpServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: HelpLinkService, useValue: helpLinkServiceMock },
        ChangeDetectorRef,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpOverlayComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      HelpOverlayHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not be visible initially", async () => {
    expect(component.isVisible).toBeFalse();
    expect(await harness.isVisible()).toBeFalse();
  });

  it("should become visible when service emits true", async () => {
    isVisibleSubject.next(true);
    fixture.detectChanges();
    expect(component.isVisible).toBeTrue();
    expect(await harness.isVisible()).toBeTrue();
  });

  it("should display step title and content", fakeAsync(() => {
    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: "Test Title",
      content: "Test Content",
      selector: "#test-target",
    };
    currentStepSubject.next(step);
    tick(); // Wait for setTimeout in subscription and position update
    fixture.detectChanges();

    // The harness methods return promises, which we can await via fakeAsync tick loop or directly.
    // Given we are in fakeAsync, we can just resolve promises using tick().
    let title = "";
    let content = "";
    harness.getTitle().then((t) => (title = t));
    harness.getContent().then((c) => (content = c));
    tick();

    expect(title).toContain("Test Title");
    expect(content).toContain("Test Content");
  }));

  it("should call nextStep on next button click", fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: "Step 1", content: "Content" });
    hasNextSubject.next(true);
    tick();
    fixture.detectChanges();

    harness.clickNext();
    tick();
    expect(helpServiceMock.nextStep).toHaveBeenCalled();
  }));

  it("should call previousStep on back button click", fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: "Step 2", content: "Content" });
    hasPreviousSubject.next(true);
    tick();
    fixture.detectChanges();

    harness.clickPrevious();
    tick();
    expect(helpServiceMock.previousStep).toHaveBeenCalled();
  }));

  it("should call endGuide on finish button click", fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: "Last Step", content: "Content" });
    hasNextSubject.next(false); // Last step
    tick();
    fixture.detectChanges();

    harness.clickFinish();
    tick();
    expect(helpServiceMock.endGuide).toHaveBeenCalled();
  }));

  it("should calculate position correctly for target element and delay isInitialized", fakeAsync(() => {
    // Create a dummy target element in the DOM
    const target = document.createElement("div");
    target.id = "test-target";
    target.style.position = "absolute";
    target.style.top = "100px";
    target.style.left = "100px";
    target.style.width = "50px";
    target.style.height = "50px";
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: "Targeted Step",
      content: "Check Position",
      selector: "#test-target",
      position: "bottom",
    };
    currentStepSubject.next(step);

    // Initial change detection
    fixture.detectChanges();
    expect(component.isInitialized).toBeFalse();

    // Advance first rAF (position refined)
    tick(16);
    fixture.detectChanges();
    expect(component.isInitialized).toBeFalse(); // Still false because of double rAF

    // Advance second rAF (first inner rAF of finalizeInitialization)
    tick(16);
    fixture.detectChanges();
    expect(component.isInitialized).toBeFalse();

    // Advance third rAF (second inner rAF of finalizeInitialization)
    tick(16);
    fixture.detectChanges();
    expect(component.isInitialized).toBeTrue();

    expect(component.highlightStyle).toBeTruthy();
    // highlight should match target rect
    expect(component.highlightStyle.top).toBe("100px");
    expect(component.highlightStyle.left).toBe("100px");
    expect(component.highlightStyle.width).toBe("50px");
    expect(component.highlightStyle.height).toBe("50px");

    // Popover should be below target (bottom + margin 15)
    // 100 (top) + 50 (height) + 15 (margin) = 165
    expect(component.popoverStyle.top).toBe("165px");

    // Clean up
    document.body.removeChild(target);
  }));

  it("should fallback to center if target not found and delay isInitialized", fakeAsync(() => {
    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: "No Target Step",
      content: "Center Me",
      selector: "#non-existent-id",
    };
    currentStepSubject.next(step);

    // Initial change detection and wait for retries (3 * 50ms)
    fixture.detectChanges();
    expect(component.isInitialized).toBeFalse();

    tick(150);
    fixture.detectChanges();
    expect(component.isInitialized).toBeFalse(); // After retries, centerPopover is called but double rAF hasn't finished

    // Advance first rAF
    tick(16);
    fixture.detectChanges();
    expect(component.isInitialized).toBeFalse();

    // Advance second rAF
    tick(16);
    fixture.detectChanges();
    expect(component.isInitialized).toBeTrue();

    expect(component.highlightStyle).toBeNull();
    expect(component.popoverStyle.top).toBe("50%");
    expect(component.popoverStyle.left).toBe("50%");
  }));

  it("should call endGuide when Escape key is pressed", fakeAsync(() => {
    isVisibleSubject.next(true);
    tick();
    fixture.detectChanges();

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(event);
    tick();

    expect(helpServiceMock.endGuide).toHaveBeenCalled();
  }));

  it("should call nextStep when ArrowRight key is pressed and hasNext is true", fakeAsync(() => {
    isVisibleSubject.next(true);
    hasNextSubject.next(true);
    tick();
    fixture.detectChanges();

    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    window.dispatchEvent(event);
    tick();

    expect(helpServiceMock.nextStep).toHaveBeenCalled();
  }));

  it("should not call nextStep when ArrowRight key is pressed and hasNext is false", fakeAsync(() => {
    isVisibleSubject.next(true);
    hasNextSubject.next(false);
    tick();
    fixture.detectChanges();

    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    window.dispatchEvent(event);
    tick();

    expect(helpServiceMock.nextStep).not.toHaveBeenCalled();
  }));

  it("should call previousStep when ArrowLeft key is pressed and hasPrevious is true", fakeAsync(() => {
    isVisibleSubject.next(true);
    hasPreviousSubject.next(true);
    tick();
    fixture.detectChanges();

    const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    window.dispatchEvent(event);
    tick();

    expect(helpServiceMock.previousStep).toHaveBeenCalled();
  }));

  it("should not call previousStep when ArrowLeft key is pressed and hasPrevious is false", fakeAsync(() => {
    isVisibleSubject.next(true);
    hasPreviousSubject.next(false);
    tick();
    fixture.detectChanges();

    const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    window.dispatchEvent(event);
    tick();

    expect(helpServiceMock.previousStep).not.toHaveBeenCalled();
  }));

  it("should intercept clicks on help-link elements and call helpLinkService with parsed article and section", fakeAsync(() => {
    isVisibleSubject.next(true);
    tick();
    fixture.detectChanges();

    const anchor = document.createElement("a");
    anchor.href = "javascript:void(0)";
    anchor.className =
      "help-link help-article-test-article help-section-test-section";

    // Stub preventDefault
    const event = new MouseEvent("click", { bubbles: true });
    spyOn(event, "preventDefault");

    // We dispatch it on the component element because it's a HostListener
    fixture.nativeElement.appendChild(anchor);
    anchor.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(helpLinkServiceMock.openHelp).toHaveBeenCalledWith(
      "test-article",
      "test-section",
    );

    fixture.nativeElement.removeChild(anchor);
  }));
});
