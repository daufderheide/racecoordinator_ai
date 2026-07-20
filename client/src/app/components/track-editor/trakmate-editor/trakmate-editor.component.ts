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
import { DataService } from "@app/data.service";
import { TrackmateConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus, PinBehavior } from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";

@Component({
  selector: "app-trakmate-editor",
  templateUrl: "./trakmate-editor.component.html",
  styleUrls: ["./trakmate-editor.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class TrakmateEditorComponent implements OnInit, OnDestroy, OnChanges {
  config = input.required<TrackmateConfig>();
  lanes = input.required<number>();
  interfaceIndex = input.required<number>();

  change = output<void>();
  remove = output<void>();

  serialPorts: string[] = [];
  status: string = "DISCONNECTED";

  lapPinPitBehaviors = [
    { label: "TME_LAP_PIN_PIT_NONE", value: 0 },
    { label: "TME_LAP_PIN_PIT_IN", value: 1 },
    { label: "TME_LAP_PIN_PIT_OUT", value: 2 },
    { label: "TME_LAP_PIN_PIT_IN_OUT", value: 3 },
  ];

  lapPinBehaviors: { label: string; value: number; lane?: number }[] = [];

  readBadges: boolean[] = Array(8).fill(false);
  relayStatuses: boolean[] = Array(8).fill(false);
  mainRelayStatus: boolean = false;
  callbuttonStatus: boolean = false;

  private subscriptions = new Subscription();
  private readTimeouts: any[] = [];

  sectionsExpanded = {
    trakmate: true,
    main: true,
    rw: true,
  };

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    if (!this.config()) {
      throw new Error("TrakmateConfig is required");
    }

    if (!this.config().lapPinBehaviors) {
      this.config().lapPinBehaviors = [];
    }

    const numLanes = this.lanes() || 4;
    while (this.config().lapPinBehaviors.length < 8) {
      const idx = this.config().lapPinBehaviors.length;
      if (idx >= numLanes) {
        this.config().lapPinBehaviors.push(PinBehavior.BEHAVIOR_UNUSED);
      } else {
        this.config().lapPinBehaviors.push(PinBehavior.BEHAVIOR_LAP_BASE + idx);
      }
    }

    for (let i = numLanes; i < 8; i++) {
      if (
        !this.lapPinBehaviors.some(
          (pb) => pb.value === this.config().lapPinBehaviors![i],
        )
      ) {
        this.config().lapPinBehaviors![i] = PinBehavior.BEHAVIOR_UNUSED;
      }
    }

    // Load expanded state from localStorage
    const savedSections = localStorage.getItem(
      `rc.trakmate-editor.sections.${this.interfaceIndex()}`,
    );
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        this.sectionsExpanded = { ...this.sectionsExpanded, ...parsed };
      } catch (e) {
        console.error("Failed to parse saved sections", e);
      }
    }

    this.subscriptions.add(
      this.dataService.getSerialPorts().subscribe((ports: string[]) => {
        this.serialPorts = ports;
      }),
    );

    this.subscriptions.add(
      this.dataService.getInterfaceEvents().subscribe({
        next: (event) => {
          // DEBUG: Log every event received by this component
          this.logger.info(
            `[TrakmateEditor] Raw interface event received: ${JSON.stringify(event)}. Component interfaceIndex: ${this.interfaceIndex()}`,
          );

          if (event.lap) {
            if ((event.lap.interfaceIndex ?? 0) === this.interfaceIndex()) {
              this.triggerPinActivity(event.lap.interfaceId ?? -1);
            }
          } else if (event.segment) {
            if ((event.segment.interfaceIndex ?? 0) === this.interfaceIndex()) {
              this.triggerPinActivity(event.segment.interfaceId ?? -1);
            }
          } else if (event.digitalPin) {
            if (
              (event.digitalPin.interfaceIndex ?? 0) === this.interfaceIndex()
            ) {
              const pin = event.digitalPin.pin ?? -1;
              const state = event.digitalPin.state ?? 0;
              const nc = this.config()?.normallyClosedLaneSensors;
              const isTrip = nc ? state === 1 : state === 0;

              if (isTrip) {
                this.triggerPinActivity(pin);
              }
            }
          } else if (event.callbutton) {
            this.logger.info(
              `[TrakmateEditor] Received callbutton event. event.callbutton: ${JSON.stringify(event.callbutton)}. Current interfaceIndex: ${this.interfaceIndex()}`,
            );
            if (
              (event.callbutton.interfaceIndex ?? 0) === this.interfaceIndex()
            ) {
              this.logger.info(
                `[TrakmateEditor] callbutton interfaceIndex matches! Triggering UI badge.`,
              );
              this.triggerCallbuttonActivity();
            } else {
              this.logger.info(
                `[TrakmateEditor] callbutton interfaceIndex mismatch. Expected ${this.interfaceIndex()}, got ${event.callbutton.interfaceIndex ?? 0}`,
              );
            }
          } else if (event.status) {
            if ((event.status.interfaceIndex ?? 0) === this.interfaceIndex()) {
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
          }
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.readTimeouts.forEach((t) => clearTimeout(t));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["lanes"]) {
      this.buildLapPinBehaviors();

      const numLanes = this.lanes() || 4;
      if (this.config() && this.config().lapPinBehaviors) {
        for (let i = numLanes; i < 8; i++) {
          if (
            !this.lapPinBehaviors.some(
              (pb) => pb.value === this.config().lapPinBehaviors![i],
            )
          ) {
            this.config().lapPinBehaviors![i] = PinBehavior.BEHAVIOR_UNUSED;
          }
        }
      }
    }
  }

  private buildLapPinBehaviors() {
    this.lapPinBehaviors = [
      { label: "TME_LAP_PIN_PIT_NONE", value: PinBehavior.BEHAVIOR_UNUSED },
    ];
    const numLanes = this.lanes() || 4;
    for (let i = 0; i < numLanes; i++) {
      this.lapPinBehaviors.push({
        label: "TME_LAP_SENSOR_LANE",
        value: PinBehavior.BEHAVIOR_LAP_BASE + i,
        lane: i + 1,
      });
      this.lapPinBehaviors.push({
        label: "TME_PIT_IN_SENSOR_LANE",
        value: PinBehavior.BEHAVIOR_PIT_IN_BASE + i,
        lane: i + 1,
      });
      this.lapPinBehaviors.push({
        label: "TME_PIT_OUT_SENSOR_LANE",
        value: PinBehavior.BEHAVIOR_PIT_OUT_BASE + i,
        lane: i + 1,
      });
      this.lapPinBehaviors.push({
        label: "TME_PIT_IN_OUT_SENSOR_LANE",
        value: PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + i,
        lane: i + 1,
      });
    }
  }

  onConfigChange() {
    this.change.emit();
  }

  onPortChange() {
    this.onConfigChange();
  }

  onRemove() {
    this.remove.emit();
  }

  toggleSection(section: "trakmate" | "main" | "rw") {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveState();
  }

  private saveState() {
    localStorage.setItem(
      `rc.trakmate-editor.sections.${this.interfaceIndex()}`,
      JSON.stringify(this.sectionsExpanded),
    );
  }

  private triggerPinActivity(interfaceId: number) {
    if (interfaceId >= 0 && interfaceId < 8) {
      this.readBadges[interfaceId] = true;
      this.cdr.detectChanges();

      if (this.readTimeouts[interfaceId]) {
        clearTimeout(this.readTimeouts[interfaceId]);
      }

      this.readTimeouts[interfaceId] = setTimeout(() => {
        this.readBadges[interfaceId] = false;
        this.cdr.detectChanges();
      }, 500);
    }
  }

  private triggerCallbuttonActivity() {
    this.callbuttonStatus = true;
    this.cdr.detectChanges();

    if (this.readTimeouts[8]) {
      clearTimeout(this.readTimeouts[8]);
    }

    this.readTimeouts[8] = setTimeout(() => {
      this.callbuttonStatus = false;
      this.cdr.detectChanges();
    }, 500);
  }

  toggleMasterRelay() {
    this.mainRelayStatus = !this.mainRelayStatus;
    this.dataService.setMainPower(this.mainRelayStatus).subscribe({
      next: () => {
        // Success, keep the new state
      },
      error: (err) => {
        console.error("Failed to set master relay status:", err);
        // Revert on error
        this.mainRelayStatus = !this.mainRelayStatus;
        this.cdr.detectChanges();
      },
    });
  }

  toggleLaneRelay(laneIndex: number) {
    this.relayStatuses[laneIndex] = !this.relayStatuses[laneIndex];
    // Lane index for backend is 1-based.
    this.dataService
      .setLanePower(laneIndex + 1, this.relayStatuses[laneIndex])
      .subscribe({
        next: () => {
          // Success, keep the new state
        },
        error: (err) => {
          console.error(
            `Failed to set relay status for lane ${laneIndex + 1}:`,
            err,
          );
          // Revert on error
          this.relayStatuses[laneIndex] = !this.relayStatuses[laneIndex];
          this.cdr.detectChanges();
        },
      });
  }
}
