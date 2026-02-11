import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private currentLanguage = new BehaviorSubject<string>('en');
    private translationsLoaded = new BehaviorSubject<boolean>(false);
    private translations: { [key: string]: any } = {};
    private supportedLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it'];

    constructor(private http: HttpClient, private settingsService: SettingsService) {
        // Load from settings if available, otherwise detect browser language
        const settings = this.settingsService.getSettings();
        const language = settings.language || this.getBrowserLanguage();
        this.loadTranslations(language);
    }

    /**
     * Get the browser's language preference
     */
    public getBrowserLanguage(): string {
        // Get browser language (e.g., 'en-US', 'es-ES', 'fr-FR')
        const browserLang = navigator.language || (navigator as any).userLanguage;

        // Extract language code (e.g., 'en' from 'en-US')
        const langCode = browserLang.split('-')[0].toLowerCase();

        // Return the language if supported, otherwise default to English
        return this.supportedLanguages.includes(langCode) ? langCode : 'en';
    }

    /**
     * Load translations for a specific language
     */
    loadTranslations(language: string): void {
        console.log(`TranslationService: Loading translations for ${language}...`);
        this.translationsLoaded.next(false);
        this.http.get(`assets/i18n/${language}.json?t=${Date.now()}`).subscribe({
            next: (data: any) => {
                console.log(`TranslationService: Loaded translations for ${language}:`, data);
                this.translations = data as { [key: string]: any };
                this.currentLanguage.next(language);
                this.translationsLoaded.next(true);
            },
            error: (error: any) => {
                console.error(`Failed to load translations for language: ${language}`, error);
                // Fallback to English if loading fails
                if (language !== 'en') {
                    this.loadTranslations('en');
                }
            }
        });
    }

    /**
     * Get translated text by key
     */
    translate(key: string, params?: { [key: string]: any }): string {
        // TODO(aufderheide): Preload the en translation and use it
        // as a fallback if the selected translation does have
        // the requested key.  If even that doesn't have the key,
        // return the key itself.
        const val = this.translations[key];
        if (val === undefined) {
            // console.warn(`Translation missing for key: ${key}. keys loaded: ${Object.keys(this.translations).length}`);
        }
        let translation = val || key;

        if (params) {
            Object.keys(params).forEach(paramKey => {
                translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
            });
        }

        return translation;
    }

    /**
     * Set the current language
     */
    setLanguage(language: string): void {
        this.loadTranslations(language);
    }

    /**
     * Get the current language as an observable
     */
    getCurrentLanguage(): Observable<string> {
        return this.currentLanguage.asObservable();
    }

    /**
     * Get the translations loaded state as an observable
     */
    getTranslationsLoaded(): Observable<boolean> {
        return this.translationsLoaded.asObservable();
    }

    /**
     * Get the current language value
     */
    getCurrentLanguageValue(): string {
        return this.currentLanguage.value;
    }

    /**
     * Get list of supported languages for UI
     */
    getSupportedLanguages(): { code: string, nameKey: string }[] {
        return this.supportedLanguages.map(code => ({
            code,
            nameKey: `RDS_LANG_${code.toUpperCase()}`
        }));
    }
}
