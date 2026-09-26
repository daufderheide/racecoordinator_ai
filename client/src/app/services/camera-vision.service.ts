import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { LaneDetectionGate } from "@app/models/camera_config";
import { InterfaceEvent, LapEvent, TimeSyncPing } from "@app/proto/antigravity";

export interface DetectionResult {
  lane: number;
  gateType: number;
  timestamp: number;
  lapTime: number;
}

export interface CalibrationMotion {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  density: number;
}

export interface RegionOfInterest {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

@Injectable({
  providedIn: "root",
})
export class CameraVisionService {
  private ws: WebSocket | null = null;
  private wakeLock: any = null;
  private audioCtx: AudioContext | null = null;

  // Synchronization and timing
  private clockOffsetMs = 0;
  private pingStartTime = 0;
  private pingIntervalId: any = null;
  private heartbeatIntervalId: any = null;

  // Background models and lane tracking
  private backgroundCanvases = new Map<number, Uint8ClampedArray>();
  private lastTriggerTimes = new Map<number, number>();
  private lastLapStartTimes = new Map<number, number>();
  private gateEntryStates = new Map<number, boolean>();

  // State subjects
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$: Observable<boolean> =
    this.isConnectedSubject.asObservable();

  private fpsSubject = new BehaviorSubject<number>(0);
  public fps$: Observable<number> = this.fpsSubject.asObservable();

  private batteryLevelSubject = new BehaviorSubject<number>(1.0);
  public batteryLevel$: Observable<number> =
    this.batteryLevelSubject.asObservable();

  // Settings
  public soundEnabled = true;
  public hapticEnabled = true;

  constructor() {
    this.loadSettings();
    this.initBatteryMonitoring();
  }

  private loadSettings(): void {
    const sound = localStorage.getItem("rc_cam_sound");
    if (sound !== null) {
      this.soundEnabled = sound === "true";
    }
    const haptic = localStorage.getItem("rc_cam_haptic");
    if (haptic !== null) {
      this.hapticEnabled = haptic === "true";
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem("rc_cam_sound", enabled ? "true" : "false");
  }

  public setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
    localStorage.setItem("rc_cam_haptic", enabled ? "true" : "false");
  }

  // --- Screen WakeLock API ---
  public async requestWakeLock(): Promise<void> {
    if ("wakeLock" in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
      } catch {
        // WakeLock request rejected or unsupported
      }
    }
  }

