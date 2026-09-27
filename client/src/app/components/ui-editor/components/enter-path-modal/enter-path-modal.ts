import { CommonModule } from "@angular/common";
import { Component, effect, input, output, signal } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  selector: "app-enter-path-modal",
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (visible()) {
      <div id="enter-path-modal-backdrop" class="modal-backdrop">
        <div id="enter-path-modal-content" class="modal-content">
          <h2 class="modal-title">
            {{ "UE_MODAL_ENTER_PATH_TITLE" | translate }}
          </h2>
          <p class="modal-message">
            {{ "UE_MODAL_ENTER_PATH_MSG" | translate }}
          </p>
          <div class="input-container">
            <input
              type="text"
              class="path-input"
              [value]="pathValue()"
              (input)="onInputChange($event)"
              [placeholder]="'UE_PATH_PLACEHOLDER' | translate"
              (keydown.enter)="onConfirm()"
              autocomplete="off"
              data-dashlane-ignore="true"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
            />
          </div>
          @if (errorMessage(); as err) {
            <p class="error-message">{{ err | translate }}</p>
          }
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="onCancel()">
              {{ "AM_BTN_CANCEL" | translate }}
            </button>
            <button
              class="btn btn-primary"
              (click)="onConfirm()"
              [disabled]="!pathValue().trim()"
            >
              {{ "GEN_OK" | translate }}
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
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        backdrop-filter: blur(4px);
      }
      .modal-content {
        background: #1e293b;
        color: #f1f5f9;
        padding: 2rem;
        border-radius: 12px;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.5),
          0 10px 10px -5px rgba(0, 0, 0, 0.4);
        min-width: 480px;
        max-width: 90vw;
        border: 1px solid #334155;
      }
      .modal-title {
        margin-top: 0;
        color: #38bdf8;
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
      }
      .modal-message {
        margin-bottom: 1.25rem;
        color: #94a3b8;
        font-size: 0.9rem;
      }
      .input-container {
        margin-bottom: 1rem;
      }
      .path-input {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #f1f5f9;
        font-size: 0.95rem;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .path-input:focus {
        border-color: #38bdf8;
      }
      .error-message {
        color: #f87171;
        font-size: 0.85rem;
        margin: -0.5rem 0 1rem 0;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .btn {
        padding: 0.6rem 1.25rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      .btn-secondary {
        background: #334155;
        color: #f1f5f9;
      }
      .btn-secondary:hover {
        background: #475569;
      }
      .btn-primary {
        background: #38bdf8;
        color: #0f172a;
      }
      .btn-primary:hover:not(:disabled) {
        background: #7dd3fc;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class EnterPathModalComponent {
  visible = input(false);
  initialPath = input("");
  errorMessage = input<string | null>(null);

  confirm = output<string>();
  cancel = output<void>();

  pathValue = signal("");

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.pathValue.set(this.initialPath() || "");
      }
    });
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.pathValue.set(target.value);
  }

  onConfirm() {
    const val = this.pathValue().trim();
    if (val) {
      this.confirm.emit(val);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
