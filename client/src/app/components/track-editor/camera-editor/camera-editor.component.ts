import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  input,
  model,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import * as QRCode from "qrcode";
import { firstValueFrom, timeout } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import { CameraConfig } from "@app/models/camera_config";
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
  ],
})
export class CameraEditorComponent implements OnInit {
  config = model.required<CameraConfig>();
  interfaceIndex = input.required<number>();
  lanes = input.required<number>();
  isEditMode = input<boolean>(true);

  change = output<void>();
  remove = output<void>();

  qrCodeDataUrl = signal<string | null>(null);
  pairingUrl = signal<string>("");
  showQrModal = signal<boolean>(false);
  copySuccess = signal<boolean>(false);

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
    const laneCount = this.lanes();
    if (!current.gates || current.gates.length !== laneCount) {
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

  public generatePairingUrl(): void {
    const loc = window.location;
    const host = this.resolveHost();
    const clientPort = loc.port ? `:${loc.port}` : "";
    const clientBase = `${loc.protocol}//${host}${clientPort}`;

    const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const wsPort = this.dataService?.currentServerPort || 7070;
    const wsUrl = `${wsProtocol}//${host}:${wsPort}/api/interface-data`;

    const url = `${clientBase}/camera_interface?server=${encodeURIComponent(
      wsUrl,
    )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}`;
    this.pairingUrl.set(url);
  }

  public async openQrModal(): Promise<void> {
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
    try {
      const dataUrl = await QRCode.toDataURL(this.pairingUrl(), {
        margin: 1,
        width: 260,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      this.qrCodeDataUrl.set(dataUrl);
      this.showQrModal.set(true);
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

  public getLocalInterfaceUrl(): string {
    const loc = window.location;
    const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const wsPort = this.dataService?.currentServerPort || 7070;
    const wsUrl = `${wsProtocol}//${loc.hostname}:${wsPort}/api/interface-data`;

    return `${loc.origin}/camera_interface?server=${encodeURIComponent(
      wsUrl,
    )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}`;
  }

  public openLocalInterface(): void {
    window.open(this.getLocalInterfaceUrl(), "_blank");
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
