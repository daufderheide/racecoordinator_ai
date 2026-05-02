import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";

@Directive({
  standalone: true,
  selector: "[appSvgTextScaler]",
})
export class SvgTextScalerDirective
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() maxWidth: number = 0;
  @Input() scaleToFit: boolean = false;

  constructor(private el: ElementRef<SVGTextElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["maxWidth"] || changes["scaleToFit"] || changes["text"]) {
      this.scaleText();
    }
  }

  ngAfterViewInit(): void {
    this.scaleText();
  }

  private timer: any;
  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private scaleText(): void {
    const textElement = this.el.nativeElement;

    // Reset attributes first
    textElement.removeAttribute("textLength");
    textElement.removeAttribute("lengthAdjust");

    if (!this.scaleToFit || this.maxWidth <= 0) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }
    // We need to wait for the next tick to ensure text content is rendered and measurement is accurate
    // especially if the text is bound via interpolation
    this.timer = setTimeout(() => {
      try {
        const currentLength = (textElement as any).getComputedTextLength();
        if (currentLength > this.maxWidth) {
          textElement.setAttribute("textLength", this.maxWidth.toString());
          textElement.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
      } catch (e) {
        // SVG element might not be rendered or available in some JSDOM/Karma environments
      }
      this.timer = null;
    });
  }
}
