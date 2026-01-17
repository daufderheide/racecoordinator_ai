import { Directive, ElementRef, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';

@Directive({
    selector: '[appSvgTextScaler]',
    standalone: false
})
export class SvgTextScalerDirective implements OnChanges, AfterViewInit {
    @Input() maxWidth: number = 0;
    @Input() scaleToFit: boolean = false;

    constructor(private el: ElementRef<SVGTextElement>) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['maxWidth'] || changes['scaleToFit'] || changes['text']) {
            this.scaleText();
        }
    }

    ngAfterViewInit(): void {
        this.scaleText();
    }

    private scaleText(): void {
        const textElement = this.el.nativeElement;

        // Reset attributes first
        textElement.removeAttribute('textLength');
        textElement.removeAttribute('lengthAdjust');

        if (!this.scaleToFit || this.maxWidth <= 0) {
            return;
        }

        // We need to wait for the next tick to ensure text content is rendered and measurement is accurate
        // especially if the text is bound via interpolation
        setTimeout(() => {
            try {
                const currentLength = textElement.getComputedTextLength();
                if (currentLength > this.maxWidth) {
                    textElement.setAttribute('textLength', this.maxWidth.toString());
                    textElement.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                }
            } catch (e) {
                console.warn('SvgTextScalerDirective: Error measuring text length', e);
            }
        });
    }
}
