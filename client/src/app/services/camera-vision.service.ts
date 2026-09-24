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
  ): { envelope: CalibrationMotion | null; currentBg: Uint8ClampedArray } {
    const vidW = video.videoWidth;
    const vidH = video.videoHeight;
    canvas.width = Math.min(320, vidW);
    canvas.height = Math.min(180, vidH);

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

    let minX = canvas.width;
    let maxX = 0;
    let minY = canvas.height;
    let maxY = 0;
    let diffCount = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const diff =
          (Math.abs(pixels[idx] - bgPixels[idx]) +
            Math.abs(pixels[idx + 1] - bgPixels[idx + 1]) +
            Math.abs(pixels[idx + 2] - bgPixels[idx + 2])) /
          3;

        bgPixels[idx] = Math.round(0.95 * bgPixels[idx] + 0.05 * pixels[idx]);
        bgPixels[idx + 1] = Math.round(
          0.95 * bgPixels[idx + 1] + 0.05 * pixels[idx + 1],
        );
        bgPixels[idx + 2] = Math.round(
          0.95 * bgPixels[idx + 2] + 0.05 * pixels[idx + 2],
        );

        if (diff > 25) {
          diffCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const density = diffCount / (canvas.width * canvas.height);
    if (density > 0.04 && maxX > minX && maxY > minY) {
      return {
        envelope: {
          minX: minX / canvas.width,
          maxX: maxX / canvas.width,
          minY: minY / canvas.height,
          maxY: maxY / canvas.height,
          density,
        },
        currentBg: bgPixels,
      };
    }
    return { envelope: null, currentBg: bgPixels };
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
