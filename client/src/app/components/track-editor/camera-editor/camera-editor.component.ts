import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  input,
  model,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import * as QRCode from "qrcode";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { CameraConfig } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";

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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSectionsState();
    this.ensureGates();
    this.generatePairingUrl();
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

  public generatePairingUrl(): void {
    const loc = window.location;
    const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = loc.hostname;
    const wsPort = loc.port || (loc.protocol === "https:" ? "443" : "8080");
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/interface-data`;

    const url = `${loc.origin}/camera-interface?server=${encodeURIComponent(
      wsUrl,
    )}&interface=${this.interfaceIndex()}&lanes=${this.lanes()}`;
    this.pairingUrl.set(url);
  }

  public async openQrModal(): Promise<void> {
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

  public openLocalInterface(): void {
    window.open(this.pairingUrl(), "_blank");
  }

  public onConfigChange(): void {
    this.change.emit();
  }

  public onRemove(): void {
    if (!this.isEditMode()) return;
    this.remove.emit();
  }
}
