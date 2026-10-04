import { CommonModule } from "@angular/common";
import {
  Component,
  effect,
  HostListener,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LaneReplicationOptions } from "@app/components/raceday/utils/lane-replication.helper";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  selector: "app-replicate-lane-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
  template: `
    @if (visible()) {
      <div
        id="replicate-lane-modal-backdrop"
        class="modal-backdrop"
        (click)="onBackdropClick($event)"
      >
        <div
          id="replicate-lane-modal-content"
          class="modal-content"
          (click)="$event.stopPropagation()"
        >
          <h2 class="modal-title">
            {{
              (bindingMode() === "position"
                ? "UE_REPLICATE_POSITIONS_TITLE"
                : "UE_REPLICATE_LANES_TITLE"
              ) | translate
            }}
          </h2>
          <p class="modal-message">
            {{
              (bindingMode() === "position"
                ? "UE_REPLICATE_POSITIONS_DESC"
                : "UE_REPLICATE_LANES_DESC"
              ) | translate: { index: sourceIndex() + 1 }
            }}
          </p>

          <div class="form-group">
            <label class="form-label">{{
              "UE_REPLICATE_DIRECTION" | translate
            }}</label>
            <div class="select-container">
              <app-custom-select
                [ngModel]="direction()"
                (ngModelChange)="direction.set($event)"
              >
                <app-custom-option value="horizontal">
                  {{ "UE_REPLICATE_DIR_HORIZONTAL" | translate }}
                </app-custom-option>
                <app-custom-option value="vertical">
                  {{ "UE_REPLICATE_DIR_VERTICAL" | translate }}
                </app-custom-option>
              </app-custom-select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              {{
                (bindingMode() === "position"
                  ? "UE_REPLICATE_TOTAL_POSITIONS"
                  : "UE_REPLICATE_TOTAL_LANES"
                ) | translate
              }}
            </label>
            <div class="select-container">
              <app-custom-select
                [ngModel]="targetCount()"
                (ngModelChange)="targetCount.set(+$event)"
              >
                @for (count of availableCounts; track count) {
                  <app-custom-option [value]="count">
                    {{ count }}
                  </app-custom-option>
                }
              </app-custom-select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{
              "UE_REPLICATE_SPACING_MODE" | translate
            }}</label>
            <div class="select-container">
              <app-custom-select
                [ngModel]="distributionMode()"
                (ngModelChange)="distributionMode.set($event)"
              >
                <app-custom-option value="auto-fit">
                  {{ "UE_REPLICATE_SPACING_AUTOFIT" | translate }}
                </app-custom-option>
                <app-custom-option value="preserve-spacing">
                  {{ "UE_REPLICATE_SPACING_PRESERVE" | translate }}
                </app-custom-option>
              </app-custom-select>
            </div>
          </div>

          <div class="form-check-group">
            <label class="form-check-label">
              <input
                type="checkbox"
                class="form-checkbox"
                [checked]="replaceExisting()"
                (change)="replaceExisting.set(!replaceExisting())"
              />
              <span>{{ "UE_REPLICATE_REPLACE_EXISTING" | translate }}</span>
            </label>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onCancel()"
            >
              {{ "AM_BTN_CANCEL" | translate }}
            </button>
            <button type="button" class="btn btn-primary" (click)="onConfirm()">
              {{ "UE_REPLICATE_BTN_CONFIRM" | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        backdrop-filter: blur(4px);
      }
      .modal-content {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 440px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        color: #f8fafc;
      }
      .modal-title {
        margin: 0 0 8px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
      }
      .modal-message {
        margin: 0 0 20px 0;
        font-size: 0.875rem;
        color: #94a3b8;
        line-height: 1.4;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .form-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #cbd5e1;
        margin-bottom: 6px;
      }
      .select-container {
        width: 100%;
      }
      .form-check-group {
        margin: 16px 0 24px 0;
      }
      .form-check-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: #cbd5e1;
        cursor: pointer;
      }
      .form-checkbox {
        cursor: pointer;
        width: 16px;
        height: 16px;
        accent-color: #3b82f6;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      .btn-secondary {
        background: #334155;
        color: #f8fafc;
      }
      .btn-secondary:hover {
        background: #475569;
      }
      .btn-primary {
        background: #2563eb;
        color: #ffffff;
      }
      .btn-primary:hover {
        background: #1d4ed8;
      }
    `,
  ],
})
export class ReplicateLaneDialogComponent {
  visible = input<boolean>(false);
  sourceIndex = input<number>(0);
  bindingMode = input<"lane" | "position">("lane");
  defaultCount = input<number>(4);

  confirm = output<Omit<LaneReplicationOptions, "baseWidth" | "baseHeight">>();
  cancel = output<void>();

  direction = signal<"horizontal" | "vertical">("horizontal");
  targetCount = signal<number>(4);
  distributionMode = signal<"auto-fit" | "preserve-spacing">("auto-fit");
  replaceExisting = signal<boolean>(true);

  availableCounts = [2, 3, 4, 5, 6, 7, 8];

  constructor() {
    effect(
      () => {
        if (this.visible()) {
          const def = this.defaultCount();
          if (def >= 2 && def <= 8) {
            this.targetCount.set(def);
          }
        }
      },
      { allowSignalWrites: true },
    );
  }

  @HostListener("keydown.escape")
  onEscape() {
    if (this.visible()) {
      this.onCancel();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).id === "replicate-lane-modal-backdrop") {
      this.onCancel();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.confirm.emit({
      direction: this.direction(),
      targetCount: this.targetCount(),
      distributionMode: this.distributionMode(),
      replaceExisting: this.replaceExisting(),
      sourceIndex: this.sourceIndex(),
      sourceBindingMode: this.bindingMode(),
    });
  }
}
