import { TestBed } from "@angular/core/testing";
import { LoggerService } from "@app/services/logger.service";
import { WakeLockService } from "@app/services/wake-lock.service";

describe("WakeLockService", () => {
  let service: WakeLockService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let mockSentinel: any;
  let releaseCallbacks: (() => void)[];
  let originalWakeLock: any;

  beforeEach(() => {
    releaseCallbacks = [];
    mockSentinel = {
      released: false,
      addEventListener: jasmine
        .createSpy("addEventListener")
        .and.callFake((event: string, cb: () => void) => {
          if (event === "release") {
            releaseCallbacks.push(cb);
          }
        }),
      release: jasmine.createSpy("release").and.callFake(async () => {
        mockSentinel.released = true;
      }),
    };

    loggerSpy = jasmine.createSpyObj("LoggerService", [
      "debug",
      "info",
      "warn",
      "error",
    ]);

    originalWakeLock = (navigator as any).wakeLock;
    Object.defineProperty(navigator, "wakeLock", {
      value: {
        request: jasmine.createSpy("request").and.resolveTo(mockSentinel),
      },
      configurable: true,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        WakeLockService,
        { provide: LoggerService, useValue: loggerSpy },
      ],
    });

    service = TestBed.inject(WakeLockService);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "wakeLock", {
      value: originalWakeLock,
      configurable: true,
      writable: true,
    });
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should report isSupported as true when navigator.wakeLock is present", () => {
    expect(service.isSupported).toBeTrue();
  });

  it("should report isSupported as false when navigator.wakeLock is absent", () => {
    Object.defineProperty(navigator, "wakeLock", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(service.isSupported).toBeFalse();
  });

  it("should successfully request wake lock when supported", async () => {
    const result = await service.request();
    expect(result).toBeTrue();
    expect(service.isActive).toBeTrue();
    expect(navigator.wakeLock.request).toHaveBeenCalledWith("screen");
  });

  it("should return false and log debug when request fails", async () => {
    (navigator.wakeLock.request as jasmine.Spy).and.rejectWith(
      new Error("NotAllowedError"),
    );

    const result = await service.request();
    expect(result).toBeFalse();
    expect(service.isActive).toBeFalse();
    expect(loggerSpy.debug).toHaveBeenCalledWith(
      "WakeLockService: Failed to acquire screen wake lock",
      jasmine.any(Error),
    );
  });

  it("should return false when wakeLock is not supported", async () => {
    Object.defineProperty(navigator, "wakeLock", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const result = await service.request();
    expect(result).toBeFalse();
    expect(service.isActive).toBeFalse();
    expect(loggerSpy.debug).toHaveBeenCalledWith(
      "WakeLockService: Screen Wake Lock API is not supported in this browser.",
    );
  });

  it("should release wake lock on release()", async () => {
    await service.request();
    expect(service.isActive).toBeTrue();

    await service.release();
    expect(mockSentinel.release).toHaveBeenCalled();
    expect(service.isActive).toBeFalse();
  });

  it("should handle error during release gracefully", async () => {
    await service.request();
    mockSentinel.release.and.rejectWith(new Error("Release failed"));

    await service.release();
    expect(service.isActive).toBeFalse();
    expect(loggerSpy.debug).toHaveBeenCalledWith(
      "WakeLockService: Error releasing screen wake lock",
      jasmine.any(Error),
    );
  });

  it("should update isActive when release event fires from sentinel", async () => {
    await service.request();
    expect(service.isActive).toBeTrue();

    // Trigger release event from browser
    releaseCallbacks.forEach((cb) => cb());
    expect(service.isActive).toBeFalse();
  });

  it("should re-request wake lock on visibilitychange when tab becomes visible and was active", async () => {
    await service.request();
    expect(service.isActive).toBeTrue();

    // Simulate tab becoming hidden (sentinel released by browser)
    mockSentinel.released = true;
    releaseCallbacks.forEach((cb) => cb());
    expect(service.isActive).toBeFalse();

    // Now tab becomes visible
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    // Allow promise tick
    await Promise.resolve();
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(2);
  });

  it("should clean up event listener on ngOnDestroy", async () => {
    spyOn(document, "removeEventListener");
    service.ngOnDestroy();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      jasmine.any(Function),
    );
  });
});
