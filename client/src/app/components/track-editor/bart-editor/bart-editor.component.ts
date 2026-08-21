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
import { of, Subscription, timer } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { DataService } from "@app/data.service";
import { BartConfig } from "@app/models/bart_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus, PinBehavior } from "@app/proto/antigravity";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";

@Component({
  selector: "app-bart-editor",
  templateUrl: "./bart-editor.component.html",
  styleUrls: ["./bart-editor.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class BartEditorComponent implements OnInit, OnDestroy, OnChanges {
  config = input.required<BartConfig>();
  lanes = input.required<number>();
  interfaceIndex = input.required<number>();

  change = output<void>();
  remove = output<void>();

  status: string = "DISCONNECTED";

  lapPinPitBehaviors = [
    { label: "TME_LAP_PIN_PIT_NONE", value: 0 },
    { label: "TME_LAP_PIN_PIT_IN", value: 1 },
    { label: "TME_LAP_PIN_PIT_OUT", value: 2 },
  ];

  lapPinBehaviors: { label: string; value: number; lane?: number }[] = [];

  detectedChannels = 0;
  detectedBleDevices: string[] = [];

  readBadges: boolean[] = Array(32).fill(false);

  sectionsExpanded = {
    bart: true,
    main: true,
    rw: true,
  };

  private subscriptions = new Subscription();
  private readTimeouts: any[] = [];
  private checkConnectionInterval: any = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    if (!this.config()) {
      throw new Error("BartConfig is required");
    }

    if (!this.config().lapPinBehaviors) {
      this.config().lapPinBehaviors = [];
    }

    const numLanes = this.lanes() || 4;
    const maxChannels = 32;
    while (this.config().lapPinBehaviors.length < maxChannels) {
      const idx = this.config().lapPinBehaviors.length;
      if (idx < numLanes) {
        this.config().lapPinBehaviors.push(PinBehavior.BEHAVIOR_LAP_BASE + idx);
      } else {
        this.config().lapPinBehaviors.push(PinBehavior.BEHAVIOR_UNUSED);
      }
    }

    this.rebuildBehaviors();

    this.subscriptions.add(
      timer(0, 10000)
        .pipe(
          switchMap(() =>
            this.dataService.getBleDevices().pipe(
              catchError((err) => {
                this.logger.error("Failed to load BLE devices", err);
                const currentName = this.config()?.deviceName;
                return of(currentName ? [currentName] : []);
              }),
            ),
          ),
        )
        .subscribe({
          next: (devices: string[]) => {
            let list = devices ? [...devices] : [];
            const currentName = this.config()?.deviceName;
            if (currentName && !list.includes(currentName)) {
              list.unshift(currentName);
            }
            this.detectedBleDevices = Array.from(new Set(list));
            this.cdr.detectChanges();
          },
        }),
    );

    // Subscribe to interface events for live status & sensor triggers
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
              if (
                event.status.detectedChannels &&
                event.status.detectedChannels > 0
              ) {
                this.detectedChannels = event.status.detectedChannels;
                this.logger.debug(
                  `BART Editor [index ${this.interfaceIndex()}]: CONNECTED with ${this.detectedChannels} detected channels. Showing ${this.visibleChannelsCount} channel selectors.`,
                );
              }
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
            this.triggerPinActivity(event.lap.interfaceId ?? -1);
          } else if (
            event.segment &&
            (event.segment.interfaceIndex ?? 0) === this.interfaceIndex()
          ) {
            this.triggerPinActivity(event.segment.interfaceId ?? -1);
          } else if (
            event.digitalPin &&
            (event.digitalPin.interfaceIndex ?? 0) === this.interfaceIndex()
          ) {
            this.triggerPinActivity(event.digitalPin.pin ?? -1);
          }
        },
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["lanes"] && !changes["lanes"].firstChange) {
      this.rebuildBehaviors();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.readTimeouts.forEach((t) => clearTimeout(t));
  }

  get visibleChannelsCount(): number {
    if (this.detectedChannels > 0) {
      return Math.min(this.detectedChannels, 32);
    }
    return Math.min(this.lanes() || 4, 32);
  }

  get visibleLapPinBehaviors(): number[] {
    return (this.config()?.lapPinBehaviors || []).slice(
      0,
      this.visibleChannelsCount,
    );
  }

  rebuildBehaviors(): void {
    const numLanes = this.lanes() || 4;
    this.lapPinBehaviors = [
      { label: "BART_BEHAVIOR_UNUSED", value: PinBehavior.BEHAVIOR_UNUSED },
    ];

    for (let i = 0; i < numLanes; i++) {
      this.lapPinBehaviors.push({
        label: "BART_LAP_LANE",
        value: PinBehavior.BEHAVIOR_LAP_BASE + i,
        lane: i + 1,
      });
    }

    for (let i = 0; i < numLanes; i++) {
      this.lapPinBehaviors.push({
        label: "BART_PIT_IN_LANE",
        value: PinBehavior.BEHAVIOR_PIT_IN_BASE + i,
        lane: i + 1,
      });
    }

    for (let i = 0; i < numLanes; i++) {
      this.lapPinBehaviors.push({
        label: "BART_PIT_OUT_LANE",
        value: PinBehavior.BEHAVIOR_PIT_OUT_BASE + i,
        lane: i + 1,
      });
    }
  }

  triggerPinActivity(pin: number): void {
    if (pin >= 0 && pin < 32) {
      this.readBadges[pin] = true;
      this.cdr.detectChanges();
      const t = setTimeout(() => {
        this.readBadges[pin] = false;
        this.cdr.detectChanges();
      }, 1500);
      this.readTimeouts.push(t);
    }
  }

  onDeviceSelect(newDevice: string): void {
    this.config().deviceName = newDevice;
    this.onConfigChange();
  }

  onConfigChange(): void {
    this.change.emit();
  }

  onRemove(): void {
    this.remove.emit();
  }

  toggleSection(section: keyof typeof this.sectionsExpanded): void {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
  }

  ensureSectionsExpanded(): void {
    this.sectionsExpanded.bart = true;
    this.sectionsExpanded.main = true;
    this.sectionsExpanded.rw = true;
    this.cdr.detectChanges();
  }

  getHelpSteps(): GuideStep[] {
    const expandMain = () => {
      this.sectionsExpanded.bart = true;
      this.sectionsExpanded.main = true;
      this.cdr.detectChanges();
    };
    const expandRw = () => {
      this.sectionsExpanded.bart = true;
      this.sectionsExpanded.rw = true;
      this.cdr.detectChanges();
    };

    return [
      {
        selector: `#bart-editor-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_TITLE",
        content: "TE_HELP_BART_CONTENT",
        position: "right",
        onEnter: expandMain,
      },
      {
        selector: `#deviceName-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_DEVICE_TITLE",
        content: "TE_HELP_BART_DEVICE_CONTENT",
        position: "bottom",
        onEnter: expandMain,
      },
      {
        selector: `#bart-status-badge-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_STATUS_TITLE",
        content: "TE_HELP_BART_STATUS_CONTENT",
        position: "right",
        onEnter: expandMain,
      },
      {
        selector: `#minLapMs-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_MIN_LAP_TITLE",
        content: "TE_HELP_BART_MIN_LAP_CONTENT",
        position: "bottom",
        onEnter: expandMain,
      },
      {
        selector: `#lapPinPitBehavior-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_PIT_BEHAVIOR_TITLE",
        content: "TE_HELP_BART_PIT_BEHAVIOR_CONTENT",
        position: "bottom",
        onEnter: expandMain,
      },
      {
        selector: `#bart-channel-0-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_CHANNELS_TITLE",
        content: "TE_HELP_BART_CHANNELS_CONTENT",
        position: "bottom",
        onEnter: expandRw,
      },
      {
        selector: `#bart-channel-status-0-${this.interfaceIndex()}`,
        title: "TE_HELP_BART_CHANNEL_STATUS_TITLE",
        content: "TE_HELP_BART_CHANNEL_STATUS_CONTENT",
        position: "bottom",
        onEnter: expandRw,
      },
    ];
  }
}
