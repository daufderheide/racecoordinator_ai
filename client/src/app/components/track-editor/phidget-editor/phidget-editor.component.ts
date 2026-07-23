import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { PhidgetConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus, IPhidgetDeviceInfo } from "@app/proto/antigravity";

@Component({
  selector: "app-phidget-editor",
  templateUrl: "./phidget-editor.component.html",
  styleUrls: ["./phidget-editor.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class PhidgetEditorComponent implements OnInit, OnDestroy {
  config = model.required<PhidgetConfig>();
  interfaceIndex = input.required<number>();
  lanes = input.required<number>();

  change = output<void>();
  remove = output<void>();
  driverError = output<void>();

  devices: IPhidgetDeviceInfo[] = [];
  status: string = "DISCONNECTED";

  sectionsExpanded = {
    phidget: true,
    main: true,
    pins: true,
  };

  selectedDeviceKeyStr: string = "";

  private subscriptions = new Subscription();

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.config()) {
      throw new Error("PhidgetConfig is required");
    }

    this.updateSelectedDeviceKey();

    const savedSections = localStorage.getItem(
      `rc.phidget-editor.sections.${this.interfaceIndex()}`,
    );
    if (savedSections) {
      try {
        this.sectionsExpanded = {
          ...this.sectionsExpanded,
          ...JSON.parse(savedSections),
        };
      } catch (e) {}
    }

    this.subscriptions.add(
      this.dataService.getPhidgetDevices().subscribe({
        next: (devices) => {
          this.devices = devices;
          this.updateSelectedDeviceKey();
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 500) {
            let msg = "";
            if (err.error instanceof ArrayBuffer) {
              msg = new TextDecoder("utf-8").decode(err.error);
            } else if (typeof err.error === "string") {
              msg = err.error;
            }
            if (msg.includes("MISSING_PHIDGET_DRIVER")) {
              this.driverError.emit();
            }
          }
        },
      }),
    );

    this.subscriptions.add(
      this.dataService.getInterfaceEvents().subscribe({
        next: (event) => {
          if (
            event.status &&
            (event.status.interfaceIndex ?? 0) === this.interfaceIndex()
          ) {
            const statusCode = event.status.status as number;
            if (statusCode === InterfaceStatus.CONNECTED) {
              this.status = "CONNECTED";
            } else if (statusCode === InterfaceStatus.NO_DATA) {
              this.status = "NO_DATA";
            } else {
              this.status = "DISCONNECTED";
            }
            this.cdr.detectChanges();
          }
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onConfigChange() {
    this.updateSelectedDeviceKey();
    this.change.emit();
  }

  updateSelectedDeviceKey() {
    const c = this.config();
    if (!c || c.serialNumber <= 0) {
      this.selectedDeviceKeyStr = "";
    } else {
      this.selectedDeviceKeyStr = this.getDeviceKey(c);
    }
  }

  getDeviceKey(device: any): string {
    const serial = device.serialNumber || 0;
    const isHubPort = !!device.isHubPort;
    const hubPort = device.hubPort || 0;
    return `${serial}_${isHubPort}_${hubPort}`;
  }

  onDeviceSelectChange(key: string) {
    const selected = this.devices.find((d) => this.getDeviceKey(d) === key);
    const c = this.config();
    if (selected && c) {
      c.serialNumber = selected.serialNumber ?? 0;
      c.isHubPort = !!selected.isHubPort;
      c.hubPort = selected.hubPort ?? 0;
      c.name = selected.name || "Phidget Device";
    }
    this.onConfigChange();
  }

  onRemove() {
    this.remove.emit();
  }

  toggleSection(section: "phidget" | "main" | "pins") {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    localStorage.setItem(
      `rc.phidget-editor.sections.${this.interfaceIndex()}`,
      JSON.stringify(this.sectionsExpanded),
    );
  }
}
