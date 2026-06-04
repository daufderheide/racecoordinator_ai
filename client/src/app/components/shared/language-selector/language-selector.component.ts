import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  input,
  OnInit,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  selector: "app-language-selector",
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: "./language-selector.component.html",
  styleUrl: "./language-selector.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class LanguageSelectorComponent implements OnInit {
  wrapperClass = input<string>("menu-item");
  itemClass = input<string>("menu-item");
  languageSelected = output<string>();

  supportedLanguages: { code: string; nameKey: string }[] = [];
  currentLanguage: string = "";
  isLocalizationDropdownOpen = false;

  constructor(
    private translationService: TranslationService,
    private settingsService: SettingsService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.supportedLanguages = this.translationService
      .getSupportedLanguages()
      .sort((a, b) => {
        const nameA = this.translationService.getLanguageDisplayName(a.code);
        const nameB = this.translationService.getLanguageDisplayName(b.code);
        return nameA.localeCompare(nameB);
      });
    this.currentLanguage = this.settingsService.getSettings().language || "";
  }

  toggleLocalizationDropdown(event: Event) {
    event.stopPropagation();
    this.isLocalizationDropdownOpen = !this.isLocalizationDropdownOpen;
    this.cdr.markForCheck();
  }

  selectLanguage(code: string) {
    this.translationService.selectLanguage(code);
    this.currentLanguage = code;
    this.isLocalizationDropdownOpen = false;
    this.languageSelected.emit(code);
    this.cdr.markForCheck();
  }

  getLanguageDisplayName(code: string): string {
    return this.translationService.getLanguageDisplayName(code);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isLocalizationDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }
}
