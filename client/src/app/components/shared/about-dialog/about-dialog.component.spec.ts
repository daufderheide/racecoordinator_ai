import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutDialogComponent } from './about-dialog.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';
import { of } from 'rxjs';

describe('AboutDialogComponent', () => {
  let component: AboutDialogComponent;
  let fixture: ComponentFixture<AboutDialogComponent>;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate', 'getTranslationsLoaded']);
    translationServiceSpy.translate.and.callFake((key: string, params?: any) => {
      if (params && params.version) return `${key}: ${params.version}`;
      return key;
    });
    translationServiceSpy.getTranslationsLoaded.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      declarations: [AboutDialogComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display versions when visible', () => {
    component.visible = true;
    component.clientVersion = '0.0.1';
    component.serverVersion = '1.2.3';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-backdrop')).toBeTruthy();
    const versionInfo = compiled.querySelector('.version-info')?.textContent;
    expect(versionInfo).toContain('0.0.1');
    expect(versionInfo).toContain('1.2.3');
  });

  it('should not be visible when visible is false', () => {
    component.visible = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-backdrop')).toBeFalsy();
  });

  it('should emit close event when close button is clicked', () => {
    spyOn(component.close, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.btn-confirm');
    closeBtn.click();

    expect(component.close.emit).toHaveBeenCalled();
  });
});
