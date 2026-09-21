import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { LaneDetectionGate } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CameraVisionService } from "@app/services/camera-vision.service";
import { HelpLinkService } from "@app/services/help-link.service";

interface DragState {
  type: "move" | "resize";
  gateIndex: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

@Component({
  selector: "app-camera-interface",
  templateUrl: "./camera-interface.component.html",
  styleUrls: ["./camera-interface.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class CameraInterfaceComponent implements OnInit, OnDestroy {
  @ViewChild("videoElement") videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild("analysisCanvas") canvasElementRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("overlaySvg") overlaySvgRef!: ElementRef<SVGSVGElement>;

  // Routing & connection info
  serverUrl = "";
  interfaceIndex = 0;
  numLanes = 4;

  // Real-time state signals
  isConnected = signal<boolean>(false);
  fps = signal<number>(0);
  batteryLevel = signal<number>(1.0);
  facingMode = signal<"environment" | "user">("environment");
  gates = signal<LaneDetectionGate[]>([]);
  selectedGateIndex = signal<number | null>(null);
  lastTriggeredLane = signal<number | null>(null);
  cameraErrorMessage = signal<string | null>(null);

  // Auto-Snap wizard state
  isAutoSnapping = signal<boolean>(false);
  autoSnapLane = signal<number>(0);
  autoSnapFrames = signal<number>(0);
  private autoSnapBg: Uint8ClampedArray | null = null;

  // Settings drawer state
  showSettings = signal<boolean>(false);
  soundEnabled = signal<boolean>(true);
  hapticEnabled = signal<boolean>(true);
  globalSensitivity = signal<number>(0.5);

  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private subscriptions: Subscription[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private fpsCalcTimer = performance.now();
  private flashTimeoutId: any = null;
  private dragState: DragState | null = null;

  constructor(
    public cameraVisionService: CameraVisionService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private helpLinkService: HelpLinkService,
  ) {}

  ngOnInit(): void {
    this.readQueryParams();
    this.initSettings();
    this.initSubscriptions();
    this.loadGates();
    this.connectToServer();
    this.startCameraStream();
    this.cameraVisionService.requestWakeLock();
  }

  ngOnDestroy(): void {
    this.cameraVisionService.releaseWakeLock();
    this.stopCameraStream();
    this.cameraVisionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
  }

  private readQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    this.interfaceIndex =
      params["interface"] !== undefined ? Number(params["interface"]) : 0;
    this.numLanes =
      params["lanes"] !== undefined ? Math.max(1, Number(params["lanes"])) : 4;

    if (params["server"]) {
      this.serverUrl = params["server"];
    } else {
      const loc = window.location;
      const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
      const port =
        loc.port === "4200"
          ? "7070"
          : loc.port || (loc.protocol === "https:" ? "443" : "7070");
      this.serverUrl = `${wsProtocol}//${loc.hostname}:${port}/api/interface-data`;
    }
  }

  private initSettings(): void {
    this.soundEnabled.set(this.cameraVisionService.soundEnabled);
    this.hapticEnabled.set(this.cameraVisionService.hapticEnabled);
  }

  private initSubscriptions(): void {
    this.subscriptions.push(
      this.cameraVisionService.isConnected$.subscribe((connected) => {
        this.isConnected.set(connected);
      }),
    );

    this.subscriptions.push(
      this.cameraVisionService.batteryLevel$.subscribe((battery) => {
        this.batteryLevel.set(battery);
      }),
    );
  }

  public connectToServer(): void {
    this.cameraVisionService.connect(this.serverUrl, this.interfaceIndex);
  }

  private loadGates(): void {
    const storageKey = `rc_cam_gates_${this.interfaceIndex}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.gates.set(parsed);
          return;
        }
      } catch {
        // Fall back to defaults
      }
    }
    this.resetGatesToDefault();
  }

  public saveGates(): void {
    const storageKey = `rc_cam_gates_${this.interfaceIndex}`;
    localStorage.setItem(storageKey, JSON.stringify(this.gates()));
  }

  public resetGatesToDefault(): void {
    const newGates: LaneDetectionGate[] = [];
    const laneCount = this.numLanes;
    const gateWidth = 0.8 / laneCount;
    const gateHeight = 0.25;
    const y = 0.38;

    for (let i = 0; i < laneCount; i++) {
      const x = 0.1 + i * gateWidth;
      newGates.push({
        laneIndex: i,
        gateType: 0,
        xPct: x,
        yPct: y,
        widthPct: gateWidth * 0.9,
        heightPct: gateHeight,
        sensitivity: this.globalSensitivity(),
      });
    }
    this.gates.set(newGates);
    this.saveGates();
  }

  public async startCameraStream(): Promise<void> {
    this.stopCameraStream();

    if (
      typeof navigator === "undefined" ||
      !navigator?.mediaDevices?.getUserMedia
    ) {
      this.cameraErrorMessage.set("CAMERA_ERROR_INSECURE_OR_UNSUPPORTED");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: this.facingMode() },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr: any) {
        if (
          constraintErr?.name === "NotAllowedError" ||
          constraintErr?.name === "PermissionDeniedError"
        ) {
          throw constraintErr;
        }
        // Fallback to basic video constraint for desktop webcams lacking environment facingMode
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      this.cameraErrorMessage.set(null);
      if (this.videoElementRef?.nativeElement) {
        this.videoElementRef.nativeElement.srcObject = this.stream;
        this.videoElementRef.nativeElement.onloadedmetadata = () => {
          this.videoElementRef.nativeElement.play().catch(() => {});
          this.startProcessingLoop();
        };
      }
    } catch (err: any) {
      if (
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError"
      ) {
        this.cameraErrorMessage.set("CAMERA_ERROR_PERMISSION_DENIED");
      } else {
        this.cameraErrorMessage.set("CAMERA_ERROR_NOT_FOUND");
      }
    }
  }

  public stopCameraStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  public toggleCamera(): void {
    const nextMode =
      this.facingMode() === "environment" ? "user" : "environment";
    this.facingMode.set(nextMode);
    this.startCameraStream();
  }

  private startProcessingLoop(): void {
    const process = () => {
      this.animFrameId = requestAnimationFrame(process);
      this.calculateFps();

      const video = this.videoElementRef?.nativeElement;
      const canvas = this.canvasElementRef?.nativeElement;
      if (
        !video ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !canvas
      ) {
        return;
      }

      if (this.isAutoSnapping()) {
        this.processAutoSnapFrame(video, canvas);
        return;
      }

      const results = this.cameraVisionService.processFrame(
        video,
        canvas,
        this.gates(),
        this.interfaceIndex,
      );

      if (results.length > 0) {
        this.onGateTriggered(results[0].lane);
      }
    };
    this.animFrameId = requestAnimationFrame(process);
  }

  private calculateFps(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.fpsCalcTimer >= 1000) {
      const calculated = Math.round(
        (this.frameCount * 1000) / (now - this.fpsCalcTimer),
      );
      this.fps.set(calculated);
      this.frameCount = 0;
      this.fpsCalcTimer = now;
    }
  }

  private onGateTriggered(lane: number): void {
    this.lastTriggeredLane.set(lane);
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
    this.flashTimeoutId = setTimeout(() => {
      this.lastTriggeredLane.set(null);
      this.cdr.markForCheck();
    }, 350);
  }

  // --- Auto-Snap Calibration Wizard ---
  public startAutoSnap(): void {
    this.isAutoSnapping.set(true);
    this.autoSnapLane.set(0);
    this.autoSnapFrames.set(0);
    this.autoSnapBg = null;
  }

  public cancelAutoSnap(): void {
    this.isAutoSnapping.set(false);
    this.autoSnapBg = null;
  }

  public skipAutoSnapLane(): void {
    const nextLane = this.autoSnapLane() + 1;
    if (nextLane >= this.numLanes) {
      this.finishAutoSnap();
    } else {
      this.autoSnapLane.set(nextLane);
      this.autoSnapFrames.set(0);
      this.autoSnapBg = null;
    }
  }

  private processAutoSnapFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
  ): void {
    const { envelope, currentBg } =
      this.cameraVisionService.detectMotionEnvelope(
        video,
        canvas,
        this.autoSnapBg,
      );
    this.autoSnapBg = currentBg;

    if (envelope && envelope.density > 20) {
      const currentCount = this.autoSnapFrames() + 1;
      this.autoSnapFrames.set(currentCount);

      if (currentCount >= 15) {
        this.applyAutoSnapGate(this.autoSnapLane(), envelope);
        this.skipAutoSnapLane();
      }
    }
  }

  private applyAutoSnapGate(lane: number, envelope: any): void {
    const currentGates = [...this.gates()];
    const gateIndex = currentGates.findIndex((g) => g.laneIndex === lane);
    const updatedGate: LaneDetectionGate = {
      laneIndex: lane,
      gateType: 0,
      xPct: Math.max(0, envelope.minX - 0.03),
      yPct: Math.max(0, envelope.minY - 0.05),
      widthPct: Math.min(1.0, envelope.maxX - envelope.minX + 0.06),
      heightPct: Math.min(1.0, envelope.maxY - envelope.minY + 0.1),
      sensitivity: this.globalSensitivity(),
    };

    if (gateIndex >= 0) {
      currentGates[gateIndex] = updatedGate;
    } else {
      currentGates.push(updatedGate);
    }
    this.gates.set(currentGates);
    this.saveGates();
  }

  public finishAutoSnap(): void {
    this.isAutoSnapping.set(false);
    this.autoSnapBg = null;
  }

  // --- Touch & Mouse Gate Editing ---
  public selectGate(index: number, event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
    this.selectedGateIndex.set(index);
  }

  public onGatePointerDown(
    index: number,
    event: MouseEvent | TouchEvent,
  ): void {
    event.stopPropagation();
    this.selectedGateIndex.set(index);
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    const gate = this.gates()[index];

    this.dragState = {
      type: "move",
      gateIndex: index,
      startX: clientX,
      startY: clientY,
      origX: gate.xPct,
      origY: gate.yPct,
      origW: gate.widthPct,
      origH: gate.heightPct,
    };
  }

  public onResizePointerDown(
    index: number,
    event: MouseEvent | TouchEvent,
  ): void {
    event.stopPropagation();
    this.selectedGateIndex.set(index);
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    const gate = this.gates()[index];

    this.dragState = {
      type: "resize",
      gateIndex: index,
      startX: clientX,
      startY: clientY,
      origX: gate.xPct,
      origY: gate.yPct,
      origW: gate.widthPct,
      origH: gate.heightPct,
    };
  }

  @HostListener("window:mousemove", ["$event"])
  @HostListener("window:touchmove", ["$event"])
  public onPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragState || !this.overlaySvgRef) return;
    const rect = this.overlaySvgRef.nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    const deltaXPct = (clientX - this.dragState.startX) / rect.width;
    const deltaYPct = (clientY - this.dragState.startY) / rect.height;

    const currentGates = [...this.gates()];
    const gate = { ...currentGates[this.dragState.gateIndex] };

    if (this.dragState.type === "move") {
      gate.xPct = Math.max(
        0,
        Math.min(1.0 - gate.widthPct, this.dragState.origX + deltaXPct),
      );
      gate.yPct = Math.max(
        0,
        Math.min(1.0 - gate.heightPct, this.dragState.origY + deltaYPct),
      );
    } else {
      gate.widthPct = Math.max(
        0.05,
        Math.min(1.0 - gate.xPct, this.dragState.origW + deltaXPct),
      );
      gate.heightPct = Math.max(
        0.05,
        Math.min(1.0 - gate.yPct, this.dragState.origH + deltaYPct),
      );
    }

    currentGates[this.dragState.gateIndex] = gate;
    this.gates.set(currentGates);
  }

  @HostListener("window:mouseup")
  @HostListener("window:touchend")
  public onPointerUp(): void {
    if (this.dragState) {
      this.dragState = null;
      this.saveGates();
    }
  }

  // --- Settings Handlers ---
  public toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    this.cameraVisionService.setSoundEnabled(next);
  }

  public toggleHaptic(): void {
    const next = !this.hapticEnabled();
    this.hapticEnabled.set(next);
    this.cameraVisionService.setHapticEnabled(next);
  }

  public onSensitivityChange(val: number): void {
    this.globalSensitivity.set(val);
    const updated = this.gates().map((g) => ({ ...g, sensitivity: val }));
    this.gates.set(updated);
    this.saveGates();
  }

  public goBack(): void {
    this.router.navigate(["/"]);
  }

  public openHelp(): void {
    this.helpLinkService.openHelp("camera-setup");
  }
}
