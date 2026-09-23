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
  readonly change = output<any>();

  @ContentChildren(CustomOptionComponent)
  customOptions!: QueryList<CustomOptionComponent>;

  isOpen = false;
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
      this.onTouch();
      this.updateSelectedLabel();
      this.scrollToSelectedOption();
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

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
