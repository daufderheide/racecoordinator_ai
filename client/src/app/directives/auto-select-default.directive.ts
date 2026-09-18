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

  @HostListener("focus")
  onFocus() {
    if (!this.hasSelectedOnFocus) {
      this.trySelect();
    }
  }

  @HostListener("mouseup")
  onMouseUp() {
    if (!this.hasSelectedOnFocus) {
      this.trySelect();
    }
  }

  @HostListener("blur")
  onBlur() {
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
        if (document.activeElement === inputEl) {
          inputEl.select();
        }
      }, 0);
    }
  }
}
