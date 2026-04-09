import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { TranslationService } from 'src/app/services/translation.service';

import { AboutDialogComponent } from './about-dialog.component';
import { AboutDialogHarness } from './testing/about-dialog.harness';

describe('AboutDialogComponent', () => {
  let component: AboutDialogComponent;
  let fixture: ComponentFixture<AboutDialogComponent>;
  let harness: AboutDialogHarness;
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
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, AboutDialogHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display versions when visible', async () => {
    component.visible = true;
    component.clientVersion = 'TEST-CLIENT-VERSION';
    component.serverVersion = 'TEST-SERVER-VERSION';
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    const versionInfo = await harness.getVersionInfoText();
    expect(versionInfo).toContain('TEST-CLIENT-VERSION');
    expect(versionInfo).toContain('TEST-SERVER-VERSION');
  });

  it('should not be visible when visible is false', async () => {
    component.visible = false;
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeFalse();
  });

  it('should emit close event when close button is clicked', async () => {
    spyOn(component.close, 'emit');
    component.visible = true;
    fixture.detectChanges();

    await harness.clickClose();

    expect(component.close.emit).toHaveBeenCalled();
  });
});