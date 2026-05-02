import { Component, effect, input, output, signal } from "@angular/core";

import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-input-dialog",
  template: `
    @if (visible()) {
      <div class="modal-backdrop">
        <div class="modal-content">
          <h2 class="modal-title">{{ title() | translate }}</h2>
          @if (message()) {
            <p class="modal-message">
              {{ message() | translate }}
            </p>
          }
          <div class="input-container">
            <input
              [type]="type()"
              [value]="inputValue()"
              (input)="onInputChange($event)"
              [placeholder]="placeholder() | translate"
              (keyup.enter)="onConfirm()"
              autoFocus
            />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">
              {{ cancelText() | translate }}
            </button>
            <button
              class="btn-confirm"
              (click)="onConfirm()"
              [disabled]="isInvalid()"
            >
              {{ confirmText() | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
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
        min-width: 400px;
        border: 1px solid #334155;
      }
      .modal-title {
        margin-top: 0;
        color: #38bdf8;
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
      .modal-message {
        margin-bottom: 1.5rem;
        color: #94a3b8;
      }
      .input-container {
        margin-bottom: 2rem;
      }
      input {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #f1f5f9;
        font-size: 1rem;
        outline: none;
        transition: border-color 0.2s;
      }
      input:focus {
        border-color: #38bdf8;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
      button {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      .btn-cancel {
        background: #334155;
        color: #f1f5f9;
      }
      .btn-cancel:hover {
        background: #475569;
      }
      .btn-confirm {
        background: #38bdf8;
        color: #0f172a;
      }
      .btn-confirm:hover:not(:disabled) {
        background: #7dd3fc;
        transform: translateY(-1px);
      }
      .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
  imports: [TranslatePipe],
})
export class InputDialogComponent {
  visible = input(false);
  title = input("");
  message = input("");
  placeholder = input("");
  initialValue = input<any>("");
  type = input("text");
  min = input<number | null>(null);
  confirmText = input("GEN_OK");
  cancelText = input("AM_BTN_CANCEL");

  confirm = output<any>();
  cancel = output<void>();

  inputValue = signal<any>("");

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.inputValue.set(this.initialValue());
      }
    });
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (this.type() === "number") {
      this.inputValue.set(target.valueAsNumber);
    } else {
      this.inputValue.set(target.value);
    }
  }

  isInvalid(): boolean {
    const minVal = this.min();
    const currentVal = this.inputValue();
    if (this.type() === "number" && minVal !== null) {
      const val =
        typeof currentVal === "string" ? parseFloat(currentVal) : currentVal;
      return val === null || val === undefined || isNaN(val) || val < minVal;
    }
    return false;
  }

  onConfirm() {
    if (this.isInvalid()) {
      return;
    }
    this.confirm.emit(this.inputValue());
  }

  onCancel() {
    this.cancel.emit();
  }
}
