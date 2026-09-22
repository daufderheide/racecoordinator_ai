import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";

import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "./custom-select.component";

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent, FormsModule],
  template: `
    <app-custom-select [(ngModel)]="selectedValue" [disabled]="isDisabled">
      <app-custom-option value="opt1">Option 1</app-custom-option>
      <app-custom-option value="opt2">Option 2</app-custom-option>
      <app-custom-option value="opt3" [disabled]="true"
        >Option 3</app-custom-option
      >
    </app-custom-select>
  `,
})
class TestHostComponent {
  selectedValue: string = "opt1";
  isDisabled: boolean = false;
}

describe("CustomSelectComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let selectComponent: CustomSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const selectEl = fixture.debugElement.children[0];
    selectComponent = selectEl.componentInstance;
  });

  it("should create and initialize with the selected option label", () => {
    selectComponent.updateSelectedLabel();
    expect(selectComponent).toBeTruthy();
    expect(selectComponent.selectedLabel).toBe("Option 1");
  });

  it("should toggle open on trigger click and stop event propagation", () => {
    const mockEvent: any = {
      stopPropagation: jasmine.createSpy("stopPropagation"),
    };
    expect(selectComponent.isOpen).toBeFalse();

    selectComponent.toggleOpen(mockEvent);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(selectComponent.isOpen).toBeTrue();

    selectComponent.toggleOpen(mockEvent);
    expect(selectComponent.isOpen).toBeFalse();
  });

  it("should select option, emit change, and stop event propagation", () => {
    const changeSpy = spyOn(selectComponent.change, "emit");
    const option = selectComponent.customOptions.toArray()[1];
    const mockEvent: any = {
      stopPropagation: jasmine.createSpy("stopPropagation"),
    };

    selectComponent.isOpen = true;
    selectComponent.selectOption(option, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(selectComponent.value()).toBe("opt2");
    expect(selectComponent.selectedLabel).toBe("Option 2");
    expect(changeSpy).toHaveBeenCalledWith("opt2");
    expect(selectComponent.isOpen).toBeFalse();
  });

  it("should close on outside document click", () => {
    selectComponent.isOpen = true;
    const outsideEl = document.createElement("div");
    const mockEvent = { target: outsideEl } as any;

    selectComponent.onDocumentClick(mockEvent);
    expect(selectComponent.isOpen).toBeFalse();
  });

  it("should not toggle when disabled", () => {
    hostComponent.isDisabled = true;
    fixture.detectChanges();
    expect(selectComponent.disabled()).toBeTrue();

    selectComponent.toggleOpen();
    expect(selectComponent.isOpen).toBeFalse();
  });

  it("should reflect open class on host element when toggled open", () => {
    const hostEl = fixture.nativeElement.querySelector("app-custom-select");
    expect(hostEl.classList.contains("open")).toBeFalse();

    selectComponent.toggleOpen();
    fixture.detectChanges();
    expect(hostEl.classList.contains("open")).toBeTrue();

    selectComponent.toggleOpen();
    fixture.detectChanges();
    expect(hostEl.classList.contains("open")).toBeFalse();
  });
});
