import { Component, Pipe, PipeTransform } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "./custom-select.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-custom-select [value]="val">
      <app-custom-option value="opt1" separator>Option 1</app-custom-option>
      <app-custom-option value="opt2">Option 2</app-custom-option>
      <app-custom-option value="opt3" divider>Option 3</app-custom-option>
      <app-custom-option value="opt4">Option 4</app-custom-option>
    </app-custom-select>
  `,
})
class TestHostComponent {
  val = "opt1";
}

describe("CustomSelectComponent", () => {
  let component: CustomSelectComponent;
  let fixture: ComponentFixture<CustomSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSelectComponent, MockTranslatePipe, TestHostComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open and close dropdown", () => {
    expect(component.isOpen).toBeFalse();
    component.toggleOpen();
    expect(component.isOpen).toBeTrue();
    component.toggleOpen();
    expect(component.isOpen).toBeFalse();
  });

  it("should update value and attribute when value property is set", () => {
    fixture.componentRef.setInput("value", "test-val");
    fixture.detectChanges();
    expect(component.value()).toBe("test-val");
    expect(fixture.nativeElement.getAttribute("data-value")).toBe("test-val");

    component.value.set(undefined);
    fixture.detectChanges();
    expect(component.value()).toBeUndefined();
    expect(fixture.nativeElement.hasAttribute("data-value")).toBeFalse();
  });

  it("should support writeValue from ControlValueAccessor", () => {
    component.writeValue("cva-val");
    fixture.detectChanges();
    expect(component.value()).toBe("cva-val");
    expect(fixture.nativeElement.getAttribute("data-value")).toBe("cva-val");
  });

  it("should render separators when options have separator or divider inputs", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const separators = hostElement.querySelectorAll(".custom-select-separator");
    expect(separators.length).toBe(2);

    const options = hostElement.querySelectorAll(".custom-select-option");
    expect(options.length).toBe(4);
  });

  it("should update selectedLabel dynamically when option label text changes", () => {
    const hostFixture = TestBed.createComponent(DynamicLabelTestHostComponent);
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    const hostElement = hostFixture.nativeElement as HTMLElement;

    expect(select.selectedLabel).toBe("Original Label");
    expect(
      hostElement.querySelector(".selected-text")?.textContent?.trim(),
    ).toBe("Original Label");

    hostFixture.componentInstance.opt1Label = "Renamed Layout";
    hostFixture.detectChanges();

    expect(select.selectedLabel).toBe("Renamed Layout");
    expect(
      hostElement.querySelector(".selected-text")?.textContent?.trim(),
    ).toBe("Renamed Layout");

    select.toggleOpen();
    hostFixture.detectChanges();

    const optionEl = hostElement.querySelector(
      '.custom-select-option[data-value="opt1"]',
    );
    expect(optionEl?.textContent?.trim()).toBe("Renamed Layout");
    expect(
      hostElement.querySelector(".selected-text")?.getAttribute("title"),
    ).toBe("Renamed Layout");
  });

  it("should set title attribute on .selected-text matching selectedLabel", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const selectedTextEl = hostElement.querySelector(".selected-text");
    expect(selectedTextEl?.getAttribute("title")).toBe("Option 1");
  });

  it("should invoke scrollToSelectedOption on toggleOpen", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    const scrollSpy = spyOn(select, "scrollToSelectedOption");

    select.toggleOpen();
    expect(scrollSpy).toHaveBeenCalled();
  });

  it("should fallback to scrollIntoView when dropdown clientHeight is 0", fakeAsync(() => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const dropdown = hostElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    const selectedEl = hostElement.querySelector(
      ".custom-select-option.selected",
    ) as HTMLElement;

    Object.defineProperty(dropdown, "clientHeight", {
      value: 0,
      configurable: true,
    });
    const scrollIntoViewSpy = spyOn(selectedEl, "scrollIntoView");

    select.scrollToSelectedOption();
    tick(10);

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ block: "nearest" });
  }));

  it("should center selected option when dropdown has clientHeight > 0", fakeAsync(() => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const dropdown = hostElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    const selectedEl = hostElement.querySelector(
      ".custom-select-option.selected",
    ) as HTMLElement;

    let assignedScrollTop = 0;
    Object.defineProperty(dropdown, "scrollTop", {
      get: () => assignedScrollTop,
      set: (val: number) => {
        assignedScrollTop = val;
      },
      configurable: true,
    });
    Object.defineProperty(dropdown, "clientHeight", {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(selectedEl, "offsetTop", {
      value: 350,
      configurable: true,
    });
    Object.defineProperty(selectedEl, "offsetHeight", {
      value: 40,
      configurable: true,
    });

    select.scrollToSelectedOption();
    tick(10);

    // targetScroll = 350 - 200/2 + 40/2 = 350 - 100 + 20 = 270
    expect(assignedScrollTop).toBe(270);
  }));

  it("should not scroll if closed before timer executes", fakeAsync(() => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const dropdown = hostElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    const selectedEl = hostElement.querySelector(
      ".custom-select-option.selected",
    ) as HTMLElement;

    Object.defineProperty(dropdown, "clientHeight", {
      value: 0,
      configurable: true,
    });
    const scrollIntoViewSpy = spyOn(selectedEl, "scrollIntoView");

    select.isOpen = false;
    tick(10);

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  }));
});

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-custom-select [value]="val">
      <app-custom-option value="opt1">{{ opt1Label }}</app-custom-option>
      <app-custom-option value="opt2">Option 2</app-custom-option>
    </app-custom-select>
  `,
})
class DynamicLabelTestHostComponent {
  val = "opt1";
  opt1Label = "Original Label";
}
