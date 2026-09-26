import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import * as QRCode from "qrcode";
import { firstValueFrom, Subscription, timeout } from "rxjs";
import { CameraInterfaceComponent } from "@app/components/camera-interface/camera-interface.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import { CameraConfig, LaneDetectionGate } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { HelpLinkService } from "@app/services/help-link.service";

@Component({
  selector: "app-camera-editor",
  templateUrl: "./camera-editor.component.html",
  styleUrls: ["./camera-editor.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    CameraInterfaceComponent,
  ],
})
export class CameraEditorComponent implements OnInit, OnDestroy {
  config = model.required<CameraConfig>();
  interfaceIndex = input.required<number>();
  lanes = input.required<number>();
  isEditMode = input<boolean>(true);

  change = output<void>();
  remove = output<void>();

  qrCodeDataUrl = signal<string | null>(null);
  pairingUrl = signal<string>("");
  showQrModal = signal<boolean>(false);
  showTestModal = signal<boolean>(false);
  copySuccess = signal<boolean>(false);
  tunnelLoading = signal<boolean>(false);
  tunnelActive = signal<boolean>(false);
  tunnelUrl = signal<string | null>(null);
  tunnelProvider = signal<string>("none");
  useDirectWifi = signal<boolean>(false);
  syncedFromRemote = signal<boolean>(false);
  private interfaceSub?: Subscription;

  sectionsExpanded = {
    camera: true,
    main: true,
    pairing: true,
    gates: true,
  };

  private serverIp = "";

