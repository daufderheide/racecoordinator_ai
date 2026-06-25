import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  untracked,
  ViewChild,
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

          @if (isMenuMode() && activeHeats().length === 0) {
            <div
              class="no-heats-panel"
              style="padding: 2rem 1rem; text-align: center; color: #94a3b8; background: rgba(30, 41, 59, 0.6); border: 1.5px dashed #334155; border-radius: 12px; margin-bottom: 1.5rem;"
            >
              {{ "RD_ADD_LAP_SECTIONS_NO_HEATS" | translate }}
            </div>
          } @else {
            @if (isMenuMode()) {
              <div class="menu-selectors-panel">
                <div class="info-row">
                  <span class="info-label"
                    >{{ "RD_ADD_LAP_SECTIONS_SELECT_HEAT" | translate }}:</span
                  >
                  <select
                    id="heatSelect"
                    [ngModel]="selectedHeatIndex()"
                    (ngModelChange)="onHeatSelectChange($event)"
                  >
                    @for (
                      heat of activeHeats();
                      track heat.heatNumber;
                      let idx = $index
                    ) {
                      <option [value]="idx">
                        {{ "RD_HEAT" | translate }} {{ heat.heatNumber }}
                      </option>
                    }
                  </select>
                </div>
                <div class="info-row">
                  <span class="info-label"
                    >{{
                      "RD_ADD_LAP_SECTIONS_SELECT_DRIVER" | translate
                    }}:</span
                  >
                  <select
                    id="driverSelect"
                    [ngModel]="selectedLaneIndex()"
                    (ngModelChange)="onDriverSelectChange($event)"
                  >
                    @for (
                      d of currentHeatDrivers();
                      track d.laneIndex;
                      let idx = $index
                    ) {
                      <option [value]="idx">
                        {{ "RD_LANE" | translate }} {{ d.laneIndex + 1 }}:
                        {{ d.driver?.name || ("RD_EMPTY_LANE" | translate) }}
                      </option>
                    }
                  </select>
                </div>
              </div>
            }

            <div class="driver-info-panel">
              <div class="info-row">
                <span class="info-label"
                  >{{ "RD_ADD_LAP_SECTIONS_LANE" | translate }}:</span
                >
                <span
                  class="info-value lane-pill"
                  [style.background-color]="resolvedLaneBg()"
                  [style.color]="resolvedLaneFg()"
                >
                  {{ (activeDriverHeatData()?.laneIndex ?? 0) + 1 }}
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
                  activeDriverHeatData()?.driver?.name ||
                    ("RD_EMPTY_LANE" | translate)
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
                #sectionsInputRef
                id="sectionsInput"
                type="number"
                [value]="sectionsInput()"
                (input)="onInputChange($event)"
                (keyup.enter)="onConfirm()"
                placeholder="0"
              />
            </div>

            <div class="result-preview">
              <div class="preview-line">
                <span class="preview-label"
                  >{{ "RD_ADD_LAP_SECTIONS_CURRENT" | translate }}:</span
                >
                <span class="preview-value"
                  >{{ sectionsInput() }} ({{
                    calculatedLaps() | number: "1.2-2"
                  }}
                  {{ "RD_ADD_LAP_SECTIONS_LAPS_REPRESENT" | translate }})</span
                >
              </div>
              @if (isAutoSegments()) {
                <div class="preview-line">
                  <span class="preview-label"
                    >{{
                      "RD_ADD_LAP_SECTIONS_AUTO_SEGMENTS" | translate
                    }}:</span
                  >
                  <span class="preview-value"
                    >{{ autoSegments() }} ({{
                      autoCalculatedLaps() | number: "1.2-2"
                    }}
                    {{
                      "RD_ADD_LAP_SECTIONS_LAPS_REPRESENT" | translate
                    }})</span
                  >
                </div>
              }
            </div>
          }

          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">
              {{ "CANCEL" | translate }}
            </button>
            <button
              class="btn-confirm"
              [disabled]="isMenuMode() && activeHeats().length === 0"
              (click)="onConfirm()"
            >
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
      .menu-selectors-panel {
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
      select {
        background: #090d16;
        border: 1.5px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        outline: none;
        transition: all 0.2s;
        cursor: pointer;
        width: 180px;
      }
      select:focus {
        border-color: #38bdf8;
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
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
      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
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
      .btn-confirm:hover:not([disabled]) {
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
        transform: translateY(-1px);
      }
      .btn-confirm:active:not([disabled]) {
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
  isMenuMode = input<boolean>(false);
  heats = input<any[] | null>(null);
  track = input<any | null>(null);
  currentHeatNumber = input<number>(0);

  confirm = output<any>();
  cancel = output<void>();

  @ViewChild("sectionsInputRef")
  sectionsInputRef?: ElementRef<HTMLInputElement>;

  selectedHeatIndex = signal<number>(0);
  selectedLaneIndex = signal<number>(0);

  sectionsInput = signal<number>(0);

  private editedSectionsMap = new Map<string, number>();

  activeHeats = computed(() => {
    return (this.heats() || []).filter((h) => h.started);
  });

  currentHeatDrivers = computed(() => {
    const heatsList = this.activeHeats();
    if (!heatsList || heatsList.length === 0) return [];
    const hIdx = this.selectedHeatIndex();
    const heat = heatsList[hIdx];
    return heat ? heat.heatDrivers || [] : [];
  });

  activeDriverHeatData = computed(() => {
    if (!this.isMenuMode()) {
      return this.driverHeatData();
    }
    const drivers = this.currentHeatDrivers();
    const lIdx = this.selectedLaneIndex();
    return drivers[lIdx] || null;
  });

  resolvedLaneBg = computed(() => {
    if (!this.isMenuMode()) {
      return this.laneBg();
    }
    const hd = this.activeDriverHeatData();
    const t = this.track();
    if (hd && t && t.lanes && t.lanes[hd.laneIndex]) {
      return t.lanes[hd.laneIndex].background_color || "#334155";
    }
    return "#334155";
  });

  resolvedLaneFg = computed(() => {
    if (!this.isMenuMode()) {
      return this.laneFg();
    }
    const hd = this.activeDriverHeatData();
    const t = this.track();
    if (hd && t && t.lanes && t.lanes[hd.laneIndex]) {
      return t.lanes[hd.laneIndex].foreground_color || "#38bdf8";
    }
    return "#38bdf8";
  });

  autoSegments = computed(() => {
    const hd = this.activeDriverHeatData();
    if (!hd) return 0;
    const divisor = this.numTrackSections() || 100;
    return Math.round((hd.autoCalculatedLaps || 0) * divisor);
  });
  autoCalculatedLaps = computed(() => {
    const hd = this.activeDriverHeatData();
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
        untracked(() => {
          this.editedSectionsMap.clear();
          if (this.isMenuMode()) {
            const startedHeats = this.activeHeats();
            if (startedHeats.length > 0) {
              const currentHeatNum = this.currentHeatNumber();
              const currentHeat = (this.heats() || []).find(
                (h) => h.heatNumber === currentHeatNum,
              );
              const isCurrentHeatStarted = currentHeat?.started === true;

              if (isCurrentHeatStarted) {
                const currentIdx = startedHeats.findIndex(
                  (h) => h.heatNumber === currentHeatNum,
                );
                this.selectedHeatIndex.set(currentIdx >= 0 ? currentIdx : 0);
              } else {
                this.selectedHeatIndex.set(startedHeats.length - 1);
              }
            } else {
              this.selectedHeatIndex.set(0);
            }
            this.selectedLaneIndex.set(0);
          }
          this.loadActiveDriverValue();
          this.focusInput();
        });
      }
    });
  }

  private loadActiveDriverValue() {
    const hd = this.activeDriverHeatData();
    if (!hd) {
      this.sectionsInput.set(0);
      return;
    }
    const heatsList = this.activeHeats();
    const heatNum = this.isMenuMode()
      ? (heatsList[this.selectedHeatIndex()]?.heatNumber ?? 0)
      : this.currentHeatNumber();
    const key = `${heatNum}_${hd.laneIndex}`;
    if (this.editedSectionsMap.has(key)) {
      this.sectionsInput.set(this.editedSectionsMap.get(key)!);
    } else {
      const divisor = this.numTrackSections() || 100;
      this.sectionsInput.set(Math.round((hd.userLaps || 0) * divisor));
    }
  }

  getTeamName(): string | null {
    const hd = this.activeDriverHeatData();
    if (!hd) return null;
    const team = hd.participant?.team || (hd.driver as any)?.team;
    return team ? team.name : null;
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const val = parseInt(target.value, 10);
    const sections = isNaN(val) ? 0 : val;
    this.sectionsInput.set(sections);

    const hd = this.activeDriverHeatData();
    if (hd) {
      const heatsList = this.activeHeats();
      const heatNum = this.isMenuMode()
        ? (heatsList[this.selectedHeatIndex()]?.heatNumber ?? 0)
        : this.currentHeatNumber();
      const key = `${heatNum}_${hd.laneIndex}`;
      this.editedSectionsMap.set(key, sections);
    }
  }

  onHeatSelectChange(idx: number) {
    this.selectedHeatIndex.set(idx);
    this.selectedLaneIndex.set(0);
    this.loadActiveDriverValue();
    this.focusInput();
  }

  onDriverSelectChange(idx: number) {
    this.selectedLaneIndex.set(idx);
    this.loadActiveDriverValue();
    this.focusInput();
  }

  private focusInput() {
    setTimeout(() => {
      this.sectionsInputRef?.nativeElement.focus();
      this.sectionsInputRef?.nativeElement.select();
    }, 0);
  }

  onConfirm() {
    if (this.isMenuMode()) {
      const heatsList = this.activeHeats();
      if (heatsList && heatsList.length > 0) {
        const divisor = this.numTrackSections() || 100;
        const updates = Array.from(this.editedSectionsMap.entries()).map(
          ([key, sections]) => {
            const [heatNumber, laneIndex] = key.split("_").map(Number);
            return {
              heatNumber,
              laneIndex,
              userLaps: sections / divisor,
            };
          },
        );

        if (updates.length === 0) {
          const hd = this.activeDriverHeatData();
          if (hd) {
            const heatNum =
              heatsList[this.selectedHeatIndex()]?.heatNumber ?? 0;
            updates.push({
              heatNumber: heatNum,
              laneIndex: hd.laneIndex,
              userLaps: this.sectionsInput() / divisor,
            });
          }
        }

        if (updates.length > 0) {
          this.confirm.emit({
            isBatch: true,
            updates,
          });
        }
      }
      return;
    }
    this.confirm.emit(this.calculatedLaps());
  }

  onCancel() {
    this.cancel.emit();
  }
}
