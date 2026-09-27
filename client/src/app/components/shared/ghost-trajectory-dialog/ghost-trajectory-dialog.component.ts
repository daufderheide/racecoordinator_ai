import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  GhostPacingService,
  HeatTrajectoryComparison,
} from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

export interface TrajectoryReferenceOption {
  id: string;
  name: string;
  lapTimes: number[];
}

@Component({
  standalone: true,
  selector: "app-ghost-trajectory-dialog",
  templateUrl: "./ghost-trajectory-dialog.component.html",
  styleUrls: ["./ghost-trajectory-dialog.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class GhostTrajectoryDialogComponent {
  private ghostPacingService = inject(GhostPacingService);
  private translationService = inject(TranslationService);

  visible = input<boolean>(false);
  driverAName = input<string>("");
  driverALapTimes = input<number[]>([]);
  referenceOptions = input<TrajectoryReferenceOption[]>([]);
  benchmarkLapTime = input<number>(0);
  initialReferenceId = input<string>("");

  close = output<void>();

  private userSelectedRefId = signal<string | null>(null);

  selectedRefId = computed<string>(() => {
    const userSelected = this.userSelectedRefId();
    if (userSelected !== null) {
      return userSelected;
    }
    const initId = this.initialReferenceId();
    const options = this.referenceOptions();
    if (initId && options.some((opt) => opt.id === initId)) {
      return initId;
    }
    if (options.length > 0) {
      return options[0].id;
    }
    if (this.benchmarkLapTime() > 0) {
      return "__benchmark__";
    }
    return "";
  });

  selectedReference = computed<TrajectoryReferenceOption | null>(() => {
    const refId = this.selectedRefId();
    const options = this.referenceOptions();
    if (!refId || refId === "__benchmark__") {
      return null;
    }
    return options.find((opt) => opt.id === refId) || null;
  });

  comparison = computed<HeatTrajectoryComparison>(() => {
    const lapsA = this.driverALapTimes() || [];
    const ref = this.selectedReference();
    let lapsB: number[] = [];

    if (ref && ref.lapTimes && ref.lapTimes.length > 0) {
      lapsB = ref.lapTimes;
    } else if (this.benchmarkLapTime() > 0 && lapsA.length > 0) {
      lapsB = new Array(lapsA.length).fill(this.benchmarkLapTime());
    }

    return this.ghostPacingService.compareTrajectories(lapsA, lapsB);
  });

  currentReferenceName = computed(() => {
    const ref = this.selectedReference();
    if (ref) {
      return ref.name;
    }
    if (this.benchmarkLapTime() > 0) {
      const benchmarkLabel = this.translationService.translate("GTD_BENCHMARK");
      return `${benchmarkLabel} (${this.benchmarkLapTime().toFixed(2)}s)`;
    }
    return this.translationService.translate("GTD_BENCHMARK");
  });

  onReferenceChange(newRefId: string) {
    this.userSelectedRefId.set(newRefId);
  }

  onDismiss() {
    this.userSelectedRefId.set(null);
    this.close.emit();
  }
}