  constructor(
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
    private helpLinkService: HelpLinkService,
  ) {
    effect(
      () => {
        const laneCount = this.lanes();
        this.interfaceIndex();
        const current = this.config();
        if (!current.gates || current.gates.length !== laneCount) {
          this.resetGatesToDefault(false);
        }
        this.generatePairingUrl();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.loadSectionsState();
    this.ensureGates();
    this.generatePairingUrl();
    this.fetchServerIp();
    this.initInterfaceSubscription();
  }

  ngOnDestroy(): void {
    if (this.interfaceSub) {
      this.interfaceSub.unsubscribe();
    }
  }

  private initInterfaceSubscription(): void {
    if (
      this.dataService &&
      typeof this.dataService.getInterfaceEvents === "function"
    ) {
      this.interfaceSub = this.dataService
        .getInterfaceEvents()
        .subscribe((event: any) => {
          if (
            event?.cameraGatesUpdate &&
            event.cameraGatesUpdate.interfaceIndex === this.interfaceIndex()
          ) {
            const rawGates = event.cameraGatesUpdate.gates || [];
            if (rawGates.length > 0) {
              const updatedGates: LaneDetectionGate[] = rawGates.map(
                (g: any) => ({
                  laneIndex: g.laneIndex ?? 0,
                  gateType: g.gateType ?? 0,
                  xPct: g.xPct ?? 0,
                  yPct: g.yPct ?? 0,
                  widthPct: g.widthPct ?? 0,
                  heightPct: g.heightPct ?? 0,
                  sensitivity: g.sensitivity ?? 0.5,
                }),
              );
              this.config.set({
                ...this.config(),
                gates: updatedGates,
              });
              this.onConfigChange();
              this.syncedFromRemote.set(true);
              this.cdr.markForCheck();
            }
          }
        });
    }
  }

  private fetchServerIp(): void {
    if (
      !this.dataService ||
      typeof this.dataService.getServerIp !== "function"
    ) {
      this.generatePairingUrl();
      return;
    }
    this.dataService.getServerIp().subscribe({
      next: (ip) => {
        if (ip && ip !== "Unknown") {
          this.serverIp = ip.trim();
        }
        this.generatePairingUrl();
      },
      error: () => {
        this.generatePairingUrl();
      },
    });
  }

  toggleSection(section: keyof typeof this.sectionsExpanded): void {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveSectionsState();
  }

  ensureSectionsExpanded(): void {
    this.sectionsExpanded.camera = true;
    this.sectionsExpanded.main = true;
    this.sectionsExpanded.pairing = true;
    this.sectionsExpanded.gates = true;
    this.cdr.detectChanges();
  }

  private saveSectionsState(): void {
    localStorage.setItem(
      `rc.camera-editor.sections.${this.interfaceIndex()}`,
      JSON.stringify(this.sectionsExpanded),
    );
  }

  private loadSectionsState(): void {
    const saved = localStorage.getItem(
      `rc.camera-editor.sections.${this.interfaceIndex()}`,
    );
    if (saved) {
      try {
        this.sectionsExpanded = {
          ...this.sectionsExpanded,
          ...JSON.parse(saved),
        };
      } catch {
        // Ignore invalid storage
      }
    }
  }

  public ensureGates(): void {
    const current = this.config();
    if (!current.gates || current.gates.length === 0) {
      this.resetGatesToDefault(false);
    }
  }

  public resetGatesToDefault(emitChange: boolean = true): void {
    const current = this.config();
    const laneCount = this.lanes();
    const gateWidth = 0.8 / laneCount;
    const gateHeight = 0.25;
    const y = 0.38;

    const newGates = [];
    for (let i = 0; i < laneCount; i++) {
      const x = 0.1 + i * gateWidth;
      newGates.push({
        laneIndex: i,
        gateType: 0,
        xPct: x,
        yPct: y,
        widthPct: gateWidth * 0.9,
        heightPct: gateHeight,
        sensitivity: 0.5,
      });
    }

    this.config().gates = newGates;
    this.config.set({
      ...current,
      gates: newGates,
    });
    if (emitChange) {
      this.onConfigChange();
    }
  }

  private resolveHost(): string {
    const loc = window.location;
    if (
      this.serverIp &&
      this.serverIp !== "Unknown" &&
      this.serverIp !== "127.0.0.1" &&
      this.serverIp !== "localhost"
    ) {
      return this.serverIp;
    }
    if (
      loc.hostname &&
      loc.hostname !== "localhost" &&
      loc.hostname !== "127.0.0.1"
    ) {
      return loc.hostname;
    }
    if (this.serverIp && this.serverIp !== "Unknown") {
      return this.serverIp;
    }
    return loc.hostname || "localhost";
  }

  private getGatesQueryParam(): string {
    const gates = this.config().gates;
    if (gates && gates.length > 0) {
      return `&gates=${encodeURIComponent(JSON.stringify(gates))}`;
    }
    return "";
  }

  public generatePairingUrl(): void {
    const gatesParam = this.getGatesQueryParam();
    if (this.tunnelActive() && this.tunnelUrl()) {
      const wsUrl =
        this.tunnelUrl()!.replace(/^http/, "ws") + "/api/interface-data";
      const url = `${this.tunnelUrl()}/camera_interface?server=${encodeURIComponent(
        wsUrl,
      )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}${gatesParam}`;
      this.pairingUrl.set(url);
      return;
    }

    const loc = window.location;
    const host = this.resolveHost();
    const clientPort = loc.port ? `:${loc.port}` : "";
    const clientBase = `${loc.protocol}//${host}${clientPort}`;

    const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const wsPort = this.dataService?.currentServerPort || 7070;
    const wsUrl = `${wsProtocol}//${host}:${wsPort}/api/interface-data`;

    const url = `${clientBase}/camera_interface?server=${encodeURIComponent(
      wsUrl,
    )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}${gatesParam}`;
    this.pairingUrl.set(url);
  }

  public setConnectionType(type: "local" | "remote"): void {
    if ((this.config().connectionType || "local") === type) return;
    this.config().connectionType = type;
    this.config.set({
      ...this.config(),
      connectionType: type,
    });
    this.onConfigChange();
  }

  public openStandaloneWindow(): void {
    const url = this.getLocalInterfaceUrl();
    window.open(url, "_blank");
  }

  public async toggleTunnelMode(): Promise<void> {
    const nextWifi = !this.useDirectWifi();
    this.useDirectWifi.set(nextWifi);
    await this.refreshPairingQr();
  }

  public async openQrModal(): Promise<void> {
    this.showQrModal.set(true);
    await this.refreshPairingQr();
  }

  public async refreshPairingQr(): Promise<void> {
    if (
      !this.useDirectWifi() &&
      this.dataService &&
      typeof this.dataService.startCameraTunnel === "function"
    ) {
      this.tunnelLoading.set(true);
      try {
        const port = this.dataService.currentServerPort || 7070;
        const tunnelStatus = await firstValueFrom(
          this.dataService.startCameraTunnel(port).pipe(timeout(15000)),
        );
        if (tunnelStatus && tunnelStatus.active && tunnelStatus.url) {
          this.tunnelActive.set(true);
          this.tunnelUrl.set(tunnelStatus.url);
          this.tunnelProvider.set(tunnelStatus.provider);

          const wsUrl =
            tunnelStatus.url.replace(/^http/, "ws") + "/api/interface-data";
          const gatesParam = this.getGatesQueryParam();
          const url = `${tunnelStatus.url}/camera_interface?server=${encodeURIComponent(
            wsUrl,
          )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}${gatesParam}`;
          this.pairingUrl.set(url);
          await this.renderQrCode(url);
          this.tunnelLoading.set(false);
          return;
        }
      } catch {
        // Fall back to local Wi-Fi if tunnel times out or errors
      } finally {
        this.tunnelLoading.set(false);
      }
    }

    // Direct Wi-Fi or fallback
    this.tunnelActive.set(false);
    if (
      !this.serverIp &&
      this.dataService &&
      typeof this.dataService.getServerIp === "function"
    ) {
      try {
        const ip = await firstValueFrom(
          this.dataService.getServerIp().pipe(timeout(2000)),
        );
        if (ip && ip !== "Unknown") {
          this.serverIp = ip.trim();
        }
      } catch {
        // Fall back to hostname
      }
    }
    this.generatePairingUrl();
    await this.renderQrCode(this.pairingUrl());
  }

  private async renderQrCode(url: string): Promise<void> {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 260,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      this.qrCodeDataUrl.set(dataUrl);
    } catch {
      // Failed to generate QR
    }
  }

  public closeQrModal(): void {
    this.showQrModal.set(false);
  }

  public copyPairingUrl(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.pairingUrl()).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      });
    }
  }

  public getLocalWsUrl(): string {
    const loc = window.location;
    const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const wsPort = this.dataService?.currentServerPort || 7070;
    return `${wsProtocol}//${loc.hostname}:${wsPort}/api/interface-data`;
  }

  public getLocalInterfaceUrl(): string {
    const loc = window.location;
    const wsUrl = this.getLocalWsUrl();
    const gatesParam = this.getGatesQueryParam();

    return `${loc.origin}/camera_interface?server=${encodeURIComponent(
      wsUrl,
    )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}${gatesParam}`;
  }

  public openLocalInterface(): void {
    this.showTestModal.set(true);
  }

  public closeTestModal(): void {
    this.showTestModal.set(false);
  }

  public onGatesUpdatedFromModal(updatedGates: LaneDetectionGate[]): void {
    if (!updatedGates || !Array.isArray(updatedGates)) return;
    this.config().gates = [...updatedGates];
    this.config.set({
      ...this.config(),
      gates: [...updatedGates],
    });
    this.onConfigChange();
  }

  public onConfigChange(): void {
    this.change.emit();
  }

  public onRemove(): void {
    if (!this.isEditMode()) return;
    this.remove.emit();
  }

  public openHelp(): void {
    this.helpLinkService.openHelp("camera-setup");
  }
}
