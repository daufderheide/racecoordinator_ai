import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { LaneDetectionGate } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  CameraVisionService,
  RegionOfInterest,
} from "@app/services/camera-vision.service";
import { HelpLinkService } from "@app/services/help-link.service";

import {
  computeActiveLaneSubRoi,
  computeAutoSnapGate,
  computeAutoSplitGates,
  computeDefaultGates,
  computeGateDrag,
  computeInitialFinishLineZone,
  computeZoneDraw,
  computeZoneLaneDividers,
  computeZoneLanePreviews,
  computeZoneMove,
  computeZoneResize,
  DragState,
  extractPointerCoords,
  parseGatesParam,
  resolveDefaultServerUrl,
} from "./camera-interface.utils";

@Component({
  selector: "app-camera-interface",
  templateUrl: "./camera-interface.component.html",
  styleUrls: ["./camera-interface.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class CameraInterfaceComponent implements OnInit, OnDestroy {
  @ViewChild("videoElement") videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild("analysisCanvas") canvasElementRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("overlaySvg") overlaySvgRef!: ElementRef<SVGSVGElement>;

  // Modal / embedded usage inputs & outputs
  isModal = input<boolean>(false);
  initialGates = input<LaneDetectionGate[] | null>(null);
  modalInterfaceIndex = input<number | null>(null);
  modalNumLanes = input<number | null>(null);
  modalServerUrl = input<string | null>(null);

  gatesChange = output<LaneDetectionGate[]>();
  close = output<void>();

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
  availableDevices = signal<MediaDeviceInfo[]>([]);
  selectedDeviceId = signal<string | null>(null);

  // Auto-Snap wizard state
  isAutoSnapping = signal<boolean>(false);
  autoSnapStage = signal<"zone" | "car">("zone");
  autoSnapLane = signal<number>(0);
  autoSnapFrames = signal<number>(0);
  finishLineZone = signal<RegionOfInterest>({
    xPct: 0.1,
    yPct: 0.35,
    widthPct: 0.8,
    heightPct: 0.3,
  });

  splitOrientation = signal<"auto" | "rows" | "columns">("auto");

  isRowSplit = computed<boolean>(() => {
    const orientation = this.splitOrientation();
    if (orientation === "rows") return true;
    if (orientation === "columns") return false;
    const zone = this.finishLineZone();
    return zone.heightPct > zone.widthPct;
  });

  zoneLaneDividers = computed<
    { x1: number; y1: number; x2: number; y2: number }[]
  >(() => {
    return computeZoneLaneDividers(
      this.finishLineZone(),
      this.numLanes,
      this.isRowSplit(),
    );
  });

  zoneLanePreviews = computed<
    { laneIndex: number; centerX: number; centerY: number }[]
  >(() => {
    return computeZoneLanePreviews(
      this.finishLineZone(),
      this.numLanes,
      this.isRowSplit(),
    );
  });

  private autoSnapBg: Uint8ClampedArray | null = null;
  private autoSnapAccumulatedEnvelope: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null = null;
  private isAutoSnapTransitioning = false;
  private autoSnapTransitionTimeout: ReturnType<typeof setTimeout> | null =
    null;
  private autoSnapIdleTimer: ReturnType<typeof setTimeout> | null = null;
  public showSavedToast = signal<boolean>(false);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private queryGates: LaneDetectionGate[] | null = null;

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
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.clearAutoSnapTimers();
  }

  private readQueryParams(): void {
    if (this.isModal()) {
      const modalIdx = this.modalInterfaceIndex();
      this.interfaceIndex =
        modalIdx !== null && modalIdx !== undefined ? modalIdx : 0;
      const modalLanes = this.modalNumLanes();
      this.numLanes =
        modalLanes !== null && modalLanes !== undefined
          ? Math.max(1, modalLanes)
          : 4;
      const modalUrl = this.modalServerUrl();
      if (modalUrl) {
        this.serverUrl = modalUrl;
      } else {
        this.serverUrl = resolveDefaultServerUrl(window.location);
      }
      return;
    }

    const params = this.route?.snapshot?.queryParams || {};
    this.interfaceIndex =
      params["interface"] !== undefined ? Number(params["interface"]) : 0;
    this.numLanes =
      params["lanes"] !== undefined ? Math.max(1, Number(params["lanes"])) : 4;
    this.queryGates = parseGatesParam(params["gates"], this.numLanes);

    if (params["server"]) {
      this.serverUrl = params["server"];
    } else {
      this.serverUrl = resolveDefaultServerUrl(window.location);
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

    if (!this.isModal() && this.route?.queryParams) {
      this.subscriptions.push(
        this.route.queryParams.subscribe((params) => {
          if (!params) return;
          const newInterface =
            params["interface"] !== undefined ? Number(params["interface"]) : 0;
          const newLanes =
            params["lanes"] !== undefined
              ? Math.max(1, Number(params["lanes"]))
              : 4;
          const lanesChanged = this.numLanes !== newLanes;
          const interfaceChanged = this.interfaceIndex !== newInterface;
          this.interfaceIndex = newInterface;
          this.numLanes = newLanes;
          if (lanesChanged || interfaceChanged) {
            this.loadGates();
          }
        }),
      );
    }
  }

  public connectToServer(): void {
    this.cameraVisionService.connect(this.serverUrl, this.interfaceIndex);
  }

  public loadGates(): void {
    if (
      this.isModal() &&
      this.initialGates() &&
      this.initialGates()!.length === this.numLanes
    ) {
      this.gates.set(JSON.parse(JSON.stringify(this.initialGates()!)));
      return;
    }

    if (this.queryGates && this.queryGates.length === this.numLanes) {
      this.gates.set(JSON.parse(JSON.stringify(this.queryGates)));
      return;
    }

    const storageKey = `rc_cam_gates_${this.interfaceIndex}_${this.numLanes}`;
    let saved = localStorage.getItem(storageKey);
    if (!saved) {
      const legacyKey = `rc_cam_gates_${this.interfaceIndex}`;
      saved = localStorage.getItem(legacyKey);
    }

    const parsed = parseGatesParam(saved, this.numLanes);
    if (parsed) {
      this.gates.set(parsed);
      return;
    }
    this.resetGatesToDefault();
  }

  public saveGates(): void {
    const storageKey = `rc_cam_gates_${this.interfaceIndex}_${this.numLanes}`;
    localStorage.setItem(storageKey, JSON.stringify(this.gates()));
    this.gatesChange.emit(this.gates());
    this.cameraVisionService.sendGatesUpdate(this.interfaceIndex, this.gates());
    this.syncGatesToRestApi();
    this.showSaveToast();
  }

  private syncGatesToRestApi(): void {
    if (typeof fetch === "function") {
      fetch("/api/camera/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interfaceIndex: this.interfaceIndex,
          gates: this.gates(),
        }),
      }).catch(() => {
        // Ignore network failure; WebSocket is primary
      });
    }
  }

  public showSaveToast(): void {
    this.showSavedToast.set(true);
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.showSavedToast.set(false);
      this.cdr.markForCheck();
    }, 2500);
  }

  public resetGatesToDefault(): void {
    const newGates = computeDefaultGates(
      this.numLanes,
      this.globalSensitivity(),
    );
    this.gates.set(newGates);
    this.saveGates();
  }

  public async startCameraStream(): Promise<void> {
    this.stopCameraStream();

    if (typeof window !== "undefined" && (window as any).isPlaywright) {
      this.cameraErrorMessage.set(null);
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator?.mediaDevices?.getUserMedia
    ) {
      this.cameraErrorMessage.set("CAMERA_ERROR_INSECURE_OR_UNSUPPORTED");
      return;
    }

    try {
      const videoConstraints: MediaTrackConstraints = this.selectedDeviceId()
        ? { deviceId: { exact: this.selectedDeviceId()! } }
        : {
            facingMode: { ideal: this.facingMode() },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
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
      this.loadAvailableDevices();
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

  public async loadAvailableDevices(): Promise<void> {
    if (
      typeof navigator === "undefined" ||
      !navigator?.mediaDevices?.enumerateDevices
    ) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      this.availableDevices.set(videoInputs);
    } catch {
      // Ignore
    }
  }

  public selectDevice(deviceId: string): void {
    if (this.selectedDeviceId() === deviceId) return;
    this.selectedDeviceId.set(deviceId);
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.startCameraStream();
  }

  public stopCameraStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  public toggleCamera(): void {
    const devices = this.availableDevices();
    if (devices.length > 1) {
      const currentId = this.selectedDeviceId();
      const currentIndex = devices.findIndex((d) => d.deviceId === currentId);
      const nextIndex = (currentIndex + 1) % devices.length;
      this.selectDevice(devices[nextIndex].deviceId);
      return;
    }
    const nextMode =
      this.facingMode() === "environment" ? "user" : "environment";
    this.facingMode.set(nextMode);
    this.startCameraStream();
  }

  private startProcessingLoop(): void {
    if (typeof window !== "undefined" && (window as any).isPlaywright) {
      return;
    }
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
        if (this.autoSnapStage() === "car") {
          this.processAutoSnapFrame(video, canvas);
        }
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
    this.clearAutoSnapTimers();
    this.isAutoSnapTransitioning = false;
    this.autoSnapStage.set("zone");
    this.isAutoSnapping.set(true);
    this.autoSnapLane.set(0);
    this.autoSnapFrames.set(0);
    this.autoSnapBg = null;
    this.autoSnapAccumulatedEnvelope = null;
    this.initFinishLineZone();
  }

  private initFinishLineZone(): void {
    this.finishLineZone.set(computeInitialFinishLineZone(this.gates()));
  }

  public setSplitOrientation(orientation: "rows" | "columns"): void {
    this.splitOrientation.set(orientation);
  }

  public getActiveLaneSubRoi(): RegionOfInterest {
    return computeActiveLaneSubRoi(
      this.finishLineZone(),
      this.numLanes,
      this.autoSnapLane(),
      this.isRowSplit(),
    );
  }

  public applyAutoSplit(): void {
    const newGates = computeAutoSplitGates(
      this.finishLineZone(),
      this.numLanes,
      this.isRowSplit(),
      this.globalSensitivity(),
    );
    this.gates.set(newGates);
    this.saveGates();
    this.finishAutoSnap();
  }

  public startCarCalibration(): void {
    this.clearAutoSnapTimers();
    this.isAutoSnapTransitioning = false;
    this.autoSnapStage.set("car");
    this.autoSnapLane.set(0);
    this.autoSnapFrames.set(0);
    this.autoSnapBg = null;
    this.autoSnapAccumulatedEnvelope = null;
  }

  public cancelAutoSnap(): void {
    this.clearAutoSnapTimers();
    this.isAutoSnapTransitioning = false;
    this.isAutoSnapping.set(false);
    this.autoSnapStage.set("zone");
    this.autoSnapBg = null;
    this.autoSnapAccumulatedEnvelope = null;
  }

  public skipAutoSnapLane(): void {
    this.clearAutoSnapTimers();
    this.isAutoSnapTransitioning = false;
    this.advanceAutoSnapLane();
  }

  private advanceAutoSnapLane(): void {
    const nextLane = this.autoSnapLane() + 1;
    if (nextLane >= this.numLanes) {
      this.finishAutoSnap();
    } else {
      this.autoSnapLane.set(nextLane);
      this.autoSnapFrames.set(0);
      this.autoSnapBg = null;
      this.autoSnapAccumulatedEnvelope = null;
      this.cdr.markForCheck();
    }
  }

  private clearAutoSnapTimers(): void {
    if (this.autoSnapTransitionTimeout) {
      clearTimeout(this.autoSnapTransitionTimeout);
      this.autoSnapTransitionTimeout = null;
    }
    if (this.autoSnapIdleTimer) {
      clearTimeout(this.autoSnapIdleTimer);
      this.autoSnapIdleTimer = null;
    }
  }

  private processAutoSnapFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
  ): void {
    if (this.isAutoSnapTransitioning) {
      return;
    }

    const laneSubRoi = this.getActiveLaneSubRoi();
    const { envelope, currentBg } =
      this.cameraVisionService.detectMotionEnvelope(
        video,
        canvas,
        this.autoSnapBg,
        laneSubRoi,
      );
    this.autoSnapBg = currentBg;

    if (envelope) {
      if (this.autoSnapIdleTimer) {
        clearTimeout(this.autoSnapIdleTimer);
      }
      this.autoSnapIdleTimer = setTimeout(() => {
        if (this.isAutoSnapping() && !this.isAutoSnapTransitioning) {
          this.autoSnapFrames.set(0);
          this.autoSnapAccumulatedEnvelope = null;
          this.cdr.markForCheck();
        }
      }, 2500);

      const currentCount = this.autoSnapFrames() + 1;
      this.autoSnapFrames.set(currentCount);

      if (currentCount >= 4) {
        if (this.autoSnapIdleTimer) {
          clearTimeout(this.autoSnapIdleTimer);
          this.autoSnapIdleTimer = null;
        }
        this.applyAutoSnapGate(this.autoSnapLane());
        this.isAutoSnapTransitioning = true;
        this.autoSnapTransitionTimeout = setTimeout(() => {
          this.isAutoSnapTransitioning = false;
          this.autoSnapTransitionTimeout = null;
          this.advanceAutoSnapLane();
        }, 800);
      }
    }
  }

  private applyAutoSnapGate(lane: number): void {
    const updatedGate = computeAutoSnapGate(
      this.getActiveLaneSubRoi(),
      this.isRowSplit(),
      lane,
      this.globalSensitivity(),
    );

    const currentGates = [...this.gates()];
    const gateIndex = currentGates.findIndex((g) => g.laneIndex === lane);

    if (gateIndex >= 0) {
      currentGates[gateIndex] = updatedGate;
    } else {
      currentGates.push(updatedGate);
    }
    this.gates.set(currentGates);
    this.saveGates();
  }

  public finishAutoSnap(): void {
    this.clearAutoSnapTimers();
    this.isAutoSnapTransitioning = false;
    this.isAutoSnapping.set(false);
    this.autoSnapStage.set("zone");
    this.autoSnapBg = null;
    this.autoSnapAccumulatedEnvelope = null;
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
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    this.selectedGateIndex.set(index);
    const { clientX, clientY } = extractPointerCoords(event);
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
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    this.selectedGateIndex.set(index);
    const { clientX, clientY } = extractPointerCoords(event);
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

  public onSvgPointerDown(event: MouseEvent | TouchEvent): void {
    if (
      !this.isAutoSnapping() ||
      this.autoSnapStage() !== "zone" ||
      !this.overlaySvgRef
    ) {
      return;
    }
    if (event.cancelable) event.preventDefault();
    const rect = this.overlaySvgRef.nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const { clientX, clientY } = extractPointerCoords(event);

    const clickXPct = Math.max(
      0,
      Math.min(1.0, (clientX - rect.left) / rect.width),
    );
    const clickYPct = Math.max(
      0,
      Math.min(1.0, (clientY - rect.top) / rect.height),
    );

    this.dragState = {
      type: "zone-draw",
      startX: clientX,
      startY: clientY,
      origX: clickXPct,
      origY: clickYPct,
      origW: 0,
      origH: 0,
    };
  }

  public onZonePointerDown(event: MouseEvent | TouchEvent): void {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    const { clientX, clientY } = extractPointerCoords(event);
    const zone = this.finishLineZone();

    this.dragState = {
      type: "zone-move",
      startX: clientX,
      startY: clientY,
      origX: zone.xPct,
      origY: zone.yPct,
      origW: zone.widthPct,
      origH: zone.heightPct,
    };
  }

  public onZoneResizePointerDown(
    corner: "nw" | "ne" | "sw" | "se",
    event: MouseEvent | TouchEvent,
  ): void {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    const { clientX, clientY } = extractPointerCoords(event);
    const zone = this.finishLineZone();

    this.dragState = {
      type: "zone-resize",
      corner,
      startX: clientX,
      startY: clientY,
      origX: zone.xPct,
      origY: zone.yPct,
      origW: zone.widthPct,
      origH: zone.heightPct,
    };
  }

  @HostListener("window:mousemove", ["$event"])
  @HostListener("window:touchmove", ["$event"])
  public onPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragState || !this.overlaySvgRef) return;
    if (event.cancelable) event.preventDefault();
    const rect = this.overlaySvgRef.nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const { clientX, clientY } = extractPointerCoords(event);
    const deltaXPct = (clientX - this.dragState.startX) / rect.width;
    const deltaYPct = (clientY - this.dragState.startY) / rect.height;

    if (this.dragState.type === "zone-draw") {
      this.handleZoneDraw(clientX, clientY, rect);
      return;
    }

    if (this.dragState.type === "zone-move") {
      this.handleZoneMove(deltaXPct, deltaYPct);
      return;
    }

    if (this.dragState.type === "zone-resize") {
      this.handleZoneResize(deltaXPct, deltaYPct);
      return;
    }

    if (this.dragState.gateIndex === undefined) return;
    const currentGates = [...this.gates()];
    const gate = { ...currentGates[this.dragState.gateIndex] };
    const updated = computeGateDrag(
      this.dragState.type as "move" | "resize",
      this.dragState.origX,
      this.dragState.origY,
      this.dragState.origW,
      this.dragState.origH,
      deltaXPct,
      deltaYPct,
    );
    gate.xPct = updated.xPct;
    gate.yPct = updated.yPct;
    gate.widthPct = updated.widthPct;
    gate.heightPct = updated.heightPct;

    currentGates[this.dragState.gateIndex] = gate;
    this.gates.set(currentGates);
  }

  private handleZoneDraw(
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ): void {
    if (!this.dragState) return;
    this.finishLineZone.set(
      computeZoneDraw(
        this.dragState.startX,
        this.dragState.startY,
        clientX,
        clientY,
        rect,
      ),
    );
  }

  private handleZoneMove(deltaXPct: number, deltaYPct: number): void {
    if (!this.dragState) return;
    const { xPct, yPct } = computeZoneMove(
      this.dragState.origX,
      this.dragState.origY,
      this.dragState.origW,
      this.dragState.origH,
      deltaXPct,
      deltaYPct,
    );
    this.finishLineZone.set({
      ...this.finishLineZone(),
      xPct,
      yPct,
    });
  }

  private handleZoneResize(deltaXPct: number, deltaYPct: number): void {
    if (!this.dragState) return;
    const corner = this.dragState.corner || "se";
    this.finishLineZone.set(
      computeZoneResize(
        corner,
        this.dragState.origX,
        this.dragState.origY,
        this.dragState.origW,
        this.dragState.origH,
        deltaXPct,
        deltaYPct,
      ),
    );
  }

  @HostListener("window:mouseup")
  @HostListener("window:touchend")
  public onPointerUp(): void {
    if (this.dragState) {
      const isGateDrag =
        this.dragState.type === "move" || this.dragState.type === "resize";
      this.dragState = null;
      if (isGateDrag) {
        this.saveGates();
      }
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
    if (this.isModal()) {
      this.close.emit();
      return;
    }
    if (typeof window !== "undefined") {
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
    }
    this.router.navigate(["/track-editor"]);
  }

  public openHelp(): void {
    this.helpLinkService.openHelp("camera-setup");
  }
}
