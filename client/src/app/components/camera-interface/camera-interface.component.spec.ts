import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CameraVisionService } from "@app/services/camera-vision.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { TranslationService } from "@app/services/translation.service";

import { CameraInterfaceComponent } from "./camera-interface.component";
import { CameraInterfaceHarness } from "./testing/camera-interface.harness";

describe("CameraInterfaceComponent", () => {
  let component: CameraInterfaceComponent;
  let fixture: ComponentFixture<CameraInterfaceComponent>;
  let harness: CameraInterfaceHarness;
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
        "sendGatesUpdate",
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
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      CameraInterfaceHarness,
    );
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
    const fakeStream =
      typeof MediaStream !== "undefined"
        ? new MediaStream()
        : ({
            getTracks: () => [{ stop: jasmine.createSpy("stop") }],
          } as any);
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

  it("should navigate to track editor on goBack() when standalone without history or opener", () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/track-editor"]);
  });

  it("should emit close output on goBack() when isModal is true", () => {
    fixture.componentRef.setInput("isModal", true);
    fixture.detectChanges();
    spyOn(component.close, "emit");
    component.goBack();
    expect(component.close.emit).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it("should close window on goBack() when window.opener is open", () => {
    spyOn(window, "close");
    const originalOpener = window.opener;
    try {
      (window as any).opener = { closed: false };
      component.goBack();
      expect(window.close).toHaveBeenCalled();
    } finally {
      (window as any).opener = originalOpener;
    }
  });

  it("should call history.back on goBack() when browser history exists", () => {
    spyOn(window.history, "back");
    const originalLength = window.history.length;
    try {
      Object.defineProperty(window.history, "length", {
        value: 3,
        configurable: true,
      });
      component.goBack();
      expect(window.history.back).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window.history, "length", {
        value: originalLength,
        configurable: true,
      });
    }
  });

  it("should load gates from initialGates when isModal is true", () => {
    fixture.componentRef.setInput("isModal", true);
    fixture.componentRef.setInput("modalNumLanes", 2);
    fixture.componentRef.setInput("modalInterfaceIndex", 1);
    const mockGates = [
      {
        laneIndex: 0,
        gateType: 0,
        xPct: 0.12,
        yPct: 0.35,
        widthPct: 0.25,
        heightPct: 0.2,
        sensitivity: 0.6,
      },
      {
        laneIndex: 1,
        gateType: 0,
        xPct: 0.52,
        yPct: 0.35,
        widthPct: 0.25,
        heightPct: 0.2,
        sensitivity: 0.6,
      },
    ];
    fixture.componentRef.setInput("initialGates", mockGates);
    component.ngOnInit();
    expect(component.numLanes).toBe(2);
    expect(component.interfaceIndex).toBe(1);
    expect(component.gates().length).toBe(2);
    expect(component.gates()[0].xPct).toBe(0.12);
  });

  it("should emit gatesChange, sendGatesUpdate, and show toast when saveGates is called", () => {
    spyOn(component.gatesChange, "emit");
    spyOn(window, "fetch").and.returnValue(Promise.resolve(new Response()));
    component.saveGates();
    expect(component.gatesChange.emit).toHaveBeenCalledWith(component.gates());
    expect(mockCameraVisionService.sendGatesUpdate).toHaveBeenCalledWith(
      component.interfaceIndex,
      component.gates(),
    );
    expect(component.showSavedToast()).toBe(true);
    expect(window.fetch).toHaveBeenCalledWith(
      "/api/camera/gates",
      jasmine.objectContaining({ method: "POST" }),
    );
  });

  it("should trigger saveGates when clicking save button in HUD", async () => {
    spyOn(component, "saveGates");
    fixture.detectChanges();
    expect(await harness.isSaveGatesVisible()).toBe(true);
    await harness.clickSaveGates();
    expect(component.saveGates).toHaveBeenCalled();
  });

  it("should load gates from query param when provided", () => {
    const customGates = [
      {
        laneIndex: 0,
        xPct: 0.15,
        yPct: 0.25,
        widthPct: 0.35,
        heightPct: 0.45,
        sensitivity: 0.7,
        type: "lap",
      },
      {
        laneIndex: 1,
        xPct: 0.55,
        yPct: 0.25,
        widthPct: 0.35,
        heightPct: 0.45,
        sensitivity: 0.7,
        type: "lap",
      },
    ];
    (component as any).route = {
      snapshot: {
        queryParams: {
          lanes: "2",
          interface: "0",
          gates: JSON.stringify(customGates),
        },
      },
    };
    (component as any).readQueryParams();
    (component as any).loadGates();
    expect(component.gates().length).toBe(2);
    expect(component.gates()[0].xPct).toBe(0.15);
  });

  it("should handle auto-snap wizard lifecycle", () => {
    component.numLanes = 2;
    component.startAutoSnap();
    expect(component.isAutoSnapping()).toBe(true);
    expect(component.autoSnapStage()).toBe("zone");
    expect(component.autoSnapLane()).toBe(0);

    component.startCarCalibration();
    expect(component.autoSnapStage()).toBe("car");

    component.skipAutoSnapLane();
    expect(component.autoSnapLane()).toBe(1);

    component.skipAutoSnapLane();
    expect(component.isAutoSnapping()).toBe(false);

    component.startAutoSnap();
    component.cancelAutoSnap();
    expect(component.isAutoSnapping()).toBe(false);
  });

  it("should initialize finish line zone and calculate dividers and previews based on numLanes", () => {
    component.numLanes = 3;
    component.resetGatesToDefault();
    component.startAutoSnap();

    expect(component.isAutoSnapping()).toBeTrue();
    expect(component.autoSnapStage()).toBe("zone");

    const zone = component.finishLineZone();
    expect(zone).toBeDefined();
    expect(zone.widthPct).toBeGreaterThan(0.5);

    const dividers = component.zoneLaneDividers();
    expect(dividers.length).toBe(2);

    const previews = component.zoneLanePreviews();
    expect(previews.length).toBe(3);
    expect(previews[0].laneIndex).toBe(0);
    expect(previews[1].laneIndex).toBe(1);
    expect(previews[2].laneIndex).toBe(2);
    expect(previews[0].centerX).toBeLessThan(previews[1].centerX);
    expect(previews[1].centerX).toBeLessThan(previews[2].centerX);
  });

  it("should auto-split finish line zone into evenly spaced non-overlapping lane gates (columns)", () => {
    component.numLanes = 2;
    component.startAutoSnap();
    component.splitOrientation.set("columns");
    component.finishLineZone.set({
      xPct: 0.2,
      yPct: 0.3,
      widthPct: 0.6,
      heightPct: 0.25,
    });

    spyOn(component, "saveGates");
    component.applyAutoSplit();

    expect(component.isAutoSnapping()).toBeFalse();
    expect(component.saveGates).toHaveBeenCalled();

    const gates = component.gates();
    expect(gates.length).toBe(2);
    expect(gates[0].laneIndex).toBe(0);
    expect(gates[0].xPct).toBeCloseTo(0.215, 3);
    expect(gates[0].widthPct).toBeCloseTo(0.27, 3);
    expect(gates[0].yPct).toBe(0.3);
    expect(gates[0].heightPct).toBe(0.25);

    expect(gates[1].laneIndex).toBe(1);
    expect(gates[1].xPct).toBeCloseTo(0.515, 3);
    expect(gates[1].widthPct).toBeCloseTo(0.27, 3);
  });

  it("should auto-split finish line zone into horizontal lane rows when orientation is rows", () => {
    component.numLanes = 2;
    component.startAutoSnap();
    component.splitOrientation.set("rows");
    component.finishLineZone.set({
      xPct: 0.2,
      yPct: 0.3,
      widthPct: 0.15,
      heightPct: 0.6,
    });

    spyOn(component, "saveGates");
    component.applyAutoSplit();

    expect(component.isAutoSnapping()).toBeFalse();
    expect(component.saveGates).toHaveBeenCalled();

    const gates = component.gates();
    expect(gates.length).toBe(2);
    expect(gates[0].laneIndex).toBe(0);
    expect(gates[0].xPct).toBe(0.2);
    expect(gates[0].widthPct).toBe(0.15);
    expect(gates[0].yPct).toBeCloseTo(0.315, 3);
    expect(gates[0].heightPct).toBeCloseTo(0.27, 3);

    expect(gates[1].laneIndex).toBe(1);
    expect(gates[1].xPct).toBe(0.2);
    expect(gates[1].widthPct).toBe(0.15);
    expect(gates[1].yPct).toBeCloseTo(0.615, 3);
    expect(gates[1].heightPct).toBeCloseTo(0.27, 3);
  });

  it("should transition to car calibration and pass active lane sub-ROI to detectMotionEnvelope", () => {
    component.numLanes = 2;
    component.startAutoSnap();
    component.finishLineZone.set({
      xPct: 0.1,
      yPct: 0.2,
      widthPct: 0.8,
      heightPct: 0.4,
    });

    component.startCarCalibration();
    expect(component.autoSnapStage()).toBe("car");

    const fakeVideo = document.createElement("video");
    const fakeCanvas = document.createElement("canvas");
    mockCameraVisionService.detectMotionEnvelope.and.returnValue({
      envelope: null,
      currentBg: new Uint8ClampedArray(10),
    });

    (component as any).processAutoSnapFrame(fakeVideo, fakeCanvas);

    expect(mockCameraVisionService.detectMotionEnvelope).toHaveBeenCalledWith(
      fakeVideo,
      fakeCanvas,
      null,
      jasmine.objectContaining({
        xPct: 0.1,
        yPct: 0.2,
        widthPct: 0.4,
        heightPct: 0.4,
      }),
    );
  });

  it("should handle drawing, dragging and 4-corner resizing of finish line zone", () => {
    component.startAutoSnap();
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

    // 1. Draw new zone by dragging on SVG canvas
    const drawDown = new MouseEvent("mousedown", {
      clientX: 100,
      clientY: 100,
    });
    component.onSvgPointerDown(drawDown);

    const drawMove = new MouseEvent("mousemove", {
      clientX: 300,
      clientY: 400,
    });
    component.onPointerMove(drawMove);
    expect(component.finishLineZone().xPct).toBeCloseTo(0.1, 2);
    expect(component.finishLineZone().yPct).toBeCloseTo(0.2, 2);
    expect(component.finishLineZone().widthPct).toBeCloseTo(0.2, 2);
    expect(component.finishLineZone().heightPct).toBeCloseTo(0.6, 2);
    component.onPointerUp();

    // 2. Drag move the zone
    const downEvent = new MouseEvent("mousedown", {
      clientX: 200,
      clientY: 250,
    });
    component.onZonePointerDown(downEvent);

    const moveEvent = new MouseEvent("mousemove", {
      clientX: 250,
      clientY: 275,
    });
    component.onPointerMove(moveEvent);

    expect(component.finishLineZone().xPct).toBeCloseTo(0.15, 2);
    expect(component.finishLineZone().yPct).toBeCloseTo(0.25, 2);
    component.onPointerUp();

    // 3. Resize via south-east ('se') corner
    const resizeDownSe = new MouseEvent("mousedown", {
      clientX: 350,
      clientY: 425,
    });
    component.onZoneResizePointerDown("se", resizeDownSe);

    const resizeMoveSe = new MouseEvent("mousemove", {
      clientX: 400,
      clientY: 475,
    });
    component.onPointerMove(resizeMoveSe);

    expect(component.finishLineZone().widthPct).toBeCloseTo(0.25, 2);
    expect(component.finishLineZone().heightPct).toBeCloseTo(0.7, 2);
    component.onPointerUp();

    // 4. Resize via north-west ('nw') corner
    const resizeDownNw = new MouseEvent("mousedown", {
      clientX: 150,
      clientY: 125,
    });
    component.onZoneResizePointerDown("nw", resizeDownNw);

    const resizeMoveNw = new MouseEvent("mousemove", {
      clientX: 100,
      clientY: 100,
    });
    component.onPointerMove(resizeMoveNw);
    expect(component.finishLineZone().xPct).toBeCloseTo(0.1, 2);
    component.onPointerUp();
  });

  it("should accumulate motion frames, snap gate, and advance lane after 4 frames", () => {
    jasmine.clock().install();
    try {
      component.numLanes = 2;
      component.resetGatesToDefault();
      component.startAutoSnap();
      component.finishLineZone.set({
        xPct: 0.1,
        yPct: 0.2,
        widthPct: 0.8,
        heightPct: 0.4,
      });
      component.splitOrientation.set("columns");

      expect(component.autoSnapLane()).toBe(0);
      expect(component.autoSnapFrames()).toBe(0);

      const fakeVideo = document.createElement("video");
      const fakeCanvas = document.createElement("canvas");

      mockCameraVisionService.detectMotionEnvelope.and.returnValue({
        envelope: {
          minX: 0.15,
          maxX: 0.25,
          minY: 0.25,
          maxY: 0.35,
          density: 0.02,
        },
        currentBg: new Uint8ClampedArray(10),
      });

      // Simulate 3 motion frames
      for (let i = 0; i < 3; i++) {
        (component as any).processAutoSnapFrame(fakeVideo, fakeCanvas);
      }
      expect(component.autoSnapFrames()).toBe(3);
      expect(component.autoSnapLane()).toBe(0);

      // 4th frame triggers gate application and starts lane transition
      (component as any).processAutoSnapFrame(fakeVideo, fakeCanvas);
      expect(component.autoSnapFrames()).toBe(4);

      const lane0Gate = component.gates()[0];
      expect(lane0Gate).toBeDefined();
      expect(lane0Gate.xPct).toBeCloseTo(0.11, 2);
      expect(lane0Gate.widthPct).toBeCloseTo(0.38, 2);
      expect(lane0Gate.yPct).toBe(0.2);
      expect(lane0Gate.heightPct).toBe(0.4);

      // Advance clock past the 800ms transition timeout
      jasmine.clock().tick(801);
      expect(component.autoSnapLane()).toBe(1);
      expect(component.autoSnapFrames()).toBe(0);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it("should reset autoSnapFrames if motion stops and idle timer expires", () => {
    jasmine.clock().install();
    try {
      component.numLanes = 2;
      component.startAutoSnap();

      const fakeVideo = document.createElement("video");
      const fakeCanvas = document.createElement("canvas");

      mockCameraVisionService.detectMotionEnvelope.and.returnValue({
        envelope: {
          minX: 0.15,
          maxX: 0.25,
          minY: 0.35,
          maxY: 0.55,
          density: 0.02,
        },
        currentBg: new Uint8ClampedArray(10),
      });

      // 2 motion frames
      for (let i = 0; i < 2; i++) {
        (component as any).processAutoSnapFrame(fakeVideo, fakeCanvas);
      }
      expect(component.autoSnapFrames()).toBe(2);

      // Fast forward past the 2500ms idle timer
      jasmine.clock().tick(2501);
      expect(component.autoSnapFrames()).toBe(0);
    } finally {
      jasmine.clock().uninstall();
    }
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

  it("should reset gates to default when saved localStorage gates count does not match numLanes", () => {
    component.interfaceIndex = 0;
    component.numLanes = 2;
    // Simulate legacy or mismatched 4-lane gates in localStorage
    const mismatchedGates = [
      {
        laneIndex: 0,
        gateType: 0,
        xPct: 0.1,
        yPct: 0.38,
        widthPct: 0.18,
        heightPct: 0.25,
        sensitivity: 0.5,
      },
      {
        laneIndex: 1,
        gateType: 0,
        xPct: 0.3,
        yPct: 0.38,
        widthPct: 0.18,
        heightPct: 0.25,
        sensitivity: 0.5,
      },
      {
        laneIndex: 2,
        gateType: 0,
        xPct: 0.5,
        yPct: 0.38,
        widthPct: 0.18,
        heightPct: 0.25,
        sensitivity: 0.5,
      },
      {
        laneIndex: 3,
        gateType: 0,
        xPct: 0.7,
        yPct: 0.38,
        widthPct: 0.18,
        heightPct: 0.25,
        sensitivity: 0.5,
      },
    ];
    localStorage.setItem("rc_cam_gates_0", JSON.stringify(mismatchedGates));
    localStorage.removeItem("rc_cam_gates_0_2");

    component.loadGates();

    expect(component.gates().length).toBe(2);
    expect(component.gates()[0].laneIndex).toBe(0);
    expect(component.gates()[1].laneIndex).toBe(1);

    localStorage.removeItem("rc_cam_gates_0");
    localStorage.removeItem("rc_cam_gates_0_2");
  });

  it("should load saved gates when localStorage key matches interfaceIndex and numLanes", () => {
    component.interfaceIndex = 0;
    component.numLanes = 2;
    const customGates = [
      {
        laneIndex: 0,
        gateType: 0,
        xPct: 0.15,
        yPct: 0.4,
        widthPct: 0.3,
        heightPct: 0.2,
        sensitivity: 0.8,
      },
      {
        laneIndex: 1,
        gateType: 0,
        xPct: 0.55,
        yPct: 0.4,
        widthPct: 0.3,
        heightPct: 0.2,
        sensitivity: 0.8,
      },
    ];
    localStorage.setItem("rc_cam_gates_0_2", JSON.stringify(customGates));

    component.loadGates();

    expect(component.gates().length).toBe(2);
    expect(component.gates()[0].xPct).toBe(0.15);
    expect(component.gates()[1].xPct).toBe(0.55);

    localStorage.removeItem("rc_cam_gates_0_2");
  });

  it("should save gates using key suffixed with interfaceIndex and numLanes", () => {
    component.interfaceIndex = 2;
    component.numLanes = 3;
    component.resetGatesToDefault();

    const saved = localStorage.getItem("rc_cam_gates_2_3");
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.length).toBe(3);

    localStorage.removeItem("rc_cam_gates_2_3");
  });

  describe("CameraInterfaceHarness interactions", () => {
    it("should query HUD buttons and click back via harness", async () => {
      fixture.detectChanges();
      expect(await harness.isBackVisible()).toBeTrue();
      expect(await harness.isDoneVisible()).toBeFalse();
      expect(await harness.isAutoSnapVisible()).toBeTrue();
      expect(await harness.isFlipVisible()).toBeTrue();
      expect(await harness.isSettingsVisible()).toBeTrue();

      spyOn(component, "goBack");
      await harness.clickBack();
      expect(component.goBack).toHaveBeenCalled();
    });

    it("should show done button and handle click in modal mode via harness", async () => {
      fixture.componentRef.setInput("isModal", true);
      fixture.detectChanges();

      expect(await harness.isDoneVisible()).toBeTrue();
      spyOn(component.close, "emit");

      await harness.clickDone();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it("should report status, fps, battery and gate count via harness", async () => {
      isConnected$.next(true);
      component.fps.set(45);
      component.batteryLevel.set(0.92);
      component.resetGatesToDefault();
      fixture.detectChanges();

      expect(await harness.isConnected()).toBeTrue();
      expect(await harness.getStatusText()).toBe("CAMERA_CONNECTED");
      expect(await harness.getFpsText()).toContain("45 FPS");
      expect(await harness.getBatteryText()).toContain("92%");
      expect(await harness.getGateCount()).toBe(4);
    });

    it("should open and close settings drawer via harness", async () => {
      fixture.detectChanges();
      expect(await harness.isSettingsOpen()).toBeFalse();

      await harness.clickSettings();
      fixture.detectChanges();
      expect(await harness.isSettingsOpen()).toBeTrue();

      await harness.closeSettings();
      fixture.detectChanges();
      expect(await harness.isSettingsOpen()).toBeFalse();
    });

    it("should toggle auto-snap wizard and handle cancel, calibrate, and auto-split via harness", async () => {
      fixture.detectChanges();
      expect(await harness.isAutoSnapOpen()).toBeFalse();

      await harness.clickAutoSnap();
      fixture.detectChanges();
      expect(await harness.isAutoSnapOpen()).toBeTrue();
      expect(await harness.isFinishLineZoneVisible()).toBeTrue();

      await harness.clickCalibrateCar();
      fixture.detectChanges();
      expect(component.autoSnapStage()).toBe("car");

      spyOn(component, "skipAutoSnapLane");
      await harness.clickAutoSnapSkip();
      expect(component.skipAutoSnapLane).toHaveBeenCalled();

      await harness.clickAutoSnapCancel();
      fixture.detectChanges();
      expect(await harness.isAutoSnapOpen()).toBeFalse();

      // Open again to test Auto-Split and orientation toggles
      await harness.clickAutoSnap();
      fixture.detectChanges();
      expect(await harness.isAutoSnapOpen()).toBeTrue();

      expect(await harness.isSplitRowsSelected()).toBeFalse();
      await harness.clickSplitRows();
      fixture.detectChanges();
      expect(component.splitOrientation()).toBe("rows");
      expect(await harness.isSplitRowsSelected()).toBeTrue();

      await harness.clickSplitCols();
      fixture.detectChanges();
      expect(component.splitOrientation()).toBe("columns");
      expect(await harness.isSplitColsSelected()).toBeTrue();

      spyOn(component, "applyAutoSplit").and.callThrough();
      await harness.clickAutoSplit();
      fixture.detectChanges();
      expect(component.applyAutoSplit).toHaveBeenCalled();
      expect(await harness.isAutoSnapOpen()).toBeFalse();
    });

    it("should display camera error overlay and trigger retry and help via harness", async () => {
      component.cameraErrorMessage.set("CAMERA_ERROR_PERMISSION_DENIED");
      fixture.detectChanges();

      expect(await harness.isErrorVisible()).toBeTrue();

      spyOn(component, "startCameraStream");
      await harness.clickErrorRetry();
      expect(component.startCameraStream).toHaveBeenCalled();

      await harness.clickErrorLearnMore();
      expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("camera-setup");
    });

    it("should toggle camera facing mode via harness flip button", async () => {
      fixture.detectChanges();
      spyOn(component, "startCameraStream");
      component.facingMode.set("environment");

      await harness.clickFlip();
      expect(component.facingMode()).toBe("user");
      expect(component.startCameraStream).toHaveBeenCalled();
    });

    it("should load available video devices and allow device selection", async () => {
      const mockDevices: MediaDeviceInfo[] = [
        {
          deviceId: "cam-1",
          kind: "videoinput",
          label: "USB Camera 1",
          groupId: "group-1",
          toJSON: () => ({}),
        },
        {
          deviceId: "cam-2",
          kind: "videoinput",
          label: "Built-in Camera",
          groupId: "group-2",
          toJSON: () => ({}),
        },
      ];

      spyOn(navigator.mediaDevices, "enumerateDevices").and.returnValue(
        Promise.resolve(mockDevices),
      );
      spyOn(component, "startCameraStream");

      await component.loadAvailableDevices();
      expect(component.availableDevices().length).toBe(2);

      component.selectDevice("cam-2");
      expect(component.selectedDeviceId()).toBe("cam-2");
      expect(component.startCameraStream).toHaveBeenCalled();

      // toggleCamera when multiple devices exist cycles to the other device
      component.toggleCamera();
      expect(component.selectedDeviceId()).toBe("cam-1");
    });
  });
});
