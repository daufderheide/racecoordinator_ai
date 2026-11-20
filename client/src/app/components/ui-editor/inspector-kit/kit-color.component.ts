import { Component, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { toValidHexColor } from "@app/utils/widget-border.utils";

/** Colours offered as one click: RC AI yellow, white, black, timer green. */
export const QUICK_COLORS = ["#e9c507", "#ffffff", "#000000", "#32cd32"];

/**
 * Swatch + hex + quick colours + "theme default" (empty value).
 * An empty value means the widget's theme colour is used.
 */
@Component({
  standalone: true,
  selector: "app-kit-color",
  imports: [TranslatePipe],
  template: `
    <div class="kit-color">
      <label
        class="kit-swatch"
        [class.is-empty]="!value()"
        [title]="'UE_KIT_PICK_COLOR' | translate"
      >
        <i [style.background]="value() || 'transparent'"></i>
        <input
          type="color"
          [id]="inputId()"
          [value]="pickerValue()"
          [attr.aria-label]="ariaLabel()"
          (change)="onPicked($event)"
        />
      </label>
      <span class="kit-hex" [class.is-default]="!value()">{{
        value() ? value()!.toUpperCase() : ("UE_KIT_THEME_DEFAULT" | translate)
      }}</span>
      <span class="kit-quick">
        @for (c of quick; track c) {
          <button
            type="button"
            class="kit-quick-btn"
            [style.background]="c"
            [title]="c"
            [attr.aria-pressed]="value()?.toLowerCase() === c"
            (click)="valueChange.emit(c)"
          ></button>
        }
        <button
          type="button"
          class="kit-quick-btn kit-quick-default"
          [title]="'UE_KIT_THEME_DEFAULT' | translate"
          [attr.aria-pressed]="!value()"
          (click)="valueChange.emit('')"
        ></button>
      </span>
    </div>
  `,
})
export class KitColorComponent {
  value = input<string | null | undefined>("");
  /** Shown in the native picker when the value is empty. */
  placeholder = input("#ffffff");
  inputId = input("");
  ariaLabel = input("");
  valueChange = output<string>();
  readonly quick = QUICK_COLORS;

  pickerValue(): string {
    return toValidHexColor(this.value() || this.placeholder(), "#ffffff");
  }

  onPicked(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
