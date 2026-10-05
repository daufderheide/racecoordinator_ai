import {
  AfterContentChecked,
  AfterContentInit,
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  model,
  output,
  QueryList,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
  standalone: true,
  selector: "app-custom-option",
  template: `<ng-content></ng-content>`,
})
export class CustomOptionComponent {
  value = input<any>(undefined);
  disabled = input<boolean>(false);
  separator = input(false, { transform: booleanAttribute });
  divider = input(false, { transform: booleanAttribute });
  constructor(public elementRef: ElementRef<HTMLElement>) {}

  get hasSeparator(): boolean {
    return this.separator() || this.divider();
  }

  get label(): string {
    return this.elementRef.nativeElement.textContent?.trim() || "";
  }

  get text(): string {
    return this.label;
  }
}

@Component({
  standalone: true,
  selector: "app-custom-select",
  templateUrl: "./custom-select.component.html",
  styleUrls: ["./custom-select.component.css"],
  host: {
    "[attr.id]": "id()",
    "[attr.data-value]": "value()",
    "[class.open]": "isOpen",
    "[attr.data-open]": "isOpen",
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent
  implements ControlValueAccessor, AfterContentInit, AfterContentChecked
{
  id = input<string>("");
  disabled = input(false);
  compareWith = input<(o1: any, o2: any) => boolean>(
    (o1: any, o2: any) => o1 === o2,
  );
  extendToPageBottom = input(false, { transform: booleanAttribute });
  maxDropdownHeight = input<number | string | undefined>(undefined);
  readonly change = output<any>();

  @ContentChildren(CustomOptionComponent)
  customOptions!: QueryList<CustomOptionComponent>;

  isOpen = false;
  openUpward = false;
  openRightAligned = false;
  calculatedMaxHeight: string | null = null;
  value = model<any>(undefined);
  selectedLabel: string = "";

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      this.value();
      this.updateSelectedLabel();
    });
  }

  ngAfterContentInit() {
    this.updateSelectedLabel();
    this.customOptions.changes.subscribe(() => {
      this.updateSelectedLabel();
      if (this.isOpen) {
        if (this.extendToPageBottom()) {
          this.checkDropdownPosition();
        }
        this.scrollToSelectedOption();
      }
    });
  }

  ngAfterContentChecked() {
    this.updateSelectedLabel();
  }

  isSelected(optValue: any): boolean {
    const fn = this.compareWith() || ((o1: any, o2: any) => o1 === o2);
    return fn(optValue, this.value());
  }

  updateSelectedLabel() {
    if (!this.customOptions) return;
    const selected = this.customOptions.find((opt) =>
      this.isSelected(opt.value()),
    );
    const newLabel = selected ? selected.label : "";
    if (this.selectedLabel !== newLabel) {
      this.selectedLabel = newLabel;
      this.cdr.markForCheck();
    }
  }

  writeValue(val: any): void {
    this.value.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}

  toggleOpen() {
    if (this.disabled()) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.checkDropdownPosition();
      this.onTouch();
      this.updateSelectedLabel();
      this.scrollToSelectedOption();
    }
  }

  private checkDropdownPosition(): void {
    try {
      const el = this.elementRef.nativeElement as HTMLElement;
      const rect = el.getBoundingClientRect();
      const defaultDropdownHeight = 250;
      const innerHeight =
        typeof window !== "undefined" && window.innerHeight > 0
          ? window.innerHeight
          : 768;
      const innerWidth =
        typeof window !== "undefined" && window.innerWidth > 0
          ? window.innerWidth
          : 1024;
      const spaceBelow = innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const threshold = this.extendToPageBottom() ? 200 : defaultDropdownHeight;
      this.openUpward = spaceBelow < threshold && spaceAbove > spaceBelow;
      this.openRightAligned = rect.left + 350 > innerWidth;

      if (this.extendToPageBottom()) {
        const bottomPadding = 16;
        const availableHeight = this.openUpward
          ? Math.max(100, Math.floor(spaceAbove - bottomPadding))
          : Math.max(100, Math.floor(spaceBelow - bottomPadding));
        this.calculatedMaxHeight = `${availableHeight}px`;
      } else if (
        this.maxDropdownHeight() !== undefined &&
        this.maxDropdownHeight() !== null
      ) {
        const mh = this.maxDropdownHeight();
        this.calculatedMaxHeight = typeof mh === "number" ? `${mh}px` : `${mh}`;
      } else {
        this.calculatedMaxHeight = null;
      }
    } catch {
      this.openUpward = false;
      this.openRightAligned = false;
      this.calculatedMaxHeight = null;
    }
  }

  scrollToSelectedOption(): void {
    setTimeout(() => {
      if (!this.isOpen) return;
      const dropdown = this.elementRef.nativeElement.querySelector(
        ".custom-select-dropdown",
      ) as HTMLElement | null;
      const selectedEl = dropdown?.querySelector(
        ".custom-select-option.selected",
      ) as HTMLElement | null;

      if (!dropdown || !selectedEl) return;

      const doScroll = () => {
        if (!this.isOpen) return;
        if (
          dropdown.clientHeight > 0 &&
          dropdown.scrollHeight > dropdown.clientHeight
        ) {
          const targetScroll =
            selectedEl.offsetTop -
            dropdown.clientHeight / 2 +
            selectedEl.offsetHeight / 2;
          dropdown.scrollTop = Math.max(0, targetScroll);
        }
      };

      if (dropdown.clientHeight > 0) {
        doScroll();
      } else {
        requestAnimationFrame(() => doScroll());
      }
    }, 0);
  }

  selectOption(option: CustomOptionComponent, event: Event) {
    event.stopPropagation();
    this.value.set(option.value());
    this.selectedLabel = option.label;
    this.onChange(this.value());
    this.change.emit(this.value());
    this.isOpen = false;
  }

  @HostListener("window:resize")
  onWindowResize() {
    if (this.isOpen) {
      this.checkDropdownPosition();
      this.cdr.markForCheck();
    }
  }

  @HostListener("window:scroll")
  onWindowScroll() {
    if (this.isOpen && this.extendToPageBottom()) {
      this.checkDropdownPosition();
      this.cdr.markForCheck();
    }
  }

  @HostListener("keydown.escape")
  onEscape() {
    if (this.isOpen) {
      this.isOpen = false;
    }
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
