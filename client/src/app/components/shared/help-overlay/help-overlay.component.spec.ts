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

  it("should call endGuide on close button click", fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: "Step 1", content: "Content" });
    tick();
    fixture.detectChanges();

    harness.clickClose();
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

  it("should calculate position correctly when targetId is provided", fakeAsync(() => {
    const target = document.createElement("div");
    target.id = "target-by-id";
    target.style.position = "absolute";
    target.style.top = "200px";
    target.style.left = "200px";
    target.style.width = "60px";
    target.style.height = "40px";
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: "TargetId Step",
      content: "Content",
      targetId: "target-by-id",
      position: "top",
    };
    currentStepSubject.next(step);
    fixture.detectChanges();

    // Advance rAFs
    tick(16);
    fixture.detectChanges();
    tick(16);
    fixture.detectChanges();
    tick(16);
    fixture.detectChanges();

    expect(component.highlightStyle).toBeTruthy();
    expect(component.highlightStyle.top).toBe("200px");
    expect(component.highlightStyle.left).toBe("200px");

    document.body.removeChild(target);
  }));

  it("should calculate right and left positions correctly", fakeAsync(() => {
    const target = document.createElement("div");
    target.id = "target-horiz";
    target.style.position = "absolute";
    target.style.top = "300px";
    target.style.left = "400px";
    target.style.width = "100px";
    target.style.height = "80px";
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    currentStepSubject.next({
      title: "Right Step",
      content: "Content",
      targetId: "target-horiz",
      position: "right",
    });
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect(component.popoverStyle.left).toBeDefined();

    currentStepSubject.next({
      title: "Left Step",
      content: "Content",
      targetId: "target-horiz",
      position: "left",
    });
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect(component.popoverStyle.left).toBeDefined();

    document.body.removeChild(target);
  }));

  it("should clamp without vertically flipping above when target is near bottom for left position", fakeAsync(() => {
    const target = document.createElement("div");
    target.id = "target-bottom-left";
    target.style.position = "absolute";
    // Place target near bottom of window
    target.style.top = `${window.innerHeight - 80}px`;
    target.style.left = "400px";
    target.style.width = "200px";
    target.style.height = "40px";
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    currentStepSubject.next({
      title: "Bottom Left Step",
      content: "Content",
      targetId: "target-bottom-left",
      position: "left",
    });
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    // Popover must be to the left of the target
    expect(component.popoverClass).toBe("arrow-right");

    const popoverTop = parseInt(component.popoverStyle.top, 10);
    // Should NOT flip completely above target (which would have been targetTop - popoverHeight - 15)
    // Instead it stays clamped beside the target
    expect(popoverTop).toBeLessThanOrEqual(window.innerHeight - 10);
    expect(component.popoverStyle["--arrow-top"]).toBeDefined();

    document.body.removeChild(target);
  }));

  it("should flip above target when target is near bottom for bottom position", fakeAsync(() => {
    const target = document.createElement("div");
    target.id = "target-bottom-flip";
    target.style.position = "absolute";
    target.style.top = `${window.innerHeight - 60}px`;
    target.style.left = "200px";
    target.style.width = "100px";
    target.style.height = "40px";
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    currentStepSubject.next({
      title: "Bottom Step",
      content: "Content",
      targetId: "target-bottom-flip",
      position: "bottom",
    });
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    // When space below is unavailable, it flips above target
    expect(component.popoverClass).toBe("arrow-bottom");

    document.body.removeChild(target);
  }));

  it("should flip to right when target has insufficient space on left for left position", fakeAsync(() => {
    const target = document.createElement("div");
    target.id = "target-left-edge";
    target.style.position = "absolute";
    target.style.top = "200px";
    target.style.left = "20px";
    target.style.width = "50px";
    target.style.height = "40px";
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    currentStepSubject.next({
      title: "Left Edge Step",
      content: "Content",
      targetId: "target-left-edge",
      position: "left",
    });
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    // Not enough space on left (target left is 20px), so flips to right
    expect(component.popoverClass).toBe("arrow-left");

    document.body.removeChild(target);
  }));

  it("should scroll container so that the top of the expander/target is near the top and not scrolled off-screen", fakeAsync(() => {
    // Create scrollable container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "100px";
    container.style.left = "100px";
    container.style.width = "600px";
    container.style.height = "400px";
    container.style.overflowY = "auto";
    container.id = "test-scroll-container";

    // Create spacer before target
    const spacer = document.createElement("div");
    spacer.style.height = "600px";
    container.appendChild(spacer);

    // Create target element (representing an expander)
    const target = document.createElement("div");
    target.id = "test-expander-target";
    target.style.height = "500px";
    container.appendChild(target);

    // Create trailing content
    const trailing = document.createElement("div");
    trailing.style.height = "800px";
    container.appendChild(trailing);

    document.body.appendChild(container);

    let scrolledTop = -1;
    spyOn(container, "scrollTo").and.callFake((options?: any) => {
      scrolledTop = options?.top ?? 0;
      container.scrollTop = scrolledTop;
    });

    isVisibleSubject.next(true);
    currentStepSubject.next({
      title: "Expander Step",
      content: "Content",
      targetId: "test-expander-target",
      position: "left",
    });
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    // Verify container was scrolled so that target is near top (within margin)
    expect(container.scrollTo).toHaveBeenCalled();
    // Target was 600px down in container, targetScroll should be close to 600 - 12 = 588px
    expect(scrolledTop).toBeGreaterThanOrEqual(580);
    expect(scrolledTop).toBeLessThanOrEqual(600);

    // Ensure it never scrolled so far that target top was off the top (> 600)
    expect(scrolledTop).toBeLessThanOrEqual(600);

    document.body.removeChild(container);
  }));

  it("should ignore keydown events when overlay is not visible", fakeAsync(() => {
    isVisibleSubject.next(false);
    tick();
    fixture.detectChanges();

    const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(escEvent);
    const rightEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
    window.dispatchEvent(rightEvent);
    const leftEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    window.dispatchEvent(leftEvent);
    tick();

    expect(helpServiceMock.endGuide).not.toHaveBeenCalled();
    expect(helpServiceMock.nextStep).not.toHaveBeenCalled();
    expect(helpServiceMock.previousStep).not.toHaveBeenCalled();
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

  it("should prevent default and stop propagation when Arrow keys or Escape are pressed in guide", fakeAsync(() => {
    isVisibleSubject.next(true);
    hasNextSubject.next(false);
    tick();
    fixture.detectChanges();

    const rightEvent = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      cancelable: true,
    });
    spyOn(rightEvent, "preventDefault");
    spyOn(rightEvent, "stopPropagation");
    spyOn(rightEvent, "stopImmediatePropagation");
    window.dispatchEvent(rightEvent);
    tick();

    expect(rightEvent.preventDefault).toHaveBeenCalled();
    expect(rightEvent.stopPropagation).toHaveBeenCalled();
    expect(rightEvent.stopImmediatePropagation).toHaveBeenCalled();

    const leftEvent = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      cancelable: true,
    });
    spyOn(leftEvent, "preventDefault");
    spyOn(leftEvent, "stopPropagation");
    spyOn(leftEvent, "stopImmediatePropagation");
    window.dispatchEvent(leftEvent);
    tick();

    expect(leftEvent.preventDefault).toHaveBeenCalled();
    expect(leftEvent.stopPropagation).toHaveBeenCalled();
    expect(leftEvent.stopImmediatePropagation).toHaveBeenCalled();

    const escEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    spyOn(escEvent, "preventDefault");
    spyOn(escEvent, "stopPropagation");
    spyOn(escEvent, "stopImmediatePropagation");
    window.dispatchEvent(escEvent);
    tick();

    expect(escEvent.preventDefault).toHaveBeenCalled();
    expect(escEvent.stopPropagation).toHaveBeenCalled();
    expect(escEvent.stopImmediatePropagation).toHaveBeenCalled();
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
