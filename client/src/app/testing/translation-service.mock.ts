import { of, BehaviorSubject } from 'rxjs';

export class TranslationServiceMock {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  private translationsLoadedSubject = new BehaviorSubject<boolean>(true);

  translate = jasmine.createSpy('translate').and.callFake((key: string) => key);
  getCurrentLanguage = jasmine.createSpy('getCurrentLanguage').and.returnValue(this.currentLanguageSubject.asObservable());
  getTranslationsLoaded = jasmine.createSpy('getTranslationsLoaded').and.returnValue(this.translationsLoadedSubject.asObservable());
  getCurrentLanguageValue = jasmine.createSpy('getCurrentLanguageValue').and.returnValue('en');
}
