import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
    name: 'translate',
    pure: false, // Impure to update when language changes
    standalone: false
})
export class TranslatePipe implements PipeTransform {

    constructor(private translationService: TranslationService) { }

    transform(key: string, params?: { [key: string]: any }): string {
        return this.translationService.translate(key, params);
    }
}
