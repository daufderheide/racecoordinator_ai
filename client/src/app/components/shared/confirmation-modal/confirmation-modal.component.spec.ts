import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return `TRANSLATED_${value}`;
  }
}

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmationModalComponent, MockTranslatePipe]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible by default', () => {
    expect(component.visible).toBeFalse();
    const modalContent = fixture.nativeElement.querySelector('.modal-content');
    expect(modalContent).toBeNull();
  });

  it('should be visible when visible input is true', () => {
    component.visible = true;
    fixture.detectChanges();
    const modalContent = fixture.nativeElement.querySelector('.modal-content');
    expect(modalContent).toBeTruthy();
  });

  it('should emit cancel event on cancel click', () => {
    spyOn(component.cancel, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel');
    cancelBtn.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit confirm event on confirm click', () => {
    spyOn(component.confirm, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.btn-confirm');
    confirmBtn.click();

    expect(component.confirm.emit).toHaveBeenCalled();
  });
});
