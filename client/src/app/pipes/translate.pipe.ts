import { Pipe, PipeTransform } from "@angular/core";
import { TranslationService } from "src/app/services/translation.service";

@Pipe({
  standalone: true,
  name: "translate",
  pure: false, // Impure to update when language changes
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string, params?: { [key: string]: any }): string {
    return this.translationService.translate(key, params);
  }
}
