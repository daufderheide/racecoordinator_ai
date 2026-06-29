import { CommonModule } from "@angular/common";
import {
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
import { PinBehavior } from "@app/proto/antigravity";

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

  constructor(private dataService: DataService) {}

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

    // TODO: implement getInterfaceStatus and getInterfaceEvents for trakmate in the future if needed
    // The previous implementation was calling non-existent methods on DataService
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
}
