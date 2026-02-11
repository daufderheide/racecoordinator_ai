import { of, BehaviorSubject } from 'rxjs';

export class TranslationServiceMock {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  private translationsLoadedSubject = new BehaviorSubject<boolean>(true);

  translate = jasmine.createSpy('translate').and.callFake((key: string) => key);
  getCurrentLanguage = jasmine.createSpy('getCurrentLanguage').and.returnValue(this.currentLanguageSubject.asObservable());
  getTranslationsLoaded = jasmine.createSpy('getTranslationsLoaded').and.returnValue(this.translationsLoadedSubject.asObservable());
  getCurrentLanguageValue = jasmine.createSpy('getCurrentLanguageValue').and.returnValue('en');
  setLanguage = jasmine.createSpy('setLanguage');
  getBrowserLanguage = jasmine.createSpy('getBrowserLanguage').and.returnValue('en');
  getSupportedLanguages = jasmine.createSpy('getSupportedLanguages').and.returnValue([
    { code: 'en', nameKey: 'RDS_LANG_EN' },
    { code: 'es', nameKey: 'RDS_LANG_ES' },
    { code: 'fr', nameKey: 'RDS_LANG_FR' },
    { code: 'de', nameKey: 'RDS_LANG_DE' },
    { code: 'pt', nameKey: 'RDS_LANG_PT' },
    { code: 'it', nameKey: 'RDS_LANG_IT' }
  ]);
}
