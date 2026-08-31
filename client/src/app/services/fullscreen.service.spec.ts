import { TestBed } from "@angular/core/testing";

import { FullscreenService } from "./fullscreen.service";

describe("FullscreenService", () => {
  let service: FullscreenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FullscreenService],
    });
    service = TestBed.inject(FullscreenService);
  });

  afterEach(() => {
    service.setFullscreenOverride(null);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should default to false when not in fullscreen", () => {
    service.setFullscreenOverride(null);
    expect(service.isFullscreen()).toBeFalse();
  });

  it("should respect override value when set to true", (done) => {
    service.isFullscreen$.subscribe((val) => {
      if (val) {
        expect(val).toBeTrue();
        expect(service.isFullscreen()).toBeTrue();
        done();
      }
    });
    service.setFullscreenOverride(true);
  });

  it("should respect override value when set to false", (done) => {
    service.setFullscreenOverride(true);
    service.isFullscreen$.subscribe((val) => {
      if (!val) {
        expect(val).toBeFalse();
        expect(service.isFullscreen()).toBeFalse();
        done();
      }
    });
    service.setFullscreenOverride(false);
  });

  it("should clear override when set to null", () => {
    service.setFullscreenOverride(true);
    expect(service.isFullscreen()).toBeTrue();

    service.setFullscreenOverride(null);
    expect(service.isFullscreen()).toBeFalse();
  });

  it("should detect document.fullscreenElement when present", () => {
    service.setFullscreenOverride(null);
    const mockEl = document.createElement("div");
    spyOnProperty(document, "fullscreenElement", "get").and.returnValue(mockEl);

    expect(service.isFullscreen()).toBeTrue();
  });

  it("should detect display-mode: fullscreen when toolbar is hidden (outerHeight === innerHeight)", () => {
    service.setFullscreenOverride(null);
    spyOnProperty(document, "fullscreenElement", "get").and.returnValue(null);
    spyOn(window, "matchMedia").and.callFake((query: string) => {
      return {
        matches: query === "(display-mode: fullscreen)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any;
    });
    spyOnProperty(window, "outerHeight", "get").and.returnValue(1080);
    spyOnProperty(window, "innerHeight", "get").and.returnValue(1080);

    expect(service.isFullscreen()).toBeTrue();
  });

  it("should return false when in display-mode: fullscreen but toolbar is showing (outerHeight > innerHeight)", () => {
    service.setFullscreenOverride(null);
    spyOnProperty(document, "fullscreenElement", "get").and.returnValue(null);
    spyOn(window, "matchMedia").and.callFake((query: string) => {
      return {
        matches: query === "(display-mode: fullscreen)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any;
    });
    spyOnProperty(window, "outerHeight", "get").and.returnValue(1080);
    // Viewport height is reduced by toolbar (~80px)
    spyOnProperty(window, "innerHeight", "get").and.returnValue(1000);

    expect(service.isFullscreen()).toBeFalse();
  });

  it("should return false in Playwright environment when not in HTML5 fullscreen", () => {
    (window as any).isPlaywright = true;
    try {
      service.setFullscreenOverride(null);
      const fsSpy = spyOnProperty(
        document,
        "fullscreenElement",
        "get",
      ).and.returnValue(null);

      expect(service.isFullscreen()).toBeFalse();

      const mockEl = document.createElement("div");
      fsSpy.and.returnValue(mockEl);
      expect(service.isFullscreen()).toBeTrue();
    } finally {
      delete (window as any).isPlaywright;
    }
  });

  it("should toggle fullscreen correctly", async () => {
    service.setFullscreenOverride(false);
    spyOn(service, "requestFullscreen").and.returnValue(Promise.resolve());
    spyOn(service, "exitFullscreen").and.returnValue(Promise.resolve());

    await service.toggleFullscreen();
    expect(service.requestFullscreen).toHaveBeenCalled();

    service.setFullscreenOverride(true);
    await service.toggleFullscreen();
    expect(service.exitFullscreen).toHaveBeenCalled();
  });

  it("should clean up event listeners on destroy", () => {
    expect(() => service.ngOnDestroy()).not.toThrow();
  });
});
