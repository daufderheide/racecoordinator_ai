import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackButtonComponent } from './back-button.component';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';

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

  beforeEach(() => {
    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
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

  it('should set sessionStorage and navigate on back', () => {
    component.route = '/test-route';
    component.queryParams = { foo: 'bar' };

    component.onBack();

    expect(sessionStorage.getItem('skipIntro')).toBe('true');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route'], { queryParams: { foo: 'bar' } });
  });

  it('should show modal if confirm is true', () => {
    component.confirm = true;
    component.onBack();
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
