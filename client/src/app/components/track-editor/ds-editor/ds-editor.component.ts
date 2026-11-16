import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  SimpleChanges,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import { DsConfig, DsType } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus } from "@app/proto/antigravity";
import { GuideStep } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";

@Component({
  selector: "app-ds-editor",
  templateUrl: "./ds-editor.component.html",
  styleUrls: ["./ds-editor.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class DsEditorComponent implements OnInit, OnDestroy, OnChanges {
  config = input.required<DsConfig>();
  interfaceIndex = input.required<number>();
  isEditMode = input<boolean>(true);

  change = output<void>();
  remove = output<void>();

  serialPorts: string[] = [];
  status: string = "DISCONNECTED";

  sectionsExpanded = {
    ds: true,
    main: true,
    lanes: true,
  };

  readonly dsTypeOptions = [
    { label: "DS-030", value: DsType.DS_030 },
    { label: "DS-200", value: DsType.DS_200 },
    { label: "DS-200b", value: DsType.DS_200B },
    { label: "DS-300", value: DsType.DS_300 },
    { label: "DS-300 RC", value: DsType.DS_300RC },
  ];

  laneBadges: boolean[] = Array(8).fill(false);
  private laneTimeouts: any[] = Array(8).fill(null);
  private subscriptions = new Subscription();

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private helpLinkService: HelpLinkService,
  ) {}

  openHelpCenter(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.helpLinkService.openHelp("track-editor", "ds-interface");
  }

  get baudRate(): number {
    const type = this.config()?.type;
    return type === DsType.DS_030 || type === DsType.DS_200 ? 4800 : 57600;
  }

  ngOnInit(): void {
    if (!this.config()) {
      throw new Error("DsConfig is required");
    }

    this.ensureConfigDefaults();
    this.loadSerialPorts();
    this.subscribeToStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["config"] && this.config()) {
      this.ensureConfigDefaults();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.laneTimeouts.forEach((t) => {
      if (t) {
        clearTimeout(t);
      }
    });
  }

  private ensureConfigDefaults(): void {
    const current = this.config();
    if (current) {
      if (current.type === undefined || current.type === null) {
        current.type = DsType.DS_300;
      } else if (typeof (current.type as any) === "string") {
        current.type = this.parseDsType(current.type);
      }
      current.baudRate = this.baudRate;
    }
  }

  private parseDsType(val: any): DsType {
    if (typeof val === "number" && val >= 0 && val <= 4) {
      return val as DsType;
    }
    if (typeof val === "string") {
      switch (val) {
        case "DS_030":
          return DsType.DS_030;
        case "DS_200":
          return DsType.DS_200;
        case "DS_200B":
          return DsType.DS_200B;
        case "DS_300":
          return DsType.DS_300;
        case "DS_300RC":
          return DsType.DS_300RC;
        default:
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
            return parsed as DsType;
          }
      }
    }
    return DsType.DS_300;
  }

  toggleSection(section: "ds" | "main" | "lanes"): void {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.cdr.markForCheck();
  }

  ensureSectionsExpanded(): void {
    this.sectionsExpanded.ds = true;
    this.sectionsExpanded.main = true;
    this.sectionsExpanded.lanes = true;
    this.cdr.detectChanges();
  }

  onRemove(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.remove.emit();
  }

  onPortChange(newPort?: string): void {
    if (newPort !== undefined && this.config()) {
      this.config().commPort = newPort;
    }
    this.updateBackendConfig();
    this.change.emit();
  }

  onTypeChange(value: any): void {
    const newType = typeof value === "number" ? value : parseInt(value, 10);
    if (this.config()) {
      this.config().type = isNaN(newType) ? DsType.DS_300 : newType;
      this.config().baudRate = this.baudRate;
    }
    this.updateBackendConfig();
    this.change.emit();
  }

  private updateBackendConfig(): void {
    this.dataService
      .updateInterfaceConfig(null, this.interfaceIndex(), null, this.config())
      .subscribe({
        next: (resp) => {
          if (resp?.success) {
            this.logger.info("DS interface updated successfully");
          }
        },
        error: (err) => {
          this.logger.error("Failed to update DS interface config", err);
        },
      });
  }

  private loadSerialPorts(): void {
    this.dataService.getSerialPorts().subscribe({
      next: (ports) => {
        this.serialPorts = ports || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.logger.error("Failed to load serial ports for DS interface", err);
      },
    });
  }

  private subscribeToStatus(): void {
    this.subscriptions.add(
      this.dataService.getInterfaceEvents().subscribe((event) => {
        if (!event) {
          return;
        }

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

        if (
          event.lap &&
          (event.lap.interfaceIndex ?? 0) === this.interfaceIndex()
        ) {
          const lane = event.lap.lane ?? -1;
          if (lane >= 0 && lane < 8) {
            this.triggerLaneActivity(lane);
          }
        }
      }),
    );
  }

  private triggerLaneActivity(laneIndex: number): void {
    if (laneIndex >= 0 && laneIndex < 8) {
      this.laneBadges[laneIndex] = true;
      this.status = "CONNECTED";
      this.cdr.detectChanges();

      if (this.laneTimeouts[laneIndex]) {
        clearTimeout(this.laneTimeouts[laneIndex]);
      }

      this.laneTimeouts[laneIndex] = setTimeout(() => {
        this.laneBadges[laneIndex] = false;
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  getHelpSteps(): GuideStep[] {
    const expandMain = () => {
      this.ensureSectionsExpanded();
    };

    return [
      {
        selector: `#ds-editor-${this.interfaceIndex()}`,
        title: "TE_HELP_DS_TITLE",
        content: "TE_HELP_DS_CONTENT",
        position: "right",
        onEnter: expandMain,
      },
      {
        selector: `#commPort-${this.interfaceIndex()}`,
        title: "TE_HELP_DS_PORT_TITLE",
        content: "TE_HELP_DS_PORT_CONTENT",
        position: "bottom",
        onEnter: expandMain,
      },
      {
        selector: `#ds-status-badge-${this.interfaceIndex()}`,
        title: "TE_HELP_DS_STATUS_TITLE",
        content: "TE_HELP_DS_STATUS_CONTENT",
        position: "right",
        onEnter: expandMain,
      },
      {
        selector: `#dsType-${this.interfaceIndex()}`,
        title: "TE_HELP_DS_TYPE_TITLE",
        content: "TE_HELP_DS_TYPE_CONTENT",
        position: "bottom",
        onEnter: expandMain,
      },
      {
        selector: `#ds-lanes-${this.interfaceIndex()}`,
        title: "TE_HELP_DS_LANES_TITLE",
        content: "TE_HELP_DS_LANES_CONTENT",
        position: "top",
        onEnter: expandMain,
      },
    ];
  }
}