  public releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {
        // Ignore
      }
      this.wakeLock = null;
    }
  }

  // --- Battery Monitoring ---
  private initBatteryMonitoring(): void {
    if ("getBattery" in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          this.batteryLevelSubject.next(battery.level);
          battery.addEventListener("levelchange", () => {
            this.batteryLevelSubject.next(battery.level);
          });
        })
        .catch(() => {
          // Battery API not permitted
        });
    }
  }

  // --- WebSocket Connection & Time Synchronization ---
  public connect(url: string, interfaceIndex: number): void {
    this.disconnect();

    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        this.isConnectedSubject.next(true);
        this.startSyncAndHeartbeat(interfaceIndex);
      };

      this.ws.onclose = () => {
        this.isConnectedSubject.next(false);
        this.stopSyncAndHeartbeat();
      };

      this.ws.onerror = () => {
        this.isConnectedSubject.next(false);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleWebSocketMessage(event.data);
      };
    } catch {
      this.isConnectedSubject.next(false);
    }
  }

  public disconnect(): void {
    this.stopSyncAndHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore close error
      }
      this.ws = null;
    }
    this.isConnectedSubject.next(false);
  }

  private startSyncAndHeartbeat(interfaceIndex: number): void {
    this.stopSyncAndHeartbeat();
    this.sendPing();
    if (typeof window !== "undefined" && (window as any).isPlaywright) {
      return;
    }
    this.pingIntervalId = setInterval(() => this.sendPing(), 3000);
    this.heartbeatIntervalId = setInterval(() => {
      this.sendHeartbeat(interfaceIndex);
    }, 1000);
  }

  private stopSyncAndHeartbeat(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  public sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.pingStartTime = performance.now();
    const pingEvent = InterfaceEvent.create({
      timeSyncPing: TimeSyncPing.create({
        clientSendTime: this.pingStartTime / 1000.0,
      }),
    });
    this.ws.send(InterfaceEvent.encode(pingEvent).finish());
  }

  private handleWebSocketMessage(data: ArrayBuffer): void {
    try {
      const event = InterfaceEvent.decode(new Uint8Array(data));
      if (event.timeSyncPong) {
        const pong = event.timeSyncPong;
        const now = performance.now();
        const sRecv = (pong.serverRecvTime ?? 0) * 1000.0;
        const sSend = (pong.serverSendTime ?? 0) * 1000.0;
        const rtt = now - this.pingStartTime - (sSend - sRecv);
        const offset = (sRecv - this.pingStartTime + (sSend - now)) / 2.0;
        if (rtt < 100) {
          this.clockOffsetMs = offset;
        }
      }
    } catch {
      // Non-protobuf or invalid event
    }
  }

  private sendHeartbeat(interfaceIndex: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const hb = InterfaceEvent.create({
      cameraHeartbeat: {
        interfaceIndex,
        currentFps: Math.round(this.fpsSubject.value),
        batteryLevel: this.batteryLevelSubject.value,
        clientTimestamp: (performance.now() + this.clockOffsetMs) / 1000.0,
      },
    });
    this.ws.send(InterfaceEvent.encode(hb).finish());
  }

  public sendLapEvent(
    lane: number,
    lapTime: number,
    interfaceIndex: number,
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const lap = InterfaceEvent.create({
      lap: LapEvent.create({
        lane,
        lapTime,
        interfaceId: 0,
        interfaceIndex,
      }),
    });
    this.ws.send(InterfaceEvent.encode(lap).finish());
  }

  public sendGatesUpdate(
    interfaceIndex: number,
    gates: LaneDetectionGate[],
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const protoGates = gates.map((g) => ({
      laneIndex: g.laneIndex,
      xPct: g.xPct,
      yPct: g.yPct,
      widthPct: g.widthPct,
      heightPct: g.heightPct,
      gateType: g.gateType ?? 0,
      sensitivity: g.sensitivity ?? 0.5,
    }));
    const updateEvent = InterfaceEvent.create({
      cameraGatesUpdate: {
        interfaceIndex,
        gates: protoGates,
      },
    });
    this.ws.send(InterfaceEvent.encode(updateEvent).finish());
  }

  // --- Computer Vision & Motion Detection ---
  public processFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    gates: LaneDetectionGate[],
    interfaceIndex: number,
  ): DetectionResult[] {
    const results: DetectionResult[] = [];
    if (
      !video ||
      video.videoWidth === 0 ||
      video.videoHeight === 0 ||
      !gates ||
      gates.length === 0
    ) {
      return results;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return results;

    const vidW = video.videoWidth;
    const vidH = video.videoHeight;
    const now = performance.now();

    for (let i = 0; i < gates.length; i++) {
      const gate = gates[i];
      const gx = Math.floor(gate.xPct * vidW);
      const gy = Math.floor(gate.yPct * vidH);
      const gw = Math.max(8, Math.floor(gate.widthPct * vidW));
      const gh = Math.max(8, Math.floor(gate.heightPct * vidH));

      canvas.width = gw;
      canvas.height = gh;
      ctx.drawImage(video, gx, gy, gw, gh, 0, 0, gw, gh);
      const frameData = ctx.getImageData(0, 0, gw, gh);
      const pixels = frameData.data;

      const trigger = this.evaluateGateMotion(gate, pixels, gw, gh, now);
      if (trigger) {
        const lastLapStart = this.lastLapStartTimes.get(gate.laneIndex) || now;
        const lapDuration = (now - lastLapStart) / 1000.0;
        this.lastLapStartTimes.set(gate.laneIndex, now);

        this.sendLapEvent(gate.laneIndex, lapDuration, interfaceIndex);
        this.triggerFeedback();
        results.push({
          lane: gate.laneIndex,
          gateType: gate.gateType,
          timestamp: now,
          lapTime: lapDuration,
        });
      }
    }
    return results;
  }

  private evaluateGateMotion(
    gate: LaneDetectionGate,
    pixels: Uint8ClampedArray,
    gw: number,
    gh: number,
    now: number,
  ): boolean {
    const debounceMs = 500;
    const lastTrigger = this.lastTriggerTimes.get(gate.laneIndex) || 0;
    if (now - lastTrigger < debounceMs) {
      return false;
    }

    let bg = this.backgroundCanvases.get(gate.laneIndex);
    if (!bg || bg.length !== pixels.length) {
      bg = new Uint8ClampedArray(pixels.length);
      bg.set(pixels);
      this.backgroundCanvases.set(gate.laneIndex, bg);
      return false;
    }

    const alpha = 0.02;
    const sensitivity = gate.sensitivity || 0.5;
    const threshold = Math.max(15, 60 - sensitivity * 45);

    let diffCount = 0;
    let entryDiff = 0;
    let exitDiff = 0;
    const totalPixels = gw * gh;
    const midY = Math.floor(gh / 2);

    for (let p = 0; p < totalPixels; p++) {
      const idx = p * 4;
      const rDiff = Math.abs(pixels[idx] - bg[idx]);
      const gDiff = Math.abs(pixels[idx + 1] - bg[idx + 1]);
      const bDiff = Math.abs(pixels[idx + 2] - bg[idx + 2]);
      const diff = (rDiff + gDiff + bDiff) / 3;

      bg[idx] = Math.round((1 - alpha) * bg[idx] + alpha * pixels[idx]);
      bg[idx + 1] = Math.round(
        (1 - alpha) * bg[idx + 1] + alpha * pixels[idx + 1],
      );
      bg[idx + 2] = Math.round(
        (1 - alpha) * bg[idx + 2] + alpha * pixels[idx + 2],
      );

      if (diff > threshold) {
        diffCount++;
        const py = Math.floor(p / gw);
        if (py < midY) {
          entryDiff++;
        } else {
          exitDiff++;
        }
      }
    }

    const motionRatio = diffCount / totalPixels;
    if (motionRatio > 0.12) {
      if (entryDiff > exitDiff) {
        this.gateEntryStates.set(gate.laneIndex, true);
      } else if (
        this.gateEntryStates.get(gate.laneIndex) &&
        exitDiff > entryDiff
      ) {
        this.gateEntryStates.set(gate.laneIndex, false);
        this.lastTriggerTimes.set(gate.laneIndex, now);
        return true;
      } else if (motionRatio > 0.25) {
        this.lastTriggerTimes.set(gate.laneIndex, now);
        return true;
      }
    }
    return false;
  }

  // --- Auto-Snap Calibration ---
  public detectMotionEnvelope(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    bgPixels: Uint8ClampedArray | null,
    roi?: RegionOfInterest | null,
  ): { envelope: CalibrationMotion | null; currentBg: Uint8ClampedArray } {
    const vidW = video.videoWidth || 640;
    const vidH = video.videoHeight || 480;
    if (vidH > vidW) {
      canvas.width = 180;
      canvas.height = 320;
    } else {
      canvas.width = 320;
      canvas.height = 180;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return {
        envelope: null,
        currentBg: bgPixels || new Uint8ClampedArray(0),
      };
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frameData.data;

    if (!bgPixels || bgPixels.length !== pixels.length) {
      const newBg = new Uint8ClampedArray(pixels.length);
      newBg.set(pixels);
      return { envelope: null, currentBg: newBg };
    }

    return this.analyzeCalibrationGrid(
      pixels,
      bgPixels,
      canvas.width,
      canvas.height,
      roi,
    );
  }

  private analyzeCalibrationGrid(
    pixels: Uint8ClampedArray,
    bgPixels: Uint8ClampedArray,
    width: number,
    height: number,
    roi?: RegionOfInterest | null,
  ): { envelope: CalibrationMotion | null; currentBg: Uint8ClampedArray } {
    const blockSize = 10;
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const { blockCounts, totalDiff } = this.computeBlockDifferences(
      pixels,
      bgPixels,
      width,
      height,
      blockSize,
      cols,
      roi,
    );

    const stats = this.findActiveBlockBounds(blockCounts, cols, rows);
    const totalBlocks = cols * rows;

    if (stats.activeCount < 2) {
      this.adaptBackgroundAll(pixels, bgPixels);
      return { envelope: null, currentBg: bgPixels };
    }

    const boxW = (stats.maxBx - stats.minBx + 1) * blockSize;
    const boxH = (stats.maxBy - stats.minBy + 1) * blockSize;

    // Reject motion that spans large portions of the screen (global lighting shift or large movement)
    if (
      boxW > width * 0.85 ||
      boxH > height * 0.9 ||
      stats.activeCount > totalBlocks * 0.5
    ) {
      if (stats.activeCount > totalBlocks * 0.5) {
        bgPixels.set(pixels);
      }
      return { envelope: null, currentBg: bgPixels };
    }

    this.adaptBackgroundInactive(
      pixels,
      bgPixels,
      blockCounts,
      width,
      height,
      blockSize,
      cols,
      rows,
    );

    let minX = Math.max(0, (stats.minBx * blockSize) / width);
    let maxX = Math.min(1.0, ((stats.maxBx + 1) * blockSize) / width);
    let minY = Math.max(0, (stats.minBy * blockSize) / height);
    let maxY = Math.min(1.0, ((stats.maxBy + 1) * blockSize) / height);

    if (roi) {
      minX = Math.max(roi.xPct, minX);
      maxX = Math.min(roi.xPct + roi.widthPct, maxX);
      minY = Math.max(roi.yPct, minY);
      maxY = Math.min(roi.yPct + roi.heightPct, maxY);
    }

    return {
      envelope: {
        minX,
        maxX,
        minY,
        maxY,
        density: totalDiff / (width * height),
      },
      currentBg: bgPixels,
    };
  }

  private computeBlockDifferences(
    pixels: Uint8ClampedArray,
    bgPixels: Uint8ClampedArray,
    width: number,
    height: number,
    blockSize: number,
    cols: number,
    roi?: RegionOfInterest | null,
  ): { blockCounts: Uint16Array; totalDiff: number } {
    const rows = Math.ceil(height / blockSize);
    const blockCounts = new Uint16Array(cols * rows);
    let totalDiff = 0;

    const roiMinX = roi ? Math.floor(roi.xPct * width) : 0;
    const roiMaxX = roi ? Math.ceil((roi.xPct + roi.widthPct) * width) : width;
    const roiMinY = roi ? Math.floor(roi.yPct * height) : 0;
    const roiMaxY = roi
      ? Math.ceil((roi.yPct + roi.heightPct) * height)
      : height;

    for (let y = 0; y < height; y++) {
      if (y < roiMinY || y >= roiMaxY) continue;
      const by = Math.floor(y / blockSize);
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        if (x < roiMinX || x >= roiMaxX) continue;
        const idx = (rowOffset + x) * 4;
        const diff =
          (Math.abs(pixels[idx] - bgPixels[idx]) +
            Math.abs(pixels[idx + 1] - bgPixels[idx + 1]) +
            Math.abs(pixels[idx + 2] - bgPixels[idx + 2])) /
          3;

        if (diff > 30) {
          totalDiff++;
          const bx = Math.floor(x / blockSize);
          blockCounts[by * cols + bx]++;
        }
      }
    }
    return { blockCounts, totalDiff };
  }

  private findActiveBlockBounds(
    blockCounts: Uint16Array,
    cols: number,
    rows: number,
  ): {
    activeCount: number;
    minBx: number;
    maxBx: number;
    minBy: number;
    maxBy: number;
  } {
    let minBx = cols;
    let maxBx = -1;
    let minBy = rows;
    let maxBy = -1;
    let activeCount = 0;

    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        const b = by * cols + bx;
        if (blockCounts[b] >= 18) {
          activeCount++;
          if (bx < minBx) minBx = bx;
          if (bx > maxBx) maxBx = bx;
          if (by < minBy) minBy = by;
          if (by > maxBy) maxBy = by;
        }
      }
    }
    return { activeCount, minBx, maxBx, minBy, maxBy };
  }

  private adaptBackgroundAll(
    pixels: Uint8ClampedArray,
    bgPixels: Uint8ClampedArray,
  ): void {
    for (let i = 0; i < pixels.length; i += 4) {
      bgPixels[i] = Math.round(0.95 * bgPixels[i] + 0.05 * pixels[i]);
      bgPixels[i + 1] = Math.round(
        0.95 * bgPixels[i + 1] + 0.05 * pixels[i + 1],
      );
      bgPixels[i + 2] = Math.round(
        0.95 * bgPixels[i + 2] + 0.05 * pixels[i + 2],
      );
    }
  }

  private adaptBackgroundInactive(
    pixels: Uint8ClampedArray,
    bgPixels: Uint8ClampedArray,
    blockCounts: Uint16Array,
    width: number,
    height: number,
    blockSize: number,
    cols: number,
    rows: number,
  ): void {
    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        if (blockCounts[by * cols + bx] < 18) {
          const startY = by * blockSize;
          const endY = Math.min(height, startY + blockSize);
          const startX = bx * blockSize;
          const endX = Math.min(width, startX + blockSize);
          for (let y = startY; y < endY; y++) {
            const rowOffset = y * width;
            for (let x = startX; x < endX; x++) {
              const idx = (rowOffset + x) * 4;
              bgPixels[idx] = Math.round(
                0.95 * bgPixels[idx] + 0.05 * pixels[idx],
              );
              bgPixels[idx + 1] = Math.round(
                0.95 * bgPixels[idx + 1] + 0.05 * pixels[idx + 1],
              );
              bgPixels[idx + 2] = Math.round(
                0.95 * bgPixels[idx + 2] + 0.05 * pixels[idx + 2],
              );
            }
          }
        }
      }
    }
  }

  // --- Feedback ---
  private triggerFeedback(): void {
    if (this.hapticEnabled && "vibrate" in navigator) {
      try {
        navigator.vibrate([40]);
      } catch {
        // Vibrate not permitted
      }
    }

    if (this.soundEnabled) {
      this.playBeep();
    }
  }

  private playBeep(): void {
    try {
      if (!this.audioCtx) {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx) {
        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioCtx.currentTime + 0.06,
        );
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.06);
      }
    } catch {
      // Audio playback failed or blocked
    }
  }

  public updateFps(fps: number): void {
    this.fpsSubject.next(fps);
  }
}
