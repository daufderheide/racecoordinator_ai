import { LaneColumnViewportHelper } from "./raceday-lane-column-viewport.helper";

describe("LaneColumnViewportHelper", () => {
  let cardEl: HTMLElement;
  let onBecameVisibleSpy: jasmine.Spy;
  let helper: LaneColumnViewportHelper;
  let originalIntersectionObserver: any;
  let mockObserverCallback: (
    entries: Partial<IntersectionObserverEntry>[],
  ) => void;
  let mockDisconnectSpy: jasmine.Spy;
  let mockObserveSpy: jasmine.Spy;

  beforeEach(() => {
    cardEl = document.createElement("div");
    onBecameVisibleSpy = jasmine.createSpy("onBecameVisible");
    mockDisconnectSpy = jasmine.createSpy("disconnect");
    mockObserveSpy = jasmine.createSpy("observe");

    originalIntersectionObserver = (window as any).IntersectionObserver;

    (window as any).IntersectionObserver = class {
      constructor(callback: any) {
        mockObserverCallback = callback;
      }
      observe = mockObserveSpy;
      disconnect = mockDisconnectSpy;
      unobserve = jasmine.createSpy("unobserve");
    };

    helper = new LaneColumnViewportHelper(onBecameVisibleSpy);
  });

  afterEach(() => {
    (window as any).IntersectionObserver = originalIntersectionObserver;
  });

  it("should initialize with isVisible true and no pending fit", () => {
    expect(helper.isVisible).toBeTrue();
    expect(helper.hasPendingFit).toBeFalse();
  });

  it("should observe the card element when setup is called", () => {
    helper.setup(cardEl);
    expect(mockObserveSpy).toHaveBeenCalledWith(cardEl);
    expect(helper.isVisible).toBeTrue();
  });

  it("should handle transition from hidden to visible without pending fit", () => {
    helper.setup(cardEl);
    // Becomes hidden
    mockObserverCallback([{ target: cardEl, isIntersecting: false }]);
    expect(helper.isVisible).toBeFalse();
    expect(onBecameVisibleSpy).not.toHaveBeenCalled();

    // Becomes visible again without pending fit
    mockObserverCallback([{ target: cardEl, isIntersecting: true }]);
    expect(helper.isVisible).toBeTrue();
    expect(onBecameVisibleSpy).not.toHaveBeenCalled();
  });

  it("should invoke onBecameVisible when transitioning from hidden to visible with pending fit", () => {
    helper.setup(cardEl);

    // Becomes hidden
    mockObserverCallback([{ target: cardEl, isIntersecting: false }]);
    expect(helper.isVisible).toBeFalse();

    // Value changed while hidden -> mark pending fit
    helper.markPendingFit();
    expect(helper.hasPendingFit).toBeTrue();
    expect(onBecameVisibleSpy).not.toHaveBeenCalled();

    // Now scrolls into view
    mockObserverCallback([{ target: cardEl, isIntersecting: true }]);
    expect(helper.isVisible).toBeTrue();
    expect(helper.hasPendingFit).toBeFalse();
    expect(onBecameVisibleSpy).toHaveBeenCalledTimes(1);
  });

  it("should ignore entries targeting other elements", () => {
    helper.setup(cardEl);
    const otherEl = document.createElement("div");

    mockObserverCallback([{ target: otherEl, isIntersecting: false }]);
    expect(helper.isVisible).toBeTrue();
  });

  it("should allow manually clearing pending fit", () => {
    helper.markPendingFit();
    expect(helper.hasPendingFit).toBeTrue();
    helper.clearPendingFit();
    expect(helper.hasPendingFit).toBeFalse();
  });

  it("should disconnect observer on destroy", () => {
    helper.setup(cardEl);
    helper.destroy();
    expect(mockDisconnectSpy).toHaveBeenCalled();
  });

  it("should handle environment where IntersectionObserver is undefined", () => {
    delete (window as any).IntersectionObserver;
    const fallbackHelper = new LaneColumnViewportHelper(onBecameVisibleSpy);
    fallbackHelper.setup(cardEl);

    expect(fallbackHelper.isVisible).toBeTrue();
    fallbackHelper.destroy();
  });

  it("should handle IntersectionObserver throwing on instantiation", () => {
    (window as any).IntersectionObserver = class {
      constructor() {
        throw new Error("Observer blocked");
      }
    };
    const fallbackHelper = new LaneColumnViewportHelper(onBecameVisibleSpy);
    fallbackHelper.setup(cardEl);

    expect(fallbackHelper.isVisible).toBeTrue();
    fallbackHelper.destroy();
  });
});
