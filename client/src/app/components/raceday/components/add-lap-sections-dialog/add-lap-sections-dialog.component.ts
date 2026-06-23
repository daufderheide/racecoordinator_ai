import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";

@Component({
  standalone: true,
  selector: "app-add-lap-sections-dialog",
  template: `
    @if (visible()) {
      <div class="modal-backdrop">
        <div class="modal-content">
          <h2 class="modal-title">
            {{ "RD_ADD_LAP_SECTIONS_TITLE" | translate }}
          </h2>

          <div class="driver-info-panel">
            <div class="info-row">
              <span class="info-label"
                >{{ "RD_ADD_LAP_SECTIONS_LANE" | translate }}:</span
              >
              <span
                class="info-value lane-pill"
                [style.background-color]="laneBg()"
                [style.color]="laneFg()"
              >
                {{ (driverHeatData()?.laneIndex ?? 0) + 1 }}
              </span>
            </div>
            @if (getTeamName()) {
              <div class="info-row">
                <span class="info-label"
                  >{{ "RD_ADD_LAP_SECTIONS_TEAM" | translate }}:</span
                >
                <span class="info-value">{{ getTeamName() }}</span>
              </div>
            }
            <div class="info-row">
              <span class="info-label"
                >{{ "RD_ADD_LAP_SECTIONS_DRIVER" | translate }}:</span
              >
              <span class="info-value">{{
                driverHeatData()?.driver?.name
              }}</span>
            </div>
          </div>

          <div class="calculation-info">
            <span class="calc-label"
              >{{ "RD_ADD_LAP_SECTIONS_FULL_LAP" | translate }}:</span
            >
            <span class="calc-value">{{ numTrackSections() }}</span>
          </div>

          <div class="input-section">
            <label for="sectionsInput" class="input-label">
              {{ "RD_ADD_LAP_SECTIONS_INPUT_LABEL" | translate }}
            </label>
            <input
              id="sectionsInput"
              type="number"
              [value]="sectionsInput()"
              (input)="onInputChange($event)"
              (keyup.enter)="onConfirm()"
              placeholder="0"
              autoFocus
            />
          </div>

          <div class="result-preview">
            <div class="preview-line">
              <span class="preview-label"
                >{{ "RD_ADD_LAP_SECTIONS_CURRENT" | translate }}:</span
              >
              <span class="preview-value"
                >{{ sectionsInput() }} ({{ calculatedLaps() | number: "1.2-2" }}
                {{ "RD_ADD_LAP_SECTIONS_LAPS_REPRESENT" | translate }})</span
              >
            </div>
            @if (isAutoSegments()) {
              <div class="preview-line">
                <span class="preview-label"
                  >{{ "RD_ADD_LAP_SECTIONS_AUTO_SEGMENTS" | translate }}:</span
                >
                <span class="preview-value"
                  >{{ autoSegments() }} ({{
                    autoCalculatedLaps() | number: "1.2-2"
                  }}
                  {{ "RD_ADD_LAP_SECTIONS_LAPS_REPRESENT" | translate }})</span
                >
              </div>
            }
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">
              {{ "CANCEL" | translate }}
            </button>
            <button class="btn-confirm" (click)="onConfirm()">
              {{ "RD_ADD_LAP_SECTIONS_APPLY" | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        backdrop-filter: blur(8px);
        animation: fadeIn 0.25s ease-out;
      }
      .modal-content {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #f1f5f9;
        padding: 2rem;
        border-radius: 16px;
        box-shadow:
          0 25px 50px -12px rgba(0, 0, 0, 0.7),
          0 0 40px rgba(56, 189, 248, 0.15);
        width: 420px;
        max-width: 90%;
        border: 1px solid rgba(56, 189, 248, 0.2);
        animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-sizing: border-box;
      }
      .modal-title {
        margin-top: 0;
        color: #38bdf8;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
      }
      .driver-info-panel {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        box-sizing: border-box;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .info-label {
        color: #94a3b8;
        font-size: 0.875rem;
      }
      .info-value {
        color: #f1f5f9;
        font-weight: 600;
        font-size: 0.95rem;
      }
      .lane-pill {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 700;
      }
      .calculation-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(56, 189, 248, 0.05);
        border: 1px dashed rgba(56, 189, 248, 0.2);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1.5rem;
        box-sizing: border-box;
      }
      .calc-label {
        color: #38bdf8;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .calc-value {
        color: #f1f5f9;
        font-weight: 700;
      }
      .input-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        box-sizing: border-box;
      }
      .input-label {
        color: #94a3b8;
        font-size: 0.875rem;
        font-weight: 500;
      }
      input {
        box-sizing: border-box;
        width: 120px;
        padding: 0.875rem 1.25rem;
        background: #090d16;
        border: 1.5px solid #334155;
        border-radius: 10px;
        color: #f1f5f9;
        font-size: 1.125rem;
        font-weight: 600;
        outline: none;
        transition: all 0.2s;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      input:focus {
        border-color: #38bdf8;
        box-shadow:
          0 0 15px rgba(56, 189, 248, 0.25),
          inset 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .result-preview {
        background: rgba(30, 41, 59, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1.5rem;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .preview-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .preview-label {
        color: #94a3b8;
        font-size: 0.875rem;
      }
      .preview-value {
        color: #38bdf8;
        font-weight: 700;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.95rem;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .btn-cancel {
        background: #334155;
        color: #94a3b8;
      }
      .btn-cancel:hover {
        background: #475569;
        color: #f1f5f9;
      }
      .btn-confirm {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
      }
      .btn-confirm:hover {
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
        transform: translateY(-1px);
      }
      .btn-confirm:active {
        transform: translateY(0);
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class AddLapSectionsDialogComponent {
  visible = input(false);
  driverHeatData = input<DriverHeatData | null>(null);
  numTrackSections = input<number>(100);
  laneBg = input<string>("#334155");
  laneFg = input<string>("#38bdf8");
  isAutoSegments = input<boolean>(false);

  confirm = output<number>();
  cancel = output<void>();

  sectionsInput = signal<number>(0);
  autoSegments = computed(() => {
    const hd = this.driverHeatData();
    if (!hd) return 0;
    const divisor = this.numTrackSections() || 100;
    return Math.round((hd.autoCalculatedLaps || 0) * divisor);
  });
  autoCalculatedLaps = computed(() => {
    const hd = this.driverHeatData();
    return hd ? hd.autoCalculatedLaps || 0 : 0;
  });
  calculatedLaps = computed(() => {
    const sec = this.sectionsInput();
    const divisor = this.numTrackSections() || 100;
    return sec / divisor;
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        const hd = this.driverHeatData();
        const divisor = this.numTrackSections() || 100;
        if (hd) {
          const sections = Math.round((hd.userLaps || 0) * divisor);
          this.sectionsInput.set(sections);
        } else {
          this.sectionsInput.set(0);
        }
      }
    });
  }

  getTeamName(): string | null {
    const hd = this.driverHeatData();
    if (!hd) return null;
    const team = hd.participant?.team || (hd.driver as any)?.team;
    return team ? team.name : null;
  }

  getLaneBg(): string {
    return "#334155";
  }

  getLaneFg(): string {
    return "#38bdf8";
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const val = parseInt(target.value, 10);
    this.sectionsInput.set(isNaN(val) ? 0 : val);
  }

  onConfirm() {
    this.confirm.emit(this.calculatedLaps());
  }

  onCancel() {
    this.cancel.emit();
  }
}
