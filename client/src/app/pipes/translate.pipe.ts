import { Pipe, PipeTransform } from "@angular/core";
import { TranslationService } from "@app/services/translation.service";

@Pipe({
  standalone: true,
  name: "translate",
  pure: false, // Impure to update when language changes
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key?: string | null, params?: { [key: string]: any }): string {
    if (!key) {
      return "";
    }
    return this.translationService.translate(key, params);
  }
}
