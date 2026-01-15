import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private currentLanguage = new BehaviorSubject<string>('en');
    private translations: { [key: string]: any } = {};
    private supportedLanguages = ['en', 'es', 'fr', 'de', 'pt'];

    constructor(private http: HttpClient) {
        // Automatically detect and load browser language
        const browserLang = this.getBrowserLanguage();
        this.loadTranslations(browserLang);
    }

    /**
     * Get the browser's language preference
     */
    private getBrowserLanguage(): string {
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
        this.http.get(`assets/i18n/${language}.json`).subscribe({
            next: (data) => {
                this.translations = data as { [key: string]: any };
                this.currentLanguage.next(language);
            },
            error: (error) => {
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
    translate(key: string): string {
        return this.translations[key] || key;
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
     * Get the current language value
     */
    getCurrentLanguageValue(): string {
        return this.currentLanguage.value;
    }
}
