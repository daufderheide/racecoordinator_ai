import { computed, Directive, input } from "@angular/core";

/**
 * Text style per widget part, set in the redesigned Widget Configuration
 * panel: weight, letter spacing and case. Put it on the element that already
 * gets the part's font family:
 *
 *   <span [appPartTextStyle]="widget()?.customSettings" partPrefix="header">
 *
 * It reads `<prefix>FontWeight` ("normal" | "bold"), `<prefix>LetterSpacing`
 * (px) and `<prefix>TextTransform` ("none" | "uppercase"). A setting that
 * isn't stored adds nothing, so the part keeps the look its own CSS gives it.
 */
@Directive({
  selector: "[appPartTextStyle]",
  standalone: true,
  host: {
    "[style.font-weight]": "weight()",
    "[style.letter-spacing]": "spacing()",
    "[style.text-transform]": "transform()",
  },
})
export class PartTextStyleDirective {
  appPartTextStyle = input<Record<string, any> | null | undefined>(null);
  partPrefix = input.required<string>();

  private value(suffix: string): any {
    const v = this.appPartTextStyle()?.[`${this.partPrefix()}${suffix}`];
    return v === undefined || v === null || v === "" ? null : v;
  }

  weight = computed(() => {
    const v = this.value("FontWeight");
    return v === "bold" || v === "normal" ? v : null;
  });

  spacing = computed(() => {
    const v = this.value("LetterSpacing");
    const n = Number(v);
    return v === null || isNaN(n) ? null : `${n}px`;
  });

  transform = computed(() => {
    const v = this.value("TextTransform");
    return v === "uppercase" || v === "none" ? v : null;
  });
}
