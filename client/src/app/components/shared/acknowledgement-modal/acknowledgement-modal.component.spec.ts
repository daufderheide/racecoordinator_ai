import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcknowledgementModalComponent } from './acknowledgement-modal.component';
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

describe('AcknowledgementModalComponent', () => {
  let component: AcknowledgementModalComponent;
  let fixture: ComponentFixture<AcknowledgementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcknowledgementModalComponent, MockTranslatePipe]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcknowledgementModalComponent);
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

  it('should emit acknowledge event on button click', () => {
    spyOn(component.acknowledge, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.btn-confirm');
    confirmBtn.click();

    expect(component.acknowledge.emit).toHaveBeenCalled();
  });
});
