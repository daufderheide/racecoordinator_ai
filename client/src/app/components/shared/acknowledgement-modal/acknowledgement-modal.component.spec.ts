import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AcknowledgementModalComponent } from './acknowledgement-modal.component';
import { Pipe, PipeTransform } from '@angular/core';
import { AcknowledgementModalHarness } from './testing/acknowledgement-modal.harness';

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
  let harness: AcknowledgementModalHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcknowledgementModalComponent, MockTranslatePipe]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AcknowledgementModalComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, AcknowledgementModalHarness);
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
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeTrue();
  });

  it('should emit acknowledge event on button click', async () => {
    spyOn(component.acknowledge, 'emit');
    component.visible = true;
    fixture.detectChanges();

    await harness.clickAcknowledge();

    expect(component.acknowledge.emit).toHaveBeenCalled();
  });
});
