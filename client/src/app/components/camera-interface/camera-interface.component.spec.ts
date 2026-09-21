import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CameraVisionService } from "@app/services/camera-vision.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { TranslationService } from "@app/services/translation.service";

import { CameraInterfaceComponent } from "./camera-interface.component";

describe("CameraInterfaceComponent", () => {
  let component: CameraInterfaceComponent;
  let fixture: ComponentFixture<CameraInterfaceComponent>;
  let mockCameraVisionService: jasmine.SpyObj<CameraVisionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockHelpLinkService: jasmine.SpyObj<HelpLinkService>;

  const isConnected$ = new BehaviorSubject<boolean>(false);
  const batteryLevel$ = new BehaviorSubject<number>(0.9);
  const fps$ = new BehaviorSubject<number>(60);

  beforeEach(async () => {
    mockHelpLinkService = jasmine.createSpyObj("HelpLinkService", ["openHelp"]);
    mockCameraVisionService = jasmine.createSpyObj(
      "CameraVisionService",
      [
        "requestWakeLock",
        "releaseWakeLock",
        "connect",
        "disconnect",
        "setSoundEnabled",
        "setHapticEnabled",
        "processFrame",
        "detectMotionEnvelope",
      ],
      {
        isConnected$,
        batteryLevel$,
        fps$,
        soundEnabled: true,
        hapticEnabled: true,
      },
    );

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [CameraInterfaceComponent, TranslatePipe],
      providers: [
        { provide: CameraVisionService, useValue: mockCameraVisionService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: HelpLinkService, useValue: mockHelpLinkService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                server: "ws://127.0.0.1:8080/api/interface-data",
                interface: "1",
                lanes: "4",
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraInterfaceComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it("should create component and initialize from query params", () => {
    expect(component).toBeTruthy();
    component.ngOnInit();
    expect(component.serverUrl).toBe("ws://127.0.0.1:8080/api/interface-data");
    expect(component.interfaceIndex).toBe(1);
    expect(component.numLanes).toBe(4);
    expect(mockCameraVisionService.connect).toHaveBeenCalledWith(
      "ws://127.0.0.1:8080/api/interface-data",
      1,
    );
    expect(mockCameraVisionService.requestWakeLock).toHaveBeenCalled();
  });

  it("should set error when navigator.mediaDevices is missing", async () => {
    const originalMediaDevices = navigator.mediaDevices;
    try {
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      await component.startCameraStream();
      expect(component.cameraErrorMessage()).toBe(
        "CAMERA_ERROR_INSECURE_OR_UNSUPPORTED",
      );
    } finally {
      Object.defineProperty(navigator, "mediaDevices", {
        value: originalMediaDevices,
        configurable: true,
        writable: true,
      });
    }
  });

  it("should set error when camera permission is denied", async () => {
    const originalMediaDevices = navigator.mediaDevices;
    try {
      const mockMediaDevices = {
        getUserMedia: jasmine
          .createSpy("getUserMedia")
          .and.rejectWith({ name: "NotAllowedError" }),
      };
      Object.defineProperty(navigator, "mediaDevices", {
        value: mockMediaDevices,
        configurable: true,
        writable: true,
      });
      await component.startCameraStream();
      expect(component.cameraErrorMessage()).toBe(
        "CAMERA_ERROR_PERMISSION_DENIED",
      );
    } finally {
      Object.defineProperty(navigator, "mediaDevices", {
        value: originalMediaDevices,
        configurable: true,
        writable: true,
      });
    }
  });

  it("should fallback to basic video constraint if ideal constraints fail", async () => {
    const originalMediaDevices = navigator.mediaDevices;
    const fakeStream = {
      getTracks: () => [{ stop: jasmine.createSpy("stop") }],
    } as any;
    try {
      let callCount = 0;
      const mockMediaDevices = {
        getUserMedia: jasmine
          .createSpy("getUserMedia")
          .and.callFake((_constraints: any) => {
            callCount++;
            if (callCount === 1) {
              return Promise.reject({ name: "OverconstrainedError" });
            }
            return Promise.resolve(fakeStream);
          }),
      };
      Object.defineProperty(navigator, "mediaDevices", {
        value: mockMediaDevices,
        configurable: true,
        writable: true,
      });
      await component.startCameraStream();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
      expect(component.cameraErrorMessage()).toBeNull();
    } finally {
      Object.defineProperty(navigator, "mediaDevices", {
        value: originalMediaDevices,
        configurable: true,
        writable: true,
      });
    }
  });

  it("should fallback to default server URL when server query param is absent", () => {
    (component as any).route.snapshot.queryParams = {};
    (component as any).readQueryParams();
    expect(component.serverUrl).toContain("/api/interface-data");
  });

  it("should reset gates to default matching numLanes", () => {
    component.numLanes = 3;
    component.resetGatesToDefault();
    const gates = component.gates();
    expect(gates.length).toBe(3);
    expect(gates[0].laneIndex).toBe(0);
    expect(gates[1].laneIndex).toBe(1);
    expect(gates[2].laneIndex).toBe(2);
  });

  it("should connect to server via CameraVisionService", () => {
    component.serverUrl = "ws://127.0.0.1:8080/api/interface-data";
    component.interfaceIndex = 1;
    component.connectToServer();
    expect(mockCameraVisionService.connect).toHaveBeenCalledWith(
      "ws://127.0.0.1:8080/api/interface-data",
      1,
    );
  });

  it("should toggle sound and haptic settings", () => {
    component.soundEnabled.set(true);
    component.toggleSound();
    expect(component.soundEnabled()).toBe(false);
    expect(mockCameraVisionService.setSoundEnabled).toHaveBeenCalledWith(false);

    component.hapticEnabled.set(true);
    component.toggleHaptic();
    expect(component.hapticEnabled()).toBe(false);
    expect(mockCameraVisionService.setHapticEnabled).toHaveBeenCalledWith(
      false,
    );
  });

  it("should update gate sensitivities when sensitivity changed", () => {
    component.resetGatesToDefault();
    component.onSensitivityChange(0.75);
    expect(component.globalSensitivity()).toBe(0.75);
    expect(component.gates()[0].sensitivity).toBe(0.75);
  });

  it("should toggle camera facing mode", () => {
    spyOn(component, "startCameraStream");
    component.facingMode.set("environment");
    component.toggleCamera();
    expect(component.facingMode()).toBe("user");
    expect(component.startCameraStream).toHaveBeenCalled();
  });

  it("should navigate back on goBack()", () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/"]);
  });

  it("should handle auto-snap wizard lifecycle", () => {
    component.numLanes = 2;
    component.startAutoSnap();
    expect(component.isAutoSnapping()).toBe(true);
    expect(component.autoSnapLane()).toBe(0);

    component.skipAutoSnapLane();
    expect(component.autoSnapLane()).toBe(1);

    component.skipAutoSnapLane();
    expect(component.isAutoSnapping()).toBe(false);

    component.startAutoSnap();
    component.cancelAutoSnap();
    expect(component.isAutoSnapping()).toBe(false);
  });

  it("should handle pointer interactions for dragging and resizing gates", () => {
    component.resetGatesToDefault();
    const fakeSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    spyOn(fakeSvg, "getBoundingClientRect").and.returnValue({
      width: 1000,
      height: 500,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    component.overlaySvgRef = { nativeElement: fakeSvg };

    // Select gate
    const fakeEvent = new MouseEvent("mousedown");
    spyOn(fakeEvent, "stopPropagation");
    component.selectGate(0, fakeEvent);
    expect(component.selectedGateIndex()).toBe(0);

    // Pointer down to move
    const downEvent = new MouseEvent("mousedown", {
      clientX: 100,
      clientY: 100,
    });
    component.onGatePointerDown(0, downEvent);

    // Move pointer by 50px horizontally (50 / 1000 = +0.05 pct)
    const moveEvent = new MouseEvent("mousemove", {
      clientX: 150,
      clientY: 100,
    });
    component.onPointerMove(moveEvent);
    const movedGate = component.gates()[0];
    expect(movedGate.xPct).toBeGreaterThan(0.1);

    // Release pointer
    component.onPointerUp();

    // Pointer down to resize
    const resizeDownEvent = new MouseEvent("mousedown", {
      clientX: 200,
      clientY: 200,
    });
    component.onResizePointerDown(0, resizeDownEvent);
    const resizeMoveEvent = new MouseEvent("mousemove", {
      clientX: 250,
      clientY: 250,
    });
    component.onPointerMove(resizeMoveEvent);
    const resizedGate = component.gates()[0];
    expect(resizedGate.widthPct).toBeGreaterThan(0.1);

    component.onPointerUp();
  });

  it("should delegate to HelpLinkService when openHelp is called", () => {
    component.openHelp();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("camera-setup");
  });

  it("should render learn more button on error and invoke openHelp on click", () => {
    component.cameraErrorMessage.set("CAMERA_ERROR_INSECURE_OR_UNSUPPORTED");
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const learnMoreBtn = compiled.querySelector(
      "#cameraErrorLearnMoreBtn",
    ) as HTMLButtonElement;
    expect(learnMoreBtn).toBeTruthy();
    learnMoreBtn.click();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("camera-setup");
  });
});
