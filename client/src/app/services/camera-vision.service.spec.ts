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

  it("should detect motion envelope in calibration frame", () => {
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
