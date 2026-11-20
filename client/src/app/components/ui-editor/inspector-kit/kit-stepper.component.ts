import { Component, input, output } from "@angular/core";

/** − value unit + : a number with buttons, kept inside min..max. */
@Component({
  standalone: true,
  selector: "app-kit-stepper",
  template: `
    <div class="kit-stepper" [class.disabled]="disabled()">
      <button
        type="button"
        class="kit-step-btn"
        [disabled]="disabled() || (value() ?? 0) <= min()"
        (click)="nudge(-1)"
        [attr.aria-label]="lessLabel()"
      >
        <span class="material-icons">remove</span>
      </button>
      <input
        type="number"
        class="kit-step-input"
        [id]="inputId()"
        [value]="value() ?? ''"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel()"
        (change)="onTyped($event)"
        (keydown.enter)="$any($event.target).blur()"
        autocomplete="off"
        data-dashlane-ignore="true"
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
      />
      @if (unit()) {
        <span class="kit-step-unit">{{ unit() }}</span>
      }
      <button
        type="button"
        class="kit-step-btn"
        [disabled]="disabled() || (value() ?? 0) >= max()"
        (click)="nudge(1)"
        [attr.aria-label]="moreLabel()"
      >
        <span class="material-icons">add</span>
      </button>
    </div>
  `,
})
export class KitStepperComponent {
  value = input<number | null | undefined>(0);
  min = input(0);
  max = input(100);
  step = input(1);
  unit = input("");
  disabled = input(false);
  inputId = input("");
  ariaLabel = input("");
  lessLabel = input("−");
  moreLabel = input("+");
  valueChange = output<number>();

  clamp(v: number): number {
    if (isNaN(v)) return this.value() ?? this.min();
    return Math.min(this.max(), Math.max(this.min(), v));
  }

  nudge(direction: number): void {
    const next = this.clamp((this.value() ?? 0) + direction * this.step());
    this.valueChange.emit(Math.round(next * 100) / 100);
  }

  onTyped(event: Event): void {
    const el = event.target as HTMLInputElement;
    const next = this.clamp(Number(el.value));
    el.value = String(next);
    this.valueChange.emit(next);
  }
}
