import { TestBed } from "@angular/core/testing";
import { LaneDetectionGate } from "@app/models/camera_config";
import { InterfaceEvent, TimeSyncPong } from "@app/proto/antigravity";

import { CameraVisionService } from "./camera-vision.service";

describe("CameraVisionService", () => {
  let service: CameraVisionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [CameraVisionService],
    });
    service = TestBed.inject(CameraVisionService);
  });

  afterEach(() => {
    service.disconnect();
    localStorage.clear();
  });

  it("should be created with default settings", () => {
    expect(service).toBeTruthy();
    expect(service.soundEnabled).toBe(true);
    expect(service.hapticEnabled).toBe(true);
  });

  it("should toggle sound and persist to localStorage", () => {
    service.setSoundEnabled(false);
    expect(service.soundEnabled).toBe(false);
    expect(localStorage.getItem("rc_cam_sound")).toBe("false");

    service.setSoundEnabled(true);
    expect(service.soundEnabled).toBe(true);
    expect(localStorage.getItem("rc_cam_sound")).toBe("true");
  });

  it("should toggle haptics and persist to localStorage", () => {
    service.setHapticEnabled(false);
    expect(service.hapticEnabled).toBe(false);
    expect(localStorage.getItem("rc_cam_haptic")).toBe("false");

    service.setHapticEnabled(true);
    expect(service.hapticEnabled).toBe(true);
    expect(localStorage.getItem("rc_cam_haptic")).toBe("true");
  });

  it("should safely handle wake lock requests", async () => {
    await service.requestWakeLock();
    service.releaseWakeLock();
    expect(service).toBeTruthy();
  });

  it("should handle WebSocket connection lifecycle and message decoding", () => {
    const mockWs: any = {
      send: jasmine.createSpy("send"),
      close: jasmine.createSpy("close"),
      readyState: WebSocket.OPEN,
      binaryType: "arraybuffer",
    };

    spyOn(window as any, "WebSocket").and.returnValue(mockWs);

    service.connect("ws://localhost:8080/api/interface-data", 0);
    expect(window.WebSocket).toHaveBeenCalledWith(
      "ws://localhost:8080/api/interface-data",
    );

    // Simulate onopen
    mockWs.onopen();
    expect(mockWs.send).toHaveBeenCalled();

    // Simulate incoming TimeSyncPong
    const pongData = InterfaceEvent.create({
      timeSyncPong: TimeSyncPong.create({
        clientSendTime: 1.0,
        serverRecvTime: 1.005,
        serverSendTime: 1.006,
      }),
    });
    const encoded = InterfaceEvent.encode(pongData).finish();
    mockWs.onmessage({ data: encoded.buffer });

    // Send lap event
    service.sendLapEvent(0, 3.456, 0);
    expect(mockWs.send).toHaveBeenCalled();

    // Disconnect
    service.disconnect();
    expect(mockWs.close).toHaveBeenCalled();
  });

  it("should detect motion envelope in calibration frame with null background", () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      spyOn(ctx, "drawImage");
      spyOn(ctx, "getImageData").and.returnValue({
        data: new Uint8ClampedArray(320 * 180 * 4),
        width: 320,
        height: 180,
        colorSpace: "srgb",
      });
    }

    const { envelope, currentBg } = service.detectMotionEnvelope(
      video,
      canvas,
      null,
    );
    expect(envelope).toBeNull();
    expect(currentBg.length).toBeGreaterThan(0);
  });

  it("should detect motion envelope and preserve background when car motion occurs", () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    const bg = new Uint8ClampedArray(320 * 180 * 4);
    const framePixels = new Uint8ClampedArray(320 * 180 * 4);

    // Simulate car motion in a 20x30 region (x: 50..69, y: 40..69)
    for (let y = 40; y < 70; y++) {
      for (let x = 50; x < 70; x++) {
        const idx = (y * 320 + x) * 4;
        framePixels[idx] = 200;
        framePixels[idx + 1] = 200;
        framePixels[idx + 2] = 200;
        framePixels[idx + 3] = 255;
      }
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      spyOn(ctx, "drawImage");
      spyOn(ctx, "getImageData").and.returnValue({
        data: framePixels,
        width: 320,
        height: 180,
        colorSpace: "srgb",
      });
    }

    const { envelope, currentBg } = service.detectMotionEnvelope(
      video,
      canvas,
      bg,
    );
    expect(envelope).not.toBeNull();
    expect(envelope!.minX).toBeCloseTo(50 / 320, 3);
    expect(envelope!.maxX).toBeCloseTo(70 / 320, 3);
    expect(envelope!.minY).toBeCloseTo(40 / 180, 3);
    expect(envelope!.maxY).toBeCloseTo(70 / 180, 3);
    expect(envelope!.density).toBeGreaterThan(0);

    // Verify moving pixel region was not assimilated into background
    const motionIdx = (50 * 320 + 50) * 4;
    expect(currentBg[motionIdx]).toBe(0);
  });

  it("should reject scattered camera sensor noise across the frame", () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    const bg = new Uint8ClampedArray(320 * 180 * 4);
    const framePixels = new Uint8ClampedArray(320 * 180 * 4);

    // Scatter 150 random high-diff pixels throughout the 320x180 frame
    // so no single 10x10 block receives more than 2 noise pixels
    for (let i = 0; i < 150; i++) {
      const x = (i * 37) % 320;
      const y = (i * 29) % 180;
      const idx = (y * 320 + x) * 4;
      framePixels[idx] = 180;
      framePixels[idx + 1] = 180;
      framePixels[idx + 2] = 180;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      spyOn(ctx, "drawImage");
      spyOn(ctx, "getImageData").and.returnValue({
        data: framePixels,
        width: 320,
        height: 180,
        colorSpace: "srgb",
      });
    }

    const { envelope } = service.detectMotionEnvelope(video, canvas, bg);
    // Must be rejected as sensor noise
    expect(envelope).toBeNull();
  });

  it("should ignore minor noise blips below threshold in calibration", () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    const bg = new Uint8ClampedArray(320 * 180 * 4);
    const framePixels = new Uint8ClampedArray(320 * 180 * 4);

    // Only 10 pixels modified (below 40 pixel threshold)
    for (let i = 0; i < 10; i++) {
      const idx = i * 4;
      framePixels[idx] = 200;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      spyOn(ctx, "drawImage");
      spyOn(ctx, "getImageData").and.returnValue({
        data: framePixels,
        width: 320,
        height: 180,
        colorSpace: "srgb",
      });
    }

    const { envelope } = service.detectMotionEnvelope(video, canvas, bg);
    expect(envelope).toBeNull();
  });

  it("should re-seed background and suppress envelope on global lighting shift", () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    const bg = new Uint8ClampedArray(320 * 180 * 4);
    const framePixels = new Uint8ClampedArray(320 * 180 * 4);
    // Fill entire screen with high contrast (room light turned on)
    framePixels.fill(220);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      spyOn(ctx, "drawImage");
      spyOn(ctx, "getImageData").and.returnValue({
        data: framePixels,
        width: 320,
        height: 180,
        colorSpace: "srgb",
      });
    }

    const { envelope, currentBg } = service.detectMotionEnvelope(
      video,
      canvas,
      bg,
    );
    expect(envelope).toBeNull();
    expect(currentBg[0]).toBe(220);
  });

  it("should process frame across detection gates", () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    const gate: LaneDetectionGate = {
      laneIndex: 0,
      gateType: 0,
      xPct: 0.2,
      yPct: 0.2,
      widthPct: 0.3,
      heightPct: 0.3,
      sensitivity: 0.5,
    };

    const ctx = canvas.getContext("2d");
    if (ctx) {
      spyOn(ctx, "drawImage");
      spyOn(ctx, "getImageData").and.returnValue({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
        colorSpace: "srgb",
      });
    }

    // First frame initializes background
    const res1 = service.processFrame(video, canvas, [gate], 0);
    expect(res1).toEqual([]);

    // Second frame with same pixels has no motion
    const res2 = service.processFrame(video, canvas, [gate], 0);
    expect(res2).toEqual([]);
  });
});
