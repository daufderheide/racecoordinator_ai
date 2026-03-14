import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { Pipe, PipeTransform } from '@angular/core';
import { ConfirmationModalHarness } from './confirmation-modal.harness';

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
  let harness: ConfirmationModalHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmationModalComponent, MockTranslatePipe]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, ConfirmationModalHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible by default', async () => {
    expect(component.visible).toBeFalse();
    expect(await harness.isVisible()).toBeFalse();
  });

  it('should be visible when visible input is true', async () => {
    component.visible = true;
    expect(await harness.isVisible()).toBeTrue();
  });

  it('should emit cancel event on cancel click', async () => {
    spyOn(component.cancel, 'emit');
    component.visible = true;

    await harness.clickCancel();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit confirm event on confirm click', async () => {
    spyOn(component.confirm, 'emit');
    component.visible = true;

    await harness.clickConfirm();

    expect(component.confirm.emit).toHaveBeenCalled();
  });
});
