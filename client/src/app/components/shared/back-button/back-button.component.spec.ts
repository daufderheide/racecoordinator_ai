import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { BackButtonComponent } from './back-button.component';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { BackButtonHarness } from './back-button.harness';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let harness: BackButtonHarness;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [BackButtonComponent, MockTranslatePipe],
      providers: [
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, BackButtonHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default inputs', () => {
    expect(component.label).toBe('BACK');
    expect(component.route).toBe('/raceday-setup');
    expect(component.queryParams).toEqual({});
  });

  it('should set sessionStorage and navigate on back', async () => {
    component.route = '/test-route';
    component.queryParams = { foo: 'bar' };
    fixture.detectChanges();

    await harness.click();

    expect(sessionStorage.getItem('skipIntro')).toBe('true');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route'], { queryParams: { foo: 'bar' } });
  });

  it('should show modal if confirm is true', async () => {
    component.confirm = true;
    fixture.detectChanges();
    
    await harness.click();
    
    expect(component.showModal).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate on modal confirm', () => {
    component.route = '/test-route';
    component.onModalConfirm();
    expect(component.showModal).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route'], { queryParams: {} });
  });

  it('should hide modal on modal cancel', () => {
    component.showModal = true;
    component.onModalCancel();
    expect(component.showModal).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
