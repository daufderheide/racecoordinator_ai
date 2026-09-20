import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
} from "@angular/core";

@Directive({
  standalone: true,
  selector: "input[appAutoSelectDefault]",
})
export class AutoSelectDefaultDirective {
  /**
   * The initial/default value that was assigned to this field.
   * If the current input value matches this default value, focusing or clicking
   * into the input will select all text so the user can immediately overwrite it.
   */
  defaultVal = input<string | undefined>(undefined, {
    alias: "appAutoSelectDefault",
  });

  private el = inject(ElementRef<HTMLInputElement>);
  private hasSelectedOnFocus = false;

  private isFocused = false;

  @HostListener("focus")
  onFocus() {
    this.isFocused = true;
    if (!this.hasSelectedOnFocus) {
      this.trySelect();
    }
  }

  @HostListener("mouseup")
  onMouseUp() {
    this.isFocused = true;
    if (!this.hasSelectedOnFocus) {
      this.trySelect();
    }
  }

  @HostListener("blur")
  onBlur() {
    this.isFocused = false;
    this.hasSelectedOnFocus = false;
  }

  private trySelect() {
    const inputEl = this.el.nativeElement;
    if (!inputEl) return;
    const currentVal = inputEl.value;
    const def = this.defaultVal();

    if (
      def !== undefined &&
      def !== null &&
      def.length > 0 &&
      currentVal === def
    ) {
      this.hasSelectedOnFocus = true;
      setTimeout(() => {
        if (this.isFocused || document.activeElement === inputEl) {
          inputEl.select();
        }
      }, 0);
    }
  }
}
